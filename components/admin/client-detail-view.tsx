"use client"

import { useMemo } from "react"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  ArrowLeft,
  DollarSign,
  ShoppingCart,
  Clock,
  TrendingUp,
  Package,
  MapPin,
  Building2,
  User,
  Phone,
  Mail,
  FileText,
  CalendarClock,
  AlertTriangle,
  CheckCircle2,
} from "lucide-react"
import {
  DISTRIBUTOR_DOCUMENT_DEFINITIONS,
  buildDistributorDocumentReminder,
  type DistributorDocumentRecord,
  type DistributorDocumentReminder,
  type DocumentReminderStatus,
} from "@/lib/distributor-documents"

interface Order {
  id: string
  customer_name: string
  total: number
  subtotal: number
  shipping_cost: number
  status: string
  items: any[]
  created_at: string
  payment_method: string
  shipping_city: string
}

interface ClientDetailViewProps {
  distributor: any
  userProfile: any
  aliado: { id: string; company_name: string } | null
  orders: Order[]
  addresses: any[]
  documents: DistributorDocumentRecord[]
  documentReminder: DistributorDocumentReminder
}

const statusLabels: Record<string, string> = {
  borrador: "Borrador",
  por_aprobar: "Por aprobar",
  aprobada: "Aprobada",
  en_preparacion: "En preparación",
  enviada: "Enviada",
  entregada: "Entregada",
  cancelada: "Cancelada",
  devuelta_rechazada: "Devuelta/Rechazada",
}

const statusColors: Record<string, string> = {
  borrador: "secondary",
  por_aprobar: "outline",
  aprobada: "default",
  en_preparacion: "default",
  enviada: "default",
  entregada: "default",
  cancelada: "destructive",
  devuelta_rechazada: "destructive",
}

const segmentColors: Record<string, string> = {
  VIP: "bg-yellow-100 text-yellow-800 border-yellow-300",
  Leal: "bg-green-100 text-green-800 border-green-300",
  Regular: "bg-blue-100 text-blue-800 border-blue-300",
  "En riesgo": "bg-orange-100 text-orange-800 border-orange-300",
  Dormido: "bg-red-100 text-red-800 border-red-300",
  Nuevo: "bg-gray-100 text-gray-800 border-gray-300",
}

function formatCOP(value: number): string {
  return new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value)
}

