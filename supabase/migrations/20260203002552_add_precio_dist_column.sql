-- Add precio_dist column for distributor pricing
ALTER TABLE public.products
ADD COLUMN precio_dist numeric DEFAULT NULL;

COMMENT ON COLUMN public.products.precio_dist IS 'Precio base para distribuidores (antes de aplicar descuento del distribuidor)';
;
