import { NextRequest, NextResponse } from "next/server"

import { requireApiUser } from "@/lib/security/auth"
import { enforceRateLimit, enforceSameOrigin } from "@/lib/security/api"

const REQUEST_TYPES = ["access", "portability", "deletion", "rectification", "restriction"] as const
const REQUEST_STATUSES = ["pending", "in_progress", "completed", "rejected"] as const

type PrivacyRequestType = (typeof REQUEST_TYPES)[number]

type CreateDataRequestPayload = {
  request_type?: unknown
  request_payload?: unknown
}

function sanitizePayloadValue(value: unknown, depth = 0): unknown {
  if (value === null || value === undefined) return null
  if (depth > 2) return null

  if (typeof value === "string") return value.slice(0, 2000)
  if (typeof value === "number") return Number.isFinite(value) ? value : null
  if (typeof value === "boolean") return value

  if (Array.isArray(value)) {
    return value.slice(0, 25).map((item) => sanitizePayloadValue(item, depth + 1))
  }

  if (typeof value === "object") {
    const entries = Object.entries(value as Record<string, unknown>).slice(0, 25)
    const sanitized: Record<string, unknown> = {}
    for (const [key, entryValue] of entries) {
      sanitized[String(key).slice(0, 80)] = sanitizePayloadValue(entryValue, depth + 1)
    }
    return sanitized
  }

  return String(value).slice(0, 200)
}

function sanitizeRequestPayload(value: unknown) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {}
  return sanitizePayloadValue(value, 0) as Record<string, unknown>
}

function parseRequestType(value: unknown): PrivacyRequestType | null {
  const normalized = String(value || "")
    .trim()
    .toLowerCase()
  return REQUEST_TYPES.includes(normalized as PrivacyRequestType) ? (normalized as PrivacyRequestType) : null
}

async function isSuperadmin(userId: string, supabase: any) {
  const { data: profile, error } = await supabase.from("user_profiles").select("role").eq("id", userId).maybeSingle()
  if (error) return false
  return profile?.role === "superadmin"
}

export async function GET(request: NextRequest) {
  const auth = await requireApiUser()
  if (!auth.ok) return auth.response

  const rateLimitResponse = await enforceRateLimit(request, {
    bucket: "privacy-data-requests-read",
    limit: 60,
    windowMs: 60_000,
    keySuffix: auth.userId,
  })
  if (rateLimitResponse) return rateLimitResponse

  const requestedStatus = String(request.nextUrl.searchParams.get("status") || "all")
    .trim()
    .toLowerCase()
  const requestedScope = String(request.nextUrl.searchParams.get("scope") || "mine")
    .trim()
    .toLowerCase()
  const requestedLimit = Number(request.nextUrl.searchParams.get("limit") || 50)
  const limit = Number.isFinite(requestedLimit) ? Math.max(1, Math.min(300, Math.trunc(requestedLimit))) : 50

  const canReadAll = requestedScope === "all" && (await isSuperadmin(auth.userId, auth.supabase))
  if (requestedScope === "all" && !canReadAll) {
    return NextResponse.json({ success: false, error: "No autorizado para scope=all" }, { status: 403 })
  }

  let query = auth.supabase
    .from("privacy_data_requests")
    .select("id, user_id, request_type, status, request_payload, resolution_notes, resolved_by, resolved_at, created_at, updated_at")
    .order("created_at", { ascending: false })
    .limit(limit)

  if (!canReadAll) {
    query = query.eq("user_id", auth.userId)
  }

  if (requestedStatus !== "all" && REQUEST_STATUSES.includes(requestedStatus as (typeof REQUEST_STATUSES)[number])) {
    query = query.eq("status", requestedStatus)
  }

  const { data, error } = await query
  if (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }

  return NextResponse.json({
    success: true,
    scope: canReadAll ? "all" : "mine",
    requests: data || [],
  })
}

export async function POST(request: NextRequest) {
  const sameOriginResponse = enforceSameOrigin(request)
  if (sameOriginResponse) return sameOriginResponse

  const auth = await requireApiUser()
  if (!auth.ok) return auth.response

  const rateLimitResponse = await enforceRateLimit(request, {
    bucket: "privacy-data-requests-create",
    limit: 8,
    windowMs: 60 * 60 * 1000,
    keySuffix: auth.userId,
  })
  if (rateLimitResponse) return rateLimitResponse

  const body = (await request.json().catch(() => ({}))) as CreateDataRequestPayload
  const requestType = parseRequestType(body.request_type)
  if (!requestType) {
    return NextResponse.json({ success: false, error: "request_type inválido" }, { status: 400 })
  }

  const requestPayload = sanitizeRequestPayload(body.request_payload)

  const { data, error } = await auth.supabase
    .from("privacy_data_requests")
    .insert({
      user_id: auth.userId,
      request_type: requestType,
      request_payload: requestPayload,
      status: "pending",
    })
    .select("id, user_id, request_type, status, request_payload, created_at")
    .single()

  if (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }

  return NextResponse.json(
    {
      success: true,
      request: data,
      message: "Solicitud de privacidad registrada. Te notificaremos el estado.",
    },
    { status: 201 }
  )
}
