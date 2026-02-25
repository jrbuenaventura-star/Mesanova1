-- Delivery QR confirmation module
-- Decoupled from current ERP: stores normalized snapshots and integration events.
-- Includes legal traceability, offline sync support, and immutable audit logs.

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS public.delivery_erp_order_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id TEXT NOT NULL UNIQUE,
  source_system TEXT NOT NULL DEFAULT 'erp_actual',
  order_number TEXT NOT NULL,
  customer_id TEXT,
  customer_name TEXT,
  customer_phone TEXT,
  customer_email TEXT,
  shipping_address TEXT,
  shipping_city TEXT,
  warehouse_id TEXT,
  warehouse_name TEXT,
  status TEXT,
  items JSONB NOT NULL DEFAULT '[]'::jsonb,
  packages JSONB NOT NULL DEFAULT '[]'::jsonb,
  raw_payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  last_synced_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.delivery_erp_sync_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id TEXT,
  source_system TEXT NOT NULL DEFAULT 'erp_actual',
  event_type TEXT NOT NULL,
  event_payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processed', 'failed')),
  error_message TEXT,
  received_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  processed_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS public.delivery_qr_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  qr_code_ref TEXT NOT NULL UNIQUE,
  signed_token TEXT NOT NULL UNIQUE,
  token_fingerprint TEXT NOT NULL,
  nonce TEXT NOT NULL UNIQUE,
  order_id TEXT NOT NULL,
  customer_id TEXT,
  warehouse_id TEXT NOT NULL,
  delivery_batch_id TEXT NOT NULL,
  transporter_id TEXT,
  status TEXT NOT NULL DEFAULT 'pendiente'
    CHECK (status IN ('pendiente', 'confirmado', 'confirmado_con_incidente', 'rechazado', 'expirado')),
  issued_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL,
  revoked_at TIMESTAMPTZ,
  confirmed_at TIMESTAMPTZ,
  offline_delivery_hash TEXT,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT delivery_qr_tokens_expiry_check CHECK (expires_at > issued_at)
);

CREATE TABLE IF NOT EXISTS public.delivery_packages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  qr_id UUID NOT NULL REFERENCES public.delivery_qr_tokens(id) ON DELETE CASCADE,
  package_number INTEGER NOT NULL CHECK (package_number > 0),
  total_packages INTEGER NOT NULL CHECK (total_packages > 0 AND total_packages >= package_number),
  customer_number TEXT,
  provider_barcode TEXT,
  quantity_total INTEGER NOT NULL DEFAULT 0 CHECK (quantity_total >= 0),
  sku_distribution JSONB NOT NULL DEFAULT '[]'::jsonb,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (qr_id, package_number)
);

CREATE TABLE IF NOT EXISTS public.delivery_otp_challenges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  qr_id UUID NOT NULL REFERENCES public.delivery_qr_tokens(id) ON DELETE CASCADE,
  challenge_nonce TEXT NOT NULL UNIQUE,
  channel TEXT NOT NULL CHECK (channel IN ('sms', 'whatsapp')),
  destination TEXT NOT NULL,
  otp_hash TEXT NOT NULL,
  otp_salt TEXT NOT NULL,
  max_attempts INTEGER NOT NULL DEFAULT 5 CHECK (max_attempts > 0),
  attempts INTEGER NOT NULL DEFAULT 0 CHECK (attempts >= 0),
  requested_ip TEXT,
  requested_user_agent TEXT,
  requested_device TEXT,
  requested_geo_lat DOUBLE PRECISION,
  requested_geo_lng DOUBLE PRECISION,
  requested_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL,
  verified_at TIMESTAMPTZ,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  CONSTRAINT delivery_otp_expiry_check CHECK (expires_at > requested_at)
);

CREATE TABLE IF NOT EXISTS public.delivery_validation_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  qr_id UUID NOT NULL REFERENCES public.delivery_qr_tokens(id) ON DELETE CASCADE,
  challenge_id UUID REFERENCES public.delivery_otp_challenges(id) ON DELETE SET NULL,
  session_token_hash TEXT NOT NULL UNIQUE,
  otp_verified BOOLEAN NOT NULL DEFAULT FALSE,
  validation_ip TEXT,
  validation_geo_lat DOUBLE PRECISION,
  validation_geo_lng DOUBLE PRECISION,
  validation_geo_accuracy DOUBLE PRECISION,
  validation_device TEXT,
  validation_user_agent TEXT,
  opened_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL,
  consumed_at TIMESTAMPTZ,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  CONSTRAINT delivery_session_expiry_check CHECK (expires_at > opened_at)
);

