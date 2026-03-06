import { NextRequest, NextResponse } from "next/server"

import type { PrivacyConsentSource } from "@/lib/privacy/consent"
import { enforceRateLimit, enforceSameOrigin, hashStableValue } from "@/lib/security/api"
import { createAdminClient } from "@/lib/supabase/admin"
import { createClient } from "@/lib/supabase/server"

type ConsentPayload = {
  analytics?: unknown
  marketing?: unknown
  source?: unknown
  version?: unknown
  updated_at?: unknown
}

function normalizeSource(value: unknown): PrivacyConsentSource {
  const normalized = String(value || "")
    .trim()
    .toLowerCase()
  if (normalized === "settings" || normalized === "migration") return normalized
  return "banner"
}

function isTableMissingError(error: unknown) {
  const code = String((error as { code?: unknown } | null)?.code || "").toUpperCase()
  const message = String((error as { message?: unknown } | null)?.message || "")
  const details = String((error as { details?: unknown } | null)?.details || "")
  return (
    code === "42P01" ||
    code === "PGRST205" ||
    /does not exist|relation .* does not exist|could not find the table .* in the schema cache/i.test(
      `${message} ${details}`
    )
  )
}

function getClientIp(request: Request) {
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    request.headers.get("cf-connecting-ip") ||
    "unknown"
  )
}

export async function POST(request: NextRequest) {
  try {
    const sameOriginResponse = enforceSameOrigin(request)
    if (sameOriginResponse) return sameOriginResponse

    const rateLimitResponse = await enforceRateLimit(request, {
      bucket: "privacy-consent",
      limit: 50,
      windowMs: 60_000,
    })
    if (rateLimitResponse) return rateLimitResponse

    const body = (await request.json().catch(() => ({}))) as ConsentPayload
    const analytics = body.analytics
    const marketing = body.marketing

    if (typeof analytics !== "boolean" || typeof marketing !== "boolean") {
      return NextResponse.json(
        { success: false, error: "Parámetros de consentimiento inválidos" },
        { status: 400 }
      )
    }

    const source = normalizeSource(body.source)
    const version = Number(body.version)
    const safeVersion = Number.isFinite(version) && version > 0 ? Math.trunc(version) : 1

    const parsedUpdatedAt =
      typeof body.updated_at === "string" && Number.isFinite(Date.parse(body.updated_at))
        ? new Date(body.updated_at)
        : new Date()

    let userId: string | null = null
    try {
      const supabase = await createClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()
      userId = user?.id || null
    } catch {
      userId = null
    }

    const admin = createAdminClient()
    const { error } = await admin.from("privacy_consent_events").insert({
      user_id: userId,
      consent_analytics: analytics,
      consent_marketing: marketing,
      source,
      version: safeVersion,
      ip_hash: hashStableValue(getClientIp(request)),
      user_agent: request.headers.get("user-agent")?.slice(0, 512) || null,
      created_at: parsedUpdatedAt.toISOString(),
    })

    if (error) {
      if (isTableMissingError(error)) {
        return NextResponse.json(
          {
            success: true,
            recorded: false,
            warning: "privacy_consent_events_table_missing",
          },
          { status: 202 }
        )
      }

      return NextResponse.json({ success: false, error: "No se pudo registrar consentimiento" }, { status: 500 })
    }

    return NextResponse.json({ success: true, recorded: true })
  } catch {
    return NextResponse.json({ success: false, error: "Error inesperado" }, { status: 500 })
  }
}
