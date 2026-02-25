CREATE TABLE IF NOT EXISTS invoices (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  distributor_id UUID NOT NULL REFERENCES distributors(id) ON DELETE CASCADE,
  order_id UUID REFERENCES orders(id),
  invoice_number VARCHAR(50) NOT NULL UNIQUE,
  subtotal DECIMAL(15,2) NOT NULL,
  tax DECIMAL(15,2) DEFAULT 0,
  total DECIMAL(15,2) NOT NULL,
  issue_date DATE NOT NULL,
  due_date DATE NOT NULL,
  payment_status VARCHAR(50) DEFAULT 'pending',
  amount_paid DECIMAL(15,2) DEFAULT 0,
  last_payment_date TIMESTAMPTZ,
  payment_reference VARCHAR(255),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_invoices_distributor ON invoices(distributor_id);
CREATE INDEX IF NOT EXISTS idx_invoices_due_date ON invoices(due_date);
CREATE INDEX IF NOT EXISTS idx_invoices_payment_status ON invoices(payment_status);;
