-- =============================================================================
-- Migración: Funcionalidades de Usuario - Parte 2 (Listas de Matrimonio)
-- =============================================================================

-- Tipos ENUM
DO $$ BEGIN
  CREATE TYPE gift_registry_status AS ENUM ('active', 'completed', 'expired', 'cancelled');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE gift_registry_event_type AS ENUM ('wedding', 'baby_shower', 'birthday', 'housewarming', 'other');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Tabla principal de listas de regalos
CREATE TABLE IF NOT EXISTS gift_registries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  event_type gift_registry_event_type DEFAULT 'wedding',
  event_date DATE,
  description TEXT,
  partner_name VARCHAR(255),
  cover_image_url TEXT,
  is_searchable BOOLEAN DEFAULT true,
  share_token VARCHAR(64) UNIQUE NOT NULL,
  status gift_registry_status DEFAULT 'active',
  expires_at TIMESTAMPTZ,
  notify_on_purchase BOOLEAN DEFAULT true,
  notification_email VARCHAR(255),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Items de la lista de regalos
CREATE TABLE IF NOT EXISTS gift_registry_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  registry_id UUID NOT NULL REFERENCES gift_registries(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  quantity_desired INTEGER DEFAULT 1,
  quantity_purchased INTEGER DEFAULT 0,
  priority INTEGER DEFAULT 0,
  notes TEXT,
  added_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(registry_id, product_id)
);

-- Compras de regalos
CREATE TABLE IF NOT EXISTS gift_registry_purchases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  registry_item_id UUID NOT NULL REFERENCES gift_registry_items(id) ON DELETE CASCADE,
  buyer_name VARCHAR(255) NOT NULL,
  buyer_email VARCHAR(255),
  buyer_message TEXT,
  is_anonymous BOOLEAN DEFAULT false,
  quantity INTEGER DEFAULT 1,
  order_id UUID REFERENCES orders(id),
  purchased_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_gift_registries_user ON gift_registries(user_id);
CREATE INDEX IF NOT EXISTS idx_gift_registries_share_token ON gift_registries(share_token);
CREATE INDEX IF NOT EXISTS idx_gift_registries_status ON gift_registries(status);
CREATE INDEX IF NOT EXISTS idx_gift_registry_items_registry ON gift_registry_items(registry_id);
CREATE INDEX IF NOT EXISTS idx_gift_registry_purchases_item ON gift_registry_purchases(registry_item_id);

-- Trigger para actualizar cantidad comprada
CREATE OR REPLACE FUNCTION update_gift_registry_purchased_quantity()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE gift_registry_items
  SET quantity_purchased = quantity_purchased + NEW.quantity
  WHERE id = NEW.registry_item_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_gift_purchased ON gift_registry_purchases;
CREATE TRIGGER trigger_update_gift_purchased
  AFTER INSERT ON gift_registry_purchases
  FOR EACH ROW EXECUTE FUNCTION update_gift_registry_purchased_quantity();;
