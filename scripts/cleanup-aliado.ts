import { createAdminClient } from "@/lib/supabase/admin"

async function cleanupAliado(email: string) {
  const admin = createAdminClient()

  console.log(`🔍 Buscando usuario con email: ${email}`)

  const { data: usersData } = await admin.auth.admin.listUsers()
  const user = usersData?.users?.find((u) => u.email?.toLowerCase() === email.toLowerCase())

  if (!user) {
    console.log("❌ Usuario no encontrado en Auth")
    return
  }

  console.log(`✅ Usuario encontrado: ${user.id}`)

  const { data: aliado } = await admin
    .from("aliados")
    .select("*")
    .eq("user_id", user.id)
    .single()

  if (aliado) {
    console.log(`🗑️  Eliminando registro de aliado: ${aliado.id}`)
    const { error: deleteAliadoError } = await admin
      .from("aliados")
      .delete()
      .eq("id", aliado.id)

    if (deleteAliadoError) {
      console.error("❌ Error al eliminar aliado:", deleteAliadoError)
    } else {
      console.log("✅ Registro de aliado eliminado")
    }
  }

  const { data: profile } = await admin
    .from("user_profiles")
    .select("*")
    .eq("id", user.id)
    .single()

  if (profile) {
    console.log(`🗑️  Eliminando perfil de usuario: ${profile.id}`)
    const { error: deleteProfileError } = await admin
      .from("user_profiles")
      .delete()
      .eq("id", user.id)

    if (deleteProfileError) {
      console.error("❌ Error al eliminar perfil:", deleteProfileError)
    } else {
      console.log("✅ Perfil de usuario eliminado")
    }
  }

  console.log(`🗑️  Eliminando usuario de Auth: ${user.id}`)
  const { error: deleteUserError } = await admin.auth.admin.deleteUser(user.id)

  if (deleteUserError) {
    console.error("❌ Error al eliminar usuario:", deleteUserError)
  } else {
    console.log("✅ Usuario eliminado de Auth")
  }

  console.log("✨ Limpieza completada")
}

const email = process.argv[2]

if (!email) {
  console.error("❌ Debes proporcionar un email")
  console.log("Uso: npx tsx scripts/cleanup-aliado.ts email@example.com")
  process.exit(1)
}

cleanupAliado(email)
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Error:", error)
    process.exit(1)
  })
