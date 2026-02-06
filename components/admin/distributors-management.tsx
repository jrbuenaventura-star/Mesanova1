"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Search, MoreVertical, Pencil, Plus, Trash2, MapPin, X } from "lucide-react"
import type { Distributor, UserProfile, ShippingAddress } from "@/lib/db/types"
import { BUSINESS_TYPES, COLOMBIA_DEPARTMENTS, getCitiesByDepartment } from "@/lib/data/colombia-locations"

interface DistributorWithProfile extends Distributor {
  profile?: UserProfile
  aliado?: { id: string; company_name: string } | null
  shipping_addresses?: ShippingAddress[]
}

type AliadoOption = {
  id: string
  company_name: string
  is_active: boolean
}

interface NewAddress {
  label: string
  full_name: string
  phone: string
  address_line1: string
  address_line2: string
  state: string
  city: string
  is_default: boolean
}

const emptyAddress: NewAddress = {
  label: "",
  full_name: "",
  phone: "",
  address_line1: "",
  address_line2: "",
  state: "",
  city: "",
  is_default: false,
}

export function DistributorsManagement() {
  const router = useRouter()
  const [distributors, setDistributors] = useState<DistributorWithProfile[]>([])
  const [aliados, setAliados] = useState<AliadoOption[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [isLoading, setIsLoading] = useState(true)
  const [showDialog, setShowDialog] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [selectedDistributor, setSelectedDistributor] = useState<DistributorWithProfile | null>(null)
  const [isEditing, setIsEditing] = useState(false)

  // Shipping addresses state
  const [existingAddresses, setExistingAddresses] = useState<ShippingAddress[]>([])
  const [newAddresses, setNewAddresses] = useState<NewAddress[]>([])
  const [addressesToDelete, setAddressesToDelete] = useState<string[]>([])

  // Form state
  const [formData, setFormData] = useState({
    email: "",
    full_name: "",
    phone: "",
    company_name: "",
    company_rif: "",
    business_type: "" as string,
    discount_percentage: "0",
    credit_limit: "0",
    aliado_id: "",
    commercial_name: "",
    payment_terms: "",
    notes: "",
    document_type: "CC",
    document_number: "",
    // Legal representative (only when aliado is assigned)
    legal_rep_name: "",
    legal_rep_document: "",
    // Main address (only when aliado is assigned)
    main_address: "",
    main_state: "",
    main_city: "",
  })

  const hasAliado = formData.aliado_id !== ""
  const mainCities = getCitiesByDepartment(formData.main_state)

  useEffect(() => {
    loadDistributors()
    loadAliados()
  }, [])

  async function loadAliados() {
    try {
      const response = await fetch('/api/admin/aliados')
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Error al cargar aliados')
      }

      setAliados(data.aliados || [])
    } catch (error) {
      console.error('Error loading aliados:', error)
      setAliados([])
    }
  }

  async function loadDistributors() {
    setIsLoading(true)
    try {
      const response = await fetch('/api/admin/distributors')
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Error al cargar distribuidores')
      }

      setDistributors(data.distributors || [])
    } catch (error) {
      console.error('Error loading distributors:', error)
      setDistributors([])
    } finally {
      setIsLoading(false)
    }
  }

  async function loadShippingAddresses(userId: string) {
    try {
      const supabase = createClient()
      const { data, error } = await supabase
        .from("shipping_addresses")
        .select("*")
        .eq("user_id", userId)
        .order("is_default", { ascending: false })
        .order("created_at", { ascending: false })
      if (error) throw error
      setExistingAddresses(data || [])
    } catch (error) {
      console.error('Error loading addresses:', error)
      setExistingAddresses([])
    }
  }

  function openCreateDialog() {
    setSelectedDistributor(null)
    setIsEditing(false)
    setExistingAddresses([])
    setNewAddresses([])
    setAddressesToDelete([])
    setFormData({
      email: "",
      full_name: "",
      phone: "",
      company_name: "",
      company_rif: "",
      business_type: "",
      discount_percentage: "0",
      credit_limit: "0",
      aliado_id: "",
      commercial_name: "",
      payment_terms: "",
      notes: "",
      document_type: "CC",
      document_number: "",
      legal_rep_name: "",
      legal_rep_document: "",
      main_address: "",
      main_state: "",
      main_city: "",
    })
    setShowDialog(true)
  }

  function openEditDialog(distributor: DistributorWithProfile) {
    setSelectedDistributor(distributor)
    setIsEditing(true)
    setNewAddresses([])
    setAddressesToDelete([])
    setFormData({
      email: "",
      full_name: distributor.profile?.full_name || "",
      phone: distributor.profile?.phone || "",
      company_name: distributor.company_name,
      company_rif: distributor.company_rif || "",
      business_type: distributor.business_type || "",
      discount_percentage: distributor.discount_percentage?.toString() || "0",
      credit_limit: distributor.credit_limit?.toString() || "0",
      aliado_id: distributor.aliado_id || "",
      commercial_name: distributor.commercial_name || "",
      payment_terms: distributor.payment_terms || "",
      notes: distributor.notes || "",
      document_type: distributor.profile?.document_type || "CC",
      document_number: distributor.profile?.document_number || "",
      legal_rep_name: distributor.legal_rep_name || "",
      legal_rep_document: distributor.legal_rep_document || "",
      main_address: distributor.main_address || "",
      main_state: distributor.main_state || "",
      main_city: distributor.main_city || "",
    })
    loadShippingAddresses(distributor.user_id)
    setShowDialog(true)
  }

  function addNewAddress() {
    setNewAddresses([...newAddresses, { ...emptyAddress }])
  }

  function updateNewAddress(index: number, field: keyof NewAddress, value: string | boolean) {
    const updated = [...newAddresses]
    updated[index] = { ...updated[index], [field]: value }
    if (field === "state") {
      updated[index].city = ""
    }
    setNewAddresses(updated)
  }

  function removeNewAddress(index: number) {
    setNewAddresses(newAddresses.filter((_, i) => i !== index))
  }

  function markAddressForDeletion(addressId: string) {
    setAddressesToDelete([...addressesToDelete, addressId])
    setExistingAddresses(existingAddresses.filter((a) => a.id !== addressId))
  }

  async function handleSaveDistributor() {
    try {
      const payload = {
        formData: {
          ...formData,
          // Clear commercial fields if no aliado
          ...((!hasAliado) ? {
            discount_percentage: "0",
            credit_limit: "0",
            payment_terms: "",
            legal_rep_name: "",
            legal_rep_document: "",
            main_address: "",
            main_state: "",
            main_city: "",
          } : {}),
        },
        newAddresses: newAddresses.filter((a) => a.address_line1.trim() !== ""),
        addressesToDelete,
      }

      if (isEditing && selectedDistributor) {
        const response = await fetch('/api/admin/distributors', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            distributorId: selectedDistributor.id,
            userId: selectedDistributor.user_id,
            ...payload,
          }),
        })

        const data = await response.json()

        if (!response.ok) {
          throw new Error(data.error || 'Error al actualizar cliente')
        }
      } else {
        const response = await fetch('/api/admin/distributors', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        })

        const data = await response.json()

        if (!response.ok) {
          throw new Error(data.error || 'Error al crear cliente')
        }
      }

      await loadDistributors()
      setShowDialog(false)
    } catch (error) {
      console.error("Error saving distributor:", error)
      alert(error instanceof Error ? error.message : "Error al guardar el cliente")
    }
  }

  async function handleDeleteDistributor() {
    if (!selectedDistributor) return

    const supabase = createClient()

    try {
      const { error } = await supabase.from("distributors").delete().eq("id", selectedDistributor.id)

      if (error) throw error

      await loadDistributors()
      setShowDeleteDialog(false)
      setSelectedDistributor(null)
    } catch (error) {
      console.error("Error deleting distributor:", error)
      alert("Error al eliminar el cliente")
    }
  }

  async function handleToggleActive(id: string, currentStatus: boolean) {
    const supabase = createClient()
    const { error } = await supabase.from("distributors").update({ is_active: !currentStatus }).eq("id", id)

    if (!error) {
      await loadDistributors()
    }
  }

  const filteredDistributors = distributors.filter(
    (d) =>
      d.company_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      d.profile?.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      d.profile?.phone?.includes(searchTerm) ||
      d.company_rif?.includes(searchTerm),
  )

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar por nombre, empresa, RIF o teléfono..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>

        <Button onClick={openCreateDialog} className="gap-2">
          <Plus className="h-4 w-4" />
          Agregar Cliente
        </Button>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Cliente</TableHead>
              <TableHead>Empresa</TableHead>
              <TableHead>Tipo</TableHead>
              <TableHead>Contacto</TableHead>
              <TableHead>Aliado</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead className="w-[50px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredDistributors.map((distributor) => (
              <TableRow key={distributor.id}>
                <TableCell className="font-medium">
                  <div>
                    <div>{distributor.profile?.full_name || "Sin nombre"}</div>
                  </div>
                </TableCell>
                <TableCell>
                  <div>
                    <div>{distributor.company_name}</div>
                    {distributor.company_rif && (
                      <div className="text-sm text-muted-foreground">NIT: {distributor.company_rif}</div>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  {distributor.business_type && (
                    <Badge variant="outline">{distributor.business_type}</Badge>
                  )}
                </TableCell>
                <TableCell>
                  <div className="space-y-1 text-sm">
                    {distributor.profile?.phone && <div>{distributor.profile.phone}</div>}
                  </div>
                </TableCell>
                <TableCell>
                  {distributor.aliado ? (
                    <div>
                      <div className="text-sm">{distributor.aliado.company_name}</div>
                      <div className="text-xs text-muted-foreground">{distributor.discount_percentage}% desc.</div>
                    </div>
                  ) : (
                    <span className="text-muted-foreground text-sm">Cliente final</span>
                  )}
                </TableCell>
                <TableCell>
                  <Badge variant={distributor.is_active ? "default" : "secondary"}>
                    {distributor.is_active ? "Activo" : "Inactivo"}
                  </Badge>
                </TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => openEditDialog(distributor)}>
                        <Pencil className="mr-2 h-4 w-4" />
                        Editar
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleToggleActive(distributor.id, distributor.is_active)}>
                        {distributor.is_active ? "Desactivar" : "Activar"}
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => {
                          setSelectedDistributor(distributor)
                          setShowDeleteDialog(true)
                        }}
                        className="text-destructive"
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Eliminar
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{isEditing ? "Editar Cliente" : "Crear Nuevo Cliente"}</DialogTitle>
            <DialogDescription>
              {isEditing
                ? "Actualiza la información del cliente"
                : "Completa los datos para crear un nuevo cliente"}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {/* Email (only for creation) */}
            {!isEditing && (
              <div className="space-y-2">
                <Label htmlFor="email">Email *</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="cliente@empresa.com"
                  required
                />
              </div>
            )}

            {/* Personal Info */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="full_name">Nombre Completo *</Label>
                <Input
                  id="full_name"
                  value={formData.full_name}
                  onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                  placeholder="Juan Pérez"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Teléfono</Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="+57 300 123 4567"
                />
              </div>
            </div>

            {/* Document */}
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="document_type">Tipo de Documento</Label>
                <Select
                  value={formData.document_type}
                  onValueChange={(value) => setFormData({ ...formData, document_type: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="CC">CC</SelectItem>
                    <SelectItem value="CE">CE</SelectItem>
                    <SelectItem value="NIT">NIT</SelectItem>
                    <SelectItem value="Pasaporte">Pasaporte</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2 col-span-2">
                <Label htmlFor="document_number">Número de Documento</Label>
                <Input
                  id="document_number"
                  value={formData.document_number}
                  onChange={(e) => setFormData({ ...formData, document_number: e.target.value })}
                  placeholder="123456789"
                />
              </div>
            </div>

            {/* Company Info */}
            <div className="border-t pt-4">
              <h4 className="text-sm font-semibold mb-4">Información del Cliente</h4>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="company_name">Razón Social / Nombre *</Label>
                  <Input
                    id="company_name"
                    value={formData.company_name}
                    onChange={(e) => setFormData({ ...formData, company_name: e.target.value })}
                    placeholder="Empresa S.A.S. o Nombre Completo"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="commercial_name">Nombre Comercial</Label>
                  <Input
                    id="commercial_name"
                    value={formData.commercial_name}
                    onChange={(e) => setFormData({ ...formData, commercial_name: e.target.value })}
                    placeholder="Mi Negocio"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 mt-4">
                <div className="space-y-2">
                  <Label htmlFor="business_type">Tipo de Negocio *</Label>
                  <Select
                    value={formData.business_type}
                    onValueChange={(value) => setFormData({ ...formData, business_type: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar tipo..." />
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
                {formData.business_type !== "Persona natural" && (
                  <div className="space-y-2">
                    <Label htmlFor="company_rif">NIT</Label>
                    <Input
                      id="company_rif"
                      value={formData.company_rif}
                      onChange={(e) => setFormData({ ...formData, company_rif: e.target.value })}
                      placeholder="900123456-7"
                    />
                  </div>
                )}
              </div>

              <div className="space-y-2 mt-4">
                <Label>Aliado asignado</Label>
                <Select
                  value={formData.aliado_id || "none"}
                  onValueChange={(value) =>
                    setFormData({ ...formData, aliado_id: value === "none" ? "" : value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona un aliado" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Sin aliado (cliente final)</SelectItem>
                    {aliados.map((a) => (
                      <SelectItem key={a.id} value={a.id}>
                        {a.company_name}{a.is_active ? "" : " (Inactivo)"}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {!hasAliado && (
                  <p className="text-xs text-muted-foreground">
                    Sin aliado = cliente final (ve precios regulares)
                  </p>
                )}
              </div>
            </div>

            {/* Commercial Config - Only when aliado is assigned */}
            {hasAliado && (
              <div className="border-t pt-4">
                <h4 className="text-sm font-semibold mb-4">Configuración Comercial</h4>

                {/* Legal Representative */}
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div className="space-y-2">
                    <Label htmlFor="legal_rep_name">Representante Legal</Label>
                    <Input
                      id="legal_rep_name"
                      value={formData.legal_rep_name}
                      onChange={(e) => setFormData({ ...formData, legal_rep_name: e.target.value })}
                      placeholder="Nombre del representante legal"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="legal_rep_document">Cédula Representante Legal</Label>
                    <Input
                      id="legal_rep_document"
                      value={formData.legal_rep_document}
                      onChange={(e) => setFormData({ ...formData, legal_rep_document: e.target.value })}
                      placeholder="Número de cédula"
                    />
                  </div>
                </div>

                {/* Main Address */}
                <div className="space-y-4 mb-4">
                  <Label className="font-medium">Dirección Principal</Label>
                  <div className="space-y-2">
                    <Input
                      value={formData.main_address}
                      onChange={(e) => setFormData({ ...formData, main_address: e.target.value })}
                      placeholder="Calle 123 # 45-67"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Departamento</Label>
                      <Select
                        value={formData.main_state}
                        onValueChange={(value) =>
                          setFormData({ ...formData, main_state: value, main_city: "" })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Seleccionar departamento..." />
                        </SelectTrigger>
                        <SelectContent>
                          {COLOMBIA_DEPARTMENTS.map((dept) => (
                            <SelectItem key={dept.name} value={dept.name}>
                              {dept.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Ciudad</Label>
                      <Select
                        value={formData.main_city}
                        onValueChange={(value) =>
                          setFormData({ ...formData, main_city: value })
                        }
                        disabled={!formData.main_state}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Seleccionar ciudad..." />
                        </SelectTrigger>
                        <SelectContent>
                          {mainCities.map((city) => (
                            <SelectItem key={city} value={city}>
                              {city}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>

                {/* Commercial Terms */}
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="payment_terms">Términos de Pago</Label>
                    <Select
                      value={formData.payment_terms || "none"}
                      onValueChange={(value) => setFormData({ ...formData, payment_terms: value === "none" ? "" : value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">Sin definir</SelectItem>
                        <SelectItem value="Contado">Contado</SelectItem>
                        <SelectItem value="15 días">15 días</SelectItem>
                        <SelectItem value="30 días">30 días</SelectItem>
                        <SelectItem value="45 días">45 días</SelectItem>
                        <SelectItem value="60 días">60 días</SelectItem>
                        <SelectItem value="90 días">90 días</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="discount_percentage">Descuento (%)</Label>
                    <Input
                      id="discount_percentage"
                      type="number"
                      min="0"
                      max="100"
                      step="0.01"
                      value={formData.discount_percentage}
                      onChange={(e) => setFormData({ ...formData, discount_percentage: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="credit_limit">Crédito ($)</Label>
                    <Input
                      id="credit_limit"
                      type="number"
                      min="0"
                      step="0.01"
                      value={formData.credit_limit}
                      onChange={(e) => setFormData({ ...formData, credit_limit: e.target.value })}
                    />
                  </div>
                </div>

                <div className="space-y-2 mt-4">
                  <Label htmlFor="notes">Notas</Label>
                  <Textarea
                    id="notes"
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    placeholder="Observaciones adicionales sobre el cliente..."
                    rows={3}
                  />
                </div>
              </div>
            )}

            {/* Shipping Addresses */}
            <div className="border-t pt-4">
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-sm font-semibold">Direcciones de Envío</h4>
                <Button type="button" variant="outline" size="sm" onClick={addNewAddress}>
                  <Plus className="h-3 w-3 mr-1" />
                  Agregar Dirección
                </Button>
              </div>

              {/* Existing addresses (edit mode) */}
              {existingAddresses.length > 0 && (
                <div className="space-y-3 mb-4">
                  {existingAddresses.map((addr) => (
                    <div key={addr.id} className="flex items-start gap-3 p-3 rounded-lg border bg-muted/30">
                      <MapPin className="h-4 w-4 mt-0.5 text-muted-foreground shrink-0" />
                      <div className="flex-1 text-sm">
                        <div className="font-medium">
                          {addr.label}
                          {addr.is_default && (
                            <Badge variant="secondary" className="ml-2 text-xs">Principal</Badge>
                          )}
                        </div>
                        <div className="text-muted-foreground">
                          {addr.address_line1}
                          {addr.address_line2 && `, ${addr.address_line2}`}
                        </div>
                        <div className="text-muted-foreground">
                          {addr.city}, {addr.state}
                        </div>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        onClick={() => markAddressForDeletion(addr.id)}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}

              {/* New addresses */}
              {newAddresses.map((addr, index) => {
                const addrCities = getCitiesByDepartment(addr.state)
                return (
                  <div key={index} className="p-4 rounded-lg border mb-3 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Nueva dirección {index + 1}</span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        onClick={() => removeNewAddress(index)}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <Label className="text-xs">Etiqueta *</Label>
                        <Input
                          value={addr.label}
                          onChange={(e) => updateNewAddress(index, "label", e.target.value)}
                          placeholder="Ej: Bodega Principal"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">Nombre Contacto *</Label>
                        <Input
                          value={addr.full_name}
                          onChange={(e) => updateNewAddress(index, "full_name", e.target.value)}
                          placeholder="Juan Pérez"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <Label className="text-xs">Teléfono</Label>
                        <Input
                          value={addr.phone}
                          onChange={(e) => updateNewAddress(index, "phone", e.target.value)}
                          placeholder="+57 300 123 4567"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">
                          <input
                            type="checkbox"
                            checked={addr.is_default}
                            onChange={(e) => updateNewAddress(index, "is_default", e.target.checked)}
                            className="mr-1"
                          />
                          Dirección principal
                        </Label>
                      </div>
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Dirección *</Label>
                      <Input
                        value={addr.address_line1}
                        onChange={(e) => updateNewAddress(index, "address_line1", e.target.value)}
                        placeholder="Calle 123 # 45-67"
                      />
                    </div>
                    <Input
                      value={addr.address_line2}
                      onChange={(e) => updateNewAddress(index, "address_line2", e.target.value)}
                      placeholder="Apartamento, local, oficina (opcional)"
                    />
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <Label className="text-xs">Departamento *</Label>
                        <Select
                          value={addr.state}
                          onValueChange={(value) => updateNewAddress(index, "state", value)}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Departamento..." />
                          </SelectTrigger>
                          <SelectContent>
                            {COLOMBIA_DEPARTMENTS.map((dept) => (
                              <SelectItem key={dept.name} value={dept.name}>
                                {dept.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">Ciudad *</Label>
                        <Select
                          value={addr.city}
                          onValueChange={(value) => updateNewAddress(index, "city", value)}
                          disabled={!addr.state}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Ciudad..." />
                          </SelectTrigger>
                          <SelectContent>
                            {addrCities.map((city) => (
                              <SelectItem key={city} value={city}>
                                {city}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>
                )
              })}

              {existingAddresses.length === 0 && newAddresses.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No hay direcciones de envío registradas
                </p>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDialog(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSaveDistributor}>{isEditing ? "Actualizar" : "Crear"} Cliente</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. Se eliminará el cliente{" "}
              <strong>{selectedDistributor?.company_name}</strong> y toda su información asociada.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteDistributor} className="bg-destructive text-destructive-foreground">
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
