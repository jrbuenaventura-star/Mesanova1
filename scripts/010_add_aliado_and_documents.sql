-- Migración: Agregar rol Aliado, documentos de distribuidor y CRM de leads
-- Fecha: 2026-01-20

-- ===========================================
-- 1. ACTUALIZAR ENUM DE ROLES
-- ===========================================

-- Agregar nuevo valor al enum user_role
ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'aliado';

-- ===========================================
-- 2. TABLA DE ALIADOS (antes corredores/canales)
-- ===========================================

CREATE TABLE IF NOT EXISTS aliados (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  
  -- Información de la agencia/empresa
  company_name VARCHAR(255) NOT NULL,
  contact_name VARCHAR(255),
  phone VARCHAR(50),
  email VARCHAR(255),
  
  -- Métricas
  total_sales DECIMAL(15,2) DEFAULT 0,
  commission_percentage DECIMAL(5,2) DEFAULT 0,
  
  -- Estado
  is_active BOOLEAN DEFAULT true,
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(user_id)
);

-- ===========================================
-- 3. RELACIÓN ALIADO - DISTRIBUIDOR
-- ===========================================

-- Agregar columna aliado_id a distribuidores
ALTER TABLE distributors 
ADD COLUMN IF NOT EXISTS aliado_id UUID REFERENCES aliados(id) ON DELETE SET NULL;

-- Índice para búsquedas por aliado
CREATE INDEX IF NOT EXISTS idx_distributors_aliado ON distributors(aliado_id);

-- ===========================================
-- 4. DOCUMENTOS DE DISTRIBUIDOR
-- ===========================================

CREATE TABLE IF NOT EXISTS distributor_documents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  distributor_id UUID NOT NULL REFERENCES distributors(id) ON DELETE CASCADE,
  
  -- Tipo de documento
  document_type VARCHAR(50) NOT NULL, -- 'estados_financieros', 'rut', 'camara_comercio', 'certificado_bancario'
  
  -- Información del archivo
  file_name VARCHAR(255) NOT NULL,
  file_url TEXT, -- URL de Supabase Storage o Google Drive
  google_drive_file_id VARCHAR(255), -- ID del archivo en Google Drive
  file_size INTEGER, -- Tamaño en bytes
  mime_type VARCHAR(100),
  
  -- Período (para estados financieros)
  fiscal_year INTEGER, -- Año fiscal (ej: 2025)
  
  -- Estado y validación
  status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'approved', 'rejected', 'expired'
  expires_at TIMESTAMPTZ, -- Fecha de vencimiento (para estados financieros: abril del año siguiente)
  reviewed_at TIMESTAMPTZ,
  reviewed_by UUID REFERENCES user_profiles(id),
  review_notes TEXT,
  
  -- Metadata
  uploaded_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Un solo documento activo por tipo y año
  UNIQUE(distributor_id, document_type, fiscal_year)
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_distributor_documents_distributor ON distributor_documents(distributor_id);
CREATE INDEX IF NOT EXISTS idx_distributor_documents_status ON distributor_documents(status);
CREATE INDEX IF NOT EXISTS idx_distributor_documents_expires ON distributor_documents(expires_at);

-- ===========================================
-- 5. CRM - LEADS DE POTENCIALES DISTRIBUIDORES
-- ===========================================

