-- Función para actualizar métricas de usuario después de orden
CREATE OR REPLACE FUNCTION update_user_metrics_after_order()
RETURNS TRIGGER AS $$
DECLARE
  v_user_id UUID;
  v_distributor_id UUID;
  v_first_purchase TIMESTAMPTZ;
  v_total_purchases INTEGER;
  v_total_spent DECIMAL;
  v_avg_order DECIMAL;
  v_frequency DECIMAL;
  v_segment VARCHAR(50);
  v_years_active DECIMAL;
BEGIN
  v_user_id := NEW.user_id;
  v_distributor_id := NEW.distributor_id;
  
  IF NEW.status NOT IN ('delivered', 'shipped') THEN
    RETURN NEW;
  END IF;
  
  SELECT 
    MIN(created_at),
    COUNT(*),
    COALESCE(SUM(total), 0)
  INTO v_first_purchase, v_total_purchases, v_total_spent
  FROM orders
  WHERE user_id = v_user_id AND status IN ('delivered', 'shipped');
  
  v_avg_order := CASE WHEN v_total_purchases > 0 THEN v_total_spent / v_total_purchases ELSE 0 END;
  v_years_active := GREATEST(EXTRACT(EPOCH FROM NOW() - v_first_purchase) / (365.25 * 24 * 3600), 0.1);
  v_frequency := v_total_purchases / v_years_active;
  v_segment := calculate_user_segment(NEW.created_at, v_frequency, v_total_spent);
  
  UPDATE user_profiles SET
    first_purchase_at = COALESCE(first_purchase_at, v_first_purchase),
    last_purchase_at = NEW.created_at,
    total_purchases = v_total_purchases,
    total_spent = v_total_spent,
    average_order_value = v_avg_order,
    purchase_frequency = v_frequency,
    segment = v_segment,
    updated_at = NOW()
  WHERE id = v_user_id;
  
  IF v_distributor_id IS NOT NULL THEN
    SELECT 
      MIN(o.created_at),
      COUNT(*),
      COUNT(*) / GREATEST(EXTRACT(EPOCH FROM NOW() - MIN(o.created_at)) / (365.25 * 24 * 3600), 0.1)
    INTO v_first_purchase, v_total_purchases, v_frequency
    FROM orders o
    WHERE o.distributor_id = v_distributor_id AND o.status IN ('delivered', 'shipped');
    
    UPDATE distributors SET
      first_purchase_at = COALESCE(first_purchase_at, v_first_purchase),
      last_purchase_at = NEW.created_at,
      total_purchases = v_total_purchases,
      purchase_frequency = v_frequency,
      segment = calculate_user_segment(NEW.created_at, v_frequency, v_total_spent),
      updated_at = NOW()
    WHERE id = v_distributor_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_user_metrics ON orders;
CREATE TRIGGER trigger_update_user_metrics
  AFTER INSERT OR UPDATE OF status ON orders
  FOR EACH ROW
  EXECUTE FUNCTION update_user_metrics_after_order();;
