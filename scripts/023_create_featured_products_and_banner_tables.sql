-- Script para crear tablas de productos destacados por categoría y banner del home
-- Mesanova - Sistema de gestión de contenido dinámico

-- Tabla para productos destacados por categoría
CREATE TABLE IF NOT EXISTS featured_category_products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  silo_id UUID NOT NULL REFERENCES silos(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  order_index INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),
  UNIQUE(silo_id, product_id)
);

-- Índices para featured_category_products
CREATE INDEX idx_featured_category_products_silo ON featured_category_products(silo_id);
CREATE INDEX idx_featured_category_products_product ON featured_category_products(product_id);
CREATE INDEX idx_featured_category_products_active ON featured_category_products(is_active);

-- Tabla para slides del banner del home
CREATE TABLE IF NOT EXISTS home_banner_slides (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  subtitle TEXT,
  description TEXT,
  image_url TEXT NOT NULL,
  cta_text TEXT,
  cta_link TEXT,
  order_index INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  background_color TEXT DEFAULT '#000000',
  text_color TEXT DEFAULT '#FFFFFF',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id)
);

-- Índices para home_banner_slides
CREATE INDEX idx_home_banner_slides_active ON home_banner_slides(is_active);
CREATE INDEX idx_home_banner_slides_order ON home_banner_slides(order_index);

-- RLS Policies para featured_category_products
ALTER TABLE featured_category_products ENABLE ROW LEVEL SECURITY;

-- Todos pueden ver productos destacados activos
CREATE POLICY "Anyone can view active featured products"
ON featured_category_products FOR SELECT
TO public
USING (is_active = true);

-- Solo superadmin puede gestionar productos destacados
CREATE POLICY "Superadmin can manage featured products"
ON featured_category_products FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM user_profiles
    WHERE user_profiles.id = auth.uid()
    AND user_profiles.role = 'superadmin'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM user_profiles
    WHERE user_profiles.id = auth.uid()
    AND user_profiles.role = 'superadmin'
  )
);

-- RLS Policies para home_banner_slides
ALTER TABLE home_banner_slides ENABLE ROW LEVEL SECURITY;

-- Todos pueden ver slides activos
CREATE POLICY "Anyone can view active banner slides"
ON home_banner_slides FOR SELECT
TO public
USING (is_active = true);

-- Solo superadmin puede gestionar slides
CREATE POLICY "Superadmin can manage banner slides"
ON home_banner_slides FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM user_profiles
    WHERE user_profiles.id = auth.uid()
    AND user_profiles.role = 'superadmin'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM user_profiles
    WHERE user_profiles.id = auth.uid()
    AND user_profiles.role = 'superadmin'
  )
);

-- Función para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers para actualizar updated_at
CREATE TRIGGER update_featured_category_products_updated_at
BEFORE UPDATE ON featured_category_products
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_home_banner_slides_updated_at
BEFORE UPDATE ON home_banner_slides
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Insertar slide de ejemplo para el banner
INSERT INTO home_banner_slides (title, subtitle, description, image_url, cta_text, cta_link, order_index)
VALUES (
  'Artículos para Cocina y Mesa de la Más Alta Calidad',
  'Calidad Premium desde 1995',
  'Descubre nuestra amplia selección de vajillas, copas, vasos, platos y utensilios para cocina. Elegancia y funcionalidad para tu hogar.',
  '/images/hero-mesa-cocina.jpg',
  'Explorar Productos',
  '/productos',
  1
);

-- Verificar tablas creadas
SELECT 
  'featured_category_products' as table_name,
  COUNT(*) as records
FROM featured_category_products
UNION ALL
SELECT 
  'home_banner_slides' as table_name,
  COUNT(*) as records
FROM home_banner_slides;
