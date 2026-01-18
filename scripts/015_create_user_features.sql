-- =============================================================================
-- Migración 015: Funcionalidades de Usuario Final Mejoradas
-- Favoritos, Wishlists, Listas de Matrimonio, Direcciones, Tracking, Reseñas,
-- Puntos de Lealtad, Alertas y Productos Vistos Recientemente
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. FAVORITOS (productos que te gustan para referencia rápida)
-- -----------------------------------------------------------------------------
CREATE TABLE favorites (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(user_id, product_id)
);

CREATE INDEX idx_favorites_user ON favorites(user_id);
CREATE INDEX idx_favorites_product ON favorites(product_id);

-- -----------------------------------------------------------------------------
-- 2. WISHLISTS (listas de deseos compartibles)
-- -----------------------------------------------------------------------------
CREATE TABLE wishlists (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  is_public BOOLEAN DEFAULT false,
  share_token VARCHAR(64) UNIQUE, -- Token para compartir la lista
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE wishlist_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  wishlist_id UUID NOT NULL REFERENCES wishlists(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  quantity INTEGER DEFAULT 1,
  priority INTEGER DEFAULT 0, -- 0=normal, 1=alta, 2=muy alta
  notes TEXT,
  added_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(wishlist_id, product_id)
);

CREATE INDEX idx_wishlists_user ON wishlists(user_id);
CREATE INDEX idx_wishlists_share_token ON wishlists(share_token);
CREATE INDEX idx_wishlist_items_wishlist ON wishlist_items(wishlist_id);

-- -----------------------------------------------------------------------------
-- 3. LISTAS DE MATRIMONIO / REGALOS
-- -----------------------------------------------------------------------------
CREATE TYPE gift_registry_status AS ENUM ('active', 'completed', 'expired', 'cancelled');
CREATE TYPE gift_registry_event_type AS ENUM ('wedding', 'baby_shower', 'birthday', 'housewarming', 'other');

CREATE TABLE gift_registries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  
  -- Información del evento
  name VARCHAR(255) NOT NULL, -- Nombre para buscar (ej: "Boda María y Juan")
  event_type gift_registry_event_type DEFAULT 'wedding',
  event_date DATE,
  description TEXT,
  
  -- Información de los novios/anfitriones
  partner_name VARCHAR(255), -- Nombre del otro anfitrión
  cover_image_url TEXT,
  
  -- Configuración de privacidad
  is_searchable BOOLEAN DEFAULT true, -- Se puede buscar por nombre
  share_token VARCHAR(64) UNIQUE NOT NULL, -- Token único para acceso directo
  
  -- Estado y expiración
  status gift_registry_status DEFAULT 'active',
  expires_at TIMESTAMPTZ, -- Fecha de expiración (2 meses después del evento)
  
  -- Notificaciones
  notify_on_purchase BOOLEAN DEFAULT true,
  notification_email VARCHAR(255),
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE gift_registry_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  registry_id UUID NOT NULL REFERENCES gift_registries(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  
  quantity_desired INTEGER DEFAULT 1,
  quantity_purchased INTEGER DEFAULT 0,
  priority INTEGER DEFAULT 0, -- 0=normal, 1=alta, 2=muy alta
  notes TEXT, -- Nota del anfitrión sobre el producto
  
  added_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(registry_id, product_id)
);

-- Historial de compras de regalos
CREATE TABLE gift_registry_purchases (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  registry_item_id UUID NOT NULL REFERENCES gift_registry_items(id) ON DELETE CASCADE,
  
  -- Información del comprador
  buyer_name VARCHAR(255) NOT NULL,
  buyer_email VARCHAR(255),
  buyer_message TEXT, -- Mensaje para los novios
  is_anonymous BOOLEAN DEFAULT false,
  
  -- Detalles de compra
  quantity INTEGER DEFAULT 1,
  order_id UUID REFERENCES orders(id),
  
  purchased_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_gift_registries_user ON gift_registries(user_id);
CREATE INDEX idx_gift_registries_name ON gift_registries(name) WHERE is_searchable = true;
CREATE INDEX idx_gift_registries_share_token ON gift_registries(share_token);
CREATE INDEX idx_gift_registries_status ON gift_registries(status);
CREATE INDEX idx_gift_registry_items_registry ON gift_registry_items(registry_id);
CREATE INDEX idx_gift_registry_purchases_item ON gift_registry_purchases(registry_item_id);

-- Función para actualizar cantidad comprada
CREATE OR REPLACE FUNCTION update_gift_registry_purchased_quantity()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE gift_registry_items
  SET quantity_purchased = quantity_purchased + NEW.quantity
  WHERE id = NEW.registry_item_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_gift_purchased
  AFTER INSERT ON gift_registry_purchases
  FOR EACH ROW EXECUTE FUNCTION update_gift_registry_purchased_quantity();

-- -----------------------------------------------------------------------------
-- 4. DIRECCIONES DE ENVÍO GUARDADAS
-- -----------------------------------------------------------------------------
CREATE TABLE shipping_addresses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  
  label VARCHAR(100) NOT NULL, -- "Casa", "Oficina", etc.
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

CREATE INDEX idx_shipping_addresses_user ON shipping_addresses(user_id);

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

CREATE TRIGGER trigger_single_default_address
  BEFORE INSERT OR UPDATE ON shipping_addresses
  FOR EACH ROW EXECUTE FUNCTION ensure_single_default_address();

-- -----------------------------------------------------------------------------
-- 5. TRANSPORTADORAS Y TRACKING MEJORADO
-- -----------------------------------------------------------------------------
CREATE TABLE carriers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  code VARCHAR(50) UNIQUE NOT NULL, -- 'deprisa', 'tcc'
  name VARCHAR(100) NOT NULL, -- 'Deprisa', 'TCC'
  
  -- URLs de tracking
  tracking_url_template TEXT, -- URL con {tracking_number} placeholder
  api_endpoint TEXT,
  api_key_encrypted TEXT, -- Para integración futura
  
  -- Configuración
  is_active BOOLEAN DEFAULT true,
  supports_api BOOLEAN DEFAULT false, -- Si tiene integración API
  logo_url TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insertar transportadoras iniciales
INSERT INTO carriers (code, name, tracking_url_template, is_active) VALUES
  ('deprisa', 'Deprisa', 'https://www.deprisa.com/rastreo?guia={tracking_number}', true),
  ('tcc', 'TCC', 'https://www.tcc.com.co/rastreo/{tracking_number}', true);

-- Historial de tracking por orden
CREATE TABLE order_tracking_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  
  status VARCHAR(100) NOT NULL, -- 'picked_up', 'in_transit', 'out_for_delivery', 'delivered', etc.
  status_description TEXT,
  location VARCHAR(255),
  
  -- Datos de la transportadora
  carrier_status_code VARCHAR(100), -- Código original de la transportadora
  raw_response JSONB, -- Respuesta completa de la API
  
  occurred_at TIMESTAMPTZ NOT NULL, -- Cuándo ocurrió el evento
  recorded_at TIMESTAMPTZ DEFAULT NOW() -- Cuándo se registró
);

CREATE INDEX idx_order_tracking_order ON order_tracking_history(order_id);
CREATE INDEX idx_order_tracking_occurred ON order_tracking_history(occurred_at DESC);

-- Agregar columna de carrier a orders si no existe (referencia a carriers)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'orders' AND column_name = 'carrier_id') THEN
    ALTER TABLE orders ADD COLUMN carrier_id UUID REFERENCES carriers(id);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'orders' AND column_name = 'estimated_delivery_date') THEN
    ALTER TABLE orders ADD COLUMN estimated_delivery_date DATE;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'orders' AND column_name = 'last_tracking_update') THEN
    ALTER TABLE orders ADD COLUMN last_tracking_update TIMESTAMPTZ;
  END IF;
