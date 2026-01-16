"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
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
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { Plus, MoreVertical, Pencil, Trash2, Mail, Phone } from "lucide-react"
import type { CompanyContact } from "@/lib/db/types"

interface ContactsManagementProps {
  companyId: string
  companyName: string
}

export default function ContactsManagement({ companyId, companyName }: ContactsManagementProps) {
  const [contacts, setContacts] = useState<CompanyContact[]>([])
  const [showContactDialog, setShowContactDialog] = useState(false)
  const [selectedContact, setSelectedContact] = useState<CompanyContact | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [formData, setFormData] = useState<Partial<CompanyContact>>({
    company_id: companyId,
    nombre_completo: "",
    es_contacto_principal: false,
    recibe_facturas: false,
    recibe_pedidos: false,
    is_active: true,
  })

  useEffect(() => {
    loadContacts()
  }, [companyId])

  async function loadContacts() {
    const supabase = createClient()
    const { data, error } = await supabase
      .from("company_contacts")
      .select("*")
      .eq("company_id", companyId)
      .order("es_contacto_principal", { ascending: false })
      .order("nombre_completo", { ascending: true })

    if (!error && data) {
      setContacts(data)
    }
    setIsLoading(false)
  }

  async function handleSaveContact() {
    if (!formData.nombre_completo?.trim()) {
      alert("Por favor ingresa el nombre completo")
      return
    }

    const supabase = createClient()

    if (selectedContact) {
      const { error } = await supabase.from("company_contacts").update(formData).eq("id", selectedContact.id)

      if (!error) {
        await loadContacts()
        resetForm()
        setShowContactDialog(false)
      }
    } else {
      const { error } = await supabase.from("company_contacts").insert([{ ...formData, company_id: companyId }])

      if (!error) {
        await loadContacts()
        resetForm()
        setShowContactDialog(false)
      }
    }
  }

  async function handleDeleteContact(id: string) {
    if (!confirm("¿Está seguro de eliminar este contacto?")) return

    const supabase = createClient()
    const { error } = await supabase.from("company_contacts").delete().eq("id", id)

    if (!error) {
      await loadContacts()
    }
  }

  function resetForm() {
    setFormData({
      company_id: companyId,
      nombre_completo: "",
      es_contacto_principal: false,
      recibe_facturas: false,
      recibe_pedidos: false,
      is_active: true,
    })
    setSelectedContact(null)
  }

  function openEditDialog(contact: CompanyContact) {
    setSelectedContact(contact)
    setFormData(contact)
    setShowContactDialog(true)
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-muted-foreground">
            {contacts.length} contacto{contacts.length !== 1 ? "s" : ""} registrado{contacts.length !== 1 ? "s" : ""}
          </p>
        </div>
        <Button onClick={() => setShowContactDialog(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Agregar Contacto
        </Button>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nombre</TableHead>
              <TableHead>Cargo</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Teléfono</TableHead>
              <TableHead>Tipo</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead className="w-[50px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {contacts.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="h-24 text-center">
                  No hay contactos registrados
                </TableCell>
              </TableRow>
            ) : (
              contacts.map((contact) => (
                <TableRow key={contact.id}>
                  <TableCell className="font-medium">
                    <div>
                      <div>{contact.nombre_completo}</div>
                      {contact.es_contacto_principal && (
                        <Badge variant="secondary" className="mt-1">
                          Principal
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>{contact.cargo || "-"}</TableCell>
                  <TableCell>
                    {contact.email ? (
                      <a
                        href={`mailto:${contact.email}`}
                        className="flex items-center gap-2 text-primary hover:underline"
                      >
                        <Mail className="h-4 w-4" />
                        {contact.email}
                      </a>
                    ) : (
                      "-"
                    )}
                  </TableCell>
                  <TableCell>
                    {contact.celular || contact.telefono ? (
                      <div className="flex items-center gap-2">
                        <Phone className="h-4 w-4" />
                        {contact.celular || contact.telefono}
                      </div>
                    ) : (
                      "-"
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {contact.recibe_facturas && <Badge variant="outline">Facturas</Badge>}
                      {contact.recibe_pedidos && <Badge variant="outline">Pedidos</Badge>}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={contact.is_active ? "default" : "secondary"}>
                      {contact.is_active ? "Activo" : "Inactivo"}
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
                        <DropdownMenuItem onClick={() => openEditDialog(contact)}>
                          <Pencil className="mr-2 h-4 w-4" />
                          Editar
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleDeleteContact(contact.id)} className="text-red-600">
                          <Trash2 className="mr-2 h-4 w-4" />
                          Eliminar
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={showContactDialog} onOpenChange={setShowContactDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{selectedContact ? "Editar Contacto" : "Nuevo Contacto"}</DialogTitle>
            <DialogDescription>Persona de contacto para {companyName}</DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="nombre_completo">Nombre Completo *</Label>
                <Input
                  id="nombre_completo"
                  value={formData.nombre_completo}
                  onChange={(e) => setFormData({ ...formData, nombre_completo: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="cargo">Cargo</Label>
                <Input
                  id="cargo"
                  value={formData.cargo || ""}
                  onChange={(e) => setFormData({ ...formData, cargo: e.target.value })}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email || ""}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="celular">Celular</Label>
                <Input
                  id="celular"
                  value={formData.celular || ""}
                  onChange={(e) => setFormData({ ...formData, celular: e.target.value })}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="telefono">Teléfono Oficina</Label>
                <Input
                  id="telefono"
                  value={formData.telefono || ""}
                  onChange={(e) => setFormData({ ...formData, telefono: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="extension">Extensión</Label>
                <Input
                  id="extension"
                  value={formData.extension || ""}
                  onChange={(e) => setFormData({ ...formData, extension: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="departamento">Departamento</Label>
              <Input
                id="departamento"
                value={formData.departamento || ""}
                onChange={(e) => setFormData({ ...formData, departamento: e.target.value })}
              />
            </div>

            <div className="space-y-3">
              <Label>Preferencias</Label>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="es_contacto_principal"
                  checked={formData.es_contacto_principal}
                  onCheckedChange={(checked) => setFormData({ ...formData, es_contacto_principal: checked as boolean })}
                />
                <label htmlFor="es_contacto_principal" className="text-sm cursor-pointer">
                  Contacto Principal
                </label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="recibe_facturas"
                  checked={formData.recibe_facturas}
                  onCheckedChange={(checked) => setFormData({ ...formData, recibe_facturas: checked as boolean })}
                />
                <label htmlFor="recibe_facturas" className="text-sm cursor-pointer">
                  Recibe Facturas
                </label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="recibe_pedidos"
                  checked={formData.recibe_pedidos}
                  onCheckedChange={(checked) => setFormData({ ...formData, recibe_pedidos: checked as boolean })}
                />
                <label htmlFor="recibe_pedidos" className="text-sm cursor-pointer">
                  Recibe Notificaciones de Pedidos
                </label>
              </div>
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
                setShowContactDialog(false)
                resetForm()
              }}
            >
              Cancelar
            </Button>
            <Button onClick={handleSaveContact}>Guardar Contacto</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
