-- Set gift registry default status after enum values are available in a committed migration.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM pg_type t
    JOIN pg_enum e ON e.enumtypid = t.oid
    WHERE t.typname = 'gift_registry_status'
      AND e.enumlabel = 'draft'
  ) THEN
    ALTER TABLE public.gift_registries
      ALTER COLUMN status SET DEFAULT 'draft';
  END IF;
END $$;
