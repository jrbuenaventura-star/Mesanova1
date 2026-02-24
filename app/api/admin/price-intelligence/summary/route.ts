import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { getPriceIntelligenceSnapshot } from "@/lib/price-intelligence/service"

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

  return { ok: true as const }
}

export async function GET(request: Request) {
  try {
    const auth = await requireSuperadmin()
    if (!auth.ok) {
      return NextResponse.json({ error: auth.error }, { status: auth.status })
    }

    const url = new URL(request.url)
    const runId = url.searchParams.get("run_id")
    const runsLimit = Number(url.searchParams.get("runs_limit") || "")
    const findingsLimit = Number(url.searchParams.get("findings_limit") || "")

    const snapshot = await getPriceIntelligenceSnapshot({
      runId,
      runsLimit: Number.isFinite(runsLimit) && runsLimit > 0 ? runsLimit : undefined,
      findingsLimit: Number.isFinite(findingsLimit) && findingsLimit > 0 ? findingsLimit : undefined,
    })

    return NextResponse.json({ success: true, ...snapshot })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Error desconocido"
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}

