
ALTER TABLE products
ADD COLUMN desc_dist numeric DEFAULT 0;

COMMENT ON COLUMN products.desc_dist IS 'Descuento distribuidor por producto (%). Aplica a todos los distribuidores sobre precio_dist después del descuento del distribuidor.';
;
