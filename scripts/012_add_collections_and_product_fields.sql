-- Crear tabla de colecciones
CREATE TABLE IF NOT EXISTS collections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  imagen_url TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  order_index INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Agregar campos faltantes a la tabla products si no existen
ALTER TABLE products 
  ADD COLUMN IF NOT EXISTS collection_id UUID REFERENCES collections(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS material TEXT,
  ADD COLUMN IF NOT EXISTS color TEXT,
  ADD COLUMN IF NOT EXISTS dimensiones TEXT,
  ADD COLUMN IF NOT EXISTS peso DECIMAL(10, 2),
  ADD COLUMN IF NOT EXISTS capacidad TEXT,
  ADD COLUMN IF NOT EXISTS fecha_reposicion DATE,
  ADD COLUMN IF NOT EXISTS cantidad_reposicion INTEGER,
  ADD COLUMN IF NOT EXISTS instrucciones_uso TEXT,
  ADD COLUMN IF NOT EXISTS instrucciones_cuidado TEXT,
  ADD COLUMN IF NOT EXISTS garantia TEXT,
  ADD COLUMN IF NOT EXISTS pais_origen TEXT,
  ADD COLUMN IF NOT EXISTS marca TEXT,
  ADD COLUMN IF NOT EXISTS linea_producto TEXT;

-- Índices para collections
CREATE INDEX IF NOT EXISTS idx_collections_slug ON collections(slug);
CREATE INDEX IF NOT EXISTS idx_collections_is_active ON collections(is_active);
CREATE INDEX IF NOT EXISTS idx_products_collection_id ON products(collection_id);

-- Trigger para actualizar updated_at en collections
DROP TRIGGER IF EXISTS update_collections_updated_at ON collections;
CREATE TRIGGER update_collections_updated_at
  BEFORE UPDATE ON collections
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Insertar algunas colecciones de ejemplo
INSERT INTO collections (name, slug, description, is_active, order_index) VALUES
('Básicos', 'basicos', 'Productos esenciales para el hogar', true, 1),
('Premium', 'premium', 'Línea premium de productos de alta calidad', true, 2),
('Eco-Friendly', 'eco-friendly', 'Productos ecológicos y sostenibles', true, 3),
('Chef Professional', 'chef-professional', 'Herramientas profesionales para chefs', true, 4)
ON CONFLICT (slug) DO NOTHING;