CREATE TABLE IF NOT EXISTS public.delivery_confirmations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  qr_id UUID NOT NULL UNIQUE REFERENCES public.delivery_qr_tokens(id) ON DELETE CASCADE,
  session_id UUID REFERENCES public.delivery_validation_sessions(id) ON DELETE SET NULL,
  otp_challenge_id UUID REFERENCES public.delivery_otp_challenges(id) ON DELETE SET NULL,
  order_id TEXT NOT NULL,
  result TEXT NOT NULL CHECK (result IN ('confirmado', 'confirmado_con_incidente', 'rechazado', 'parcial')),
  accepted_packages_count INTEGER NOT NULL DEFAULT 0 CHECK (accepted_packages_count >= 0),
  total_packages INTEGER NOT NULL DEFAULT 0 CHECK (total_packages >= 0),
  digital_signature TEXT NOT NULL,
  signature_name TEXT,
  signature_type TEXT NOT NULL DEFAULT 'drawn',
  legal_clause_text TEXT NOT NULL,
  legal_clause_accepted_at TIMESTAMPTZ NOT NULL,
  legal_clause_ip TEXT,
  legal_clause_device TEXT,
  client_geo_lat DOUBLE PRECISION,
  client_geo_lng DOUBLE PRECISION,
  client_geo_accuracy DOUBLE PRECISION,
  evidence_pdf_path TEXT,
  evidence_pdf_checksum TEXT,
  confirmed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.delivery_confirmation_packages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  confirmation_id UUID NOT NULL REFERENCES public.delivery_confirmations(id) ON DELETE CASCADE,
  package_id UUID REFERENCES public.delivery_packages(id) ON DELETE SET NULL,
  package_number INTEGER NOT NULL CHECK (package_number > 0),
  accepted BOOLEAN NOT NULL,
  rejection_reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (confirmation_id, package_number)
);

