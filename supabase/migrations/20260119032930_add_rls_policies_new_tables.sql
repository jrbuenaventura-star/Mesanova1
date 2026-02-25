-- Habilitar RLS en nuevas tablas
ALTER TABLE product_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales_agents ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_distributor_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_commissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_change_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE csv_imports ENABLE ROW LEVEL SECURITY;
ALTER TABLE distributor_alert_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE distributor_alerts ENABLE ROW LEVEL SECURITY;

-- PRODUCT_TYPES: Lectura pública, escritura solo superadmin
DROP POLICY IF EXISTS "product_types_read_all" ON product_types;
CREATE POLICY "product_types_read_all" ON product_types
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "product_types_write_superadmin" ON product_types;
CREATE POLICY "product_types_write_superadmin" ON product_types
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid() AND role = 'superadmin'
    )
  );

-- SALES_AGENTS: Lectura por superadmin y el propio agente, escritura superadmin
DROP POLICY IF EXISTS "sales_agents_read" ON sales_agents;
CREATE POLICY "sales_agents_read" ON sales_agents
  FOR SELECT USING (
    user_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid() AND role = 'superadmin'
    )
  );

DROP POLICY IF EXISTS "sales_agents_write_superadmin" ON sales_agents;
CREATE POLICY "sales_agents_write_superadmin" ON sales_agents
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid() AND role = 'superadmin'
    )
  );

-- AGENT_DISTRIBUTOR_ASSIGNMENTS: Lectura por agente asignado y superadmin
DROP POLICY IF EXISTS "agent_assignments_read" ON agent_distributor_assignments;
CREATE POLICY "agent_assignments_read" ON agent_distributor_assignments
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM sales_agents sa
      WHERE sa.id = agent_distributor_assignments.agent_id AND sa.user_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid() AND role = 'superadmin'
    )
  );

DROP POLICY IF EXISTS "agent_assignments_write_superadmin" ON agent_distributor_assignments;
CREATE POLICY "agent_assignments_write_superadmin" ON agent_distributor_assignments
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid() AND role = 'superadmin'
    )
  );

-- AGENT_COMMISSIONS: Lectura por agente propietario y superadmin
DROP POLICY IF EXISTS "agent_commissions_read" ON agent_commissions;
CREATE POLICY "agent_commissions_read" ON agent_commissions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM sales_agents sa
      WHERE sa.id = agent_commissions.agent_id AND sa.user_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid() AND role = 'superadmin'
    )
  );

DROP POLICY IF EXISTS "agent_commissions_write_superadmin" ON agent_commissions;
CREATE POLICY "agent_commissions_write_superadmin" ON agent_commissions
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid() AND role = 'superadmin'
    )
  );

-- PRODUCT_CHANGE_LOG: Lectura por superadmin y canal
DROP POLICY IF EXISTS "product_change_log_read" ON product_change_log;
CREATE POLICY "product_change_log_read" ON product_change_log
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid() AND role IN ('superadmin', 'canal')
    )
  );

DROP POLICY IF EXISTS "product_change_log_insert" ON product_change_log;
CREATE POLICY "product_change_log_insert" ON product_change_log
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid() AND role IN ('superadmin', 'canal')
    )
  );

-- CSV_IMPORTS: Solo superadmin
DROP POLICY IF EXISTS "csv_imports_superadmin" ON csv_imports;
CREATE POLICY "csv_imports_superadmin" ON csv_imports
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid() AND role = 'superadmin'
    )
  );

-- DISTRIBUTOR_ALERT_CONFIG: Solo superadmin
DROP POLICY IF EXISTS "distributor_alert_config_superadmin" ON distributor_alert_config;
CREATE POLICY "distributor_alert_config_superadmin" ON distributor_alert_config
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid() AND role = 'superadmin'
    )
  );

-- DISTRIBUTOR_ALERTS: Lectura por agente asignado y superadmin
DROP POLICY IF EXISTS "distributor_alerts_read" ON distributor_alerts;
CREATE POLICY "distributor_alerts_read" ON distributor_alerts
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM sales_agents sa
      WHERE sa.id = distributor_alerts.agent_id AND sa.user_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid() AND role = 'superadmin'
    )
  );

DROP POLICY IF EXISTS "distributor_alerts_update" ON distributor_alerts;
CREATE POLICY "distributor_alerts_update" ON distributor_alerts
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM sales_agents sa
      WHERE sa.id = distributor_alerts.agent_id AND sa.user_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid() AND role = 'superadmin'
    )
  );

DROP POLICY IF EXISTS "distributor_alerts_insert_superadmin" ON distributor_alerts;
CREATE POLICY "distributor_alerts_insert_superadmin" ON distributor_alerts
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid() AND role = 'superadmin'
    )
  );;
