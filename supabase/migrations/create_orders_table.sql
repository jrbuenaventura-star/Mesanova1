-- Crear tabla de pedidos (orders)
CREATE TABLE IF NOT EXISTS orders (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  
  -- Información del cliente
  customer_name TEXT NOT NULL,
  customer_email TEXT NOT NULL,
  customer_phone TEXT NOT NULL,
  
  -- Dirección de envío
  shipping_address TEXT NOT NULL,
  shipping_city TEXT NOT NULL,
  shipping_postal_code TEXT,
  
  -- Detalles del pedido
  notes TEXT,
  payment_method TEXT NOT NULL CHECK (payment_method IN ('transfer', 'cash', 'card')),
  shipping_method TEXT NOT NULL CHECK (shipping_method IN ('standard', 'express')),
  
  -- Montos
  subtotal DECIMAL(10,2) NOT NULL CHECK (subtotal >= 0),
  shipping_cost DECIMAL(10,2) NOT NULL CHECK (shipping_cost >= 0),
  total DECIMAL(10,2) NOT NULL CHECK (total >= 0),
  
  -- Estado del pedido
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled')),
  
  -- Items del pedido (JSON)
  items JSONB NOT NULL,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Índices para búsquedas comunes
  CONSTRAINT valid_total CHECK (total = subtotal + shipping_cost)
);

-- Índices para mejorar rendimiento
CREATE INDEX IF NOT EXISTS idx_orders_user_id ON orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_orders_customer_email ON orders(customer_email);

-- Trigger para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_orders_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER orders_updated_at_trigger
  BEFORE UPDATE ON orders
  FOR EACH ROW
  EXECUTE FUNCTION update_orders_updated_at();

-- Habilitar RLS (Row Level Security)
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

-- Política: Los usuarios pueden ver sus propios pedidos
CREATE POLICY "Users can view their own orders"
  ON orders FOR SELECT
  USING (auth.uid() = user_id);

-- Política: Los superadmin pueden ver todos los pedidos
CREATE POLICY "Superadmin can view all orders"
  ON orders FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.role = 'superadmin'
    )
  );

-- Política: Cualquiera puede crear pedidos (incluso sin autenticar)
CREATE POLICY "Anyone can create orders"
  ON orders FOR INSERT
  WITH CHECK (true);

-- Política: Solo superadmin puede actualizar pedidos
CREATE POLICY "Superadmin can update orders"
  ON orders FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.role = 'superadmin'
    )
  );

-- Comentarios para documentación
COMMENT ON TABLE orders IS 'Tabla de pedidos del sistema';
COMMENT ON COLUMN orders.items IS 'Array JSON con los items del pedido: [{product_id, product_code, product_name, quantity, unit_price, total_price}]';
COMMENT ON COLUMN orders.status IS 'Estados: pending (nuevo), confirmed (confirmado), processing (procesando), shipped (enviado), delivered (entregado), cancelled (cancelado)';
