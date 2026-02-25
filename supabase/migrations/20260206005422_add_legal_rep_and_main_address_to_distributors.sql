
-- Add legal representative and main address fields to distributors
ALTER TABLE public.distributors
  ADD COLUMN IF NOT EXISTS legal_rep_name varchar NULL,
  ADD COLUMN IF NOT EXISTS legal_rep_document varchar NULL,
  ADD COLUMN IF NOT EXISTS main_address text NULL,
  ADD COLUMN IF NOT EXISTS main_city varchar NULL,
  ADD COLUMN IF NOT EXISTS main_state varchar NULL;

-- Add comment for clarity
COMMENT ON COLUMN public.distributors.legal_rep_name IS 'Legal representative full name';
COMMENT ON COLUMN public.distributors.legal_rep_document IS 'Legal representative cédula/document number';
COMMENT ON COLUMN public.distributors.main_address IS 'Main business/billing address';
COMMENT ON COLUMN public.distributors.main_city IS 'Main address city';
COMMENT ON COLUMN public.distributors.main_state IS 'Main address department (Colombia)';
;
