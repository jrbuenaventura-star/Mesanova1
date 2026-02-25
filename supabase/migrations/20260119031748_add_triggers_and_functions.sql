-- Triggers para updated_at
DROP TRIGGER IF EXISTS update_sales_agents_updated_at ON sales_agents;
CREATE TRIGGER update_sales_agents_updated_at BEFORE UPDATE ON sales_agents
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_product_types_updated_at ON product_types;
CREATE TRIGGER update_product_types_updated_at BEFORE UPDATE ON product_types
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_agent_commissions_updated_at ON agent_commissions;
CREATE TRIGGER update_agent_commissions_updated_at BEFORE UPDATE ON agent_commissions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Función para calcular segmento de usuario
CREATE OR REPLACE FUNCTION calculate_user_segment(
  p_last_purchase TIMESTAMPTZ,
  p_purchase_frequency DECIMAL,
  p_total_spent DECIMAL
) RETURNS VARCHAR(50) AS $$
DECLARE
  days_since_purchase INTEGER;
  segment VARCHAR(50);
BEGIN
  IF p_last_purchase IS NULL THEN
    RETURN 'nuevo';
  END IF;
  
  days_since_purchase := EXTRACT(DAY FROM NOW() - p_last_purchase);
  
  IF days_since_purchase <= 30 AND p_purchase_frequency >= 6 AND p_total_spent >= 5000000 THEN
    segment := 'vip';
  ELSIF days_since_purchase <= 60 AND p_purchase_frequency >= 4 THEN
    segment := 'leal';
  ELSIF days_since_purchase <= 90 AND p_purchase_frequency >= 2 THEN
    segment := 'regular';
  ELSIF days_since_purchase <= 180 THEN
    segment := 'ocasional';
  ELSIF days_since_purchase <= 365 THEN
    segment := 'en_riesgo';
  ELSE
    segment := 'dormido';
  END IF;
  
  RETURN segment;
END;
$$ LANGUAGE plpgsql;;
