-- Insertar productos ficticios para pruebas del sistema de filtrado por tipos

-- PRODUCTOS DE COCINA > ORGANIZACIÓN

-- Contenedores herméticos
INSERT INTO products (pdt_codigo, pdt_descripcion, nombre_comercial, descripcion_larga, precio, upp_existencia, slug, is_active)
VALUES 
  ('CONT-001', 'Contenedor hermético 1L', 'Contenedor Hermético Redondo 1L', 'Contenedor hermético de plástico ideal para almacenar alimentos frescos. Libre de BPA.', 25900, 45, 'contenedor-hermetico-1l', true),
  ('CONT-002', 'Contenedor hermético 2L', 'Contenedor Hermético Rectangular 2L', 'Contenedor grande perfecto para guardar sobras. Apto para microondas y lavavajillas.', 35900, 32, 'contenedor-hermetico-2l', true);

-- Mantequilleras
INSERT INTO products (pdt_codigo, pdt_descripcion, nombre_comercial, descripcion_larga, precio, upp_existencia, slug, is_active)
VALUES 
  ('MANT-001', 'Mantequillera cerámica', 'Mantequillera de Cerámica Blanca', 'Mantequillera elegante con tapa hermética. Mantiene la mantequilla fresca.', 29900, 28, 'mantequillera-ceramica', true);

-- Frascos herméticos
INSERT INTO products (pdt_codigo, pdt_descripcion, nombre_comercial, descripcion_larga, precio, upp_existencia, slug, is_active)
VALUES 
  ('FRAS-001', 'Set 3 frascos vidrio', 'Set de Frascos de Vidrio con Tapa Hermética', 'Set de 3 frascos de vidrio para almacenar especias, granos y más.', 45900, 18, 'set-frascos-vidrio', true);

-- PRODUCTOS DE COCINA > REPOSTERÍA

-- Torteras
INSERT INTO products (pdt_codigo, pdt_descripcion, nombre_comercial, descripcion_larga, precio, upp_existencia, slug, is_active)
VALUES 
  ('TORT-001', 'Tortera desmoldable 24cm', 'Tortera Desmoldable Antiadherente 24cm', 'Tortera perfecta para pasteles. Base desmoldable para fácil extracción.', 38900, 22, 'tortera-desmoldable-24cm', true),
  ('TORT-002', 'Tortera redonda 26cm', 'Tortera Redonda Aluminio 26cm', 'Tortera de aluminio de alta calidad con recubrimiento antiadherente.', 32900, 30, 'tortera-redonda-26cm', true);

-- Moldes para cupcakes
INSERT INTO products (pdt_codigo, pdt_descripcion, nombre_comercial, descripcion_larga, precio, upp_existencia, slug, is_active)
VALUES 
  ('CUPC-001', 'Molde 12 cupcakes', 'Molde para 12 Cupcakes Antiadherente', 'Molde para hornear 12 cupcakes perfectos. Recubrimiento antiadherente.', 27900, 35, 'molde-12-cupcakes', true);

-- PRODUCTOS DE MESA > SERVIR

-- Bandejas
INSERT INTO products (pdt_codigo, pdt_descripcion, nombre_comercial, descripcion_larga, precio, upp_existencia, slug, is_active)
VALUES 
  ('BAND-001', 'Bandeja acero inox', 'Bandeja de Servir Acero Inoxidable', 'Bandeja rectangular elegante para servir. Acero inoxidable pulido.', 48900, 15, 'bandeja-acero-inox', true);

-- Teteras
INSERT INTO products (pdt_codigo, pdt_descripcion, nombre_comercial, descripcion_larga, precio, upp_existencia, slug, is_active)
VALUES 
  ('TET-001', 'Tetera vidrio 1L', 'Tetera de Vidrio con Infusor 1L', 'Tetera de vidrio borosilicato con infusor de acero inoxidable.', 52900, 20, 'tetera-vidrio-1l', true),
  ('TET-002', 'Tetera cerámica 800ml', 'Tetera de Cerámica Japonesa 800ml', 'Tetera tradicional de cerámica con acabado artesanal.', 68900, 12, 'tetera-ceramica-800ml', true);

-- Torteras (para servir)
INSERT INTO products (pdt_codigo, pdt_descripcion, nombre_comercial, descripcion_larga, precio, upp_existencia, slug, is_active)
VALUES 
  ('TORT-S01', 'Tortera con cúpula', 'Tortera de Vidrio con Cúpula', 'Tortera elegante para presentar y servir pasteles. Base de cerámica.', 75900, 8, 'tortera-vidrio-cupula', true);

