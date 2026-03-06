-- Create notification index after enum updates are committed.
CREATE INDEX IF NOT EXISTS idx_user_notifications_price_changes
  ON public.user_notifications (user_id, product_id, created_at DESC)
  WHERE type IN ('price_change', 'price_drop');
