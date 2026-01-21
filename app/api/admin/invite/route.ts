import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"
import type { UserRole } from "@/lib/db/types"

type InviteBody = {
  email: string
  role: UserRole
}

export async function POST(req: Request) {
  try {
    const supabase = await createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 })
    }

    const { data: profile, error: profileError } = await supabase
      .from("user_profiles")
      .select("role")
      .eq("id", user.id)
      .single()

    if (profileError) {
      return NextResponse.json({ error: profileError.message }, { status: 500 })
    }

    if (profile?.role !== "superadmin") {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 })
    }

    const body = (await req.json()) as InviteBody

    const email = (body.email || "").trim().toLowerCase()
    const role = body.role

    if (!email) {
      return NextResponse.json({ error: "Email requerido" }, { status: 400 })
    }

    if (!role || !["superadmin", "distributor", "aliado", "end_user"].includes(role)) {
      return NextResponse.json({ error: "Rol inválido" }, { status: 400 })
    }

    const admin = createAdminClient()

    const { data, error } = await admin.auth.admin.inviteUserByEmail(email, {
      data: {
        role,
      },
      redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"}/auth/callback`,
    })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    if (data?.user?.id) {
      const { error: profileUpsertError } = await admin
        .from("user_profiles")
        .upsert({
          id: data.user.id,
          role,
        })

      if (profileUpsertError) {
        return NextResponse.json({ error: profileUpsertError.message }, { status: 400 })
      }
    }

    return NextResponse.json({ success: true })
  } catch (e) {
    const message = e instanceof Error ? e.message : "Unknown error"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
