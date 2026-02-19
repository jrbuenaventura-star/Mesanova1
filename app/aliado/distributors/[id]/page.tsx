import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { redirect } from "next/navigation"
import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { 
  Building2, 
  AlertCircle, 
  Mail,
  Phone,
  MapPin,
  DollarSign,
  TrendingUp,
  Calendar,
  ShoppingCart,
  ArrowLeft,
  Package
} from "lucide-react"
import { getOrderStatusLabel, getOrderStatusColor } from "@/lib/utils/order-status"
import type { OrderStatus } from "@/lib/db/types"

export default async function AliadoDistributorDetailPage({
  params,
}: {
  params: { id: string }
}) {
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

  // Obtener distribuidor
  const admin = createAdminClient()
  const { data: distributor, error: distributorError } = await admin
    .from("distributors")
    .select("*")
    .eq("id", params.id)
    .eq("aliado_id", aliado.id)
    .single()

  if (distributorError) {
    console.error("Error loading aliado client detail:", distributorError)
  }

  if (!distributor) {
    return (
      <div className="container mx-auto py-8 px-4">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Cliente no encontrado o no tienes acceso a este cliente.
          </AlertDescription>
        </Alert>
        <Button asChild className="mt-4">
          <Link href="/aliado/distributors">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Ver clientes
          </Link>
        </Button>
      </div>
    )
  }

  // Obtener órdenes del distribuidor
  const { data: orders } = await supabase
    .from("orders")
    .select("*")
    .eq("distributor_id", params.id)
    .order("created_at", { ascending: false })
    .limit(10)

  const totalOrders = orders?.length || 0
  const totalSales = orders?.reduce((sum, o) => sum + o.total, 0) || 0
  const avgOrderValue = totalOrders > 0 ? totalSales / totalOrders : 0

  return (
    <div className="container mx-auto py-8 px-4 space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="outline" size="icon" asChild aria-label="Abrir enlace">
          <Link href="/aliado/distributors" aria-label="Ver clientes">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div className="flex-1">
          <h1 className="text-3xl font-bold">{distributor.company_name}</h1>
          <p className="text-muted-foreground">Detalle del cliente</p>
        </div>
        <Button asChild>
          <Link href="/aliado/orders">
            <ShoppingCart className="mr-2 h-4 w-4" />
            Crear Pedido
          </Link>
        </Button>
      </div>

      {/* Estado */}
      <div className="flex gap-2">
        <Badge variant={distributor.is_active ? "default" : "secondary"}>
          {distributor.is_active ? "Activo" : "Inactivo"}
        </Badge>
        {distributor.business_type && (
          <Badge variant="outline">{distributor.business_type}</Badge>
        )}
      </div>

      {/* Métricas */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Compras</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${(distributor.total_purchases || 0).toLocaleString()}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Órdenes</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalOrders}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Promedio por Orden</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${avgOrderValue.toLocaleString()}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Descuento</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{distributor.discount_percentage}%</div>
          </CardContent>
        </Card>
      </div>

      {/* Información de contacto */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Información de Contacto</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {distributor.contact_name && (
              <div className="flex items-center gap-3">
                <Building2 className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Contacto</p>
                  <p className="font-medium">{distributor.contact_name}</p>
                </div>
              </div>
            )}
            {distributor.contact_email && (
              <div className="flex items-center gap-3">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Email</p>
                  <a href={`mailto:${distributor.contact_email}`} className="font-medium text-primary hover:underline">
                    {distributor.contact_email}
                  </a>
                </div>
              </div>
            )}
            {distributor.contact_phone && (
              <div className="flex items-center gap-3">
                <Phone className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Teléfono</p>
                  <a href={`tel:${distributor.contact_phone}`} className="font-medium">
                    {distributor.contact_phone}
                  </a>
                </div>
              </div>
            )}
            {(distributor.city || distributor.state) && (
              <div className="flex items-center gap-3">
                <MapPin className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Ubicación</p>
                  <p className="font-medium">
                    {[distributor.city, distributor.state].filter(Boolean).join(", ")}
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Información Comercial</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm text-muted-foreground">RIF/NIT</p>
              <p className="font-medium">{distributor.company_rif || "No especificado"}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Límite de Crédito</p>
              <p className="font-medium">${distributor.credit_limit.toLocaleString()}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Saldo Actual</p>
              <p className="font-medium">${distributor.current_balance.toLocaleString()}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Última Compra</p>
              <p className="font-medium">
                {distributor.last_purchase_date 
                  ? new Date(distributor.last_purchase_date).toLocaleDateString()
                  : "Sin compras"}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Historial de órdenes */}
      <Card>
        <CardHeader>
          <CardTitle>Últimas Órdenes</CardTitle>
          <CardDescription>
            Historial de pedidos del cliente
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!orders || orders.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <ShoppingCart className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="text-lg font-medium">No hay órdenes registradas</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Orden</TableHead>
                  <TableHead>Fecha</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {orders.map((order) => (
                  <TableRow key={order.id}>
                    <TableCell>
                      <p className="font-medium">{order.order_number || order.id.slice(0, 8)}</p>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2 text-sm">
                        <Calendar className="h-3 w-3 text-muted-foreground" />
                        {order.created_at ? new Date(order.created_at).toLocaleDateString() : "N/A"}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={getOrderStatusColor(order.status as OrderStatus)}>
                        {getOrderStatusLabel(order.status as OrderStatus)}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right font-bold">
                      ${order.total.toFixed(2)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
