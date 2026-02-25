CREATE TABLE IF NOT EXISTS leads (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  aliado_id UUID REFERENCES aliados(id) ON DELETE SET NULL,
  company_name VARCHAR(255) NOT NULL,
  business_type VARCHAR(100),
  contact_name VARCHAR(255) NOT NULL,
  contact_phone VARCHAR(50),
  contact_email VARCHAR(255),
  contact_position VARCHAR(100),
  city VARCHAR(100),
  state VARCHAR(100),
  address TEXT,
  stage VARCHAR(50) DEFAULT 'prospecto',
  last_contact_date TIMESTAMPTZ,
  next_follow_up_date TIMESTAMPTZ,
  notes TEXT,
  converted_to_distributor_id UUID REFERENCES distributors(id),
  rejection_reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_leads_aliado ON leads(aliado_id);
CREATE INDEX IF NOT EXISTS idx_leads_stage ON leads(stage);
CREATE INDEX IF NOT EXISTS idx_leads_next_followup ON leads(next_follow_up_date);;
