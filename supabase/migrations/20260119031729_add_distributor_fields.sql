-- Campos adicionales en distributors
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='distributors' AND column_name='minimum_order') THEN
    ALTER TABLE distributors ADD COLUMN minimum_order DECIMAL(12,2) DEFAULT 0;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='distributors' AND column_name='credit_days') THEN
    ALTER TABLE distributors ADD COLUMN credit_days INTEGER DEFAULT 0;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='distributors' AND column_name='first_purchase_at') THEN
    ALTER TABLE distributors ADD COLUMN first_purchase_at TIMESTAMPTZ;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='distributors' AND column_name='last_purchase_at') THEN
    ALTER TABLE distributors ADD COLUMN last_purchase_at TIMESTAMPTZ;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='distributors' AND column_name='total_purchases') THEN
    ALTER TABLE distributors ADD COLUMN total_purchases INTEGER DEFAULT 0;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='distributors' AND column_name='purchase_frequency') THEN
    ALTER TABLE distributors ADD COLUMN purchase_frequency DECIMAL(5,2) DEFAULT 0;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='distributors' AND column_name='segment') THEN
    ALTER TABLE distributors ADD COLUMN segment VARCHAR(50);
  END IF;
END $$;;
