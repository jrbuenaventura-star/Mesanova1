-- Workflow: manual product price adjustments require second-superadmin approval.

CREATE TABLE IF NOT EXISTS public.product_price_adjustment_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  requested_by UUID NOT NULL REFERENCES public.user_profiles(id) ON DELETE RESTRICT,
  approved_by UUID REFERENCES public.user_profiles(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'cancelled')),
  request_reason TEXT,
  review_notes TEXT,
  previous_values JSONB NOT NULL DEFAULT '{}'::jsonb,
  requested_values JSONB NOT NULL DEFAULT '{}'::jsonb,
  reviewed_at TIMESTAMPTZ,
  applied_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_product_price_adjustment_requests_status_created_at
  ON public.product_price_adjustment_requests(status, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_product_price_adjustment_requests_product_id
  ON public.product_price_adjustment_requests(product_id);

CREATE INDEX IF NOT EXISTS idx_product_price_adjustment_requests_requested_by
  ON public.product_price_adjustment_requests(requested_by);

CREATE OR REPLACE FUNCTION public.set_product_price_adjustment_requests_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public, pg_catalog
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_product_price_adjustment_requests_updated_at
  ON public.product_price_adjustment_requests;

CREATE TRIGGER trg_product_price_adjustment_requests_updated_at
  BEFORE UPDATE ON public.product_price_adjustment_requests
  FOR EACH ROW
  EXECUTE FUNCTION public.set_product_price_adjustment_requests_updated_at();

ALTER TABLE public.product_price_adjustment_requests ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Superadmin can manage product price adjustment requests"
  ON public.product_price_adjustment_requests;

CREATE POLICY "Superadmin can manage product price adjustment requests"
  ON public.product_price_adjustment_requests
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.user_profiles
      WHERE user_profiles.id = auth.uid()
        AND user_profiles.role = 'superadmin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.user_profiles
      WHERE user_profiles.id = auth.uid()
        AND user_profiles.role = 'superadmin'
    )
  );
