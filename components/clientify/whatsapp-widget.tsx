"use client"

import { useState, useEffect } from "react"
import { MessageCircle, X, Send } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { trackClientifyEvent } from "./clientify-tracking"

interface WhatsAppWidgetProps {
  phoneNumber?: string
  welcomeMessage?: string
  position?: "bottom-right" | "bottom-left"
  showPreForm?: boolean
}

export function WhatsAppWidget({
  phoneNumber = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER,
  welcomeMessage = "¡Hola! 👋 ¿En qué podemos ayudarte?",
  position = "bottom-right",
  showPreForm = true,
}: WhatsAppWidgetProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [showForm, setShowForm] = useState(showPreForm)
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    message: "",
  })
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    // Mostrar el widget después de 3 segundos
    const timer = setTimeout(() => {
      setIsVisible(true)
    }, 3000)

    return () => clearTimeout(timer)
  }, [])

  const handleOpenChat = () => {
    setIsOpen(true)
    trackClientifyEvent("whatsapp_widget_opened")
  }

  const handleCloseChat = () => {
    setIsOpen(false)
    setShowForm(showPreForm)
  }

  const handleStartChat = () => {
    if (!phoneNumber) return

    // Rastrear evento en Clientify
    trackClientifyEvent("whatsapp_chat_started", {
      name: formData.name,
      phone: formData.phone,
      initial_message: formData.message,
    })

    // Construir mensaje para WhatsApp
    let message = formData.message || "Hola, me gustaría más información"
    if (formData.name) {
      message = `Hola, soy ${formData.name}. ${message}`
    }

    // Limpiar número de teléfono (remover espacios y caracteres especiales)
    const cleanPhone = phoneNumber.replace(/[^0-9]/g, "")

    // Abrir WhatsApp
    const whatsappUrl = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`
    window.open(whatsappUrl, "_blank")

    // Cerrar widget
    setIsOpen(false)
    setFormData({ name: "", phone: "", message: "" })
  }

  const handleSkipForm = () => {
    setShowForm(false)
  }

  const positionClasses =
    position === "bottom-right" ? "right-4 sm:right-6" : "left-4 sm:left-6"

  if (!isVisible) return null

  return (
    <div className={`fixed bottom-4 sm:bottom-6 ${positionClasses} z-50`}>
      {/* Chat Window */}
      {isOpen && (
        <div className="mb-4 w-[320px] sm:w-[360px] bg-white rounded-2xl shadow-2xl overflow-hidden border animate-in slide-in-from-bottom-5 duration-300">
          {/* Header */}
          <div className="bg-[#25D366] px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center">
                <MessageCircle className="w-6 h-6 text-[#25D366]" />
              </div>
              <div className="text-white">
                <div className="font-semibold text-sm">Mesanova</div>
                <div className="text-xs opacity-90">Responde en minutos</div>
              </div>
            </div>
            <button
              onClick={handleCloseChat}
              className="text-white hover:bg-white/20 rounded-full p-1 transition-colors"
             aria-label="Cerrar">
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Body */}
          <div className="p-4">
            {/* Welcome Message */}
            <div className="bg-gray-100 rounded-lg rounded-tl-none p-3 mb-4 max-w-[85%]">
              <p className="text-sm text-gray-700">{welcomeMessage}</p>
              <span className="text-[10px] text-gray-400 mt-1 block">Ahora</span>
            </div>

            {showForm ? (
              /* Pre-form to capture lead data */
              <div className="space-y-3">
                <p className="text-xs text-gray-500 mb-3">
                  Antes de comenzar, ¿podrías darnos algunos datos?
                </p>
                <div>
                  <Label htmlFor="wa-name" className="text-xs">
                    Tu nombre
                  </Label>
                  <Input
                    id="wa-name"
                    placeholder="Juan Pérez"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    className="h-9 text-sm"
                  />
                </div>
                <div>
                  <Label htmlFor="wa-phone" className="text-xs">
                    Tu teléfono (opcional)
                  </Label>
                  <Input
                    id="wa-phone"
                    type="tel"
                    placeholder="+57 300 123 4567"
                    value={formData.phone}
                    onChange={(e) =>
                      setFormData({ ...formData, phone: e.target.value })
                    }
                    className="h-9 text-sm"
                  />
                </div>
                <div>
                  <Label htmlFor="wa-message" className="text-xs">
                    ¿En qué te ayudamos?
                  </Label>
                  <Input
                    id="wa-message"
                    placeholder="Me interesan sus productos..."
                    value={formData.message}
                    onChange={(e) =>
                      setFormData({ ...formData, message: e.target.value })
                    }
                    className="h-9 text-sm"
                  />
                </div>
                <div className="flex gap-2 pt-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleSkipForm}
                    className="flex-1 text-xs"
                  >
                    Omitir
                  </Button>
                  <Button aria-label="Iniciar chat"
                    onClick={handleStartChat}
                    size="sm"
                    className="flex-1 bg-[#25D366] hover:bg-[#20BD5A] text-xs"
                  >
                    <Send className="w-3 h-3 mr-1" />
                    Iniciar chat
                  </Button>
                </div>
              </div>
            ) : (
              /* Direct chat button */
              <div className="space-y-3">
                <div>
                  <Label htmlFor="wa-direct-message" className="text-xs">
                    Tu mensaje
                  </Label>
                  <Input
                    id="wa-direct-message"
                    placeholder="Escribe tu mensaje..."
                    value={formData.message}
                    onChange={(e) =>
                      setFormData({ ...formData, message: e.target.value })
                    }
                    className="h-9 text-sm"
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        handleStartChat()
                      }
                    }}
                  />
                </div>
                <Button
                  onClick={handleStartChat}
                  className="w-full bg-[#25D366] hover:bg-[#20BD5A]"
                >
                  <Send className="w-4 h-4 mr-2" />
                  Iniciar chat
                </Button>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="px-4 py-2 bg-gray-50 border-t">
            <p className="text-[10px] text-gray-400 text-center">
              Powered by Clientify × Mesanova
            </p>
          </div>
        </div>
      )}

      {/* Floating Button */}
      <button
        onClick={isOpen ? handleCloseChat : handleOpenChat}
        className={`
          w-14 h-14 sm:w-16 sm:h-16 rounded-full shadow-lg 
          flex items-center justify-center
          transition-all duration-300 hover:scale-110
          ${isOpen ? "bg-gray-600 rotate-90" : "bg-[#25D366]"}
        `}
        aria-label={isOpen ? "Cerrar chat" : "Abrir chat de WhatsApp"}
      >
        {isOpen ? (
          <X className="w-6 h-6 sm:w-7 sm:h-7 text-white" />
        ) : (
          <MessageCircle className="w-6 h-6 sm:w-7 sm:h-7 text-white" />
        )}
      </button>

      {/* Pulse animation for the button */}
      {!isOpen && (
        <span className="absolute -top-1 -right-1 flex h-4 w-4">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#25D366] opacity-75"></span>
          <span className="relative inline-flex rounded-full h-4 w-4 bg-[#25D366]"></span>
        </span>
      )}
    </div>
  )
}
