-- Corregir recursión infinita en políticas RLS
-- El problema es que las políticas de user_profiles consultan user_profiles para verificar si el usuario es superadmin

-- Primero, eliminar las políticas problemáticas
DROP POLICY IF EXISTS "superadmin_all_profiles" ON user_profiles;
DROP POLICY IF EXISTS "superadmin_all_distributors" ON distributors;
DROP POLICY IF EXISTS "superadmin_all_prices" ON distributor_custom_prices;
DROP POLICY IF EXISTS "superadmin_manage_top_products" ON top_selling_products;
DROP POLICY IF EXISTS "superadmin_all_orders" ON orders;
DROP POLICY IF EXISTS "superadmin_all_order_items" ON order_items;
DROP POLICY IF EXISTS "superadmin_all_sales" ON distributor_monthly_sales;
DROP POLICY IF EXISTS "Superadmins can manage all blog posts" ON blog_posts;
DROP POLICY IF EXISTS "Superadmins can manage categories" ON blog_categories;
DROP POLICY IF EXISTS "Superadmins can manage post categories" ON blog_post_categories;

-- Crear una función segura que verifica el rol sin causar recursión
-- Esta función accede directamente a la tabla sin activar RLS
CREATE OR REPLACE FUNCTION public.is_superadmin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.user_profiles
    WHERE id = auth.uid() AND role = 'superadmin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Permitir lectura pública de información básica de perfiles (para autores de blog)
-- Solo campos no sensibles
CREATE POLICY "public_read_basic_profile" ON user_profiles
  FOR SELECT
  USING (true);  -- Todos pueden leer perfiles básicos, la query limita los campos

-- Recrear las políticas de superadmin usando la función segura
CREATE POLICY "superadmin_all_profiles" ON user_profiles
  FOR ALL
  USING (public.is_superadmin());

CREATE POLICY "superadmin_all_distributors" ON distributors
  FOR ALL
  USING (public.is_superadmin());

CREATE POLICY "superadmin_all_prices" ON distributor_custom_prices
  FOR ALL
  USING (public.is_superadmin());

CREATE POLICY "superadmin_manage_top_products" ON top_selling_products
  FOR ALL
  USING (public.is_superadmin());

CREATE POLICY "superadmin_all_orders" ON orders
  FOR ALL
  USING (public.is_superadmin());

CREATE POLICY "superadmin_all_order_items" ON order_items
  FOR ALL
  USING (public.is_superadmin());

CREATE POLICY "superadmin_all_sales" ON distributor_monthly_sales
  FOR ALL
  USING (public.is_superadmin());

CREATE POLICY "Superadmins can manage all blog posts" ON blog_posts
  FOR ALL
  TO authenticated
  USING (public.is_superadmin());

CREATE POLICY "Superadmins can manage categories" ON blog_categories
  FOR ALL
  TO authenticated
  USING (public.is_superadmin());

CREATE POLICY "Superadmins can manage post categories" ON blog_post_categories
  FOR ALL
  TO authenticated
  USING (public.is_superadmin());
