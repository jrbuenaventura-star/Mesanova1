
-- Agregar campo ref_pub para referencia pública/comercial
ALTER TABLE products 
ADD COLUMN IF NOT EXISTS ref_pub TEXT;

-- Agregar campo horeca con check constraint para valores válidos
ALTER TABLE products 
ADD COLUMN IF NOT EXISTS horeca VARCHAR(10) DEFAULT 'NO';

-- Agregar constraint para validar valores de horeca
ALTER TABLE products 
ADD CONSTRAINT products_horeca_check 
CHECK (horeca IN ('NO', 'EXCLUSIVO', 'SI'));

-- Crear índice para búsquedas por horeca (útil para filtrar productos HoReCa)
CREATE INDEX IF NOT EXISTS idx_products_horeca ON products(horeca);

-- Comentarios para documentación
COMMENT ON COLUMN products.ref_pub IS 'Referencia pública/comercial del producto';
COMMENT ON COLUMN products.horeca IS 'Visibilidad HoReCa: NO=solo retail, SI=retail+HoReCa, EXCLUSIVO=solo HoReCa';
;
