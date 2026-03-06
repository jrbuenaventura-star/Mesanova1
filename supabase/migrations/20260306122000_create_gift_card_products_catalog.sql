-- Catalog of gift card products sold in storefront (/bonos/comprar).

CREATE TABLE IF NOT EXISTS public.gift_card_products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  amount NUMERIC(10,2) NOT NULL CHECK (amount > 0),
  image_url TEXT,
  allow_custom_amount BOOLEAN NOT NULL DEFAULT FALSE,
  min_custom_amount NUMERIC(10,2) NOT NULL DEFAULT 10000 CHECK (min_custom_amount > 0),
  max_custom_amount NUMERIC(10,2),
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT gift_card_products_custom_amount_bounds CHECK (
    max_custom_amount IS NULL OR max_custom_amount >= min_custom_amount
  )
);

CREATE INDEX IF NOT EXISTS idx_gift_card_products_active_order
  ON public.gift_card_products(is_active, sort_order, created_at DESC);

CREATE OR REPLACE FUNCTION public.set_gift_card_products_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public, pg_catalog
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_gift_card_products_updated_at ON public.gift_card_products;
CREATE TRIGGER trg_gift_card_products_updated_at
  BEFORE UPDATE ON public.gift_card_products
  FOR EACH ROW
  EXECUTE FUNCTION public.set_gift_card_products_updated_at();

ALTER TABLE public.gift_card_products ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can view active gift card products" ON public.gift_card_products;
CREATE POLICY "Public can view active gift card products"
  ON public.gift_card_products
  FOR SELECT
  USING (is_active = TRUE);

DROP POLICY IF EXISTS "Superadmin can manage gift card products" ON public.gift_card_products;
CREATE POLICY "Superadmin can manage gift card products"
  ON public.gift_card_products
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.user_profiles
      WHERE user_profiles.id = auth.uid()
        AND user_profiles.role = 'superadmin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.user_profiles
      WHERE user_profiles.id = auth.uid()
        AND user_profiles.role = 'superadmin'
    )
  );

INSERT INTO public.gift_card_products (
  name,
  slug,
  description,
  amount,
  sort_order,
  is_active
)
SELECT *
FROM (
  VALUES
    ('Bono Regalo $50.000', 'bono-50000', 'Ideal para detalles y obsequios rápidos.', 50000::numeric, 10, TRUE),
    ('Bono Regalo $100.000', 'bono-100000', 'Perfecto para regalos corporativos y familiares.', 100000::numeric, 20, TRUE),
    ('Bono Regalo $200.000', 'bono-200000', 'Para celebraciones especiales.', 200000::numeric, 30, TRUE),
    ('Bono Regalo $500.000', 'bono-500000', 'Para compras de alto valor.', 500000::numeric, 40, TRUE),
    ('Bono Monto Libre', 'bono-monto-libre', 'Permite definir un monto personalizado.', 10000::numeric, 50, TRUE)
) AS seed(name, slug, description, amount, sort_order, is_active)
WHERE NOT EXISTS (SELECT 1 FROM public.gift_card_products);

UPDATE public.gift_card_products
SET allow_custom_amount = TRUE,
    min_custom_amount = 10000,
    max_custom_amount = NULL
WHERE slug = 'bono-monto-libre';
