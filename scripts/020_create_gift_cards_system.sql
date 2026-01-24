-- =====================================================
-- SISTEMA DE BONOS / TARJETAS DE REGALO (GIFT CARDS)
-- =====================================================

-- Tabla principal de bonos
CREATE TABLE IF NOT EXISTS gift_cards (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  code VARCHAR(20) UNIQUE NOT NULL,
  
  -- Montos
  initial_amount DECIMAL(10,2) NOT NULL CHECK (initial_amount > 0),
  current_balance DECIMAL(10,2) NOT NULL CHECK (current_balance >= 0),
  
  -- Comprador (quien compró el bono)
  purchased_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  purchaser_email TEXT,
  purchaser_name TEXT,
  
  -- Destinatario (para quien es el bono)
  recipient_email TEXT,
  recipient_name TEXT,
  personal_message TEXT,
  
  -- Estado y validez
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'used', 'expired', 'cancelled')),
  expires_at TIMESTAMPTZ,
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  last_used_at TIMESTAMPTZ,
  
  -- Constraint: balance no puede exceder monto inicial
  CONSTRAINT valid_balance CHECK (current_balance <= initial_amount)
);

-- Índices para optimizar búsquedas
CREATE INDEX IF NOT EXISTS idx_gift_cards_code ON gift_cards(code);
CREATE INDEX IF NOT EXISTS idx_gift_cards_status ON gift_cards(status);
CREATE INDEX IF NOT EXISTS idx_gift_cards_recipient_email ON gift_cards(recipient_email);
CREATE INDEX IF NOT EXISTS idx_gift_cards_purchased_by ON gift_cards(purchased_by);
CREATE INDEX IF NOT EXISTS idx_gift_cards_expires_at ON gift_cards(expires_at);

-- Tabla de transacciones de bonos (historial de movimientos)
CREATE TABLE IF NOT EXISTS gift_card_transactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  gift_card_id UUID REFERENCES gift_cards(id) ON DELETE CASCADE NOT NULL,
  order_id UUID REFERENCES orders(id) ON DELETE SET NULL,
  
  -- Detalles de la transacción
  amount DECIMAL(10,2) NOT NULL,
  transaction_type TEXT NOT NULL CHECK (transaction_type IN ('purchase', 'redemption', 'refund', 'adjustment')),
  balance_before DECIMAL(10,2) NOT NULL,
  balance_after DECIMAL(10,2) NOT NULL,
  
  -- Metadata
  notes TEXT,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para transacciones
CREATE INDEX IF NOT EXISTS idx_gift_card_transactions_card_id ON gift_card_transactions(gift_card_id);
CREATE INDEX IF NOT EXISTS idx_gift_card_transactions_order_id ON gift_card_transactions(order_id);
CREATE INDEX IF NOT EXISTS idx_gift_card_transactions_created_at ON gift_card_transactions(created_at DESC);

-- Función para generar código único de bono
CREATE OR REPLACE FUNCTION generate_gift_card_code()
RETURNS TEXT AS $$
DECLARE
  chars TEXT := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; -- Sin caracteres confusos (0,O,1,I)
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

-- Función para marcar bonos expirados automáticamente
CREATE OR REPLACE FUNCTION mark_expired_gift_cards()
RETURNS void AS $$
BEGIN
  UPDATE gift_cards
  SET status = 'expired'
  WHERE status = 'active'
    AND expires_at IS NOT NULL
    AND expires_at < NOW();
END;
$$ LANGUAGE plpgsql;

-- Función para marcar bonos como usados cuando balance = 0
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

-- Habilitar RLS
ALTER TABLE gift_cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE gift_card_transactions ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para gift_cards
-- Usuarios pueden ver bonos que compraron
CREATE POLICY "Users can view purchased gift cards"
  ON gift_cards FOR SELECT
  USING (auth.uid() = purchased_by);

-- Usuarios pueden ver bonos donde son destinatarios
CREATE POLICY "Users can view received gift cards"
  ON gift_cards FOR SELECT
  USING (
    auth.uid() IS NOT NULL
    AND recipient_email = (
      SELECT email FROM auth.users WHERE id = auth.uid()
    )
  );

-- Superadmins pueden ver todos los bonos
CREATE POLICY "Superadmins can view all gift cards"
  ON gift_cards FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.role = 'superadmin'
    )
  );

-- Cualquiera puede crear bonos (compra)
CREATE POLICY "Anyone can create gift cards"
  ON gift_cards FOR INSERT
  WITH CHECK (true);

-- Solo superadmins pueden actualizar bonos directamente
CREATE POLICY "Superadmins can update gift cards"
  ON gift_cards FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.role = 'superadmin'
    )
  );

-- Solo superadmins pueden eliminar bonos
CREATE POLICY "Superadmins can delete gift cards"
  ON gift_cards FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.role = 'superadmin'
    )
  );

-- Políticas RLS para gift_card_transactions
-- Usuarios pueden ver transacciones de sus bonos
CREATE POLICY "Users can view their gift card transactions"
  ON gift_card_transactions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM gift_cards
      WHERE gift_cards.id = gift_card_transactions.gift_card_id
      AND (
        gift_cards.purchased_by = auth.uid()
        OR gift_cards.recipient_email = (
          SELECT email FROM auth.users WHERE id = auth.uid()
        )
      )
    )
  );

-- Superadmins pueden ver todas las transacciones
CREATE POLICY "Superadmins can view all gift card transactions"
  ON gift_card_transactions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.role = 'superadmin'
    )
  );

-- Cualquiera puede crear transacciones (se valida en aplicación)
CREATE POLICY "Anyone can create gift card transactions"
  ON gift_card_transactions FOR INSERT
  WITH CHECK (true);

-- Comentarios para documentación
COMMENT ON TABLE gift_cards IS 'Tabla de bonos/tarjetas de regalo del sistema';
COMMENT ON COLUMN gift_cards.status IS 'Estados: active (activo), used (usado completamente), expired (expirado), cancelled (cancelado)';
COMMENT ON TABLE gift_card_transactions IS 'Historial de transacciones de bonos';
COMMENT ON COLUMN gift_card_transactions.transaction_type IS 'Tipos: purchase (compra inicial), redemption (canje/uso), refund (reembolso), adjustment (ajuste manual)';
