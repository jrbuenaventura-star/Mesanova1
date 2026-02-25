-- Tabla de corredores/canal
CREATE TABLE IF NOT EXISTS sales_agents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  employee_code VARCHAR(50) UNIQUE,
  hire_date DATE,
  territory VARCHAR(255),
  default_commission_rate DECIMAL(5,2) DEFAULT 0,
  commission_payment_days INTEGER DEFAULT 90,
  monthly_sales_target DECIMAL(12,2) DEFAULT 0,
  quarterly_sales_target DECIMAL(12,2) DEFAULT 0,
  annual_sales_target DECIMAL(12,2) DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES user_profiles(id),
  UNIQUE(user_id)
);

CREATE INDEX IF NOT EXISTS idx_sales_agents_user ON sales_agents(user_id);
CREATE INDEX IF NOT EXISTS idx_sales_agents_active ON sales_agents(is_active);
CREATE INDEX IF NOT EXISTS idx_sales_agents_territory ON sales_agents(territory);;
