-- Migración 016: Nuevos tipos de usuario (Canal) y campos adicionales de productos
-- Fecha: 2026-01-18

-- ============================================================================
-- PARTE 1: ACTUALIZACIÓN DE ROLES DE USUARIO
-- ============================================================================

-- Agregar nuevo rol 'canal' (corredor/agente comercial)
ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'canal';

-- ============================================================================
-- PARTE 2: TABLA DE TIPOS DE PRODUCTO (3er nivel de categorización)
-- ============================================================================

CREATE TABLE IF NOT EXISTS product_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subcategory_id UUID NOT NULL REFERENCES subcategories(id) ON DELETE CASCADE,
  slug TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  order_index INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(subcategory_id, slug)
);

CREATE INDEX IF NOT EXISTS idx_product_types_subcategory ON product_types(subcategory_id);
CREATE INDEX IF NOT EXISTS idx_product_types_slug ON product_types(slug);

-- ============================================================================
-- PARTE 3: NUEVOS CAMPOS EN PRODUCTOS
-- ============================================================================

DO $$ 
BEGIN
  -- Código de barras
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='products' AND column_name='codigo_barras') THEN
    ALTER TABLE products ADD COLUMN codigo_barras VARCHAR(100);
  END IF;
  
  -- Porcentaje de descuento (reemplaza is_on_sale)
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='products' AND column_name='descuento_porcentaje') THEN
    ALTER TABLE products ADD COLUMN descuento_porcentaje DECIMAL(5,2) DEFAULT 0;
  END IF;
  
  -- Precio anterior (para mostrar tachado)
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='products' AND column_name='precio_antes') THEN
    ALTER TABLE products ADD COLUMN precio_antes DECIMAL(12,2);
  END IF;
  
  -- Pedido en camino
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='products' AND column_name='pedido_en_camino') THEN
    ALTER TABLE products ADD COLUMN pedido_en_camino BOOLEAN DEFAULT false;
  END IF;
  
  -- Descontinuado (informativo)
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='products' AND column_name='descontinuado') THEN
    ALTER TABLE products ADD COLUMN descontinuado BOOLEAN DEFAULT false;
  END IF;
  
  -- Tipo de producto (3er nivel)
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='products' AND column_name='product_type_id') THEN
    ALTER TABLE products ADD COLUMN product_type_id UUID REFERENCES product_types(id);
  END IF;
  
  -- Momentos de uso (para cliente final)
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='products' AND column_name='momentos_uso') THEN
    ALTER TABLE products ADD COLUMN momentos_uso TEXT;
  END IF;
  
  -- Descripción para distribuidor
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='products' AND column_name='descripcion_distribuidor') THEN
    ALTER TABLE products ADD COLUMN descripcion_distribuidor TEXT;
  END IF;
  
  -- Argumentos de venta para distribuidor
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='products' AND column_name='argumentos_venta') THEN
    ALTER TABLE products ADD COLUMN argumentos_venta TEXT;
  END IF;
  
  -- Ubicación sugerida en tienda
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='products' AND column_name='ubicacion_tienda') THEN
    ALTER TABLE products ADD COLUMN ubicacion_tienda TEXT;
  END IF;
  
  -- Margen sugerido para distribuidor
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='products' AND column_name='margen_sugerido') THEN
    ALTER TABLE products ADD COLUMN margen_sugerido DECIMAL(5,2);
  END IF;
  
  -- Rotación esperada
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='products' AND column_name='rotacion_esperada') THEN
    ALTER TABLE products ADD COLUMN rotacion_esperada VARCHAR(20) CHECK (rotacion_esperada IN ('alta', 'media', 'baja'));
  END IF;
  
  -- Tags para búsqueda flexible
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='products' AND column_name='tags') THEN
    ALTER TABLE products ADD COLUMN tags TEXT[];
  END IF;
  
  -- Video URL
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='products' AND column_name='video_url') THEN
    ALTER TABLE products ADD COLUMN video_url TEXT;
  END IF;
  
  -- Ficha técnica PDF
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='products' AND column_name='ficha_tecnica_url') THEN
    ALTER TABLE products ADD COLUMN ficha_tecnica_url TEXT;
  END IF;
  
  -- Fecha de lanzamiento
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='products' AND column_name='fecha_lanzamiento') THEN
    ALTER TABLE products ADD COLUMN fecha_lanzamiento DATE;
  END IF;
  
  -- Productos afines (referencias CSV)
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='products' AND column_name='productos_afines_csv') THEN
    ALTER TABLE products ADD COLUMN productos_afines_csv TEXT;
  END IF;
  
  -- Última sincronización con ERP
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='products' AND column_name='last_erp_sync') THEN
    ALTER TABLE products ADD COLUMN last_erp_sync TIMESTAMPTZ;
  END IF;
  
  -- Última modificación CSV
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='products' AND column_name='last_csv_update') THEN
    ALTER TABLE products ADD COLUMN last_csv_update TIMESTAMPTZ;
  END IF;
