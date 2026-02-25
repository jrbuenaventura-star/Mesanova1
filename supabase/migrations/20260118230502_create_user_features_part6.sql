-- =============================================================================
-- Migración: Funcionalidades de Usuario - Parte 6 (Sistema de Lealtad)
-- =============================================================================

DO $$ BEGIN
  CREATE TYPE loyalty_transaction_type AS ENUM (
    'purchase', 'review', 'referral', 'bonus', 'redemption', 'expiration', 'adjustment'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Puntos de lealtad del usuario
CREATE TABLE IF NOT EXISTS loyalty_points (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID UNIQUE NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  total_points INTEGER DEFAULT 0,
  available_points INTEGER DEFAULT 0,
  pending_points INTEGER DEFAULT 0,
  redeemed_points INTEGER DEFAULT 0,
  tier VARCHAR(50) DEFAULT 'bronze',
  tier_updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Transacciones de puntos
CREATE TABLE IF NOT EXISTS loyalty_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  transaction_type loyalty_transaction_type NOT NULL,
  points INTEGER NOT NULL,
  description TEXT,
  order_id UUID REFERENCES orders(id),
  review_id UUID REFERENCES product_reviews(id),
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_loyalty_points_user ON loyalty_points(user_id);
CREATE INDEX IF NOT EXISTS idx_loyalty_transactions_user ON loyalty_transactions(user_id, created_at DESC);

-- Función para actualizar puntos de lealtad
CREATE OR REPLACE FUNCTION update_loyalty_points()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO loyalty_points (user_id) VALUES (NEW.user_id)
  ON CONFLICT (user_id) DO NOTHING;
  
  UPDATE loyalty_points
  SET 
    total_points = total_points + CASE WHEN NEW.points > 0 THEN NEW.points ELSE 0 END,
    available_points = available_points + NEW.points,
    redeemed_points = redeemed_points + CASE WHEN NEW.points < 0 THEN ABS(NEW.points) ELSE 0 END,
    updated_at = NOW()
  WHERE user_id = NEW.user_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_loyalty_points ON loyalty_transactions;
CREATE TRIGGER trigger_update_loyalty_points
  AFTER INSERT ON loyalty_transactions
  FOR EACH ROW EXECUTE FUNCTION update_loyalty_points();

-- Configuración del programa de lealtad
CREATE TABLE IF NOT EXISTS loyalty_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  points_per_dollar DECIMAL(5,2) DEFAULT 1.0,
  points_for_review INTEGER DEFAULT 50,
  points_for_referral INTEGER DEFAULT 100,
  silver_threshold INTEGER DEFAULT 1000,
  gold_threshold INTEGER DEFAULT 5000,
  platinum_threshold INTEGER DEFAULT 15000,
  points_per_dollar_redemption INTEGER DEFAULT 100,
  min_redemption_points INTEGER DEFAULT 500,
  points_expire_months INTEGER DEFAULT 12,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

INSERT INTO loyalty_config (id) VALUES (gen_random_uuid()) ON CONFLICT DO NOTHING;;
