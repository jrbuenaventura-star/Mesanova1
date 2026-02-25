import { NextResponse } from "next/server"

import { writeDeliveryAuditLog } from "@/lib/delivery/audit"
import { currentErpAdapter } from "@/lib/delivery/erp-adapter"
import { getRequestContext } from "@/lib/delivery/request"
import { createAdminClient } from "@/lib/supabase/admin"

function isAuthorized(request: Request) {
  const expected = process.env.ERP_SYNC_TOKEN
  if (!expected) {
    return false
  }
  const provided = request.headers.get("x-erp-sync-token")
  return provided === expected
}

export async function POST(request: Request) {
  try {
    if (!isAuthorized(request)) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    const payload = (await request.json()) as {
      order_id?: string
      source_system?: string
      event_type?: string
      event_payload?: Record<string, unknown>
      snapshot?: Record<string, unknown>
    }

    if (!payload.event_type) {
      return NextResponse.json({ error: "event_type es obligatorio" }, { status: 400 })
    }

    const supabaseAdmin = createAdminClient()
    const context = await getRequestContext()

    await currentErpAdapter.ingestSyncEvent(supabaseAdmin, {
      order_id: payload.order_id,
      source_system: payload.source_system || "erp_actual",
      event_type: payload.event_type,
      event_payload: payload.event_payload || {},
    })

    if (payload.order_id && payload.snapshot) {
      const snapshot = payload.snapshot
      await supabaseAdmin.from("delivery_erp_order_snapshots").upsert(
        {
          order_id: payload.order_id,
          source_system: payload.source_system || "erp_actual",
          order_number: String(snapshot.order_number || payload.order_id),
          customer_id: snapshot.customer_id ? String(snapshot.customer_id) : null,
          customer_name: snapshot.customer_name ? String(snapshot.customer_name) : null,
          customer_phone: snapshot.customer_phone ? String(snapshot.customer_phone) : null,
          customer_email: snapshot.customer_email ? String(snapshot.customer_email) : null,
          shipping_address: snapshot.shipping_address ? String(snapshot.shipping_address) : null,
          shipping_city: snapshot.shipping_city ? String(snapshot.shipping_city) : null,
          warehouse_id: snapshot.warehouse_id ? String(snapshot.warehouse_id) : null,
          warehouse_name: snapshot.warehouse_name ? String(snapshot.warehouse_name) : null,
          status: snapshot.status ? String(snapshot.status) : null,
          items: Array.isArray(snapshot.items) ? snapshot.items : [],
          packages: Array.isArray(snapshot.packages) ? snapshot.packages : [],
          raw_payload: payload.snapshot,
          last_synced_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        { onConflict: "order_id" }
      )
    }

    await writeDeliveryAuditLog(supabaseAdmin, {
      entity_type: "erp",
      entity_id: payload.order_id || payload.event_type,
      action: "erp_event_ingested",
      actor_type: "erp",
      request_id: context.requestId,
      ip_address: context.ip,
      device_info: context.userAgent,
      metadata: {
        source_system: payload.source_system || "erp_actual",
        event_type: payload.event_type,
      },
    })

    return NextResponse.json({
      success: true,
      received_at: new Date().toISOString(),
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Error ingestando evento ERP"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
