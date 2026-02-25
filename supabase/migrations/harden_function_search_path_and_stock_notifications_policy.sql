-- Security hardening for Supabase linter warnings:
-- 1) Fix mutable search_path on selected public functions.
-- 2) Replace permissive stock_notifications INSERT policy.

DO $$
BEGIN
  IF to_regprocedure('public.update_document_reminder_logs_updated_at()') IS NOT NULL THEN
    EXECUTE 'ALTER FUNCTION public.update_document_reminder_logs_updated_at() SET search_path TO public, pg_catalog';
  ELSE
    RAISE NOTICE 'Function public.update_document_reminder_logs_updated_at() not found; skipping.';
  END IF;

  IF to_regprocedure('public.update_coupons_updated_at()') IS NOT NULL THEN
    EXECUTE 'ALTER FUNCTION public.update_coupons_updated_at() SET search_path TO public, pg_catalog';
  ELSE
    RAISE NOTICE 'Function public.update_coupons_updated_at() not found; skipping.';
  END IF;

  IF to_regprocedure('public.generate_gift_card_code()') IS NOT NULL THEN
    EXECUTE 'ALTER FUNCTION public.generate_gift_card_code() SET search_path TO public, pg_catalog';
  ELSE
    RAISE NOTICE 'Function public.generate_gift_card_code() not found; skipping.';
  END IF;

  IF to_regprocedure('public.check_gift_card_balance()') IS NOT NULL THEN
    EXECUTE 'ALTER FUNCTION public.check_gift_card_balance() SET search_path TO public, pg_catalog';
  ELSE
    RAISE NOTICE 'Function public.check_gift_card_balance() not found; skipping.';
  END IF;

  IF to_regprocedure('public.update_review_vote_counts()') IS NOT NULL THEN
    EXECUTE 'ALTER FUNCTION public.update_review_vote_counts() SET search_path TO public, pg_catalog';
  ELSE
    RAISE NOTICE 'Function public.update_review_vote_counts() not found; skipping.';
  END IF;

  IF to_regprocedure('public.calculate_total_stock(uuid)') IS NOT NULL THEN
    EXECUTE 'ALTER FUNCTION public.calculate_total_stock(uuid) SET search_path TO public, pg_catalog';
  ELSE
    RAISE NOTICE 'Function public.calculate_total_stock(uuid) not found; skipping.';
  END IF;
END;
$$;

DO $$
BEGIN
  IF to_regclass('public.stock_notifications') IS NULL THEN
    RAISE NOTICE 'Table public.stock_notifications does not exist; skipping policy hardening.';
    RETURN;
  END IF;

  ALTER TABLE public.stock_notifications ENABLE ROW LEVEL SECURITY;

  DROP POLICY IF EXISTS "Anyone can subscribe to stock notifications"
    ON public.stock_notifications;

  CREATE POLICY "Anyone can subscribe to stock notifications"
    ON public.stock_notifications
    FOR INSERT
    TO anon, authenticated
    WITH CHECK (
      product_id IS NOT NULL
      AND email IS NOT NULL
      AND LENGTH(TRIM(email)) >= 5
      AND email ~* '^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$'
      AND COALESCE(notified, false) = false
    );
END;
$$;
