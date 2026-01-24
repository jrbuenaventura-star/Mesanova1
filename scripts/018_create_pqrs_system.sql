-- Sistema completo de PQRs (Peticiones, Quejas, Reclamos y Sugerencias)

-- Tabla principal de tickets
CREATE TABLE IF NOT EXISTS pqrs_tickets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_number VARCHAR(20) UNIQUE NOT NULL,
  tipo VARCHAR(20) NOT NULL CHECK (tipo IN ('peticion', 'queja', 'reclamo', 'sugerencia')),
  asunto VARCHAR(255) NOT NULL,
  descripcion TEXT NOT NULL,
  prioridad VARCHAR(20) NOT NULL DEFAULT 'media' CHECK (prioridad IN ('baja', 'media', 'alta', 'urgente')),
  estado VARCHAR(20) NOT NULL DEFAULT 'nuevo' CHECK (estado IN ('nuevo', 'en_proceso', 'pendiente', 'resuelto', 'cerrado')),
  resolucion TEXT,
  creado_por UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  creado_por_nombre VARCHAR(255),
  creado_por_email VARCHAR(255),
  creado_por_rol VARCHAR(50),
  asignado_a UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  fecha_creacion TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  fecha_actualizacion TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  fecha_resolucion TIMESTAMP WITH TIME ZONE,
  fecha_cierre TIMESTAMP WITH TIME ZONE,
  oculto BOOLEAN DEFAULT FALSE,
  metadata JSONB DEFAULT '{}'::jsonb
);

-- Tabla de tareas asignadas a superadmins
CREATE TABLE IF NOT EXISTS pqrs_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id UUID NOT NULL REFERENCES pqrs_tickets(id) ON DELETE CASCADE,
  titulo VARCHAR(255) NOT NULL,
  descripcion TEXT,
  asignado_a UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  asignado_por UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  estado VARCHAR(20) NOT NULL DEFAULT 'pendiente' CHECK (estado IN ('pendiente', 'en_progreso', 'completada', 'cancelada')),
  prioridad VARCHAR(20) NOT NULL DEFAULT 'media' CHECK (prioridad IN ('baja', 'media', 'alta', 'urgente')),
  fecha_creacion TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  fecha_completada TIMESTAMP WITH TIME ZONE,
  metadata JSONB DEFAULT '{}'::jsonb
);

-- Tabla de comentarios/historial
CREATE TABLE IF NOT EXISTS pqrs_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id UUID NOT NULL REFERENCES pqrs_tickets(id) ON DELETE CASCADE,
  usuario_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  usuario_nombre VARCHAR(255),
  usuario_rol VARCHAR(50),
  comentario TEXT NOT NULL,
  es_interno BOOLEAN DEFAULT FALSE,
  tipo_cambio VARCHAR(50),
  cambio_anterior TEXT,
  cambio_nuevo TEXT,
  fecha_creacion TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  metadata JSONB DEFAULT '{}'::jsonb
);

-- Tabla de archivos adjuntos
CREATE TABLE IF NOT EXISTS pqrs_attachments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id UUID NOT NULL REFERENCES pqrs_tickets(id) ON DELETE CASCADE,
  nombre_archivo VARCHAR(255) NOT NULL,
  ruta_storage TEXT NOT NULL,
  tipo_mime VARCHAR(100),
  tamano_bytes BIGINT,
  subido_por UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  fecha_subida TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  metadata JSONB DEFAULT '{}'::jsonb
);

-- Índices para optimizar consultas
CREATE INDEX IF NOT EXISTS idx_pqrs_tickets_creado_por ON pqrs_tickets(creado_por);
CREATE INDEX IF NOT EXISTS idx_pqrs_tickets_asignado_a ON pqrs_tickets(asignado_a);
CREATE INDEX IF NOT EXISTS idx_pqrs_tickets_estado ON pqrs_tickets(estado);
CREATE INDEX IF NOT EXISTS idx_pqrs_tickets_prioridad ON pqrs_tickets(prioridad);
CREATE INDEX IF NOT EXISTS idx_pqrs_tickets_fecha_creacion ON pqrs_tickets(fecha_creacion DESC);
CREATE INDEX IF NOT EXISTS idx_pqrs_tickets_ticket_number ON pqrs_tickets(ticket_number);
CREATE INDEX IF NOT EXISTS idx_pqrs_tasks_ticket_id ON pqrs_tasks(ticket_id);
CREATE INDEX IF NOT EXISTS idx_pqrs_tasks_asignado_a ON pqrs_tasks(asignado_a);
CREATE INDEX IF NOT EXISTS idx_pqrs_comments_ticket_id ON pqrs_comments(ticket_id);
CREATE INDEX IF NOT EXISTS idx_pqrs_attachments_ticket_id ON pqrs_attachments(ticket_id);