-- Jarras
INSERT INTO products (pdt_codigo, pdt_descripcion, nombre_comercial, descripcion_larga, precio, upp_existencia, slug, is_active)
VALUES 
  ('JARR-001', 'Jarra vidrio 1.5L', 'Jarra de Vidrio para Agua 1.5L', 'Jarra de vidrio transparente con tapa. Ideal para servir agua o jugos.', 32900, 25, 'jarra-vidrio-1-5l', true);

-- PRODUCTOS DE MESA > VAJILLA

-- Platos
INSERT INTO products (pdt_codigo, pdt_descripcion, nombre_comercial, descripcion_larga, precio, upp_existencia, slug, is_active)
VALUES 
  ('PLAT-001', 'Plato hondo porcelana', 'Plato Hondo de Porcelana Blanca', 'Plato hondo de porcelana de alta calidad. Apto para lavavajillas.', 18900, 40, 'plato-hondo-porcelana', true),
  ('PLAT-002', 'Plato plano 27cm', 'Plato Plano de Cerámica 27cm', 'Plato plano versátil para toda ocasión. Diseño clásico.', 16900, 50, 'plato-plano-27cm', true);

-- Tazas y mugs
INSERT INTO products (pdt_codigo, pdt_descripcion, nombre_comercial, descripcion_larga, precio, upp_existencia, slug, is_active)
VALUES 
  ('TAZA-001', 'Taza cerámica 350ml', 'Taza de Cerámica con Asa 350ml', 'Taza de cerámica resistente. Perfecta para café o té.', 14900, 60, 'taza-ceramica-350ml', true);

-- PRODUCTOS DE CAFÉ, TÉ Y BAR > COPAS VINO

INSERT INTO products (pdt_codigo, pdt_descripcion, nombre_comercial, descripcion_larga, precio, upp_existencia, slug, is_active)
VALUES 
  ('COPA-V01', 'Copa vino tinto', 'Copa para Vino Tinto Cristal', 'Copa de cristal elegante para vino tinto. Set de 6 unidades.', 89900, 15, 'copa-vino-tinto', true),
  ('COPA-V02', 'Copa vino blanco', 'Copa para Vino Blanco Cristal', 'Copa de cristal para vino blanco. Diseño clásico.', 79900, 18, 'copa-vino-blanco', true);

-- PRODUCTOS DE CAFÉ, TÉ Y BAR > BAR

-- Cocteleras
INSERT INTO products (pdt_codigo, pdt_descripcion, nombre_comercial, descripcion_larga, precio, upp_existencia, slug, is_active)
VALUES 
  ('COCT-001', 'Coctelera acero 750ml', 'Coctelera Profesional de Acero Inoxidable', 'Coctelera de 3 piezas en acero inoxidable. Perfecta para preparar cócteles.', 45900, 22, 'coctelera-acero-750ml', true);

-- PRODUCTOS DE TERMOS > TERMOS

-- Termos para calor
INSERT INTO products (pdt_codigo, pdt_descripcion, nombre_comercial, descripcion_larga, precio, upp_existencia, slug, is_active)
VALUES 
  ('TERM-C01', 'Termo acero 500ml', 'Termo de Acero Inoxidable 500ml', 'Termo que mantiene bebidas calientes por 12 horas. Aislamiento al vacío.', 54900, 28, 'termo-acero-500ml', true);

-- Ahora asignar los productos a sus tipos correspondientes

-- Contenedores herméticos
INSERT INTO product_product_types (product_id, product_type_id)
SELECT p.id, pt.id
FROM products p
CROSS JOIN product_types pt
WHERE p.pdt_codigo IN ('CONT-001', 'CONT-002')
  AND pt.slug = 'contenedores-hermeticos';

-- Mantequilleras
INSERT INTO product_product_types (product_id, product_type_id)
SELECT p.id, pt.id
FROM products p
CROSS JOIN product_types pt
WHERE p.pdt_codigo = 'MANT-001'
  AND pt.slug = 'mantequilleras';

-- Frascos herméticos
INSERT INTO product_product_types (product_id, product_type_id)
SELECT p.id, pt.id
FROM products p
CROSS JOIN product_types pt
WHERE p.pdt_codigo = 'FRAS-001'
  AND pt.slug = 'frascos-hermeticos';

-- Torteras (repostería)
INSERT INTO product_product_types (product_id, product_type_id)
SELECT p.id, pt.id
FROM products p
CROSS JOIN product_types pt
WHERE p.pdt_codigo IN ('TORT-001', 'TORT-002')
  AND pt.slug = 'torteras';

-- Moldes para cupcakes
INSERT INTO product_product_types (product_id, product_type_id)
SELECT p.id, pt.id
FROM products p
CROSS JOIN product_types pt
WHERE p.pdt_codigo = 'CUPC-001'
  AND pt.slug = 'moldes-cupcakes';

