'use client'

import { useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import { Loader2 } from "lucide-react"

type AliadoProfile = {
  id: string
  company_name: string | null
  contact_name: string | null
  email: string | null
  phone: string | null
}

type UserProfile = {
  id: string
  full_name: string | null
  phone: string | null
}

export function AliadoProfileForm({ aliado, userProfile }: { aliado: AliadoProfile; userProfile: UserProfile }) {
  const router = useRouter()
  const { toast } = useToast()
  const supabase = createClient()

  const [isLoading, setIsLoading] = useState(false)
  const [formData, setFormData] = useState({
    company_name: aliado.company_name || "",
    contact_name: aliado.contact_name || userProfile.full_name || "",
    email: aliado.email || "",
    phone: aliado.phone || userProfile.phone || "",
  })

  const handleChange = (field: keyof typeof formData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const { error } = await supabase
        .from("aliados")
        .update({
          company_name: formData.company_name,
          contact_name: formData.contact_name,
          email: formData.email,
          phone: formData.phone,
        })
        .eq("id", aliado.id)

      if (error) throw error

      toast({
        title: "Perfil actualizado",
        description: "Los cambios se han guardado correctamente",
      })

      router.refresh()
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "No se pudo guardar el perfil",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="company_name">Empresa</Label>
          <Input
            id="company_name"
            value={formData.company_name}
            onChange={(e) => handleChange("company_name", e.target.value)}
            placeholder="Nombre de la empresa"
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

        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            value={formData.email}
            onChange={(e) => handleChange("email", e.target.value)}
            placeholder="correo@empresa.com"
          />
        </div>
      </div>

      <Button type="submit" disabled={isLoading} className="w-full">
        {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        Guardar cambios
      </Button>
    </form>
  )
}
