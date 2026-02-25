-- Índices para nuevos campos de productos
CREATE INDEX IF NOT EXISTS idx_products_codigo_barras ON products(codigo_barras);
CREATE INDEX IF NOT EXISTS idx_products_descontinuado ON products(descontinuado);
CREATE INDEX IF NOT EXISTS idx_products_product_type ON products(product_type_id);
CREATE INDEX IF NOT EXISTS idx_products_rotacion ON products(rotacion_esperada);
CREATE INDEX IF NOT EXISTS idx_products_descuento ON products(descuento_porcentaje) WHERE descuento_porcentaje > 0;
CREATE INDEX IF NOT EXISTS idx_products_tags ON products USING GIN(tags);;
