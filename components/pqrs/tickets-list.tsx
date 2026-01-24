'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Loader2, Eye, AlertCircle, Clock, CheckCircle2, XCircle } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'

interface Ticket {
  id: string
  ticket_number: string
  tipo: string
  asunto: string
  estado: string
  prioridad: string
  fecha_creacion: string
  fecha_actualizacion: string
}

const estadoConfig = {
  nuevo: { label: 'Nuevo', icon: AlertCircle, color: 'bg-blue-500' },
  en_proceso: { label: 'En Proceso', icon: Clock, color: 'bg-yellow-500' },
  pendiente: { label: 'Pendiente', icon: Clock, color: 'bg-orange-500' },
  resuelto: { label: 'Resuelto', icon: CheckCircle2, color: 'bg-green-500' },
  cerrado: { label: 'Cerrado', icon: XCircle, color: 'bg-gray-500' },
}

const prioridadConfig = {
  baja: { label: 'Baja', color: 'bg-gray-500' },
  media: { label: 'Media', color: 'bg-blue-500' },
  alta: { label: 'Alta', color: 'bg-orange-500' },
  urgente: { label: 'Urgente', color: 'bg-red-500' },
}

const tipoConfig = {
  peticion: { label: 'Petición', color: 'bg-blue-500' },
  queja: { label: 'Queja', color: 'bg-yellow-500' },
  reclamo: { label: 'Reclamo', color: 'bg-red-500' },
  sugerencia: { label: 'Sugerencia', color: 'bg-green-500' },
}

export function TicketsList() {
  const router = useRouter()
  const [tickets, setTickets] = useState<Ticket[]>([])
  const [loading, setLoading] = useState(true)
  const [filtroEstado, setFiltroEstado] = useState<string>('todos')
  const [filtroPrioridad, setFiltroPrioridad] = useState<string>('todos')
  const [filtroTipo, setFiltroTipo] = useState<string>('todos')

  const fetchTickets = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (filtroEstado !== 'todos') params.append('estado', filtroEstado)
      if (filtroPrioridad !== 'todos') params.append('prioridad', filtroPrioridad)
      if (filtroTipo !== 'todos') params.append('tipo', filtroTipo)

      const response = await fetch(`/api/pqrs/tickets?${params.toString()}`)
      const data = await response.json()

      if (response.ok) {
        setTickets(data.tickets || [])
      }
    } catch (error) {
      console.error('Error fetching tickets:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchTickets()
  }, [filtroEstado, filtroPrioridad, filtroTipo])

  const getEstadoIcon = (estado: string) => {
    const config = estadoConfig[estado as keyof typeof estadoConfig]
    if (!config) return null
    const Icon = config.icon
    return <Icon className="h-4 w-4" />
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Mis Tickets de Soporte</CardTitle>
        <CardDescription>
          Gestiona tus peticiones, quejas, reclamos y sugerencias
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex gap-4 mb-6">
          <Select value={filtroEstado} onValueChange={setFiltroEstado}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Estado" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos los estados</SelectItem>
              <SelectItem value="nuevo">Nuevo</SelectItem>
              <SelectItem value="en_proceso">En Proceso</SelectItem>
              <SelectItem value="pendiente">Pendiente</SelectItem>
              <SelectItem value="resuelto">Resuelto</SelectItem>
              <SelectItem value="cerrado">Cerrado</SelectItem>
            </SelectContent>
          </Select>

          <Select value={filtroPrioridad} onValueChange={setFiltroPrioridad}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Prioridad" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todas las prioridades</SelectItem>
              <SelectItem value="baja">Baja</SelectItem>
              <SelectItem value="media">Media</SelectItem>
              <SelectItem value="alta">Alta</SelectItem>
              <SelectItem value="urgente">Urgente</SelectItem>
            </SelectContent>
          </Select>

          <Select value={filtroTipo} onValueChange={setFiltroTipo}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Tipo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos los tipos</SelectItem>
              <SelectItem value="peticion">Petición</SelectItem>
              <SelectItem value="queja">Queja</SelectItem>
              <SelectItem value="reclamo">Reclamo</SelectItem>
              <SelectItem value="sugerencia">Sugerencia</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {loading ? (
          <div className="flex justify-center items-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : tickets.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            No tienes tickets registrados
          </div>
        ) : (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Número</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Asunto</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Prioridad</TableHead>
                  <TableHead>Fecha</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {tickets.map((ticket) => (
                  <TableRow key={ticket.id}>
                    <TableCell className="font-medium">
                      {ticket.ticket_number}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={tipoConfig[ticket.tipo as keyof typeof tipoConfig]?.color}
                      >
                        {tipoConfig[ticket.tipo as keyof typeof tipoConfig]?.label}
                      </Badge>
                    </TableCell>
                    <TableCell className="max-w-xs truncate">
                      {ticket.asunto}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {getEstadoIcon(ticket.estado)}
                        <Badge
                          variant="outline"
                          className={estadoConfig[ticket.estado as keyof typeof estadoConfig]?.color}
                        >
                          {estadoConfig[ticket.estado as keyof typeof estadoConfig]?.label}
                        </Badge>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={prioridadConfig[ticket.prioridad as keyof typeof prioridadConfig]?.color}
                      >
                        {prioridadConfig[ticket.prioridad as keyof typeof prioridadConfig]?.label}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {format(new Date(ticket.fecha_creacion), 'dd/MM/yyyy', { locale: es })}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => router.push(`/distributor/pqrs/${ticket.id}`)}
                      >
                        <Eye className="h-4 w-4 mr-2" />
                        Ver
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
