"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "sonner"
import { Loader2 } from "lucide-react"

interface ContactFormProps {
  tipo: "mayoristas" | "minoristas" | "institucional" | "cliente-final"
  showVolumen?: boolean
}

export function ContactForm({ tipo, showVolumen = false }: ContactFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formData, setFormData] = useState({
    nombre: "",
    empresa: "",
    email: "",
    telefono: "",
    ciudad: "",
    volumen: "",
    mensaje: "",
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.id]: e.target.value,
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    if (!formData.nombre || !formData.email || !formData.telefono) {
      toast.error("Campos requeridos", {
        description: "Por favor completa todos los campos obligatorios"
      })
      setIsSubmitting(false)
      return
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(formData.email)) {
      toast.error("Email inválido", {
        description: "Por favor ingresa un email válido"
      })
      setIsSubmitting(false)
      return
    }

    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...formData,
          tipo,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Error al enviar el formulario")
      }

      toast.success("¡Solicitud enviada!", {
        description: "Nos pondremos en contacto contigo en menos de 24 horas"
      })

      setFormData({
        nombre: "",
        empresa: "",
        email: "",
        telefono: "",
        ciudad: "",
        volumen: "",
        mensaje: "",
      })
    } catch (error) {
      toast.error("Error al enviar", {
        description: error instanceof Error ? error.message : "Por favor intenta nuevamente"
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="nombre">Nombre completo *</Label>
          <Input
            id="nombre"
            placeholder="Juan Pérez"
            required
            value={formData.nombre}
            onChange={handleChange}
            disabled={isSubmitting}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="empresa">Empresa</Label>
          <Input
            id="empresa"
            placeholder="Mi Empresa S.A."
            value={formData.empresa}
            onChange={handleChange}
            disabled={isSubmitting}
          />
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="email">Email *</Label>
          <Input
            id="email"
            type="email"
            placeholder="contacto@miempresa.com"
            required
            value={formData.email}
            onChange={handleChange}
            disabled={isSubmitting}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="telefono">Teléfono *</Label>
          <Input
            id="telefono"
            type="tel"
            placeholder="+1 234 567 890"
            required
            value={formData.telefono}
            onChange={handleChange}
            disabled={isSubmitting}
          />
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="ciudad">Ciudad / Región</Label>
        <Input
          id="ciudad"
          placeholder="Ciudad"
          value={formData.ciudad}
          onChange={handleChange}
          disabled={isSubmitting}
        />
      </div>
      {showVolumen && (
        <div className="space-y-2">
          <Label htmlFor="volumen">Volumen de compra mensual estimado</Label>
          <Input
            id="volumen"
            placeholder="Ej: $5,000 - $10,000"
            value={formData.volumen}
            onChange={handleChange}
            disabled={isSubmitting}
          />
        </div>
      )}
      <div className="space-y-2">
        <Label htmlFor="mensaje">Mensaje</Label>
        <Textarea
          id="mensaje"
          placeholder="Cuéntanos sobre tu negocio y qué productos te interesan..."
          rows={4}
          value={formData.mensaje}
          onChange={handleChange}
          disabled={isSubmitting}
        />
      </div>
      <Button type="submit" className="w-full" size="lg" disabled={isSubmitting}>
        {isSubmitting ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Enviando...
          </>
        ) : (
          "Enviar Solicitud"
        )}
      </Button>
    </form>
  )
}
