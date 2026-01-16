-- Crear tabla principal de productos con todos los campos solicitados

CREATE TABLE IF NOT EXISTS products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Campos del listado de productos (ERP)
  pdt_codigo TEXT UNIQUE NOT NULL,  -- Código único del producto
  pdt_descripcion TEXT NOT NULL,    -- Descripción del producto
  pdt_empaque TEXT,                 -- Inner pack (cantidad por unidad)
  upp_existencia DECIMAL(10, 2) DEFAULT 0,  -- Disponibilidad en inventario (TOTAL)
  
  -- Campos adicionales del ERP
  upp_costou DECIMAL(10, 2),        -- Costo unitario
  upp_costop DECIMAL(10, 2),        -- Costo precio
  valorinv DECIMAL(10, 2),          -- Valor del inventario
  
  -- Se eliminan: ugr_exis, ugr_ex1, ugr_ex2, ugr_ex3, ugr_ex4
  -- Ahora se gestionan en la tabla product_warehouse_stock
  
  ubicacion TEXT,                   -- Ubicación física general
  
  -- Campos del catálogo web
  precio DECIMAL(10, 2),            -- Precio de venta al público
  nombre_comercial TEXT,            -- Nombre comercial para la web
  descripcion_larga TEXT,           -- Descripción detallada del producto
  caracteristicas TEXT,             -- Características adicionales
  especificaciones_tecnicas JSONB,  -- Detalles técnicos en formato JSON
  
  -- Campos para gestión de inventario
  reposicion_cuando TEXT,           -- Cuándo reponer (por ahora en blanco)
  reposicion_cuanto INTEGER,        -- Cuánto reponer (por ahora en blanco)
  outer_pack INTEGER,               -- Outer pack (por ahora en blanco)
  pertenece_coleccion BOOLEAN DEFAULT FALSE, -- Si pertenece a una colección
  nombre_coleccion TEXT,            -- Nombre de la colección
  
  -- SEO
  slug TEXT UNIQUE,                 -- URL amigable
  seo_title TEXT,
  seo_description TEXT,
  seo_keywords TEXT[],
  
  -- Estado y visibilidad
  is_active BOOLEAN DEFAULT TRUE,
  is_featured BOOLEAN DEFAULT FALSE,
  is_new BOOLEAN DEFAULT FALSE,
  is_on_sale BOOLEAN DEFAULT FALSE,
  
  -- Imágenes (una principal)
  imagen_principal_url TEXT,
  
  -- Metadatos
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID,
  updated_by UUID
);

-- Tabla para relacionar productos con categorías (muchos a muchos)
CREATE TABLE IF NOT EXISTS product_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  subcategory_id UUID NOT NULL REFERENCES subcategories(id) ON DELETE CASCADE,
  is_primary BOOLEAN DEFAULT FALSE, -- Indica si es la categoría principal del producto
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(product_id, subcategory_id)
);

-- Tabla para imágenes y videos adicionales de productos
CREATE TABLE IF NOT EXISTS product_media (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  media_type TEXT NOT NULL CHECK (media_type IN ('image', 'video')),
  url TEXT NOT NULL,
  thumbnail_url TEXT,  -- Para videos
  title TEXT,
  alt_text TEXT,
  order_index INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabla para productos similares (recomendaciones)
CREATE TABLE IF NOT EXISTS product_similar (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  similar_product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  order_index INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  CHECK (product_id != similar_product_id),
  UNIQUE(product_id, similar_product_id)
);

-- Tabla para productos complementarios
CREATE TABLE IF NOT EXISTS product_complement (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  complement_product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  order_index INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  CHECK (product_id != complement_product_id),
  UNIQUE(product_id, complement_product_id)
);

-- Crear índices para mejorar el rendimiento
CREATE INDEX idx_products_pdt_codigo ON products(pdt_codigo);
CREATE INDEX idx_products_slug ON products(slug);
CREATE INDEX idx_products_is_active ON products(is_active);
CREATE INDEX idx_products_is_featured ON products(is_featured);
CREATE INDEX idx_products_precio ON products(precio);
CREATE INDEX idx_product_categories_product_id ON product_categories(product_id);
CREATE INDEX idx_product_categories_subcategory_id ON product_categories(subcategory_id);
CREATE INDEX idx_product_media_product_id ON product_media(product_id);
CREATE INDEX idx_product_similar_product_id ON product_similar(product_id);
CREATE INDEX idx_product_complement_product_id ON product_complement(product_id);

-- Función para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para actualizar updated_at en products
CREATE TRIGGER update_products_updated_at
  BEFORE UPDATE ON products
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Trigger para actualizar updated_at en product_media
CREATE TRIGGER update_product_media_updated_at
  BEFORE UPDATE ON product_media
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
