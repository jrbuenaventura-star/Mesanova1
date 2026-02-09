import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { TrendingUp, TrendingDown, DollarSign, Users, Tag, Calendar } from "lucide-react"

export default async function EstadisticasCuponesPage() {
  const supabase = await createClient()
  const { data: { user }, error: userError } = await supabase.auth.getUser()

  if (userError || !user) {
    redirect("/auth/login")
  }

  const { data: profile } = await supabase
    .from("user_profiles")
    .select("role")
    .eq("id", user.id)
    .single()

  if (!profile || profile.role !== "superadmin") {
    redirect("/")
  }

  // Obtener estadísticas
  const { data: coupons } = await supabase.from("coupons").select("*")
  const { data: usages } = await supabase.from("coupon_usages").select("*")

  // Calcular métricas
  const totalCoupons = coupons?.length || 0
  const activeCoupons = coupons?.filter(c => c.status === 'active').length || 0
  const totalUsages = usages?.length || 0
  const totalDiscounts = usages?.reduce((sum, u) => sum + Number(u.discount_applied), 0) || 0
  const avgDiscount = totalUsages > 0 ? totalDiscounts / totalUsages : 0
  const uniqueUsers = new Set(usages?.map(u => u.user_id).filter(Boolean)).size

  // Top cupones por uso
  const couponUsageCount = usages?.reduce((acc: any, usage) => {
    acc[usage.coupon_id] = (acc[usage.coupon_id] || 0) + 1
    return acc
  }, {})

  const topCoupons = coupons
    ?.map(coupon => ({
      ...coupon,
      usageCount: couponUsageCount?.[coupon.id] || 0,
      totalDiscount: usages
        ?.filter(u => u.coupon_id === coupon.id)
        .reduce((sum, u) => sum + Number(u.discount_applied), 0) || 0
    }))
    .sort((a, b) => b.usageCount - a.usageCount)
    .slice(0, 5)

  // Estadísticas por tipo
  const percentageCoupons = coupons?.filter(c => c.discount_type === 'percentage').length || 0
  const fixedAmountCoupons = coupons?.filter(c => c.discount_type === 'fixed_amount').length || 0
  const freeShippingCoupons = coupons?.filter(c => c.discount_type === 'free_shipping').length || 0

  // Cupones por mes (últimos 6 meses)
  const sixMonthsAgo = new Date()
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6)

  const recentUsages = usages?.filter(u => new Date(u.created_at) >= sixMonthsAgo) || []
  const usagesByMonth = recentUsages.reduce((acc: any, usage) => {
    const month = new Date(usage.created_at).toLocaleDateString('es-CO', { year: 'numeric', month: 'short' })
    acc[month] = (acc[month] || 0) + 1
    return acc
  }, {})

  return (
    <div className="container mx-auto py-8 px-4 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Estadísticas de Cupones</h1>
        <p className="text-muted-foreground">Análisis detallado del rendimiento de cupones</p>
      </div>

      {/* Métricas Principales */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Cupones</CardTitle>
            <Tag className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalCoupons}</div>
            <p className="text-xs text-muted-foreground">
              {activeCoupons} activos
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Usos</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalUsages}</div>
            <p className="text-xs text-muted-foreground">
              {uniqueUsers} usuarios únicos
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Descuentos Totales</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${totalDiscounts.toLocaleString('es-CO')}</div>
            <p className="text-xs text-muted-foreground">
              Promedio: ${avgDiscount.toLocaleString('es-CO', { maximumFractionDigits: 0 })}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tasa de Conversión</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {totalCoupons > 0 ? ((totalUsages / totalCoupons) * 100).toFixed(1) : 0}%
            </div>
            <p className="text-xs text-muted-foreground">
              Usos por cupón
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Top Cupones */}
      <Card>
        <CardHeader>
          <CardTitle>Top 5 Cupones Más Usados</CardTitle>
          <CardDescription>Cupones con mayor número de canjes</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {topCoupons?.map((coupon, index) => (
              <div key={coupon.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center gap-4">
                  <div className="flex items-center justify-center w-8 h-8 bg-primary/10 rounded-full">
                    <span className="font-bold text-primary">#{index + 1}</span>
                  </div>
                  <div>
                    <h4 className="font-semibold">{coupon.name}</h4>
                    <p className="text-sm text-muted-foreground">Código: {coupon.code}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-bold">{coupon.usageCount} usos</p>
                  <p className="text-sm text-muted-foreground">
                    ${coupon.totalDiscount.toLocaleString('es-CO')} en descuentos
                  </p>
                </div>
              </div>
            ))}
            {(!topCoupons || topCoupons.length === 0) && (
              <p className="text-center text-muted-foreground py-8">No hay datos disponibles</p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Distribución por Tipo */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Cupones de Porcentaje</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{percentageCoupons}</div>
            <p className="text-sm text-muted-foreground">
              {totalCoupons > 0 ? ((percentageCoupons / totalCoupons) * 100).toFixed(0) : 0}% del total
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Cupones de Monto Fijo</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{fixedAmountCoupons}</div>
            <p className="text-sm text-muted-foreground">
              {totalCoupons > 0 ? ((fixedAmountCoupons / totalCoupons) * 100).toFixed(0) : 0}% del total
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Cupones de Envío Gratis</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{freeShippingCoupons}</div>
            <p className="text-sm text-muted-foreground">
              {totalCoupons > 0 ? ((freeShippingCoupons / totalCoupons) * 100).toFixed(0) : 0}% del total
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Uso por Mes */}
      <Card>
        <CardHeader>
          <CardTitle>Uso de Cupones por Mes</CardTitle>
          <CardDescription>Últimos 6 meses</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {Object.entries(usagesByMonth).map(([month, count]) => (
              <div key={month} className="flex items-center justify-between">
                <span className="text-sm font-medium">{month}</span>
                <div className="flex items-center gap-2">
                  <div className="w-64 bg-muted rounded-full h-2">
                    <div
                      className="bg-primary h-2 rounded-full"
                      style={{ width: `${(Number(count) / totalUsages) * 100}%` }}
                    />
                  </div>
                  <span className="text-sm font-bold w-12 text-right">{count as number}</span>
                </div>
              </div>
            ))}
            {Object.keys(usagesByMonth).length === 0 && (
              <p className="text-center text-muted-foreground py-8">No hay datos de los últimos 6 meses</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