END $$;

-- -----------------------------------------------------------------------------
-- 6. RESEÑAS DE PRODUCTOS
-- -----------------------------------------------------------------------------
CREATE TABLE product_reviews (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  order_id UUID REFERENCES orders(id), -- Orden donde compró el producto
  
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  title VARCHAR(255),
  review_text TEXT,
  
  -- Imágenes de la reseña
  images JSONB DEFAULT '[]', -- Array de URLs de imágenes
  
  -- Moderación
  is_verified_purchase BOOLEAN DEFAULT false,
  is_approved BOOLEAN DEFAULT true,
  is_featured BOOLEAN DEFAULT false,
  
  -- Utilidad
  helpful_count INTEGER DEFAULT 0,
  not_helpful_count INTEGER DEFAULT 0,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(product_id, user_id, order_id)
);

-- Votos de utilidad de reseñas
CREATE TABLE review_votes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  review_id UUID NOT NULL REFERENCES product_reviews(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  is_helpful BOOLEAN NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(review_id, user_id)
);

CREATE INDEX idx_product_reviews_product ON product_reviews(product_id);
CREATE INDEX idx_product_reviews_user ON product_reviews(user_id);
CREATE INDEX idx_product_reviews_rating ON product_reviews(rating);

-- Función para actualizar contadores de utilidad
CREATE OR REPLACE FUNCTION update_review_helpfulness()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    IF NEW.is_helpful THEN
      UPDATE product_reviews SET helpful_count = helpful_count + 1 WHERE id = NEW.review_id;
    ELSE
      UPDATE product_reviews SET not_helpful_count = not_helpful_count + 1 WHERE id = NEW.review_id;
    END IF;
  ELSIF TG_OP = 'DELETE' THEN
    IF OLD.is_helpful THEN
      UPDATE product_reviews SET helpful_count = helpful_count - 1 WHERE id = OLD.review_id;
    ELSE
      UPDATE product_reviews SET not_helpful_count = not_helpful_count - 1 WHERE id = OLD.review_id;
    END IF;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_review_helpfulness
  AFTER INSERT OR DELETE ON review_votes
  FOR EACH ROW EXECUTE FUNCTION update_review_helpfulness();

