-- Crear tabla de tipos de producto según la arquitectura
CREATE TABLE IF NOT EXISTS product_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subcategory_id UUID NOT NULL REFERENCES subcategories(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  slug TEXT NOT NULL,
  description TEXT,
  order_index INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(subcategory_id, slug)
);

-- Tabla de relación muchos a muchos entre productos y tipos
CREATE TABLE IF NOT EXISTS product_product_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  product_type_id UUID NOT NULL REFERENCES product_types(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(product_id, product_type_id)
);

-- Índices para mejor rendimiento
CREATE INDEX idx_product_types_subcategory ON product_types(subcategory_id);
CREATE INDEX idx_product_types_slug ON product_types(slug);
CREATE INDEX idx_product_product_types_product ON product_product_types(product_id);
CREATE INDEX idx_product_product_types_type ON product_product_types(product_type_id);

-- Trigger para actualizar updated_at
CREATE TRIGGER update_product_types_updated_at
  BEFORE UPDATE ON product_types
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Insertar tipos de producto según la arquitectura web

-- COCINA > Organización
INSERT INTO product_types (subcategory_id, name, slug, order_index)
SELECT id, name, slug, idx FROM (VALUES
  ((SELECT id FROM subcategories WHERE slug = 'organizacion'), 'Contenedores herméticos', 'contenedores-hermeticos', 1),
  ((SELECT id FROM subcategories WHERE slug = 'organizacion'), 'Mantequilleras', 'mantequilleras', 2),
  ((SELECT id FROM subcategories WHERE slug = 'organizacion'), 'Cubierteros', 'cubierteros', 3),
  ((SELECT id FROM subcategories WHERE slug = 'organizacion'), 'Escurridores', 'escurridores', 4),
  ((SELECT id FROM subcategories WHERE slug = 'organizacion'), 'Frascos herméticos', 'frascos-hermeticos', 5),
  ((SELECT id FROM subcategories WHERE slug = 'organizacion'), 'Salero y pimentero', 'salero-pimentero', 6),
  ((SELECT id FROM subcategories WHERE slug = 'organizacion'), 'Aceitera y vinagrera', 'aceitera-vinagrera', 7),
  ((SELECT id FROM subcategories WHERE slug = 'organizacion'), 'Dispensadores', 'dispensadores', 8)
) AS v(id, name, slug, idx) WHERE v.id IS NOT NULL;

-- COCINA > Preparación
INSERT INTO product_types (subcategory_id, name, slug, order_index)
SELECT id, name, slug, idx FROM (VALUES
  ((SELECT id FROM subcategories WHERE slug = 'preparacion'), 'Tazones para mezclar', 'tazones-mezclar', 1),
  ((SELECT id FROM subcategories WHERE slug = 'preparacion'), 'Coladores', 'coladores', 2),
  ((SELECT id FROM subcategories WHERE slug = 'preparacion'), 'Tablas de picar', 'tablas-picar', 3),
  ((SELECT id FROM subcategories WHERE slug = 'preparacion'), 'Moldes', 'moldes', 4),
  ((SELECT id FROM subcategories WHERE slug = 'preparacion'), 'Bowls', 'bowls', 5),
  ((SELECT id FROM subcategories WHERE slug = 'preparacion'), 'Batidores', 'batidores', 6),
  ((SELECT id FROM subcategories WHERE slug = 'preparacion'), 'Ralladores', 'ralladores', 7),
  ((SELECT id FROM subcategories WHERE slug = 'preparacion'), 'Básculas', 'basculas', 8)
) AS v(id, name, slug, idx) WHERE v.id IS NOT NULL;

-- COCINA > Corte y Picado
INSERT INTO product_types (subcategory_id, name, slug, order_index)
SELECT id, name, slug, idx FROM (VALUES
  ((SELECT id FROM subcategories WHERE slug = 'corte'), 'Tabla de cortar', 'tabla-cortar', 1),
  ((SELECT id FROM subcategories WHERE slug = 'corte'), 'Cuchillo de chef', 'cuchillo-chef', 2),
  ((SELECT id FROM subcategories WHERE slug = 'corte'), 'Cuchillo para pan', 'cuchillo-pan', 3),
  ((SELECT id FROM subcategories WHERE slug = 'corte'), 'Tijeras de cocina', 'tijeras-cocina', 4),
  ((SELECT id FROM subcategories WHERE slug = 'corte'), 'Afiladores', 'afiladores', 5)
) AS v(id, name, slug, idx) WHERE v.id IS NOT NULL;

