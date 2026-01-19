-- Script para crear usuario de prueba superadmin
-- Ejecutar en Supabase SQL Editor

-- 1. Primero, crea el usuario en auth.users (esto lo debes hacer desde Supabase Dashboard > Authentication > Users > Add User)
-- Email: admin@test.local
-- Password: (elige una contraseña segura)

-- 2. Después de crear el usuario, ejecuta este script para darle rol de superadmin:
-- Reemplaza 'USER_ID_AQUI' con el ID del usuario que acabas de crear

UPDATE user_profiles 
SET role = 'superadmin'
WHERE id = 'USER_ID_AQUI';

-- Verificar que el usuario tiene rol de superadmin:
SELECT id, email, role 
FROM user_profiles 
WHERE role = 'superadmin';
