"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"

export function AliadoCreateForm() {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [formData, setFormData] = useState({
    email: "",
    company_name: "",
    contact_name: "",
    phone: "",
    commission_percentage: "0",
    is_active: true,
  })

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setIsSubmitting(true)

    try {
      const res = await fetch("/api/admin/aliados", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      })

      const data = (await res.json()) as { success?: boolean; error?: string }

      if (!res.ok) {
        throw new Error(data.error || "Error creando aliado")
      }

      router.push("/admin/aliados")
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error creando aliado")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="company_name">Empresa *</Label>
          <Input
            id="company_name"
            value={formData.company_name}
            onChange={(e) => setFormData((p) => ({ ...p, company_name: e.target.value }))}
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="email">Email (invitación) *</Label>
          <Input
            id="email"
            type="email"
            value={formData.email}
            onChange={(e) => setFormData((p) => ({ ...p, email: e.target.value }))}
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="contact_name">Nombre contacto</Label>
          <Input
            id="contact_name"
            value={formData.contact_name}
            onChange={(e) => setFormData((p) => ({ ...p, contact_name: e.target.value }))}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="phone">Teléfono</Label>
          <Input
            id="phone"
            value={formData.phone}
            onChange={(e) => setFormData((p) => ({ ...p, phone: e.target.value }))}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="commission_percentage">Comisión (%)</Label>
          <Input
            id="commission_percentage"
            inputMode="decimal"
            value={formData.commission_percentage}
            onChange={(e) => setFormData((p) => ({ ...p, commission_percentage: e.target.value }))}
          />
        </div>

        <div className="space-y-2">
          <Label>Activo</Label>
          <div className="flex items-center gap-3">
            <Switch
              checked={formData.is_active}
              onCheckedChange={(checked) => setFormData((p) => ({ ...p, is_active: checked }))}
            />
            <span className="text-sm text-muted-foreground">
              {formData.is_active ? "Activo" : "Inactivo"}
            </span>
          </div>
        </div>
      </div>

      {error ? <div className="text-sm text-destructive">{error}</div> : null}

      <div className="flex gap-2">
        <Button type="button" variant="outline" onClick={() => router.push("/admin/aliados")}>
          Cancelar
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          Crear y Enviar Invitación
        </Button>
      </div>
    </form>
  )
}
