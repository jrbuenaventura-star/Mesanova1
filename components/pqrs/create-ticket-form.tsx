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
  const [reclamoEvidenceFiles, setReclamoEvidenceFiles] = useState<File[]>([])
  const [reclamoGuideFile, setReclamoGuideFile] = useState<File | null>(null)
  const [formData, setFormData] = useState({
    tipo: '',
    asunto: '',
    descripcion: '',
    prioridad: 'media',
    numero_factura: '',
    referencia_producto: '',
    cantidad_productos_defectuosos: '',
  })
  const isReclamo = formData.tipo === 'reclamo'

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      if (isReclamo) {
        if (
          !formData.numero_factura.trim() ||
          !formData.referencia_producto.trim() ||
          !formData.cantidad_productos_defectuosos.trim()
        ) {
          throw new Error('Para reclamaciones debes completar número de factura, referencia y cantidad defectuosa')
        }

        const cantidadDefectuosa = Number(formData.cantidad_productos_defectuosos)
        if (!Number.isFinite(cantidadDefectuosa) || cantidadDefectuosa <= 0 || !Number.isInteger(cantidadDefectuosa)) {
          throw new Error('La cantidad de productos defectuosos debe ser un número entero mayor a 0')
        }

        if (reclamoEvidenceFiles.length === 0) {
          throw new Error('Para reclamaciones debes adjuntar evidencia fotográfica')
        }

        if (!reclamoGuideFile) {
          throw new Error('Para reclamaciones debes adjuntar foto de la guía')
        }
      }

      const payload = new FormData()
      payload.append('tipo', formData.tipo)
      payload.append('asunto', formData.asunto)
      payload.append('descripcion', formData.descripcion)
      payload.append('prioridad', formData.prioridad)

      if (isReclamo) {
        payload.append('numero_factura', formData.numero_factura.trim())
        payload.append('referencia_producto', formData.referencia_producto.trim())
        payload.append('cantidad_productos_defectuosos', formData.cantidad_productos_defectuosos.trim())
      }

      for (const file of files) {
        payload.append('files', file)
      }

      if (isReclamo) {
        for (const file of reclamoEvidenceFiles) {
          payload.append('evidencia_fotografica_files', file)
        }
        if (reclamoGuideFile) {
          payload.append('foto_guia_file', reclamoGuideFile)
        }
      }

      const response = await fetch('/api/pqrs/tickets', {
        method: 'POST',
        body: payload,
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Error al crear el ticket')
      }

      toast({
        title: 'Ticket creado',
        description: `Tu ticket ${data.ticket.ticket_number} ha sido creado exitosamente.`,
      })

      setFormData({
        tipo: '',
        asunto: '',
        descripcion: '',
        prioridad: 'media',
        numero_factura: '',
        referencia_producto: '',
        cantidad_productos_defectuosos: '',
      })
      setFiles([])
      setReclamoEvidenceFiles([])
      setReclamoGuideFile(null)
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

  const handleEvidenceFilesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setReclamoEvidenceFiles(Array.from(e.target.files))
    }
  }

  const handleGuideFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setReclamoGuideFile(e.target.files[0])
      return
    }
    setReclamoGuideFile(null)
  }

  const removeFile = (index: number) => {
    setFiles(files.filter((_, i) => i !== index))
  }

  const removeEvidenceFile = (index: number) => {
    setReclamoEvidenceFiles(reclamoEvidenceFiles.filter((_, i) => i !== index))
  }

  const clearGuideFile = () => {
    setReclamoGuideFile(null)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Crear Nuevo Ticket de Soporte</CardTitle>
        <CardDescription>
          Completa el formulario para crear una petición, queja, reclamo o sugerencia.
          Para reclamaciones se exigen datos y evidencias adicionales.
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
                <SelectItem value="reclamo">Reclamación</SelectItem>
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

          {isReclamo && (
            <>
              <div className="rounded-lg border p-4 space-y-4">
                <h3 className="font-medium">Datos obligatorios de la reclamación</h3>
                <div className="space-y-2">
                  <Label htmlFor="numero_factura">Número de factura *</Label>
                  <Input
                    id="numero_factura"
                    value={formData.numero_factura}
                    onChange={(e) => setFormData({ ...formData, numero_factura: e.target.value })}
                    placeholder="Ej: FAC-0012345"
                    required={isReclamo}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="referencia_producto">Referencia del producto *</Label>
                  <Input
                    id="referencia_producto"
                    value={formData.referencia_producto}
                    onChange={(e) => setFormData({ ...formData, referencia_producto: e.target.value })}
                    placeholder="Ej: SKU-ABC-001"
                    required={isReclamo}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="cantidad_productos_defectuosos">Cantidad de productos defectuosos *</Label>
                  <Input
                    id="cantidad_productos_defectuosos"
                    type="number"
                    min={1}
                    step={1}
                    value={formData.cantidad_productos_defectuosos}
                    onChange={(e) =>
                      setFormData({ ...formData, cantidad_productos_defectuosos: e.target.value })
                    }
                    placeholder="Ej: 3"
                    required={isReclamo}
                  />
                </div>
              </div>

              <div className="rounded-lg border p-4 space-y-4">
                <h3 className="font-medium">Adjuntos obligatorios de la reclamación</h3>
                <div className="space-y-2">
                  <Label htmlFor="reclamo-evidencia">Evidencia fotográfica *</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      id="reclamo-evidencia"
                      type="file"
                      multiple
                      accept="image/*"
                      onChange={handleEvidenceFilesChange}
                      className="cursor-pointer"
                      required={isReclamo}
                    />
                    <Upload className="h-4 w-4 text-muted-foreground" />
                  </div>
                  {reclamoEvidenceFiles.length > 0 && (
                    <div className="space-y-2 mt-2">
                      {reclamoEvidenceFiles.map((file, index) => (
                        <div
                          key={`${file.name}-${index}`}
                          className="flex items-center justify-between p-2 bg-muted rounded-md"
                        >
                          <span className="text-sm truncate">{file.name}</span>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => removeEvidenceFile(index)}
                           aria-label="Cerrar">
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="reclamo-guia">Foto de la guía *</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      id="reclamo-guia"
                      type="file"
                      accept="image/*"
                      onChange={handleGuideFileChange}
                      className="cursor-pointer"
                      required={isReclamo}
                    />
                    <Upload className="h-4 w-4 text-muted-foreground" />
                  </div>
                  {reclamoGuideFile && (
                    <div className="flex items-center justify-between p-2 bg-muted rounded-md mt-2">
                      <span className="text-sm truncate">{reclamoGuideFile.name}</span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={clearGuideFile}
                       aria-label="Cerrar">
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </>
          )}

          <div className="space-y-2">
            <Label htmlFor="files">Archivos Adjuntos Adicionales (Opcional)</Label>
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
                     aria-label="Cerrar">
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <Button type="submit" disabled={loading} className="w-full" aria-label="Enviar">
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
