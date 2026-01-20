"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Plus, Trash2, ShoppingCart, AlertCircle, Loader2 } from "lucide-react"
import { Badge } from "@/components/ui/badge"

type Distributor = {
  id: string
  company_name: string
  discount_percentage: number
  contact_email?: string
  contact_phone?: string
  is_active: boolean
  user_id: string
}

type Product = {
  id: string
  pdt_codigo: string
  nombre_comercial: string
  precio: number
  upp_existencia: number
}

type OrderItem = {
  product_id: string
  product_code: string
  product_name: string
  quantity: number
  unit_price: number
  discount_percentage: number
  subtotal: number
}

interface CreateOrderForDistributorFormProps {
  distributors: Distributor[]
  aliadoId: string
}

export function CreateOrderForDistributorForm({ distributors, aliadoId }: CreateOrderForDistributorFormProps) {
  const router = useRouter()
  const supabase = createClient()
  
  const [selectedDistributorId, setSelectedDistributorId] = useState<string>("")
  const [products, setProducts] = useState<Product[]>([])
  const [orderItems, setOrderItems] = useState<OrderItem[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [notes, setNotes] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [isSearching, setIsSearching] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const selectedDistributor = distributors.find(d => d.id === selectedDistributorId)

  const searchProducts = async (term: string) => {
    if (term.length < 2) {
      setProducts([])
      return
    }

    setIsSearching(true)
    try {
      const { data, error } = await supabase
        .from("products")
        .select("id, pdt_codigo, nombre_comercial, precio, upp_existencia")
        .or(`pdt_codigo.ilike.%${term}%,nombre_comercial.ilike.%${term}%`)
        .eq("is_active", true)
        .limit(10)

      if (error) throw error
      setProducts(data || [])
    } catch (err) {
      console.error("Error searching products:", err)
    } finally {
      setIsSearching(false)
    }
  }

  const addProductToOrder = (product: Product) => {
    const existingItem = orderItems.find(item => item.product_id === product.id)
    
    if (existingItem) {
      setOrderItems(orderItems.map(item =>
        item.product_id === product.id
          ? { ...item, quantity: item.quantity + 1, subtotal: (item.quantity + 1) * item.unit_price }
          : item
      ))
    } else {
      const discountPercentage = selectedDistributor?.discount_percentage || 0
      const unitPrice = product.precio || 0
      const discountedPrice = unitPrice * (1 - discountPercentage / 100)
      
      setOrderItems([...orderItems, {
        product_id: product.id,
        product_code: product.pdt_codigo,
        product_name: product.nombre_comercial || product.pdt_codigo,
        quantity: 1,
        unit_price: discountedPrice,
        discount_percentage: discountPercentage,
        subtotal: discountedPrice
      }])
    }
    
    setSearchTerm("")
    setProducts([])
  }

  const updateItemQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      removeItem(productId)
      return
    }
    
    setOrderItems(orderItems.map(item =>
      item.product_id === productId
        ? { ...item, quantity, subtotal: quantity * item.unit_price }
        : item
    ))
  }

  const removeItem = (productId: string) => {
    setOrderItems(orderItems.filter(item => item.product_id !== productId))
  }

  const calculateTotal = () => {
    return orderItems.reduce((sum, item) => sum + item.subtotal, 0)
  }

  const handleSubmit = async () => {
    if (!selectedDistributorId) {
      setError("Debes seleccionar un distribuidor")
      return
    }

    if (orderItems.length === 0) {
      setError("Debes agregar al menos un producto")
      return
    }

    setIsLoading(true)
    setError(null)
    setSuccess(null)

    try {
      const distributor = distributors.find(d => d.id === selectedDistributorId)
      if (!distributor) throw new Error("Distribuidor no encontrado")

      const total = calculateTotal()
      const orderNumber = `ORD-${Date.now()}`

      // Crear la orden
      const { data: order, error: orderError } = await supabase
        .from("orders")
        .insert({
          user_id: distributor.user_id,
          distributor_id: selectedDistributorId,
          aliado_id: aliadoId,
          status: "por_aprobar",
          subtotal: total,
          discount_percentage: distributor.discount_percentage,
          shipping_cost: 0,
          total: total,
          notes: notes,
          customer_name: distributor.company_name,
          customer_email: distributor.contact_email || "",
          customer_phone: distributor.contact_phone || "",
          shipping_address: "Por definir",
          shipping_city: "Por definir",
          payment_method: "Por definir",
          shipping_method: "Por definir",
          items: orderItems
        })
        .select()
        .single()

      if (orderError) throw orderError

      // Enviar correo a atencion@alumaronline.com
      try {
        await fetch("/api/orders/send-notification", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ orderId: order.id }),
        })
      } catch (emailError) {
        console.error("Error sending email notification:", emailError)
        // No fallar la creación de la orden si el email falla
      }

      setSuccess(`Pedido ${orderNumber} creado exitosamente. Se ha enviado para aprobación.`)
      
      // Limpiar formulario
      setOrderItems([])
      setNotes("")
      setSelectedDistributorId("")
      
      // Redirigir después de 2 segundos
      setTimeout(() => {
        router.push("/aliado")
      }, 2000)
      
    } catch (err) {
      console.error("Error creating order:", err)
      setError(err instanceof Error ? err.message : "Error al crear el pedido")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {success && (
        <Alert className="bg-green-50 border-green-200">
          <AlertDescription className="text-green-800">{success}</AlertDescription>
        </Alert>
      )}

      <div className="space-y-4">
        <div>
          <Label htmlFor="distributor">Distribuidor</Label>
          <Select value={selectedDistributorId} onValueChange={setSelectedDistributorId}>
            <SelectTrigger id="distributor">
              <SelectValue placeholder="Selecciona un distribuidor" />
            </SelectTrigger>
            <SelectContent>
              {distributors.map((dist) => (
                <SelectItem key={dist.id} value={dist.id}>
                  {dist.company_name} - {dist.discount_percentage}% descuento
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {selectedDistributor && (
          <Card className="bg-muted/50">
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">Descuento del distribuidor</p>
                  <p className="text-2xl font-bold">{selectedDistributor.discount_percentage}%</p>
                </div>
                <Badge variant="default">Activo</Badge>
              </div>
            </CardContent>
          </Card>
        )}

        <div>
          <Label htmlFor="search">Buscar Productos</Label>
          <div className="relative">
            <Input
              id="search"
              placeholder="Buscar por código o nombre..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value)
                searchProducts(e.target.value)
              }}
              disabled={!selectedDistributorId}
            />
            {isSearching && (
              <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin" />
            )}
          </div>
          
          {products.length > 0 && (
            <Card className="mt-2">
              <CardContent className="p-2">
                <div className="space-y-1">
                  {products.map((product) => (
                    <button
                      key={product.id}
                      onClick={() => addProductToOrder(product)}
                      className="w-full text-left p-2 hover:bg-muted rounded-lg transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium text-sm">{product.nombre_comercial}</p>
                          <p className="text-xs text-muted-foreground">{product.pdt_codigo}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-sm">${product.precio?.toFixed(2)}</p>
                          <p className="text-xs text-muted-foreground">Stock: {product.upp_existencia}</p>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {orderItems.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Productos en el pedido</h3>
              <Badge variant="secondary">{orderItems.length} productos</Badge>
            </div>

            <div className="space-y-2">
              {orderItems.map((item) => (
                <Card key={item.product_id}>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-4">
                      <div className="flex-1">
                        <p className="font-medium">{item.product_name}</p>
                        <p className="text-sm text-muted-foreground">{item.product_code}</p>
                        <p className="text-xs text-green-600">
                          Descuento: {item.discount_percentage}%
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Input
                          type="number"
                          min="1"
                          value={item.quantity}
                          onChange={(e) => updateItemQuantity(item.product_id, parseInt(e.target.value) || 0)}
                          className="w-20"
                        />
                        <div className="text-right min-w-[100px]">
                          <p className="text-sm text-muted-foreground">${item.unit_price.toFixed(2)} c/u</p>
                          <p className="font-bold">${item.subtotal.toFixed(2)}</p>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => removeItem(item.product_id)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            <Card className="bg-primary/5">
              <CardContent className="p-4">
                <div className="flex items-center justify-between text-lg font-bold">
                  <span>Total</span>
                  <span>${calculateTotal().toFixed(2)}</span>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        <div>
          <Label htmlFor="notes">Notas del pedido (opcional)</Label>
          <Textarea
            id="notes"
            placeholder="Agrega notas o instrucciones especiales..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
          />
        </div>

        <div className="flex gap-2">
          <Button
            onClick={handleSubmit}
            disabled={isLoading || !selectedDistributorId || orderItems.length === 0}
            className="flex-1"
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creando pedido...
              </>
            ) : (
              <>
                <ShoppingCart className="mr-2 h-4 w-4" />
                Crear Pedido
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  )
}
