import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const supabase = await createClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    const { data: profile } = await supabase
      .from("user_profiles")
      .select("role")
      .eq("id", user.id)
      .single()

    if (profile?.role !== "superadmin") {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 })
    }

    const body = await request.json()
    const aliadoIdRaw = body?.aliado_id
    const aliadoId = typeof aliadoIdRaw === "string" && aliadoIdRaw.trim().length > 0 ? aliadoIdRaw : null

    const admin = createAdminClient()

    const { data: distributor, error: distError } = await admin
      .from("distributors")
      .select("id")
      .eq("id", id)
      .single()

    if (distError || !distributor) {
      return NextResponse.json({ error: "Cliente no encontrado" }, { status: 404 })
    }

    if (aliadoId) {
      const { data: aliado, error: aliadoError } = await admin
        .from("aliados")
        .select("id")
        .eq("id", aliadoId)
        .single()

      if (aliadoError || !aliado) {
        return NextResponse.json({ error: "Aliado no encontrado" }, { status: 400 })
      }
    }

    const { data: updatedDistributor, error: updateError } = await admin
      .from("distributors")
      .update({ aliado_id: aliadoId })
      .eq("id", id)
      .select("id, aliado_id")
      .single()

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 400 })
    }

    return NextResponse.json({ success: true, distributor: updatedDistributor })
  } catch (error) {
    console.error("Error updating distributor aliado assignment:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Error al actualizar aliado asignado" },
      { status: 500 },
    )
  }
}
