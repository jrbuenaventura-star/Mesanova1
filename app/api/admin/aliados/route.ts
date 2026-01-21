import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"

type CreateAliadoBody = {
  email: string
  company_name: string
  contact_name?: string
  phone?: string
  commission_percentage?: string | number
  is_active?: boolean
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

    const body = (await req.json()) as CreateAliadoBody

    const email = (body.email || "").trim().toLowerCase()
    const company_name = (body.company_name || "").trim()

    if (!email) {
      return NextResponse.json({ error: "Email requerido" }, { status: 400 })
    }

    if (!company_name) {
      return NextResponse.json({ error: "Nombre de empresa requerido" }, { status: 400 })
    }

    const admin = createAdminClient()

    // Evitar flujo ambiguo si el usuario ya existe
    const { data: usersData } = await admin.auth.admin.listUsers()
    const existingUser = usersData?.users?.find((u) => (u.email || "").toLowerCase() === email)
    if (existingUser) {
      return NextResponse.json(
        {
          error:
            "Ya existe un usuario con ese email. Edita el aliado existente o elimina el usuario primero si deseas re-invitar.",
        },
        { status: 400 }
      )
    }

    const { data, error } = await admin.auth.admin.inviteUserByEmail(email, {
      data: {
        role: "aliado",
        full_name: body.contact_name || null,
      },
      redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"}/auth/callback`,
    })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    const invitedUserId = data?.user?.id

    if (!invitedUserId) {
      return NextResponse.json({ error: "No se pudo crear el usuario" }, { status: 500 })
    }

    const commission =
      typeof body.commission_percentage === "string"
        ? Number.parseFloat(body.commission_percentage)
        : typeof body.commission_percentage === "number"
          ? body.commission_percentage
          : 0

    const { error: profileUpsertError } = await admin.from("user_profiles").upsert({
      id: invitedUserId,
      role: "aliado",
      full_name: body.contact_name || null,
      phone: body.phone || null,
    })

    if (profileUpsertError) {
      return NextResponse.json({ error: profileUpsertError.message }, { status: 400 })
    }

    const { error: aliadoError } = await admin.from("aliados").insert({
      user_id: invitedUserId,
      company_name,
      contact_name: body.contact_name || null,
      phone: body.phone || null,
      email,
      total_sales: 0,
      commission_percentage: Number.isFinite(commission) ? commission : 0,
      is_active: body.is_active ?? true,
    })

    if (aliadoError) {
      return NextResponse.json({ error: aliadoError.message }, { status: 400 })
    }

    return NextResponse.json({ success: true })
  } catch (e) {
    const message = e instanceof Error ? e.message : "Unknown error"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
