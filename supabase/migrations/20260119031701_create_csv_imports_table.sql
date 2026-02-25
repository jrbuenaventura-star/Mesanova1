-- Historial de importaciones CSV
CREATE TABLE IF NOT EXISTS csv_imports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  filename TEXT NOT NULL,
  file_size INTEGER,
  total_rows INTEGER,
  rows_created INTEGER DEFAULT 0,
  rows_updated INTEGER DEFAULT 0,
  rows_skipped INTEGER DEFAULT 0,
  rows_error INTEGER DEFAULT 0,
  errors JSONB,
  status VARCHAR(50) DEFAULT 'pending',
  import_mode VARCHAR(50) DEFAULT 'update',
  imported_by UUID REFERENCES user_profiles(id),
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_csv_imports_status ON csv_imports(status);
CREATE INDEX IF NOT EXISTS idx_csv_imports_date ON csv_imports(created_at DESC);;