CREATE TABLE IF NOT EXISTS leads (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  aliado_id UUID REFERENCES aliados(id) ON DELETE SET NULL, -- Aliado que ingresó el lead
  
  -- Información de la empresa
  company_name VARCHAR(255) NOT NULL,
  business_type VARCHAR(100), -- Tipo de negocio
  
  -- Contacto principal
  contact_name VARCHAR(255) NOT NULL,
  contact_phone VARCHAR(50),
  contact_email VARCHAR(255),
  contact_position VARCHAR(100), -- Cargo del contacto
  
  -- Ubicación
  city VARCHAR(100),
  state VARCHAR(100),
  address TEXT,
  
  -- Pipeline/Funnel
  stage VARCHAR(50) DEFAULT 'prospecto', 
  -- Valores: 'prospecto', 'contactado', 'interesado', 'docs_comerciales_enviados', 
  --          'docs_analisis_solicitados', 'docs_analisis_recibidos', 'aprobado', 'rechazado'
  
  -- Seguimiento
  last_contact_date TIMESTAMPTZ,
  next_follow_up_date TIMESTAMPTZ,
  
  -- Notas
  notes TEXT,
  
  -- Resultado
  converted_to_distributor_id UUID REFERENCES distributors(id), -- Si se convierte en distribuidor
  rejection_reason TEXT,
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_leads_aliado ON leads(aliado_id);
CREATE INDEX IF NOT EXISTS idx_leads_stage ON leads(stage);
CREATE INDEX IF NOT EXISTS idx_leads_next_followup ON leads(next_follow_up_date);

-- ===========================================
-- 6. HISTORIAL DE ACTIVIDADES DEL LEAD (CRM)
-- ===========================================

CREATE TABLE IF NOT EXISTS lead_activities (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  lead_id UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  user_id UUID REFERENCES user_profiles(id), -- Quien realizó la actividad
  
  -- Tipo de actividad
  activity_type VARCHAR(50) NOT NULL, -- 'call', 'email', 'meeting', 'note', 'stage_change', 'document'
  
  -- Descripción
  description TEXT NOT NULL,
  
  -- Cambio de etapa (si aplica)
  old_stage VARCHAR(50),
  new_stage VARCHAR(50),
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_lead_activities_lead ON lead_activities(lead_id);

-- ===========================================
-- 7. FACTURAS (para dashboard distribuidor)
-- ===========================================

CREATE TABLE IF NOT EXISTS invoices (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  distributor_id UUID NOT NULL REFERENCES distributors(id) ON DELETE CASCADE,
  order_id UUID REFERENCES orders(id), -- Orden relacionada
  
  -- Número de factura
  invoice_number VARCHAR(50) NOT NULL UNIQUE,
  
  -- Montos
  subtotal DECIMAL(15,2) NOT NULL,
  tax DECIMAL(15,2) DEFAULT 0,
  total DECIMAL(15,2) NOT NULL,
  
  -- Fechas
  issue_date DATE NOT NULL,
  due_date DATE NOT NULL, -- Fecha de vencimiento (issue_date + 30 días)
  
  -- Estado de pago
  payment_status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'partial', 'paid', 'overdue'
  amount_paid DECIMAL(15,2) DEFAULT 0,
  
  -- Pagos
  last_payment_date TIMESTAMPTZ,
  payment_reference VARCHAR(255), -- Referencia del pago
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_invoices_distributor ON invoices(distributor_id);
CREATE INDEX IF NOT EXISTS idx_invoices_due_date ON invoices(due_date);
CREATE INDEX IF NOT EXISTS idx_invoices_payment_status ON invoices(payment_status);

-- ===========================================
-- 8. ACTUALIZAR TABLA DISTRIBUTORS
-- ===========================================

-- Agregar campos faltantes a distributors
ALTER TABLE distributors 
ADD COLUMN IF NOT EXISTS contact_name VARCHAR(255),
ADD COLUMN IF NOT EXISTS contact_phone VARCHAR(50),
ADD COLUMN IF NOT EXISTS contact_email VARCHAR(255),
ADD COLUMN IF NOT EXISTS contact_position VARCHAR(100),
ADD COLUMN IF NOT EXISTS address TEXT,
ADD COLUMN IF NOT EXISTS city VARCHAR(100),
ADD COLUMN IF NOT EXISTS state VARCHAR(100),
ADD COLUMN IF NOT EXISTS documents_complete BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS documents_expire_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS last_purchase_date TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS total_purchases DECIMAL(15,2) DEFAULT 0;

-- ===========================================
-- 9. TRIGGERS PARA UPDATED_AT
-- ===========================================

-- Función para actualizar updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers
DROP TRIGGER IF EXISTS update_aliados_updated_at ON aliados;
CREATE TRIGGER update_aliados_updated_at
  BEFORE UPDATE ON aliados
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_distributor_documents_updated_at ON distributor_documents;
CREATE TRIGGER update_distributor_documents_updated_at
  BEFORE UPDATE ON distributor_documents
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_leads_updated_at ON leads;
CREATE TRIGGER update_leads_updated_at
  BEFORE UPDATE ON leads
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_invoices_updated_at ON invoices;
CREATE TRIGGER update_invoices_updated_at
  BEFORE UPDATE ON invoices
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ===========================================
-- 10. RLS POLICIES
-- ===========================================

-- Habilitar RLS
ALTER TABLE aliados ENABLE ROW LEVEL SECURITY;
ALTER TABLE distributor_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE lead_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;

-- Políticas para aliados
CREATE POLICY "Aliados: superadmin puede ver todos" ON aliados
  FOR ALL USING (
    EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role = 'superadmin')
  );

CREATE POLICY "Aliados: aliado puede ver su propio registro" ON aliados
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Aliados: aliado puede actualizar su propio registro" ON aliados
  FOR UPDATE USING (user_id = auth.uid());

-- Políticas para documentos
CREATE POLICY "Documentos: superadmin puede ver todos" ON distributor_documents
  FOR ALL USING (
    EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role = 'superadmin')
  );

CREATE POLICY "Documentos: distribuidor puede ver sus propios documentos" ON distributor_documents
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM distributors d 
      WHERE d.id = distributor_documents.distributor_id 
      AND d.user_id = auth.uid()
    )
  );

