ALTER TABLE distributors 
ADD COLUMN IF NOT EXISTS aliado_id UUID REFERENCES aliados(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_distributors_aliado ON distributors(aliado_id);;
