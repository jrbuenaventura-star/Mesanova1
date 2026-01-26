"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Trash2, Save } from "lucide-react"
import Image from "next/image"
import type { Company } from "@/lib/db/types"
import { getImageKitUrl } from "@/lib/imagekit"

interface Product {
  id: string
  pdt_codigo: string
  pdt_descripcion: string
  nombre_comercial?: string
  precio?: number
  imagen_principal_url?: string
  upp_existencia: number
}

interface OrderItem {
  product_id: string
  product: Product
  quantity: number
  unit_price: number
  subtotal: number
}

interface CreateOrderFormProps {
  distributorId: string
  companies: Company[]
  products: Product[]
  userId: string
}

export default function CreateOrderForm({ distributorId, companies, products, userId }: CreateOrderFormProps) {
  const router = useRouter()
  const [selectedCompanyId, setSelectedCompanyId] = useState("")
  const [orderItems, setOrderItems] = useState<OrderItem[]>([])
  const [notes, setNotes] = useState("")
  const [shippingAddress, setShippingAddress] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  const IVA_PORCENTAJE = 19

  // Agregar producto a la orden
  const handleAddProduct = (productId: string) => {
    const product = products.find((p) => p.id === productId)
    if (!product || !product.precio) return

    const existingItem = orderItems.find((item) => item.product_id === productId)
    if (existingItem) {
      handleUpdateQuantity(productId, existingItem.quantity + 1)
      return
    }

    const newItem: OrderItem = {
      product_id: productId,
      product,
      quantity: 1,
      unit_price: product.precio,
      subtotal: product.precio,
    }

    setOrderItems([...orderItems, newItem])
  }

  // Actualizar cantidad
  const handleUpdateQuantity = (productId: string, quantity: number) => {
    if (quantity < 1) {
      handleRemoveItem(productId)
      return
    }

    setOrderItems((items) =>
      items.map((item) =>
        item.product_id === productId ? { ...item, quantity, subtotal: item.unit_price * quantity } : item,
      ),
    )
  }

  // Eliminar item
  const handleRemoveItem = (productId: string) => {
    setOrderItems((items) => items.filter((item) => item.product_id !== productId))
  }

  // Calcular totales
  const subtotal = orderItems.reduce((sum, item) => sum + item.subtotal, 0)
  const taxAmount = subtotal * (IVA_PORCENTAJE / 100)
  const total = subtotal + taxAmount

  // Crear orden
  const handleSubmit = async () => {
    if (!selectedCompanyId) {
      alert("Por favor selecciona un cliente")
      return
    }

    if (orderItems.length === 0) {
      alert("Por favor agrega al menos un producto")
      return
    }

    setIsLoading(true)
    const supabase = createClient()

    try {
      // Generar número de orden
      const orderNumber = `ORD-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`

      // Crear orden
      const { data: newOrder, error: orderError } = await supabase
        .from("orders")
        .insert({
          order_number: orderNumber,
          user_id: userId,
          distributor_id: distributorId,
          company_id: selectedCompanyId,
          emisor: "Alumar SAS",
          fecha_pedido: new Date().toISOString().split("T")[0],
          status: "pending_approval",
          payment_status: "pending",
          subtotal,
          discount_amount: 0,
          tax_amount: taxAmount,
          iva_porcentaje: IVA_PORCENTAJE,
          shipping_cost: 0,
          total,
          shipping_address: shippingAddress || null,
          notes: notes || null,
        })
        .select()
        .single()

      if (orderError) throw orderError

      // Crear items
      const items = orderItems.map((item) => ({
        order_id: newOrder.id,
        product_id: item.product_id,
        product_code: item.product.pdt_codigo,
        product_name: item.product.nombre_comercial || item.product.pdt_descripcion,
        quantity: item.quantity,
        unit_price: item.unit_price,
        discount_percentage: 0,
        discount_amount: 0,
        subtotal: item.subtotal,
      }))

      const { error: itemsError } = await supabase.from("order_items").insert(items)

      if (itemsError) throw itemsError

      alert("Orden creada exitosamente")
      router.push("/distributor/orders")
    } catch (error) {
      console.error("[v0] Error creating order:", error)
      alert("Error al crear la orden")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Selección de cliente */}
      <Card>
        <CardHeader>
          <CardTitle>Información del Cliente</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="company">Cliente *</Label>
            <Select value={selectedCompanyId} onValueChange={setSelectedCompanyId}>
              <SelectTrigger>
                <SelectValue placeholder="Selecciona un cliente" />
              </SelectTrigger>
              <SelectContent>
                {companies.map((company) => (
                  <SelectItem key={company.id} value={company.id}>
                    {company.razon_social} - NIT: {company.nit}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="address">Dirección de Envío</Label>
            <Input
              id="address"
              value={shippingAddress}
              onChange={(e) => setShippingAddress(e.target.value)}
              placeholder="Ingresa la dirección de envío"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="notes">Notas e Instrucciones Especiales</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Comentarios adicionales sobre el pedido..."
              rows={3}
            />
          </div>
        </CardContent>
      </Card>

      {/* Selección de productos */}
      <Card>
        <CardHeader>
          <CardTitle>Productos</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Agregar Producto</Label>
            <Select onValueChange={handleAddProduct}>
              <SelectTrigger>
                <SelectValue placeholder="Selecciona un producto" />
              </SelectTrigger>
              <SelectContent>
                {products.map((product) => (
                  <SelectItem key={product.id} value={product.id}>
                    {product.pdt_codigo} - {product.nombre_comercial || product.pdt_descripcion} - $
                    {product.precio?.toLocaleString()}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Tabla de productos */}
          {orderItems.length > 0 && (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[80px]">Imagen</TableHead>
                    <TableHead>SKU</TableHead>
                    <TableHead>Descripción</TableHead>
                    <TableHead>Precio Unit.</TableHead>
                    <TableHead>Cantidad</TableHead>
                    <TableHead>Subtotal</TableHead>
                    <TableHead className="w-[80px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {orderItems.map((item) => (
                    <TableRow key={item.product_id}>
                      <TableCell>
                        <div className="relative h-12 w-12 overflow-hidden rounded-md border">
                          {item.product.imagen_principal_url ? (
                            <Image
                              src={getImageKitUrl(item.product.imagen_principal_url, { width: 96, height: 96, quality: 70, format: "auto" })}
                              alt={item.product.nombre_comercial || item.product.pdt_descripcion}
                              fill
                              className="object-cover"
                            />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center bg-muted text-xs">
                              Sin imagen
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="font-mono">{item.product.pdt_codigo}</TableCell>
                      <TableCell>{item.product.nombre_comercial || item.product.pdt_descripcion}</TableCell>
                      <TableCell>${item.unit_price.toLocaleString()}</TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          min="1"
                          value={item.quantity}
                          onChange={(e) => handleUpdateQuantity(item.product_id, Number.parseInt(e.target.value))}
                          className="w-20"
                        />
                      </TableCell>
                      <TableCell className="font-medium">${item.subtotal.toLocaleString()}</TableCell>
                      <TableCell>
                        <Button variant="ghost" size="icon" onClick={() => handleRemoveItem(item.product_id)}>
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Totales */}
      {orderItems.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Resumen de la Orden</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span>Subtotal:</span>
                <span className="font-medium">${subtotal.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span>IVA ({IVA_PORCENTAJE}%):</span>
                <span className="font-medium">${taxAmount.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-lg font-bold border-t pt-2">
                <span>Total:</span>
                <span>${total.toLocaleString()}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Botones de acción */}
      <div className="flex justify-end gap-4">
        <Button variant="outline" onClick={() => router.back()} disabled={isLoading}>
          Cancelar
        </Button>
        <Button onClick={handleSubmit} disabled={isLoading || orderItems.length === 0}>
          <Save className="mr-2 h-4 w-4" />
          {isLoading ? "Creando..." : "Crear Orden"}
        </Button>
      </div>
    </div>
  )
}
