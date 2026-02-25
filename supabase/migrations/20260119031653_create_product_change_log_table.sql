-- Log de cambios de productos
CREATE TABLE IF NOT EXISTS product_change_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  change_type VARCHAR(50) NOT NULL,
  change_source VARCHAR(50) NOT NULL,
  fields_changed JSONB NOT NULL,
  changed_by UUID REFERENCES user_profiles(id),
  csv_filename TEXT,
  csv_row_number INTEGER,
  changed_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_product_change_log_product ON product_change_log(product_id);
CREATE INDEX IF NOT EXISTS idx_product_change_log_type ON product_change_log(change_type);
CREATE INDEX IF NOT EXISTS idx_product_change_log_date ON product_change_log(changed_at DESC);
CREATE INDEX IF NOT EXISTS idx_product_change_log_source ON product_change_log(change_source);;
