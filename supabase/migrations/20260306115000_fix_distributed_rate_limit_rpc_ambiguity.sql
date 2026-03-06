-- Fix ambiguous column reference in distributed API rate-limit RPC.
DROP FUNCTION IF EXISTS public.enforce_api_rate_limit(TEXT, TEXT, INTEGER, INTEGER);

CREATE FUNCTION public.enforce_api_rate_limit(
  p_bucket TEXT,
  p_subject TEXT,
  p_limit INTEGER,
  p_window_seconds INTEGER
)
RETURNS TABLE (
  allowed BOOLEAN,
  current_count INTEGER,
  retry_after_seconds INTEGER,
  window_started_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_catalog
AS $$
DECLARE
  now_ts TIMESTAMPTZ := NOW();
  calculated_window_start TIMESTAMPTZ;
  window_ends_at TIMESTAMPTZ;
  next_count INTEGER;
  is_allowed BOOLEAN;
  retry_seconds INTEGER;
BEGIN
  IF COALESCE(BTRIM(p_bucket), '') = '' THEN
    RAISE EXCEPTION 'p_bucket is required';
  END IF;

  IF COALESCE(BTRIM(p_subject), '') = '' THEN
    RAISE EXCEPTION 'p_subject is required';
  END IF;

  IF p_limit IS NULL OR p_limit <= 0 THEN
    RAISE EXCEPTION 'p_limit must be > 0';
  END IF;

  IF p_window_seconds IS NULL OR p_window_seconds <= 0 THEN
    RAISE EXCEPTION 'p_window_seconds must be > 0';
  END IF;

  calculated_window_start := to_timestamp(
    floor(extract(epoch FROM now_ts) / p_window_seconds) * p_window_seconds
  );
  window_ends_at := calculated_window_start + make_interval(secs => p_window_seconds);

  INSERT INTO public.api_rate_limit_counters AS arc (
    bucket,
    subject_key,
    window_start,
    requests_count,
    updated_at
  )
  VALUES (
    p_bucket,
    p_subject,
    calculated_window_start,
    1,
    now_ts
  )
  ON CONFLICT (bucket, subject_key, window_start)
  DO UPDATE
    SET requests_count = arc.requests_count + 1,
        updated_at = EXCLUDED.updated_at
  RETURNING arc.requests_count INTO next_count;

  is_allowed := next_count <= p_limit;
  retry_seconds := CASE
    WHEN is_allowed THEN 0
    ELSE GREATEST(1, CEIL(EXTRACT(EPOCH FROM (window_ends_at - now_ts)))::INTEGER)
  END;

  IF random() < 0.01 THEN
    DELETE FROM public.api_rate_limit_counters
    WHERE updated_at < now_ts - INTERVAL '2 days';
  END IF;

  RETURN QUERY
  SELECT
    is_allowed,
    next_count,
    retry_seconds,
    calculated_window_start;
END;
$$;

REVOKE ALL ON FUNCTION public.enforce_api_rate_limit(TEXT, TEXT, INTEGER, INTEGER) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.enforce_api_rate_limit(TEXT, TEXT, INTEGER, INTEGER) FROM anon;
REVOKE ALL ON FUNCTION public.enforce_api_rate_limit(TEXT, TEXT, INTEGER, INTEGER) FROM authenticated;
GRANT EXECUTE ON FUNCTION public.enforce_api_rate_limit(TEXT, TEXT, INTEGER, INTEGER) TO service_role;
