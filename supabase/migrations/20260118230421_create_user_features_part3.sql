-- =============================================================================
-- Migración: Funcionalidades de Usuario - Parte 3 (Direcciones y Carriers)
-- =============================================================================

-- Direcciones de envío
CREATE TABLE IF NOT EXISTS shipping_addresses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  label VARCHAR(100) NOT NULL,
  full_name VARCHAR(255) NOT NULL,
  phone VARCHAR(50),
  address_line1 TEXT NOT NULL,
  address_line2 TEXT,
  city VARCHAR(100) NOT NULL,
  state VARCHAR(100) NOT NULL,
  postal_code VARCHAR(20),
  country VARCHAR(100) DEFAULT 'Colombia',
  is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_shipping_addresses_user ON shipping_addresses(user_id);

-- Función para asegurar solo una dirección por defecto
CREATE OR REPLACE FUNCTION ensure_single_default_address()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.is_default = true THEN
    UPDATE shipping_addresses
    SET is_default = false
    WHERE user_id = NEW.user_id AND id != NEW.id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_single_default_address ON shipping_addresses;
CREATE TRIGGER trigger_single_default_address
  BEFORE INSERT OR UPDATE ON shipping_addresses
  FOR EACH ROW EXECUTE FUNCTION ensure_single_default_address();

-- Transportadoras
CREATE TABLE IF NOT EXISTS carriers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code VARCHAR(50) UNIQUE NOT NULL,
  name VARCHAR(100) NOT NULL,
  tracking_url_template TEXT,
  api_endpoint TEXT,
  api_key_encrypted TEXT,
  is_active BOOLEAN DEFAULT true,
  supports_api BOOLEAN DEFAULT false,
  logo_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insertar transportadoras
INSERT INTO carriers (code, name, tracking_url_template, is_active) VALUES
  ('deprisa', 'Deprisa', 'https://www.deprisa.com/rastreo?guia={tracking_number}', true),
  ('tcc', 'TCC', 'https://www.tcc.com.co/rastreo/{tracking_number}', true)
ON CONFLICT (code) DO NOTHING;

-- Historial de tracking
CREATE TABLE IF NOT EXISTS order_tracking_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  status VARCHAR(100) NOT NULL,
  status_description TEXT,
  location VARCHAR(255),
  carrier_status_code VARCHAR(100),
  raw_response JSONB,
  occurred_at TIMESTAMPTZ NOT NULL,
  recorded_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_order_tracking_order ON order_tracking_history(order_id);
CREATE INDEX IF NOT EXISTS idx_order_tracking_occurred ON order_tracking_history(occurred_at DESC);

-- Columnas adicionales en orders
ALTER TABLE orders ADD COLUMN IF NOT EXISTS carrier_id UUID REFERENCES carriers(id);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS tracking_number VARCHAR(255);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS estimated_delivery_date DATE;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS last_tracking_update TIMESTAMPTZ;;
