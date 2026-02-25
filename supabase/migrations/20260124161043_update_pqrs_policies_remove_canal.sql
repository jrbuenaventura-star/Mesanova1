
-- Actualizar política para remover 'canal' y usar solo 'aliado'
DROP POLICY IF EXISTS "Distribuidores y agentes pueden crear tickets" ON pqrs_tickets;

CREATE POLICY "Distribuidores y aliados pueden crear tickets"
ON pqrs_tickets FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM user_profiles
    WHERE user_profiles.id = auth.uid()
    AND user_profiles.role IN ('distributor', 'aliado')
  )
  AND creado_por = auth.uid()
);
;
