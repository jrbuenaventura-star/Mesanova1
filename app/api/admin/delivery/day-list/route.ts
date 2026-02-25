import { NextResponse } from "next/server"

import { requireSuperadminUser } from "@/lib/delivery/admin-auth"
import { buildPublicOrderViewForQr } from "@/lib/delivery/orders"
import { createAdminClient } from "@/lib/supabase/admin"

export async function GET(request: Request) {
  try {
    const auth = await requireSuperadminUser()
    if (!auth.ok) {
      return NextResponse.json({ error: auth.error }, { status: auth.status })
    }

    const { searchParams } = new URL(request.url)
    const date = searchParams.get("date")
    const warehouseId = searchParams.get("warehouse_id")
    const transporterId = searchParams.get("transporter_id")

    const targetDate = date ? new Date(date) : new Date()
    const start = new Date(targetDate)
    start.setHours(0, 0, 0, 0)
    const end = new Date(targetDate)
    end.setHours(23, 59, 59, 999)

    const supabaseAdmin = createAdminClient()

    let query = supabaseAdmin
      .from("delivery_qr_tokens")
      .select(
        "id, order_id, warehouse_id, delivery_batch_id, transporter_id, status, issued_at, expires_at, signed_token"
      )
      .gte("issued_at", start.toISOString())
      .lte("issued_at", end.toISOString())
      .in("status", ["pendiente", "confirmado_con_incidente"])
      .order("issued_at", { ascending: true })

    if (warehouseId && warehouseId !== "all") {
      query = query.eq("warehouse_id", warehouseId)
    }
    if (transporterId && transporterId !== "all") {
      query = query.eq("transporter_id", transporterId)
    }

    const { data: qrRows, error } = await query
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    const records = await Promise.all(
      (qrRows || []).map(async (qr) => {
        const orderView = await buildPublicOrderViewForQr(supabaseAdmin, {
          id: qr.id,
          order_id: qr.order_id,
          warehouse_id: qr.warehouse_id,
          status: qr.status,
        })
        return {
          qr_id: qr.id,
          order_id: qr.order_id,
          warehouse_id: qr.warehouse_id,
          delivery_batch_id: qr.delivery_batch_id,
          transporter_id: qr.transporter_id,
          status: qr.status,
          issued_at: qr.issued_at,
          expires_at: qr.expires_at,
          signed_token: qr.signed_token,
          order: orderView,
        }
      })
    )

    return NextResponse.json({
      generated_at: new Date().toISOString(),
      date: start.toISOString().slice(0, 10),
      records,
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unexpected error"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