CREATE POLICY "Documentos: distribuidor puede subir sus propios documentos" ON distributor_documents
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM distributors d 
      WHERE d.id = distributor_documents.distributor_id 
      AND d.user_id = auth.uid()
    )
  );

-- Políticas para leads
CREATE POLICY "Leads: superadmin puede ver todos" ON leads
  FOR ALL USING (
    EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role = 'superadmin')
  );

CREATE POLICY "Leads: aliado puede ver sus propios leads" ON leads
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM aliados a 
      WHERE a.id = leads.aliado_id 
      AND a.user_id = auth.uid()
    )
  );

CREATE POLICY "Leads: aliado puede crear leads" ON leads
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM aliados a 
      WHERE a.id = leads.aliado_id 
      AND a.user_id = auth.uid()
    )
  );

CREATE POLICY "Leads: aliado puede actualizar sus propios leads" ON leads
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM aliados a 
      WHERE a.id = leads.aliado_id 
      AND a.user_id = auth.uid()
    )
  );

-- Políticas para actividades de leads
CREATE POLICY "Actividades: superadmin puede ver todas" ON lead_activities
  FOR ALL USING (
    EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role = 'superadmin')
  );

CREATE POLICY "Actividades: aliado puede ver actividades de sus leads" ON lead_activities
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM leads l
      JOIN aliados a ON a.id = l.aliado_id
      WHERE l.id = lead_activities.lead_id 
      AND a.user_id = auth.uid()
    )
  );

CREATE POLICY "Actividades: aliado puede crear actividades en sus leads" ON lead_activities
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM leads l
      JOIN aliados a ON a.id = l.aliado_id
      WHERE l.id = lead_activities.lead_id 
      AND a.user_id = auth.uid()
    )
  );

-- Políticas para facturas
CREATE POLICY "Facturas: superadmin puede ver todas" ON invoices
  FOR ALL USING (
    EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role = 'superadmin')
  );

CREATE POLICY "Facturas: distribuidor puede ver sus propias facturas" ON invoices
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM distributors d 
      WHERE d.id = invoices.distributor_id 
      AND d.user_id = auth.uid()
    )
  );

CREATE POLICY "Facturas: aliado puede ver facturas de sus distribuidores" ON invoices
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM distributors d
      JOIN aliados a ON a.id = d.aliado_id
      WHERE d.id = invoices.distributor_id 
      AND a.user_id = auth.uid()
    )
  );

-- ===========================================
-- 11. VISTAS ÚTILES
-- ===========================================

-- Vista: Distribuidores con información completa para aliados
CREATE OR REPLACE VIEW v_distributor_summary AS
SELECT 
  d.id,
  d.company_name,
  d.business_type,
  d.contact_name,
  d.contact_email,
  d.is_active,
  d.aliado_id,
  d.last_purchase_date,
  d.total_purchases,
  d.credit_limit,
  d.current_balance,
  -- Calcular promedio de compras del último año
  COALESCE(
    (SELECT AVG(total) FROM orders o 
     WHERE o.distributor_id = d.id 
     AND o.created_at > NOW() - INTERVAL '1 year'),
    0
  ) as avg_monthly_purchases,
  -- Contar órdenes del último año
  (SELECT COUNT(*) FROM orders o 
   WHERE o.distributor_id = d.id 
   AND o.created_at > NOW() - INTERVAL '1 year') as orders_last_year
FROM distributors d;

-- Vista: Facturas pendientes por distribuidor
CREATE OR REPLACE VIEW v_pending_invoices AS
SELECT 
  i.*,
  d.company_name as distributor_name,
  CASE 
    WHEN i.due_date < CURRENT_DATE THEN 'overdue'
    WHEN i.due_date <= CURRENT_DATE + INTERVAL '7 days' THEN 'due_soon'
    ELSE 'ok'
  END as urgency,
  i.total - i.amount_paid as amount_pending
FROM invoices i
JOIN distributors d ON d.id = i.distributor_id
WHERE i.payment_status IN ('pending', 'partial', 'overdue');

COMMENT ON TABLE aliados IS 'Aliados comerciales (ex corredores/canales) que gestionan distribuidores';
COMMENT ON TABLE distributor_documents IS 'Documentos legales y financieros de distribuidores';
COMMENT ON TABLE leads IS 'Prospectos de potenciales distribuidores (CRM)';
COMMENT ON TABLE lead_activities IS 'Historial de actividades del CRM';
COMMENT ON TABLE invoices IS 'Facturas de distribuidores';
