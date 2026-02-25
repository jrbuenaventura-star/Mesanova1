import { NextResponse } from "next/server"

import { writeDeliveryAuditLog } from "@/lib/delivery/audit"
import { getRequestContext } from "@/lib/delivery/request"
import { buildTokenFingerprint, verifyDeliveryToken } from "@/lib/delivery/security"
import { createAdminClient } from "@/lib/supabase/admin"

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { token?: string }
    const token = String(body.token || "").trim()
    if (!token) {
      return NextResponse.json({ error: "Token QR requerido" }, { status: 400 })
    }

    const payload = verifyDeliveryToken(token)
    const tokenFingerprint = buildTokenFingerprint(token)
    const supabaseAdmin = createAdminClient()

    const { data: qr, error } = await supabaseAdmin
      .from("delivery_qr_tokens")
      .select(
        "id, order_id, warehouse_id, delivery_batch_id, status, expires_at, confirmed_at, revoked_at, token_fingerprint"
      )
      .eq("id", payload.jti)
      .single()

    if (error || !qr) {
      return NextResponse.json({ error: "QR no válido" }, { status: 404 })
    }

    if (qr.token_fingerprint !== tokenFingerprint) {
      return NextResponse.json({ error: "QR no válido" }, { status: 400 })
    }

    const now = new Date()
    if (new Date(qr.expires_at).getTime() <= now.getTime()) {
      await supabaseAdmin
        .from("delivery_qr_tokens")
        .update({ status: "expirado", updated_at: now.toISOString() })
        .eq("id", qr.id)

      return NextResponse.json({ error: "QR expirado" }, { status: 410 })
    }

    if (qr.revoked_at || qr.status === "confirmado" || qr.status === "confirmado_con_incidente") {
      return NextResponse.json({ error: "Entrega ya confirmada para este QR" }, { status: 409 })
    }

    if (qr.status === "rechazado") {
      return NextResponse.json({ error: "Entrega previamente rechazada" }, { status: 409 })
    }

    const context = await getRequestContext()
    await writeDeliveryAuditLog(supabaseAdmin, {
      entity_type: "qr",
      entity_id: qr.id,
      action: "qr_scanned",
      actor_type: "customer",
      request_id: context.requestId,
      ip_address: context.ip,
      device_info: context.userAgent,
      metadata: {
        order_id: qr.order_id,
        warehouse_id: qr.warehouse_id,
        delivery_batch_id: qr.delivery_batch_id,
      },
    })

    return NextResponse.json({
      qr_id: qr.id,
      order_hint: qr.order_id.slice(-8),
      warehouse_id: qr.warehouse_id,
      delivery_batch_id: qr.delivery_batch_id,
      status: qr.status,
      expires_at: qr.expires_at,
      requires_otp: true,
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : "No se pudo validar el QR"
    return NextResponse.json({ error: message }, { status: 400 })
  }
}
