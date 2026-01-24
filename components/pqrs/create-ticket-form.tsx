'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useToast } from '@/hooks/use-toast'
import { Loader2, Upload, X } from 'lucide-react'

interface CreateTicketFormProps {
  onSuccess?: () => void
}

export function CreateTicketForm({ onSuccess }: CreateTicketFormProps) {
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [files, setFiles] = useState<File[]>([])
  const [formData, setFormData] = useState({
    tipo: '',
    asunto: '',
    descripcion: '',
    prioridad: 'media',
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const response = await fetch('/api/pqrs/tickets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Error al crear el ticket')
      }

      if (files.length > 0) {
        for (const file of files) {
          const formData = new FormData()
          formData.append('file', file)
          formData.append('ticket_id', data.ticket.id)

          await fetch('/api/pqrs/upload', {
            method: 'POST',
            body: formData,
          })
        }
      }

      toast({
        title: 'Ticket creado',
        description: `Tu ticket ${data.ticket.ticket_number} ha sido creado exitosamente.`,
      })

      setFormData({ tipo: '', asunto: '', descripcion: '', prioridad: 'media' })
      setFiles([])
      onSuccess?.()
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Error al crear el ticket',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFiles(Array.from(e.target.files))
    }
  }

  const removeFile = (index: number) => {
    setFiles(files.filter((_, i) => i !== index))
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Crear Nuevo Ticket de Soporte</CardTitle>
        <CardDescription>
          Completa el formulario para crear una petición, queja, reclamo o sugerencia
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="tipo">Tipo de Solicitud *</Label>
            <Select
              value={formData.tipo}
              onValueChange={(value) => setFormData({ ...formData, tipo: value })}
              required
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecciona el tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="peticion">Petición</SelectItem>
                <SelectItem value="queja">Queja</SelectItem>
                <SelectItem value="reclamo">Reclamo</SelectItem>
                <SelectItem value="sugerencia">Sugerencia</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="asunto">Asunto *</Label>
            <Input
              id="asunto"
              value={formData.asunto}
              onChange={(e) => setFormData({ ...formData, asunto: e.target.value })}
              placeholder="Resumen breve del problema o solicitud"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="descripcion">Descripción Detallada *</Label>
            <Textarea
              id="descripcion"
              value={formData.descripcion}
              onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
              placeholder="Describe tu solicitud con el mayor detalle posible"
              rows={6}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="prioridad">Prioridad</Label>
            <Select
              value={formData.prioridad}
              onValueChange={(value) => setFormData({ ...formData, prioridad: value })}
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

          <div className="space-y-2">
            <Label htmlFor="files">Archivos Adjuntos (Opcional)</Label>
            <div className="flex items-center gap-2">
              <Input
                id="files"
                type="file"
                multiple
                onChange={handleFileChange}
                className="cursor-pointer"
              />
              <Upload className="h-4 w-4 text-muted-foreground" />
            </div>
            {files.length > 0 && (
              <div className="space-y-2 mt-2">
                {files.map((file, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-2 bg-muted rounded-md"
                  >
                    <span className="text-sm truncate">{file.name}</span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeFile(index)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <Button type="submit" disabled={loading} className="w-full">
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creando ticket...
              </>
            ) : (
              'Crear Ticket'
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
