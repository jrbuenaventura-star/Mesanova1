-- Agregar nuevo rol 'canal' (corredor/agente comercial)
ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'canal';;
