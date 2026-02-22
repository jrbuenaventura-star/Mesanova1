'use client'

import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { useToast } from '@/hooks/use-toast'
import { Loader2 } from 'lucide-react'
import { BUSINESS_TYPES, COLOMBIA_DEPARTMENTS, getCitiesByDepartment } from '@/lib/data/colombia-locations'

interface DistributorProfileFormProps {
  distributor: any
  userProfile: any
}

const PAYMENT_TERMS_OPTIONS = ['Contado', '15 días', '30 días', '45 días', '60 días', '90 días'] as const

const toNullIfEmpty = (value: string) => {
  const trimmedValue = value.trim()
  return trimmedValue.length > 0 ? trimmedValue : null
}

export function DistributorProfileForm({ distributor, userProfile }: DistributorProfileFormProps) {
  const router = useRouter()
  const { toast } = useToast()
  const supabase = createClient()
  
  const [isLoading, setIsLoading] = useState(false)
  const [formData, setFormData] = useState({
    company_name: distributor?.company_name || '',
    commercial_name: distributor?.commercial_name || '',
    company_rif: distributor?.company_rif || '',
    business_type: distributor?.business_type || '',
    contact_name: distributor?.contact_name || userProfile?.full_name || '',
    contact_email: distributor?.contact_email || '',
    contact_phone: distributor?.contact_phone || userProfile?.phone || '',
    contact_position: distributor?.contact_position || '',
    legal_rep_name: distributor?.legal_rep_name || '',
    legal_rep_document: distributor?.legal_rep_document || '',
    main_address: distributor?.main_address || distributor?.address || '',
    main_city: distributor?.main_city || distributor?.city || '',
    main_state: distributor?.main_state || distributor?.state || '',
    payment_terms: distributor?.payment_terms || '',
    notes: distributor?.notes || '',
  })

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const availableCities = useMemo(
    () => getCitiesByDepartment(formData.main_state),
    [formData.main_state]
  )

  const handleStateChange = (state: string) => {
    setFormData((prev) => {
      const cities = getCitiesByDepartment(state)
      const shouldKeepCity = prev.main_city && cities.includes(prev.main_city)
      return {
        ...prev,
        main_state: state,
        main_city: shouldKeepCity ? prev.main_city : '',
      }
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      if (!formData.business_type) {
        throw new Error('Selecciona el tipo de negocio')
      }

      const payload = {
        company_name: formData.company_name.trim(),
        commercial_name: toNullIfEmpty(formData.commercial_name),
        company_rif: toNullIfEmpty(formData.company_rif),
        business_type: toNullIfEmpty(formData.business_type),
        contact_name: toNullIfEmpty(formData.contact_name),
        contact_email: toNullIfEmpty(formData.contact_email),
        contact_phone: toNullIfEmpty(formData.contact_phone),
        contact_position: toNullIfEmpty(formData.contact_position),
        legal_rep_name: toNullIfEmpty(formData.legal_rep_name),
        legal_rep_document: toNullIfEmpty(formData.legal_rep_document),
        main_address: toNullIfEmpty(formData.main_address),
        main_city: toNullIfEmpty(formData.main_city),
        main_state: toNullIfEmpty(formData.main_state),
        address: toNullIfEmpty(formData.main_address),
        city: toNullIfEmpty(formData.main_city),
        state: toNullIfEmpty(formData.main_state),
        payment_terms: toNullIfEmpty(formData.payment_terms),
        notes: toNullIfEmpty(formData.notes),
      }

      if (distributor?.id) {
        // Actualizar distribuidor existente
        const { error } = await supabase
          .from('distributors')
          .update(payload)
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
            ...payload,
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
          <Label htmlFor="company_name">Razón Social *</Label>
          <Input
            id="company_name"
            value={formData.company_name}
            onChange={(e) => handleChange('company_name', e.target.value)}
            placeholder="Mi Empresa S.A.S"
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
          <Label htmlFor="commercial_name">Nombre Comercial</Label>
          <Input
            id="commercial_name"
            value={formData.commercial_name}
            onChange={(e) => handleChange('commercial_name', e.target.value)}
            placeholder="Nombre de marca o local"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="business_type">Tipo de Negocio *</Label>
          <Select
            value={formData.business_type || undefined}
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

        <div className="space-y-2">
          <Label htmlFor="legal_rep_name">Representante Legal</Label>
          <Input
            id="legal_rep_name"
            value={formData.legal_rep_name}
            onChange={(e) => handleChange('legal_rep_name', e.target.value)}
            placeholder="Nombre del representante legal"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="legal_rep_document">Documento Representante Legal</Label>
          <Input
            id="legal_rep_document"
            value={formData.legal_rep_document}
            onChange={(e) => handleChange('legal_rep_document', e.target.value)}
            placeholder="Número de identificación"
          />
        </div>

        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="main_address">Dirección principal</Label>
          <Input
            id="main_address"
            value={formData.main_address}
            onChange={(e) => handleChange('main_address', e.target.value)}
            placeholder="Calle 123 # 45-67"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="main_state">Departamento</Label>
          <Select value={formData.main_state || undefined} onValueChange={handleStateChange}>
            <SelectTrigger id="main_state">
              <SelectValue placeholder="Selecciona departamento" />
            </SelectTrigger>
            <SelectContent>
              {COLOMBIA_DEPARTMENTS.map((department) => (
                <SelectItem key={department.name} value={department.name}>
                  {department.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="main_city">Ciudad</Label>
          <Select
            value={formData.main_city || undefined}
            onValueChange={(value) => handleChange('main_city', value)}
            disabled={!formData.main_state}
          >
            <SelectTrigger id="main_city">
              <SelectValue placeholder={formData.main_state ? 'Selecciona ciudad' : 'Selecciona departamento primero'} />
            </SelectTrigger>
            <SelectContent>
              {availableCities.map((city) => (
                <SelectItem key={city} value={city}>
                  {city}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="payment_terms">Términos de Pago</Label>
          <Select
            value={formData.payment_terms || 'none'}
            onValueChange={(value) => handleChange('payment_terms', value === 'none' ? '' : value)}
          >
            <SelectTrigger id="payment_terms">
              <SelectValue placeholder="Selecciona términos" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">Sin definir</SelectItem>
              {PAYMENT_TERMS_OPTIONS.map((term) => (
                <SelectItem key={term} value={term}>
                  {term}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="notes">Notas internas</Label>
          <Textarea
            id="notes"
            value={formData.notes}
            onChange={(e) => handleChange('notes', e.target.value)}
            placeholder="Comentarios adicionales para administración comercial"
            rows={3}
          />
        </div>
      </div>

      <Button type="submit" disabled={isLoading} className="w-full" aria-label="Enviar">
        {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        {distributor ? 'Guardar Cambios' : 'Crear Perfil'}
      </Button>
    </form>
  )
}
