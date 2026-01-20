"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { CheckCircle, XCircle, Eye, Building2, User, Calendar, DollarSign, Loader2 } from "lucide-react"
import type { OrderWithItems } from "@/lib/db/types"

interface OrdersApprovalProps {
  orders: OrderWithItems[]
  userId: string
}

export function OrdersApproval({ orders, userId }: OrdersApprovalProps) {
  const router = useRouter()
  const supabase = createClient()
  
  const [selectedOrder, setSelectedOrder] = useState<OrderWithItems | null>(null)
  const [showApprovalDialog, setShowApprovalDialog] = useState(false)
  const [approvalAction, setApprovalAction] = useState<"approve" | "reject" | null>(null)
  const [rejectionReason, setRejectionReason] = useState("")
  const [isProcessing, setIsProcessing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const openApprovalDialog = (order: OrderWithItems, action: "approve" | "reject") => {
    setSelectedOrder(order)
    setApprovalAction(action)
    setShowApprovalDialog(true)
    setRejectionReason("")
    setError(null)
  }

  const handleApproval = async () => {
    if (!selectedOrder || !approvalAction) return

    if (approvalAction === "reject" && !rejectionReason.trim()) {
      setError("Debes proporcionar una razón para rechazar la orden")
      return
    }

    setIsProcessing(true)
    setError(null)

    try {
      const updateData: any = {
        approved_by: userId,
        approved_at: new Date().toISOString(),
      }

      if (approvalAction === "approve") {
        updateData.status = "aprobada"
      } else {
        updateData.status = "cancelada"
        updateData.rejected_reason = rejectionReason
        updateData.rejected_at = new Date().toISOString()
      }

      const { error: updateError } = await supabase
        .from("orders")
        .update(updateData)
        .eq("id", selectedOrder.id)

      if (updateError) throw updateError

      // TODO: Enviar email de notificación al aliado y distribuidor

      setShowApprovalDialog(false)
      setSelectedOrder(null)
      router.refresh()
    } catch (err) {
      console.error("Error processing approval:", err)
      setError(err instanceof Error ? err.message : "Error al procesar la aprobación")
    } finally {
      setIsProcessing(false)
    }
  }

  const pendingOrders = orders.filter(o => o.status === "por_aprobar")

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Órdenes Pendientes de Aprobación</CardTitle>
          <CardDescription>
            Revisa y aprueba las órdenes creadas por aliados
          </CardDescription>
        </CardHeader>
        <CardContent>
          {pendingOrders.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <CheckCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="text-lg font-medium">No hay órdenes pendientes de aprobación</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Orden</TableHead>
                  <TableHead>Aliado</TableHead>
                  <TableHead>Distribuidor</TableHead>
                  <TableHead>Fecha</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead>Descuento</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pendingOrders.map((order) => (
                  <TableRow key={order.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{order.order_number || order.id.slice(0, 8)}</p>
                        <Badge variant="outline" className="mt-1">
                          Por Aprobar
                        </Badge>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">
                          {order.aliado?.company_name || "N/A"}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Building2 className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">
                          {order.distributor?.company_name || order.customer_name}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2 text-sm">
                        <Calendar className="h-3 w-3 text-muted-foreground" />
                        {new Date(order.fecha_pedido).toLocaleDateString()}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <DollarSign className="h-4 w-4 text-muted-foreground" />
                        <span className="font-bold">${order.total.toFixed(2)}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      {order.discount_percentage ? (
                        <Badge variant="secondary">
                          {order.discount_percentage}%
                        </Badge>
                      ) : (
                        <span className="text-muted-foreground text-sm">N/A</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex gap-2 justify-end">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setSelectedOrder(order)}
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          Ver
                        </Button>
                        <Button
                          variant="default"
                          size="sm"
                          onClick={() => openApprovalDialog(order, "approve")}
                        >
                          <CheckCircle className="h-4 w-4 mr-1" />
                          Aprobar
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => openApprovalDialog(order, "reject")}
                        >
                          <XCircle className="h-4 w-4 mr-1" />
                          Rechazar
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Dialog de confirmación */}
      <Dialog open={showApprovalDialog} onOpenChange={setShowApprovalDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {approvalAction === "approve" ? "Aprobar Orden" : "Rechazar Orden"}
            </DialogTitle>
            <DialogDescription>
              {approvalAction === "approve"
                ? "¿Estás seguro de que deseas aprobar esta orden?"
                : "Proporciona una razón para rechazar esta orden"}
            </DialogDescription>
          </DialogHeader>

          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {selectedOrder && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Orden</p>
                  <p className="font-medium">{selectedOrder.order_number || selectedOrder.id.slice(0, 8)}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Total</p>
                  <p className="font-bold">${selectedOrder.total.toFixed(2)}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Aliado</p>
                  <p className="font-medium">{selectedOrder.aliado?.company_name || "N/A"}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Distribuidor</p>
                  <p className="font-medium">
                    {selectedOrder.distributor?.company_name || selectedOrder.customer_name}
                  </p>
                </div>
              </div>

              {approvalAction === "reject" && (
                <div>
                  <label className="text-sm font-medium">Razón del rechazo *</label>
                  <Textarea
                    placeholder="Explica por qué se rechaza esta orden..."
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    rows={4}
                    className="mt-2"
                  />
                </div>
              )}
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowApprovalDialog(false)}
              disabled={isProcessing}
            >
              Cancelar
            </Button>
            <Button
              variant={approvalAction === "approve" ? "default" : "destructive"}
              onClick={handleApproval}
              disabled={isProcessing}
            >
              {isProcessing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Procesando...
                </>
              ) : approvalAction === "approve" ? (
                <>
                  <CheckCircle className="mr-2 h-4 w-4" />
                  Aprobar
                </>
              ) : (
                <>
                  <XCircle className="mr-2 h-4 w-4" />
                  Rechazar
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog de detalles de orden */}
      {selectedOrder && !showApprovalDialog && (
        <Dialog open={!!selectedOrder} onOpenChange={() => setSelectedOrder(null)}>
          <DialogContent className="max-w-3xl">
            <DialogHeader>
              <DialogTitle>Detalles de la Orden</DialogTitle>
              <DialogDescription>
                Orden #{selectedOrder.order_number || selectedOrder.id.slice(0, 8)}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm">Información General</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2 text-sm">
                    <div>
                      <p className="text-muted-foreground">Aliado</p>
                      <p className="font-medium">{selectedOrder.aliado?.company_name || "N/A"}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Distribuidor</p>
                      <p className="font-medium">
                        {selectedOrder.distributor?.company_name || selectedOrder.customer_name}
                      </p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Fecha</p>
                      <p className="font-medium">
                        {new Date(selectedOrder.fecha_pedido).toLocaleDateString()}
                      </p>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm">Totales</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Subtotal</span>
                      <span className="font-medium">${selectedOrder.subtotal.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Descuento</span>
                      <span className="font-medium">
                        {selectedOrder.discount_percentage}%
                      </span>
                    </div>
                    <div className="flex justify-between font-bold">
                      <span>Total</span>
                      <span>${selectedOrder.total.toFixed(2)}</span>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {selectedOrder.notes && (
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm">Notas</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm">{selectedOrder.notes}</p>
                  </CardContent>
                </Card>
              )}

              {selectedOrder.items && selectedOrder.items.length > 0 && (
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm">Productos ({selectedOrder.items.length})</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Producto</TableHead>
                          <TableHead className="text-right">Cantidad</TableHead>
                          <TableHead className="text-right">Precio Unit.</TableHead>
                          <TableHead className="text-right">Subtotal</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {selectedOrder.items.map((item) => (
                          <TableRow key={item.id}>
                            <TableCell>
                              <div>
                                <p className="font-medium text-sm">
                                  {item.product_name || item.product?.nombre_comercial}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  {item.product_code || item.product?.pdt_codigo}
                                </p>
                              </div>
                            </TableCell>
                            <TableCell className="text-right">{item.quantity}</TableCell>
                            <TableCell className="text-right">${item.unit_price.toFixed(2)}</TableCell>
                            <TableCell className="text-right font-medium">
                              ${item.subtotal.toFixed(2)}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              )}
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setSelectedOrder(null)}>
                Cerrar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}
