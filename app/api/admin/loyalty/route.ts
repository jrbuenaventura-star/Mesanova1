import { NextResponse } from "next/server"

import { requireApiUser } from "@/lib/security/auth"
import { createAdminClient } from "@/lib/supabase/admin"

type LoyaltyConfigPatch = {
  points_per_dollar?: unknown
  points_for_review?: unknown
  points_for_referral?: unknown
  silver_threshold?: unknown
  gold_threshold?: unknown
  platinum_threshold?: unknown
  points_per_dollar_redemption?: unknown
  min_redemption_points?: unknown
  points_expire_months?: unknown
}

type LoyaltyAdjustmentPayload = {
  user_id?: unknown
  points?: unknown
  description?: unknown
}

function toSafeNumber(value: unknown) {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : null
}

function parsePositiveNumber(name: string, value: unknown) {
  const parsed = toSafeNumber(value)
  if (parsed === null || parsed <= 0) {
    throw new Error(`${name} debe ser mayor a 0`)
  }
  return parsed
}

function parseInteger(name: string, value: unknown) {
  const parsed = Number(value)
  if (!Number.isInteger(parsed)) {
    throw new Error(`${name} debe ser un número entero`)
  }
  return parsed
}

async function ensureSuperadmin() {
  const auth = await requireApiUser({ roles: ["superadmin"] })
  if (!auth.ok) return { ok: false as const, response: auth.response }
  return {
    ok: true as const,
    userId: auth.userId,
  }
}

export async function GET(request: Request) {
  const guard = await ensureSuperadmin()
  if (!guard.ok) return guard.response

  const admin = createAdminClient()
  const { searchParams } = new URL(request.url)
  const search = String(searchParams.get("search") || "").trim()
  const requestedLimit = Number(searchParams.get("limit") || 50)
  const limit = Number.isFinite(requestedLimit)
    ? Math.max(1, Math.min(200, Math.trunc(requestedLimit)))
    : 50

  const { data: configRow, error: configError } = await admin
    .from("loyalty_config")
    .select("*")
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle()

  if (configError) {
    return NextResponse.json({ error: configError.message }, { status: 500 })
  }

  if (search) {
    const { data: matchingProfiles, error: profilesError } = await admin
      .from("user_profiles")
      .select("id, full_name, role")
      .or(`full_name.ilike.%${search}%,id.ilike.%${search}%`)
      .order("full_name", { ascending: true })
      .limit(limit)

    if (profilesError) {
      return NextResponse.json({ error: profilesError.message }, { status: 500 })
    }

    const profileRows = matchingProfiles || []
    const ids = profileRows.map((profile) => profile.id)

    const { data: pointsRows, error: pointsError } = ids.length
      ? await admin
          .from("loyalty_points")
          .select("user_id, total_points, available_points, pending_points, redeemed_points, tier, updated_at")
          .in("user_id", ids)
      : { data: [], error: null as null }

    if (pointsError) {
      return NextResponse.json({ error: pointsError.message }, { status: 500 })
    }

    const pointsMap = new Map((pointsRows || []).map((row) => [row.user_id, row]))

    const users = profileRows.map((profile) => {
      const points = pointsMap.get(profile.id)
      return {
        user_id: profile.id,
        full_name: profile.full_name,
        role: profile.role,
        total_points: points?.total_points || 0,
        available_points: points?.available_points || 0,
        pending_points: points?.pending_points || 0,
        redeemed_points: points?.redeemed_points || 0,
        tier: points?.tier || "bronze",
        updated_at: points?.updated_at || null,
      }
    })

    return NextResponse.json({ success: true, config: configRow, users })
  }

  const { data: pointsRows, error: pointsError } = await admin
    .from("loyalty_points")
    .select("user_id, total_points, available_points, pending_points, redeemed_points, tier, updated_at")
    .order("total_points", { ascending: false })
    .limit(limit)

  if (pointsError) {
    return NextResponse.json({ error: pointsError.message }, { status: 500 })
  }

  const userIds = (pointsRows || []).map((row) => row.user_id)
  const { data: profileRows, error: profileError } = userIds.length
    ? await admin.from("user_profiles").select("id, full_name, role").in("id", userIds)
    : { data: [], error: null as null }

  if (profileError) {
    return NextResponse.json({ error: profileError.message }, { status: 500 })
  }

  const profileMap = new Map((profileRows || []).map((row) => [row.id, row]))
  const users = (pointsRows || []).map((row) => {
    const profile = profileMap.get(row.user_id)
    return {
      user_id: row.user_id,
      full_name: profile?.full_name || null,
      role: profile?.role || null,
      total_points: row.total_points || 0,
      available_points: row.available_points || 0,
      pending_points: row.pending_points || 0,
      redeemed_points: row.redeemed_points || 0,
      tier: row.tier || "bronze",
      updated_at: row.updated_at,
    }
  })

  return NextResponse.json({ success: true, config: configRow, users })
}

