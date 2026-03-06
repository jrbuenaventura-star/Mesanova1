"use client"

import { useState, useEffect, useCallback } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { Search, Plus, Eye, Check, X, Package, Truck } from "lucide-react"
import Link from "next/link"
import type { OrderWithDetails } from "@/lib/db/types"

interface OrdersManagementProps {
  userRole: "superadmin" | "distributor"
  userId: string
  distributorId?: string
}

const statusLabels: Record<string, string> = {
  borrador: "Borrador",
  por_aprobar: "Por Aprobar",
  aprobada: "Aprobada",
  en_preparacion: "En Preparación",
  enviada: "Enviada",
  entregada: "Entregada",
  cancelada: "Cancelada",
  devuelta_rechazada: "Devuelta/Rechazada",
}

const statusColors: Record<string, "secondary" | "default" | "destructive" | "outline"> = {
  borrador: "secondary",
  por_aprobar: "outline",
  aprobada: "default",
  en_preparacion: "default",
  enviada: "default",
  entregada: "default",
  cancelada: "destructive",
  devuelta_rechazada: "destructive",
}

export default function OrdersManagement({ userRole, userId, distributorId }: OrdersManagementProps) {
  const [orders, setOrders] = useState<OrderWithDetails[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [selectedOrder, setSelectedOrder] = useState<OrderWithDetails | null>(null)
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false)
  const [approvalDialogOpen, setApprovalDialogOpen] = useState(false)
  const [rejectReason, setRejectReason] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  const loadOrders = useCallback(async () => {
    const supabase = createClient()
    let ordersQuery = supabase.from("orders").select("*").order("created_at", { ascending: false })

    if (userRole === "distributor" && distributorId) {
      ordersQuery = ordersQuery.eq("distributor_id", distributorId)
    }

    const { data: baseOrders, error: ordersError } = await ordersQuery
    if (ordersError) {
      console.error("[v0] Error loading orders:", ordersError)
      setOrders([])
      return
    }

    const orderRows = (baseOrders || []) as Array<Record<string, any>>
    if (orderRows.length === 0) {
      setOrders([])
      return
    }

    const orderIds = orderRows.map((order) => order.id).filter(Boolean)
    const companyIds = Array.from(
      new Set(orderRows.map((order) => order.company_id).filter((value): value is string => !!value))
    )
    const profileIds = Array.from(
      new Set(
        orderRows
          .flatMap((order) => [order.user_id, order.approved_by])
          .filter((value): value is string => !!value)
      )
    )

    const { data: itemRows, error: itemRowsError } = await supabase
      .from("order_items")
      .select("*")
      .in("order_id", orderIds)

    if (itemRowsError) {
      console.error("[v0] Error loading order items:", itemRowsError)
      return
    }

    const productIds = Array.from(
      new Set(
        (itemRows || [])
          .map((item: any) => item.product_id)
          .filter((value: unknown): value is string => typeof value === "string" && value.length > 0)
      )
    )

    const [companiesResponse, profilesResponse, productsResponse] = await Promise.all([
      companyIds.length
        ? supabase
            .from("companies")
            .select("id, razon_social, nombre_comercial, nit, ciudad")
            .in("id", companyIds)
        : Promise.resolve({ data: [], error: null }),
      profileIds.length
        ? supabase.from("user_profiles").select("id, full_name").in("id", profileIds)
        : Promise.resolve({ data: [], error: null }),
      productIds.length
        ? supabase
            .from("products")
            .select("id, pdt_codigo, pdt_descripcion, nombre_comercial, imagen_principal_url, precio")
            .in("id", productIds)
        : Promise.resolve({ data: [], error: null }),
    ])

    if (companiesResponse.error || profilesResponse.error || productsResponse.error) {
      console.error("[v0] Error hydrating order relations:", {
        companies: companiesResponse.error,
        profiles: profilesResponse.error,
        products: productsResponse.error,
      })
      return
    }

    const companyMap = new Map((companiesResponse.data || []).map((company: any) => [company.id, company]))
    const profileMap = new Map((profilesResponse.data || []).map((profile: any) => [profile.id, profile]))
    const productMap = new Map((productsResponse.data || []).map((product: any) => [product.id, product]))

    const itemsByOrder = new Map<string, any[]>()
    for (const item of itemRows || []) {
      const current = itemsByOrder.get(item.order_id) || []
      current.push({
        ...item,
        product: item.product_id ? productMap.get(item.product_id) || null : null,
      })
      itemsByOrder.set(item.order_id, current)
    }

    const hydratedOrders = orderRows.map((order) => ({
      ...order,
      items: itemsByOrder.get(order.id) || [],
      company: order.company_id ? companyMap.get(order.company_id) || null : null,
      user: order.user_id ? profileMap.get(order.user_id) || null : null,
      approved_by_user: order.approved_by ? profileMap.get(order.approved_by) || null : null,
    }))

    setOrders(hydratedOrders as unknown as OrderWithDetails[])
  }, [distributorId, userRole])

  // Cargar órdenes
  useEffect(() => {
    void loadOrders()
  }, [loadOrders])

  // Filtrar órdenes
  const filteredOrders = orders.filter((order) => {
    const term = searchTerm.toLowerCase()
    const matchesSearch =
      order.order_number?.toLowerCase().includes(term) ||
      order.company?.razon_social?.toLowerCase().includes(term) ||
      order.company?.nit?.toLowerCase().includes(term)

    const matchesStatus = statusFilter === "all" || order.status === statusFilter

    return matchesSearch && matchesStatus
  })

  // Abrir detalles de orden
  const handleViewDetails = (order: OrderWithDetails) => {
    setSelectedOrder(order)
    setDetailsDialogOpen(true)
  }

  // Aprobar orden
  const handleApprove = async () => {
    if (!selectedOrder) return

    setIsLoading(true)
    const supabase = createClient()

    const { error } = await supabase
      .from("orders")
      .update({
        status: "approved",
        approved_at: new Date().toISOString(),
        approved_by: userId,
      })
      .eq("id", selectedOrder.id)

    if (error) {
      console.error("[v0] Error approving order:", error)
      alert("Error al aprobar la orden")
    } else {
      loadOrders()
      setApprovalDialogOpen(false)
      setDetailsDialogOpen(false)
    }

    setIsLoading(false)
  }

  // Rechazar orden
  const handleReject = async () => {
    if (!selectedOrder || !rejectReason.trim()) {
      alert("Por favor ingresa un motivo de rechazo")
      return
    }

    setIsLoading(true)
    const supabase = createClient()

    const { error } = await supabase
      .from("orders")
      .update({
        status: "cancelled",
        rejected_at: new Date().toISOString(),
        rejected_reason: rejectReason,
      })
      .eq("id", selectedOrder.id)

    if (error) {
      console.error("[v0] Error rejecting order:", error)
      alert("Error al rechazar la orden")
    } else {
      loadOrders()
      setApprovalDialogOpen(false)
      setDetailsDialogOpen(false)
      setRejectReason("")
    }

    setIsLoading(false)
  }

  // Actualizar estado
  const handleUpdateStatus = async (orderId: string, newStatus: string) => {
    setIsLoading(true)
    const supabase = createClient()

    const updates: any = { status: newStatus }

    if (newStatus === "shipped") {
      updates.shipped_at = new Date().toISOString()
    } else if (newStatus === "delivered") {
      updates.delivered_at = new Date().toISOString()
    }

    const { error } = await supabase.from("orders").update(updates).eq("id", orderId)

    if (error) {
      console.error("[v0] Error updating status:", error)
      alert("Error al actualizar el estado")
    } else {
      loadOrders()
    }

    setIsLoading(false)
  }

  return (
    <div className="space-y-4">
      {/* Barra de acciones */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar por número de orden, cliente, NIT..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Filtrar por estado" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos los estados</SelectItem>
            <SelectItem value="draft">Borrador</SelectItem>
            <SelectItem value="pending_approval">Por Aprobar</SelectItem>
            <SelectItem value="approved">Aprobada</SelectItem>
            <SelectItem value="in_preparation">En Preparación</SelectItem>
            <SelectItem value="shipped">Enviada</SelectItem>
            <SelectItem value="delivered">Entregada</SelectItem>
            <SelectItem value="cancelled">Cancelada</SelectItem>
            <SelectItem value="returned">Devuelta/Rechazada</SelectItem>
          </SelectContent>
        </Select>
        {userRole === "distributor" && (
          <Button asChild>
            <Link href="/distributor/orders/nueva">
              <Plus className="mr-2 h-4 w-4" />
              Nueva orden
            </Link>
          </Button>
        )}
      </div>

      {/* Tabla de órdenes */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Número</TableHead>
              <TableHead>Fecha</TableHead>
              <TableHead>Cliente</TableHead>
              <TableHead>Total</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead>Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredOrders.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center">
                  No se encontraron órdenes.
                </TableCell>
              </TableRow>
            ) : (
              filteredOrders.map((order) => (
                <TableRow key={order.id}>
                  <TableCell className="font-mono font-medium">{order.order_number}</TableCell>
                  <TableCell>{new Date(order.fecha_pedido).toLocaleDateString()}</TableCell>
                  <TableCell>
                    {order.company ? (
                      <div>
                        <div className="font-medium">{order.company.razon_social}</div>
                        <div className="text-sm text-muted-foreground">NIT: {order.company.nit}</div>
                      </div>
                    ) : (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </TableCell>
                  <TableCell className="font-medium">${order.total.toLocaleString()}</TableCell>
                  <TableCell>
                    <Badge variant={statusColors[order.status] || "secondary"}>
                      {statusLabels[order.status] || order.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Button variant="ghost" size="sm" onClick={() => handleViewDetails(order)} aria-label="Ver">
                        <Eye className="h-4 w-4" />
                      </Button>
                      {userRole === "superadmin" && order.status === "por_aprobar" && (
                        <>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setSelectedOrder(order)
                              setApprovalDialogOpen(true)
                            }}
                           aria-label="Confirmar">
                            <Check className="h-4 w-4 text-green-600" />
                          </Button>
                        </>
                      )}
                      {userRole === "superadmin" && order.status === "aprobada" && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleUpdateStatus(order.id, "en_preparacion")}
                         aria-label="Acción">
                          <Package className="h-4 w-4" />
                        </Button>
                      )}
                      {userRole === "superadmin" && order.status === "en_preparacion" && (
                        <Button variant="ghost" size="sm" onClick={() => handleUpdateStatus(order.id, "enviada")} aria-label="Acción">
                          <Truck className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Dialog de detalles */}
      <Dialog open={detailsDialogOpen} onOpenChange={setDetailsDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Detalles de la Orden</DialogTitle>
            <DialogDescription>Orden #{selectedOrder?.order_number}</DialogDescription>
          </DialogHeader>
          {selectedOrder && (
            <div className="space-y-6">
              {/* Información general */}
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <h3 className="font-semibold mb-2">Información del Cliente</h3>
                  <div className="space-y-1 text-sm">
                    <p>
                      <strong>Razón Social:</strong> {selectedOrder.company?.razon_social}
                    </p>
                    <p>
                      <strong>NIT:</strong> {selectedOrder.company?.nit}
                    </p>
                    {selectedOrder.company?.ciudad && (
                      <p>
                        <strong>Ciudad:</strong> {selectedOrder.company.ciudad}
                      </p>
                    )}
                    {selectedOrder.shipping_address && (
                      <p>
                        <strong>Dirección:</strong> {selectedOrder.shipping_address}
                      </p>
                    )}
                  </div>
                </div>
                <div>
                  <h3 className="font-semibold mb-2">Información de la Orden</h3>
                  <div className="space-y-1 text-sm">
                    <p>
                      <strong>Emisor:</strong> {selectedOrder.emisor}
                    </p>
                    <p>
                      <strong>Fecha:</strong> {new Date(selectedOrder.fecha_pedido).toLocaleDateString()}
                    </p>
                    <p>
                      <strong>Estado:</strong>{" "}
                      <Badge variant={statusColors[selectedOrder.status]}>{statusLabels[selectedOrder.status]}</Badge>
                    </p>
                    {selectedOrder.notes && (
                      <p>
                        <strong>Notas:</strong> {selectedOrder.notes}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Productos */}
              <div>
                <h3 className="font-semibold mb-2">Productos</h3>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>SKU</TableHead>
                      <TableHead>Descripción</TableHead>
                      <TableHead>Cantidad</TableHead>
                      <TableHead>Precio Unit.</TableHead>
                      <TableHead>Subtotal</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {selectedOrder.items?.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell className="font-mono">{item.product?.pdt_codigo}</TableCell>
                        <TableCell>{item.product?.nombre_comercial || item.product?.pdt_descripcion}</TableCell>
                        <TableCell>{item.quantity}</TableCell>
                        <TableCell>${item.unit_price.toLocaleString()}</TableCell>
                        <TableCell>${item.subtotal.toLocaleString()}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Totales */}
              <div className="border-t pt-4">
                <div className="flex flex-col items-end space-y-2">
                  <div className="flex justify-between w-64">
                    <span>Subtotal:</span>
                    <span className="font-medium">${selectedOrder.subtotal.toLocaleString()}</span>
                  </div>
                  {selectedOrder.discount_amount > 0 && (
                    <div className="flex justify-between w-64 text-green-600">
                      <span>Descuento:</span>
                      <span className="font-medium">-${selectedOrder.discount_amount.toLocaleString()}</span>
                    </div>
                  )}
                  <div className="flex justify-between w-64">
                    <span>IVA ({selectedOrder.iva_porcentaje}%):</span>
                    <span className="font-medium">${selectedOrder.tax_amount.toLocaleString()}</span>
                  </div>
                  {selectedOrder.shipping_cost > 0 && (
                    <div className="flex justify-between w-64">
                      <span>Envío:</span>
                      <span className="font-medium">${selectedOrder.shipping_cost.toLocaleString()}</span>
                    </div>
                  )}
                  <div className="flex justify-between w-64 text-lg font-bold border-t pt-2">
                    <span>Total:</span>
                    <span>${selectedOrder.total.toLocaleString()}</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Dialog de aprobación/rechazo */}
      <Dialog open={approvalDialogOpen} onOpenChange={setApprovalDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Aprobar o Rechazar Orden</DialogTitle>
            <DialogDescription>Orden #{selectedOrder?.order_number}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm">¿Deseas aprobar o rechazar esta orden?</p>
            <div className="space-y-2">
              <Label htmlFor="reject-reason">Motivo de rechazo (opcional si apruebas)</Label>
              <Textarea
                id="reject-reason"
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="Ingresa el motivo si vas a rechazar..."
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setApprovalDialogOpen(false)} disabled={isLoading}>
              Cancelar
            </Button>
            <Button variant="destructive" onClick={handleReject} disabled={isLoading}>
              <X className="mr-2 h-4 w-4" />
              Rechazar
            </Button>
            <Button onClick={handleApprove} disabled={isLoading}>
              <Check className="mr-2 h-4 w-4" />
              Aprobar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
