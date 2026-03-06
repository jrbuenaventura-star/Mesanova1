-- AI security hardening: enforce single active run and add immutable audit log for AI actions.

WITH processing_runs AS (
  SELECT id, ROW_NUMBER() OVER (ORDER BY started_at DESC, created_at DESC) AS rn
  FROM public.price_intelligence_runs
  WHERE status = 'processing'
)
UPDATE public.price_intelligence_runs
SET
  status = 'failed',
  error_message = COALESCE(error_message, 'Run cerrado automáticamente por política de concurrencia')
WHERE id IN (
  SELECT id
  FROM processing_runs
  WHERE rn > 1
);

CREATE UNIQUE INDEX IF NOT EXISTS uniq_price_intelligence_single_processing_run
  ON public.price_intelligence_runs ((1))
  WHERE status = 'processing';

CREATE TABLE IF NOT EXISTS public.price_intelligence_audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type TEXT NOT NULL CHECK (
    event_type IN ('run_requested', 'run_completed', 'run_failed', 'summary_viewed', 'finding_reviewed')
  ),
  actor_user_id UUID REFERENCES public.user_profiles(id) ON DELETE SET NULL,
  actor_role TEXT,
  source TEXT NOT NULL,
  request_ip_hash TEXT,
  request_meta JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_price_intelligence_audit_logs_created_at
  ON public.price_intelligence_audit_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_price_intelligence_audit_logs_event_type
  ON public.price_intelligence_audit_logs(event_type, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_price_intelligence_audit_logs_actor
  ON public.price_intelligence_audit_logs(actor_user_id, created_at DESC);

ALTER TABLE public.price_intelligence_audit_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Superadmin can read price intelligence audit logs"
  ON public.price_intelligence_audit_logs;
CREATE POLICY "Superadmin can read price intelligence audit logs"
  ON public.price_intelligence_audit_logs
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.user_profiles
      WHERE user_profiles.id = auth.uid()
        AND user_profiles.role = 'superadmin'
    )
  );
