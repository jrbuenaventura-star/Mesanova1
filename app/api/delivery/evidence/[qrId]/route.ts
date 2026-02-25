import { NextResponse } from "next/server"

import { requireSuperadminUser } from "@/lib/delivery/admin-auth"
import { hashSessionToken } from "@/lib/delivery/security"
import { createAdminClient } from "@/lib/supabase/admin"

export async function GET(
  request: Request,
  { params }: { params: Promise<{ qrId: string }> }
) {
  try {
    const { qrId } = await params
    const { searchParams } = new URL(request.url)
    const sessionToken = searchParams.get("session_token")

    const supabaseAdmin = createAdminClient()

    let authorized = false
    if (sessionToken) {
      const tokenHash = hashSessionToken(sessionToken)
      const { data: session } = await supabaseAdmin
        .from("delivery_validation_sessions")
        .select("id, qr_id, otp_verified")
        .eq("session_token_hash", tokenHash)
        .eq("qr_id", qrId)
        .single()
      authorized = !!session?.otp_verified
    } else {
      const auth = await requireSuperadminUser()
      authorized = auth.ok
    }

    if (!authorized) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    const { data: confirmation, error } = await supabaseAdmin
      .from("delivery_confirmations")
      .select("id, order_id, evidence_pdf_path")
      .eq("qr_id", qrId)
      .single()

    if (error || !confirmation || !confirmation.evidence_pdf_path) {
      return NextResponse.json({ error: "Evidencia no disponible" }, { status: 404 })
    }

    const bucket = "delivery-evidence"
    const { data: fileData, error: downloadError } = await supabaseAdmin.storage
      .from(bucket)
      .download(confirmation.evidence_pdf_path)

    if (downloadError || !fileData) {
      return NextResponse.json({ error: downloadError?.message || "No se pudo descargar evidencia" }, { status: 500 })
    }

    const bytes = await fileData.arrayBuffer()
    return new NextResponse(bytes, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="evidencia-entrega-${confirmation.order_id}.pdf"`,
        "Cache-Control": "private, max-age=300",
      },
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Error al descargar evidencia"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
