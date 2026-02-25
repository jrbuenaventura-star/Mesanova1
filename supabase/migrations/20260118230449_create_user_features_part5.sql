-- =============================================================================
-- Migración: Funcionalidades de Usuario - Parte 5 (Vistos, Alertas, Comparador)
-- =============================================================================

-- Productos vistos recientemente
CREATE TABLE IF NOT EXISTS recently_viewed_products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  viewed_at TIMESTAMPTZ DEFAULT NOW(),
  view_count INTEGER DEFAULT 1,
  UNIQUE(user_id, product_id)
);

CREATE INDEX IF NOT EXISTS idx_recently_viewed_user ON recently_viewed_products(user_id, viewed_at DESC);

-- Función para insertar o actualizar vista
CREATE OR REPLACE FUNCTION upsert_recently_viewed(p_user_id UUID, p_product_id UUID)
RETURNS void AS $$
BEGIN
  INSERT INTO recently_viewed_products (user_id, product_id, viewed_at, view_count)
  VALUES (p_user_id, p_product_id, NOW(), 1)
  ON CONFLICT (user_id, product_id) DO UPDATE SET
    viewed_at = NOW(),
    view_count = recently_viewed_products.view_count + 1;
    
  -- Mantener solo los últimos 50 productos vistos
  DELETE FROM recently_viewed_products
  WHERE user_id = p_user_id
    AND id NOT IN (
      SELECT id FROM recently_viewed_products
      WHERE user_id = p_user_id
      ORDER BY viewed_at DESC
      LIMIT 50
    );
END;
$$ LANGUAGE plpgsql;

-- Alertas de precio
CREATE TABLE IF NOT EXISTS price_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  target_price DECIMAL(12,2) NOT NULL,
  original_price DECIMAL(12,2) NOT NULL,
  is_active BOOLEAN DEFAULT true,
  triggered_at TIMESTAMPTZ,
  notified_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, product_id)
);

-- Alertas de stock
CREATE TABLE IF NOT EXISTS stock_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  is_active BOOLEAN DEFAULT true,
  triggered_at TIMESTAMPTZ,
  notified_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, product_id)
);

CREATE INDEX IF NOT EXISTS idx_price_alerts_active ON price_alerts(product_id) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_stock_alerts_active ON stock_alerts(product_id) WHERE is_active = true;

-- Comparador de productos
CREATE TABLE IF NOT EXISTS product_comparisons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE,
  session_id VARCHAR(100),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  added_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_product_comparisons_user ON product_comparisons(user_id);
CREATE INDEX IF NOT EXISTS idx_product_comparisons_session ON product_comparisons(session_id);;
