import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"

export async function POST(req: Request) {
  try {
    const supabase = await createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 })
    }

    const { data: profile } = await supabase
      .from("user_profiles")
      .select("role")
      .eq("id", user.id)
      .single()

    if (profile?.role !== "superadmin") {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 })
    }

    const { email } = await req.json()

    if (!email) {
      return NextResponse.json({ error: "Email requerido" }, { status: 400 })
    }

    const admin = createAdminClient()

    const { data: usersData } = await admin.auth.admin.listUsers()
    const targetUser = usersData?.users?.find((u) => u.email?.toLowerCase() === email.toLowerCase())

    if (!targetUser) {
      return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 })
    }

    const { data: aliado } = await admin
      .from("aliados")
      .select("*")
      .eq("user_id", targetUser.id)
      .maybeSingle()

    if (aliado) {
      await admin.from("aliados").delete().eq("id", aliado.id)
    }

    const { data: userProfile } = await admin
      .from("user_profiles")
      .select("*")
      .eq("id", targetUser.id)
      .maybeSingle()

    if (userProfile) {
      await admin.from("user_profiles").delete().eq("id", targetUser.id)
    }

    const { error: deleteUserError } = await admin.auth.admin.deleteUser(targetUser.id)

    if (deleteUserError) {
      return NextResponse.json({ error: deleteUserError.message }, { status: 400 })
    }

    return NextResponse.json({ 
      success: true, 
      message: `Usuario ${email} eliminado completamente` 
    })
  } catch (e) {
    const message = e instanceof Error ? e.message : "Unknown error"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
