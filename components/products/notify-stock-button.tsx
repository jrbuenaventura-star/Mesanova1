"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Bell, BellRing, Loader2, Check } from "lucide-react"
import { toast } from "sonner"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"

interface NotifyStockButtonProps {
  productId: string
  productName: string
  userEmail?: string
}

export function NotifyStockButton({ productId, productName, userEmail }: NotifyStockButtonProps) {
  const [email, setEmail] = useState(userEmail || "")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSubscribed, setIsSubscribed] = useState(false)
  const [open, setOpen] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email) {
      toast.error("Ingresa tu email")
      return
    }

    setIsSubmitting(true)
    try {
      const res = await fetch("/api/stock-notifications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId, email }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || "Error al registrarse")
      }

      setIsSubscribed(true)
      toast.success("¡Listo!", {
        description: "Te avisaremos cuando el producto esté disponible",
      })
      setOpen(false)
    } catch (error) {
      toast.error("Error", {
        description: error instanceof Error ? error.message : "Intenta de nuevo",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isSubscribed) {
    return (
      <Button variant="outline" disabled className="w-full">
        <Check className="mr-2 h-4 w-4 text-green-600" />
        Te avisaremos cuando esté disponible
      </Button>
    )
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="w-full">
          <Bell className="mr-2 h-4 w-4" />
          Avisarme cuando esté disponible
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <BellRing className="h-5 w-5" />
            Alerta de disponibilidad
          </DialogTitle>
          <DialogDescription>
            Te enviaremos un email cuando <strong>{productName}</strong> vuelva a estar en stock.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="flex gap-2">
          <Input
            type="email"
            placeholder="tu@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            disabled={isSubmitting}
          />
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              "Avisarme"
            )}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}
