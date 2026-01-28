-- Agregar relación de distribuidor -> aliado
-- Requiere que exista la tabla "aliados" con PK "id" (uuid)

DO $$
BEGIN
  -- Columna aliado_id (nullable)
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'distributors'
      AND column_name = 'aliado_id'
  ) THEN
    ALTER TABLE public.distributors
      ADD COLUMN aliado_id uuid;
  END IF;

  -- FK a aliados.id
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.table_constraints tc
    WHERE tc.table_schema = 'public'
      AND tc.table_name = 'distributors'
      AND tc.constraint_type = 'FOREIGN KEY'
      AND tc.constraint_name = 'distributors_aliado_id_fkey'
  ) THEN
    ALTER TABLE public.distributors
      ADD CONSTRAINT distributors_aliado_id_fkey
      FOREIGN KEY (aliado_id)
      REFERENCES public.aliados(id)
      ON DELETE SET NULL;
  END IF;
END $$;

-- Índice para consultas por aliado
CREATE INDEX IF NOT EXISTS idx_distributors_aliado_id
  ON public.distributors(aliado_id);

-- Agregar columnas adicionales para clientes (refactoring Distributor -> Cliente)
DO $$
BEGIN
  -- Columna commercial_name (nombre comercial)
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'distributors'
      AND column_name = 'commercial_name'
  ) THEN
    ALTER TABLE public.distributors
      ADD COLUMN commercial_name text;
  END IF;

  -- Columna payment_terms (términos de pago)
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'distributors'
      AND column_name = 'payment_terms'
  ) THEN
    ALTER TABLE public.distributors
      ADD COLUMN payment_terms text;
  END IF;

  -- Columna notes (notas)
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'distributors'
      AND column_name = 'notes'
  ) THEN
    ALTER TABLE public.distributors
      ADD COLUMN notes text;
  END IF;
END $$;
