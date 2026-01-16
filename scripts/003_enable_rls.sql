-- Habilitar Row Level Security para proteger los datos

-- Habilitar RLS en todas las tablas
ALTER TABLE silos ENABLE ROW LEVEL SECURITY;
ALTER TABLE subcategories ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_media ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_similar ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_complement ENABLE ROW LEVEL SECURITY;

-- Políticas para SILOS (lectura pública, escritura solo autenticados)
CREATE POLICY "silos_public_read" ON silos
  FOR SELECT
  USING (true);

CREATE POLICY "silos_authenticated_write" ON silos
  FOR ALL
  USING (auth.role() = 'authenticated');

-- Políticas para SUBCATEGORIES (lectura pública, escritura solo autenticados)
CREATE POLICY "subcategories_public_read" ON subcategories
  FOR SELECT
  USING (true);

CREATE POLICY "subcategories_authenticated_write" ON subcategories
  FOR ALL
  USING (auth.role() = 'authenticated');

-- Políticas para PRODUCTS (lectura pública solo productos activos, escritura autenticados)
CREATE POLICY "products_public_read_active" ON products
  FOR SELECT
  USING (is_active = true);

CREATE POLICY "products_authenticated_read_all" ON products
  FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "products_authenticated_write" ON products
  FOR ALL
  USING (auth.role() = 'authenticated');

-- Políticas para PRODUCT_CATEGORIES (lectura pública, escritura autenticados)
CREATE POLICY "product_categories_public_read" ON product_categories
  FOR SELECT
  USING (true);

CREATE POLICY "product_categories_authenticated_write" ON product_categories
  FOR ALL
  USING (auth.role() = 'authenticated');

-- Políticas para PRODUCT_MEDIA (lectura pública, escritura autenticados)
CREATE POLICY "product_media_public_read" ON product_media
  FOR SELECT
  USING (true);

CREATE POLICY "product_media_authenticated_write" ON product_media
  FOR ALL
  USING (auth.role() = 'authenticated');

-- Políticas para PRODUCT_SIMILAR (lectura pública, escritura autenticados)
CREATE POLICY "product_similar_public_read" ON product_similar
  FOR SELECT
  USING (true);

CREATE POLICY "product_similar_authenticated_write" ON product_similar
  FOR ALL
  USING (auth.role() = 'authenticated');

-- Políticas para PRODUCT_COMPLEMENT (lectura pública, escritura autenticados)
CREATE POLICY "product_complement_public_read" ON product_complement
  FOR SELECT
  USING (true);

CREATE POLICY "product_complement_authenticated_write" ON product_complement
  FOR ALL
  USING (auth.role() = 'authenticated');
