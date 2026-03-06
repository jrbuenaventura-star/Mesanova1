"use client"

import { useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Gift, Loader2, CheckCircle2 } from "lucide-react"
import { toast } from "sonner"

type GiftCardCatalogProduct = {
  id: string
  name: string
  description: string | null
  amount: number
  allow_custom_amount: boolean
  min_custom_amount: number
  max_custom_amount: number | null
  isCatalog: boolean
}

const FALLBACK_PRODUCTS: GiftCardCatalogProduct[] = [
  {
    id: "fallback-50000",
    name: "Bono Regalo $50.000",
    description: "Ideal para un detalle rápido.",
    amount: 50000,
    allow_custom_amount: false,
    min_custom_amount: 10000,
    max_custom_amount: null,
    isCatalog: false,
  },
  {
    id: "fallback-100000",
    name: "Bono Regalo $100.000",
    description: "Perfecto para ocasiones especiales.",
    amount: 100000,
    allow_custom_amount: false,
    min_custom_amount: 10000,
    max_custom_amount: null,
    isCatalog: false,
  },
  {
    id: "fallback-200000",
    name: "Bono Regalo $200.000",
    description: "Un regalo premium para celebrar.",
    amount: 200000,
    allow_custom_amount: false,
    min_custom_amount: 10000,
    max_custom_amount: null,
    isCatalog: false,
  },
  {
    id: "fallback-500000",
    name: "Bono Regalo $500.000",
    description: "Para compras de alto valor.",
    amount: 500000,
    allow_custom_amount: false,
    min_custom_amount: 10000,
    max_custom_amount: null,
    isCatalog: false,
  },
  {
    id: "fallback-custom",
    name: "Bono Monto Libre",
    description: "Define un monto personalizado.",
    amount: 10000,
    allow_custom_amount: true,
    min_custom_amount: 10000,
    max_custom_amount: null,
    isCatalog: false,
  },
]

