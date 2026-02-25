-- Tabla de tipos de producto (3er nivel de categorización)
CREATE TABLE IF NOT EXISTS product_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subcategory_id UUID NOT NULL REFERENCES subcategories(id) ON DELETE CASCADE,
  slug TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  order_index INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(subcategory_id, slug)
);

CREATE INDEX IF NOT EXISTS idx_product_types_subcategory ON product_types(subcategory_id);
CREATE INDEX IF NOT EXISTS idx_product_types_slug ON product_types(slug);;
