"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Loader2, Tag, X } from "lucide-react"
import { toast } from "sonner"

interface CouponInputProps {
  cartTotal: number
  userId?: string
  productIds?: string[]
  onCouponApplied: (discount: number, couponData: any) => void
  onCouponRemoved: () => void
  appliedCoupon?: any
}

export function CouponInput({ 
  cartTotal, 
  userId, 
  productIds,
  onCouponApplied, 
  onCouponRemoved,
  appliedCoupon 
}: CouponInputProps) {
  const [couponCode, setCouponCode] = useState("")
  const [isValidating, setIsValidating] = useState(false)

  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) {
      toast.error("Ingresa un código de cupón")
      return
    }

    setIsValidating(true)
    try {
      const response = await fetch("/api/coupons/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code: couponCode,
          cartTotal,
          userId,
          productIds,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        toast.error(data.error || "Cupón no válido")
        return
      }

      onCouponApplied(data.coupon.discount_amount, data.coupon)
      toast.success(`Cupón aplicado: ${data.coupon.name}`)
      setCouponCode("")
    } catch (error) {
      toast.error("Error al validar cupón")
    } finally {
      setIsValidating(false)
    }
  }

  const handleRemoveCoupon = () => {
    onCouponRemoved()
    toast.info("Cupón removido")
  }

  if (appliedCoupon) {
    return (
      <div className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-lg">
        <div className="flex items-center gap-2">
          <Tag className="h-4 w-4 text-green-600" />
          <div>
            <p className="text-sm font-medium text-green-900 dark:text-green-100">
              {appliedCoupon.name}
            </p>
            <p className="text-xs text-green-700 dark:text-green-300">
              Código: {appliedCoupon.code}
            </p>
          </div>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleRemoveCoupon}
          className="text-green-700 hover:text-green-900"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      <Label htmlFor="coupon">¿Tienes un cupón de descuento?</Label>
      <div className="flex gap-2">
        <Input
          id="coupon"
          placeholder="Ingresa tu código"
          value={couponCode}
          onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
          onKeyPress={(e) => e.key === "Enter" && handleApplyCoupon()}
          disabled={isValidating}
        />
        <Button
          type="button"
          variant="outline"
          onClick={handleApplyCoupon}
          disabled={isValidating || !couponCode.trim()}
        >
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
