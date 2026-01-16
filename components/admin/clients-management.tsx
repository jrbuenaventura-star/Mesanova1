"use client"

import { useState, useEffect } from "react"
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
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Plus, Search, MoreVertical, Users, Pencil, Trash2 } from "lucide-react"
import { useRouter } from "next/navigation"
import type { Company, CompanyContact, Distributor, UserProfile } from "@/lib/db/types"

interface CompanyWithRelations extends Company {
  contacts?: CompanyContact[]
  distributor?: Distributor & { profile?: UserProfile }
}

export function ClientsManagement() {
  const router = useRouter()
  const [companies, setCompanies] = useState<CompanyWithRelations[]>([])
  const [distributors, setDistributors] = useState<(Distributor & { profile?: UserProfile })[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [isLoading, setIsLoading] = useState(true)
  const [showCompanyDialog, setShowCompanyDialog] = useState(false)
  const [showContactsDialog, setShowContactsDialog] = useState(false)
  const [selectedCompany, setSelectedCompany] = useState<CompanyWithRelations | null>(null)
  const [formData, setFormData] = useState<Partial<Company>>({
    razon_social: "",
    nit: "",
    pais: "Colombia",
    descuento_general: 0,
    limite_credito: 0,
    is_active: true,
  })

  useEffect(() => {
    loadCompanies()
    loadDistributors()
  }, [])

  async function loadCompanies() {
    const supabase = createClient()
    const { data, error } = await supabase
      .from("companies")
      .select(`
        *,
        contacts:company_contacts(*),
        distributor:distributors(*, profile:user_profiles(*))
      `)
      .order("razon_social", { ascending: true })

    if (!error && data) {
      setCompanies(data as CompanyWithRelations[])
    }
    setIsLoading(false)
  }

  async function loadDistributors() {
    const supabase = createClient()
    const { data } = await supabase.from("distributors").select("*, profile:user_profiles(*)").eq("is_active", true)

    if (data) {
      setDistributors(data as (Distributor & { profile?: UserProfile })[])
    }
  }

  async function handleSaveCompany() {
    const supabase = createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (selectedCompany) {
      const { error } = await supabase
        .from("companies")
        .update({ ...formData, updated_by: user?.id })
        .eq("id", selectedCompany.id)

      if (!error) {
        await loadCompanies()
        setShowCompanyDialog(false)
        resetForm()
      }
    } else {
      const { error } = await supabase.from("companies").insert([{ ...formData, created_by: user?.id }])

      if (!error) {
        await loadCompanies()
        setShowCompanyDialog(false)
        resetForm()
      }
    }
  }

  async function handleDeleteCompany(id: string) {
    if (!confirm("¿Está seguro de eliminar este cliente?")) return

    const supabase = createClient()
    const { error } = await supabase.from("companies").delete().eq("id", id)

    if (!error) {
      await loadCompanies()
    }
  }

  function resetForm() {
    setFormData({
      razon_social: "",
      nit: "",
      pais: "Colombia",
      descuento_general: 0,
      limite_credito: 0,
      is_active: true,
    })
    setSelectedCompany(null)
  }

  function openEditDialog(company: CompanyWithRelations) {
    setSelectedCompany(company)
    setFormData(company)
    setShowCompanyDialog(true)
  }

  function openContactsDialog(company: CompanyWithRelations) {
    setSelectedCompany(company)
    router.push(`/admin/clients/${company.id}/contacts`)
  }

  const filteredCompanies = companies.filter(
    (c) =>
      c.razon_social?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.nit?.includes(searchTerm) ||
      c.email_principal?.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar por razón social, NIT o email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Button onClick={() => setShowCompanyDialog(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Agregar Cliente
        </Button>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Razón Social</TableHead>
              <TableHead>NIT</TableHead>
              <TableHead>Ciudad</TableHead>
              <TableHead>Distribuidor Asignado</TableHead>
              <TableHead>Contactos</TableHead>
              <TableHead>Crédito</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead className="w-[50px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredCompanies.map((company) => (
              <TableRow key={company.id}>
                <TableCell className="font-medium">
                  <div>
                    <div>{company.razon_social}</div>
                    {company.nombre_comercial && (
                      <div className="text-sm text-muted-foreground">{company.nombre_comercial}</div>
                    )}
                  </div>
                </TableCell>
                <TableCell>{company.nit}</TableCell>
                <TableCell>{company.ciudad || "-"}</TableCell>
                <TableCell>{company.distributor?.profile?.full_name || "-"}</TableCell>
                <TableCell>
                  <Button variant="ghost" size="sm" onClick={() => openContactsDialog(company)}>
                    <Users className="mr-2 h-4 w-4" />
                    {company.contacts?.length || 0}
                  </Button>
                </TableCell>
                <TableCell>${company.limite_credito.toLocaleString()}</TableCell>
                <TableCell>
                  <Badge variant={company.is_active ? "default" : "secondary"}>
                    {company.is_active ? "Activo" : "Inactivo"}
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
                      <DropdownMenuItem onClick={() => openEditDialog(company)}>
                        <Pencil className="mr-2 h-4 w-4" />
                        Editar
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => openContactsDialog(company)}>
                        <Users className="mr-2 h-4 w-4" />
                        Gestionar Contactos
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleDeleteCompany(company.id)} className="text-red-600">
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

      <Dialog open={showCompanyDialog} onOpenChange={setShowCompanyDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{selectedCompany ? "Editar Cliente" : "Nuevo Cliente"}</DialogTitle>
            <DialogDescription>Complete la información del cliente empresarial</DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="razon_social">Razón Social *</Label>
                <Input
                  id="razon_social"
                  value={formData.razon_social}
                  onChange={(e) => setFormData({ ...formData, razon_social: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="nit">NIT *</Label>
                <Input
                  id="nit"
                  value={formData.nit}
                  onChange={(e) => setFormData({ ...formData, nit: e.target.value })}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="nombre_comercial">Nombre Comercial</Label>
                <Input
                  id="nombre_comercial"
                  value={formData.nombre_comercial || ""}
                  onChange={(e) => setFormData({ ...formData, nombre_comercial: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="tipo_empresa">Tipo de Empresa</Label>
                <Input
                  id="tipo_empresa"
                  value={formData.tipo_empresa || ""}
                  onChange={(e) => setFormData({ ...formData, tipo_empresa: e.target.value })}
                  placeholder="Restaurante, Hotel, etc."
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="direccion">Dirección</Label>
              <Textarea
                id="direccion"
                value={formData.direccion || ""}
                onChange={(e) => setFormData({ ...formData, direccion: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-4 gap-4">
              <div className="space-y-2">
                <Label htmlFor="ciudad">Ciudad</Label>
                <Input
                  id="ciudad"
                  value={formData.ciudad || ""}
                  onChange={(e) => setFormData({ ...formData, ciudad: e.target.value })}
                  placeholder="Ej: Bogotá"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="estado">Departamento</Label>
                <Input
                  id="estado"
                  value={formData.estado || ""}
                  onChange={(e) => setFormData({ ...formData, estado: e.target.value })}
                  placeholder="Ej: Cundinamarca"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="codigo_postal">Código Postal</Label>
                <Input
                  id="codigo_postal"
                  value={formData.codigo_postal || ""}
                  onChange={(e) => setFormData({ ...formData, codigo_postal: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="pais">País</Label>
                <Input
                  id="pais"
                  value={formData.pais || "Colombia"}
                  onChange={(e) => setFormData({ ...formData, pais: e.target.value })}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="telefono_principal">Teléfono Principal</Label>
                <Input
                  id="telefono_principal"
                  value={formData.telefono_principal || ""}
                  onChange={(e) => setFormData({ ...formData, telefono_principal: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email_principal">Email Principal</Label>
                <Input
                  id="email_principal"
                  type="email"
                  value={formData.email_principal || ""}
                  onChange={(e) => setFormData({ ...formData, email_principal: e.target.value })}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="terminos_pago">Términos de Pago</Label>
                <Select
                  value={formData.terminos_pago || ""}
                  onValueChange={(value) => setFormData({ ...formData, terminos_pago: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar..." />
                  </SelectTrigger>
                  <SelectContent>
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
                <Label htmlFor="descuento_general">Descuento General (%)</Label>
                <Input
                  id="descuento_general"
                  type="number"
                  step="0.01"
                  value={formData.descuento_general || 0}
                  onChange={(e) => setFormData({ ...formData, descuento_general: Number.parseFloat(e.target.value) })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="limite_credito">Límite de Crédito</Label>
              <Input
                id="limite_credito"
                type="number"
                step="0.01"
                value={formData.limite_credito || 0}
                onChange={(e) => setFormData({ ...formData, limite_credito: Number.parseFloat(e.target.value) })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="distribuidor_asignado_id">Distribuidor Asignado</Label>
              <Select
                value={formData.distribuidor_asignado_id || ""}
                onValueChange={(value) => setFormData({ ...formData, distribuidor_asignado_id: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar distribuidor..." />
                </SelectTrigger>
                <SelectContent>
                  {distributors.map((dist) => (
                    <SelectItem key={dist.id} value={dist.id}>
                      {dist.profile?.full_name || dist.company_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notas">Notas</Label>
              <Textarea
                id="notas"
                value={formData.notas || ""}
                onChange={(e) => setFormData({ ...formData, notas: e.target.value })}
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowCompanyDialog(false)
                resetForm()
              }}
            >
              Cancelar
            </Button>
            <Button onClick={handleSaveCompany}>Guardar Cliente</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
