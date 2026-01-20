import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { 
  Users, 
  UserPlus, 
  TrendingUp, 
  DollarSign,
  ArrowRight,
  Building2,
  Calendar,
  AlertCircle,
  ShoppingCart
} from "lucide-react"

export default async function AliadoDashboardPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  // Obtener aliado
  const { data: aliado } = await supabase
    .from("aliados")
    .select("*")
    .eq("user_id", user.id)
    .single()

  if (!aliado) {
    return (
      <div className="container mx-auto py-8 px-4">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            No tienes un perfil de aliado configurado. Contacta al administrador.
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  // Obtener distribuidores asignados
  let distributors: any[] = []
  try {
    const { data } = await supabase
      .from("distributors")
      .select("id, company_name, is_active, last_purchase_date, total_purchases, contact_name")
      .eq("aliado_id", aliado.id)
      .order("total_purchases", { ascending: false })
    distributors = data || []
  } catch (e) {
    // Columna aliado_id aún no existe
  }

  // Obtener leads del aliado
  let leads: any[] = []
  let leadsByStage: Record<string, number> = {}
  try {
    const { data } = await supabase
      .from("leads")
      .select("id, company_name, stage, next_follow_up_date")
      .eq("aliado_id", aliado.id)
      .order("created_at", { ascending: false })
      .limit(10)
    leads = data || []
    
    // Contar por etapa
    leads.forEach(lead => {
      leadsByStage[lead.stage] = (leadsByStage[lead.stage] || 0) + 1
    })
  } catch (e) {
    // Tabla aún no existe
  }

  // Calcular métricas
  const totalDistributors = distributors.length
  const activeDistributors = distributors.filter(d => d.is_active).length
  const totalSales = distributors.reduce((sum, d) => sum + (d.total_purchases || 0), 0)
  const avgPurchases = totalDistributors > 0 ? totalSales / totalDistributors : 0

  // Leads con seguimiento pendiente
  const pendingFollowUps = leads.filter(lead => {
    if (!lead.next_follow_up_date) return false
    return new Date(lead.next_follow_up_date) <= new Date()
  })

  return (
    <div className="container mx-auto py-8 px-4 space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">{aliado.company_name}</h1>
          <p className="text-muted-foreground">Panel de Aliado Comercial</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <Link href="/aliado/leads/nuevo">
              <UserPlus className="mr-2 h-4 w-4" />
              Nuevo Lead
            </Link>
          </Button>
          <Button asChild>
            <Link href="/aliado/orders">
              <ShoppingCart className="mr-2 h-4 w-4" />
              Crear Pedido
            </Link>
          </Button>
        </div>
      </div>

      {/* Alertas de seguimiento */}
      {pendingFollowUps.length > 0 && (
        <Alert>
          <Calendar className="h-4 w-4" />
          <AlertDescription>
            Tienes <strong>{pendingFollowUps.length}</strong> leads con seguimiento pendiente.{" "}
            <Link href="/aliado/leads" className="underline">Ver leads</Link>
          </AlertDescription>
        </Alert>
      )}

      {/* KPIs principales */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Distribuidores</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalDistributors}</div>
            <p className="text-xs text-muted-foreground">{activeDistributors} activos</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ventas Totales</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${totalSales.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">De tus distribuidores</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Promedio por Distribuidor</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${avgPurchases.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">Compras promedio</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Leads Activos</CardTitle>
            <UserPlus className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{leads.length}</div>
            <p className="text-xs text-muted-foreground">En pipeline</p>
          </CardContent>
        </Card>
      </div>

      {/* Contenido principal */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Listado de distribuidores */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-lg">Mis Distribuidores</CardTitle>
              <CardDescription>Última compra y promedio anual</CardDescription>
            </div>
            <Button variant="outline" size="sm" asChild>
              <Link href="/aliado/distributors">
                Ver todos
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            {distributors.length === 0 ? (
              <div className="text-center py-6 text-muted-foreground">
                <Users className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>No tienes distribuidores asignados</p>
              </div>
            ) : (
              <div className="space-y-3">
                {distributors.slice(0, 5).map((dist) => (
                  <div key={dist.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <Building2 className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <p className="font-medium text-sm">{dist.company_name}</p>
                        <p className="text-xs text-muted-foreground">
                          {dist.last_purchase_date 
                            ? `Última compra: ${new Date(dist.last_purchase_date).toLocaleDateString()}`
                            : "Sin compras"}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-sm">${(dist.total_purchases || 0).toLocaleString()}</p>
                      <Badge variant={dist.is_active ? "default" : "secondary"} className="text-xs">
                        {dist.is_active ? "Activo" : "Inactivo"}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Pipeline de leads */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-lg">Pipeline de Leads</CardTitle>
              <CardDescription>Prospectos en tu embudo</CardDescription>
            </div>
            <Button variant="outline" size="sm" asChild>
              <Link href="/aliado/leads">
                Ver CRM
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            {leads.length === 0 ? (
              <div className="text-center py-6 text-muted-foreground">
                <UserPlus className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>No tienes leads registrados</p>
                <Button variant="link" asChild className="mt-2">
                  <Link href="/aliado/leads/nuevo">Crear primer lead</Link>
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Resumen por etapa */}
                <div className="grid grid-cols-2 gap-2">
                  {Object.entries(leadsByStage).slice(0, 4).map(([stage, count]) => {
                    const stageLabels: Record<string, string> = {
                      prospecto: "Prospectos",
                      contactado: "Contactados",
                      interesado: "Interesados",
                      docs_comerciales_enviados: "Docs. enviados",
                      docs_analisis_solicitados: "Docs. solicitados",
                      docs_analisis_recibidos: "Docs. recibidos",
                      aprobado: "Aprobados",
                      rechazado: "Rechazados"
                    }
                    return (
                      <div key={stage} className="p-2 bg-muted rounded-lg text-center">
                        <p className="text-lg font-bold">{count}</p>
                        <p className="text-xs text-muted-foreground">{stageLabels[stage] || stage}</p>
                      </div>
                    )
                  })}
                </div>

                {/* Últimos leads */}
                <div className="space-y-2">
                  <p className="text-sm font-medium">Últimos leads</p>
                  {leads.slice(0, 3).map((lead) => (
                    <Link 
                      key={lead.id}
                      href={`/aliado/leads/${lead.id}`}
                      className="flex items-center justify-between p-2 rounded-lg hover:bg-muted transition-colors"
                    >
                      <span className="text-sm truncate">{lead.company_name}</span>
                      <Badge variant="outline" className="text-xs">
                        {lead.stage}
                      </Badge>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
