-- =====================================================
-- SISTEMA DE CUPONES DE DESCUENTO
-- =====================================================

-- Tabla principal de cupones
CREATE TABLE IF NOT EXISTS coupons (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  code VARCHAR(50) UNIQUE NOT NULL,
  
  -- Descripción
  name TEXT NOT NULL,
  description TEXT,
  
  -- Tipo de descuento
  discount_type TEXT NOT NULL CHECK (discount_type IN ('percentage', 'fixed_amount', 'free_shipping')),
  discount_value DECIMAL(10,2) NOT NULL CHECK (discount_value > 0),
  
  -- Restricciones
  min_purchase_amount DECIMAL(10,2) DEFAULT 0 CHECK (min_purchase_amount >= 0),
  max_discount_amount DECIMAL(10,2), -- Para porcentajes, límite máximo de descuento
  max_uses INTEGER, -- Usos totales permitidos (NULL = ilimitado)
  max_uses_per_user INTEGER DEFAULT 1 CHECK (max_uses_per_user > 0),
  
  -- Aplicabilidad
  applicable_to TEXT DEFAULT 'all' CHECK (applicable_to IN ('all', 'specific_products', 'specific_categories', 'specific_users')),
  applicable_product_ids JSONB, -- Array de UUIDs de productos
  applicable_category_ids JSONB, -- Array de IDs de categorías
  applicable_user_ids JSONB, -- Array de UUIDs de usuarios (cupones personalizados)
  
  -- Validez temporal
  valid_from TIMESTAMPTZ DEFAULT NOW(),
  valid_until TIMESTAMPTZ,
  
  -- Estado
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'expired')),
  is_public BOOLEAN DEFAULT true, -- Si aparece en listado público de ofertas
  
  -- Metadata
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para optimizar búsquedas
CREATE INDEX IF NOT EXISTS idx_coupons_code ON coupons(code);
CREATE INDEX IF NOT EXISTS idx_coupons_status ON coupons(status);
CREATE INDEX IF NOT EXISTS idx_coupons_valid_dates ON coupons(valid_from, valid_until);
CREATE INDEX IF NOT EXISTS idx_coupons_is_public ON coupons(is_public) WHERE is_public = true;

-- Tabla de uso de cupones (historial)
CREATE TABLE IF NOT EXISTS coupon_usages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  coupon_id UUID REFERENCES coupons(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  order_id UUID REFERENCES orders(id) ON DELETE SET NULL NOT NULL,
  
  -- Detalles del descuento aplicado
  discount_applied DECIMAL(10,2) NOT NULL CHECK (discount_applied >= 0),
  order_total_before DECIMAL(10,2) NOT NULL,
  order_total_after DECIMAL(10,2) NOT NULL,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para historial de uso
CREATE INDEX IF NOT EXISTS idx_coupon_usages_coupon_id ON coupon_usages(coupon_id);
CREATE INDEX IF NOT EXISTS idx_coupon_usages_user_id ON coupon_usages(user_id);
CREATE INDEX IF NOT EXISTS idx_coupon_usages_order_id ON coupon_usages(order_id);
CREATE INDEX IF NOT EXISTS idx_coupon_usages_created_at ON coupon_usages(created_at DESC);

-- Trigger para actualizar updated_at
CREATE OR REPLACE FUNCTION update_coupons_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER coupons_updated_at_trigger
  BEFORE UPDATE ON coupons
  FOR EACH ROW
  EXECUTE FUNCTION update_coupons_updated_at();

-- Función para marcar cupones expirados automáticamente
CREATE OR REPLACE FUNCTION mark_expired_coupons()
RETURNS void AS $$
BEGIN
  UPDATE coupons
  SET status = 'expired'
  WHERE status = 'active'
    AND valid_until IS NOT NULL
    AND valid_until < NOW();
END;
$$ LANGUAGE plpgsql;

-- Habilitar RLS
ALTER TABLE coupons ENABLE ROW LEVEL SECURITY;
ALTER TABLE coupon_usages ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para cupones
-- Usuarios pueden ver cupones públicos activos
CREATE POLICY "Users can view public active coupons"
  ON coupons FOR SELECT
  USING (
    is_public = true 
    AND status = 'active'
    AND (valid_from IS NULL OR valid_from <= NOW())
    AND (valid_until IS NULL OR valid_until > NOW())
  );

-- Usuarios pueden ver sus cupones personalizados
CREATE POLICY "Users can view their personal coupons"
  ON coupons FOR SELECT
  USING (
    auth.uid() IS NOT NULL
    AND applicable_to = 'specific_users'
    AND applicable_user_ids ? auth.uid()::text
  );

-- Superadmins pueden ver todos los cupones
CREATE POLICY "Superadmins can view all coupons"
  ON coupons FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.role = 'superadmin'
    )
  );

-- Solo superadmins pueden crear cupones
CREATE POLICY "Superadmins can create coupons"
  ON coupons FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.role = 'superadmin'
    )
  );

-- Solo superadmins pueden actualizar cupones
CREATE POLICY "Superadmins can update coupons"
  ON coupons FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.role = 'superadmin'
    )
  );

-- Solo superadmins pueden eliminar cupones
CREATE POLICY "Superadmins can delete coupons"
  ON coupons FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.role = 'superadmin'
    )
  );

-- Políticas RLS para uso de cupones
-- Usuarios pueden ver su propio historial
CREATE POLICY "Users can view their coupon usage"
  ON coupon_usages FOR SELECT
  USING (auth.uid() = user_id);

-- Superadmins pueden ver todo el historial
CREATE POLICY "Superadmins can view all coupon usages"
  ON coupon_usages FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.role = 'superadmin'
    )
  );

-- Cualquiera puede registrar uso de cupón (se valida en aplicación)
CREATE POLICY "Anyone can create coupon usage"
  ON coupon_usages FOR INSERT
  WITH CHECK (true);

-- Comentarios para documentación
COMMENT ON TABLE coupons IS 'Tabla de cupones de descuento del sistema';
COMMENT ON COLUMN coupons.discount_type IS 'Tipos: percentage (porcentaje), fixed_amount (monto fijo), free_shipping (envío gratis)';
COMMENT ON COLUMN coupons.applicable_to IS 'Aplicabilidad: all (todos), specific_products (productos específicos), specific_categories (categorías específicas), specific_users (usuarios específicos)';
COMMENT ON TABLE coupon_usages IS 'Historial de uso de cupones';
