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
  );;