END $$;

-- Índices para nuevos campos
CREATE INDEX IF NOT EXISTS idx_products_codigo_barras ON products(codigo_barras);
CREATE INDEX IF NOT EXISTS idx_products_descontinuado ON products(descontinuado);
CREATE INDEX IF NOT EXISTS idx_products_product_type ON products(product_type_id);
CREATE INDEX IF NOT EXISTS idx_products_rotacion ON products(rotacion_esperada);
CREATE INDEX IF NOT EXISTS idx_products_descuento ON products(descuento_porcentaje) WHERE descuento_porcentaje > 0;
CREATE INDEX IF NOT EXISTS idx_products_tags ON products USING GIN(tags);

-- ============================================================================
-- PARTE 4: TABLA DE CORREDORES/CANAL
-- ============================================================================

CREATE TABLE IF NOT EXISTS sales_agents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  
  -- Información del agente
  employee_code VARCHAR(50) UNIQUE,
  hire_date DATE,
  territory VARCHAR(255),
  
  -- Comisiones
  default_commission_rate DECIMAL(5,2) DEFAULT 0, -- % de comisión por defecto
  commission_payment_days INTEGER DEFAULT 90, -- Días para pago de comisión
  
  -- Objetivos
  monthly_sales_target DECIMAL(12,2) DEFAULT 0,
  quarterly_sales_target DECIMAL(12,2) DEFAULT 0,
  annual_sales_target DECIMAL(12,2) DEFAULT 0,
  
  -- Status
  is_active BOOLEAN DEFAULT true,
  
  -- Metadata
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES user_profiles(id),
  
  UNIQUE(user_id)
);

CREATE INDEX IF NOT EXISTS idx_sales_agents_user ON sales_agents(user_id);
CREATE INDEX IF NOT EXISTS idx_sales_agents_active ON sales_agents(is_active);
CREATE INDEX IF NOT EXISTS idx_sales_agents_territory ON sales_agents(territory);

-- ============================================================================
-- PARTE 5: ASIGNACIÓN CORREDOR-DISTRIBUIDOR (1:1)
-- ============================================================================

CREATE TABLE IF NOT EXISTS agent_distributor_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id UUID NOT NULL REFERENCES sales_agents(id) ON DELETE CASCADE,
  distributor_id UUID NOT NULL REFERENCES distributors(id) ON DELETE CASCADE,
  
  -- Comisión específica para este distribuidor
  commission_rate DECIMAL(5,2), -- Si es NULL, usa la del agente
  
  -- Fechas
  assigned_at TIMESTAMPTZ DEFAULT NOW(),
  unassigned_at TIMESTAMPTZ,
  
  -- Status
  is_active BOOLEAN DEFAULT true,
  
  -- Metadata
  notes TEXT,
  created_by UUID REFERENCES user_profiles(id),
  
  UNIQUE(distributor_id) -- 1:1 - Un distribuidor solo puede tener un corredor
);

CREATE INDEX IF NOT EXISTS idx_agent_assignments_agent ON agent_distributor_assignments(agent_id);
CREATE INDEX IF NOT EXISTS idx_agent_assignments_distributor ON agent_distributor_assignments(distributor_id);
CREATE INDEX IF NOT EXISTS idx_agent_assignments_active ON agent_distributor_assignments(is_active);

-- ============================================================================
-- PARTE 6: COMISIONES DE AGENTES
-- ============================================================================

