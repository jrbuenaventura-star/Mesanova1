import { NextResponse } from "next/server"

import { requireApiUser } from "@/lib/security/auth"
import { createAdminClient } from "@/lib/supabase/admin"

function escapeCsv(value: unknown) {
  const text = String(value ?? "")
  if (text.includes(",") || text.includes('"') || text.includes("\n")) {
    return `"${text.replace(/"/g, '""')}"`
  }
  return text
}

function normalizeDateStart(value: string) {
  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) return null
  parsed.setHours(0, 0, 0, 0)
  return parsed.toISOString()
}

function normalizeDateEnd(value: string) {
  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) return null
  parsed.setHours(23, 59, 59, 999)
  return parsed.toISOString()
}

export async function GET(request: Request) {
  const auth = await requireApiUser({ roles: ["superadmin"] })
  if (!auth.ok) return auth.response

  const admin = createAdminClient()
  const { searchParams } = new URL(request.url)
  const search = String(searchParams.get("search") || "").trim()
  const userIdFilter = String(searchParams.get("user_id") || "").trim()
  const type = String(searchParams.get("type") || "all").trim().toLowerCase()
  const from = String(searchParams.get("from") || "").trim()
  const to = String(searchParams.get("to") || "").trim()
  const format = String(searchParams.get("format") || "json").trim().toLowerCase()
  const requestedLimit = Number(searchParams.get("limit") || 200)
  const limit = Number.isFinite(requestedLimit)
    ? Math.max(1, Math.min(2000, Math.trunc(requestedLimit)))
    : 200

  let searchUserIds: string[] | null = null

  if (search) {
    const { data: profiles, error: profilesError } = await admin
      .from("user_profiles")
      .select("id")
      .or(`full_name.ilike.%${search}%,id.ilike.%${search}%`)
      .limit(500)

    if (profilesError) {
      return NextResponse.json({ success: false, error: profilesError.message }, { status: 500 })
    }

    searchUserIds = (profiles || []).map((profile) => profile.id)
    if (searchUserIds.length === 0) {
      if (format === "csv") {
        const csv = "id,created_at,transaction_type,points,user_id,user_name,admin_user_id,admin_name,description\n"
        return new NextResponse(csv, {
          headers: {
            "Content-Type": "text/csv; charset=utf-8",
            "Content-Disposition": `attachment; filename=\"loyalty_transactions_${new Date().toISOString().slice(0, 10)}.csv\"`,
          },
        })
      }
      return NextResponse.json({ success: true, transactions: [] })
    }
  }

  let query = admin
    .from("loyalty_transactions")
    .select("id, user_id, admin_user_id, transaction_type, points, description, metadata, created_at")
    .order("created_at", { ascending: false })
    .limit(limit)

  if (type && type !== "all") {
    query = query.eq("transaction_type", type)
  }

  if (userIdFilter) {
    query = query.eq("user_id", userIdFilter)
  }

  if (searchUserIds) {
    query = query.in("user_id", searchUserIds)
  }

  if (from) {
    const fromDate = normalizeDateStart(from)
    if (!fromDate) {
      return NextResponse.json({ success: false, error: "Fecha inicial inválida" }, { status: 400 })
    }
    query = query.gte("created_at", fromDate)
  }

  if (to) {
    const toDate = normalizeDateEnd(to)
    if (!toDate) {
      return NextResponse.json({ success: false, error: "Fecha final inválida" }, { status: 400 })
    }
    query = query.lte("created_at", toDate)
  }

  const { data: txRows, error: txError } = await query

  if (txError) {
    return NextResponse.json({ success: false, error: txError.message }, { status: 500 })
  }

  const transactions = txRows || []
  const profileIds = Array.from(
    new Set(
      transactions
        .flatMap((row) => [row.user_id, row.admin_user_id])
        .filter((value): value is string => typeof value === "string" && value.length > 0)
    )
  )

  const { data: profiles, error: profileError } = profileIds.length
    ? await admin.from("user_profiles").select("id, full_name").in("id", profileIds)
    : { data: [], error: null as null }

  if (profileError) {
    return NextResponse.json({ success: false, error: profileError.message }, { status: 500 })
  }

  const profileMap = new Map((profiles || []).map((profile) => [profile.id, profile]))

  const hydrated = transactions.map((tx) => ({
    ...tx,
    user_name: profileMap.get(tx.user_id)?.full_name || null,
    admin_name: tx.admin_user_id ? profileMap.get(tx.admin_user_id)?.full_name || null : null,
  }))

  if (format === "csv") {
    const headers = [
      "id",
      "created_at",
      "transaction_type",
      "points",
      "user_id",
      "user_name",
      "admin_user_id",
      "admin_name",
      "description",
    ]

    const csvRows = [
      headers.join(","),
      ...hydrated.map((tx) =>
        [
          tx.id,
          tx.created_at,
          tx.transaction_type,
          tx.points,
          tx.user_id,
          tx.user_name || "",
          tx.admin_user_id || "",
          tx.admin_name || "",
          tx.description || "",
        ]
          .map((value) => escapeCsv(value))
          .join(",")
      ),
    ]

    return new NextResponse(csvRows.join("\n"), {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename=\"loyalty_transactions_${new Date().toISOString().slice(0, 10)}.csv\"`,
      },
    })
  }

  return NextResponse.json({ success: true, transactions: hydrated })
}
