-- Distributed API rate limiting for multi-instance deployments.

CREATE TABLE IF NOT EXISTS public.api_rate_limit_counters (
  bucket TEXT NOT NULL,
  subject_key TEXT NOT NULL,
  window_start TIMESTAMPTZ NOT NULL,
  requests_count INTEGER NOT NULL DEFAULT 0 CHECK (requests_count >= 0),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (bucket, subject_key, window_start)
);

CREATE INDEX IF NOT EXISTS idx_api_rate_limit_counters_updated_at
  ON public.api_rate_limit_counters(updated_at);

COMMENT ON TABLE public.api_rate_limit_counters IS
  'Distributed counters for API rate limiting windows across instances';

CREATE OR REPLACE FUNCTION public.enforce_api_rate_limit(
  p_bucket TEXT,
  p_subject TEXT,
  p_limit INTEGER,
  p_window_seconds INTEGER
)
RETURNS TABLE (
  allowed BOOLEAN,
  current_count INTEGER,
  retry_after_seconds INTEGER,
  window_start TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_catalog
AS $$
DECLARE
  now_ts TIMESTAMPTZ := NOW();
  window_started_at TIMESTAMPTZ;
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

  window_started_at := to_timestamp(
    floor(extract(epoch FROM now_ts) / p_window_seconds) * p_window_seconds
  );
  window_ends_at := window_started_at + make_interval(secs => p_window_seconds);

  INSERT INTO public.api_rate_limit_counters (
    bucket,
    subject_key,
    window_start,
    requests_count,
    updated_at
  )
  VALUES (
    p_bucket,
    p_subject,
    window_started_at,
    1,
    now_ts
  )
  ON CONFLICT (bucket, subject_key, window_start)
  DO UPDATE
    SET requests_count = public.api_rate_limit_counters.requests_count + 1,
        updated_at = EXCLUDED.updated_at
  RETURNING requests_count INTO next_count;

  is_allowed := next_count <= p_limit;
  retry_seconds := CASE
    WHEN is_allowed THEN 0
    ELSE GREATEST(1, CEIL(EXTRACT(EPOCH FROM (window_ends_at - now_ts)))::INTEGER)
  END;

  -- Opportunistic cleanup to keep this table compact.
  IF random() < 0.01 THEN
    DELETE FROM public.api_rate_limit_counters
    WHERE updated_at < now_ts - INTERVAL '2 days';
  END IF;

  RETURN QUERY
  SELECT
    is_allowed,
    next_count,
    retry_seconds,
    window_started_at;
END;
$$;

REVOKE ALL ON TABLE public.api_rate_limit_counters FROM PUBLIC;
REVOKE ALL ON TABLE public.api_rate_limit_counters FROM anon;
REVOKE ALL ON TABLE public.api_rate_limit_counters FROM authenticated;

GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.api_rate_limit_counters TO service_role;

REVOKE ALL ON FUNCTION public.enforce_api_rate_limit(TEXT, TEXT, INTEGER, INTEGER) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.enforce_api_rate_limit(TEXT, TEXT, INTEGER, INTEGER) FROM anon;
REVOKE ALL ON FUNCTION public.enforce_api_rate_limit(TEXT, TEXT, INTEGER, INTEGER) FROM authenticated;
GRANT EXECUTE ON FUNCTION public.enforce_api_rate_limit(TEXT, TEXT, INTEGER, INTEGER) TO service_role;
