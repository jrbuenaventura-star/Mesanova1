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
  );;
