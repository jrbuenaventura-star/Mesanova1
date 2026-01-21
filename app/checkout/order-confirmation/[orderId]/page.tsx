"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { CheckCircle, Package, Mail, Phone } from "lucide-react"
import Link from "next/link"
import { trackPurchase } from "@/components/analytics/google-analytics"
import { trackPixelPurchase } from "@/components/analytics/meta-pixel"

export default function OrderConfirmationPage() {
  const params = useParams()
  const orderId = params.orderId as string
  const [order, setOrder] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchOrder = async () => {
      const supabase = createClient()
      const { data } = await supabase
        .from("orders")
        .select("*")
        .eq("id", orderId)
        .single()

      if (data) {
        setOrder(data)
        
        // Disparar eventos de conversión
        const items = Array.isArray(data.items) ? data.items : []
        
        // GA4 Purchase
        trackPurchase(
          data.id,
          data.total,
          items.map((item: any) => ({
            item_id: item.product_id || item.id,
            item_name: item.product_name || item.name,
            price: item.unit_price || item.price,
            quantity: item.quantity,
          })),
          "COP"
        )

        // Meta Pixel Purchase
        trackPixelPurchase(
          data.total,
          data.id,
          items.length
        )
      }
      setLoading(false)
    }

    if (orderId) {
      fetchOrder()
    }
  }, [orderId])

  if (loading) {
    return (
      <div className="container mx-auto py-16 px-4 text-center">
        <p>Cargando confirmación...</p>
      </div>
    )
  }

  if (!order) {
    return (
      <div className="container mx-auto py-16 px-4 text-center">
        <p>Orden no encontrada</p>
        <Button asChild className="mt-4">
          <Link href="/">Volver al inicio</Link>
        </Button>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-16 px-4 max-w-3xl">
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100 mb-4">
          <CheckCircle className="h-8 w-8 text-green-600" />
        </div>
        <h1 className="text-3xl font-bold mb-2">¡Gracias por tu pedido!</h1>
        <p className="text-muted-foreground">
          Tu pedido ha sido recibido exitosamente
        </p>
      </div>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Detalles del Pedido</CardTitle>
          <CardDescription>Número de pedido: {order.id.slice(0, 8)}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Fecha</p>
              <p className="font-medium">
                {order.created_at ? new Date(order.created_at).toLocaleDateString() : "N/A"}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Estado</p>
              <p className="font-medium capitalize">{order.status}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total</p>
              <p className="font-bold text-lg">${order.total.toLocaleString()} COP</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Método de pago</p>
              <p className="font-medium">{order.payment_method || "Wompi"}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {order.customer_name && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Información de Contacto</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex items-center gap-2">
              <Package className="h-4 w-4 text-muted-foreground" />
              <span>{order.customer_name}</span>
            </div>
            {order.customer_email && (
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <span>{order.customer_email}</span>
              </div>
            )}
            {order.customer_phone && (
              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-muted-foreground" />
                <span>{order.customer_phone}</span>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {order.shipping_address && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Dirección de Envío</CardTitle>
          </CardHeader>
          <CardContent>
            <p>{order.shipping_address}</p>
            {order.shipping_city && <p>{order.shipping_city}</p>}
          </CardContent>
        </Card>
      )}

      <div className="bg-blue-50 p-6 rounded-lg mb-6">
        <h3 className="font-semibold mb-2">¿Qué sigue?</h3>
        <ul className="space-y-2 text-sm">
          <li>✓ Recibirás un correo de confirmación con los detalles de tu pedido</li>
          <li>✓ Te notificaremos cuando tu pedido esté en camino</li>
          <li>✓ Puedes contactarnos por WhatsApp si tienes alguna pregunta</li>
        </ul>
      </div>

      <div className="flex gap-4 justify-center">
        <Button asChild variant="outline">
          <Link href="/">Volver al inicio</Link>
        </Button>
        <Button asChild>
          <Link href="/productos">Seguir comprando</Link>
        </Button>
      </div>
    </div>
  )
}
