-- Sistema de usuarios y roles para Alumar

-- Extensión para UUID si no existe
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Enum para tipos de usuario
CREATE TYPE user_role AS ENUM ('superadmin', 'distributor', 'end_user');

-- Tabla de perfiles de usuario (extiende auth.users de Supabase)
CREATE TABLE user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role user_role NOT NULL DEFAULT 'end_user',
  full_name VARCHAR(255),
  phone VARCHAR(50),
  document_type VARCHAR(50), -- CI, RIF, Pasaporte
  document_number VARCHAR(100),
  
  -- Dirección de envío para usuarios finales
  shipping_address TEXT,
  shipping_city VARCHAR(100),
  shipping_state VARCHAR(100),
  shipping_postal_code VARCHAR(20),
  shipping_country VARCHAR(100) DEFAULT 'Venezuela',
  
  -- Metadata
  is_active BOOLEAN DEFAULT true,
  is_verified BOOLEAN DEFAULT false,
  last_login_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabla de distribuidores
CREATE TABLE distributors (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  
  -- Información comercial
  company_name VARCHAR(255) NOT NULL,
  company_rif VARCHAR(100),
  business_type VARCHAR(100), -- Tienda, Restaurante, Hotel, etc.
  
  -- Descuentos
  discount_percentage DECIMAL(5,2) DEFAULT 0.00, -- Descuento general
  has_custom_pricing BOOLEAN DEFAULT false, -- ¿Tiene precios personalizados?
  
  -- Presupuesto mensual por línea
  monthly_budget_cocina DECIMAL(12,2) DEFAULT 0,
  monthly_budget_mesa DECIMAL(12,2) DEFAULT 0,
  monthly_budget_cafe_te_bar DECIMAL(12,2) DEFAULT 0,
  monthly_budget_termos_neveras DECIMAL(12,2) DEFAULT 0,
  monthly_budget_profesional DECIMAL(12,2) DEFAULT 0,
  
  -- Límite de crédito
  credit_limit DECIMAL(12,2) DEFAULT 0,
  current_balance DECIMAL(12,2) DEFAULT 0,
  
  -- Status
  is_active BOOLEAN DEFAULT true,
  requires_approval BOOLEAN DEFAULT false,
  approved_at TIMESTAMPTZ,
  approved_by UUID REFERENCES user_profiles(id),
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(user_id)
);

-- Tabla de precios personalizados por distribuidor
CREATE TABLE distributor_custom_prices (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  distributor_id UUID NOT NULL REFERENCES distributors(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  custom_price DECIMAL(12,2) NOT NULL,
  discount_percentage DECIMAL(5,2),
  valid_from TIMESTAMPTZ DEFAULT NOW(),
  valid_until TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(distributor_id, product_id)
);

-- Tabla de productos con mayor rotación (top selling)
CREATE TABLE top_selling_products (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  total_quantity_sold INTEGER DEFAULT 0,
  total_revenue DECIMAL(12,2) DEFAULT 0,
  order_index INTEGER DEFAULT 0,
  is_featured BOOLEAN DEFAULT true,
  notes TEXT,
  created_by UUID REFERENCES user_profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(product_id, period_start, period_end)
);

-- Tabla de órdenes de compra
CREATE TABLE orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_number VARCHAR(50) UNIQUE NOT NULL,
  user_id UUID NOT NULL REFERENCES user_profiles(id),
  distributor_id UUID REFERENCES distributors(id), -- NULL si es usuario final
  
  -- Status
  status VARCHAR(50) DEFAULT 'pending', -- pending, confirmed, processing, shipped, delivered, cancelled
  payment_status VARCHAR(50) DEFAULT 'pending', -- pending, paid, partially_paid, refunded
  
  -- Montos
  subtotal DECIMAL(12,2) NOT NULL,
  discount_amount DECIMAL(12,2) DEFAULT 0,
  tax_amount DECIMAL(12,2) DEFAULT 0,
  shipping_cost DECIMAL(12,2) DEFAULT 0,
  total DECIMAL(12,2) NOT NULL,
  
  -- Dirección de envío
  shipping_full_name VARCHAR(255),
  shipping_phone VARCHAR(50),
  shipping_address TEXT,
  shipping_city VARCHAR(100),
  shipping_state VARCHAR(100),
  shipping_postal_code VARCHAR(20),
  shipping_country VARCHAR(100),
  
  -- Tracking
  tracking_number VARCHAR(255),
  tracking_url TEXT,
  carrier VARCHAR(100),
  shipped_at TIMESTAMPTZ,
  delivered_at TIMESTAMPTZ,
  
  -- Metadata
  notes TEXT,
  internal_notes TEXT, -- Solo para admin
  cancelled_at TIMESTAMPTZ,
  cancelled_reason TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabla de items de órdenes
CREATE TABLE order_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id),
  
  -- Detalles del producto al momento de la orden
  product_code VARCHAR(100),
  product_name VARCHAR(500),
  
  quantity INTEGER NOT NULL,
  unit_price DECIMAL(12,2) NOT NULL,
  discount_percentage DECIMAL(5,2) DEFAULT 0,
  discount_amount DECIMAL(12,2) DEFAULT 0,
  subtotal DECIMAL(12,2) NOT NULL,
  
  -- Warehouse de donde sale el producto
  warehouse_id UUID REFERENCES warehouses(id),
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabla de ventas por distribuidor (agregada por mes)
CREATE TABLE distributor_monthly_sales (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  distributor_id UUID NOT NULL REFERENCES distributors(id) ON DELETE CASCADE,
  year INTEGER NOT NULL,
  month INTEGER NOT NULL, -- 1-12
  
  -- Ventas por silo
  sales_cocina DECIMAL(12,2) DEFAULT 0,
  sales_mesa DECIMAL(12,2) DEFAULT 0,
  sales_cafe_te_bar DECIMAL(12,2) DEFAULT 0,
  sales_termos_neveras DECIMAL(12,2) DEFAULT 0,
  sales_profesional DECIMAL(12,2) DEFAULT 0,
  
  -- Total
  total_sales DECIMAL(12,2) DEFAULT 0,
  total_orders INTEGER DEFAULT 0,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(distributor_id, year, month)
);

