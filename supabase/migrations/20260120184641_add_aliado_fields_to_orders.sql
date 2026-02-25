-- Agregar campos para gestión de aliados en órdenes
ALTER TABLE orders
ADD COLUMN IF NOT EXISTS aliado_id UUID REFERENCES aliados(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS distributor_id UUID REFERENCES distributors(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS discount_percentage NUMERIC(5,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS approved_by UUID REFERENCES user_profiles(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS approved_at TIMESTAMPTZ;

-- Crear índices para mejorar el rendimiento
CREATE INDEX IF NOT EXISTS idx_orders_aliado_id ON orders(aliado_id);
CREATE INDEX IF NOT EXISTS idx_orders_distributor_id ON orders(distributor_id);
CREATE INDEX IF NOT EXISTS idx_orders_approved_by ON orders(approved_by);

-- Comentarios para documentación
COMMENT ON COLUMN orders.aliado_id IS 'Aliado que creó la orden (si aplica)';
COMMENT ON COLUMN orders.distributor_id IS 'Distribuidor para quien se creó la orden (si aplica)';
COMMENT ON COLUMN orders.discount_percentage IS 'Porcentaje de descuento aplicado al distribuidor';
COMMENT ON COLUMN orders.approved_by IS 'Superadmin que aprobó la orden';
COMMENT ON COLUMN orders.approved_at IS 'Fecha y hora de aprobación de la orden';;
