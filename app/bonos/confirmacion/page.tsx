"use client"

import { useEffect, useState } from "react"
import { useSearchParams } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { CheckCircle, Gift, Mail, Copy, Check } from "lucide-react"
import Link from "next/link"
import { toast } from "sonner"
import { createClient } from "@/lib/supabase/client"

export default function ConfirmacionBonoPage() {
  const searchParams = useSearchParams()
  const code = searchParams.get("code")
  const [giftCard, setGiftCard] = useState<any>(null)
  const [copied, setCopied] = useState(false)
  const [emailSent, setEmailSent] = useState(false)

  useEffect(() => {
    if (code) {
      fetchGiftCard()
      sendEmail()
    }
  }, [code])

  const fetchGiftCard = async () => {
    const supabase = createClient()
    const { data } = await supabase
      .from("gift_cards")
      .select("*")
      .eq("code", code)
      .single()

    if (data) {
      setGiftCard(data)
    }
  }

  const sendEmail = async () => {
    try {
      const response = await fetch("/api/gift-cards/send-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          giftCard: { code },
          type: "purchase",
        }),
      })

      if (response.ok) {
        setEmailSent(true)
      }
    } catch (error) {
      console.error("Error sending email:", error)
    }
  }

  const copyCode = () => {
    if (code) {
      navigator.clipboard.writeText(code)
      setCopied(true)
      toast.success("Código copiado al portapapeles")
      setTimeout(() => setCopied(false), 2000)
    }
  }

  if (!code) {
    return (
      <div className="container mx-auto py-16 text-center">
        <p className="text-muted-foreground">No se encontró información del bono</p>
        <Button asChild className="mt-4">
          <Link href="/bonos/comprar">Comprar un Bono</Link>
        </Button>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-8 px-4 max-w-3xl">
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-20 h-20 bg-green-100 dark:bg-green-900 rounded-full mb-4">
          <CheckCircle className="h-10 w-10 text-green-600 dark:text-green-400" />
        </div>
        <h1 className="text-3xl font-bold mb-2">¡Bono Creado Exitosamente!</h1>
        <p className="text-muted-foreground">
          Tu bono de regalo ha sido generado y está listo para usar
        </p>
      </div>

      <Card className="mb-6">
        <CardHeader className="bg-gradient-to-r from-primary/10 to-primary/5">
          <CardTitle className="flex items-center gap-2">
            <Gift className="h-5 w-5" />
            Detalles del Bono
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-6 space-y-6">
          {/* Código del Bono */}
          <div className="text-center p-6 bg-muted rounded-lg">
            <p className="text-sm text-muted-foreground mb-2">Código del Bono</p>
            <div className="flex items-center justify-center gap-2">
              <p className="text-3xl font-bold font-mono tracking-wider">{code}</p>
              <Button
                variant="ghost"
                size="sm"
                onClick={copyCode}
                className="ml-2"
              >
                {copied ? (
                  <Check className="h-4 w-4 text-green-600" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>

          {giftCard && (
            <>
              {/* Información del Bono */}
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <p className="text-sm text-muted-foreground">Monto</p>
                  <p className="text-2xl font-bold text-green-600">
                    ${Number(giftCard.initial_amount).toLocaleString('es-CO')}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Válido hasta</p>
                  <p className="text-lg font-semibold">
                    {new Date(giftCard.expires_at).toLocaleDateString('es-CO', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </p>
                </div>
              </div>

              {/* Destinatario */}
              {giftCard.recipient_name && (
                <div className="border-t pt-4">
                  <p className="text-sm text-muted-foreground mb-2">Para</p>
                  <p className="font-semibold">{giftCard.recipient_name}</p>
                  <p className="text-sm text-muted-foreground">{giftCard.recipient_email}</p>
                  {giftCard.personal_message && (
                    <div className="mt-3 p-3 bg-blue-50 dark:bg-blue-950 rounded-lg">
                      <p className="text-sm italic">"{giftCard.personal_message}"</p>
                    </div>
                  )}
                </div>
              )}
            </>
          )}

          {/* Email Notification */}
          {emailSent && (
            <div className="flex items-center gap-2 p-3 bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-lg">
              <Mail className="h-5 w-5 text-green-600" />
              <p className="text-sm text-green-900 dark:text-green-100">
                Se ha enviado un email con los detalles del bono a {giftCard?.recipient_email || 'el destinatario'}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Instrucciones */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>¿Cómo usar el bono?</CardTitle>
        </CardHeader>
        <CardContent>
          <ol className="space-y-3">
            <li className="flex gap-3">
              <span className="flex-shrink-0 flex items-center justify-center w-6 h-6 bg-primary text-primary-foreground rounded-full text-sm font-bold">
                1
              </span>
              <span>Navega por nuestra tienda y agrega productos a tu carrito</span>
            </li>
            <li className="flex gap-3">
              <span className="flex-shrink-0 flex items-center justify-center w-6 h-6 bg-primary text-primary-foreground rounded-full text-sm font-bold">
                2
              </span>
              <span>Ve al checkout y busca el campo "¿Tienes un bono de regalo?"</span>
            </li>
            <li className="flex gap-3">
              <span className="flex-shrink-0 flex items-center justify-center w-6 h-6 bg-primary text-primary-foreground rounded-full text-sm font-bold">
                3
              </span>
              <span>Ingresa el código del bono y haz clic en "Aplicar"</span>
            </li>
            <li className="flex gap-3">
              <span className="flex-shrink-0 flex items-center justify-center w-6 h-6 bg-primary text-primary-foreground rounded-full text-sm font-bold">
                4
              </span>
              <span>El descuento se aplicará automáticamente a tu pedido</span>
            </li>
          </ol>
        </CardContent>
      </Card>

      {/* Información Importante */}
      <Card className="bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800">
        <CardContent className="pt-6">
          <h3 className="font-semibold mb-3 text-blue-900 dark:text-blue-100">
            💡 Información Importante
          </h3>
          <ul className="space-y-2 text-sm text-blue-800 dark:text-blue-200">
            <li>• El bono es válido por 12 meses desde la fecha de compra</li>
            <li>• Puedes usar el bono en múltiples compras hasta agotar el saldo</li>
            <li>• El bono no es canjeable por dinero en efectivo</li>
            <li>• Guarda el código en un lugar seguro</li>
            <li>• Si tienes problemas, contáctanos con el código del bono</li>
          </ul>
        </CardContent>
      </Card>

      {/* Acciones */}
      <div className="flex flex-col sm:flex-row gap-4 mt-8">
        <Button asChild className="flex-1" size="lg">
          <Link href="/productos">
            <Gift className="mr-2 h-4 w-4" />
            Comenzar a Comprar
          </Link>
        </Button>
        <Button asChild variant="outline" className="flex-1" size="lg">
          <Link href="/bonos/comprar">
            Comprar Otro Bono
          </Link>
        </Button>
      </div>
    </div>
  )
}
