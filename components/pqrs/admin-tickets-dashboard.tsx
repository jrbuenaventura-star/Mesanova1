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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Loader2, Eye, AlertCircle, Clock, CheckCircle2, XCircle, TrendingUp, Users, Ticket } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'

interface TicketSummary {
  id: string
  ticket_number: string
  tipo: string
  asunto: string
  estado: string
  prioridad: string
  fecha_creacion: string
  creado_por_nombre: string
  creado_por_email: string
  asignado?: {
    full_name: string
  }
  tareas: { count: number }[]
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

export function AdminTicketsDashboard() {
  const router = useRouter()
  const [tickets, setTickets] = useState<TicketSummary[]>([])
  const [loading, setLoading] = useState(true)
  const [filtroEstado, setFiltroEstado] = useState<string>('todos')
  const [filtroPrioridad, setFiltroPrioridad] = useState<string>('todos')
  const [incluirOcultos, setIncluirOcultos] = useState(false)

  const fetchTickets = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (filtroEstado !== 'todos') params.append('estado', filtroEstado)
      if (filtroPrioridad !== 'todos') params.append('prioridad', filtroPrioridad)
      if (incluirOcultos) params.append('incluir_ocultos', 'true')

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
  }, [filtroEstado, filtroPrioridad, incluirOcultos])

  const stats = {
    total: tickets.length,
    nuevos: tickets.filter(t => t.estado === 'nuevo').length,
    enProceso: tickets.filter(t => t.estado === 'en_proceso').length,
    pendientes: tickets.filter(t => t.estado === 'pendiente').length,
    resueltos: tickets.filter(t => t.estado === 'resuelto').length,
    urgentes: tickets.filter(t => t.prioridad === 'urgente').length,
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Tickets</CardTitle>
            <Ticket className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Nuevos</CardTitle>
            <AlertCircle className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.nuevos}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">En Proceso</CardTitle>
            <Clock className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.enProceso}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Urgentes</CardTitle>
            <TrendingUp className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.urgentes}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Gestión de Tickets</CardTitle>
          <CardDescription>
            Administra todos los tickets de soporte del sistema
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

            <Button
              variant={incluirOcultos ? 'default' : 'outline'}
              onClick={() => setIncluirOcultos(!incluirOcultos)}
            >
              {incluirOcultos ? 'Ocultando cerrados' : 'Mostrar cerrados'}
            </Button>
          </div>

          {loading ? (
            <div className="flex justify-center items-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : tickets.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No hay tickets que coincidan con los filtros
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Número</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Asunto</TableHead>
                    <TableHead>Creado por</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead>Prioridad</TableHead>
                    <TableHead>Asignado</TableHead>
                    <TableHead>Tareas</TableHead>
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
                        <Badge variant="outline" className="capitalize">
                          {ticket.tipo}
                        </Badge>
                      </TableCell>
                      <TableCell className="max-w-xs truncate">
                        {ticket.asunto}
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <div className="font-medium">{ticket.creado_por_nombre}</div>
                          <div className="text-muted-foreground">{ticket.creado_por_email}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={estadoConfig[ticket.estado as keyof typeof estadoConfig]?.color}
                        >
                          {estadoConfig[ticket.estado as keyof typeof estadoConfig]?.label}
                        </Badge>
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
                        {ticket.asignado ? (
                          <span className="text-sm">{ticket.asignado.full_name}</span>
                        ) : (
                          <span className="text-sm text-muted-foreground">Sin asignar</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">
                          {ticket.tareas?.[0]?.count || 0}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {format(new Date(ticket.fecha_creacion), 'dd/MM/yyyy', { locale: es })}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => router.push(`/admin/pqrs/${ticket.id}`)}
                        >
                          <Eye className="h-4 w-4 mr-2" />
                          Gestionar
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
    </div>
  )
}
