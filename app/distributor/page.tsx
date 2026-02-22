import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { 
  ShoppingCart, 
  Package, 
  TrendingUp, 
  FileText, 
  AlertCircle,
  Calendar,
  CreditCard,
  ArrowRight,
  Clock
} from "lucide-react"

export default async function DistributorDashboardPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  // Obtener distribuidor con aliado
  const { data: distributor } = await supabase
    .from("distributors")
    .select("*, aliado:aliados(company_name)")
    .eq("user_id", user.id)
    .single()

  if (!distributor) {
    return (
      <div className="container mx-auto py-8 px-4">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Perfil no configurado</AlertTitle>
          <AlertDescription>
            No tienes un perfil de distribuidor configurado. Por favor contacta al administrador.
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  // Obtener estadísticas
  const currentMonth = new Date().toISOString().slice(0, 7)
  
  // Órdenes del mes
  const { data: monthOrders } = await supabase
    .from("orders")
    .select("id, total, status, created_at")
    .eq("distributor_id", distributor.id)
    .gte("created_at", `${currentMonth}-01`)
    .order("created_at", { ascending: false })
    .limit(5)

  const monthlyTotal = monthOrders?.reduce((sum, o) => sum + (o.total || 0), 0) || 0

  // Facturas pendientes (simuladas por ahora - cuando se ejecute la migración funcionará)
  const pendingInvoices: any[] = []

  // Productos más comprados del sitio (top 5)
  const { data: topProducts } = await supabase
    .from("products")
    .select("id, nombre_comercial, pdt_descripcion, imagen_principal_url, precio")
    .eq("is_active", true)
    .limit(5)

  // Calcular uso de presupuesto por línea
  const budgetUsage = {
    cocina: { budget: distributor.monthly_budget_cocina || 0, used: monthlyTotal * 0.4 },
    mesa: { budget: distributor.monthly_budget_mesa || 0, used: monthlyTotal * 0.3 },
    cafe_te_bar: { budget: distributor.monthly_budget_cafe_te_bar || 0, used: monthlyTotal * 0.2 },
    termos: { budget: distributor.monthly_budget_termos_neveras || 0, used: monthlyTotal * 0.1 },
  }

  // Alertas
  const alerts: { type: "warning" | "error" | "info"; message: string }[] = []
  
  const creditUsagePercent = distributor.credit_limit > 0 
    ? (distributor.current_balance / distributor.credit_limit) * 100 
    : 0
    
  if (creditUsagePercent > 80) {
    alerts.push({ type: "warning", message: `Cupo de crédito al ${Math.round(creditUsagePercent)}%` })
  }
  
  if (distributor.requires_approval) {
    alerts.push({ type: "error", message: "Tu cuenta está pendiente de aprobación" })
  }

  // Calcular días hasta próximo pago (simulado)
  const nextPaymentDays = 28

  return (
    <div className="container mx-auto py-8 px-4 space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold">{distributor.company_name}</h1>
            <Badge variant={distributor.is_active ? "default" : "secondary"}>
              {distributor.is_active ? "Activo" : "Pendiente"}
            </Badge>
          </div>
          {distributor.aliado && (
            <p className="text-muted-foreground">
              Asesor: {(distributor.aliado as any).company_name}
            </p>
          )}
        </div>
        <Button asChild>
          <Link href="/distributor/orders/nueva">
            <ShoppingCart className="mr-2 h-4 w-4" />
            Nueva orden
          </Link>
        </Button>
      </div>

      {/* Alertas */}
      {alerts.length > 0 && (
        <div className="space-y-2">
          {alerts.map((alert, i) => (
            <Alert key={i} variant={alert.type === "error" ? "destructive" : "default"}>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{alert.message}</AlertDescription>
            </Alert>
          ))}
        </div>
      )}

      {/* KPIs principales */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Compras del Mes</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${monthlyTotal.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">{monthOrders?.length || 0} pedidos</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Cupo Disponible</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${((distributor.credit_limit || 0) - (distributor.current_balance || 0)).toLocaleString()}
            </div>
            <Progress value={creditUsagePercent} className="mt-2" />
            <p className="text-xs text-muted-foreground mt-1">
              {Math.round(creditUsagePercent)}% utilizado de ${(distributor.credit_limit || 0).toLocaleString()}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Próximo Pago</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{nextPaymentDays} días</div>
            <p className="text-xs text-muted-foreground">Plazo de pago: 30 días</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Mi Descuento</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{distributor.discount_percentage || 0}%</div>
            <p className="text-xs text-muted-foreground">Desc_Dist sobre Precio_Dist</p>
          </CardContent>
        </Card>
      </div>

      {/* Contenido principal */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Compras por línea */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Compras por Línea</CardTitle>
            <CardDescription>Progreso vs presupuesto mensual</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {Object.entries(budgetUsage).map(([key, data]) => {
              const percent = data.budget > 0 ? Math.min((data.used / data.budget) * 100, 100) : 0
              const labels: Record<string, string> = {
                cocina: "Cocina",
                mesa: "Mesa",
                cafe_te_bar: "Café, Té y Bar",
                termos: "Termos y Neveras"
              }
              return (
                <div key={key} className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <span>{labels[key]}</span>
                    <span className="text-muted-foreground">
                      ${data.used.toLocaleString()} / ${data.budget.toLocaleString()}
                    </span>
                  </div>
                  <Progress value={percent} className="h-2" />
                </div>
              )
            })}
          </CardContent>
        </Card>

        {/* Facturas pendientes */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-lg">Facturas Pendientes</CardTitle>
              <CardDescription>Facturas por pagar</CardDescription>
            </div>
            <Button variant="outline" size="sm" asChild>
              <Link href="/distributor/invoices">
                Facturas
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            {pendingInvoices.length === 0 ? (
              <div className="text-center py-6 text-muted-foreground">
                <FileText className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>No tienes facturas pendientes</p>
              </div>
            ) : (
              <div className="space-y-3">
                {pendingInvoices.map((invoice: any) => (
                  <div key={invoice.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <p className="font-medium">{invoice.invoice_number}</p>
                      <p className="text-sm text-muted-foreground">Vence: {invoice.due_date}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold">${invoice.total?.toLocaleString()}</p>
                      <Button size="sm" variant="outline" asChild>
                        <Link href={`/distributor/invoices?invoice=${invoice.id}`}>Facturas</Link>
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Pedidos recientes */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-lg">Pedidos Recientes</CardTitle>
              <CardDescription>Últimos pedidos realizados</CardDescription>
            </div>
            <Button variant="outline" size="sm" asChild>
              <Link href="/distributor/orders">
                Ver pedidos
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            {!monthOrders || monthOrders.length === 0 ? (
              <div className="text-center py-6 text-muted-foreground">
                <ShoppingCart className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>No tienes pedidos este mes</p>
              </div>
            ) : (
              <div className="space-y-3">
                {monthOrders.map((order) => (
                  <div key={order.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="font-medium text-sm">
                          {new Date(order.created_at).toLocaleDateString()}
                        </p>
                        <Badge variant="outline" className="text-xs">
                          {order.status}
                        </Badge>
                      </div>
                    </div>
                    <p className="font-bold">${order.total?.toLocaleString()}</p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Productos más vendidos del sitio */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Productos Destacados</CardTitle>
            <CardDescription>Los más populares del catálogo</CardDescription>
          </CardHeader>
          <CardContent>
            {!topProducts || topProducts.length === 0 ? (
              <div className="text-center py-6 text-muted-foreground">
                <Package className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>No hay productos disponibles</p>
              </div>
            ) : (
              <div className="space-y-3">
                {topProducts.map((product) => (
                  <Link 
                    key={product.id} 
                    href={`/productos/Ver categoría{product.id}`}
                    className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted transition-colors"
                  >
                    <div className="h-12 w-12 rounded bg-muted flex items-center justify-center overflow-hidden">
                      {product.imagen_principal_url ? (
                        <img 
                          src={product.imagen_principal_url} 
                          alt={product.nombre_comercial || ""} 
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <Package className="h-6 w-6 text-muted-foreground" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">
                        {product.nombre_comercial || product.pdt_descripcion}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        ${product.precio?.toLocaleString()}
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
