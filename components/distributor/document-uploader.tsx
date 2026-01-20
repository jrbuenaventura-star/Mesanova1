'use client'

import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { useToast } from '@/hooks/use-toast'
import { Upload, Loader2, FileText } from 'lucide-react'

interface DocumentUploaderProps {
  distributorId?: string
  documentType: string
  onUploadComplete?: () => void
}

export function DocumentUploader({ distributorId, documentType, onUploadComplete }: DocumentUploaderProps) {
  const router = useRouter()
  const { toast } = useToast()
  const supabase = createClient()
  
  const [isUploading, setIsUploading] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      // Validar tipo de archivo
      const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg']
      if (!allowedTypes.includes(file.type)) {
        toast({
          title: 'Tipo de archivo no permitido',
          description: 'Solo se permiten archivos PDF, JPG o PNG',
          variant: 'destructive',
        })
        return
      }

      // Validar tamaño (máx 10MB)
      if (file.size > 10 * 1024 * 1024) {
        toast({
          title: 'Archivo muy grande',
          description: 'El archivo no puede ser mayor a 10MB',
          variant: 'destructive',
        })
        return
      }

      setSelectedFile(file)
    }
  }, [toast])

  const handleUpload = async () => {
    if (!selectedFile || !distributorId) {
      toast({
        title: 'Error',
        description: distributorId ? 'Selecciona un archivo' : 'Debes completar tu perfil primero',
        variant: 'destructive',
      })
      return
    }

    setIsUploading(true)

    try {
      // Subir a Supabase Storage primero (fallback si Google Drive no está configurado)
      const fileExt = selectedFile.name.split('.').pop()
      const fileName = `${distributorId}/${documentType}_${Date.now()}.${fileExt}`
      
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('distributor-documents')
        .upload(fileName, selectedFile, {
          cacheControl: '3600',
          upsert: false,
        })

      if (uploadError) {
        // Si el bucket no existe, intentar crear el registro sin archivo
        console.error('Storage error:', uploadError)
      }

      // Obtener URL pública si se subió
      let fileUrl = null
      if (uploadData) {
        const { data: urlData } = supabase.storage
          .from('distributor-documents')
          .getPublicUrl(fileName)
        fileUrl = urlData.publicUrl
      }

      // Calcular fecha de expiración para estados financieros (abril del próximo año)
      let expiresAt = null
      let fiscalYear = null
      if (documentType === 'estados_financieros') {
        const now = new Date()
        fiscalYear = now.getFullYear()
        // Vence en abril del próximo año
        expiresAt = new Date(now.getFullYear() + 1, 3, 30).toISOString()
      }

      // Guardar registro en la base de datos
      const { error: dbError } = await supabase
        .from('distributor_documents')
        .upsert({
          distributor_id: distributorId,
          document_type: documentType,
          file_name: selectedFile.name,
          file_url: fileUrl,
          file_size: selectedFile.size,
          mime_type: selectedFile.type,
          fiscal_year: fiscalYear,
          expires_at: expiresAt,
          status: 'pending',
        }, {
          onConflict: 'distributor_id,document_type,fiscal_year',
        })

      if (dbError) {
        console.error('DB error:', dbError)
        // Si la tabla no existe aún, mostrar mensaje informativo
        if (dbError.code === '42P01') {
          toast({
            title: 'Configuración pendiente',
            description: 'El sistema de documentos está siendo configurado. Intenta más tarde.',
            variant: 'destructive',
          })
          return
        }
        throw dbError
      }

      toast({
        title: 'Documento subido',
        description: 'El documento está pendiente de revisión',
      })

      setSelectedFile(null)
      onUploadComplete?.()
      router.refresh()
    } catch (error: any) {
      console.error('Upload error:', error)
      toast({
        title: 'Error al subir',
        description: error.message || 'No se pudo subir el documento',
        variant: 'destructive',
      })
    } finally {
      setIsUploading(false)
    }
  }

  if (!distributorId) {
    return (
      <p className="text-sm text-muted-foreground">
        Completa tu perfil para subir documentos
      </p>
    )
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <input
          type="file"
          id={`file-${documentType}`}
          className="hidden"
          accept=".pdf,.jpg,.jpeg,.png"
          onChange={handleFileSelect}
          disabled={isUploading}
        />
        <label
          htmlFor={`file-${documentType}`}
          className="flex-1 cursor-pointer"
        >
          <div className="flex items-center justify-center gap-2 p-3 border-2 border-dashed rounded-lg hover:border-primary hover:bg-muted/50 transition-colors">
            {selectedFile ? (
              <>
                <FileText className="h-4 w-4 text-primary" />
                <span className="text-sm truncate max-w-[150px]">{selectedFile.name}</span>
              </>
            ) : (
              <>
                <Upload className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">Seleccionar archivo</span>
              </>
            )}
          </div>
        </label>
      </div>

      {selectedFile && (
        <Button 
          onClick={handleUpload} 
          disabled={isUploading}
          size="sm"
          className="w-full"
        >
          {isUploading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Subiendo...
            </>
          ) : (
            'Subir documento'
          )}
        </Button>
      )}

      <p className="text-xs text-muted-foreground">
        PDF, JPG o PNG. Máximo 10MB.
      </p>
    </div>
  )
}
