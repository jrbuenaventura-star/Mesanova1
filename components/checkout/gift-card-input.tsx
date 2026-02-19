"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Loader2, Gift, X } from "lucide-react"
import { toast } from "sonner"

interface GiftCardInputProps {
  onGiftCardApplied: (amount: number, giftCardData: any) => void
  onGiftCardRemoved: () => void
  appliedGiftCard?: any
}

export function GiftCardInput({ 
  onGiftCardApplied, 
  onGiftCardRemoved,
  appliedGiftCard 
}: GiftCardInputProps) {
  const [giftCardCode, setGiftCardCode] = useState("")
  const [isValidating, setIsValidating] = useState(false)

  const handleApplyGiftCard = async () => {
    if (!giftCardCode.trim()) {
      toast.error("Ingresa un código de bono")
      return
    }

    setIsValidating(true)
    try {
      const response = await fetch("/api/gift-cards/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: giftCardCode }),
      })

      const data = await response.json()

      if (!response.ok) {
        toast.error(data.error || "Bono no válido")
        return
      }

      onGiftCardApplied(data.giftCard.current_balance, data.giftCard)
      toast.success(`Bono aplicado: $${data.giftCard.current_balance.toLocaleString('es-CO')} disponibles`)
      setGiftCardCode("")
    } catch (error) {
      toast.error("Error al validar bono")
    } finally {
      setIsValidating(false)
    }
  }

  const handleRemoveGiftCard = () => {
    onGiftCardRemoved()
    toast.info("Bono removido")
  }

  if (appliedGiftCard) {
    return (
      <div className="flex items-center justify-between p-3 bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg">
        <div className="flex items-center gap-2">
          <Gift className="h-4 w-4 text-blue-600" />
          <div>
            <p className="text-sm font-medium text-blue-900 dark:text-blue-100">
              Bono de Regalo
            </p>
            <p className="text-xs text-blue-700 dark:text-blue-300">
              Saldo: ${appliedGiftCard.current_balance.toLocaleString('es-CO')}
            </p>
          </div>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleRemoveGiftCard}
          className="text-blue-700 hover:text-blue-900"
         aria-label="Cerrar">
          <X className="h-4 w-4" />
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      <Label htmlFor="giftCard">¿Tienes un bono de regalo?</Label>
      <div className="flex gap-2">
        <Input
          id="giftCard"
          placeholder="GC-XXXX-XXXX-XXXX"
          value={giftCardCode}
          onChange={(e) => setGiftCardCode(e.target.value.toUpperCase())}
          onKeyPress={(e) => e.key === "Enter" && handleApplyGiftCard()}
          disabled={isValidating}
        />
        <Button
          type="button"
          variant="outline"
          onClick={handleApplyGiftCard}
          disabled={isValidating || !giftCardCode.trim()}
         aria-label="Acción">
          {isValidating ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            "Aplicar"
          )}
        </Button>
      </div>
    </div>
  )
}