export default function ComprarBonoPage() {
  const router = useRouter()
  const [isProcessing, setIsProcessing] = useState(false)
  const [catalogLoading, setCatalogLoading] = useState(true)
  const [catalogProducts, setCatalogProducts] = useState<GiftCardCatalogProduct[]>(FALLBACK_PRODUCTS)
  const [selectedProductId, setSelectedProductId] = useState(FALLBACK_PRODUCTS[0].id)
  const [customAmount, setCustomAmount] = useState("")
  const [isGift, setIsGift] = useState(false)
  const [formData, setFormData] = useState({
    purchaserName: "",
    purchaserEmail: "",
    recipientName: "",
    recipientEmail: "",
    personalMessage: "",
  })

  useEffect(() => {
    let mounted = true

    async function loadCatalog() {
      try {
        const response = await fetch("/api/gift-cards/catalog", { cache: "no-store" })
        const payload = await response.json()
        if (!response.ok || !payload.success) {
          throw new Error(payload.error || "No se pudo cargar el catálogo")
        }

        const records = Array.isArray(payload.products)
          ? (payload.products as Array<Record<string, unknown>>)
          : []

        if (!records.length) {
          throw new Error("No hay bonos activos en el catálogo")
        }

        const normalized: GiftCardCatalogProduct[] = records.map((product) => ({
          id: String(product.id),
          name: String(product.name || "Bono"),
          description: typeof product.description === "string" ? product.description : null,
          amount: Number(product.amount || 0),
          allow_custom_amount: Boolean(product.allow_custom_amount),
          min_custom_amount: Number(product.min_custom_amount || 10000),
          max_custom_amount:
            product.max_custom_amount === null || product.max_custom_amount === undefined
              ? null
              : Number(product.max_custom_amount),
          isCatalog: true,
        }))

        if (!mounted) return
        setCatalogProducts(normalized)
        setSelectedProductId(normalized[0].id)
        setCustomAmount(String(normalized[0].min_custom_amount || 10000))
      } catch {
        if (!mounted) return
        setCatalogProducts(FALLBACK_PRODUCTS)
        setSelectedProductId(FALLBACK_PRODUCTS[0].id)
      } finally {
        if (mounted) {
          setCatalogLoading(false)
        }
      }
    }

    void loadCatalog()
    return () => {
      mounted = false
    }
  }, [])

  const selectedProduct = useMemo(
    () => catalogProducts.find((product) => product.id === selectedProductId) || null,
    [catalogProducts, selectedProductId]
  )

  const finalAmount = selectedProduct?.allow_custom_amount
    ? Number.parseInt(customAmount, 10) || 0
    : Number(selectedProduct?.amount || 0)

  const validateAmount = () => {
    if (!selectedProduct) {
      return "Debes seleccionar un bono"
    }

    if (selectedProduct.allow_custom_amount) {
      const min = Number(selectedProduct.min_custom_amount || 10000)
      const max =
        selectedProduct.max_custom_amount === null ? null : Number(selectedProduct.max_custom_amount)

      if (finalAmount < min) {
        return `El monto mínimo es $${min.toLocaleString("es-CO")}`
      }
      if (max !== null && finalAmount > max) {
        return `El monto máximo es $${max.toLocaleString("es-CO")}`
      }
      return null
    }

    if (finalAmount <= 0) {
      return "El monto seleccionado no es válido"
    }

    return null
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const amountError = validateAmount()
    if (amountError) {
      toast.error(amountError)
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
          giftCardProductId: selectedProduct?.isCatalog ? selectedProduct.id : undefined,
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

      const code = String(json.code || "")

      toast.success("¡Bono creado exitosamente!", {
        description: `Código: ${code}`,
      })

      router.push(`/bonos/confirmacion?code=${code}`)
    } catch (error) {
      console.error("Error creating gift card:", error)
      toast.error("Error al crear el bono", {
        description: "Por favor intenta nuevamente",
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
        <p className="text-muted-foreground">Regala calidad. Los bonos son válidos por 12 meses</p>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>1. Selecciona el Bono</CardTitle>
                <CardDescription>
                  {catalogLoading
                    ? "Cargando catálogo..."
                    : "Elige una opción preconfigurada o un monto libre."}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <RadioGroup value={selectedProductId} onValueChange={setSelectedProductId}>
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    {catalogProducts.map((product) => (
                      <div key={product.id} className="relative">
                        <RadioGroupItem value={product.id} id={`amount-${product.id}`} className="peer sr-only" />
                        <Label
                          htmlFor={`amount-${product.id}`}
                          className="flex min-h-[94px] flex-col justify-center rounded-lg border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary cursor-pointer"
                        >
                          <span className="text-base font-semibold">{product.name}</span>
                          <span className="text-sm text-muted-foreground">{product.description || ""}</span>
                          {!product.allow_custom_amount ? (
                            <span className="mt-2 text-lg font-bold">${product.amount.toLocaleString("es-CO")}</span>
                          ) : (
                            <span className="mt-2 text-sm font-medium">Monto personalizado</span>
                          )}
                        </Label>
                      </div>
                    ))}
                  </div>
                </RadioGroup>

                {selectedProduct?.allow_custom_amount && (
                  <div className="space-y-2">
                    <Label htmlFor="customAmount">Monto personalizado</Label>
                    <Input
                      id="customAmount"
                      type="number"
                      placeholder={`Ej: ${selectedProduct.min_custom_amount}`}
                      value={customAmount}
                      onChange={(e) => setCustomAmount(e.target.value)}
                      min={selectedProduct.min_custom_amount}
                      max={selectedProduct.max_custom_amount || undefined}
                      step={1000}
                      className="max-w-xs"
                    />
                    <p className="text-xs text-muted-foreground">
                      Mínimo: ${selectedProduct.min_custom_amount.toLocaleString("es-CO")}
                      {selectedProduct.max_custom_amount
                        ? ` | Máximo: $${selectedProduct.max_custom_amount.toLocaleString("es-CO")}`
                        : ""}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>2. ¿Es un Regalo?</CardTitle>
              </CardHeader>
              <CardContent>
                <RadioGroup value={isGift ? "gift" : "self"} onValueChange={(value) => setIsGift(value === "gift")}>
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

          <div className="lg:col-span-1">
            <Card className="sticky top-4">
              <CardHeader>
                <CardTitle>Resumen</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between text-sm gap-2">
                  <span className="text-muted-foreground">Bono seleccionado</span>
                  <span className="font-medium text-right">{selectedProduct?.name || "N/D"}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Monto del bono</span>
                  <span className="font-medium">${finalAmount.toLocaleString("es-CO")}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Validez</span>
                  <span className="font-medium">12 meses</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Tipo</span>
                  <span className="font-medium">{isGift ? "Regalo" : "Personal"}</span>
                </div>

                <div className="pt-4 border-t">
                  <div className="flex justify-between text-lg font-bold">
                    <span>Total a Pagar</span>
                    <span>${finalAmount.toLocaleString("es-CO")}</span>
                  </div>
                </div>

                <Button
                  type="submit"
                  size="lg"
                  className="w-full"
                  disabled={isProcessing || !!validateAmount()}
                  aria-label="Confirmar"
                >
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