-- Función para generar número de ticket único
CREATE OR REPLACE FUNCTION generate_ticket_number()
RETURNS TEXT AS $$
DECLARE
  new_number TEXT;
  year_part TEXT;
  sequence_part TEXT;
  exists_check BOOLEAN;
BEGIN
  year_part := TO_CHAR(NOW(), 'YYYY');
  
  LOOP
    sequence_part := LPAD(FLOOR(RANDOM() * 999999)::TEXT, 6, '0');
    new_number := 'TKT-' || year_part || '-' || sequence_part;
    
    SELECT EXISTS(SELECT 1 FROM pqrs_tickets WHERE ticket_number = new_number) INTO exists_check;
    
    EXIT WHEN NOT exists_check;
  END LOOP;
  
  RETURN new_number;
END;
$$ LANGUAGE plpgsql;

-- Trigger para generar número de ticket automáticamente
CREATE OR REPLACE FUNCTION set_ticket_number()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.ticket_number IS NULL OR NEW.ticket_number = '' THEN
    NEW.ticket_number := generate_ticket_number();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_set_ticket_number
BEFORE INSERT ON pqrs_tickets
FOR EACH ROW
EXECUTE FUNCTION set_ticket_number();

-- Trigger para actualizar fecha_actualizacion
CREATE OR REPLACE FUNCTION update_pqrs_ticket_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.fecha_actualizacion := NOW();
  
  IF NEW.estado = 'resuelto' AND OLD.estado != 'resuelto' THEN
    NEW.fecha_resolucion := NOW();
  END IF;
  
  IF NEW.estado = 'cerrado' AND OLD.estado != 'cerrado' THEN
    NEW.fecha_cierre := NOW();
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_pqrs_ticket_timestamp
BEFORE UPDATE ON pqrs_tickets
FOR EACH ROW
EXECUTE FUNCTION update_pqrs_ticket_timestamp();

-- Habilitar RLS en todas las tablas
ALTER TABLE pqrs_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE pqrs_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE pqrs_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE pqrs_attachments ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para pqrs_tickets

-- Superadmins pueden ver todos los tickets
CREATE POLICY "Superadmins pueden ver todos los tickets"
ON pqrs_tickets FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM user_profiles
    WHERE user_profiles.id = auth.uid()
    AND user_profiles.role = 'superadmin'
  )
);

-- Distribuidores y agentes pueden ver sus propios tickets
CREATE POLICY "Usuarios pueden ver sus propios tickets"
ON pqrs_tickets FOR SELECT
TO authenticated
USING (
  creado_por = auth.uid()
  OR EXISTS (
    SELECT 1 FROM user_profiles
    WHERE user_profiles.id = auth.uid()
    AND user_profiles.role = 'superadmin'
  )
);

-- Distribuidores y aliados pueden crear tickets
CREATE POLICY "Distribuidores y aliados pueden crear tickets"
ON pqrs_tickets FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM user_profiles
    WHERE user_profiles.id = auth.uid()
    AND user_profiles.role IN ('distributor', 'aliado')
  )
  AND creado_por = auth.uid()
);

-- Solo superadmins pueden actualizar tickets
CREATE POLICY "Superadmins pueden actualizar tickets"
ON pqrs_tickets FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM user_profiles
    WHERE user_profiles.id = auth.uid()
    AND user_profiles.role = 'superadmin'
  )
);

-- Políticas RLS para pqrs_tasks

-- Superadmins pueden ver todas las tareas
CREATE POLICY "Superadmins pueden ver todas las tareas"
ON pqrs_tasks FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM user_profiles
    WHERE user_profiles.id = auth.uid()
    AND user_profiles.role = 'superadmin'
  )
);

