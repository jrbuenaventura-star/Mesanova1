CREATE POLICY "Aliados: superadmin puede ver todos" ON aliados
  FOR ALL USING (
    EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role = 'superadmin')
  );

CREATE POLICY "Aliados: aliado puede ver su propio registro" ON aliados
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Aliados: aliado puede actualizar su propio registro" ON aliados
  FOR UPDATE USING (user_id = auth.uid());;
