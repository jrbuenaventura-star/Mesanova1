import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function GET() {
  try {
    const supabase = await createClient()

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const { data: profile } = await supabase
      .from('user_profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profile?.role !== 'superadmin') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
    }

    const admin = createAdminClient()

    // Get all distributors with profiles and aliados
    const { data: distributors, error: distError } = await admin
      .from('distributors')
      .select('id, user_id, company_name, business_type, aliado_id, main_city, main_state, is_active')
      .order('company_name')

    if (distError) {
      return NextResponse.json({ error: distError.message }, { status: 500 })
    }

    // Get all completed orders (entregada) for stats calculation
    const { data: orders, error: ordersError } = await admin
      .from('orders')
      .select('id, distributor_id, user_id, total, items, created_at, status')
      .in('status', ['entregada', 'enviada', 'en_preparacion', 'aprobada'])

    if (ordersError) {
      return NextResponse.json({ error: ordersError.message }, { status: 500 })
    }

    // Get aliados
    const aliadoIds = (distributors || [])
      .map((d) => d.aliado_id)
      .filter((v): v is string => typeof v === 'string' && v.length > 0)

    const { data: aliados } = aliadoIds.length
      ? await admin.from('aliados').select('id, company_name').in('id', aliadoIds)
      : { data: [] }

    const aliadoMap = new Map<string, string>()
    for (const a of aliados || []) {
      aliadoMap.set(a.id, a.company_name)
    }

    // Build order stats per distributor
    const now = new Date()
    const oneYearAgo = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000)

    const ordersByDistributor = new Map<string, any[]>()
    for (const order of orders || []) {
      const key = order.distributor_id || order.user_id
      if (!key) continue
      if (!ordersByDistributor.has(key)) {
        ordersByDistributor.set(key, [])
      }
      ordersByDistributor.get(key)!.push(order)
    }

    // Calculate stats for each distributor
    const clientStats = (distributors || []).map((dist) => {
      const distOrders = ordersByDistributor.get(dist.id) || ordersByDistributor.get(dist.user_id) || []
      const completedOrders = distOrders.filter((o) => o.status === 'entregada')
      const allValidOrders = distOrders

      const totalSpent = allValidOrders.reduce((sum: number, o: any) => sum + (parseFloat(o.total) || 0), 0)
      const orderCount = allValidOrders.length
      const avgOrderValue = orderCount > 0 ? totalSpent / orderCount : 0

      // Recency: days since last order
      const orderDates = allValidOrders.map((o: any) => new Date(o.created_at).getTime())
      const lastOrderDate = orderDates.length > 0 ? Math.max(...orderDates) : null
      const recencyDays = lastOrderDate ? Math.floor((now.getTime() - lastOrderDate) / (1000 * 60 * 60 * 24)) : null

      // Frequency: orders in last year
      const ordersLastYear = allValidOrders.filter(
        (o: any) => new Date(o.created_at) >= oneYearAgo
      ).length

      // RFM Segment
      let segment = 'Nuevo'
      if (orderCount === 0) {
        segment = 'Nuevo'
      } else if (recencyDays !== null && recencyDays <= 30 && ordersLastYear >= 4) {
        segment = 'VIP'
      } else if (recencyDays !== null && recencyDays <= 60 && ordersLastYear >= 2) {
        segment = 'Leal'
      } else if (recencyDays !== null && recencyDays <= 90) {
        segment = 'Regular'
      } else if (recencyDays !== null && recencyDays <= 180) {
        segment = 'En riesgo'
      } else if (orderCount > 0) {
        segment = 'Dormido'
      }

      return {
        distributorId: dist.id,
        userId: dist.user_id,
        companyName: dist.company_name,
        businessType: dist.business_type,
        aliadoId: dist.aliado_id,
        aliadoName: dist.aliado_id ? aliadoMap.get(dist.aliado_id) || null : null,
        city: dist.main_city,
        state: dist.main_state,
        isActive: dist.is_active,
        totalSpent,
        orderCount,
        avgOrderValue,
        recencyDays,
        ordersLastYear,
        lastOrderDate: lastOrderDate ? new Date(lastOrderDate).toISOString() : null,
        segment,
      }
    })

    // Global KPIs
    const totalClients = clientStats.length
    const activeClients = clientStats.filter((c) => c.orderCount > 0 && c.recencyDays !== null && c.recencyDays <= 90).length
    const totalRevenue = clientStats.reduce((sum, c) => sum + c.totalSpent, 0)
    const avgTicket = clientStats.filter((c) => c.orderCount > 0).length > 0
      ? totalRevenue / clientStats.reduce((sum, c) => sum + c.orderCount, 0)
      : 0

    // Stats by aliado
    const byAliado: Record<string, { name: string; clients: number; revenue: number; orders: number }> = {}
    for (const c of clientStats) {
      const key = c.aliadoId || '__direct'
      if (!byAliado[key]) {
        byAliado[key] = {
          name: c.aliadoName || 'Cliente directo',
          clients: 0,
          revenue: 0,
          orders: 0,
        }
      }
      byAliado[key].clients++
      byAliado[key].revenue += c.totalSpent
      byAliado[key].orders += c.orderCount
    }

    // Stats by city
    const byCity: Record<string, { clients: number; revenue: number; orders: number }> = {}
    for (const c of clientStats) {
      const key = c.city || 'Sin ciudad'
      if (!byCity[key]) {
        byCity[key] = { clients: 0, revenue: 0, orders: 0 }
      }
      byCity[key].clients++
      byCity[key].revenue += c.totalSpent
      byCity[key].orders += c.orderCount
    }

    // Stats by business type
    const byBusinessType: Record<string, { clients: number; revenue: number; orders: number }> = {}
    for (const c of clientStats) {
      const key = c.businessType || 'Sin tipo'
      if (!byBusinessType[key]) {
        byBusinessType[key] = { clients: 0, revenue: 0, orders: 0 }
      }
      byBusinessType[key].clients++
      byBusinessType[key].revenue += c.totalSpent
      byBusinessType[key].orders += c.orderCount
    }

    // Stats by segment
    const bySegment: Record<string, number> = {}
    for (const c of clientStats) {
      bySegment[c.segment] = (bySegment[c.segment] || 0) + 1
    }

    return NextResponse.json({
      kpis: {
        totalClients,
        activeClients,
        totalRevenue,
        avgTicket,
      },
      clients: clientStats,
      byAliado: Object.entries(byAliado).map(([id, data]) => ({ id, ...data })),
      byCity: Object.entries(byCity)
        .map(([city, data]) => ({ city, ...data }))
        .sort((a, b) => b.revenue - a.revenue),
      byBusinessType: Object.entries(byBusinessType)
        .map(([type, data]) => ({ type, ...data }))
        .sort((a, b) => b.revenue - a.revenue),
      bySegment,
    })
  } catch (error) {
    console.error('Error fetching client stats:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Error al obtener estadísticas' },
      { status: 500 }
    )
  }
}
