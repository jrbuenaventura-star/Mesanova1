'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Separator } from '@/components/ui/separator'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { useToast } from '@/hooks/use-toast'
import { Loader2, MessageSquare, Plus, CheckCircle, UserPlus, Eye, EyeOff, Paperclip, Download } from 'lucide-react'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'

interface Task {
  id: string
  titulo: string
  descripcion?: string
  estado: string
  prioridad: string
  asignado: {
    full_name: string
    email: string
  }
  asignado_por_usuario: {
    full_name: string
  }
  fecha_creacion: string
}

interface Comment {
  id: string
  comentario: string
  fecha_creacion: string
  usuario_nombre: string
  usuario_rol: string
  es_interno: boolean
}

interface TicketDetail {
  id: string
  ticket_number: string
  tipo: string
  asunto: string
  descripcion: string
  estado: string
  prioridad: string
  resolucion?: string
  oculto: boolean
  fecha_creacion: string
  creado_por_nombre: string
  creado_por_email: string
  metadata?: {
    reclamo?: {
      numero_factura?: string
      referencia_producto?: string
      cantidad_productos_defectuosos?: number
    }
  }
  asignado?: {
    id: string
    full_name: string
  }
  tareas: Task[]
  comentarios: Comment[]
  archivos?: {
    id: string
    nombre_archivo: string
    tamano_bytes: number
    metadata?: {
      tipo_adjunto?: string
    }
  }[]
}

interface AdminTicketManagementProps {
  ticketId: string
}

