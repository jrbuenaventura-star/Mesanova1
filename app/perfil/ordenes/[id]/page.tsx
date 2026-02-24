import { redirect } from "next/navigation"
import Link from "next/link"
import type { ElementType } from "react"
import { createClient } from "@/lib/supabase/server"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, ExternalLink, Package, Truck, CheckCircle, Clock, FileEdit, XCircle, ArrowLeftRight } from "lucide-react"

type OrderDetailPageProps = {
  params: { id: string }
}

const STATUS_CONFIG: Record<
  string,
  { label: string; badgeVariant: "default" | "secondary" | "destructive" | "outline"; icon: ElementType }
> = {
  borrador: { label: "Borrador", badgeVariant: "secondary", icon: FileEdit },
  por_aprobar: { label: "Por aprobar", badgeVariant: "outline", icon: Clock },
  aprobada: { label: "Aprobada", badgeVariant: "default", icon: CheckCircle },
  en_preparacion: { label: "En preparación", badgeVariant: "default", icon: Package },
  enviada: { label: "Enviada", badgeVariant: "default", icon: Truck },
  entregada: { label: "Entregada", badgeVariant: "default", icon: CheckCircle },
  cancelada: { label: "Cancelada", badgeVariant: "destructive", icon: XCircle },
  devuelta_rechazada: { label: "Devuelta/Rechazada", badgeVariant: "destructive", icon: ArrowLeftRight },
}

function formatDate(date: string) {
  return new Date(date).toLocaleDateString("es-CO", {
    year: "numeric",
    month: "long",
    day: "numeric",
  })
}

export default async function OrderDetailPage({ params }: OrderDetailPageProps) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login?redirect=/perfil/ordenes")
  }

  const { data: profile } = await supabase
    .from("user_profiles")
    .select("role")
    .eq("id", user.id)
    .single()

  if (profile?.role === "distributor") {
    redirect("/distributor/orders")
  }

  const { data: order } = await supabase
    .from("orders")
    .select(`
      *,
      carrier:carriers (name, tracking_url_template),
      order_tracking_history (status, status_description, location, occurred_at)
    `)
    .eq("id", params.id)
    .eq("user_id", user.id)
    .maybeSingle()

  if (!order) {
    redirect("/perfil/ordenes")
  }

  const status = STATUS_CONFIG[order.status] || STATUS_CONFIG.borrador
  const StatusIcon = status.icon
  const items = Array.isArray(order.items) ? order.items : []
  const trackingUrl =
    order.tracking_number && order.carrier?.tracking_url_template
      ? order.carrier.tracking_url_template.replace("{tracking_number}", order.tracking_number)
      : null

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <Button variant="ghost" asChild className="w-fit">
          <Link href="/perfil/ordenes">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Ver órdenes
          </Link>
        </Button>

        <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
          <div>
            <h1 className="text-3xl font-bold">Orden #{order.id.slice(0, 8)}</h1>
            <p className="text-muted-foreground">Creada el {formatDate(order.created_at)}</p>
          </div>
          <Badge variant={status.badgeVariant} className="w-fit">
            <StatusIcon className="h-4 w-4 mr-1" />
            {status.label}
          </Badge>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Productos</CardTitle>
            <CardDescription>Detalle de los ítems incluidos en esta orden</CardDescription>
          </CardHeader>
          <CardContent>
            {items.length === 0 ? (
              <p className="text-sm text-muted-foreground">No hay productos en esta orden.</p>
            ) : (
              <div className="space-y-3">
                {items.map((item: any, idx: number) => (
                  <div key={idx} className="rounded-lg border p-3">
                    <div className="flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <p className="font-medium truncate">{item.name || item.product_name || "Producto"}</p>
                        <p className="text-sm text-muted-foreground">
                          Cantidad: {item.quantity || 1}
                          {item.product_id ? ` · ID: ${item.product_id}` : ""}
                        </p>
                      </div>
                      <p className="font-semibold">
                        ${Number(item.price || item.unit_price || 0).toLocaleString("es-CO")}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Resumen</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm text-muted-foreground">Total pagado</p>
              <p className="text-2xl font-bold">${Number(order.total || 0).toLocaleString("es-CO")}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Estado</p>
              <p className="font-medium">{status.label}</p>
            </div>
            {order.tracking_number ? (
              <div>
                <p className="text-sm text-muted-foreground">Número de guía</p>
                <p className="font-mono text-sm">{order.tracking_number}</p>
                {order.carrier?.name ? <p className="text-sm text-muted-foreground mt-1">Transportadora: {order.carrier.name}</p> : null}
              </div>
            ) : null}
            {trackingUrl ? (
              <Button variant="outline" asChild className="w-full">
                <a href={trackingUrl} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Rastrear envío
                </a>
              </Button>
            ) : null}
            <Button variant="outline" asChild className="w-full">
              <Link href="/productos">Ver productos</Link>
            </Button>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Historial de tracking</CardTitle>
          <CardDescription>Eventos reportados por la transportadora</CardDescription>
        </CardHeader>
        <CardContent>
          {!order.order_tracking_history || order.order_tracking_history.length === 0 ? (
            <p className="text-sm text-muted-foreground">Aún no hay eventos de tracking para esta orden.</p>
          ) : (
            <div className="space-y-3">
              {order.order_tracking_history.map((event: any, idx: number) => (
                <div key={`${event.occurred_at}-${idx}`} className="rounded-lg border p-3">
                  <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                    <p className="font-medium">{event.status_description || event.status}</p>
                    <p className="text-xs text-muted-foreground">{formatDate(event.occurred_at)}</p>
                  </div>
                  {event.location ? <p className="text-sm text-muted-foreground mt-1">Ubicación: {event.location}</p> : null}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
