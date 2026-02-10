"use client"

import { useState, useEffect } from "react"
import { usePathname } from "next/navigation"
import { X, Gift, Mail } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"
import { identifyUser, trackClientifyEvent } from "./clientify-tracking"
import { createClient } from "@/lib/supabase/client"

interface LeadCapturePopupProps {
  delaySeconds?: number
  scrollPercentage?: number
  showOnExitIntent?: boolean
  offer?: string
  disabled?: boolean
}

const STORAGE_KEY = "mesanova_popup_dismissed"
const DISMISS_DAYS = 7

export function LeadCapturePopup({
  delaySeconds = 30,
  scrollPercentage = 50,
  showOnExitIntent = true,
  offer = "10% de descuento en tu primera compra",
  disabled = false,
}: LeadCapturePopupProps) {
  const pathname = usePathname()
  const [isVisible, setIsVisible] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [hasTriggered, setHasTriggered] = useState(false)
  const [isSuppressed, setIsSuppressed] = useState(false)
  const [formData, setFormData] = useState({
    email: "",
    name: "",
  })

  // Hide popup on panel routes and for aliado/distributor users
  useEffect(() => {
    const panelPaths = ["/aliado", "/distributor", "/admin"]
    if (panelPaths.some((p) => pathname.startsWith(p))) {
      setIsSuppressed(true)
      return
    }

    const checkUserRole = async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { data: profile } = await supabase
        .from("user_profiles")
        .select("role")
        .eq("id", user.id)
        .single()
      if (profile?.role === "aliado" || profile?.role === "distributor") {
        setIsSuppressed(true)
      }
    }
    checkUserRole()
  }, [pathname])

  useEffect(() => {
    if (disabled || isSuppressed) return

    // Check if already dismissed recently
    const dismissedAt = localStorage.getItem(STORAGE_KEY)
    if (dismissedAt) {
      const dismissDate = new Date(dismissedAt)
      const daysSinceDismiss = (Date.now() - dismissDate.getTime()) / (1000 * 60 * 60 * 24)
      if (daysSinceDismiss < DISMISS_DAYS) {
        return
      }
    }

    // Time-based trigger
    const timeoutId = setTimeout(() => {
      if (!hasTriggered) {
        showPopup("time_delay")
      }
    }, delaySeconds * 1000)

    // Scroll-based trigger
    const handleScroll = () => {
      if (hasTriggered) return
      const scrolled = (window.scrollY / (document.body.scrollHeight - window.innerHeight)) * 100
      if (scrolled >= scrollPercentage) {
        showPopup("scroll_depth")
      }
    }

    // Exit intent trigger (desktop only)
    const handleMouseLeave = (e: MouseEvent) => {
      if (!showOnExitIntent || hasTriggered) return
      if (e.clientY <= 0) {
        showPopup("exit_intent")
      }
    }

    window.addEventListener("scroll", handleScroll)
    document.addEventListener("mouseleave", handleMouseLeave)

    return () => {
      clearTimeout(timeoutId)
      window.removeEventListener("scroll", handleScroll)
      document.removeEventListener("mouseleave", handleMouseLeave)
    }
  }, [delaySeconds, scrollPercentage, showOnExitIntent, hasTriggered, disabled, isSuppressed])

  const showPopup = (trigger: string) => {
    setHasTriggered(true)
    setIsVisible(true)
    trackClientifyEvent("popup_shown", { trigger, offer })
  }

  const handleClose = () => {
    setIsVisible(false)
    localStorage.setItem(STORAGE_KEY, new Date().toISOString())
    trackClientifyEvent("popup_closed", { had_email: !!formData.email })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.email) {
      toast.error("Por favor ingresa tu email")
      return
    }

    setIsSubmitting(true)

    try {
      // Identificar en Clientify
      identifyUser({
        email: formData.email,
        first_name: formData.name || undefined,
      })

      // Crear contacto en Clientify
      await fetch("/api/clientify/create-contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: formData.email,
          first_name: formData.name || undefined,
          tags: ["popup-descuento", "lead-mesanova", "newsletter"],
          custom_fields: {
            oferta_popup: offer,
            fecha_suscripcion: new Date().toISOString(),
          },
          source: "popup_web",
        }),
      })

      trackClientifyEvent("popup_converted", { 
        email: formData.email,
        offer,
      })

      toast.success("¡Listo! 🎉", {
        description: "Revisa tu email para obtener tu código de descuento",
      })

      setIsVisible(false)
      localStorage.setItem(STORAGE_KEY, new Date().toISOString())
    } catch (error) {
      toast.error("Error al suscribirse", {
        description: "Por favor intenta nuevamente",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!isVisible) return null

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
        {/* Close button */}
        <button
          onClick={handleClose}
          className="absolute top-3 right-3 z-10 p-1 rounded-full hover:bg-gray-100 transition-colors"
          aria-label="Cerrar"
        >
          <X className="w-5 h-5 text-gray-500" />
        </button>

        {/* Header with gradient */}
        <div className="bg-gradient-to-r from-primary to-primary/80 px-6 py-8 text-center text-white">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-white/20 rounded-full mb-4">
            <Gift className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-bold mb-2">¡Espera!</h2>
          <p className="text-lg opacity-90">Obtén {offer}</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <p className="text-center text-gray-600 text-sm">
            Suscríbete a nuestro newsletter y recibe ofertas exclusivas
          </p>

          <div className="space-y-3">
            <div>
              <Label htmlFor="popup-name" className="sr-only">
                Nombre
              </Label>
              <Input
                id="popup-name"
                placeholder="Tu nombre (opcional)"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                disabled={isSubmitting}
              />
            </div>
            <div>
              <Label htmlFor="popup-email" className="sr-only">
                Email
              </Label>
              <Input
                id="popup-email"
                type="email"
                placeholder="tu@email.com"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
                disabled={isSubmitting}
              />
            </div>
          </div>

          <Button
            type="submit"
            size="lg"
            className="w-full"
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              "Enviando..."
            ) : (
              <>
                <Mail className="w-4 h-4 mr-2" />
                Obtener mi descuento
              </>
            )}
          </Button>

          <p className="text-xs text-center text-gray-400">
            Al suscribirte aceptas recibir emails promocionales. Puedes cancelar cuando quieras.
          </p>
        </form>
      </div>
    </div>
  )
}
