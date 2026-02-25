-- =============================================================================
-- Migración: Funcionalidades de Usuario - Parte 7 (Notificaciones)
-- =============================================================================

DO $$ BEGIN
  CREATE TYPE notification_type AS ENUM (
    'order_status', 'price_drop', 'back_in_stock', 'gift_purchased',
    'review_response', 'points_earned', 'points_expiring', 'promotion', 'system'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Notificaciones del usuario
CREATE TABLE IF NOT EXISTS user_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  type notification_type NOT NULL,
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  order_id UUID REFERENCES orders(id),
  product_id UUID REFERENCES products(id),
  is_read BOOLEAN DEFAULT false,
  read_at TIMESTAMPTZ,
  email_sent BOOLEAN DEFAULT false,
  email_sent_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_user_notifications_user ON user_notifications(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_user_notifications_unread ON user_notifications(user_id) WHERE is_read = false;

-- Preferencias de notificación
CREATE TABLE IF NOT EXISTS notification_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID UNIQUE NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  email_order_updates BOOLEAN DEFAULT true,
  email_price_alerts BOOLEAN DEFAULT true,
  email_stock_alerts BOOLEAN DEFAULT true,
  email_gift_purchases BOOLEAN DEFAULT true,
  email_promotions BOOLEAN DEFAULT false,
  email_newsletter BOOLEAN DEFAULT false,
  push_enabled BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);;