CREATE TABLE IF NOT EXISTS agent_commissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id UUID NOT NULL REFERENCES sales_agents(id) ON DELETE CASCADE,
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  distributor_id UUID NOT NULL REFERENCES distributors(id),
  
  -- Montos
  order_total DECIMAL(12,2) NOT NULL,
  commission_rate DECIMAL(5,2) NOT NULL,
  commission_amount DECIMAL(12,2) NOT NULL,
  
  -- Status
  status VARCHAR(50) DEFAULT 'pending', -- pending, approved, paid, cancelled
  
  -- Fechas importantes
  order_date TIMESTAMPTZ NOT NULL,
  invoice_paid_at TIMESTAMPTZ, -- Fecha de pago de la factura
  commission_due_at TIMESTAMPTZ, -- Fecha límite para pagar comisión (90 días)
  paid_at TIMESTAMPTZ,
  
  -- Metadata
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_agent_commissions_agent ON agent_commissions(agent_id);
CREATE INDEX IF NOT EXISTS idx_agent_commissions_order ON agent_commissions(order_id);
CREATE INDEX IF NOT EXISTS idx_agent_commissions_status ON agent_commissions(status);
CREATE INDEX IF NOT EXISTS idx_agent_commissions_due ON agent_commissions(commission_due_at);

-- ============================================================================
-- PARTE 7: LOG DE CAMBIOS DE PRODUCTOS
-- ============================================================================

CREATE TABLE IF NOT EXISTS product_change_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  
  -- Información del cambio
  change_type VARCHAR(50) NOT NULL, -- 'create', 'update', 'csv_import', 'erp_sync'
  change_source VARCHAR(50) NOT NULL, -- 'csv', 'erp', 'admin', 'api'
  
  -- Detalle de campos cambiados
  fields_changed JSONB NOT NULL, -- {"campo": {"old": "valor_anterior", "new": "valor_nuevo"}}
  
  -- Usuario que hizo el cambio
  changed_by UUID REFERENCES user_profiles(id),
  
  -- Archivo CSV si aplica
  csv_filename TEXT,
  csv_row_number INTEGER,
  
  -- Timestamp
  changed_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_product_change_log_product ON product_change_log(product_id);
CREATE INDEX IF NOT EXISTS idx_product_change_log_type ON product_change_log(change_type);
CREATE INDEX IF NOT EXISTS idx_product_change_log_date ON product_change_log(changed_at DESC);
CREATE INDEX IF NOT EXISTS idx_product_change_log_source ON product_change_log(change_source);

-- ============================================================================
-- PARTE 8: IMPORTACIONES CSV (HISTORIAL)
-- ============================================================================

CREATE TABLE IF NOT EXISTS csv_imports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Información del archivo
  filename TEXT NOT NULL,
  file_size INTEGER,
  total_rows INTEGER,
  
  -- Resultados
  rows_created INTEGER DEFAULT 0,
  rows_updated INTEGER DEFAULT 0,
  rows_skipped INTEGER DEFAULT 0,
  rows_error INTEGER DEFAULT 0,
  
  -- Errores detallados
  errors JSONB, -- [{row: 5, field: "precio", error: "valor inválido"}]
  
  -- Status
  status VARCHAR(50) DEFAULT 'pending', -- pending, processing, completed, failed
  
  -- Modo de importación
  import_mode VARCHAR(50) DEFAULT 'update', -- 'replace_all', 'update', 'add_only'
  
  -- Usuario
  imported_by UUID REFERENCES user_profiles(id),
  
  -- Timestamps
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_csv_imports_status ON csv_imports(status);
CREATE INDEX IF NOT EXISTS idx_csv_imports_date ON csv_imports(created_at DESC);

-- ============================================================================
-- PARTE 9: CAMPOS ADICIONALES EN USER_PROFILES PARA SEGMENTACIÓN
-- ============================================================================

