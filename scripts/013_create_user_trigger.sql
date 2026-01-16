-- Crear trigger automático para crear perfiles de usuario cuando se registran
-- Esto funciona tanto para email/password como para OAuth (Google, etc.)

-- Función para manejar nuevos usuarios
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_profiles (id, full_name, role, is_active)
  VALUES (
    NEW.id,
    COALESCE(
      NEW.raw_user_meta_data->>'full_name',
      NEW.raw_user_meta_data->>'name',
      NEW.email,
      'Usuario'
    ),
    'end_user',
    true
  );
  RETURN NEW;
EXCEPTION
  WHEN unique_violation THEN
    -- Si el perfil ya existe, no hacer nada
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Eliminar trigger anterior si existe
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Crear trigger que se ejecuta después de insertar un nuevo usuario
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Permitir que el sistema inserte perfiles automáticamente
-- sin verificar RLS (necesario para el trigger)
ALTER TABLE public.user_profiles DISABLE ROW LEVEL SECURITY;

-- Re-habilitar RLS
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

-- Agregar política que permite insertar perfiles durante el signup
CREATE POLICY "allow_insert_during_signup" ON user_profiles
  FOR INSERT
  WITH CHECK (true);