export async function POST(request: Request) {
  const auth = await ensureSuperadmin()
  if (!auth.ok) return auth.response

  try {
    const body = (await request.json()) as LoyaltyAdjustmentPayload
    const userId = String(body.user_id || "").trim()
    const points = parseInteger("points", body.points)
    const description = String(body.description || "").trim()

    if (!userId) {
      return NextResponse.json({ error: "user_id es obligatorio" }, { status: 400 })
    }

    if (points === 0) {
      return NextResponse.json({ error: "El ajuste no puede ser 0" }, { status: 400 })
    }

    const admin = createAdminClient()

    const { data: profile, error: profileError } = await admin
      .from("user_profiles")
      .select("id")
      .eq("id", userId)
      .maybeSingle()

    if (profileError) {
      return NextResponse.json({ error: profileError.message }, { status: 500 })
    }

    if (!profile) {
      return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 })
    }

    const { data: currentPoints, error: currentPointsError } = await admin
      .from("loyalty_points")
      .select("available_points")
      .eq("user_id", userId)
      .maybeSingle()

    if (currentPointsError) {
      return NextResponse.json({ error: currentPointsError.message }, { status: 500 })
    }

    const availablePoints = Number(currentPoints?.available_points || 0)
    if (points < 0 && availablePoints + points < 0) {
      return NextResponse.json(
        { error: "El ajuste dejaría el saldo disponible en negativo" },
        { status: 400 }
      )
    }

    const { error: insertError } = await admin.from("loyalty_transactions").insert({
      user_id: userId,
      transaction_type: "adjustment",
      points,
      description: description || "Ajuste manual por superadmin",
      admin_user_id: auth.userId,
      metadata: {
        source: "admin-points-dashboard",
        created_by: auth.userId,
      },
    })

    if (insertError) {
      return NextResponse.json({ error: insertError.message }, { status: 500 })
    }

    const { data: updatedPoints, error: updatedPointsError } = await admin
      .from("loyalty_points")
      .select("*")
      .eq("user_id", userId)
      .maybeSingle()

    if (updatedPointsError) {
      return NextResponse.json({ error: updatedPointsError.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, points: updatedPoints })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "No se pudo aplicar el ajuste" },
      { status: 400 }
    )
  }
}

export async function PATCH(request: Request) {
  const guard = await ensureSuperadmin()
  if (!guard.ok) return guard.response

  try {
    const body = (await request.json()) as LoyaltyConfigPatch

    const payload = {
      points_per_dollar: parsePositiveNumber("points_per_dollar", body.points_per_dollar),
      points_for_review: parseInteger("points_for_review", body.points_for_review),
      points_for_referral: parseInteger("points_for_referral", body.points_for_referral),
      silver_threshold: parseInteger("silver_threshold", body.silver_threshold),
      gold_threshold: parseInteger("gold_threshold", body.gold_threshold),
      platinum_threshold: parseInteger("platinum_threshold", body.platinum_threshold),
      points_per_dollar_redemption: parseInteger(
        "points_per_dollar_redemption",
        body.points_per_dollar_redemption
      ),
      min_redemption_points: parseInteger("min_redemption_points", body.min_redemption_points),
      points_expire_months: parseInteger("points_expire_months", body.points_expire_months),
      updated_at: new Date().toISOString(),
    }

    if (!(payload.silver_threshold < payload.gold_threshold && payload.gold_threshold < payload.platinum_threshold)) {
      return NextResponse.json(
        { error: "Los umbrales deben cumplir: silver < gold < platinum" },
        { status: 400 }
      )
    }

    const admin = createAdminClient()
    const { data: currentConfig, error: currentConfigError } = await admin
      .from("loyalty_config")
      .select("id")
      .order("updated_at", { ascending: false })
      .limit(1)
      .maybeSingle()

    if (currentConfigError) {
      return NextResponse.json({ error: currentConfigError.message }, { status: 500 })
    }

    if (currentConfig?.id) {
      const { data, error } = await admin
        .from("loyalty_config")
        .update(payload)
        .eq("id", currentConfig.id)
        .select("*")
        .single()

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 })
      }

      return NextResponse.json({ success: true, config: data })
    }

    const { data, error } = await admin
      .from("loyalty_config")
      .insert(payload)
      .select("*")
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, config: data })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "No se pudo actualizar la configuración" },
      { status: 400 }
    )
  }
}
