-- Extensión del módulo de inteligencia de precios:
-- - Hallazgos críticos
-- - Flujo de revisión comercial

ALTER TABLE IF EXISTS price_intelligence_findings
  ADD COLUMN IF NOT EXISTS is_critical BOOLEAN NOT NULL DEFAULT FALSE;

ALTER TABLE IF EXISTS price_intelligence_findings
  ADD COLUMN IF NOT EXISTS review_status TEXT NOT NULL DEFAULT 'pendiente';

ALTER TABLE IF EXISTS price_intelligence_findings
  ADD COLUMN IF NOT EXISTS review_notes TEXT;

ALTER TABLE IF EXISTS price_intelligence_findings
  ADD COLUMN IF NOT EXISTS reviewed_by UUID REFERENCES user_profiles(id) ON DELETE SET NULL;

ALTER TABLE IF EXISTS price_intelligence_findings
  ADD COLUMN IF NOT EXISTS reviewed_at TIMESTAMPTZ;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'price_intelligence_findings_review_status_check'
      AND conrelid = 'price_intelligence_findings'::regclass
  ) THEN
    ALTER TABLE price_intelligence_findings
      ADD CONSTRAINT price_intelligence_findings_review_status_check
      CHECK (review_status IN ('pendiente', 'en_revision', 'ajustado', 'descartado'));
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_price_intelligence_findings_is_critical
  ON price_intelligence_findings(is_critical);

CREATE INDEX IF NOT EXISTS idx_price_intelligence_findings_review_status
  ON price_intelligence_findings(review_status);