CREATE TABLE IF NOT EXISTS public.delivery_incidents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  qr_id UUID NOT NULL REFERENCES public.delivery_qr_tokens(id) ON DELETE CASCADE,
  confirmation_id UUID REFERENCES public.delivery_confirmations(id) ON DELETE SET NULL,
  order_id TEXT NOT NULL,
  invoice_number TEXT NOT NULL,
  product_reference TEXT NOT NULL,
  defective_quantity INTEGER NOT NULL CHECK (defective_quantity > 0),
  description TEXT,
  evidence_photo_paths TEXT[] NOT NULL DEFAULT '{}',
  guide_photo_path TEXT NOT NULL,
  pqrs_ticket_id UUID,
  warehouse_id TEXT,
  transporter_id TEXT,
  status TEXT NOT NULL DEFAULT 'abierto' CHECK (status IN ('abierto', 'en_proceso', 'cerrado')),
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  reported_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.delivery_offline_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  qr_id UUID REFERENCES public.delivery_qr_tokens(id) ON DELETE SET NULL,
  order_id TEXT NOT NULL,
  device_id TEXT NOT NULL,
  event_type TEXT NOT NULL CHECK (event_type IN ('confirmacion', 'firma', 'sincronizacion')),
  event_payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  offline_hash TEXT NOT NULL UNIQUE,
  sync_status TEXT NOT NULL DEFAULT 'pending' CHECK (sync_status IN ('pending', 'synced', 'conflict', 'rejected')),
  server_validation_message TEXT,
  queued_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  synced_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS public.delivery_audit_logs (
  id BIGSERIAL PRIMARY KEY,
  entity_type TEXT NOT NULL CHECK (entity_type IN ('qr', 'otp', 'session', 'confirmation', 'incident', 'offline', 'erp')),
  entity_id TEXT NOT NULL,
  action TEXT NOT NULL,
  actor_type TEXT NOT NULL CHECK (actor_type IN ('system', 'admin', 'customer', 'transporter', 'erp')),
  actor_id TEXT,
  request_id TEXT,
  ip_address TEXT,
  device_info TEXT,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  previous_hash TEXT,
  record_hash TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_delivery_erp_order_snapshots_order_id
  ON public.delivery_erp_order_snapshots(order_id);
CREATE INDEX IF NOT EXISTS idx_delivery_erp_order_snapshots_updated_at
  ON public.delivery_erp_order_snapshots(updated_at DESC);

CREATE INDEX IF NOT EXISTS idx_delivery_erp_sync_events_status
  ON public.delivery_erp_sync_events(status, received_at DESC);
CREATE INDEX IF NOT EXISTS idx_delivery_erp_sync_events_order_id
  ON public.delivery_erp_sync_events(order_id);

CREATE INDEX IF NOT EXISTS idx_delivery_qr_tokens_status
  ON public.delivery_qr_tokens(status, issued_at DESC);
CREATE INDEX IF NOT EXISTS idx_delivery_qr_tokens_order_id
  ON public.delivery_qr_tokens(order_id);
CREATE INDEX IF NOT EXISTS idx_delivery_qr_tokens_batch
  ON public.delivery_qr_tokens(delivery_batch_id);
CREATE INDEX IF NOT EXISTS idx_delivery_qr_tokens_warehouse
  ON public.delivery_qr_tokens(warehouse_id);
CREATE INDEX IF NOT EXISTS idx_delivery_qr_tokens_transporter
  ON public.delivery_qr_tokens(transporter_id);
CREATE INDEX IF NOT EXISTS idx_delivery_qr_tokens_expires_at
  ON public.delivery_qr_tokens(expires_at);

CREATE INDEX IF NOT EXISTS idx_delivery_packages_qr_id
  ON public.delivery_packages(qr_id, package_number);

CREATE INDEX IF NOT EXISTS idx_delivery_otp_challenges_qr_id
  ON public.delivery_otp_challenges(qr_id, requested_at DESC);
CREATE INDEX IF NOT EXISTS idx_delivery_otp_challenges_destination
  ON public.delivery_otp_challenges(destination, requested_at DESC);

CREATE INDEX IF NOT EXISTS idx_delivery_validation_sessions_qr_id
  ON public.delivery_validation_sessions(qr_id, opened_at DESC);
CREATE INDEX IF NOT EXISTS idx_delivery_validation_sessions_expires
  ON public.delivery_validation_sessions(expires_at);

CREATE INDEX IF NOT EXISTS idx_delivery_confirmations_confirmed_at
  ON public.delivery_confirmations(confirmed_at DESC);
CREATE INDEX IF NOT EXISTS idx_delivery_confirmations_result
  ON public.delivery_confirmations(result, confirmed_at DESC);
CREATE INDEX IF NOT EXISTS idx_delivery_confirmations_order_id
  ON public.delivery_confirmations(order_id);

CREATE INDEX IF NOT EXISTS idx_delivery_incidents_reported_at
  ON public.delivery_incidents(reported_at DESC);
CREATE INDEX IF NOT EXISTS idx_delivery_incidents_product_reference
  ON public.delivery_incidents(product_reference);
CREATE INDEX IF NOT EXISTS idx_delivery_incidents_transporter
  ON public.delivery_incidents(transporter_id);
CREATE INDEX IF NOT EXISTS idx_delivery_incidents_warehouse
  ON public.delivery_incidents(warehouse_id);

CREATE INDEX IF NOT EXISTS idx_delivery_offline_events_status
  ON public.delivery_offline_events(sync_status, queued_at DESC);
CREATE INDEX IF NOT EXISTS idx_delivery_offline_events_order_id
  ON public.delivery_offline_events(order_id);

CREATE INDEX IF NOT EXISTS idx_delivery_audit_logs_entity
  ON public.delivery_audit_logs(entity_type, entity_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_delivery_audit_logs_action
  ON public.delivery_audit_logs(action, created_at DESC);

CREATE OR REPLACE FUNCTION public.set_delivery_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public, pg_catalog
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_delivery_erp_order_snapshots_updated_at ON public.delivery_erp_order_snapshots;
CREATE TRIGGER trg_delivery_erp_order_snapshots_updated_at
  BEFORE UPDATE ON public.delivery_erp_order_snapshots
  FOR EACH ROW
  EXECUTE FUNCTION public.set_delivery_updated_at();

DROP TRIGGER IF EXISTS trg_delivery_qr_tokens_updated_at ON public.delivery_qr_tokens;
CREATE TRIGGER trg_delivery_qr_tokens_updated_at
  BEFORE UPDATE ON public.delivery_qr_tokens
  FOR EACH ROW
  EXECUTE FUNCTION public.set_delivery_updated_at();

DROP TRIGGER IF EXISTS trg_delivery_incidents_updated_at ON public.delivery_incidents;
CREATE TRIGGER trg_delivery_incidents_updated_at
  BEFORE UPDATE ON public.delivery_incidents
  FOR EACH ROW
  EXECUTE FUNCTION public.set_delivery_updated_at();

CREATE OR REPLACE FUNCTION public.set_delivery_audit_hash()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public, pg_catalog
AS $$
DECLARE
  prev_hash TEXT;
BEGIN
  SELECT record_hash
  INTO prev_hash
  FROM public.delivery_audit_logs
  WHERE entity_type = NEW.entity_type
    AND entity_id = NEW.entity_id
  ORDER BY id DESC
  LIMIT 1;

  NEW.previous_hash := prev_hash;
  NEW.record_hash := encode(
    digest(
      COALESCE(prev_hash, '') || '|' ||
      NEW.entity_type || '|' ||
      NEW.entity_id || '|' ||
      NEW.action || '|' ||
      NEW.actor_type || '|' ||
      COALESCE(NEW.actor_id, '') || '|' ||
      COALESCE(NEW.request_id, '') || '|' ||
      COALESCE(NEW.ip_address, '') || '|' ||
      COALESCE(NEW.device_info, '') || '|' ||
      COALESCE(NEW.metadata::text, '{}'),
      'sha256'
    ),
    'hex'
  );
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_delivery_audit_hash ON public.delivery_audit_logs;
CREATE TRIGGER trg_delivery_audit_hash
  BEFORE INSERT ON public.delivery_audit_logs
  FOR EACH ROW
  EXECUTE FUNCTION public.set_delivery_audit_hash();

CREATE OR REPLACE FUNCTION public.block_delivery_audit_mutations()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public, pg_catalog
AS $$
BEGIN
  RAISE EXCEPTION 'delivery_audit_logs is immutable';
END;
$$;

DROP TRIGGER IF EXISTS trg_delivery_audit_no_update ON public.delivery_audit_logs;
CREATE TRIGGER trg_delivery_audit_no_update
  BEFORE UPDATE ON public.delivery_audit_logs
  FOR EACH ROW
  EXECUTE FUNCTION public.block_delivery_audit_mutations();

DROP TRIGGER IF EXISTS trg_delivery_audit_no_delete ON public.delivery_audit_logs;
CREATE TRIGGER trg_delivery_audit_no_delete
  BEFORE DELETE ON public.delivery_audit_logs
  FOR EACH ROW
  EXECUTE FUNCTION public.block_delivery_audit_mutations();

ALTER TABLE public.delivery_erp_order_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.delivery_erp_sync_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.delivery_qr_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.delivery_packages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.delivery_otp_challenges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.delivery_validation_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.delivery_confirmations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.delivery_confirmation_packages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.delivery_incidents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.delivery_offline_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.delivery_audit_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Superadmin can read delivery module tables" ON public.delivery_qr_tokens;
CREATE POLICY "Superadmin can read delivery module tables"
  ON public.delivery_qr_tokens
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1
      FROM public.user_profiles
      WHERE user_profiles.id = auth.uid()
        AND user_profiles.role = 'superadmin'
    )
  );