export function AdminTicketManagement({ ticketId }: AdminTicketManagementProps) {
  const { toast } = useToast()
  const [ticket, setTicket] = useState<TicketDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [superadmins, setSuperadmins] = useState<any[]>([])
  const [comentario, setComentario] = useState('')
  const [esInterno, setEsInterno] = useState(false)
  const [enviandoComentario, setEnviandoComentario] = useState(false)
  const [actualizando, setActualizando] = useState(false)
  const [descargando, setDescargando] = useState<string | null>(null)

  const [nuevaTarea, setNuevaTarea] = useState({
    titulo: '',
    descripcion: '',
    asignado_a: '',
    prioridad: 'media',
  })

  const fetchTicket = async () => {
    try {
      const response = await fetch(`/api/pqrs/tickets/${ticketId}`)
      const data = await response.json()

      if (response.ok) {
        setTicket(data.ticket)
      }
    } catch (error) {
      console.error('Error fetching ticket:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchSuperadmins = async () => {
    try {
      const response = await fetch('/api/admin/users?role=superadmin')
      const data = await response.json()
      if (response.ok) {
        setSuperadmins(data.users || [])
      }
    } catch (error) {
      console.error('Error fetching superadmins:', error)
    }
  }

  useEffect(() => {
    fetchTicket()
    fetchSuperadmins()
  }, [ticketId])

  const handleDescargarArchivo = async (archivoId: string, nombreArchivo: string) => {
    setDescargando(archivoId)
    try {
      const response = await fetch(`/api/pqrs/attachments/${archivoId}/download`)
      const data = await response.json()

      if (response.ok && data.url) {
        const link = document.createElement('a')
        link.href = data.url
        link.download = nombreArchivo
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
      } else {
        throw new Error(data.error || 'Error al descargar archivo')
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Error al descargar archivo',
        variant: 'destructive',
      })
    } finally {
      setDescargando(null)
    }
  }

  const handleActualizarEstado = async (nuevoEstado: string, resolucion?: string) => {
    setActualizando(true)
    try {
      const body: any = { estado: nuevoEstado }
      if (nuevoEstado === 'resuelto' && resolucion) {
        body.resolucion = resolucion
      }

      const response = await fetch(`/api/pqrs/tickets/${ticketId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })

      if (response.ok) {
        fetchTicket()
        toast({
          title: 'Ticket actualizado',
          description: 'El estado del ticket ha sido actualizado',
        })
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Error al actualizar el ticket',
        variant: 'destructive',
      })
    } finally {
      setActualizando(false)
    }
  }

  const handleAsignar = async (asignado_a: string | null) => {
    try {
      const response = await fetch(`/api/pqrs/tickets/${ticketId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ asignado_a }),
      })

      if (response.ok) {
        fetchTicket()
        toast({
          title: 'Asignación actualizada',
          description: asignado_a ? 'Ticket asignado exitosamente' : 'Ticket desasignado',
        })
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Error al asignar el ticket',
        variant: 'destructive',
      })
    }
  }

  const handleOcultarTicket = async () => {
    try {
      const response = await fetch(`/api/pqrs/tickets/${ticketId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ oculto: !ticket?.oculto }),
      })

      if (response.ok) {
        fetchTicket()
        toast({
          title: ticket?.oculto ? 'Ticket visible' : 'Ticket oculto',
          description: ticket?.oculto 
            ? 'El ticket ahora es visible en la lista' 
            : 'El ticket ha sido ocultado de la lista principal',
        })
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Error al cambiar visibilidad del ticket',
        variant: 'destructive',
      })
    }
  }

  const handleCrearTarea = async () => {
    if (!nuevaTarea.titulo || !nuevaTarea.asignado_a) {
      toast({
        title: 'Error',
        description: 'Título y asignado son requeridos',
        variant: 'destructive',
      })
      return
    }

    try {
      const response = await fetch('/api/pqrs/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ticket_id: ticketId,
          ...nuevaTarea,
        }),
      })

      if (response.ok) {
        setNuevaTarea({ titulo: '', descripcion: '', asignado_a: '', prioridad: 'media' })
        fetchTicket()
        toast({
          title: 'Tarea creada',
          description: 'La tarea ha sido asignada exitosamente',
        })
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Error al crear la tarea',
        variant: 'destructive',
      })
    }
  }

  const handleActualizarTarea = async (taskId: string, estado: string) => {
    try {
      const response = await fetch('/api/pqrs/tasks', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: taskId, estado }),
      })

      if (response.ok) {
        fetchTicket()
        toast({
          title: 'Tarea actualizada',
          description: 'El estado de la tarea ha sido actualizado',
        })
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Error al actualizar la tarea',
        variant: 'destructive',
      })
    }
  }

  const handleEnviarComentario = async () => {
    if (!comentario.trim()) return

    setEnviandoComentario(true)
    try {
      const response = await fetch('/api/pqrs/comments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ticket_id: ticketId,
          comentario: comentario.trim(),
          es_interno: esInterno,
        }),
      })

      if (response.ok) {
        setComentario('')
        setEsInterno(false)
        fetchTicket()
        toast({
          title: 'Comentario enviado',
          description: esInterno ? 'Comentario interno agregado' : 'Comentario enviado al usuario',
        })
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Error al enviar comentario',
        variant: 'destructive',
      })
    } finally {
      setEnviandoComentario(false)
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (!ticket) {
    return <div>Ticket no encontrado</div>
  }

  const reclamoData = ticket.tipo === 'reclamo' ? ticket.metadata?.reclamo : null

  const getAttachmentTypeLabel = (type?: string) => {
    if (!type) return null
    if (type === 'evidencia_fotografica') return 'Evidencia fotográfica'
    if (type === 'foto_guia') return 'Foto de la guía'
    if (type === 'adjunto_general') return 'Adjunto general'
    return null
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div>
              <CardTitle className="text-2xl">{ticket.ticket_number}</CardTitle>
              <CardDescription className="mt-2">{ticket.asunto}</CardDescription>
            </div>
            <div className="flex gap-2 flex-wrap">
              <Badge variant="outline" className="capitalize">{ticket.tipo}</Badge>
              <Badge variant="outline" className="capitalize">
                {ticket.estado.replace('_', ' ')}
              </Badge>
              <Badge variant="outline" className="capitalize">
                Prioridad: {ticket.prioridad}
              </Badge>
              {ticket.oculto && <Badge variant="secondary">Oculto</Badge>}
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <h3 className="font-semibold mb-2">Información del Usuario</h3>
            <div className="text-sm space-y-1">
              <p><strong>Nombre:</strong> {ticket.creado_por_nombre}</p>
              <p><strong>Email:</strong> {ticket.creado_por_email}</p>
              <p><strong>Fecha de creación:</strong> {format(new Date(ticket.fecha_creacion), "dd 'de' MMMM 'de' yyyy 'a las' HH:mm", { locale: es })}</p>
            </div>
          </div>

          <Separator />

          <div>
            <h3 className="font-semibold mb-2">Descripción</h3>
            <p className="text-muted-foreground whitespace-pre-wrap">{ticket.descripcion}</p>
          </div>

          {reclamoData && (
            <>
              <Separator />
              <div className="rounded-lg border p-4">
                <h3 className="font-semibold mb-3">Datos de la Reclamación</h3>
                <div className="text-sm space-y-1">
                  <p><strong>Número de factura:</strong> {reclamoData.numero_factura || '-'}</p>
                  <p><strong>Referencia del producto:</strong> {reclamoData.referencia_producto || '-'}</p>
                  <p>
                    <strong>Cantidad de productos defectuosos:</strong>{' '}
                    {reclamoData.cantidad_productos_defectuosos ?? '-'}
                  </p>
                </div>
              </div>
            </>
          )}

          <Separator />

          {ticket.archivos && ticket.archivos.length > 0 && (
            <>
              <div>
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  <Paperclip className="h-4 w-4" />
                  Archivos Adjuntos
                </h3>
                <div className="space-y-2">
                  {ticket.archivos.map((archivo) => (
                    <div
                      key={archivo.id}
                      className="flex items-center justify-between p-3 bg-muted rounded-lg"
                    >
                      <div>
                        <p className="font-medium">{archivo.nombre_archivo}</p>
                        <p className="text-sm text-muted-foreground">
                          {(archivo.tamano_bytes / 1024).toFixed(2)} KB
                        </p>
                        {getAttachmentTypeLabel(archivo.metadata?.tipo_adjunto) && (
                          <Badge variant="outline" className="mt-1">
                            {getAttachmentTypeLabel(archivo.metadata?.tipo_adjunto)}
                          </Badge>
                        )}
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDescargarArchivo(archivo.id, archivo.nombre_archivo)}
                        disabled={descargando === archivo.id}
                       aria-label="Descargar">
                        {descargando === archivo.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Download className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
              <Separator />
            </>
          )}

          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <Label>Cambiar Estado</Label>
              <Select
                value={ticket.estado}
                onValueChange={handleActualizarEstado}
                disabled={actualizando}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="nuevo">Nuevo</SelectItem>
                  <SelectItem value="en_proceso">En Proceso</SelectItem>
                  <SelectItem value="pendiente">Pendiente</SelectItem>
                  <SelectItem value="resuelto">Resuelto</SelectItem>
                  <SelectItem value="cerrado">Cerrado</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Asignar a</Label>
              <Select
                value={ticket.asignado?.id || 'sin_asignar'}
                onValueChange={(value) => handleAsignar(value === 'sin_asignar' ? null : value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="sin_asignar">Sin asignar</SelectItem>
                  {superadmins.map((admin) => (
                    <SelectItem key={admin.id} value={admin.id}>
                      {admin.full_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={handleOcultarTicket}
             aria-label="Ver">
              {ticket.oculto ? (
                <>
                  <Eye className="mr-2 h-4 w-4" />
                  Mostrar Ticket
                </>
              ) : (
                <>
                  <EyeOff className="mr-2 h-4 w-4" />
                  Ocultar Ticket
                </>
              )}
            </Button>
          </div>

          {ticket.estado === 'resuelto' && ticket.resolucion && (
            <div className="bg-green-50 dark:bg-green-950 p-4 rounded-lg">
              <h3 className="font-semibold mb-2 text-green-900 dark:text-green-100">
                Resolución
              </h3>
              <p className="text-green-800 dark:text-green-200 whitespace-pre-wrap">
                {ticket.resolucion}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Tareas Asignadas</CardTitle>
            <Dialog>
              <DialogTrigger asChild>
                <Button size="sm">
                  <Plus className="mr-2 h-4 w-4" />
                  Nueva Tarea
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Crear Nueva Tarea</DialogTitle>
                  <DialogDescription>
                    Asigna una tarea a un superadmin para gestionar este ticket
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label>Título *</Label>
                    <Input
                      value={nuevaTarea.titulo}
                      onChange={(e) => setNuevaTarea({ ...nuevaTarea, titulo: e.target.value })}
                      placeholder="Título de la tarea"
                    />
                  </div>
                  <div>
                    <Label>Descripción</Label>
                    <Textarea
                      value={nuevaTarea.descripcion}
                      onChange={(e) => setNuevaTarea({ ...nuevaTarea, descripcion: e.target.value })}
                      placeholder="Descripción detallada"
                      rows={3}
                    />
                  </div>
                  <div>
                    <Label>Asignar a *</Label>
                    <Select
                      value={nuevaTarea.asignado_a}
                      onValueChange={(value) => setNuevaTarea({ ...nuevaTarea, asignado_a: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecciona un superadmin" />
                      </SelectTrigger>
                      <SelectContent>
                        {superadmins.map((admin) => (
                          <SelectItem key={admin.id} value={admin.id}>
                            {admin.full_name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Prioridad</Label>
                    <Select
                      value={nuevaTarea.prioridad}
                      onValueChange={(value) => setNuevaTarea({ ...nuevaTarea, prioridad: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="baja">Baja</SelectItem>
                        <SelectItem value="media">Media</SelectItem>
                        <SelectItem value="alta">Alta</SelectItem>
                        <SelectItem value="urgente">Urgente</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <Button onClick={handleCrearTarea} className="w-full">
                    Crear Tarea
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          {ticket.tareas && ticket.tareas.length > 0 ? (
            <div className="space-y-3">
              {ticket.tareas.map((tarea) => (
                <Card key={tarea.id}>
                  <CardContent className="pt-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h4 className="font-semibold">{tarea.titulo}</h4>
                        {tarea.descripcion && (
                          <p className="text-sm text-muted-foreground mt-1">{tarea.descripcion}</p>
                        )}
                        <div className="flex gap-2 mt-2">
                          <Badge variant="outline">{tarea.asignado.full_name}</Badge>
                          <Badge variant="outline" className="capitalize">{tarea.prioridad}</Badge>
                          <Badge variant="outline" className="capitalize">{tarea.estado.replace('_', ' ')}</Badge>
                        </div>
                      </div>
                      <Select
                        value={tarea.estado}
                        onValueChange={(value) => handleActualizarTarea(tarea.id, value)}
                      >
                        <SelectTrigger className="w-[150px]">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="pendiente">Pendiente</SelectItem>
                          <SelectItem value="en_progreso">En Progreso</SelectItem>
                          <SelectItem value="completada">Completada</SelectItem>
                          <SelectItem value="cancelada">Cancelada</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <p className="text-center text-muted-foreground py-4">
              No hay tareas asignadas
            </p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            Comunicación
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {ticket.comentarios && ticket.comentarios.length > 0 ? (
            ticket.comentarios.map((comentario) => (
              <div key={comentario.id} className="flex gap-3">
                <Avatar>
                  <AvatarFallback>
                    {comentario.usuario_nombre?.charAt(0) || 'U'}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold">{comentario.usuario_nombre}</span>
                    <Badge variant="outline" className="text-xs">
                      {comentario.usuario_rol}
                    </Badge>
                    {comentario.es_interno && (
                      <Badge variant="secondary" className="text-xs">Interno</Badge>
                    )}
                    <span className="text-sm text-muted-foreground">
                      {format(new Date(comentario.fecha_creacion), "dd/MM/yyyy HH:mm", { locale: es })}
                    </span>
                  </div>
                  <p className="text-muted-foreground whitespace-pre-wrap">
                    {comentario.comentario}
                  </p>
                </div>
              </div>
            ))
          ) : (
            <p className="text-center text-muted-foreground py-4">
              No hay comentarios aún
            </p>
          )}

          <Separator />

          <div className="space-y-3">
            <Textarea
              placeholder="Escribe un comentario..."
              value={comentario}
              onChange={(e) => setComentario(e.target.value)}
              rows={4}
            />
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={esInterno}
                  onChange={(e) => setEsInterno(e.target.checked)}
                  className="rounded"
                />
                Comentario interno (no visible para el usuario)
              </label>
              <Button
                onClick={handleEnviarComentario}
                disabled={!comentario.trim() || enviandoComentario}
               aria-label="Acción">
                {enviandoComentario ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Enviando...
                  </>
                ) : (
                  'Enviar Comentario'
                )}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
