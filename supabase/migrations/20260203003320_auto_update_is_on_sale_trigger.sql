-- Trigger to automatically update is_on_sale when descuento_porcentaje changes
-- This ensures products are automatically published/unpublished from Ofertas

CREATE OR REPLACE FUNCTION update_is_on_sale()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
BEGIN
  -- Set is_on_sale based on descuento_porcentaje
  NEW.is_on_sale := COALESCE(NEW.descuento_porcentaje, 0) > 0;
  RETURN NEW;
END;
$$;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS trigger_update_is_on_sale ON public.products;

-- Create trigger for INSERT and UPDATE
CREATE TRIGGER trigger_update_is_on_sale
  BEFORE INSERT OR UPDATE OF descuento_porcentaje
  ON public.products
  FOR EACH ROW
  EXECUTE FUNCTION update_is_on_sale();

COMMENT ON FUNCTION update_is_on_sale() IS 'Automatically sets is_on_sale=true when descuento_porcentaje > 0, false otherwise';
;
