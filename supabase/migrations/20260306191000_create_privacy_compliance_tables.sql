-- Privacy compliance baseline: consent audit, data subject requests, and controlled lead storage.

CREATE TABLE IF NOT EXISTS public.contact_leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name TEXT NOT NULL,
  company_name TEXT,
  email TEXT NOT NULL,
  phone TEXT NOT NULL,
  city TEXT,
  estimated_volume TEXT,
  message TEXT,
  lead_type TEXT NOT NULL DEFAULT 'general',
  status TEXT NOT NULL DEFAULT 'new',
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_contact_leads_created_at
  ON public.contact_leads(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_contact_leads_status
  ON public.contact_leads(status);
CREATE INDEX IF NOT EXISTS idx_contact_leads_email
  ON public.contact_leads(email);

CREATE TABLE IF NOT EXISTS public.privacy_consent_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  consent_analytics BOOLEAN NOT NULL DEFAULT FALSE,
  consent_marketing BOOLEAN NOT NULL DEFAULT FALSE,
  source TEXT NOT NULL DEFAULT 'banner',
  version INTEGER NOT NULL DEFAULT 1,
  ip_hash TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_privacy_consent_events_user
  ON public.privacy_consent_events(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_privacy_consent_events_created_at
  ON public.privacy_consent_events(created_at DESC);

CREATE TABLE IF NOT EXISTS public.privacy_data_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  request_type TEXT NOT NULL CHECK (request_type IN ('access', 'portability', 'deletion', 'rectification', 'restriction')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'rejected')),
  request_payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  resolution_notes TEXT,
  resolved_by UUID REFERENCES public.user_profiles(id) ON DELETE SET NULL,
  resolved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_privacy_data_requests_user
  ON public.privacy_data_requests(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_privacy_data_requests_status
  ON public.privacy_data_requests(status, created_at DESC);

CREATE OR REPLACE FUNCTION public.update_contact_leads_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public, pg_catalog
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_contact_leads_updated_at ON public.contact_leads;
CREATE TRIGGER trg_contact_leads_updated_at
  BEFORE UPDATE ON public.contact_leads
  FOR EACH ROW
  EXECUTE FUNCTION public.update_contact_leads_updated_at();

CREATE OR REPLACE FUNCTION public.update_privacy_data_requests_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public, pg_catalog
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_privacy_data_requests_updated_at ON public.privacy_data_requests;
CREATE TRIGGER trg_privacy_data_requests_updated_at
  BEFORE UPDATE ON public.privacy_data_requests
  FOR EACH ROW
  EXECUTE FUNCTION public.update_privacy_data_requests_updated_at();

ALTER TABLE public.contact_leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.privacy_consent_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.privacy_data_requests ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Superadmin can manage contact leads" ON public.contact_leads;
CREATE POLICY "Superadmin can manage contact leads"
  ON public.contact_leads
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.user_profiles
      WHERE user_profiles.id = auth.uid()
        AND user_profiles.role = 'superadmin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.user_profiles
      WHERE user_profiles.id = auth.uid()
        AND user_profiles.role = 'superadmin'
    )
  );

DROP POLICY IF EXISTS "Superadmin can read privacy consent events" ON public.privacy_consent_events;
CREATE POLICY "Superadmin can read privacy consent events"
  ON public.privacy_consent_events
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

DROP POLICY IF EXISTS "Users can view own privacy consent events" ON public.privacy_consent_events;
CREATE POLICY "Users can view own privacy consent events"
  ON public.privacy_consent_events
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can create own privacy data requests" ON public.privacy_data_requests;
CREATE POLICY "Users can create own privacy data requests"
  ON public.privacy_data_requests
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can view own privacy data requests" ON public.privacy_data_requests;
CREATE POLICY "Users can view own privacy data requests"
  ON public.privacy_data_requests
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Superadmin can manage privacy data requests" ON public.privacy_data_requests;
CREATE POLICY "Superadmin can manage privacy data requests"
  ON public.privacy_data_requests
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.user_profiles
      WHERE user_profiles.id = auth.uid()
        AND user_profiles.role = 'superadmin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.user_profiles
      WHERE user_profiles.id = auth.uid()
        AND user_profiles.role = 'superadmin'
    )
  );
