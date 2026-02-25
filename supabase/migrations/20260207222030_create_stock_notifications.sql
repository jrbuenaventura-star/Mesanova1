
CREATE TABLE IF NOT EXISTS public.stock_notifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  notified BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for querying by product
CREATE INDEX IF NOT EXISTS idx_stock_notifications_product ON public.stock_notifications(product_id, notified);

-- Index for querying by email
CREATE INDEX IF NOT EXISTS idx_stock_notifications_email ON public.stock_notifications(email);

-- Unique constraint to prevent duplicate subscriptions
CREATE UNIQUE INDEX IF NOT EXISTS idx_stock_notifications_unique 
ON public.stock_notifications(product_id, email) WHERE notified = FALSE;

-- Enable RLS
ALTER TABLE public.stock_notifications ENABLE ROW LEVEL SECURITY;

-- Allow inserts from anyone (public form)
CREATE POLICY "Anyone can subscribe to stock notifications"
ON public.stock_notifications FOR INSERT
WITH CHECK (true);

-- Only admins can read/update
CREATE POLICY "Admins can manage stock notifications"
ON public.stock_notifications FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.user_profiles
    WHERE id = auth.uid() AND role = 'superadmin'
  )
);
;
