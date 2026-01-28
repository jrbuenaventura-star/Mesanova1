import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"

export async function GET(req: Request, { params }: { params: { id: string } }) {
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

    const { data: aliado, error } = await supabase
      .from("aliados")
      .select("*")
      .eq("id", params.id)
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 404 })
    }

    return NextResponse.json(aliado)
  } catch (e) {
    const message = e instanceof Error ? e.message : "Unknown error"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
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

    const body = await req.json()

    const updateData: any = {}

    if (body.company_name !== undefined) {
      updateData.company_name = body.company_name.trim()
    }
    if (body.contact_name !== undefined) {
      updateData.contact_name = body.contact_name ? body.contact_name.trim() : null
    }
    if (body.phone !== undefined) {
      updateData.phone = body.phone ? body.phone.trim() : null
    }
    if (body.commission_percentage !== undefined) {
      const commission = Number.parseFloat(body.commission_percentage)
      updateData.commission_percentage = Number.isFinite(commission) ? commission : 0
    }
    if (body.is_active !== undefined) {
      updateData.is_active = Boolean(body.is_active)
    }

    const admin = createAdminClient()

    const { data: aliado, error } = await admin
      .from("aliados")
      .update(updateData)
      .eq("id", params.id)
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json({ success: true, aliado })
  } catch (e) {
    const message = e instanceof Error ? e.message : "Unknown error"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
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

    const admin = createAdminClient()

    const { data: aliado } = await admin
      .from("aliados")
      .select("user_id")
      .eq("id", params.id)
      .single()

    if (!aliado) {
      return NextResponse.json({ error: "Aliado no encontrado" }, { status: 404 })
    }

    const { error: deleteError } = await admin
      .from("aliados")
      .delete()
      .eq("id", params.id)

    if (deleteError) {
      return NextResponse.json({ error: deleteError.message }, { status: 400 })
    }

    if (aliado.user_id) {
      await admin.auth.admin.deleteUser(aliado.user_id)
    }

    return NextResponse.json({ success: true })
  } catch (e) {
    const message = e instanceof Error ? e.message : "Unknown error"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