DROP POLICY IF EXISTS "Superadmin can update delivery module tables" ON public.delivery_qr_tokens;
CREATE POLICY "Superadmin can update delivery module tables"
  ON public.delivery_qr_tokens
  FOR UPDATE
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

COMMENT ON TABLE public.delivery_erp_order_snapshots IS 'Snapshot normalizado de pedidos provenientes del ERP para desacoplar integraciones';
COMMENT ON TABLE public.delivery_qr_tokens IS 'Tokens QR dinámicos de confirmación de entrega por pedido';
COMMENT ON TABLE public.delivery_packages IS 'Detalle por bulto de cada QR de entrega';
COMMENT ON TABLE public.delivery_otp_challenges IS 'Retos OTP para validación obligatoria del cliente antes de ver la entrega';
COMMENT ON TABLE public.delivery_validation_sessions IS 'Sesiones efímeras posteriores a OTP válido';
COMMENT ON TABLE public.delivery_confirmations IS 'Actas de confirmación de entrega con cláusula legal y firma digital';
COMMENT ON TABLE public.delivery_incidents IS 'Incidencias y reclamaciones abiertas durante la entrega';
COMMENT ON TABLE public.delivery_offline_events IS 'Cola de eventos offline para sincronización y resolución de conflictos';
COMMENT ON TABLE public.delivery_audit_logs IS 'Bitácora inmutable para trazabilidad legal y forense';