DO $$ 
BEGIN
  -- Tipo de cliente
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='user_profiles' AND column_name='customer_type') THEN
    ALTER TABLE user_profiles ADD COLUMN customer_type VARCHAR(20) CHECK (customer_type IN ('b2b', 'b2c', 'both'));
  END IF;
  
  -- Segmento automático
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='user_profiles' AND column_name='segment') THEN
    ALTER TABLE user_profiles ADD COLUMN segment VARCHAR(50);
  END IF;
  
  -- Primera compra
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='user_profiles' AND column_name='first_purchase_at') THEN
    ALTER TABLE user_profiles ADD COLUMN first_purchase_at TIMESTAMPTZ;
  END IF;
  
  -- Última compra
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='user_profiles' AND column_name='last_purchase_at') THEN
    ALTER TABLE user_profiles ADD COLUMN last_purchase_at TIMESTAMPTZ;
  END IF;
  
  -- Total de compras
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='user_profiles' AND column_name='total_purchases') THEN
    ALTER TABLE user_profiles ADD COLUMN total_purchases INTEGER DEFAULT 0;
  END IF;
  
  -- Valor total de compras
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='user_profiles' AND column_name='total_spent') THEN
    ALTER TABLE user_profiles ADD COLUMN total_spent DECIMAL(12,2) DEFAULT 0;
  END IF;
  
  -- Promedio de compra
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='user_profiles' AND column_name='average_order_value') THEN
    ALTER TABLE user_profiles ADD COLUMN average_order_value DECIMAL(12,2) DEFAULT 0;
  END IF;
  
  -- Frecuencia de compra (compras por año)
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='user_profiles' AND column_name='purchase_frequency') THEN
    ALTER TABLE user_profiles ADD COLUMN purchase_frequency DECIMAL(5,2) DEFAULT 0;
  END IF;
  
  -- Fuente de adquisición
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='user_profiles' AND column_name='acquisition_source') THEN
    ALTER TABLE user_profiles ADD COLUMN acquisition_source VARCHAR(100);
  END IF;
  
  -- Notas del CRM
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='user_profiles' AND column_name='crm_notes') THEN
    ALTER TABLE user_profiles ADD COLUMN crm_notes TEXT;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_user_profiles_customer_type ON user_profiles(customer_type);
CREATE INDEX IF NOT EXISTS idx_user_profiles_segment ON user_profiles(segment);
CREATE INDEX IF NOT EXISTS idx_user_profiles_last_purchase ON user_profiles(last_purchase_at);
CREATE INDEX IF NOT EXISTS idx_user_profiles_total_spent ON user_profiles(total_spent);

-- ============================================================================
-- PARTE 10: CAMPOS ADICIONALES EN DISTRIBUTORS
-- ============================================================================

DO $$ 
BEGIN
  -- Pedido mínimo
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='distributors' AND column_name='minimum_order') THEN
    ALTER TABLE distributors ADD COLUMN minimum_order DECIMAL(12,2) DEFAULT 0;
  END IF;
  
  -- Días de crédito
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='distributors' AND column_name='credit_days') THEN
    ALTER TABLE distributors ADD COLUMN credit_days INTEGER DEFAULT 0;
  END IF;
  
  -- Primera compra
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='distributors' AND column_name='first_purchase_at') THEN
    ALTER TABLE distributors ADD COLUMN first_purchase_at TIMESTAMPTZ;
  END IF;
  
  -- Última compra
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='distributors' AND column_name='last_purchase_at') THEN
    ALTER TABLE distributors ADD COLUMN last_purchase_at TIMESTAMPTZ;
  END IF;
  
  -- Total de compras
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='distributors' AND column_name='total_purchases') THEN
    ALTER TABLE distributors ADD COLUMN total_purchases INTEGER DEFAULT 0;
  END IF;
  
  -- Frecuencia de compra
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='distributors' AND column_name='purchase_frequency') THEN
    ALTER TABLE distributors ADD COLUMN purchase_frequency DECIMAL(5,2) DEFAULT 0;
  END IF;
  
  -- Segmento
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='distributors' AND column_name='segment') THEN
    ALTER TABLE distributors ADD COLUMN segment VARCHAR(50);
  END IF;
END $$;

-- ============================================================================
-- PARTE 11: AGREGAR agent_id A ORDERS
-- ============================================================================

DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='orders' AND column_name='agent_id') THEN
    ALTER TABLE orders ADD COLUMN agent_id UUID REFERENCES sales_agents(id);
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_orders_agent ON orders(agent_id);

-- ============================================================================
-- PARTE 12: TRIGGERS
-- ============================================================================

-- Trigger para updated_at en sales_agents
DROP TRIGGER IF EXISTS update_sales_agents_updated_at ON sales_agents;
CREATE TRIGGER update_sales_agents_updated_at BEFORE UPDATE ON sales_agents
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Trigger para updated_at en product_types
DROP TRIGGER IF EXISTS update_product_types_updated_at ON product_types;
CREATE TRIGGER update_product_types_updated_at BEFORE UPDATE ON product_types
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Trigger para updated_at en agent_commissions
DROP TRIGGER IF EXISTS update_agent_commissions_updated_at ON agent_commissions;
CREATE TRIGGER update_agent_commissions_updated_at BEFORE UPDATE ON agent_commissions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- PARTE 13: FUNCIÓN PARA CALCULAR SEGMENTO DE USUARIO
-- ============================================================================

