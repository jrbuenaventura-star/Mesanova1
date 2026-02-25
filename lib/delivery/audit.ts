import "server-only"

import type { SupabaseClient } from "@supabase/supabase-js"

type DeliveryAuditPayload = {
  entity_type: "qr" | "otp" | "session" | "confirmation" | "incident" | "offline" | "erp"
  entity_id: string
  action: string
  actor_type: "system" | "admin" | "customer" | "transporter" | "erp"
  actor_id?: string | null
  request_id?: string | null
  ip_address?: string | null
  device_info?: string | null
  metadata?: Record<string, unknown>
}

export async function writeDeliveryAuditLog(
  supabaseAdmin: SupabaseClient,
  payload: DeliveryAuditPayload
) {
  const { error } = await supabaseAdmin.from("delivery_audit_logs").insert({
    ...payload,
    actor_id: payload.actor_id || null,
    request_id: payload.request_id || null,
    ip_address: payload.ip_address || null,
    device_info: payload.device_info || null,
    metadata: payload.metadata || {},
    record_hash: "pending",
  })

  if (error) {
    console.error("[delivery.audit] failed to persist audit log:", error)
  }
}
