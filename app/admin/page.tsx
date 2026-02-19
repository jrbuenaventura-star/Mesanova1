import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { 
  Users, 
  Package, 
  ShoppingCart, 
  AlertTriangle,
  UserPlus,
  Building2,
  ArrowRight,
  Clock,
  DollarSign,
  BarChart3,
  MessageSquare,
  Image,
  Sparkles,
  FileSpreadsheet,
  Settings,
} from "lucide-react"

const statusLabels: Record<string, string> = {
  borrador: "Borrador",
  por_aprobar: "Por Aprobar",
  aprobada: "Aprobada",
  en_preparacion: "En Preparación",
  enviada: "Enviada",
  entregada: "Entregada",
  cancelada: "Cancelada",
  devuelta_rechazada: "Devuelta",
}

export default async function AdminDashboard() {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/auth/login")

  const { data: profile } = await supabase
    .from("user_profiles")
    .select("role")
    .eq("id", user.id)
    .single()

  if (profile?.role !== "superadmin") redirect("/")

  const currentMonth = new Date().toISOString().slice(0, 7)

  // Consultas en paralelo para máximo rendimiento
  const [
    { count: usersCount },
    { count: productsCount },
    { count: ordersCount },
    { count: activeProductsCount },
    { data: monthOrders },
    { data: recentOrders },
    { count: pendingOrdersCount },
    { count: distributorsCount },
    { count: activeDistributorsCount },
  ] = await Promise.all([
    supabase.from("user_profiles").select("*", { count: "exact", head: true }),
    supabase.from("products").select("*", { count: "exact", head: true }),
    supabase.from("orders").select("*", { count: "exact", head: true }),
    supabase.from("products").select("*", { count: "exact", head: true }).eq("is_active", true),
    supabase.from("orders").select("id, total, status").gte("created_at", `${currentMonth}-01`),
    supabase.from("orders").select("id, order_number, total, status, created_at, customer_name").order("created_at", { ascending: false }).limit(8),
    supabase.from("orders").select("*", { count: "exact", head: true }).eq("status", "por_aprobar"),
    supabase.from("distributors").select("*", { count: "exact", head: true }),
    supabase.from("distributors").select("*", { count: "exact", head: true }).eq("is_active", true),
  ])

  // Consultas secundarias
  let pqrsOpenCount = 0
  let leadsCount = 0
  let lowStockCount = 0
  try {
    const [pqrsResult, leadsResult] = await Promise.all([
      supabase.from("pqrs_tickets").select("*", { count: "exact", head: true }).in("estado", ["abierto", "en_proceso"]),
      supabase.from("leads").select("*", { count: "exact", head: true }).not("stage", "in", '("aprobado","rechazado")'),
    ])
    pqrsOpenCount = pqrsResult.count || 0
    leadsCount = leadsResult.count || 0
  } catch (e) {}

  // Calcular métricas
  const monthlySales = monthOrders?.reduce((sum, o) => sum + (o.total || 0), 0) || 0
  const monthlyOrdersCount = monthOrders?.length || 0
  const avgOrderValue = monthlyOrdersCount > 0 ? monthlySales / monthlyOrdersCount : 0

  // Órdenes por estado este mes
  const ordersByStatus: Record<string, number> = {}
  monthOrders?.forEach(o => {
    ordersByStatus[o.status] = (ordersByStatus[o.status] || 0) + 1
  })

  const panelGroups = [
    {
      title: "1) Home",
      icon: Image,
      links: [
        { href: "/admin/home?tab=banner-home", label: "/banner-home" },
        { href: "/admin/home?tab=productos-destacados", label: "/productos-destacados", icon: Sparkles },
      ],
    },
    {
      title: "2) Productos",
      icon: Package,
      links: [
        { href: "/admin/productos?tab=productos", label: "/products" },
        { href: "/admin/productos?tab=productos-csv", label: "/productos/csv", icon: FileSpreadsheet },
      ],
    },
    {
      title: "3) Órdenes",
      icon: ShoppingCart,
      links: [
        { href: "/admin/ordenes?tab=ordenes", label: "/orders" },
        { href: "/admin/ordenes?tab=aprobar-ordenes", label: "/orders/approval" },
      ],
    },
    {
      title: "4) Red Comercial",
      icon: Building2,
      links: [
        { href: "/admin/red-comercial?tab=clientes", label: "/distributors" },
        { href: "/admin/red-comercial?tab=clientes-csv", label: "/distributors/csv", icon: FileSpreadsheet },
        { href: "/admin/red-comercial?tab=aliados", label: "/aliados", icon: Users },
      ],
    },
    {
      title: "5) Configuración",
      icon: Settings,
      links: [
        { href: "/admin/settings", label: "/settings" },
        { href: "/admin/settings?tab=usuarios", label: "/settings/users", icon: Users },
      ],
    },
  ]

  return (
    <div className="container mx-auto py-8 px-4 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground">Resumen general de Mesanova</p>
        </div>
        <Badge variant="outline" className="text-sm">
          {new Date().toLocaleDateString("es-CO", { month: "long", year: "numeric" })}
        </Badge>
      </div>

      {/* Alertas */}
      {(pendingOrdersCount || 0) > 0 && (
        <div className="flex items-center gap-3 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <AlertTriangle className="h-5 w-5 text-yellow-600" />
          <p className="text-sm text-yellow-800">
            Tienes <strong>{pendingOrdersCount}</strong> órdenes pendientes de aprobación.
          </p>
          <Button size="sm" variant="outline" asChild className="ml-auto">
            <Link href="/admin/ordenes?tab=ordenes&status=por_aprobar" aria-label="Ver órdenes">Ver órdenes</Link>
          </Button>
        </div>
      )}

      {/* KPIs principales */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ventas del Mes</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${monthlySales.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">{monthlyOrdersCount} pedidos este mes</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ticket Promedio</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${Math.round(avgOrderValue).toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">Valor promedio por orden</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Órdenes Totales</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{ordersCount || 0}</div>
            <p className="text-xs text-muted-foreground">
              {(pendingOrdersCount || 0) > 0 && <span className="text-yellow-600 font-medium">{pendingOrdersCount} pendientes</span>}
              {(pendingOrdersCount || 0) === 0 && "Todas al día"}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Distribuidores</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{distributorsCount || 0}</div>
            <p className="text-xs text-muted-foreground">{activeDistributorsCount || 0} activos</p>
          </CardContent>
        </Card>
      </div>

      {/* KPIs secundarios */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="bg-muted/30">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Usuarios</p>
                <p className="text-xl font-bold">{usersCount || 0}</p>
              </div>
              <Users className="h-8 w-8 text-muted-foreground/50" />
            </div>
          </CardContent>
        </Card>
        <Card className="bg-muted/30">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Productos</p>
                <p className="text-xl font-bold">{activeProductsCount || 0} <span className="text-sm font-normal text-muted-foreground">/ {productsCount || 0}</span></p>
              </div>
              <Package className="h-8 w-8 text-muted-foreground/50" />
            </div>
          </CardContent>
        </Card>
        <Card className="bg-muted/30">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">PQRS Abiertos</p>
                <p className="text-xl font-bold">{pqrsOpenCount}</p>
              </div>
              <MessageSquare className="h-8 w-8 text-muted-foreground/50" />
            </div>
          </CardContent>
        </Card>
        <Card className="bg-muted/30">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Leads en Pipeline</p>
                <p className="text-xl font-bold">{leadsCount}</p>
              </div>
              <UserPlus className="h-8 w-8 text-muted-foreground/50" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Contenido principal */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Órdenes del mes por estado */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Órdenes del Mes por Estado</CardTitle>
            <CardDescription>Distribución de pedidos este mes</CardDescription>
          </CardHeader>
          <CardContent>
            {Object.keys(ordersByStatus).length === 0 ? (
              <p className="text-muted-foreground text-center py-6">Sin órdenes este mes</p>
            ) : (
              <div className="space-y-3">
                {Object.entries(ordersByStatus).map(([status, count]) => (
                  <div key={status} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">{statusLabels[status] || status}</Badge>
                    </div>
                    <span className="font-bold">{count}</span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Órdenes recientes */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-lg">Órdenes Recientes</CardTitle>
              <CardDescription>Últimos pedidos realizados</CardDescription>
            </div>
            <Button variant="outline" size="sm" asChild>
              <Link href="/admin/ordenes?tab=ordenes">
                Ver órdenes <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            {recentOrders && recentOrders.length > 0 ? (
              <div className="space-y-3">
                {recentOrders.map((order: any) => (
                  <div key={order.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="font-medium text-sm">
                          #{order.order_number}
                          {order.customer_name && <span className="text-muted-foreground"> - {order.customer_name}</span>}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(order.created_at).toLocaleDateString("es-CO")}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-sm">${(order.total || 0).toLocaleString()}</p>
                      <Badge variant="outline" className="text-xs">
                        {statusLabels[order.status] || order.status}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground text-center py-6">No hay órdenes aún</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Módulos del panel */}
      <div>
        <h2 className="text-lg font-semibold mb-4">Módulos Integrados del Superadmin</h2>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {panelGroups.map((group) => {
            const GroupIcon = group.icon
            return (
              <Card key={group.title}>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base flex items-center gap-2">
                    <GroupIcon className="h-4 w-4 text-primary" />
                    {group.title}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {group.links.map((link) => {
                    const LinkIcon = link.icon || ArrowRight
                    return (
                      <Button key={link.href} variant="outline" className="w-full justify-start" asChild>
                        <Link href={link.href}>
                          <LinkIcon className="mr-2 h-4 w-4" />
                          {link.label}
                        </Link>
                      </Button>
                    )
                  })}
                </CardContent>
              </Card>
            )
          })}
        </div>
      </div>
    </div>
  )
}
