-- Adds admin-level audit fields for loyalty manual adjustments.

ALTER TABLE public.loyalty_transactions
  ADD COLUMN IF NOT EXISTS admin_user_id UUID REFERENCES public.user_profiles(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS metadata JSONB NOT NULL DEFAULT '{}'::jsonb;

CREATE INDEX IF NOT EXISTS idx_loyalty_transactions_admin_user_created_at
  ON public.loyalty_transactions(admin_user_id, created_at DESC);
