import "server-only"

import { hashStableValue } from "@/lib/security/api"
import { redactErrorMessage } from "@/lib/security/redact"
import { createAdminClient } from "@/lib/supabase/admin"

export type PriceIntelligenceAuditEventType =
  | "run_requested"
  | "run_completed"
  | "run_failed"
  | "summary_viewed"
  | "finding_reviewed"

type AuditEventInput = {
  eventType: PriceIntelligenceAuditEventType
  actorUserId?: string | null
  actorRole?: string | null
  source: string
  request: Request
  requestMeta?: Record<string, unknown>
}

function getClientIp(request: Request) {
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    request.headers.get("cf-connecting-ip") ||
    "unknown"
  )
}

function sanitizeAuditMeta(value: unknown, depth = 0): unknown {
  if (value === null || value === undefined) return null
  if (depth > 3) return null
  if (typeof value === "string") return value.slice(0, 400)
  if (typeof value === "number") return Number.isFinite(value) ? value : null
  if (typeof value === "boolean") return value
  if (Array.isArray(value)) return value.slice(0, 20).map((item) => sanitizeAuditMeta(item, depth + 1))
  if (typeof value === "object") {
    const entries = Object.entries(value as Record<string, unknown>).slice(0, 30)
    const out: Record<string, unknown> = {}
    for (const [key, item] of entries) {
      out[key.slice(0, 80)] = sanitizeAuditMeta(item, depth + 1)
    }
    return out
  }
  return String(value).slice(0, 200)
}

export async function createPriceIntelligenceAuditEvent(input: AuditEventInput) {
  try {
    const admin = createAdminClient()
    const userAgent = input.request.headers.get("user-agent") || null
    const requestId =
      input.request.headers.get("x-request-id") ||
      input.request.headers.get("x-vercel-id") ||
      null

    const metadata = sanitizeAuditMeta({
      request_id: requestId,
      user_agent: userAgent?.slice(0, 300) || null,
      ...(input.requestMeta || {}),
    })

    await admin.from("price_intelligence_audit_logs").insert({
      event_type: input.eventType,
      actor_user_id: input.actorUserId || null,
      actor_role: input.actorRole || null,
      source: input.source,
      request_ip_hash: hashStableValue(getClientIp(input.request)),
      request_meta: metadata,
    })
  } catch (error) {
    console.warn("[price_intel.audit] failed to persist audit event:", redactErrorMessage(error))
  }
}