CREATE OR REPLACE FUNCTION calculate_user_segment(
  p_last_purchase TIMESTAMPTZ,
  p_purchase_frequency DECIMAL,
  p_total_spent DECIMAL
) RETURNS VARCHAR(50) AS $$
DECLARE
  days_since_purchase INTEGER;
  segment VARCHAR(50);
BEGIN
  IF p_last_purchase IS NULL THEN
    RETURN 'nuevo';
  END IF;
  
  days_since_purchase := EXTRACT(DAY FROM NOW() - p_last_purchase);
  
  -- Segmentación basada en RFM simplificado
  IF days_since_purchase <= 30 AND p_purchase_frequency >= 6 AND p_total_spent >= 5000000 THEN
    segment := 'vip';
  ELSIF days_since_purchase <= 60 AND p_purchase_frequency >= 4 THEN
    segment := 'leal';
  ELSIF days_since_purchase <= 90 AND p_purchase_frequency >= 2 THEN
    segment := 'regular';
  ELSIF days_since_purchase <= 180 THEN
    segment := 'ocasional';
  ELSIF days_since_purchase <= 365 THEN
    segment := 'en_riesgo';
  ELSE
    segment := 'dormido';
  END IF;
  
  RETURN segment;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- PARTE 14: FUNCIÓN PARA ACTUALIZAR MÉTRICAS DE USUARIO DESPUÉS DE ORDEN
-- ============================================================================

CREATE OR REPLACE FUNCTION update_user_metrics_after_order()
RETURNS TRIGGER AS $$
DECLARE
  v_user_id UUID;
  v_distributor_id UUID;
  v_first_purchase TIMESTAMPTZ;
  v_total_purchases INTEGER;
  v_total_spent DECIMAL;
  v_avg_order DECIMAL;
  v_frequency DECIMAL;
  v_segment VARCHAR(50);
  v_years_active DECIMAL;
BEGIN
  v_user_id := NEW.user_id;
  v_distributor_id := NEW.distributor_id;
  
  -- Solo procesar si la orden está completada/entregada
  IF NEW.status NOT IN ('delivered', 'shipped') THEN
    RETURN NEW;
  END IF;
  
  -- Calcular métricas para user_profiles
  SELECT 
    MIN(created_at),
    COUNT(*),
    COALESCE(SUM(total), 0)
  INTO v_first_purchase, v_total_purchases, v_total_spent
  FROM orders
  WHERE user_id = v_user_id AND status IN ('delivered', 'shipped');
  
  v_avg_order := CASE WHEN v_total_purchases > 0 THEN v_total_spent / v_total_purchases ELSE 0 END;
  
  -- Calcular frecuencia (compras por año)
  v_years_active := GREATEST(EXTRACT(EPOCH FROM NOW() - v_first_purchase) / (365.25 * 24 * 3600), 0.1);
  v_frequency := v_total_purchases / v_years_active;
  
  -- Calcular segmento
  v_segment := calculate_user_segment(NEW.created_at, v_frequency, v_total_spent);
  
  -- Actualizar user_profiles
  UPDATE user_profiles SET
    first_purchase_at = COALESCE(first_purchase_at, v_first_purchase),
    last_purchase_at = NEW.created_at,
    total_purchases = v_total_purchases,
    total_spent = v_total_spent,
    average_order_value = v_avg_order,
    purchase_frequency = v_frequency,
    segment = v_segment,
    updated_at = NOW()
  WHERE id = v_user_id;
  
  -- Si es distribuidor, actualizar también
  IF v_distributor_id IS NOT NULL THEN
    SELECT 
      MIN(o.created_at),
      COUNT(*),
      COUNT(*) / GREATEST(EXTRACT(EPOCH FROM NOW() - MIN(o.created_at)) / (365.25 * 24 * 3600), 0.1)
    INTO v_first_purchase, v_total_purchases, v_frequency
    FROM orders o
    WHERE o.distributor_id = v_distributor_id AND o.status IN ('delivered', 'shipped');
    
    UPDATE distributors SET
      first_purchase_at = COALESCE(first_purchase_at, v_first_purchase),
      last_purchase_at = NEW.created_at,
      total_purchases = v_total_purchases,
      purchase_frequency = v_frequency,
      segment = calculate_user_segment(NEW.created_at, v_frequency, v_total_spent),
      updated_at = NOW()
    WHERE id = v_distributor_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_user_metrics ON orders;
