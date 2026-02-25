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

CREATE INDEX idx_home_banner_slides_active ON home_banner_slides(is_active);
CREATE INDEX idx_home_banner_slides_order ON home_banner_slides(order_index);

ALTER TABLE featured_category_products ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active featured products"
ON featured_category_products FOR SELECT
TO public
USING (is_active = true);

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

ALTER TABLE home_banner_slides ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active banner slides"
ON home_banner_slides FOR SELECT
TO public
USING (is_active = true);

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

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_featured_category_products_updated_at
BEFORE UPDATE ON featured_category_products
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_home_banner_slides_updated_at
BEFORE UPDATE ON home_banner_slides
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

INSERT INTO home_banner_slides (title, subtitle, description, image_url, cta_text, cta_link, order_index)
VALUES (
  'Artículos para Cocina y Mesa de la Más Alta Calidad',
  'Calidad Premium desde 1995',
  'Descubre nuestra amplia selección de vajillas, copas, vasos, platos y utensilios para cocina. Elegancia y funcionalidad para tu hogar.',
  '/images/hero-mesa-cocina.jpg',
  'Explorar Productos',
  '/productos',
  1
);;
