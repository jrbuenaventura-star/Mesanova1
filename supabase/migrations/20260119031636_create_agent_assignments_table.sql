-- Asignación corredor-distribuidor (1:1)
CREATE TABLE IF NOT EXISTS agent_distributor_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id UUID NOT NULL REFERENCES sales_agents(id) ON DELETE CASCADE,
  distributor_id UUID NOT NULL REFERENCES distributors(id) ON DELETE CASCADE,
  commission_rate DECIMAL(5,2),
  assigned_at TIMESTAMPTZ DEFAULT NOW(),
  unassigned_at TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT true,
  notes TEXT,
  created_by UUID REFERENCES user_profiles(id),
  UNIQUE(distributor_id)
);

CREATE INDEX IF NOT EXISTS idx_agent_assignments_agent ON agent_distributor_assignments(agent_id);
CREATE INDEX IF NOT EXISTS idx_agent_assignments_distributor ON agent_distributor_assignments(distributor_id);
CREATE INDEX IF NOT EXISTS idx_agent_assignments_active ON agent_distributor_assignments(is_active);;
