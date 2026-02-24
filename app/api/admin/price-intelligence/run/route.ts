import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { runPriceIntelligenceAnalysis } from "@/lib/price-intelligence/service"

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

  return { ok: true as const, userId: user.id }
}

export async function POST(request: Request) {
  try {
    const auth = await requireSuperadmin()
    if (!auth.ok) {
      return NextResponse.json({ error: auth.error }, { status: auth.status })
    }

    const body = (await request.json().catch(() => ({}))) as {
      dryRun?: boolean
      maxProducts?: number
      thresholdPercent?: number
      criticalThresholdPercent?: number
      notify?: boolean
    }

    const result = await runPriceIntelligenceAnalysis({
      triggerSource: "manual",
      requestedBy: auth.userId,
      dryRun: !!body.dryRun,
      maxProducts: typeof body.maxProducts === "number" ? body.maxProducts : undefined,
      thresholdPercent: typeof body.thresholdPercent === "number" ? body.thresholdPercent : undefined,
      criticalThresholdPercent:
        typeof body.criticalThresholdPercent === "number" ? body.criticalThresholdPercent : undefined,
      notify: !!body.notify,
    })

    return NextResponse.json({ success: true, run: result })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Error desconocido"
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}
