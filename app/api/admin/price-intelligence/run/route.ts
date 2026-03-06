import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { runPriceIntelligenceAnalysis } from "@/lib/price-intelligence/service"
import { createPriceIntelligenceAuditEvent } from "@/lib/price-intelligence/audit"
import { enforceRateLimit, enforceSameOrigin } from "@/lib/security/api"
import { redactErrorMessage } from "@/lib/security/redact"

export const maxDuration = 300

async function requireSuperadmin() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return { ok: false as const, status: 401, error: "No autenticado" }

  const { data: profile, error: profileError } = await supabase
    .from("user_profiles")
    .select("role")
    .eq("id", user.id)
    .single()

  if (profileError) return { ok: false as const, status: 500, error: profileError.message }
  if (profile?.role !== "superadmin") return { ok: false as const, status: 403, error: "No autorizado" }

  return { ok: true as const, userId: user.id, role: profile.role as string }
}

export async function POST(request: Request) {
  const sameOriginResponse = enforceSameOrigin(request)
  if (sameOriginResponse) return sameOriginResponse

  let actorUserId: string | null = null
  let actorRole: string | null = null

  try {
    const auth = await requireSuperadmin()
    if (!auth.ok) {
      return NextResponse.json({ error: auth.error }, { status: auth.status })
    }

    actorUserId = auth.userId
    actorRole = auth.role

    const rateLimitResponse = await enforceRateLimit(request, {
      bucket: "admin-price-intelligence-run",
      limit: 6,
      windowMs: 60 * 60 * 1000,
      keySuffix: auth.userId,
    })
    if (rateLimitResponse) return rateLimitResponse

    const body = (await request.json().catch(() => ({}))) as {
      dryRun?: boolean
      maxProducts?: number
      thresholdPercent?: number
      criticalThresholdPercent?: number
      notify?: boolean
    }

    const maxProductsRaw = Number(body.maxProducts)
    const thresholdRaw = Number(body.thresholdPercent)
    const criticalThresholdRaw = Number(body.criticalThresholdPercent)
    const maxProducts =
      Number.isFinite(maxProductsRaw) && maxProductsRaw > 0
        ? Math.max(1, Math.min(500, Math.trunc(maxProductsRaw)))
        : undefined
    const thresholdPercent =
      Number.isFinite(thresholdRaw) && thresholdRaw > 0 ? Math.max(1, Math.min(100, thresholdRaw)) : undefined
    const criticalThresholdPercent =
      Number.isFinite(criticalThresholdRaw) && criticalThresholdRaw > 0
        ? Math.max(1, Math.min(150, criticalThresholdRaw))
        : undefined

    await createPriceIntelligenceAuditEvent({
      eventType: "run_requested",
      actorUserId,
      actorRole,
      source: "admin-api",
      request,
      requestMeta: {
        dry_run: !!body.dryRun,
        max_products: maxProducts ?? null,
        threshold_percent: thresholdPercent ?? null,
        critical_threshold_percent: criticalThresholdPercent ?? null,
        notify: !!body.notify,
      },
    })

    const result = await runPriceIntelligenceAnalysis({
      triggerSource: "manual",
      requestedBy: auth.userId,
      dryRun: !!body.dryRun,
      maxProducts,
      thresholdPercent,
      criticalThresholdPercent,
      notify: !!body.notify,
    })

    await createPriceIntelligenceAuditEvent({
      eventType: "run_completed",
      actorUserId,
      actorRole,
      source: "admin-api",
      request,
      requestMeta: {
        run_id: result.runId,
        status: result.status,
        processed_products: result.processedProducts,
        findings_count: result.findingsCount,
        errors_count: result.errorsCount,
      },
    })

    return NextResponse.json({ success: true, run: result })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Error desconocido"
    await createPriceIntelligenceAuditEvent({
      eventType: "run_failed",
      actorUserId,
      actorRole,
      source: "admin-api",
      request,
      requestMeta: {
        error: redactErrorMessage(error),
      },
    })
    const status = /faltan tablas de inteligencia de precios/i.test(message) ? 503 : 500
    return NextResponse.json({ success: false, error: message }, { status })
  }
}
