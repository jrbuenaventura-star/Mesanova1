import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { updatePriceIntelligenceFindingReview } from "@/lib/price-intelligence/service"
import type { PriceIntelligenceReviewStatus } from "@/lib/price-intelligence/types"
import { createPriceIntelligenceAuditEvent } from "@/lib/price-intelligence/audit"
import { enforceRateLimit, enforceSameOrigin } from "@/lib/security/api"

const ALLOWED_REVIEW_STATUS: PriceIntelligenceReviewStatus[] = ["pendiente", "en_revision", "ajustado", "descartado"]

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

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const sameOriginResponse = enforceSameOrigin(request)
  if (sameOriginResponse) return sameOriginResponse

  try {
    const auth = await requireSuperadmin()
    if (!auth.ok) {
      return NextResponse.json({ success: false, error: auth.error }, { status: auth.status })
    }

    const rateLimitResponse = await enforceRateLimit(request, {
      bucket: "admin-price-intelligence-review",
      limit: 120,
      windowMs: 60_000,
      keySuffix: auth.userId,
    })
    if (rateLimitResponse) return rateLimitResponse

    const { id } = await params
    const body = (await request.json().catch(() => ({}))) as {
      reviewStatus?: string
      reviewNotes?: string
    }

    if (!body.reviewStatus || !ALLOWED_REVIEW_STATUS.includes(body.reviewStatus as PriceIntelligenceReviewStatus)) {
      return NextResponse.json({ success: false, error: "Estado de revisión inválido" }, { status: 400 })
    }

    const updated = await updatePriceIntelligenceFindingReview({
      findingId: id,
      reviewStatus: body.reviewStatus as PriceIntelligenceReviewStatus,
      reviewNotes: body.reviewNotes?.slice(0, 1500) || null,
      reviewerId: auth.userId,
    })

    await createPriceIntelligenceAuditEvent({
      eventType: "finding_reviewed",
      actorUserId: auth.userId,
      actorRole: auth.role,
      source: "admin-api",
      request,
      requestMeta: {
        finding_id: id,
        review_status: body.reviewStatus,
      },
    })

    return NextResponse.json({ success: true, finding: updated })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Error desconocido"
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}
