-- Función para crear comisión de agente en nueva orden
CREATE OR REPLACE FUNCTION create_agent_commission_on_order()
RETURNS TRIGGER AS $$
DECLARE
  v_agent_id UUID;
  v_commission_rate DECIMAL;
  v_default_rate DECIMAL;
  v_assignment_rate DECIMAL;
BEGIN
  IF NEW.distributor_id IS NULL THEN
    RETURN NEW;
  END IF;
  
  SELECT ada.agent_id, ada.commission_rate, sa.default_commission_rate
  INTO v_agent_id, v_assignment_rate, v_default_rate
  FROM agent_distributor_assignments ada
  JOIN sales_agents sa ON sa.id = ada.agent_id
  WHERE ada.distributor_id = NEW.distributor_id AND ada.is_active = true;
  
  IF v_agent_id IS NULL THEN
    RETURN NEW;
  END IF;
  
  v_commission_rate := COALESCE(v_assignment_rate, v_default_rate);
  NEW.agent_id := v_agent_id;
  
  INSERT INTO agent_commissions (
    agent_id,
    order_id,
    distributor_id,
    order_total,
    commission_rate,
    commission_amount,
    status,
    order_date,
    commission_due_at
  ) VALUES (
    v_agent_id,
    NEW.id,
    NEW.distributor_id,
    NEW.total,
    v_commission_rate,
    NEW.total * v_commission_rate / 100,
    'pending',
    NEW.created_at,
    NEW.created_at + INTERVAL '90 days'
  )
  ON CONFLICT DO NOTHING;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_create_agent_commission ON orders;
CREATE TRIGGER trigger_create_agent_commission
  BEFORE INSERT ON orders
  FOR EACH ROW
  EXECUTE FUNCTION create_agent_commission_on_order();

-- Comentarios para documentación
COMMENT ON TABLE product_types IS 'Tipos de producto (3er nivel de categorización)';
COMMENT ON TABLE sales_agents IS 'Agentes comerciales/corredores del canal de ventas';
COMMENT ON TABLE agent_distributor_assignments IS 'Asignación 1:1 de corredores a distribuidores';
COMMENT ON TABLE agent_commissions IS 'Comisiones de agentes por órdenes de sus distribuidores';
COMMENT ON TABLE product_change_log IS 'Historial de cambios en productos (CSV, ERP, admin)';
COMMENT ON TABLE csv_imports IS 'Historial de importaciones de archivos CSV';
COMMENT ON COLUMN products.descuento_porcentaje IS 'Porcentaje de descuento activo - si > 0, producto en ofertas';
COMMENT ON COLUMN products.descripcion_distribuidor IS 'Descripción visible solo para distribuidores y canal';
COMMENT ON COLUMN distributors.minimum_order IS 'Pedido mínimo requerido para B2B';
COMMENT ON COLUMN distributors.credit_days IS 'Días de crédito otorgados';;
