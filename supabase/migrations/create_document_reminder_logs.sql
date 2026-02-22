-- Historial de recordatorios de documentos para auditoría y deduplicación
CREATE TABLE IF NOT EXISTS document_reminder_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  dedupe_key TEXT NOT NULL UNIQUE,
  scope TEXT NOT NULL CHECK (scope IN ('distributor', 'superadmin_summary')),
  distributor_id UUID REFERENCES distributors(id) ON DELETE SET NULL,
  recipient_email TEXT NOT NULL,
  week_start DATE NOT NULL,
  reminder_status TEXT CHECK (reminder_status IN ('ok', 'pending', 'due_soon', 'expired', 'missing', 'rejected')),
  reminder_items TEXT[] NOT NULL DEFAULT '{}',
  subject TEXT,
  delivery_status TEXT NOT NULL DEFAULT 'processing' CHECK (delivery_status IN ('processing', 'sent', 'failed')),
  provider_message_id TEXT,
  error_message TEXT,
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  sent_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_document_reminder_logs_week_start
  ON document_reminder_logs(week_start DESC);

CREATE INDEX IF NOT EXISTS idx_document_reminder_logs_distributor_id
  ON document_reminder_logs(distributor_id);

CREATE INDEX IF NOT EXISTS idx_document_reminder_logs_scope_status
  ON document_reminder_logs(scope, delivery_status, week_start DESC);

CREATE INDEX IF NOT EXISTS idx_document_reminder_logs_recipient_email
  ON document_reminder_logs(LOWER(recipient_email));

CREATE OR REPLACE FUNCTION update_document_reminder_logs_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS document_reminder_logs_updated_at_trigger ON document_reminder_logs;
CREATE TRIGGER document_reminder_logs_updated_at_trigger
  BEFORE UPDATE ON document_reminder_logs
  FOR EACH ROW
  EXECUTE FUNCTION update_document_reminder_logs_updated_at();

ALTER TABLE document_reminder_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Superadmin can view document reminder logs" ON document_reminder_logs;
CREATE POLICY "Superadmin can view document reminder logs"
  ON document_reminder_logs
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.role = 'superadmin'
    )
  );

COMMENT ON TABLE document_reminder_logs IS 'Bitácora de correos de recordatorios documentales para distribuidores';
COMMENT ON COLUMN document_reminder_logs.dedupe_key IS 'Llave única por semana/destinatario/alcance para evitar duplicados manuales';
