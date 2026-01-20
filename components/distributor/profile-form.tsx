'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useToast } from '@/hooks/use-toast'
import { Loader2 } from 'lucide-react'

const BUSINESS_TYPES = [
  "Tienda de hogar",
  "Restaurante",
  "Hotel",
  "Catering",
  "Mayorista",
  "Minorista",
  "Institucional",
  "Otro"
]

interface DistributorProfileFormProps {
  distributor: any
  userProfile: any
}

export function DistributorProfileForm({ distributor, userProfile }: DistributorProfileFormProps) {
  const router = useRouter()
  const { toast } = useToast()
  const supabase = createClient()
  
  const [isLoading, setIsLoading] = useState(false)
  const [formData, setFormData] = useState({
    company_name: distributor?.company_name || '',
    company_rif: distributor?.company_rif || '',
    business_type: distributor?.business_type || '',
    contact_name: distributor?.contact_name || userProfile?.full_name || '',
    contact_email: distributor?.contact_email || '',
    contact_phone: distributor?.contact_phone || userProfile?.phone || '',
    contact_position: distributor?.contact_position || '',
    address: distributor?.address || '',
    city: distributor?.city || '',
    state: distributor?.state || '',
  })

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      if (distributor?.id) {
        // Actualizar distribuidor existente
        const { error } = await supabase
          .from('distributors')
          .update({
            company_name: formData.company_name,
            company_rif: formData.company_rif,
            business_type: formData.business_type,
            contact_name: formData.contact_name,
            contact_email: formData.contact_email,
            contact_phone: formData.contact_phone,
            contact_position: formData.contact_position,
            address: formData.address,
            city: formData.city,
            state: formData.state,
          })
          .eq('id', distributor.id)

        if (error) throw error
      } else {
        // Crear nuevo distribuidor
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) throw new Error('No autenticado')

        const { error } = await supabase
          .from('distributors')
          .insert({
            user_id: user.id,
            company_name: formData.company_name,
            company_rif: formData.company_rif,
            business_type: formData.business_type,
            contact_name: formData.contact_name,
            contact_email: formData.contact_email,
            contact_phone: formData.contact_phone,
            contact_position: formData.contact_position,
            address: formData.address,
            city: formData.city,
            state: formData.state,
            requires_approval: true,
          })

        if (error) throw error
      }

      toast({
        title: 'Perfil actualizado',
        description: 'Los cambios se han guardado correctamente',
      })

      router.refresh()
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'No se pudo guardar el perfil',
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="company_name">Nombre de la Empresa *</Label>
          <Input
            id="company_name"
            value={formData.company_name}
            onChange={(e) => handleChange('company_name', e.target.value)}
            placeholder="Mi Empresa S.A.S."
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="company_rif">NIT / RIF</Label>
          <Input
            id="company_rif"
            value={formData.company_rif}
            onChange={(e) => handleChange('company_rif', e.target.value)}
            placeholder="900.123.456-7"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="business_type">Tipo de Negocio *</Label>
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
          <Label htmlFor="contact_email">Email de Contacto</Label>
          <Input
            id="contact_email"
            type="email"
            value={formData.contact_email}
            onChange={(e) => handleChange('contact_email', e.target.value)}
            placeholder="contacto@empresa.com"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="contact_phone">Teléfono de Contacto</Label>
          <Input
            id="contact_phone"
            value={formData.contact_phone}
            onChange={(e) => handleChange('contact_phone', e.target.value)}
            placeholder="+57 300 123 4567"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="contact_position">Cargo</Label>
          <Input
            id="contact_position"
            value={formData.contact_position}
            onChange={(e) => handleChange('contact_position', e.target.value)}
            placeholder="Gerente de Compras"
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
      </div>

      <Button type="submit" disabled={isLoading} className="w-full">
        {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        {distributor ? 'Guardar Cambios' : 'Crear Perfil'}
      </Button>
    </form>
  )
}
