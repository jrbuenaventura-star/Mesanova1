import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { syncClientToClientify } from "@/lib/clientify/sync"

export async function POST(request: Request) {
  try {
    const supabase = await createClient()

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    const { data: profile } = await supabase
      .from("user_profiles")
      .select("role")
      .eq("id", user.id)
      .single()

    if (profile?.role !== "superadmin") {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 })
    }

    const body = await request.json()
    const { distributorIds } = body as { distributorIds?: string[] }

    const admin = createAdminClient()

    // Build query for distributors
    let query = admin
      .from("distributors")
      .select("id, user_id, company_name, business_type, aliado_id, main_city, main_state, contact_email")

    if (distributorIds?.length) {
      query = query.in("id", distributorIds)
    }

    const { data: distributors, error: distError } = await query

    if (distError) {
      return NextResponse.json({ error: distError.message }, { status: 500 })
    }

    if (!distributors?.length) {
      return NextResponse.json({ synced: 0, errors: 0, results: [] })
    }

    // Get user profiles for emails
    const userIds = distributors.map((d) => d.user_id).filter(Boolean)
    const { data: profiles } = userIds.length
      ? await admin.from("user_profiles").select("id, full_name, phone").in("id", userIds)
      : { data: [] }

    const profileMap = new Map<string, any>()
    for (const p of profiles || []) {
      profileMap.set(p.id, p)
    }

    // Get aliado names
    const aliadoIds = distributors
      .map((d) => d.aliado_id)
      .filter((v): v is string => typeof v === "string" && v.length > 0)

    const { data: aliados } = aliadoIds.length
      ? await admin.from("aliados").select("id, company_name").in("id", aliadoIds)
      : { data: [] }

    const aliadoMap = new Map<string, string>()
    for (const a of aliados || []) {
      aliadoMap.set(a.id, a.company_name)
    }

    // Get auth users for emails
    const { data: authUsers } = await admin.auth.admin.listUsers()
    const emailMap = new Map<string, string>()
    for (const u of authUsers?.users || []) {
      if (u.email) emailMap.set(u.id, u.email)
    }

    // Get orders for stats
    const distIds = distributors.map((d) => d.id)
    const { data: orders } = await admin
      .from("orders")
      .select("distributor_id, user_id, total, created_at, status")
      .in("status", ["entregada", "enviada", "en_preparacion", "aprobada"])

    const ordersByDist = new Map<string, any[]>()
    for (const o of orders || []) {
      const key = o.distributor_id || o.user_id
      if (!key) continue
      if (!ordersByDist.has(key)) ordersByDist.set(key, [])
      ordersByDist.get(key)!.push(o)
    }

    const now = new Date()
    const oneYearAgo = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000)

    // Sync each client
    const results: Array<{ company: string; action: string; error?: string }> = []
    let synced = 0
    let errors = 0

    for (const dist of distributors) {
      const prof = profileMap.get(dist.user_id)
      const email = dist.contact_email || emailMap.get(dist.user_id)

      if (!email) {
        results.push({ company: dist.company_name, action: "skipped", error: "Sin email" })
        errors++
        continue
      }

      const distOrders = ordersByDist.get(dist.id) || ordersByDist.get(dist.user_id) || []
      const totalSpent = distOrders.reduce((s: number, o: any) => s + (parseFloat(o.total) || 0), 0)
      const orderCount = distOrders.length
      const avgOrderValue = orderCount > 0 ? totalSpent / orderCount : 0
      const orderDates = distOrders.map((o: any) => new Date(o.created_at).getTime())
      const lastOrderTs = orderDates.length > 0 ? Math.max(...orderDates) : null
      const recencyDays = lastOrderTs ? Math.floor((now.getTime() - lastOrderTs) / (1000 * 60 * 60 * 24)) : null
      const ordersLastYear = distOrders.filter((o: any) => new Date(o.created_at) >= oneYearAgo).length

      let segment = "Nuevo"
      if (orderCount === 0) segment = "Nuevo"
      else if (recencyDays !== null && recencyDays <= 30 && ordersLastYear >= 4) segment = "VIP"
      else if (recencyDays !== null && recencyDays <= 60 && ordersLastYear >= 2) segment = "Leal"
      else if (recencyDays !== null && recencyDays <= 90) segment = "Regular"
      else if (recencyDays !== null && recencyDays <= 180) segment = "En riesgo"
      else if (orderCount > 0) segment = "Dormido"

      const result = await syncClientToClientify({
        email,
        fullName: prof?.full_name || undefined,
        phone: prof?.phone || undefined,
        companyName: dist.company_name,
        businessType: dist.business_type || undefined,
        city: dist.main_city || undefined,
        state: dist.main_state || undefined,
        aliadoName: dist.aliado_id ? aliadoMap.get(dist.aliado_id) : undefined,
        segment,
        totalSpent,
        orderCount,
        avgOrderValue,
        lastPurchaseDate: lastOrderTs ? new Date(lastOrderTs).toISOString().slice(0, 10) : undefined,
        isDistributor: !!dist.aliado_id,
      })

      results.push({
        company: dist.company_name,
        action: result.action,
        error: result.error,
      })

      if (result.success) synced++
      else errors++
    }

    return NextResponse.json({ synced, errors, total: distributors.length, results })
  } catch (error) {
    console.error("Error syncing to Clientify:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Error en sincronización" },
      { status: 500 }
    )
  }
}
