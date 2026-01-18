import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { getUserOrders, getActiveOrders } from "@/lib/db/user-features"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ShoppingBag, Package, Truck, CheckCircle, Clock, ExternalLink, RotateCcw } from "lucide-react"
import Link from "next/link"

const statusConfig: Record<string, { label: string; color: string; icon: React.ElementType }> = {
  pending: { label: "Pendiente", color: "bg-yellow-500", icon: Clock },
  confirmed: { label: "Confirmado", color: "bg-blue-500", icon: CheckCircle },
  processing: { label: "Procesando", color: "bg-purple-500", icon: Package },
  shipped: { label: "Enviado", color: "bg-indigo-500", icon: Truck },
  delivered: { label: "Entregado", color: "bg-green-500", icon: CheckCircle },
  cancelled: { label: "Cancelado", color: "bg-red-500", icon: Clock },
}

export default async function OrdenesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login?redirect=/perfil/ordenes")
  }

  const [allOrders, activeOrders] = await Promise.all([
    getUserOrders(user.id),
    getActiveOrders(user.id),
  ])

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString("es-CO", {
      year: "numeric",
      month: "short",
      day: "numeric",
    })
  }

  const getTrackingUrl = (order: any) => {
    if (!order.tracking_number || !order.carrier?.tracking_url_template) return null
    return order.carrier.tracking_url_template.replace("{tracking_number}", order.tracking_number)
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <ShoppingBag className="h-8 w-8" />
          Mis Órdenes
        </h1>
        <p className="text-muted-foreground mt-2">
          Historial y seguimiento de tus pedidos
        </p>
      </div>

      <Tabs defaultValue="active" className="w-full">
        <TabsList>
          <TabsTrigger value="active">
            Activas ({activeOrders.length})
          </TabsTrigger>
          <TabsTrigger value="all">
            Todas ({allOrders.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="active" className="mt-6">
          {activeOrders.length === 0 ? (
            <Card className="p-12 text-center">
              <Package className="h-16 w-16 mx-auto text-muted-foreground/50 mb-4" />
              <h2 className="text-xl font-semibold mb-2">No tienes órdenes activas</h2>
              <p className="text-muted-foreground mb-6">
                Cuando realices un pedido, podrás ver su seguimiento aquí
              </p>
              <Button asChild>
                <Link href="/productos">Explorar productos</Link>
              </Button>
            </Card>
          ) : (
            <div className="space-y-4">
              {activeOrders.map((order: any) => {
                const status = statusConfig[order.status] || statusConfig.pending
                const StatusIcon = status.icon
                const trackingUrl = getTrackingUrl(order)
                const latestTracking = order.order_tracking_history?.[0]

                return (
                  <Card key={order.id}>
                    <CardHeader className="pb-2">
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                        <div className="flex items-center gap-3">
                          <div className={`p-2 rounded-full ${status.color} text-white`}>
                            <StatusIcon className="h-4 w-4" />
                          </div>
                          <div>
                            <CardTitle className="text-lg">Orden #{order.id.slice(0, 8)}</CardTitle>
                            <p className="text-sm text-muted-foreground">{formatDate(order.created_at)}</p>
                          </div>
                        </div>
                        <Badge className={`${status.color} text-white`}>{status.label}</Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="grid gap-4 md:grid-cols-2">
                        <div>
                          <p className="text-sm text-muted-foreground">Total</p>
                          <p className="text-xl font-bold">${Number(order.total).toLocaleString("es-CO")}</p>
                        </div>
                        {order.tracking_number && (
                          <div>
                            <p className="text-sm text-muted-foreground">Número de guía</p>
                            <div className="flex items-center gap-2">
                              <p className="font-mono">{order.tracking_number}</p>
                              {trackingUrl && (
                                <Button variant="ghost" size="sm" asChild>
                                  <a href={trackingUrl} target="_blank" rel="noopener noreferrer">
                                    <ExternalLink className="h-4 w-4" />
                                  </a>
                                </Button>
                              )}
                            </div>
                            {order.carrier?.name && (
                              <p className="text-sm text-muted-foreground">vía {order.carrier.name}</p>
                            )}
                          </div>
                        )}
                      </div>
                      
                      {latestTracking && (
                        <div className="mt-4 p-3 bg-muted rounded-lg">
                          <p className="text-sm font-medium">Última actualización</p>
                          <p className="text-sm text-muted-foreground">
                            {latestTracking.status_description || latestTracking.status}
                            {latestTracking.location && ` - ${latestTracking.location}`}
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {formatDate(latestTracking.occurred_at)}
                          </p>
                        </div>
                      )}

                      <div className="mt-4 flex gap-2">
                        <Button variant="outline" size="sm" asChild>
                          <Link href={`/perfil/ordenes/${order.id}`}>Ver detalles</Link>
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          )}
        </TabsContent>

        <TabsContent value="all" className="mt-6">
          {allOrders.length === 0 ? (
            <Card className="p-12 text-center">
              <ShoppingBag className="h-16 w-16 mx-auto text-muted-foreground/50 mb-4" />
              <h2 className="text-xl font-semibold mb-2">No has realizado pedidos</h2>
              <p className="text-muted-foreground mb-6">
                Cuando realices una compra, aparecerá aquí
              </p>
              <Button asChild>
                <Link href="/productos">Explorar productos</Link>
              </Button>
            </Card>
          ) : (
            <div className="space-y-3">
              {allOrders.map((order: any) => {
                const status = statusConfig[order.status] || statusConfig.pending

                return (
                  <Card key={order.id} className="p-4">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div>
                          <p className="font-medium">Orden #{order.id.slice(0, 8)}</p>
                          <p className="text-sm text-muted-foreground">{formatDate(order.created_at)}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <Badge variant="outline" className={status.color.replace("bg-", "text-").replace("-500", "-600")}>
                          {status.label}
                        </Badge>
                        <p className="font-bold">${Number(order.total).toLocaleString("es-CO")}</p>
                        <div className="flex gap-1">
                          <Button variant="ghost" size="sm" asChild>
                            <Link href={`/perfil/ordenes/${order.id}`}>Ver</Link>
                          </Button>
                          {order.status === "delivered" && (
                            <Button variant="ghost" size="sm">
                              <RotateCcw className="h-4 w-4 mr-1" />
                              Repetir
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  </Card>
                )
              })}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
