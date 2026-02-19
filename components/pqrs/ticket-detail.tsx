'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Separator } from '@/components/ui/separator'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { useToast } from '@/hooks/use-toast'
import { Loader2, MessageSquare, Paperclip, Send, Download } from 'lucide-react'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'

interface Comment {
  id: string
  comentario: string
  fecha_creacion: string
  usuario_nombre: string
  usuario_rol: string
  es_interno: boolean
  tipo_cambio?: string
}

interface Attachment {
  id: string
  nombre_archivo: string
  ruta_storage: string
  tamano_bytes: number
  fecha_subida: string
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
  fecha_creacion: string
  fecha_actualizacion: string
  fecha_resolucion?: string
  comentarios: Comment[]
  archivos: Attachment[]
}

interface TicketDetailProps {
  ticketId: string
}

export function TicketDetail({ ticketId }: TicketDetailProps) {
  const { toast } = useToast()
  const [ticket, setTicket] = useState<TicketDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [comentario, setComentario] = useState('')
  const [enviandoComentario, setEnviandoComentario] = useState(false)
  const [descargando, setDescargando] = useState<string | null>(null)

  const fetchTicket = async () => {
    try {
      const response = await fetch(`/api/pqrs/tickets/${ticketId}`)
      const data = await response.json()

      if (response.ok) {
        setTicket(data.ticket)
      } else {
        toast({
          title: 'Error',
          description: data.error || 'Error al cargar el ticket',
          variant: 'destructive',
        })
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Error al cargar el ticket',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchTicket()
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
        }),
      })

      if (response.ok) {
        setComentario('')
        fetchTicket()
        toast({
          title: 'Comentario enviado',
          description: 'Tu comentario ha sido agregado al ticket',
        })
      } else {
        const data = await response.json()
        throw new Error(data.error)
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Error al enviar comentario',
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
    return (
      <Card>
        <CardContent className="py-12 text-center text-muted-foreground">
          Ticket no encontrado
        </CardContent>
      </Card>
    )
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
            <div className="flex gap-2">
              <Badge variant="outline" className="capitalize">
                {ticket.tipo}
              </Badge>
              <Badge variant="outline" className="capitalize">
                {ticket.estado.replace('_', ' ')}
              </Badge>
              <Badge variant="outline" className="capitalize">
                Prioridad: {ticket.prioridad}
              </Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <h3 className="font-semibold mb-2">Descripción</h3>
            <p className="text-muted-foreground whitespace-pre-wrap">{ticket.descripcion}</p>
          </div>

          {ticket.resolucion && (
            <div className="bg-green-50 dark:bg-green-950 p-4 rounded-lg">
              <h3 className="font-semibold mb-2 text-green-900 dark:text-green-100">
                Resolución
              </h3>
              <p className="text-green-800 dark:text-green-200 whitespace-pre-wrap">
                {ticket.resolucion}
              </p>
              {ticket.fecha_resolucion && (
                <p className="text-sm text-green-700 dark:text-green-300 mt-2">
                  Resuelto el {format(new Date(ticket.fecha_resolucion), "dd 'de' MMMM 'de' yyyy", { locale: es })}
                </p>
              )}
            </div>
          )}

          {ticket.archivos && ticket.archivos.length > 0 && (
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
          )}

          <div className="text-sm text-muted-foreground">
            <p>Creado el {format(new Date(ticket.fecha_creacion), "dd 'de' MMMM 'de' yyyy 'a las' HH:mm", { locale: es })}</p>
            <p>Última actualización: {format(new Date(ticket.fecha_actualizacion), "dd 'de' MMMM 'de' yyyy 'a las' HH:mm", { locale: es })}</p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            Historial de Comunicación
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {ticket.comentarios && ticket.comentarios.length > 0 ? (
            ticket.comentarios
              .filter(c => !c.es_interno)
              .map((comentario) => (
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
              placeholder="Escribe tu comentario o pregunta..."
              value={comentario}
              onChange={(e) => setComentario(e.target.value)}
              rows={4}
              disabled={ticket.estado === 'cerrado'}
            />
            <Button
              onClick={handleEnviarComentario}
              disabled={!comentario.trim() || enviandoComentario || ticket.estado === 'cerrado'}
             aria-label="Acción">
              {enviandoComentario ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Enviando...
                </>
              ) : (
                <>
                  <Send className="mr-2 h-4 w-4" />
                  Enviar Comentario
                </>
              )}
            </Button>
            {ticket.estado === 'cerrado' && (
              <p className="text-sm text-muted-foreground">
                Este ticket está cerrado y no acepta más comentarios
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