-- COCINA > Para cocinar
INSERT INTO product_types (subcategory_id, name, slug, order_index)
SELECT id, name, slug, idx FROM (VALUES
  ((SELECT id FROM subcategories WHERE slug = 'cocinar'), 'Ollas', 'ollas', 1),
  ((SELECT id FROM subcategories WHERE slug = 'cocinar'), 'Sartenes', 'sartenes', 2),
  ((SELECT id FROM subcategories WHERE slug = 'cocinar'), 'Refractarias', 'refractarias', 3),
  ((SELECT id FROM subcategories WHERE slug = 'cocinar'), 'Cacerolas', 'cacerolas', 4),
  ((SELECT id FROM subcategories WHERE slug = 'cocinar'), 'Pinzas', 'pinzas', 5)
) AS v(id, name, slug, idx) WHERE v.id IS NOT NULL;

-- COCINA > Repostería
INSERT INTO product_types (subcategory_id, name, slug, order_index)
SELECT id, name, slug, idx FROM (VALUES
  ((SELECT id FROM subcategories WHERE slug = 'reposteria'), 'Torteras', 'torteras', 1),
  ((SELECT id FROM subcategories WHERE slug = 'reposteria'), 'Moldes para cupcakes', 'moldes-cupcakes', 2),
  ((SELECT id FROM subcategories WHERE slug = 'reposteria'), 'Rodillos', 'rodillos', 3),
  ((SELECT id FROM subcategories WHERE slug = 'reposteria'), 'Espátulas', 'espatulas', 4),
  ((SELECT id FROM subcategories WHERE slug = 'reposteria'), 'Mangas pasteleras', 'mangas-pasteleras', 5),
  ((SELECT id FROM subcategories WHERE slug = 'reposteria'), 'Batidoras', 'batidoras', 6)
) AS v(id, name, slug, idx) WHERE v.id IS NOT NULL;

-- MESA > Servir
INSERT INTO product_types (subcategory_id, name, slug, order_index)
SELECT id, name, slug, idx FROM (VALUES
  ((SELECT id FROM subcategories WHERE slug = 'servir'), 'Bandejas', 'bandejas', 1),
  ((SELECT id FROM subcategories WHERE slug = 'servir'), 'Cubiertos de servir', 'cubiertos-servir', 2),
  ((SELECT id FROM subcategories WHERE slug = 'servir'), 'Jarras', 'jarras', 3),
  ((SELECT id FROM subcategories WHERE slug = 'servir'), 'Torteras', 'torteras-mesa', 4),
  ((SELECT id FROM subcategories WHERE slug = 'servir'), 'Teteras', 'teteras', 5),
  ((SELECT id FROM subcategories WHERE slug = 'servir'), 'Vinagreras', 'vinagreras', 6),
  ((SELECT id FROM subcategories WHERE slug = 'servir'), 'Aceiteras', 'aceiteras', 7),
  ((SELECT id FROM subcategories WHERE slug = 'servir'), 'Azucareras', 'azucareras', 8)
) AS v(id, name, slug, idx) WHERE v.id IS NOT NULL;

-- MESA > Vajilla
INSERT INTO product_types (subcategory_id, name, slug, order_index)
SELECT id, name, slug, idx FROM (VALUES
  ((SELECT id FROM subcategories WHERE slug = 'vajilla'), 'Platos', 'platos', 1),
  ((SELECT id FROM subcategories WHERE slug = 'vajilla'), 'Tazas y mugs', 'tazas-mugs', 2),
  ((SELECT id FROM subcategories WHERE slug = 'vajilla'), 'Bowls', 'bowls-vajilla', 3),
  ((SELECT id FROM subcategories WHERE slug = 'vajilla'), 'Vajillas completas', 'vajillas-completas', 4),
  ((SELECT id FROM subcategories WHERE slug = 'vajilla'), 'Platos de sitio', 'platos-sitio', 5)
) AS v(id, name, slug, idx) WHERE v.id IS NOT NULL;

