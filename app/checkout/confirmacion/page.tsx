"use client"

import { Suspense, useEffect, useState } from "react"
import { useSearchParams } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { CheckCircle2, Package, Mail, Phone, MapPin, Loader2 } from "lucide-react"
import Link from "next/link"

export default function ConfirmacionPage() {
  return (
    <Suspense
      fallback={
        <div className="container mx-auto py-16 px-4 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      }
    >
      <ConfirmacionContent />
    </Suspense>
  )
}

function ConfirmacionContent() {
  const searchParams = useSearchParams()
  const orderId = searchParams.get("order")
  const supabase = createClient()
  const [order, setOrder] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (orderId) {
      loadOrder()
    }
  }, [orderId])

  async function loadOrder() {
    try {
      const { data, error } = await supabase
        .from("orders")
        .select("*")
        .eq("id", orderId)
        .single()

      if (error) throw error
      setOrder(data)
    } catch (error) {
      console.error("Error loading order:", error)
    } finally {
      setIsLoading(false)
    }
  }

  if (isLoading) {
    return (
      <div className="container mx-auto py-16 px-4 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (!order) {
    return (
      <div className="container mx-auto py-16 px-4">
        <Card className="max-w-md mx-auto text-center">
          <CardHeader>
            <CardTitle>Pedido no encontrado</CardTitle>
            <CardDescription>
              No pudimos encontrar la información de tu pedido
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild>
              <Link href="/">Volver al inicio</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="max-w-3xl mx-auto">
        <Card className="mb-8">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 h-16 w-16 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center">
              <CheckCircle2 className="h-8 w-8 text-green-600 dark:text-green-400" />
            </div>
            <CardTitle className="text-3xl">¡Pedido Confirmado!</CardTitle>
            <CardDescription className="text-lg">
              Gracias por tu compra. Hemos recibido tu pedido correctamente.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="bg-muted p-4 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Número de pedido</p>
                  <p className="text-lg font-bold font-mono">#{order.id.slice(0, 8).toUpperCase()}</p>
                </div>
                <Package className="h-8 w-8 text-muted-foreground" />
              </div>
            </div>

            <Separator />

            <div className="space-y-4">
              <h3 className="font-semibold text-lg">Próximos Pasos</h3>
              <div className="space-y-3">
                <div className="flex gap-3">
                  <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <Mail className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium">Confirmación por Email</p>
                    <p className="text-sm text-muted-foreground">
                      Te hemos enviado un email de confirmación a <strong>{order.customer_email}</strong> con los detalles de tu pedido.
                    </p>
                  </div>
                </div>

                {order.payment_method === "transfer" && (
                  <div className="flex gap-3">
                    <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <Phone className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium">Datos de Pago</p>
                      <p className="text-sm text-muted-foreground">
                        Recibirás los datos bancarios para realizar la transferencia. Una vez confirmado el pago, procesaremos tu pedido.
                      </p>
                    </div>
                  </div>
                )}

                <div className="flex gap-3">
                  <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <Package className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium">Preparación del Pedido</p>
                    <p className="text-sm text-muted-foreground">
                      Nuestro equipo preparará tu pedido con cuidado y te notificaremos cuando esté listo para envío.
                    </p>
                  </div>
                </div>

                <div className="flex gap-3">
                  <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <MapPin className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium">Envío</p>
                    <p className="text-sm text-muted-foreground">
                      Tu pedido será enviado a: <strong>{order.shipping_address}, {order.shipping_city}</strong>
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <Separator />

            <div className="space-y-3">
              <h3 className="font-semibold">Resumen del Pedido</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span>${order.subtotal?.toLocaleString("es-CO")}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Envío</span>
                  <span>
                    {order.shipping_cost === 0 ? (
                      <span className="text-green-600">Gratis</span>
                    ) : (
                      `$${order.shipping_cost?.toLocaleString("es-CO")}`
                    )}
                  </span>
                </div>
                <Separator />
                <div className="flex justify-between font-bold text-base">
                  <span>Total</span>
                  <span>${order.total?.toLocaleString("es-CO")}</span>
                </div>
              </div>
            </div>

            <div className="bg-blue-50 dark:bg-blue-950 p-4 rounded-lg">
              <p className="text-sm text-blue-900 dark:text-blue-100">
                <strong>¿Necesitas ayuda?</strong> Contáctanos por WhatsApp o email si tienes alguna pregunta sobre tu pedido.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <Button asChild className="flex-1">
                <Link href="/productos">Seguir Comprando</Link>
              </Button>
              <Button asChild variant="outline" className="flex-1">
                <Link href="/">Volver al Inicio</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
