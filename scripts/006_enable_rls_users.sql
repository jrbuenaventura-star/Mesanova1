-- Row Level Security para el sistema de usuarios

-- Habilitar RLS
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE distributors ENABLE ROW LEVEL SECURITY;
ALTER TABLE distributor_custom_prices ENABLE ROW LEVEL SECURITY;
ALTER TABLE top_selling_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE distributor_monthly_sales ENABLE ROW LEVEL SECURITY;

-- USER_PROFILES
-- Los usuarios pueden ver y editar su propio perfil
CREATE POLICY "users_own_profile" ON user_profiles
  FOR ALL
  USING (auth.uid() = id);

-- Los superadmins pueden ver todos los perfiles
CREATE POLICY "superadmin_all_profiles" ON user_profiles
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid() AND role = 'superadmin'
    )
  );

-- DISTRIBUTORS
-- Los distribuidores pueden ver su propia información
CREATE POLICY "distributors_own_info" ON distributors
  FOR SELECT
  USING (user_id = auth.uid());

-- Los superadmins pueden administrar todos los distribuidores
CREATE POLICY "superadmin_all_distributors" ON distributors
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid() AND role = 'superadmin'
    )
  );

-- DISTRIBUTOR_CUSTOM_PRICES
-- Los distribuidores pueden ver sus propios precios
CREATE POLICY "distributors_own_prices" ON distributor_custom_prices
  FOR SELECT
  USING (
    distributor_id IN (
      SELECT id FROM distributors WHERE user_id = auth.uid()
    )
  );

-- Los superadmins pueden administrar todos los precios
CREATE POLICY "superadmin_all_prices" ON distributor_custom_prices
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid() AND role = 'superadmin'
    )
  );

-- TOP_SELLING_PRODUCTS
-- Lectura pública para distribuidores autenticados
CREATE POLICY "distributors_read_top_products" ON top_selling_products
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid() AND role IN ('distributor', 'superadmin')
    )
  );

-- Solo superadmins pueden administrar
CREATE POLICY "superadmin_manage_top_products" ON top_selling_products
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid() AND role = 'superadmin'
    )
  );

-- ORDERS
-- Los usuarios pueden ver sus propias órdenes
CREATE POLICY "users_own_orders" ON orders
  FOR SELECT
  USING (user_id = auth.uid());

-- Los usuarios pueden crear sus propias órdenes
CREATE POLICY "users_create_own_orders" ON orders
  FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- Los superadmins pueden ver y administrar todas las órdenes
CREATE POLICY "superadmin_all_orders" ON orders
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid() AND role = 'superadmin'
    )
  );

-- ORDER_ITEMS
-- Los usuarios pueden ver los items de sus propias órdenes
CREATE POLICY "users_own_order_items" ON order_items
  FOR SELECT
  USING (
    order_id IN (
      SELECT id FROM orders WHERE user_id = auth.uid()
    )
  );

-- Los usuarios pueden crear items en sus propias órdenes
CREATE POLICY "users_create_own_order_items" ON order_items
  FOR INSERT
  WITH CHECK (
    order_id IN (
      SELECT id FROM orders WHERE user_id = auth.uid()
    )
  );

-- Los superadmins pueden ver y administrar todos los items
CREATE POLICY "superadmin_all_order_items" ON order_items
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid() AND role = 'superadmin'
    )
  );

-- DISTRIBUTOR_MONTHLY_SALES
-- Los distribuidores pueden ver sus propias ventas
CREATE POLICY "distributors_own_sales" ON distributor_monthly_sales
  FOR SELECT
  USING (
    distributor_id IN (
      SELECT id FROM distributors WHERE user_id = auth.uid()
    )
  );

-- Los superadmins pueden ver todas las ventas
CREATE POLICY "superadmin_all_sales" ON distributor_monthly_sales
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid() AND role = 'superadmin'
    )
  );

-- Actualizar políticas de WAREHOUSES para que distribuidores puedan ver
DROP POLICY IF EXISTS "warehouses_public_read" ON warehouses;
CREATE POLICY "warehouses_authenticated_read" ON warehouses
  FOR SELECT
  USING (
    show_in_frontend = true OR
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid() AND role IN ('distributor', 'superadmin')
    )
  );

-- Actualizar políticas de PRODUCT_WAREHOUSE_STOCK para distribuidores
DROP POLICY IF EXISTS "product_warehouse_stock_public_read" ON product_warehouse_stock;
CREATE POLICY "product_warehouse_stock_authenticated_read" ON product_warehouse_stock
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid() AND role IN ('distributor', 'superadmin')
    )
  );