-- MESA > Vasos
INSERT INTO product_types (subcategory_id, name, slug, order_index)
SELECT id, name, slug, idx FROM (VALUES
  ((SELECT id FROM subcategories WHERE slug = 'vasos'), 'Vasos agua', 'vasos-agua', 1),
  ((SELECT id FROM subcategories WHERE slug = 'vasos'), 'Copas agua', 'copas-agua-mesa', 2)
) AS v(id, name, slug, idx) WHERE v.id IS NOT NULL;

-- MESA > Cubiertos
INSERT INTO product_types (subcategory_id, name, slug, order_index)
SELECT id, name, slug, idx FROM (VALUES
  ((SELECT id FROM subcategories WHERE slug = 'cubiertos'), 'Cubiertos de mesa', 'cubiertos-mesa', 1),
  ((SELECT id FROM subcategories WHERE slug = 'cubiertos'), 'Sets de cubiertos', 'sets-cubiertos', 2)
) AS v(id, name, slug, idx) WHERE v.id IS NOT NULL;

-- MESA > Ropa de mesa
INSERT INTO product_types (subcategory_id, name, slug, order_index)
SELECT id, name, slug, idx FROM (VALUES
  ((SELECT id FROM subcategories WHERE slug = 'manteleria'), 'Manteles', 'manteles', 1),
  ((SELECT id FROM subcategories WHERE slug = 'manteleria'), 'Caminos de mesa', 'caminos-mesa', 2),
  ((SELECT id FROM subcategories WHERE slug = 'manteleria'), 'Individuales', 'individuales', 3),
  ((SELECT id FROM subcategories WHERE slug = 'manteleria'), 'Servilletas', 'servilletas', 4)
) AS v(id, name, slug, idx) WHERE v.id IS NOT NULL;

-- CAFÉ, TÉ Y BAR > Vasos
INSERT INTO product_types (subcategory_id, name, slug, order_index)
SELECT id, name, slug, idx FROM (VALUES
  ((SELECT id FROM subcategories WHERE slug = 'vasos-bar'), 'Vasos altos', 'vasos-altos', 1),
  ((SELECT id FROM subcategories WHERE slug = 'vasos-bar'), 'Vasos bajos', 'vasos-bajos', 2),
  ((SELECT id FROM subcategories WHERE slug = 'vasos-bar'), 'Vasos aguardienteros', 'vasos-aguardienteros', 3)
) AS v(id, name, slug, idx) WHERE v.id IS NOT NULL;

-- CAFÉ, TÉ Y BAR > Bar
INSERT INTO product_types (subcategory_id, name, slug, order_index)
SELECT id, name, slug, idx FROM (VALUES
  ((SELECT id FROM subcategories WHERE slug = 'bar'), 'Cocteleras', 'cocteleras', 1),
  ((SELECT id FROM subcategories WHERE slug = 'bar'), 'Descorchadores', 'descorchadores', 2),
  ((SELECT id FROM subcategories WHERE slug = 'bar'), 'Hieleras', 'hieleras', 3),
  ((SELECT id FROM subcategories WHERE slug = 'bar'), 'Sets de bar', 'sets-bar', 4)
) AS v(id, name, slug, idx) WHERE v.id IS NOT NULL;

-- TERMOS Y NEVERAS > Termos
INSERT INTO product_types (subcategory_id, name, slug, order_index)
SELECT id, name, slug, idx FROM (VALUES
  ((SELECT id FROM subcategories WHERE slug = 'termos'), 'Termos para frío', 'termos-frio', 1),
  ((SELECT id FROM subcategories WHERE slug = 'termos'), 'Termos para calor', 'termos-calor', 2)
) AS v(id, name, slug, idx) WHERE v.id IS NOT NULL;

-- TERMOS Y NEVERAS > Botellas
INSERT INTO product_types (subcategory_id, name, slug, order_index)
SELECT id, name, slug, idx FROM (VALUES
  ((SELECT id FROM subcategories WHERE slug = 'botellas'), 'Botellas de agua', 'botellas-agua', 1),
  ((SELECT id FROM subcategories WHERE slug = 'botellas'), 'Tomatodos', 'tomatodos', 2)
) AS v(id, name, slug, idx) WHERE v.id IS NOT NULL;