-- -----------------------------------------------------------------------------
-- 7. PRODUCTOS VISTOS RECIENTEMENTE
-- -----------------------------------------------------------------------------
CREATE TABLE recently_viewed_products (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  viewed_at TIMESTAMPTZ DEFAULT NOW(),
  view_count INTEGER DEFAULT 1,
  
  UNIQUE(user_id, product_id)
);

CREATE INDEX idx_recently_viewed_user ON recently_viewed_products(user_id, viewed_at DESC);

-- Función para insertar o actualizar vista
CREATE OR REPLACE FUNCTION upsert_recently_viewed(p_user_id UUID, p_product_id UUID)
RETURNS void AS $$
BEGIN
  INSERT INTO recently_viewed_products (user_id, product_id, viewed_at, view_count)
  VALUES (p_user_id, p_product_id, NOW(), 1)
  ON CONFLICT (user_id, product_id) DO UPDATE SET
    viewed_at = NOW(),
    view_count = recently_viewed_products.view_count + 1;
    
  -- Mantener solo los últimos 50 productos vistos por usuario
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

-- -----------------------------------------------------------------------------
-- 8. ALERTAS DE PRECIO Y STOCK
-- -----------------------------------------------------------------------------
CREATE TABLE price_alerts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  
  target_price DECIMAL(12,2) NOT NULL, -- Precio deseado
  original_price DECIMAL(12,2) NOT NULL, -- Precio cuando se creó la alerta
  
  is_active BOOLEAN DEFAULT true,
  triggered_at TIMESTAMPTZ, -- Cuándo se disparó la alerta
  notified_at TIMESTAMPTZ, -- Cuándo se notificó al usuario
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(user_id, product_id)
);

CREATE TABLE stock_alerts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  
  is_active BOOLEAN DEFAULT true,
  triggered_at TIMESTAMPTZ,
  notified_at TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(user_id, product_id)
);

CREATE INDEX idx_price_alerts_active ON price_alerts(product_id) WHERE is_active = true;
CREATE INDEX idx_stock_alerts_active ON stock_alerts(product_id) WHERE is_active = true;

-- -----------------------------------------------------------------------------
-- 9. SISTEMA DE PUNTOS DE LEALTAD / RECOMPENSAS
-- -----------------------------------------------------------------------------
CREATE TYPE loyalty_transaction_type AS ENUM (
  'purchase',      -- Puntos por compra
  'review',        -- Puntos por reseña
  'referral',      -- Puntos por referido
  'bonus',         -- Puntos bonus (promociones)
  'redemption',    -- Canje de puntos
  'expiration',    -- Expiración de puntos
  'adjustment'     -- Ajuste manual
);

