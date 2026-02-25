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
  );;
