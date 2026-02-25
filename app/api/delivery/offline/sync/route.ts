import { NextResponse } from "next/server"

import { writeDeliveryAuditLog } from "@/lib/delivery/audit"
import { getRequestContext } from "@/lib/delivery/request"
import { hashOfflineDeliveryEvent } from "@/lib/delivery/security"
import { createAdminClient } from "@/lib/supabase/admin"

type OfflineSyncItem = {
  qr_id?: string | null
  order_id: string
  device_id: string
  event_type: "confirmacion" | "firma" | "sincronizacion"
  event_payload: Record<string, unknown>
  timestamp: string
  gps: string
  offline_hash: string
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { items?: OfflineSyncItem[] }
    const items = Array.isArray(body.items) ? body.items : []

    if (items.length === 0) {
      return NextResponse.json({ error: "No hay eventos para sincronizar" }, { status: 400 })
    }

    const supabaseAdmin = createAdminClient()
    const context = await getRequestContext()
    const results: Array<{ offline_hash: string; status: string; reason?: string }> = []

    for (const item of items) {
      if (!item.order_id || !item.device_id || !item.timestamp || !item.gps || !item.offline_hash) {
        results.push({
          offline_hash: item.offline_hash || "unknown",
          status: "rejected",
          reason: "Missing required fields",
        })
        continue
      }

      const expectedHash = hashOfflineDeliveryEvent({
        order_id: item.order_id,
        timestamp: item.timestamp,
        gps: item.gps,
        device_id: item.device_id,
      })

      if (expectedHash !== item.offline_hash) {
        await supabaseAdmin.from("delivery_offline_events").upsert(
          {
            qr_id: item.qr_id || null,
            order_id: item.order_id,
            device_id: item.device_id,
            event_type: item.event_type,
            event_payload: item.event_payload || {},
            offline_hash: item.offline_hash,
            sync_status: "rejected",
            server_validation_message: "hash_mismatch",
            synced_at: new Date().toISOString(),
          },
          { onConflict: "offline_hash" }
        )
        results.push({
          offline_hash: item.offline_hash,
          status: "rejected",
          reason: "hash_mismatch",
        })
        continue
      }

      const { data: existing } = await supabaseAdmin
        .from("delivery_offline_events")
        .select("id, sync_status")
        .eq("offline_hash", item.offline_hash)
        .single()

      if (existing?.sync_status === "synced") {
        results.push({
          offline_hash: item.offline_hash,
          status: "already_synced",
        })
        continue
      }

      await supabaseAdmin.from("delivery_offline_events").upsert(
        {
          qr_id: item.qr_id || null,
          order_id: item.order_id,
          device_id: item.device_id,
          event_type: item.event_type,
          event_payload: item.event_payload || {},
          offline_hash: item.offline_hash,
          sync_status: "synced",
          server_validation_message: "accepted",
          synced_at: new Date().toISOString(),
        },
        { onConflict: "offline_hash" }
      )

      await writeDeliveryAuditLog(supabaseAdmin, {
        entity_type: "offline",
        entity_id: item.offline_hash,
        action: "offline_event_synced",
        actor_type: "transporter",
        request_id: context.requestId,
        ip_address: context.ip,
        device_info: context.userAgent,
        metadata: {
          order_id: item.order_id,
          device_id: item.device_id,
          event_type: item.event_type,
        },
      })

      results.push({
        offline_hash: item.offline_hash,
        status: "synced",
      })
    }

    return NextResponse.json({
      total: items.length,
      results,
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : "No se pudo sincronizar offline"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
