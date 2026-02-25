-- Agregar agent_id a orders
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='orders' AND column_name='agent_id') THEN
    ALTER TABLE orders ADD COLUMN agent_id UUID REFERENCES sales_agents(id);
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_orders_agent ON orders(agent_id);;
