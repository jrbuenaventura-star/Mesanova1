-- Privacy hardening for distributor document management.
-- Adds private storage references and creates dedicated private bucket.

ALTER TABLE public.distributor_documents
  ADD COLUMN IF NOT EXISTS storage_bucket TEXT,
  ADD COLUMN IF NOT EXISTS storage_path TEXT;

CREATE INDEX IF NOT EXISTS idx_distributor_documents_storage_path
  ON public.distributor_documents(storage_bucket, storage_path);

INSERT INTO storage.buckets (id, name, public)
VALUES ('distributor-documents-private', 'distributor-documents-private', false)
ON CONFLICT (id) DO UPDATE SET public = EXCLUDED.public;

COMMENT ON COLUMN public.distributor_documents.storage_bucket IS 'Supabase Storage bucket (private)';
COMMENT ON COLUMN public.distributor_documents.storage_path IS 'Supabase Storage object path (private)';
