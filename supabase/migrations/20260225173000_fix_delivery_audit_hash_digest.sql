-- Fix delivery audit hash trigger to resolve digest() in Supabase environments
-- where pgcrypto is installed under the extensions schema.

CREATE SCHEMA IF NOT EXISTS extensions;
CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA extensions;

CREATE OR REPLACE FUNCTION public.set_delivery_audit_hash()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public, extensions, pg_catalog
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
    extensions.digest(
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