-- Superadmins pueden crear tareas
CREATE POLICY "Superadmins pueden crear tareas"
ON pqrs_tasks FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM user_profiles
    WHERE user_profiles.id = auth.uid()
    AND user_profiles.role = 'superadmin'
  )
);

-- Superadmins pueden actualizar tareas
CREATE POLICY "Superadmins pueden actualizar tareas"
ON pqrs_tasks FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM user_profiles
    WHERE user_profiles.id = auth.uid()
    AND user_profiles.role = 'superadmin'
  )
);

-- Políticas RLS para pqrs_comments

-- Superadmins pueden ver todos los comentarios
CREATE POLICY "Superadmins pueden ver todos los comentarios"
ON pqrs_comments FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM user_profiles
    WHERE user_profiles.id = auth.uid()
    AND user_profiles.role = 'superadmin'
  )
);

-- Usuarios pueden ver comentarios no internos de sus tickets
CREATE POLICY "Usuarios pueden ver comentarios de sus tickets"
ON pqrs_comments FOR SELECT
TO authenticated
USING (
  (NOT es_interno AND EXISTS (
    SELECT 1 FROM pqrs_tickets
    WHERE pqrs_tickets.id = pqrs_comments.ticket_id
    AND pqrs_tickets.creado_por = auth.uid()
  ))
  OR EXISTS (
    SELECT 1 FROM user_profiles
    WHERE user_profiles.id = auth.uid()
    AND user_profiles.role = 'superadmin'
  )
);

-- Todos los usuarios autenticados pueden crear comentarios
CREATE POLICY "Usuarios pueden crear comentarios"
ON pqrs_comments FOR INSERT
TO authenticated
WITH CHECK (
  usuario_id = auth.uid()
  AND (
    EXISTS (
      SELECT 1 FROM pqrs_tickets
      WHERE pqrs_tickets.id = pqrs_comments.ticket_id
      AND pqrs_tickets.creado_por = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.role = 'superadmin'
    )
  )
);

-- Políticas RLS para pqrs_attachments

-- Superadmins pueden ver todos los archivos
CREATE POLICY "Superadmins pueden ver todos los archivos"
ON pqrs_attachments FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM user_profiles
    WHERE user_profiles.id = auth.uid()
    AND user_profiles.role = 'superadmin'
  )
);

-- Usuarios pueden ver archivos de sus tickets
CREATE POLICY "Usuarios pueden ver archivos de sus tickets"
ON pqrs_attachments FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM pqrs_tickets
    WHERE pqrs_tickets.id = pqrs_attachments.ticket_id
    AND pqrs_tickets.creado_por = auth.uid()
  )
  OR EXISTS (
    SELECT 1 FROM user_profiles
    WHERE user_profiles.id = auth.uid()
    AND user_profiles.role = 'superadmin'
  )
);

-- Usuarios pueden subir archivos a sus tickets
CREATE POLICY "Usuarios pueden subir archivos"
ON pqrs_attachments FOR INSERT
TO authenticated
WITH CHECK (
  subido_por = auth.uid()
  AND (
    EXISTS (
      SELECT 1 FROM pqrs_tickets
      WHERE pqrs_tickets.id = pqrs_attachments.ticket_id
      AND pqrs_tickets.creado_por = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.role = 'superadmin'
    )
  )
);

-- Crear bucket de storage para archivos de PQRs
INSERT INTO storage.buckets (id, name, public)
VALUES ('pqrs-attachments', 'pqrs-attachments', false)
ON CONFLICT (id) DO NOTHING;

-- Política de storage para subir archivos
CREATE POLICY "Usuarios autenticados pueden subir archivos"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'pqrs-attachments'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Política de storage para ver archivos
CREATE POLICY "Usuarios pueden ver sus archivos o superadmins todos"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'pqrs-attachments'
  AND (
    auth.uid()::text = (storage.foldername(name))[1]
    OR EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.role = 'superadmin'
    )
  )
);

-- Política de storage para eliminar archivos (solo superadmins)
CREATE POLICY "Superadmins pueden eliminar archivos"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'pqrs-attachments'
  AND EXISTS (
    SELECT 1 FROM user_profiles
    WHERE user_profiles.id = auth.uid()
    AND user_profiles.role = 'superadmin'
  )
);
