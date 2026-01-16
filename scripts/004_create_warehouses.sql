-- Crear tabla de almacenes
CREATE TABLE IF NOT EXISTS warehouses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT UNIQUE NOT NULL,        -- Código del almacén (EX1, EX2, EX3, EX4)
  name TEXT NOT NULL,                -- Nombre del almacén
  description TEXT,                  -- Descripción
  warehouse_type TEXT NOT NULL CHECK (warehouse_type IN ('bodega', 'punto_exhibicion', 'segundas', 'otro')),
  address TEXT,                      -- Dirección física
  is_active BOOLEAN DEFAULT TRUE,
  can_ship BOOLEAN DEFAULT TRUE,     -- Si puede despachar pedidos
  show_in_frontend BOOLEAN DEFAULT TRUE, -- Si se muestra disponibilidad en web
  order_index INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Crear tabla de inventario por almacén
CREATE TABLE IF NOT EXISTS product_warehouse_stock (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  warehouse_id UUID NOT NULL REFERENCES warehouses(id) ON DELETE CASCADE,
  quantity DECIMAL(10, 2) DEFAULT 0, -- Cantidad disponible
  reserved_quantity DECIMAL(10, 2) DEFAULT 0, -- Cantidad reservada (pedidos pendientes)
  available_quantity DECIMAL(10, 2) GENERATED ALWAYS AS (quantity - reserved_quantity) STORED,
  min_stock DECIMAL(10, 2) DEFAULT 0, -- Stock mínimo para alerta
  max_stock DECIMAL(10, 2),           -- Stock máximo
  last_sync_at TIMESTAMPTZ,           -- Última sincronización con ERP
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(product_id, warehouse_id)
);

-- Insertar los 4 almacenes según el listado de productos
INSERT INTO warehouses (code, name, warehouse_type, description, order_index) VALUES
  ('EX1', 'Bodega Alumar', 'bodega', 'Almacén principal - Bodega Alumar', 1),
  ('EX2', 'Bodega Zona Industrial', 'bodega', 'Almacén secundario - Zona Industrial', 2),
  ('EX3', 'Punto Exhibición', 'punto_exhibicion', 'Punto de exhibición y venta', 3),
  ('EX4', 'Segundas', 'segundas', 'Productos de segunda calidad', 4)
ON CONFLICT (code) DO NOTHING;

-- Crear índices para optimizar consultas
CREATE INDEX idx_warehouses_code ON warehouses(code);
CREATE INDEX idx_warehouses_is_active ON warehouses(is_active);
CREATE INDEX idx_product_warehouse_stock_product_id ON product_warehouse_stock(product_id);
CREATE INDEX idx_product_warehouse_stock_warehouse_id ON product_warehouse_stock(warehouse_id);
CREATE INDEX idx_product_warehouse_stock_available ON product_warehouse_stock(available_quantity);

-- Trigger para actualizar updated_at en warehouses
CREATE TRIGGER update_warehouses_updated_at
  BEFORE UPDATE ON warehouses
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Trigger para actualizar updated_at en product_warehouse_stock
CREATE TRIGGER update_product_warehouse_stock_updated_at
  BEFORE UPDATE ON product_warehouse_stock
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Función para calcular existencia total de un producto
CREATE OR REPLACE FUNCTION calculate_total_stock(p_product_id UUID)
RETURNS DECIMAL AS $$
DECLARE
  total DECIMAL;
BEGIN
  SELECT COALESCE(SUM(available_quantity), 0)
  INTO total
  FROM product_warehouse_stock
  WHERE product_id = p_product_id;
  
  RETURN total;
END;
$$ LANGUAGE plpgsql;

-- Función para sincronizar existencia total en products.upp_existencia
CREATE OR REPLACE FUNCTION sync_product_total_stock()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE products
  SET upp_existencia = calculate_total_stock(NEW.product_id)
  WHERE id = NEW.product_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para sincronizar automáticamente upp_existencia cuando cambia el stock de almacén
CREATE TRIGGER sync_total_stock_on_warehouse_change
  AFTER INSERT OR UPDATE OR DELETE ON product_warehouse_stock
  FOR EACH ROW
  EXECUTE FUNCTION sync_product_total_stock();
