-- Campos adicionales en user_profiles para segmentación
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='user_profiles' AND column_name='customer_type') THEN
    ALTER TABLE user_profiles ADD COLUMN customer_type VARCHAR(20) CHECK (customer_type IN ('b2b', 'b2c', 'both'));
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='user_profiles' AND column_name='segment') THEN
    ALTER TABLE user_profiles ADD COLUMN segment VARCHAR(50);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='user_profiles' AND column_name='first_purchase_at') THEN
    ALTER TABLE user_profiles ADD COLUMN first_purchase_at TIMESTAMPTZ;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='user_profiles' AND column_name='last_purchase_at') THEN
    ALTER TABLE user_profiles ADD COLUMN last_purchase_at TIMESTAMPTZ;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='user_profiles' AND column_name='total_purchases') THEN
    ALTER TABLE user_profiles ADD COLUMN total_purchases INTEGER DEFAULT 0;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='user_profiles' AND column_name='total_spent') THEN
    ALTER TABLE user_profiles ADD COLUMN total_spent DECIMAL(12,2) DEFAULT 0;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='user_profiles' AND column_name='average_order_value') THEN
    ALTER TABLE user_profiles ADD COLUMN average_order_value DECIMAL(12,2) DEFAULT 0;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='user_profiles' AND column_name='purchase_frequency') THEN
    ALTER TABLE user_profiles ADD COLUMN purchase_frequency DECIMAL(5,2) DEFAULT 0;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='user_profiles' AND column_name='acquisition_source') THEN
    ALTER TABLE user_profiles ADD COLUMN acquisition_source VARCHAR(100);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='user_profiles' AND column_name='crm_notes') THEN
    ALTER TABLE user_profiles ADD COLUMN crm_notes TEXT;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_user_profiles_customer_type ON user_profiles(customer_type);
CREATE INDEX IF NOT EXISTS idx_user_profiles_segment ON user_profiles(segment);
CREATE INDEX IF NOT EXISTS idx_user_profiles_last_purchase ON user_profiles(last_purchase_at);
CREATE INDEX IF NOT EXISTS idx_user_profiles_total_spent ON user_profiles(total_spent);;
