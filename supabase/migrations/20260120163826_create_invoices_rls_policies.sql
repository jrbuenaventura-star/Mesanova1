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
  );;
