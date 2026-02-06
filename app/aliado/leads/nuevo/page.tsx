'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from '@/hooks/use-toast'
import { ArrowLeft, Loader2, UserPlus } from "lucide-react"
import Link from "next/link"
import { BUSINESS_TYPES } from "@/lib/data/colombia-locations"

export default function NuevoLeadPage() {
  const router = useRouter()
  const { toast } = useToast()
  const supabase = createClient()
  
  const [isLoading, setIsLoading] = useState(false)
  const [formData, setFormData] = useState({
    company_name: '',
    business_type: '',
    contact_name: '',
    contact_phone: '',
    contact_email: '',
    contact_position: '',
    city: '',
    state: '',
    address: '',
    notes: '',
  })

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      // Obtener aliado_id del usuario actual
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('No autenticado')

      const { data: aliado } = await supabase
        .from('aliados')
        .select('id')
        .eq('user_id', user.id)
        .single()

      if (!aliado) throw new Error('No tienes perfil de aliado')

      // Crear lead
      const { error } = await supabase
        .from('leads')
        .insert({
          aliado_id: aliado.id,
          company_name: formData.company_name,
          business_type: formData.business_type || null,
          contact_name: formData.contact_name,
          contact_phone: formData.contact_phone || null,
          contact_email: formData.contact_email || null,
          contact_position: formData.contact_position || null,
          city: formData.city || null,
          state: formData.state || null,
          address: formData.address || null,
          notes: formData.notes || null,
          stage: 'prospecto',
        })

      if (error) throw error

      toast({
        title: 'Lead creado',
        description: 'El prospecto se ha registrado correctamente',
      })

      router.push('/aliado/leads')
      router.refresh()
    } catch (error: any) {
      console.error('Error:', error)
      toast({
        title: 'Error',
        description: error.message || 'No se pudo crear el lead',
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="container mx-auto py-8 px-4 max-w-2xl">
      <div className="mb-6">
        <Button variant="ghost" asChild className="mb-4">
          <Link href="/aliado/leads">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Volver a CRM
          </Link>
        </Button>
        <h1 className="text-3xl font-bold">Nuevo Lead</h1>
        <p className="text-muted-foreground">Registra un nuevo prospecto de distribuidor</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5" />
            Información del Prospecto
          </CardTitle>
          <CardDescription>
            Ingresa los datos del potencial distribuidor
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Información de la empresa */}
            <div className="space-y-4">
              <h3 className="font-medium">Empresa</h3>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="company_name">Nombre de la Empresa *</Label>
                  <Input
                    id="company_name"
                    value={formData.company_name}
                    onChange={(e) => handleChange('company_name', e.target.value)}
                    placeholder="Empresa ABC S.A.S."
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="business_type">Tipo de Negocio</Label>
                  <Select
                    value={formData.business_type}
                    onValueChange={(value) => handleChange('business_type', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona tipo" />
                    </SelectTrigger>
                    <SelectContent>
                      {BUSINESS_TYPES.map((type) => (
                        <SelectItem key={type} value={type}>
                          {type}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* Contacto */}
            <div className="space-y-4">
              <h3 className="font-medium">Contacto Principal</h3>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="contact_name">Nombre del Contacto *</Label>
                  <Input
                    id="contact_name"
                    value={formData.contact_name}
                    onChange={(e) => handleChange('contact_name', e.target.value)}
                    placeholder="Juan Pérez"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="contact_position">Cargo</Label>
                  <Input
                    id="contact_position"
                    value={formData.contact_position}
                    onChange={(e) => handleChange('contact_position', e.target.value)}
                    placeholder="Gerente General"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="contact_phone">Teléfono</Label>
                  <Input
                    id="contact_phone"
                    value={formData.contact_phone}
                    onChange={(e) => handleChange('contact_phone', e.target.value)}
                    placeholder="+57 300 123 4567"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="contact_email">Email</Label>
                  <Input
                    id="contact_email"
                    type="email"
                    value={formData.contact_email}
                    onChange={(e) => handleChange('contact_email', e.target.value)}
                    placeholder="contacto@empresa.com"
                  />
                </div>
              </div>
            </div>

            {/* Ubicación */}
            <div className="space-y-4">
              <h3 className="font-medium">Ubicación</h3>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="city">Ciudad</Label>
                  <Input
                    id="city"
                    value={formData.city}
                    onChange={(e) => handleChange('city', e.target.value)}
                    placeholder="Bogotá"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="state">Departamento</Label>
                  <Input
                    id="state"
                    value={formData.state}
                    onChange={(e) => handleChange('state', e.target.value)}
                    placeholder="Cundinamarca"
                  />
                </div>

                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="address">Dirección</Label>
                  <Input
                    id="address"
                    value={formData.address}
                    onChange={(e) => handleChange('address', e.target.value)}
                    placeholder="Calle 123 # 45-67"
                  />
                </div>
              </div>
            </div>

            {/* Notas */}
            <div className="space-y-2">
              <Label htmlFor="notes">Notas</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => handleChange('notes', e.target.value)}
                placeholder="Información adicional sobre el prospecto..."
                rows={4}
              />
            </div>

            <div className="flex gap-4">
              <Button type="button" variant="outline" onClick={() => router.back()}>
                Cancelar
              </Button>
              <Button type="submit" disabled={isLoading} className="flex-1">
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Crear Lead
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
