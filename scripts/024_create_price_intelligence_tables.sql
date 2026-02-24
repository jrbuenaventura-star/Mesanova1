-- Sistema de inteligencia de precios con IA (Gemini)
-- Ejecutar este script en Supabase para habilitar el tab de análisis de precios

CREATE TABLE IF NOT EXISTS price_intelligence_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  status TEXT NOT NULL DEFAULT 'processing' CHECK (status IN ('processing', 'completed', 'completed_with_errors', 'failed')),
  trigger_source TEXT NOT NULL DEFAULT 'manual' CHECK (trigger_source IN ('manual', 'cron')),
  requested_by UUID REFERENCES user_profiles(id) ON DELETE SET NULL,
  model TEXT NOT NULL DEFAULT 'gemini-2.0-flash',
  total_products INTEGER NOT NULL DEFAULT 0,
  processed_products INTEGER NOT NULL DEFAULT 0,
  findings_count INTEGER NOT NULL DEFAULT 0,
  significant_findings_count INTEGER NOT NULL DEFAULT 0,
  errors_count INTEGER NOT NULL DEFAULT 0,
  config JSONB NOT NULL DEFAULT '{}'::jsonb,
  summary JSONB NOT NULL DEFAULT '{}'::jsonb,
  error_message TEXT,
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS price_intelligence_findings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  run_id UUID NOT NULL REFERENCES price_intelligence_runs(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id) ON DELETE SET NULL,
  product_code TEXT NOT NULL,
  product_name TEXT NOT NULL,
  mesanova_price NUMERIC(12,2) NOT NULL,
  competitor_name TEXT NOT NULL,
  competitor_product_name TEXT,
  competitor_price NUMERIC(12,2) NOT NULL,
  price_gap_amount NUMERIC(12,2) NOT NULL,
  price_gap_percent NUMERIC(8,2),
  difference_direction TEXT NOT NULL CHECK (difference_direction IN ('mesanova_mas_caro', 'mesanova_mas_barato', 'similar')),
  is_significant BOOLEAN NOT NULL DEFAULT FALSE,
  is_critical BOOLEAN NOT NULL DEFAULT FALSE,
  review_status TEXT NOT NULL DEFAULT 'pendiente' CHECK (review_status IN ('pendiente', 'en_revision', 'ajustado', 'descartado')),
  review_notes TEXT,
  reviewed_by UUID REFERENCES user_profiles(id) ON DELETE SET NULL,
  reviewed_at TIMESTAMPTZ,
  confidence NUMERIC(4,3),
  source_url TEXT,
  source_domain TEXT,
  source_name TEXT,
  recommendation TEXT,
  analysis_notes TEXT,
  raw_json JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_price_intelligence_runs_started_at ON price_intelligence_runs(started_at DESC);
CREATE INDEX IF NOT EXISTS idx_price_intelligence_runs_status ON price_intelligence_runs(status);
CREATE INDEX IF NOT EXISTS idx_price_intelligence_findings_run_id ON price_intelligence_findings(run_id);
CREATE INDEX IF NOT EXISTS idx_price_intelligence_findings_product_id ON price_intelligence_findings(product_id);
CREATE INDEX IF NOT EXISTS idx_price_intelligence_findings_is_significant ON price_intelligence_findings(is_significant);
CREATE INDEX IF NOT EXISTS idx_price_intelligence_findings_is_critical ON price_intelligence_findings(is_critical);
CREATE INDEX IF NOT EXISTS idx_price_intelligence_findings_review_status ON price_intelligence_findings(review_status);
CREATE INDEX IF NOT EXISTS idx_price_intelligence_findings_gap_percent ON price_intelligence_findings(price_gap_percent DESC);

ALTER TABLE price_intelligence_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE price_intelligence_findings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Superadmin can manage price intelligence runs" ON price_intelligence_runs;
CREATE POLICY "Superadmin can manage price intelligence runs"
ON price_intelligence_runs FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM user_profiles
    WHERE user_profiles.id = auth.uid()
      AND user_profiles.role = 'superadmin'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM user_profiles
    WHERE user_profiles.id = auth.uid()
      AND user_profiles.role = 'superadmin'
  )
);

DROP POLICY IF EXISTS "Superadmin can manage price intelligence findings" ON price_intelligence_findings;
CREATE POLICY "Superadmin can manage price intelligence findings"
ON price_intelligence_findings FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM user_profiles
    WHERE user_profiles.id = auth.uid()
      AND user_profiles.role = 'superadmin'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM user_profiles
    WHERE user_profiles.id = auth.uid()
      AND user_profiles.role = 'superadmin'
  )
);

CREATE OR REPLACE FUNCTION update_price_intelligence_runs_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_price_intelligence_runs_updated_at ON price_intelligence_runs;
CREATE TRIGGER trg_price_intelligence_runs_updated_at
BEFORE UPDATE ON price_intelligence_runs
FOR EACH ROW
EXECUTE FUNCTION update_price_intelligence_runs_updated_at();