CREATE TABLE loyalty_points (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID UNIQUE NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  
  total_points INTEGER DEFAULT 0,
  available_points INTEGER DEFAULT 0, -- Puntos disponibles para canjear
  pending_points INTEGER DEFAULT 0, -- Puntos pendientes de confirmación
  redeemed_points INTEGER DEFAULT 0, -- Total de puntos canjeados históricamente
  
  tier VARCHAR(50) DEFAULT 'bronze', -- bronze, silver, gold, platinum
  tier_updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE loyalty_transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  
  transaction_type loyalty_transaction_type NOT NULL,
  points INTEGER NOT NULL, -- Positivo para ganar, negativo para canjear
  description TEXT,
  
  -- Referencias opcionales
  order_id UUID REFERENCES orders(id),
  review_id UUID REFERENCES product_reviews(id),
  
  -- Expiración
  expires_at TIMESTAMPTZ, -- NULL si no expira
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_loyalty_points_user ON loyalty_points(user_id);
CREATE INDEX idx_loyalty_transactions_user ON loyalty_transactions(user_id, created_at DESC);

-- Función para actualizar puntos de lealtad
CREATE OR REPLACE FUNCTION update_loyalty_points()
RETURNS TRIGGER AS $$
BEGIN
  -- Asegurar que existe el registro de loyalty_points
  INSERT INTO loyalty_points (user_id) VALUES (NEW.user_id)
  ON CONFLICT (user_id) DO NOTHING;
  
  -- Actualizar puntos
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

CREATE TRIGGER trigger_update_loyalty_points
  AFTER INSERT ON loyalty_transactions
  FOR EACH ROW EXECUTE FUNCTION update_loyalty_points();

-- Configuración del programa de lealtad
CREATE TABLE loyalty_config (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Puntos por acción
  points_per_dollar DECIMAL(5,2) DEFAULT 1.0, -- Puntos por cada dólar gastado
  points_for_review INTEGER DEFAULT 50, -- Puntos por escribir reseña
  points_for_referral INTEGER DEFAULT 100, -- Puntos por referir
  
  -- Tiers
  silver_threshold INTEGER DEFAULT 1000,
  gold_threshold INTEGER DEFAULT 5000,
  platinum_threshold INTEGER DEFAULT 15000,
  
  -- Canje
  points_per_dollar_redemption INTEGER DEFAULT 100, -- 100 puntos = $1
  min_redemption_points INTEGER DEFAULT 500,
  
  -- Expiración
  points_expire_months INTEGER DEFAULT 12,
  
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insertar configuración inicial
INSERT INTO loyalty_config (id) VALUES (uuid_generate_v4());

-- -----------------------------------------------------------------------------
-- 10. COMPARADOR DE PRODUCTOS
-- -----------------------------------------------------------------------------
CREATE TABLE product_comparisons (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE,
  session_id VARCHAR(100), -- Para usuarios no autenticados
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  added_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(user_id, product_id),
  UNIQUE(session_id, product_id)
);

CREATE INDEX idx_product_comparisons_user ON product_comparisons(user_id);
CREATE INDEX idx_product_comparisons_session ON product_comparisons(session_id);

-- -----------------------------------------------------------------------------
-- 11. NOTIFICACIONES DEL USUARIO
-- -----------------------------------------------------------------------------
CREATE TYPE notification_type AS ENUM (
  'order_status',      -- Cambio de estado de orden
  'price_drop',        -- Bajó el precio de un producto
  'back_in_stock',     -- Producto disponible nuevamente
  'gift_purchased',    -- Alguien compró de tu lista de regalos
  'review_response',   -- Respuesta a tu reseña
  'points_earned',     -- Ganaste puntos
  'points_expiring',   -- Puntos por expirar
  'promotion',         -- Promoción especial
  'system'             -- Notificación del sistema
);

CREATE TABLE user_notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  
  type notification_type NOT NULL,
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  
  -- Referencias opcionales
  order_id UUID REFERENCES orders(id),
  product_id UUID REFERENCES products(id),
  
  -- Estado
  is_read BOOLEAN DEFAULT false,
  read_at TIMESTAMPTZ,
  
  -- Email
  email_sent BOOLEAN DEFAULT false,
  email_sent_at TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_user_notifications_user ON user_notifications(user_id, created_at DESC);
CREATE INDEX idx_user_notifications_unread ON user_notifications(user_id) WHERE is_read = false;

-- Preferencias de notificación del usuario
CREATE TABLE notification_preferences (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
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
);

-- -----------------------------------------------------------------------------
-- TRIGGERS PARA updated_at
-- -----------------------------------------------------------------------------
CREATE TRIGGER update_wishlists_updated_at BEFORE UPDATE ON wishlists
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_gift_registries_updated_at BEFORE UPDATE ON gift_registries
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_shipping_addresses_updated_at BEFORE UPDATE ON shipping_addresses
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_carriers_updated_at BEFORE UPDATE ON carriers
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_product_reviews_updated_at BEFORE UPDATE ON product_reviews
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_loyalty_points_updated_at BEFORE UPDATE ON loyalty_points
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_notification_preferences_updated_at BEFORE UPDATE ON notification_preferences
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
