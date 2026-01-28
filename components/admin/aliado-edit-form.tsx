'use client'

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { useToast } from "@/hooks/use-toast"
import { Loader2 } from "lucide-react"

type AliadoEditFormProps = {
  aliado: {
    id: string
    company_name: string
    contact_name: string | null
    email: string
    phone: string | null
    commission_percentage: number
    is_active: boolean
  }
}

export function AliadoEditForm({ aliado }: AliadoEditFormProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(false)
  const [formData, setFormData] = useState({
    company_name: aliado.company_name,
    contact_name: aliado.contact_name || "",
    phone: aliado.phone || "",
    commission_percentage: aliado.commission_percentage.toString(),
    is_active: aliado.is_active,
  })

  const handleChange = (field: keyof typeof formData, value: string | boolean) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const res = await fetch(`/api/admin/aliados/${aliado.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          company_name: formData.company_name,
          contact_name: formData.contact_name || null,
          phone: formData.phone || null,
          commission_percentage: Number.parseFloat(formData.commission_percentage),
          is_active: formData.is_active,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || "Error al actualizar")
      }

      toast({
        title: "Aliado actualizado",
        description: "Los cambios se han guardado correctamente",
      })

      router.refresh()
      router.push("/admin/aliados")
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "No se pudo actualizar el aliado",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="company_name">Nombre de la empresa *</Label>
          <Input
            id="company_name"
            value={formData.company_name}
            onChange={(e) => handleChange("company_name", e.target.value)}
            placeholder="Ej: Distribuidora XYZ"
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="contact_name">Nombre de contacto</Label>
          <Input
            id="contact_name"
            value={formData.contact_name}
            onChange={(e) => handleChange("contact_name", e.target.value)}
            placeholder="Nombre y apellido"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="phone">Teléfono</Label>
          <Input
            id="phone"
            value={formData.phone}
            onChange={(e) => handleChange("phone", e.target.value)}
            placeholder="+57 300 000 0000"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="commission_percentage">Porcentaje de comisión (%)</Label>
          <Input
            id="commission_percentage"
            type="number"
            step="0.01"
            min="0"
            max="100"
            value={formData.commission_percentage}
            onChange={(e) => handleChange("commission_percentage", e.target.value)}
            placeholder="0.00"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="email">Email (solo lectura)</Label>
          <Input
            id="email"
            type="email"
            value={aliado.email}
            disabled
            className="bg-muted"
          />
          <p className="text-xs text-muted-foreground">
            El email no se puede cambiar después de crear el aliado
          </p>
        </div>

        <div className="flex items-center space-x-2 md:col-span-2">
          <Switch
            id="is_active"
            checked={formData.is_active}
            onCheckedChange={(checked) => handleChange("is_active", checked)}
          />
          <Label htmlFor="is_active" className="cursor-pointer">
            Aliado activo
          </Label>
        </div>
      </div>

      <div className="flex gap-4">
        <Button type="submit" disabled={isLoading}>
          {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Guardar cambios
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => router.push("/admin/aliados")}
          disabled={isLoading}
        >
          Cancelar
        </Button>
      </div>
    </form>
  )
}
