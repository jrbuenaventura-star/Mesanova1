import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { getUserOrders, getActiveOrders } from "@/lib/db/user-features"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ShoppingBag, Package, Truck, CheckCircle, Clock, ExternalLink, RotateCcw, FileEdit, XCircle, ArrowLeftRight } from "lucide-react"
import Link from "next/link"

const statusConfig: Record<string, { label: string; color: string; badgeVariant: "default" | "secondary" | "destructive" | "outline"; icon: React.ElementType }> = {
  borrador: { label: "Borrador", color: "bg-gray-500", badgeVariant: "secondary", icon: FileEdit },
  por_aprobar: { label: "Por aprobar", color: "bg-yellow-500", badgeVariant: "outline", icon: Clock },
  aprobada: { label: "Aprobada", color: "bg-blue-500", badgeVariant: "default", icon: CheckCircle },
  en_preparacion: { label: "En preparación", color: "bg-purple-500", badgeVariant: "default", icon: Package },
  enviada: { label: "Enviada", color: "bg-indigo-500", badgeVariant: "default", icon: Truck },
  entregada: { label: "Entregada", color: "bg-green-500", badgeVariant: "default", icon: CheckCircle },
  cancelada: { label: "Cancelada", color: "bg-red-500", badgeVariant: "destructive", icon: XCircle },
  devuelta_rechazada: { label: "Devuelta/Rechazada", color: "bg-red-400", badgeVariant: "destructive", icon: ArrowLeftRight },
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
                const status = statusConfig[order.status] || statusConfig.borrador
                const StatusIcon = status.icon
                const trackingUrl = getTrackingUrl(order)
                const latestTracking = order.order_tracking_history?.[0]
                const items = order.items as any[] | null
                const itemCount = Array.isArray(items) ? items.length : 0

                return (
                  <Card key={order.id} className="overflow-hidden">
                    <CardHeader className="pb-3">
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                        <div className="flex items-center gap-3">
                          <div className={`p-2 rounded-full ${status.color} text-white`}>
                            <StatusIcon className="h-4 w-4" />
                          </div>
                          <div>
                            <CardTitle className="text-lg">Orden #{order.id.slice(0, 8)}</CardTitle>
                            <p className="text-sm text-muted-foreground">
                              {formatDate(order.created_at)}
                              {itemCount > 0 && <span> · {itemCount} {itemCount === 1 ? 'producto' : 'productos'}</span>}
                            </p>
                          </div>
                        </div>
                        <Badge variant={status.badgeVariant}>{status.label}</Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {/* Items preview */}
                      {Array.isArray(items) && items.length > 0 && (
                        <div className="flex gap-2 overflow-x-auto pb-1">
                          {items.slice(0, 4).map((item: any, i: number) => (
                            <div key={i} className="flex-shrink-0 flex items-center gap-2 bg-muted/50 rounded-lg px-3 py-2 text-sm">
                              {item.image_url && (
                                <img src={item.image_url} alt="" className="h-8 w-8 rounded object-cover" />
                              )}
                              <span className="truncate max-w-[120px]">{item.name || item.product_name || 'Producto'}</span>
                              <span className="text-muted-foreground">x{item.quantity || 1}</span>
                            </div>
                          ))}
                          {items.length > 4 && (
                            <div className="flex-shrink-0 flex items-center text-sm text-muted-foreground px-2">
                              +{items.length - 4} más
                            </div>
                          )}
                        </div>
                      )}

                      <div className="grid gap-4 sm:grid-cols-2">
                        <div>
                          <p className="text-sm text-muted-foreground">Total</p>
                          <p className="text-xl font-bold">${Number(order.total).toLocaleString("es-CO")}</p>
                        </div>
                        {order.tracking_number && (
                          <div>
                            <p className="text-sm text-muted-foreground">Número de guía</p>
                            <div className="flex items-center gap-2">
                              <p className="font-mono text-sm">{order.tracking_number}</p>
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
                        <div className="p-3 bg-muted rounded-lg">
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

                      <div className="flex gap-2">
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
                const status = statusConfig[order.status] || statusConfig.borrador
                const StatusIcon = status.icon
                const items = order.items as any[] | null
                const itemCount = Array.isArray(items) ? items.length : 0

                return (
                  <Card key={order.id} className="p-4">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className={`p-1.5 rounded-full ${status.color} text-white flex-shrink-0`}>
                          <StatusIcon className="h-3.5 w-3.5" />
                        </div>
                        <div>
                          <p className="font-medium">Orden #{order.id.slice(0, 8)}</p>
                          <p className="text-sm text-muted-foreground">
                            {formatDate(order.created_at)}
                            {itemCount > 0 && <span> · {itemCount} {itemCount === 1 ? 'producto' : 'productos'}</span>}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 flex-wrap">
                        <Badge variant={status.badgeVariant}>
                          {status.label}
                        </Badge>
                        <p className="font-bold">${Number(order.total).toLocaleString("es-CO")}</p>
                        <div className="flex gap-1">
                          <Button variant="ghost" size="sm" asChild>
                            <Link href={`/perfil/ordenes/${order.id}`}>Ver</Link>
                          </Button>
                          {order.status === "entregada" && (
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
