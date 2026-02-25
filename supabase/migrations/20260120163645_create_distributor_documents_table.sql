CREATE TABLE IF NOT EXISTS distributor_documents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  distributor_id UUID NOT NULL REFERENCES distributors(id) ON DELETE CASCADE,
  document_type VARCHAR(50) NOT NULL,
  file_name VARCHAR(255) NOT NULL,
  file_url TEXT,
  google_drive_file_id VARCHAR(255),
  file_size INTEGER,
  mime_type VARCHAR(100),
  fiscal_year INTEGER,
  status VARCHAR(50) DEFAULT 'pending',
  expires_at TIMESTAMPTZ,
  reviewed_at TIMESTAMPTZ,
  reviewed_by UUID REFERENCES user_profiles(id),
  review_notes TEXT,
  uploaded_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(distributor_id, document_type, fiscal_year)
);

CREATE INDEX IF NOT EXISTS idx_distributor_documents_distributor ON distributor_documents(distributor_id);
CREATE INDEX IF NOT EXISTS idx_distributor_documents_status ON distributor_documents(status);
CREATE INDEX IF NOT EXISTS idx_distributor_documents_expires ON distributor_documents(expires_at);;
