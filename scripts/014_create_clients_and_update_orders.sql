-- Sistema de Clientes (Empresas) y actualización de órdenes

-- Tabla de clientes (empresas)
CREATE TABLE IF NOT EXISTS companies (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Información básica de identificación
  razon_social VARCHAR(255) NOT NULL,
  nombre_comercial VARCHAR(255),
  nit VARCHAR(100) UNIQUE NOT NULL,
  tipo_empresa VARCHAR(100), -- Restaurante, Hotel, Catering, Retail, etc.
  
  -- Ubicación
  direccion TEXT,
  ciudad VARCHAR(100),
  estado VARCHAR(100),
  codigo_postal VARCHAR(20),
  pais VARCHAR(100) DEFAULT 'Colombia',
  
  -- Contacto corporativo
  telefono_principal VARCHAR(50),
  telefono_secundario VARCHAR(50),
  email_principal VARCHAR(255),
  email_facturacion VARCHAR(255),
  sitio_web VARCHAR(255),
  
  -- Información comercial
  terminos_pago VARCHAR(100), -- Contado, 30 días, 60 días, etc.
  descuento_general DECIMAL(5,2) DEFAULT 0.00,
  limite_credito DECIMAL(12,2) DEFAULT 0,
  saldo_actual DECIMAL(12,2) DEFAULT 0,
  dia_pago INTEGER, -- Día del mes para pago (1-31)
  
  -- Distribuidor asignado
  distribuidor_asignado_id UUID REFERENCES distributors(id),
  
  -- Metadata
  is_active BOOLEAN DEFAULT true,
  notas TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES user_profiles(id),
  updated_by UUID REFERENCES user_profiles(id)
);

-- Tabla de contactos dentro de cada cliente
CREATE TABLE IF NOT EXISTS company_contacts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  
  -- Información personal
  nombre_completo VARCHAR(255) NOT NULL,
  cargo VARCHAR(100),
  departamento VARCHAR(100),
  
  -- Contacto
  email VARCHAR(255),
  telefono VARCHAR(50),
  celular VARCHAR(50),
  extension VARCHAR(20),
  
  -- Preferencias
  es_contacto_principal BOOLEAN DEFAULT false,
  recibe_facturas BOOLEAN DEFAULT false,
  recibe_pedidos BOOLEAN DEFAULT false,
  
  -- Metadata
  is_active BOOLEAN DEFAULT true,
  notas TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Actualizar tabla de órdenes con nuevos campos y estados
DO $$ 
BEGIN
  -- Agregar columna company_id si no existe
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='orders' AND column_name='company_id') THEN
    ALTER TABLE orders ADD COLUMN company_id UUID REFERENCES companies(id);
  END IF;
  
  -- Agregar columna emisor
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='orders' AND column_name='emisor') THEN
    ALTER TABLE orders ADD COLUMN emisor VARCHAR(255) DEFAULT 'Alumar SAS';
  END IF;
  
  -- Agregar columna fecha_pedido
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='orders' AND column_name='fecha_pedido') THEN
    ALTER TABLE orders ADD COLUMN fecha_pedido DATE DEFAULT CURRENT_DATE;
  END IF;
  
  -- Agregar columna fecha_entrega_estimada
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='orders' AND column_name='fecha_entrega_estimada') THEN
    ALTER TABLE orders ADD COLUMN fecha_entrega_estimada DATE;
  END IF;
  
  -- Agregar columna iva_porcentaje
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='orders' AND column_name='iva_porcentaje') THEN
    ALTER TABLE orders ADD COLUMN iva_porcentaje DECIMAL(5,2) DEFAULT 19.00;
  END IF;
  
  -- Agregar columna approved_at
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='orders' AND column_name='approved_at') THEN
    ALTER TABLE orders ADD COLUMN approved_at TIMESTAMPTZ;
  END IF;
  
  -- Agregar columna approved_by
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='orders' AND column_name='approved_by') THEN
    ALTER TABLE orders ADD COLUMN approved_by UUID REFERENCES user_profiles(id);
  END IF;
  
  -- Agregar columna rejected_at
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='orders' AND column_name='rejected_at') THEN
    ALTER TABLE orders ADD COLUMN rejected_at TIMESTAMPTZ;
  END IF;
  
  -- Agregar columna rejected_reason
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='orders' AND column_name='rejected_reason') THEN
    ALTER TABLE orders ADD COLUMN rejected_reason TEXT;
  END IF;
END $$;

-- Crear tipo ENUM para estados de orden si no existe
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'order_status_type') THEN
    CREATE TYPE order_status_type AS ENUM (
      'draft',           -- Borrador
      'pending_approval',-- Por Aprobar
      'approved',        -- Aprobada
      'in_preparation',  -- En Preparación
      'shipped',         -- Enviada
      'delivered',       -- Entregada
      'cancelled',       -- Cancelada
      'returned'         -- Devuelta/Rechazada
    );
  END IF;
END $$;

-- Actualizar columna status para usar el ENUM (esto puede fallar si ya tiene datos incompatibles)
-- ALTER TABLE orders ALTER COLUMN status TYPE order_status_type USING status::order_status_type;

-- Índices para clientes y contactos
CREATE INDEX IF NOT EXISTS idx_companies_nit ON companies(nit);
CREATE INDEX IF NOT EXISTS idx_companies_distribuidor ON companies(distribuidor_asignado_id);
CREATE INDEX IF NOT EXISTS idx_companies_active ON companies(is_active);
CREATE INDEX IF NOT EXISTS idx_company_contacts_company ON company_contacts(company_id);
CREATE INDEX IF NOT EXISTS idx_company_contacts_principal ON company_contacts(es_contacto_principal);
CREATE INDEX IF NOT EXISTS idx_orders_company ON orders(company_id);
CREATE INDEX IF NOT EXISTS idx_orders_approved_by ON orders(approved_by);

-- Trigger para updated_at en companies
CREATE TRIGGER update_companies_updated_at BEFORE UPDATE ON companies
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Trigger para updated_at en company_contacts
CREATE TRIGGER update_company_contacts_updated_at BEFORE UPDATE ON company_contacts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Función para generar número de orden único
CREATE OR REPLACE FUNCTION generate_order_number()
RETURNS TEXT AS $$
DECLARE
  new_number TEXT;
  year_prefix TEXT;
  sequence_num INTEGER;
BEGIN
  year_prefix := TO_CHAR(NOW(), 'YYYY');
  
  SELECT COALESCE(MAX(CAST(SUBSTRING(order_number FROM 6) AS INTEGER)), 0) + 1
  INTO sequence_num
  FROM orders
  WHERE order_number LIKE year_prefix || '-%';
  
  new_number := year_prefix || '-' || LPAD(sequence_num::TEXT, 6, '0');
  
  RETURN new_number;
END;
$$ LANGUAGE plpgsql;

-- Comentarios para documentación
COMMENT ON TABLE companies IS 'Clientes empresariales de Alumar';
COMMENT ON TABLE company_contacts IS 'Personas de contacto dentro de cada empresa cliente';
COMMENT ON COLUMN companies.distribuidor_asignado_id IS 'Distribuidor responsable de este cliente';
COMMENT ON COLUMN orders.company_id IS 'Cliente empresa asociado a esta orden (para distribuidores)';
COMMENT ON COLUMN orders.approved_by IS 'Superadmin que aprobó la orden';
