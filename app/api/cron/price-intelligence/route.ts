import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { runPriceIntelligenceAnalysis } from "@/lib/price-intelligence/service"

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
  try {
    const auth = await isAuthorizedRequest(request)
    if (!auth.authorized) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    const dryRun = request.nextUrl.searchParams.get("dry_run") === "1"
    const maxProductsRaw = Number(request.nextUrl.searchParams.get("max_products") || "")
    const thresholdRaw = Number(request.nextUrl.searchParams.get("threshold_percent") || "")
    const criticalThresholdRaw = Number(request.nextUrl.searchParams.get("critical_threshold_percent") || "")
    const notify = request.nextUrl.searchParams.get("notify") !== "0"

    const result = await runPriceIntelligenceAnalysis({
      triggerSource: "cron",
      requestedBy: auth.userId,
      dryRun,
      maxProducts: Number.isFinite(maxProductsRaw) && maxProductsRaw > 0 ? maxProductsRaw : undefined,
      thresholdPercent: Number.isFinite(thresholdRaw) && thresholdRaw > 0 ? thresholdRaw : undefined,
      criticalThresholdPercent:
        Number.isFinite(criticalThresholdRaw) && criticalThresholdRaw > 0 ? criticalThresholdRaw : undefined,
      notify,
    })

    return NextResponse.json({
      success: true,
      authorizedBy: auth.source,
      run: result,
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Error desconocido"
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}
