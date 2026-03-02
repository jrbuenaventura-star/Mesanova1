import { NextRequest, NextResponse } from "next/server"

import { dispatchPendingWishlistPriceChangeWhatsApp } from "@/lib/notifications/price-change-whatsapp"
import { createClient } from "@/lib/supabase/server"

export const maxDuration = 300

async function isAuthorizedRequest(request: NextRequest) {
  const cronSecret = process.env.CRON_SECRET
  const authHeader = request.headers.get("authorization")
  if (cronSecret && authHeader === `Bearer ${cronSecret}`) {
    return { authorized: true as const, source: "cron-secret" as const }
  }

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return { authorized: false as const, source: "none" as const }

  const { data: profile } = await supabase
    .from("user_profiles")
    .select("role")
    .eq("id", user.id)
    .single()

  if (profile?.role !== "superadmin") return { authorized: false as const, source: "none" as const }
  return { authorized: true as const, source: "session" as const }
}

export async function GET(request: NextRequest) {
  try {
    const auth = await isAuthorizedRequest(request)
    if (!auth.authorized) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    const limitRaw = Number(request.nextUrl.searchParams.get("limit") || "")
    const sinceMinutesRaw = Number(request.nextUrl.searchParams.get("since_minutes") || "")
    const productId = (request.nextUrl.searchParams.get("product_id") || "").trim() || undefined

    const limit = Number.isFinite(limitRaw) && limitRaw > 0 ? limitRaw : 300
    const sinceMinutes = Number.isFinite(sinceMinutesRaw) && sinceMinutesRaw > 0 ? sinceMinutesRaw : undefined
    const createdSince =
      sinceMinutes !== undefined ? new Date(Date.now() - sinceMinutes * 60 * 1000).toISOString() : undefined

    const result = await dispatchPendingWishlistPriceChangeWhatsApp({
      productId,
      limit,
      createdSince,
    })

    return NextResponse.json({
      success: true,
      authorizedBy: auth.source,
      dispatch: result,
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Error desconocido"
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}
