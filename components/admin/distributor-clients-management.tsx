"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Search, Building2, MapPin, Phone, Mail } from "lucide-react"
import type { Company } from "@/lib/db/types"

interface DistributorClientsManagementProps {
  distributorId: string
  distributorName: string
}

export function DistributorClientsManagement({ distributorId, distributorName }: DistributorClientsManagementProps) {
  const [clients, setClients] = useState<Company[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    loadClients()
  }, [distributorId])

  async function loadClients() {
    const supabase = createClient()

    const { data, error } = await supabase
      .from("companies")
      .select("*")
      .eq("distribuidor_asignado_id", distributorId)
      .order("razon_social", { ascending: true })

    if (!error && data) {
      setClients(data)
    }
    setIsLoading(false)
  }

  const filteredClients = clients.filter(
    (c) =>
      c.razon_social?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.nit?.includes(searchTerm) ||
      c.ciudad?.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar por nombre, NIT o ciudad..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Badge variant="secondary" className="text-base px-4 py-2">
          Total: {filteredClients.length} clientes
        </Badge>
      </div>

      {isLoading ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground">Cargando clientes...</p>
        </div>
      ) : filteredClients.length === 0 ? (
        <div className="text-center py-12 border rounded-lg">
          <Building2 className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <p className="text-lg font-medium">No hay clientes asignados</p>
          <p className="text-sm text-muted-foreground">Este distribuidor aún no tiene clientes asignados</p>
        </div>
      ) : (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Cliente</TableHead>
                <TableHead>NIT</TableHead>
                <TableHead>Ubicación</TableHead>
                <TableHead>Contacto</TableHead>
                <TableHead>Condiciones</TableHead>
                <TableHead>Estado</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredClients.map((client) => (
                <TableRow key={client.id}>
                  <TableCell className="font-medium">
                    <div>
                      <div>{client.razon_social}</div>
                      {client.tipo_empresa && (
                        <div className="text-sm text-muted-foreground">{client.tipo_empresa}</div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <code className="text-sm">{client.nit}</code>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-start gap-2">
                      <MapPin className="h-4 w-4 mt-0.5 text-muted-foreground flex-shrink-0" />
                      <div className="text-sm">
                        <div>{client.ciudad}</div>
                        {client.estado && <div className="text-muted-foreground">{client.estado}</div>}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1 text-sm">
                      {client.telefono && (
                        <div className="flex items-center gap-2">
                          <Phone className="h-3 w-3 text-muted-foreground" />
                          {client.telefono}
                        </div>
                      )}
                      {client.email && (
                        <div className="flex items-center gap-2">
                          <Mail className="h-3 w-3 text-muted-foreground" />
                          {client.email}
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm space-y-1">
                      {client.descuento_general && client.descuento_general > 0 && (
                        <div>Desc: {client.descuento_general}%</div>
                      )}
                      {client.limite_credito && client.limite_credito > 0 && (
                        <div className="text-muted-foreground">Crédito: ${client.limite_credito.toLocaleString()}</div>
                      )}
                      {client.terminos_pago && <div className="text-muted-foreground">{client.terminos_pago}</div>}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={client.is_active ? "default" : "secondary"}>
                      {client.is_active ? "Activo" : "Inactivo"}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  )
}
