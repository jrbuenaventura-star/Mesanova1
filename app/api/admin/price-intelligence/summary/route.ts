import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { getPriceIntelligenceSnapshot } from "@/lib/price-intelligence/service"
import { createPriceIntelligenceAuditEvent } from "@/lib/price-intelligence/audit"
import { enforceRateLimit, enforceSameOrigin } from "@/lib/security/api"

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

export async function GET(request: Request) {
  const sameOriginResponse = enforceSameOrigin(request)
  if (sameOriginResponse) return sameOriginResponse

  try {
    const auth = await requireSuperadmin()
    if (!auth.ok) {
      return NextResponse.json({ error: auth.error }, { status: auth.status })
    }

    const rateLimitResponse = await enforceRateLimit(request, {
      bucket: "admin-price-intelligence-summary",
      limit: 240,
      windowMs: 60_000,
      keySuffix: auth.userId,
    })
    if (rateLimitResponse) return rateLimitResponse

    const url = new URL(request.url)
    const runId = url.searchParams.get("run_id")
    const runsLimit = Number(url.searchParams.get("runs_limit") || "")
    const findingsLimit = Number(url.searchParams.get("findings_limit") || "")
    const safeRunsLimit = Number.isFinite(runsLimit) && runsLimit > 0 ? Math.max(1, Math.min(120, runsLimit)) : undefined
    const safeFindingsLimit =
      Number.isFinite(findingsLimit) && findingsLimit > 0 ? Math.max(1, Math.min(1000, findingsLimit)) : undefined

    const snapshot = await getPriceIntelligenceSnapshot({
      runId,
      runsLimit: safeRunsLimit,
      findingsLimit: safeFindingsLimit,
    })

    await createPriceIntelligenceAuditEvent({
      eventType: "summary_viewed",
      actorUserId: auth.userId,
      actorRole: auth.role,
      source: "admin-api",
      request,
      requestMeta: {
        selected_run_id: snapshot.selectedRunId,
        run_id_filter: runId || null,
        runs_limit: safeRunsLimit ?? null,
        findings_limit: safeFindingsLimit ?? null,
        findings_returned: snapshot.findings.length,
      },
    })

    return NextResponse.json({ success: true, ...snapshot })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Error desconocido"
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}