export function ClientDetailView({
  distributor,
  userProfile,
  aliado,
  orders,
  addresses,
  documents,
  documentReminder,
}: ClientDetailViewProps) {
  const resolvedDocumentReminder = useMemo(
    () => documentReminder || buildDistributorDocumentReminder(documents || []),
    [documentReminder, documents]
  )

  const stats = useMemo(() => {
    const now = new Date()
    const oneYearAgo = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000)

    const validOrders = orders.filter((o) =>
      ["entregada", "enviada", "en_preparacion", "aprobada"].includes(o.status)
    )

    const totalSpent = validOrders.reduce((sum, o) => sum + (parseFloat(String(o.total)) || 0), 0)
    const orderCount = validOrders.length
    const avgOrderValue = orderCount > 0 ? totalSpent / orderCount : 0

    const orderDates = validOrders.map((o) => new Date(o.created_at).getTime())
    const lastOrderDate = orderDates.length > 0 ? Math.max(...orderDates) : null
    const recencyDays = lastOrderDate
      ? Math.floor((now.getTime() - lastOrderDate) / (1000 * 60 * 60 * 24))
      : null

    const ordersLastYear = validOrders.filter((o) => new Date(o.created_at) >= oneYearAgo).length

    // Segment calculation
    let segment = "Nuevo"
    if (orderCount === 0) {
      segment = "Nuevo"
    } else if (recencyDays !== null && recencyDays <= 30 && ordersLastYear >= 4) {
      segment = "VIP"
    } else if (recencyDays !== null && recencyDays <= 60 && ordersLastYear >= 2) {
      segment = "Leal"
    } else if (recencyDays !== null && recencyDays <= 90) {
      segment = "Regular"
    } else if (recencyDays !== null && recencyDays <= 180) {
      segment = "En riesgo"
    } else if (orderCount > 0) {
      segment = "Dormido"
    }

    // Top products
    const productMap = new Map<string, { name: string; quantity: number; revenue: number }>()
    for (const order of validOrders) {
      const items = Array.isArray(order.items) ? order.items : []
      for (const item of items) {
        const key = item.product_id || item.name || item.title
        if (!key) continue
        const existing = productMap.get(key) || {
          name: item.name || item.title || "Producto",
          quantity: 0,
          revenue: 0,
        }
        existing.quantity += item.quantity || 1
        existing.revenue += (item.price || 0) * (item.quantity || 1)
        productMap.set(key, existing)
      }
    }
    const topProducts = Array.from(productMap.values())
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 10)

    // Orders by month (last 12 months)
    const monthlyOrders: Record<string, { count: number; revenue: number }> = {}
    for (let i = 11; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`
      monthlyOrders[key] = { count: 0, revenue: 0 }
    }
    for (const order of validOrders) {
      const d = new Date(order.created_at)
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`
      if (monthlyOrders[key]) {
        monthlyOrders[key].count++
        monthlyOrders[key].revenue += parseFloat(String(order.total)) || 0
      }
    }

    // Orders by status
    const byStatus: Record<string, number> = {}
    for (const order of orders) {
      byStatus[order.status] = (byStatus[order.status] || 0) + 1
    }

    return {
      totalSpent,
      orderCount,
      avgOrderValue,
      recencyDays,
      ordersLastYear,
      lastOrderDate,
      segment,
      topProducts,
      monthlyOrders,
      byStatus,
    }
  }, [orders])

  const reminderVariantByStatus: Record<DocumentReminderStatus, "default" | "secondary" | "outline" | "destructive"> = {
    ok: "default",
    due_soon: "secondary",
    pending: "outline",
    missing: "destructive",
    expired: "destructive",
    rejected: "destructive",
  }

  const reminderLabelByStatus: Record<DocumentReminderStatus, string> = {
    ok: "Al día",
    due_soon: "Vence pronto",
    pending: "Pendiente revisión",
    missing: "Faltante",
    expired: "Vencido",
    rejected: "Rechazado",
  }

  const formatDate = (value: string | null | undefined) => {
    if (!value) return "—"
    const parsed = new Date(value)
    if (Number.isNaN(parsed.getTime())) return "—"
    return parsed.toLocaleDateString("es-CO")
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/admin/distributors">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Volver
          </Link>
        </Button>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold">{distributor.company_name}</h1>
            <span
              className={`inline-flex rounded-full border px-2.5 py-0.5 text-xs font-medium ${
                segmentColors[stats.segment] || ""
              }`}
            >
              {stats.segment}
            </span>
            <Badge variant={distributor.is_active ? "default" : "secondary"}>
              {distributor.is_active ? "Activo" : "Inactivo"}
            </Badge>
          </div>
          <p className="text-muted-foreground">
            {distributor.commercial_name && `${distributor.commercial_name} · `}
            {distributor.business_type || "Sin tipo"}
            {aliado && ` · Aliado: ${aliado.company_name}`}
          </p>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-5">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Gastado</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCOP(stats.totalSpent)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Órdenes</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.orderCount}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ticket Promedio</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCOP(stats.avgOrderValue)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Última Compra</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats.recencyDays !== null ? `${stats.recencyDays}d` : "—"}
            </div>
            <p className="text-xs text-muted-foreground">
              {stats.lastOrderDate
                ? new Date(stats.lastOrderDate).toLocaleDateString("es-CO")
                : "Sin compras"}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Frecuencia</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.ordersLastYear}</div>
            <p className="text-xs text-muted-foreground">órdenes en el último año</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="orders" className="space-y-4">
        <TabsList>
          <TabsTrigger value="orders">Historial de Pedidos ({orders.length})</TabsTrigger>
          <TabsTrigger value="products">Top Productos</TabsTrigger>
          <TabsTrigger value="monthly">Compras Mensuales</TabsTrigger>
          <TabsTrigger value="info">Datos del Cliente</TabsTrigger>
        </TabsList>

        {/* Orders History */}
        <TabsContent value="orders">
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Fecha</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Ciudad</TableHead>
                  <TableHead>Método de Pago</TableHead>
                  <TableHead className="text-right">Subtotal</TableHead>
                  <TableHead className="text-right">Envío</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                  <TableHead className="text-right">Items</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {orders.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                      Este cliente no tiene pedidos
                    </TableCell>
                  </TableRow>
                ) : (
                  orders.map((order) => (
                    <TableRow key={order.id}>
                      <TableCell className="text-sm">
                        {new Date(order.created_at).toLocaleDateString("es-CO")}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            (statusColors[order.status] as any) || "secondary"
                          }
                        >
                          {statusLabels[order.status] || order.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm">{order.shipping_city || "—"}</TableCell>
                      <TableCell className="text-sm">{order.payment_method}</TableCell>
                      <TableCell className="text-right text-sm">
                        {formatCOP(parseFloat(String(order.subtotal)) || 0)}
                      </TableCell>
                      <TableCell className="text-right text-sm">
                        {formatCOP(parseFloat(String(order.shipping_cost)) || 0)}
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {formatCOP(parseFloat(String(order.total)) || 0)}
                      </TableCell>
                      <TableCell className="text-right text-sm">
                        {Array.isArray(order.items) ? order.items.length : 0}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {/* Orders by status summary */}
          {Object.keys(stats.byStatus).length > 0 && (
            <div className="flex flex-wrap gap-2 mt-3">
              {Object.entries(stats.byStatus).map(([status, count]) => (
                <Badge key={status} variant="outline" className="text-xs">
                  {statusLabels[status] || status}: {count}
                </Badge>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Top Products */}
        <TabsContent value="products">
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>#</TableHead>
                  <TableHead>Producto</TableHead>
                  <TableHead className="text-right">Cantidad Total</TableHead>
                  <TableHead className="text-right">Ingresos</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {stats.topProducts.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                      Sin datos de productos
                    </TableCell>
                  </TableRow>
                ) : (
                  stats.topProducts.map((product, i) => (
                    <TableRow key={i}>
                      <TableCell className="text-muted-foreground">{i + 1}</TableCell>
                      <TableCell className="font-medium">{product.name}</TableCell>
                      <TableCell className="text-right">{product.quantity}</TableCell>
                      <TableCell className="text-right font-medium">
                        {formatCOP(product.revenue)}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </TabsContent>

        {/* Monthly Purchases */}
        <TabsContent value="monthly">
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Mes</TableHead>
                  <TableHead className="text-right">Órdenes</TableHead>
                  <TableHead className="text-right">Ingresos</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {Object.entries(stats.monthlyOrders)
                  .reverse()
                  .map(([month, data]) => {
                    const [y, m] = month.split("-")
                    const monthName = new Date(parseInt(y), parseInt(m) - 1)
                      .toLocaleDateString("es-CO", { month: "long", year: "numeric" })
                    return (
                      <TableRow key={month}>
                        <TableCell className="font-medium capitalize">{monthName}</TableCell>
                        <TableCell className="text-right">{data.count}</TableCell>
                        <TableCell className="text-right font-medium">
                          {data.revenue > 0 ? formatCOP(data.revenue) : "—"}
                        </TableCell>
                      </TableRow>
                    )
                  })}
              </TableBody>
            </Table>
          </div>
        </TabsContent>

        {/* Client Info */}
        <TabsContent value="info">
          <div className="grid gap-6 md:grid-cols-2">
            {/* Contact Info */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Información de Contacto</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-3">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <span>{userProfile?.full_name || "Sin nombre"}</span>
                </div>
                <div className="flex items-center gap-3">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <span>{userProfile?.phone || distributor.contact_phone || "Sin teléfono"}</span>
                </div>
                <div className="flex items-center gap-3">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <span>{distributor.contact_email || "Sin email"}</span>
                </div>
                {distributor.contact_position && (
                  <div className="flex items-center gap-3">
                    <Building2 className="h-4 w-4 text-muted-foreground" />
                    <span>{distributor.contact_position}</span>
                  </div>
                )}
                {(userProfile?.document_type || userProfile?.document_number) && (
                  <div className="flex items-center gap-3">
                    <FileText className="h-4 w-4 text-muted-foreground" />
                    <span>
                      {userProfile.document_type}: {userProfile.document_number}
                    </span>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Company Info */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Información Comercial</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <span className="text-muted-foreground">Razón Social</span>
                  <span className="font-medium">{distributor.company_name}</span>

                  {distributor.commercial_name && (
                    <>
                      <span className="text-muted-foreground">Nombre Comercial</span>
                      <span>{distributor.commercial_name}</span>
                    </>
                  )}

                  {distributor.company_rif && (
                    <>
                      <span className="text-muted-foreground">NIT</span>
                      <span>{distributor.company_rif}</span>
                    </>
                  )}

                  <span className="text-muted-foreground">Tipo de Negocio</span>
                  <span>{distributor.business_type || "Sin definir"}</span>

                  <span className="text-muted-foreground">Aliado</span>
                  <span>{aliado ? aliado.company_name : "Cliente directo"}</span>

                  {distributor.discount_percentage > 0 && (
                    <>
                      <span className="text-muted-foreground">Descuento</span>
                      <span>{distributor.discount_percentage}%</span>
                    </>
                  )}

                  {distributor.payment_terms && (
                    <>
                      <span className="text-muted-foreground">Términos de Pago</span>
                      <span>{distributor.payment_terms}</span>
                    </>
                  )}

                  {distributor.credit_limit > 0 && (
                    <>
                      <span className="text-muted-foreground">Límite de Crédito</span>
                      <span>{formatCOP(distributor.credit_limit)}</span>
                    </>
                  )}
                </div>

                {distributor.notes && (
                  <div className="pt-2 border-t">
                    <span className="text-sm text-muted-foreground">Notas:</span>
                    <p className="text-sm mt-1">{distributor.notes}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="md:col-span-2">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Documentos del Distribuidor
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant={reminderVariantByStatus[resolvedDocumentReminder.status]}>
                    {reminderLabelByStatus[resolvedDocumentReminder.status]}
                  </Badge>
                  <span className="text-sm text-muted-foreground">{resolvedDocumentReminder.message}</span>
                </div>

                {resolvedDocumentReminder.status !== "ok" && (
                  <div className="flex items-start gap-2 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-amber-900">
                    <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                    <p className="text-sm">
                      Recordatorio anual: Estados Financieros, RUT y Cámara de Comercio se renuevan cada 12
                      meses para mantener condiciones comerciales y de crédito.
                    </p>
                  </div>
                )}

                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Documento</TableHead>
                        <TableHead>Estado</TableHead>
                        <TableHead>Cargado</TableHead>
                        <TableHead>Próxima renovación</TableHead>
                        <TableHead>Archivo</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {DISTRIBUTOR_DOCUMENT_DEFINITIONS.map((definition) => {
                        const item = resolvedDocumentReminder.items.find((entry) => entry.type === definition.type)
                        return (
                          <TableRow key={definition.type}>
                            <TableCell className="font-medium">
                              <div className="flex items-center gap-2">
                                {item?.status === "ok" ? (
                                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                                ) : (
                                  <CalendarClock className="h-4 w-4 text-muted-foreground" />
                                )}
                                <span>{definition.label}</span>
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge variant={reminderVariantByStatus[item?.status || "missing"]}>
                                {reminderLabelByStatus[item?.status || "missing"]}
                              </Badge>
                            </TableCell>
                            <TableCell>{formatDate(item?.uploaded_at)}</TableCell>
                            <TableCell>
                              <div className="text-sm">
                                <div>{formatDate(item?.due_at)}</div>
                                {typeof item?.days_until_due === "number" && (
                                  <p className="text-xs text-muted-foreground">
                                    {item.days_until_due >= 0
                                      ? `En ${item.days_until_due} día(s)`
                                      : `Vencido hace ${Math.abs(item.days_until_due)} día(s)`}
                                  </p>
                                )}
                              </div>
                            </TableCell>
                            <TableCell>
                              {item?.file_url ? (
                                <a
                                  href={item.file_url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-primary hover:underline text-sm"
                                >
                                  Ver archivo
                                </a>
                              ) : (
                                <span className="text-sm text-muted-foreground">No cargado</span>
                              )}
                            </TableCell>
                          </TableRow>
                        )
                      })}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>

            {/* Addresses */}
            {addresses.length > 0 && (
              <Card className="md:col-span-2">
                <CardHeader>
                  <CardTitle className="text-lg">Direcciones de Envío</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-3 md:grid-cols-2">
                    {addresses.map((addr: any) => (
                      <div
                        key={addr.id}
                        className="flex items-start gap-3 p-3 rounded-lg border bg-muted/30"
                      >
                        <MapPin className="h-4 w-4 mt-0.5 text-muted-foreground shrink-0" />
                        <div className="text-sm">
                          <div className="font-medium">
                            {addr.label}
                            {addr.is_default && (
                              <Badge variant="secondary" className="ml-2 text-xs">
                                Principal
                              </Badge>
                            )}
                          </div>
                          <div className="text-muted-foreground">
                            {addr.address_line1}
                            {addr.address_line2 && `, ${addr.address_line2}`}
                          </div>
                          <div className="text-muted-foreground">
                            {addr.city}, {addr.state}
                          </div>
                          {addr.phone && (
                            <div className="text-muted-foreground">Tel: {addr.phone}</div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