-- Índices para mejorar rendimiento
CREATE INDEX idx_user_profiles_role ON user_profiles(role);
CREATE INDEX idx_user_profiles_active ON user_profiles(is_active);
CREATE INDEX idx_distributors_user_id ON distributors(user_id);
CREATE INDEX idx_distributors_active ON distributors(is_active);
CREATE INDEX idx_distributor_custom_prices_distributor ON distributor_custom_prices(distributor_id);
CREATE INDEX idx_distributor_custom_prices_product ON distributor_custom_prices(product_id);
CREATE INDEX idx_orders_user_id ON orders(user_id);
CREATE INDEX idx_orders_distributor_id ON orders(distributor_id);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_created_at ON orders(created_at DESC);
CREATE INDEX idx_order_items_order_id ON order_items(order_id);
CREATE INDEX idx_order_items_product_id ON order_items(product_id);
CREATE INDEX idx_distributor_monthly_sales_distributor ON distributor_monthly_sales(distributor_id, year, month);

-- Triggers para updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_user_profiles_updated_at BEFORE UPDATE ON user_profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_distributors_updated_at BEFORE UPDATE ON distributors
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON orders
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Función para calcular ventas mensuales de distribuidores
CREATE OR REPLACE FUNCTION calculate_distributor_monthly_sales(
  p_distributor_id UUID,
  p_year INTEGER,
  p_month INTEGER
) RETURNS void AS $$
BEGIN
  INSERT INTO distributor_monthly_sales (
    distributor_id,
    year,
    month,
    sales_cocina,
    sales_mesa,
    sales_cafe_te_bar,
    sales_termos_neveras,
    sales_profesional,
    total_sales,
    total_orders
  )
  SELECT 
    p_distributor_id,
    p_year,
    p_month,
    COALESCE(SUM(CASE WHEN s.slug = 'cocina' THEN oi.subtotal ELSE 0 END), 0),
    COALESCE(SUM(CASE WHEN s.slug = 'mesa' THEN oi.subtotal ELSE 0 END), 0),
    COALESCE(SUM(CASE WHEN s.slug = 'cafe-te-bar' THEN oi.subtotal ELSE 0 END), 0),
    COALESCE(SUM(CASE WHEN s.slug = 'termos-neveras' THEN oi.subtotal ELSE 0 END), 0),
    COALESCE(SUM(CASE WHEN s.slug = 'profesional' THEN oi.subtotal ELSE 0 END), 0),
    COALESCE(SUM(oi.subtotal), 0),
    COUNT(DISTINCT o.id)
  FROM orders o
  JOIN order_items oi ON oi.order_id = o.id
  JOIN products p ON p.id = oi.product_id
  JOIN product_categories pc ON pc.product_id = p.id AND pc.is_primary = true
  JOIN subcategories sc ON sc.id = pc.subcategory_id
  JOIN silos s ON s.id = sc.silo_id
  WHERE o.distributor_id = p_distributor_id
    AND EXTRACT(YEAR FROM o.created_at) = p_year
    AND EXTRACT(MONTH FROM o.created_at) = p_month
    AND o.status NOT IN ('cancelled')
  ON CONFLICT (distributor_id, year, month) DO UPDATE SET
    sales_cocina = EXCLUDED.sales_cocina,
    sales_mesa = EXCLUDED.sales_mesa,
    sales_cafe_te_bar = EXCLUDED.sales_cafe_te_bar,
    sales_termos_neveras = EXCLUDED.sales_termos_neveras,
    sales_profesional = EXCLUDED.sales_profesional,
    total_sales = EXCLUDED.total_sales,
    total_orders = EXCLUDED.total_orders,
    updated_at = NOW();
END;
$$ LANGUAGE plpgsql;
