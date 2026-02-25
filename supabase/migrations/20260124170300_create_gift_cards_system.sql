-- SISTEMA DE BONOS / GIFT CARDS

-- Tabla principal de bonos
CREATE TABLE IF NOT EXISTS gift_cards (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  code VARCHAR(20) UNIQUE NOT NULL,
  
  initial_amount DECIMAL(10,2) NOT NULL CHECK (initial_amount > 0),
  current_balance DECIMAL(10,2) NOT NULL CHECK (current_balance >= 0),
  
  purchased_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  purchaser_email TEXT,
  purchaser_name TEXT,
  
  recipient_email TEXT,
  recipient_name TEXT,
  personal_message TEXT,
  
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'used', 'expired', 'cancelled')),
  expires_at TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  last_used_at TIMESTAMPTZ,
  
  CONSTRAINT valid_balance CHECK (current_balance <= initial_amount)
);

CREATE INDEX idx_gift_cards_code ON gift_cards(code);
CREATE INDEX idx_gift_cards_status ON gift_cards(status);

-- Tabla de transacciones
CREATE TABLE IF NOT EXISTS gift_card_transactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  gift_card_id UUID REFERENCES gift_cards(id) ON DELETE CASCADE NOT NULL,
  order_id UUID REFERENCES orders(id) ON DELETE SET NULL,
  
  amount DECIMAL(10,2) NOT NULL,
  transaction_type TEXT NOT NULL CHECK (transaction_type IN ('purchase', 'redemption', 'refund', 'adjustment')),
  balance_before DECIMAL(10,2) NOT NULL,
  balance_after DECIMAL(10,2) NOT NULL,
  
  notes TEXT,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_gift_card_transactions_card_id ON gift_card_transactions(gift_card_id);

-- Función para generar código
CREATE OR REPLACE FUNCTION generate_gift_card_code()
RETURNS TEXT AS $$
DECLARE
  chars TEXT := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  result TEXT := 'GC-';
  i INTEGER;
BEGIN
  FOR i IN 1..12 LOOP
    result := result || substr(chars, floor(random() * length(chars) + 1)::int, 1);
    IF i % 4 = 0 AND i < 12 THEN
      result := result || '-';
    END IF;
  END LOOP;
  RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Trigger para marcar como usado
CREATE OR REPLACE FUNCTION check_gift_card_balance()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.current_balance = 0 AND OLD.current_balance > 0 THEN
    NEW.status = 'used';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER gift_card_balance_trigger
  BEFORE UPDATE ON gift_cards
  FOR EACH ROW
  EXECUTE FUNCTION check_gift_card_balance();

-- RLS
ALTER TABLE gift_cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE gift_card_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their gift cards"
  ON gift_cards FOR SELECT
  USING (auth.uid() = purchased_by OR recipient_email = (SELECT email FROM auth.users WHERE id = auth.uid()));

CREATE POLICY "Superadmins can view all gift cards"
  ON gift_cards FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.role = 'superadmin'
    )
  );

CREATE POLICY "Anyone can create gift cards"
  ON gift_cards FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Superadmins can manage gift cards"
  ON gift_cards FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.role = 'superadmin'
    )
  );

CREATE POLICY "Users can view their transactions"
  ON gift_card_transactions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM gift_cards
      WHERE gift_cards.id = gift_card_transactions.gift_card_id
      AND (gift_cards.purchased_by = auth.uid() OR gift_cards.recipient_email = (SELECT email FROM auth.users WHERE id = auth.uid()))
    )
  );

CREATE POLICY "Anyone can create transactions"
  ON gift_card_transactions FOR INSERT
  WITH CHECK (true);;
