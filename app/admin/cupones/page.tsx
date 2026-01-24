import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Plus, Tag, TrendingUp, Users, DollarSign, BarChart3, Download } from "lucide-react"
import Link from "next/link"

export default async function CuponesAdminPage() {
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

  const { data: coupons } = await supabase
    .from("coupons")
    .select("*, coupon_usages(count)")
    .order("created_at", { ascending: false })

  const { data: stats } = await supabase
    .from("coupon_usages")
    .select("discount_applied")

  const totalDiscounts = stats?.reduce((sum, usage) => sum + Number(usage.discount_applied), 0) || 0
  const activeCoupons = coupons?.filter(c => c.status === 'active').length || 0
  const totalUsages = stats?.length || 0

  return (
    <div className="container mx-auto py-8 space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Gestión de Cupones</h1>
          <p className="text-muted-foreground">Administra cupones de descuento</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <Link href="/admin/cupones/estadisticas">
              <BarChart3 className="mr-2 h-4 w-4" />
              Estadísticas
            </Link>
          </Button>
          <Button variant="outline" asChild>
            <a href="/api/admin/export/coupons" download>
              <Download className="mr-2 h-4 w-4" />
              Exportar
            </a>
          </Button>
          <Button asChild>
            <Link href="/admin/cupones/nuevo">
              <Plus className="mr-2 h-4 w-4" />
              Crear Cupón
            </Link>
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Cupones Activos</CardTitle>
            <Tag className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeCoupons}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Cupones</CardTitle>
            <Tag className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{coupons?.length || 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Usos Totales</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalUsages}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Descuentos Otorgados</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${totalDiscounts.toLocaleString('es-CO')}</div>
          </CardContent>
        </Card>
      </div>

      {/* Cupones List */}
      <Card>
        <CardHeader>
          <CardTitle>Cupones</CardTitle>
          <CardDescription>Lista de todos los cupones creados</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {coupons?.map((coupon) => (
              <div key={coupon.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold">{coupon.name}</h3>
                    <Badge variant={coupon.status === 'active' ? 'default' : 'secondary'}>
                      {coupon.status}
                    </Badge>
                    {coupon.is_public && <Badge variant="outline">Público</Badge>}
                  </div>
                  <p className="text-sm text-muted-foreground mb-2">
                    Código: <span className="font-mono font-bold">{coupon.code}</span>
                  </p>
                  <div className="flex gap-4 text-sm">
                    <span>
                      Tipo: {coupon.discount_type === 'percentage' ? 'Porcentaje' : 
                             coupon.discount_type === 'fixed_amount' ? 'Monto Fijo' : 'Envío Gratis'}
                    </span>
                    <span>
                      Valor: {coupon.discount_type === 'percentage' ? `${coupon.discount_value}%` : 
                              coupon.discount_type === 'fixed_amount' ? `$${coupon.discount_value.toLocaleString('es-CO')}` : 'Gratis'}
                    </span>
                    <span className="text-muted-foreground">
                      Usos: {coupon.coupon_usages?.[0]?.count || 0}
                      {coupon.max_uses && ` / ${coupon.max_uses}`}
                    </span>
                  </div>
                </div>
                <Button variant="outline" size="sm" asChild>
                  <Link href={`/admin/cupones/${coupon.id}`}>
                    Ver Detalles
                  </Link>
                </Button>
              </div>
            ))}

            {(!coupons || coupons.length === 0) && (
              <div className="text-center py-8 text-muted-foreground">
                No hay cupones creados aún
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
