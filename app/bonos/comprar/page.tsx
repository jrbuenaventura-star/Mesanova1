"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Gift, Loader2, CheckCircle2 } from "lucide-react"
import { toast } from "sonner"

const PRESET_AMOUNTS = [50000, 100000, 200000, 500000]

export default function ComprarBonoPage() {
  const router = useRouter()
  const [isProcessing, setIsProcessing] = useState(false)
  const [selectedAmount, setSelectedAmount] = useState<number | null>(null)
  const [customAmount, setCustomAmount] = useState("")
  const [isGift, setIsGift] = useState(false)
  const [formData, setFormData] = useState({
    purchaserName: "",
    purchaserEmail: "",
    recipientName: "",
    recipientEmail: "",
    personalMessage: "",
  })

  const finalAmount = selectedAmount === 0 
    ? parseInt(customAmount) || 0 
    : selectedAmount || 0

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (finalAmount < 10000) {
      toast.error("El monto mínimo es $10,000")
      return
    }

    if (!formData.purchaserName || !formData.purchaserEmail) {
      toast.error("Por favor completa tu información")
      return
    }

    if (isGift && (!formData.recipientName || !formData.recipientEmail)) {
      toast.error("Por favor completa la información del destinatario")
      return
    }

    setIsProcessing(true)

    try {
      const response = await fetch("/api/gift-cards/purchase", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: finalAmount,
          purchaserName: formData.purchaserName,
          purchaserEmail: formData.purchaserEmail,
          isGift,
          recipientName: formData.recipientName,
          recipientEmail: formData.recipientEmail,
          personalMessage: formData.personalMessage,
        }),
      })

      const json = await response.json()
      if (!response.ok) {
        throw new Error(json?.error || "Error creating gift card")
      }

      const code = json.code as string

      toast.success("¡Bono creado exitosamente!", {
        description: `Código: ${code}`
      })

      // Aquí iría la integración con pasarela de pago
      // Por ahora redirigimos a confirmación
      router.push(`/bonos/confirmacion?code=${code}`)
    } catch (error) {
      console.error('Error creating gift card:', error)
      toast.error("Error al crear el bono", {
        description: "Por favor intenta nuevamente"
      })
    } finally {
      setIsProcessing(false)
    }
  }

  return (
    <div className="container mx-auto py-8 px-4 max-w-4xl">
      <div className="mb-8 text-center">
        <Gift className="h-16 w-16 mx-auto mb-4 text-primary" />
        <h1 className="text-3xl font-bold mb-2">Comprar Bono de Regalo</h1>
        <p className="text-muted-foreground">
          Regala calidad. Los bonos son válidos por 12 meses
        </p>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-6">
            {/* Monto */}
            <Card>
              <CardHeader>
                <CardTitle>1. Selecciona el Monto</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <RadioGroup
                  value={selectedAmount?.toString() || ""}
                  onValueChange={(value) => {
                    setSelectedAmount(parseInt(value))
                    if (value !== "0") setCustomAmount("")
                  }}
                >
                  <div className="grid grid-cols-2 gap-4">
                    {PRESET_AMOUNTS.map((amount) => (
                      <div key={amount} className="relative">
                        <RadioGroupItem
                          value={amount.toString()}
                          id={`amount-${amount}`}
                          className="peer sr-only"
                        />
                        <Label
                          htmlFor={`amount-${amount}`}
                          className="flex flex-col items-center justify-center rounded-lg border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer"
                        >
                          <span className="text-2xl font-bold">
                            ${amount.toLocaleString('es-CO')}
                          </span>
                        </Label>
                      </div>
                    ))}
                  </div>

                  <div className="relative mt-4">
                    <RadioGroupItem
                      value="0"
                      id="amount-custom"
                      className="peer sr-only"
                    />
                    <Label
                      htmlFor="amount-custom"
                      className="flex items-center rounded-lg border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary cursor-pointer"
                    >
                      <span className="mr-4">Monto personalizado:</span>
                      <Input
                        type="number"
                        placeholder="Ej: 75000"
                        value={customAmount}
                        onChange={(e) => {
                          setCustomAmount(e.target.value)
                          setSelectedAmount(0)
                        }}
                        min="10000"
                        step="1000"
                        className="max-w-xs"
                      />
                    </Label>
                  </div>
                </RadioGroup>
              </CardContent>
            </Card>

            {/* Tipo de Bono */}
            <Card>
              <CardHeader>
                <CardTitle>2. ¿Es un Regalo?</CardTitle>
              </CardHeader>
              <CardContent>
                <RadioGroup
                  value={isGift ? "gift" : "self"}
                  onValueChange={(value) => setIsGift(value === "gift")}
                >
                  <div className="flex items-center space-x-3 border rounded-lg p-4">
                    <RadioGroupItem value="self" id="self" />
                    <Label htmlFor="self" className="flex-1 cursor-pointer">
                      Para mí mismo
                    </Label>
                  </div>
                  <div className="flex items-center space-x-3 border rounded-lg p-4">
                    <RadioGroupItem value="gift" id="gift" />
                    <Label htmlFor="gift" className="flex-1 cursor-pointer">
                      Para regalar
                    </Label>
                  </div>
                </RadioGroup>
              </CardContent>
            </Card>

            {/* Información del Comprador */}
            <Card>
              <CardHeader>
                <CardTitle>3. Tu Información</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="purchaserName">Nombre completo *</Label>
                  <Input
                    id="purchaserName"
                    value={formData.purchaserName}
                    onChange={(e) => setFormData({ ...formData, purchaserName: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="purchaserEmail">Email *</Label>
                  <Input
                    id="purchaserEmail"
                    type="email"
                    value={formData.purchaserEmail}
                    onChange={(e) => setFormData({ ...formData, purchaserEmail: e.target.value })}
                    required
                  />
                </div>
              </CardContent>
            </Card>

            {/* Información del Destinatario */}
            {isGift && (
              <Card>
                <CardHeader>
                  <CardTitle>4. Información del Destinatario</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="recipientName">Nombre del destinatario *</Label>
                    <Input
                      id="recipientName"
                      value={formData.recipientName}
                      onChange={(e) => setFormData({ ...formData, recipientName: e.target.value })}
                      required={isGift}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="recipientEmail">Email del destinatario *</Label>
                    <Input
                      id="recipientEmail"
                      type="email"
                      value={formData.recipientEmail}
                      onChange={(e) => setFormData({ ...formData, recipientEmail: e.target.value })}
                      required={isGift}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="personalMessage">Mensaje personal (opcional)</Label>
                    <Textarea
                      id="personalMessage"
                      value={formData.personalMessage}
                      onChange={(e) => setFormData({ ...formData, personalMessage: e.target.value })}
                      placeholder="Escribe un mensaje especial..."
                      rows={4}
                    />
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Resumen */}
          <div className="lg:col-span-1">
            <Card className="sticky top-4">
              <CardHeader>
                <CardTitle>Resumen</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Monto del bono</span>
                  <span className="font-medium">
                    ${finalAmount.toLocaleString('es-CO')}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Validez</span>
                  <span className="font-medium">12 meses</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Tipo</span>
                  <span className="font-medium">
                    {isGift ? "Regalo" : "Personal"}
                  </span>
                </div>

                <div className="pt-4 border-t">
                  <div className="flex justify-between text-lg font-bold">
                    <span>Total a Pagar</span>
                    <span>${finalAmount.toLocaleString('es-CO')}</span>
                  </div>
                </div>

                <Button
                  type="submit"
                  size="lg"
                  className="w-full"
                  disabled={isProcessing || finalAmount < 10000}
                 aria-label="Confirmar">
                  {isProcessing ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Procesando...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="mr-2 h-4 w-4" />
                      Comprar Bono
                    </>
                  )}
                </Button>

                <p className="text-xs text-muted-foreground text-center">
                  Al continuar, aceptas nuestros términos y condiciones
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </form>
    </div>
  )
}
