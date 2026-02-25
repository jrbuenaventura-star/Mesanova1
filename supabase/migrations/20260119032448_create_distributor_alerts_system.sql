-- Sistema de alertas para distribuidores inactivos

-- Tabla de configuración de alertas
CREATE TABLE IF NOT EXISTS distributor_alert_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  alert_type VARCHAR(50) NOT NULL UNIQUE,
  days_threshold INTEGER NOT NULL,
  is_active BOOLEAN DEFAULT true,
  notify_agent BOOLEAN DEFAULT true,
  notify_admin BOOLEAN DEFAULT true,
  email_template TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insertar configuraciones por defecto
INSERT INTO distributor_alert_config (alert_type, days_threshold, notify_agent, notify_admin)
VALUES 
  ('inactivity_warning', 30, true, false),
  ('inactivity_critical', 60, true, true),
  ('inactivity_dormant', 90, true, true)
ON CONFLICT (alert_type) DO NOTHING;

-- Tabla de alertas generadas
CREATE TABLE IF NOT EXISTS distributor_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  distributor_id UUID NOT NULL REFERENCES distributors(id) ON DELETE CASCADE,
  agent_id UUID REFERENCES sales_agents(id),
  alert_type VARCHAR(50) NOT NULL,
  days_since_purchase INTEGER NOT NULL,
  last_purchase_date DATE,
  last_purchase_amount DECIMAL(12,2),
  is_read BOOLEAN DEFAULT false,
  is_resolved BOOLEAN DEFAULT false,
  resolved_at TIMESTAMPTZ,
  resolved_by UUID REFERENCES user_profiles(id),
  resolution_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_distributor_alerts_distributor ON distributor_alerts(distributor_id);
CREATE INDEX IF NOT EXISTS idx_distributor_alerts_agent ON distributor_alerts(agent_id);
CREATE INDEX IF NOT EXISTS idx_distributor_alerts_type ON distributor_alerts(alert_type);
CREATE INDEX IF NOT EXISTS idx_distributor_alerts_unread ON distributor_alerts(is_read) WHERE is_read = false;
CREATE INDEX IF NOT EXISTS idx_distributor_alerts_unresolved ON distributor_alerts(is_resolved) WHERE is_resolved = false;

-- Función para generar alertas de inactividad
CREATE OR REPLACE FUNCTION generate_distributor_inactivity_alerts()
RETURNS INTEGER AS $$
DECLARE
  alert_count INTEGER := 0;
  config RECORD;
  dist RECORD;
  days_inactive INTEGER;
  v_agent_id UUID;
BEGIN
  -- Iterar por cada tipo de alerta configurado
  FOR config IN 
    SELECT * FROM distributor_alert_config WHERE is_active = true ORDER BY days_threshold
  LOOP
    -- Buscar distribuidores que cumplen el criterio
    FOR dist IN
      SELECT 
        d.id as distributor_id,
        d.last_purchase_at,
        d.company_name,
        ada.agent_id
      FROM distributors d
      LEFT JOIN agent_distributor_assignments ada ON ada.distributor_id = d.id AND ada.is_active = true
      WHERE d.is_active = true
        AND (
          d.last_purchase_at IS NULL 
          OR d.last_purchase_at < NOW() - (config.days_threshold || ' days')::INTERVAL
        )
        AND NOT EXISTS (
          SELECT 1 FROM distributor_alerts da 
          WHERE da.distributor_id = d.id 
            AND da.alert_type = config.alert_type 
            AND da.is_resolved = false
            AND da.created_at > NOW() - INTERVAL '7 days'
        )
    LOOP
      -- Calcular días de inactividad
      IF dist.last_purchase_at IS NOT NULL THEN
        days_inactive := EXTRACT(DAY FROM NOW() - dist.last_purchase_at);
      ELSE
        days_inactive := 999;
      END IF;
      
      -- Solo crear alerta si cumple el umbral exacto (evitar duplicados)
      IF days_inactive >= config.days_threshold THEN
        INSERT INTO distributor_alerts (
          distributor_id,
          agent_id,
          alert_type,
          days_since_purchase,
          last_purchase_date,
          last_purchase_amount
        )
        SELECT 
          dist.distributor_id,
          dist.agent_id,
          config.alert_type,
          days_inactive,
          dist.last_purchase_at::DATE,
          (SELECT total FROM orders WHERE distributor_id = dist.distributor_id ORDER BY created_at DESC LIMIT 1);
        
        alert_count := alert_count + 1;
      END IF;
    END LOOP;
  END LOOP;
  
  RETURN alert_count;
END;
$$ LANGUAGE plpgsql;

-- Función para resolver alerta automáticamente cuando el distribuidor compra
CREATE OR REPLACE FUNCTION auto_resolve_distributor_alerts()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.distributor_id IS NOT NULL THEN
    UPDATE distributor_alerts
    SET 
      is_resolved = true,
      resolved_at = NOW(),
      resolution_notes = 'Resuelto automáticamente - Nueva compra registrada'
    WHERE distributor_id = NEW.distributor_id
      AND is_resolved = false;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_auto_resolve_alerts ON orders;
CREATE TRIGGER trigger_auto_resolve_alerts
  AFTER INSERT ON orders
  FOR EACH ROW
  EXECUTE FUNCTION auto_resolve_distributor_alerts();

-- Comentarios
COMMENT ON TABLE distributor_alert_config IS 'Configuración de umbrales para alertas de inactividad';
COMMENT ON TABLE distributor_alerts IS 'Alertas generadas por inactividad de distribuidores';
COMMENT ON FUNCTION generate_distributor_inactivity_alerts() IS 'Ejecutar periódicamente (cron) para generar alertas';;
