import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { runPriceIntelligenceAnalysis } from "@/lib/price-intelligence/service"
import { createPriceIntelligenceAuditEvent } from "@/lib/price-intelligence/audit"
import { enforceRateLimit } from "@/lib/security/api"

export const maxDuration = 300

async function isAuthorizedRequest(request: NextRequest) {
  const cronSecret = process.env.CRON_SECRET
  const authHeader = request.headers.get("authorization")
  if (cronSecret && authHeader === `Bearer ${cronSecret}`) {
    return { authorized: true as const, userId: null as string | null, source: "cron-secret" }
  }

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return { authorized: false as const, userId: null as string | null, source: "none" }

  const { data: profile } = await supabase
    .from("user_profiles")
    .select("role")
    .eq("id", user.id)
    .single()

  if (profile?.role !== "superadmin") return { authorized: false as const, userId: null as string | null, source: "none" }
  return { authorized: true as const, userId: user.id, source: "session" }
}

export async function GET(request: NextRequest) {
  let actorUserId: string | null = null
  let source = "cron-unknown"

  try {
    const auth = await isAuthorizedRequest(request)
    if (!auth.authorized) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    const rateLimitResponse = await enforceRateLimit(request, {
      bucket: "cron-price-intelligence-run",
      limit: 20,
      windowMs: 60_000,
      keySuffix: auth.userId || auth.source,
    })
    if (rateLimitResponse) return rateLimitResponse

    actorUserId = auth.userId
    source = auth.source

    const dryRun = request.nextUrl.searchParams.get("dry_run") === "1"
    const maxProductsRaw = Number(request.nextUrl.searchParams.get("max_products") || "")
    const thresholdRaw = Number(request.nextUrl.searchParams.get("threshold_percent") || "")
    const criticalThresholdRaw = Number(request.nextUrl.searchParams.get("critical_threshold_percent") || "")
    const notify = request.nextUrl.searchParams.get("notify") !== "0"
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
      actorRole: auth.userId ? "superadmin" : "cron",
      source: auth.source,
      request,
      requestMeta: {
        dry_run: dryRun,
        max_products: maxProducts ?? null,
        threshold_percent: thresholdPercent ?? null,
        critical_threshold_percent: criticalThresholdPercent ?? null,
        notify,
      },
    })

    const result = await runPriceIntelligenceAnalysis({
      triggerSource: "cron",
      requestedBy: auth.userId,
      dryRun,
      maxProducts,
      thresholdPercent,
      criticalThresholdPercent,
      notify,
    })

    await createPriceIntelligenceAuditEvent({
      eventType: "run_completed",
      actorUserId,
      actorRole: auth.userId ? "superadmin" : "cron",
      source: auth.source,
      request,
      requestMeta: {
        run_id: result.runId,
        status: result.status,
        processed_products: result.processedProducts,
        findings_count: result.findingsCount,
        errors_count: result.errorsCount,
      },
    })

    return NextResponse.json({
      success: true,
      authorizedBy: auth.source,
      run: result,
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Error desconocido"
    await createPriceIntelligenceAuditEvent({
      eventType: "run_failed",
      actorUserId,
      actorRole: actorUserId ? "superadmin" : "cron",
      source,
      request,
      requestMeta: {
        error: message,
      },
    })
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}