-- Bandejas
INSERT INTO product_product_types (product_id, product_type_id)
SELECT p.id, pt.id
FROM products p
CROSS JOIN product_types pt
WHERE p.pdt_codigo = 'BAND-001'
  AND pt.slug = 'bandejas';

-- Teteras
INSERT INTO product_product_types (product_id, product_type_id)
SELECT p.id, pt.id
FROM products p
CROSS JOIN product_types pt
WHERE p.pdt_codigo IN ('TET-001', 'TET-002')
  AND pt.slug = 'teteras';

-- Torteras (mesa/servir)
INSERT INTO product_product_types (product_id, product_type_id)
SELECT p.id, pt.id
FROM products p
CROSS JOIN product_types pt
WHERE p.pdt_codigo = 'TORT-S01'
  AND pt.slug = 'torteras-mesa';

-- Jarras
INSERT INTO product_product_types (product_id, product_type_id)
SELECT p.id, pt.id
FROM products p
CROSS JOIN product_types pt
WHERE p.pdt_codigo = 'JARR-001'
  AND pt.slug = 'jarras';

-- Platos
INSERT INTO product_product_types (product_id, product_type_id)
SELECT p.id, pt.id
FROM products p
CROSS JOIN product_types pt
WHERE p.pdt_codigo IN ('PLAT-001', 'PLAT-002')
  AND pt.slug = 'platos';

-- Tazas y mugs
INSERT INTO product_product_types (product_id, product_type_id)
SELECT p.id, pt.id
FROM products p
CROSS JOIN product_types pt
WHERE p.pdt_codigo = 'TAZA-001'
  AND pt.slug = 'tazas-mugs';

-- Cocteleras
INSERT INTO product_product_types (product_id, product_type_id)
SELECT p.id, pt.id
FROM products p
CROSS JOIN product_types pt
WHERE p.pdt_codigo = 'COCT-001'
  AND pt.slug = 'cocteleras';

-- Termos para calor
INSERT INTO product_product_types (product_id, product_type_id)
SELECT p.id, pt.id
FROM products p
CROSS JOIN product_types pt
WHERE p.pdt_codigo = 'TERM-C01'
  AND pt.slug = 'termos-calor';

-- Asignar productos a sus subcategorías correspondientes

-- COCINA > Organización
INSERT INTO product_categories (product_id, subcategory_id, is_primary)
SELECT p.id, s.id, true
FROM products p
CROSS JOIN subcategories s
WHERE p.pdt_codigo IN ('CONT-001', 'CONT-002', 'MANT-001', 'FRAS-001')
  AND s.slug = 'organizacion';

-- COCINA > Repostería
INSERT INTO product_categories (product_id, subcategory_id, is_primary)
SELECT p.id, s.id, true
FROM products p
CROSS JOIN subcategories s
WHERE p.pdt_codigo IN ('TORT-001', 'TORT-002', 'CUPC-001')
  AND s.slug = 'reposteria';

-- MESA > Servir
INSERT INTO product_categories (product_id, subcategory_id, is_primary)
SELECT p.id, s.id, true
FROM products p
CROSS JOIN subcategories s
WHERE p.pdt_codigo IN ('BAND-001', 'TET-001', 'TET-002', 'TORT-S01', 'JARR-001')
  AND s.slug = 'servir';

-- MESA > Vajilla
INSERT INTO product_categories (product_id, subcategory_id, is_primary)
SELECT p.id, s.id, true
FROM products p
CROSS JOIN subcategories s
WHERE p.pdt_codigo IN ('PLAT-001', 'PLAT-002', 'TAZA-001')
  AND s.slug = 'vajilla';

-- CAFÉ, TÉ Y BAR > Copas Vino
INSERT INTO product_categories (product_id, subcategory_id, is_primary)
SELECT p.id, s.id, true
FROM products p
CROSS JOIN subcategories s
WHERE p.pdt_codigo IN ('COPA-V01', 'COPA-V02')
  AND s.slug = 'copas-vino';

-- CAFÉ, TÉ Y BAR > Bar
INSERT INTO product_categories (product_id, subcategory_id, is_primary)
SELECT p.id, s.id, true
FROM products p
CROSS JOIN subcategories s
WHERE p.pdt_codigo = 'COCT-001'
  AND s.slug = 'bar';

-- TERMOS > Termos
INSERT INTO product_categories (product_id, subcategory_id, is_primary)
SELECT p.id, s.id, true
FROM products p
CROSS JOIN subcategories s
WHERE p.pdt_codigo = 'TERM-C01'
  AND s.slug = 'termos';
