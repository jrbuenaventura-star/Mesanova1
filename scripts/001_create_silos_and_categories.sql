-- Crear estructura de silos temáticos y subcategorías según arquitectura confirmada

-- Tabla de silos temáticos (5 silos principales)
CREATE TABLE IF NOT EXISTS silos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  seo_title TEXT,
  seo_description TEXT,
  order_index INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabla de subcategorías
CREATE TABLE IF NOT EXISTS subcategories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  silo_id UUID NOT NULL REFERENCES silos(id) ON DELETE CASCADE,
  slug TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  seo_title TEXT,
  seo_description TEXT,
  order_index INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(silo_id, slug)
);

-- Insertar los 5 silos temáticos
INSERT INTO silos (slug, name, description, order_index) VALUES
('cocina', 'Cocina', 'Productos para cocinar y preparar alimentos', 1),
('mesa', 'Mesa', 'Productos para servir y decorar la mesa', 2),
('cafe-te-bar', 'Café, té y Bar', 'Productos para bebidas, bar y café', 3),
('termos-neveras', 'Termos y Neveras portátiles', 'Termos, neveras y botellas portátiles', 4),
('profesional', 'HoReCa', 'Productos para hoteles, restaurantes y cafeterías', 5);

-- Insertar subcategorías para COCINA
INSERT INTO subcategories (silo_id, slug, name, order_index)
SELECT id, 'organizacion', 'Organización', 1 FROM silos WHERE slug = 'cocina'
UNION ALL
SELECT id, 'preparacion', 'Preparación', 2 FROM silos WHERE slug = 'cocina'
UNION ALL
SELECT id, 'corte-picado', 'Corte y Picado', 3 FROM silos WHERE slug = 'cocina'
UNION ALL
SELECT id, 'para-cocinar', 'Para cocinar', 4 FROM silos WHERE slug = 'cocina'
UNION ALL
SELECT id, 'reposteria', 'Repostería', 5 FROM silos WHERE slug = 'cocina';

-- Insertar subcategorías para MESA
INSERT INTO subcategories (silo_id, slug, name, order_index)
SELECT id, 'servir', 'Servir', 1 FROM silos WHERE slug = 'mesa'
UNION ALL
SELECT id, 'vajilla', 'Vajilla', 2 FROM silos WHERE slug = 'mesa'
UNION ALL
SELECT id, 'vajilla-temporada', 'Vajilla temporada', 3 FROM silos WHERE slug = 'mesa'
UNION ALL
SELECT id, 'vasos', 'Vasos', 4 FROM silos WHERE slug = 'mesa'
UNION ALL
SELECT id, 'decoracion-accesorios', 'Decoración y Accesorios', 5 FROM silos WHERE slug = 'mesa'
UNION ALL
SELECT id, 'cubiertos', 'Cubiertos', 6 FROM silos WHERE slug = 'mesa'
UNION ALL
SELECT id, 'ropa-mesa', 'Ropa de mesa', 7 FROM silos WHERE slug = 'mesa';

-- Insertar subcategorías para CAFÉ, TÉ Y BAR
INSERT INTO subcategories (silo_id, slug, name, order_index)
SELECT id, 'vasos', 'Vasos', 1 FROM silos WHERE slug = 'cafe-te-bar'
UNION ALL
SELECT id, 'copas-vino', 'Copas Vino', 2 FROM silos WHERE slug = 'cafe-te-bar'
UNION ALL
SELECT id, 'copas-agua', 'Copas Agua', 3 FROM silos WHERE slug = 'cafe-te-bar'
UNION ALL
SELECT id, 'copas-champana', 'Copas Champaña', 4 FROM silos WHERE slug = 'cafe-te-bar'
UNION ALL
SELECT id, 'otras-copas', 'Otras Copas', 5 FROM silos WHERE slug = 'cafe-te-bar'
UNION ALL
SELECT id, 'bar', 'Bar', 6 FROM silos WHERE slug = 'cafe-te-bar'
UNION ALL
SELECT id, 'cafe', 'Café', 7 FROM silos WHERE slug = 'cafe-te-bar'
UNION ALL
SELECT id, 'te', 'Té', 8 FROM silos WHERE slug = 'cafe-te-bar';

-- Insertar subcategorías para TERMOS Y NEVERAS
INSERT INTO subcategories (silo_id, slug, name, order_index)
SELECT id, 'termos', 'Termos', 1 FROM silos WHERE slug = 'termos-neveras'
UNION ALL
SELECT id, 'neveras', 'Neveras', 2 FROM silos WHERE slug = 'termos-neveras'
UNION ALL
SELECT id, 'botellas-botilitos', 'Botellas y Botilitos', 3 FROM silos WHERE slug = 'termos-neveras';

-- Insertar subcategorías para PROFESIONAL
INSERT INTO subcategories (silo_id, slug, name, order_index)
SELECT id, 'preparacion-utensilios', 'Preparación y Utensilios', 1 FROM silos WHERE slug = 'profesional'
UNION ALL
SELECT id, 'servir-vajilla', 'Servir y Vajilla', 2 FROM silos WHERE slug = 'profesional';

-- Crear índices para mejorar rendimiento
CREATE INDEX idx_subcategories_silo_id ON subcategories(silo_id);
CREATE INDEX idx_silos_slug ON silos(slug);
CREATE INDEX idx_subcategories_slug ON subcategories(slug);
