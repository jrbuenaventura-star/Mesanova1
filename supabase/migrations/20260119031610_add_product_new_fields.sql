-- Nuevos campos en productos
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='products' AND column_name='codigo_barras') THEN
    ALTER TABLE products ADD COLUMN codigo_barras VARCHAR(100);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='products' AND column_name='descuento_porcentaje') THEN
    ALTER TABLE products ADD COLUMN descuento_porcentaje DECIMAL(5,2) DEFAULT 0;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='products' AND column_name='precio_antes') THEN
    ALTER TABLE products ADD COLUMN precio_antes DECIMAL(12,2);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='products' AND column_name='pedido_en_camino') THEN
    ALTER TABLE products ADD COLUMN pedido_en_camino BOOLEAN DEFAULT false;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='products' AND column_name='descontinuado') THEN
    ALTER TABLE products ADD COLUMN descontinuado BOOLEAN DEFAULT false;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='products' AND column_name='product_type_id') THEN
    ALTER TABLE products ADD COLUMN product_type_id UUID REFERENCES product_types(id);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='products' AND column_name='momentos_uso') THEN
    ALTER TABLE products ADD COLUMN momentos_uso TEXT;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='products' AND column_name='descripcion_distribuidor') THEN
    ALTER TABLE products ADD COLUMN descripcion_distribuidor TEXT;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='products' AND column_name='argumentos_venta') THEN
    ALTER TABLE products ADD COLUMN argumentos_venta TEXT;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='products' AND column_name='ubicacion_tienda') THEN
    ALTER TABLE products ADD COLUMN ubicacion_tienda TEXT;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='products' AND column_name='margen_sugerido') THEN
    ALTER TABLE products ADD COLUMN margen_sugerido DECIMAL(5,2);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='products' AND column_name='rotacion_esperada') THEN
    ALTER TABLE products ADD COLUMN rotacion_esperada VARCHAR(20) CHECK (rotacion_esperada IN ('alta', 'media', 'baja'));
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='products' AND column_name='tags') THEN
    ALTER TABLE products ADD COLUMN tags TEXT[];
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='products' AND column_name='video_url') THEN
    ALTER TABLE products ADD COLUMN video_url TEXT;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='products' AND column_name='ficha_tecnica_url') THEN
    ALTER TABLE products ADD COLUMN ficha_tecnica_url TEXT;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='products' AND column_name='fecha_lanzamiento') THEN
    ALTER TABLE products ADD COLUMN fecha_lanzamiento DATE;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='products' AND column_name='productos_afines_csv') THEN
    ALTER TABLE products ADD COLUMN productos_afines_csv TEXT;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='products' AND column_name='last_erp_sync') THEN
    ALTER TABLE products ADD COLUMN last_erp_sync TIMESTAMPTZ;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='products' AND column_name='last_csv_update') THEN
    ALTER TABLE products ADD COLUMN last_csv_update TIMESTAMPTZ;
  END IF;
END $$;;
