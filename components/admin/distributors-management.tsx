"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
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
import { Search, MoreVertical, Pencil, Plus, Trash2, Users } from "lucide-react"
import type { Distributor, UserProfile } from "@/lib/db/types"

interface DistributorWithProfile extends Distributor {
  profile?: UserProfile
  clients_count?: number
}

export function DistributorsManagement() {
  const router = useRouter()
  const [distributors, setDistributors] = useState<DistributorWithProfile[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [isLoading, setIsLoading] = useState(true)
  const [showDialog, setShowDialog] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [selectedDistributor, setSelectedDistributor] = useState<DistributorWithProfile | null>(null)
  const [isEditing, setIsEditing] = useState(false)

  // Form state
  const [formData, setFormData] = useState({
    email: "",
    full_name: "",
    phone: "",
    company_name: "",
    company_rif: "",
    business_type: "",
    discount_percentage: "0",
    credit_limit: "0",
    document_type: "CC",
    document_number: "",
    shipping_address: "",
    shipping_city: "",
    shipping_state: "",
    shipping_postal_code: "",
    shipping_country: "Colombia",
  })

  useEffect(() => {
    loadDistributors()
  }, [])

  async function loadDistributors() {
    const supabase = createClient()

    const { data: distData, error } = await supabase
      .from("distributors")
      .select(`
        *,
        profile:user_profiles(*)
      `)
      .order("company_name", { ascending: true })

    if (!error && distData) {
      const distributorsWithCounts = await Promise.all(
        distData.map(async (dist: any) => {
          const { count } = await supabase
            .from("companies")
            .select("*", { count: "exact", head: true })
            .eq("distribuidor_asignado_id", dist.id)

          return {
            ...dist,
            clients_count: count || 0,
          }
        }),
      )

      setDistributors(distributorsWithCounts as DistributorWithProfile[])
    }
    setIsLoading(false)
  }

  function openCreateDialog() {
    setSelectedDistributor(null)
    setIsEditing(false)
    setFormData({
      email: "",
      full_name: "",
      phone: "",
      company_name: "",
      company_rif: "",
      business_type: "",
      discount_percentage: "0",
      credit_limit: "0",
      document_type: "CC",
      document_number: "",
      shipping_address: "",
      shipping_city: "",
      shipping_state: "",
      shipping_postal_code: "",
      shipping_country: "Colombia",
    })
    setShowDialog(true)
  }

  function openEditDialog(distributor: DistributorWithProfile) {
    setSelectedDistributor(distributor)
    setIsEditing(true)
    setFormData({
      email: "", // Can't change email
      full_name: distributor.profile?.full_name || "",
      phone: distributor.profile?.phone || "",
      company_name: distributor.company_name,
      company_rif: distributor.company_rif || "",
      business_type: distributor.business_type || "",
      discount_percentage: distributor.discount_percentage?.toString() || "0",
      credit_limit: distributor.credit_limit?.toString() || "0",
      document_type: distributor.profile?.document_type || "CC",
      document_number: distributor.profile?.document_number || "",
      shipping_address: distributor.profile?.shipping_address || "",
      shipping_city: distributor.profile?.shipping_city || "",
      shipping_state: distributor.profile?.shipping_state || "",
      shipping_postal_code: distributor.profile?.shipping_postal_code || "",
      shipping_country: distributor.profile?.shipping_country || "Colombia",
    })
    setShowDialog(true)
  }

  async function handleSaveDistributor() {
    try {
      if (isEditing && selectedDistributor) {
        // Update existing distributor via API
        const response = await fetch('/api/admin/distributors', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            distributorId: selectedDistributor.id,
            userId: selectedDistributor.user_id,
            formData,
          }),
        })

        const data = await response.json()

        if (!response.ok) {
          throw new Error(data.error || 'Error al actualizar distribuidor')
        }
      } else {
        // Create new distributor via API
        const response = await fetch('/api/admin/distributors', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ formData }),
        })

        const data = await response.json()

        if (!response.ok) {
          throw new Error(data.error || 'Error al crear distribuidor')
        }
      }

      await loadDistributors()
      setShowDialog(false)
    } catch (error) {
      console.error("Error saving distributor:", error)
      alert(error instanceof Error ? error.message : "Error al guardar el distribuidor")
    }
  }

  async function handleDeleteDistributor() {
    if (!selectedDistributor) return

    const supabase = createClient()

    try {
      // Delete distributor (cascade will handle related records)
      const { error } = await supabase.from("distributors").delete().eq("id", selectedDistributor.id)

      if (error) throw error

      await loadDistributors()
      setShowDeleteDialog(false)
      setSelectedDistributor(null)
    } catch (error) {
      console.error("Error deleting distributor:", error)
      alert("Error al eliminar el distribuidor")
    }
  }

  function viewDistributorClients(distributorId: string) {
    router.push(`/admin/distributors/${distributorId}/clients`)
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
          Agregar Distribuidor
        </Button>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Distribuidor</TableHead>
              <TableHead>Empresa</TableHead>
              <TableHead>Contacto</TableHead>
              <TableHead>Clientes Asignados</TableHead>
              <TableHead>Descuento</TableHead>
              <TableHead>Crédito</TableHead>
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
                    {distributor.business_type && (
                      <div className="text-sm text-muted-foreground">{distributor.business_type}</div>
                    )}
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
                  <div className="space-y-1 text-sm">
                    {distributor.profile?.phone && <div>{distributor.profile.phone}</div>}
                    {distributor.profile?.id && <div className="text-muted-foreground">Email registrado</div>}
                  </div>
                </TableCell>
                <TableCell>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="gap-2"
                    onClick={() => viewDistributorClients(distributor.id)}
                  >
                    <Users className="h-4 w-4" />
                    {distributor.clients_count || 0}
                  </Button>
                </TableCell>
                <TableCell>{distributor.discount_percentage}%</TableCell>
                <TableCell>
                  <div>
                    <div className="text-sm font-medium">${distributor.credit_limit?.toLocaleString() || "0"}</div>
                    <div className="text-xs text-muted-foreground">
                      Usado: ${distributor.current_balance?.toLocaleString() || "0"}
                    </div>
                  </div>
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
                      <DropdownMenuItem onClick={() => viewDistributorClients(distributor.id)}>
                        <Users className="mr-2 h-4 w-4" />
                        Ver Clientes
                      </DropdownMenuItem>
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
            <DialogTitle>{isEditing ? "Editar Distribuidor" : "Crear Nuevo Distribuidor"}</DialogTitle>
            <DialogDescription>
              {isEditing
                ? "Actualiza la información del distribuidor"
                : "Completa los datos para crear un nuevo distribuidor"}
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
                  placeholder="distribuidor@empresa.com"
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
                <select
                  id="document_type"
                  value={formData.document_type}
                  onChange={(e) => setFormData({ ...formData, document_type: e.target.value })}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                >
                  <option value="CC">CC</option>
                  <option value="CE">CE</option>
                  <option value="Pasaporte">Pasaporte</option>
                </select>
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
              <h4 className="text-sm font-semibold mb-4">Información de la Empresa</h4>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="company_name">Nombre de la Empresa *</Label>
                  <Input
                    id="company_name"
                    value={formData.company_name}
                    onChange={(e) => setFormData({ ...formData, company_name: e.target.value })}
                    placeholder="Distribuidora XYZ"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="company_rif">NIT/RIF</Label>
                  <Input
                    id="company_rif"
                    value={formData.company_rif}
                    onChange={(e) => setFormData({ ...formData, company_rif: e.target.value })}
                    placeholder="900123456-7"
                  />
                </div>
              </div>

              <div className="space-y-2 mt-4">
                <Label htmlFor="business_type">Tipo de Negocio</Label>
                <Input
                  id="business_type"
                  value={formData.business_type}
                  onChange={(e) => setFormData({ ...formData, business_type: e.target.value })}
                  placeholder="Tienda, Restaurante, Hotel..."
                />
              </div>
            </div>

            {/* Commercial Config */}
            <div className="border-t pt-4">
              <h4 className="text-sm font-semibold mb-4">Configuración Comercial</h4>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="discount_percentage">Descuento General (%)</Label>
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
                  <Label htmlFor="credit_limit">Límite de Crédito ($)</Label>
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
            </div>

            {/* Address */}
            <div className="border-t pt-4">
              <h4 className="text-sm font-semibold mb-4">Dirección de Envío</h4>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="shipping_address">Dirección</Label>
                  <Textarea
                    id="shipping_address"
                    value={formData.shipping_address}
                    onChange={(e) => setFormData({ ...formData, shipping_address: e.target.value })}
                    placeholder="Calle 123 # 45-67"
                    rows={2}
                  />
                </div>
                <div className="grid grid-cols-4 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="shipping_city">Ciudad</Label>
                    <Input
                      id="shipping_city"
                      value={formData.shipping_city}
                      onChange={(e) => setFormData({ ...formData, shipping_city: e.target.value })}
                      placeholder="Bogotá"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="shipping_state">Departamento</Label>
                    <Input
                      id="shipping_state"
                      value={formData.shipping_state}
                      onChange={(e) => setFormData({ ...formData, shipping_state: e.target.value })}
                      placeholder="Cundinamarca"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="shipping_postal_code">Código Postal</Label>
                    <Input
                      id="shipping_postal_code"
                      value={formData.shipping_postal_code}
                      onChange={(e) => setFormData({ ...formData, shipping_postal_code: e.target.value })}
                      placeholder="110111"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="shipping_country">País</Label>
                    <Input
                      id="shipping_country"
                      value={formData.shipping_country}
                      onChange={(e) => setFormData({ ...formData, shipping_country: e.target.value })}
                      placeholder="Colombia"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDialog(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSaveDistributor}>{isEditing ? "Actualizar" : "Crear"} Distribuidor</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. Se eliminará el distribuidor{" "}
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