CREATE TRIGGER trigger_update_user_metrics
  AFTER INSERT OR UPDATE OF status ON orders
  FOR EACH ROW
  EXECUTE FUNCTION update_user_metrics_after_order();

-- ============================================================================
-- PARTE 15: FUNCIÓN PARA CREAR COMISIÓN DE AGENTE
-- ============================================================================

CREATE OR REPLACE FUNCTION create_agent_commission_on_order()
RETURNS TRIGGER AS $$
DECLARE
  v_agent_id UUID;
  v_commission_rate DECIMAL;
  v_assignment RECORD;
BEGIN
  -- Solo procesar si hay distribuidor
  IF NEW.distributor_id IS NULL THEN
    RETURN NEW;
  END IF;
  
  -- Buscar asignación activa
  SELECT ada.*, sa.default_commission_rate
  INTO v_assignment
  FROM agent_distributor_assignments ada
  JOIN sales_agents sa ON sa.id = ada.agent_id
  WHERE ada.distributor_id = NEW.distributor_id AND ada.is_active = true;
  
  IF v_assignment IS NULL THEN
    RETURN NEW;
  END IF;
  
  -- Determinar tasa de comisión
  v_commission_rate := COALESCE(v_assignment.commission_rate, v_assignment.default_commission_rate);
  
  -- Actualizar order con agent_id
  NEW.agent_id := v_assignment.agent_id;
  
  -- Crear registro de comisión pendiente
  INSERT INTO agent_commissions (
    agent_id,
    order_id,
    distributor_id,
    order_total,
    commission_rate,
    commission_amount,
    status,
    order_date,
    commission_due_at
  ) VALUES (
    v_assignment.agent_id,
    NEW.id,
    NEW.distributor_id,
    NEW.total,
    v_commission_rate,
    NEW.total * v_commission_rate / 100,
    'pending',
    NEW.created_at,
    NEW.created_at + INTERVAL '90 days'
  )
  ON CONFLICT DO NOTHING;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_create_agent_commission ON orders;
CREATE TRIGGER trigger_create_agent_commission
  BEFORE INSERT ON orders
  FOR EACH ROW
  EXECUTE FUNCTION create_agent_commission_on_order();

-- ============================================================================
-- PARTE 16: COMENTARIOS PARA DOCUMENTACIÓN
-- ============================================================================

COMMENT ON TABLE product_types IS 'Tipos de producto (3er nivel de categorización después de subcategorías)';
COMMENT ON TABLE sales_agents IS 'Agentes comerciales/corredores del canal de ventas';
COMMENT ON TABLE agent_distributor_assignments IS 'Asignación 1:1 de corredores a distribuidores';
COMMENT ON TABLE agent_commissions IS 'Comisiones de agentes por órdenes de sus distribuidores';
COMMENT ON TABLE product_change_log IS 'Historial de cambios en productos (CSV, ERP, admin)';
COMMENT ON TABLE csv_imports IS 'Historial de importaciones de archivos CSV';

COMMENT ON COLUMN products.descuento_porcentaje IS 'Porcentaje de descuento activo - si > 0, el producto aparece en ofertas';
COMMENT ON COLUMN products.descripcion_distribuidor IS 'Descripción visible solo para distribuidores y canal';
COMMENT ON COLUMN products.argumentos_venta IS 'Argumentos de venta para distribuidores';
COMMENT ON COLUMN products.ubicacion_tienda IS 'Sugerencia de ubicación del producto en tienda del distribuidor';
COMMENT ON COLUMN products.rotacion_esperada IS 'Rotación esperada: alta, media, baja';
COMMENT ON COLUMN products.descontinuado IS 'Producto que no se volverá a incluir en el catálogo (informativo)';

COMMENT ON COLUMN distributors.minimum_order IS 'Pedido mínimo requerido para B2B';
COMMENT ON COLUMN distributors.credit_days IS 'Días de crédito otorgados';

COMMENT ON COLUMN agent_commissions.commission_due_at IS 'Fecha límite para pagar comisión (90 días después del pago de factura)';
