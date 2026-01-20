import { google } from 'googleapis'
import type { DocumentType } from '@/lib/db/types'

// Configuración de carpetas por tipo de documento
const FOLDER_IDS: Record<DocumentType, string> = {
  estados_financieros: process.env.GOOGLE_DRIVE_FOLDER_ESTADOS_FINANCIEROS || '',
  rut: process.env.GOOGLE_DRIVE_FOLDER_RUT || '',
  camara_comercio: process.env.GOOGLE_DRIVE_FOLDER_CAMARA_COMERCIO || '',
  certificado_bancario: process.env.GOOGLE_DRIVE_FOLDER_CERTIFICADOS || '',
}

// Crear cliente de Google Drive autenticado
function createDriveClient() {
  const privateKey = process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n')
  
  if (!process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL || !privateKey) {
    throw new Error('Google Drive credentials not configured. Check GOOGLE_SERVICE_ACCOUNT_EMAIL and GOOGLE_PRIVATE_KEY environment variables.')
  }

  const auth = new google.auth.JWT({
    email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
    key: privateKey,
    scopes: ['https://www.googleapis.com/auth/drive.file'],
  })

  return google.drive({ version: 'v3', auth })
}

export interface UploadResult {
  success: boolean
  fileId?: string
  webViewLink?: string
  error?: string
}

/**
 * Sube un archivo a Google Drive
 */
export async function uploadToGoogleDrive(
  file: Buffer,
  fileName: string,
  mimeType: string,
  documentType: DocumentType,
  distributorId: string,
  distributorName: string
): Promise<UploadResult> {
  try {
    const drive = createDriveClient()
    const folderId = FOLDER_IDS[documentType]

    if (!folderId) {
      throw new Error(`Folder ID not configured for document type: ${documentType}`)
    }

    // Nombre del archivo: [NombreEmpresa]_[TipoDoc]_[Fecha].[ext]
    const dateStr = new Date().toISOString().split('T')[0]
    const sanitizedName = distributorName.replace(/[^a-zA-Z0-9]/g, '_')
    const extension = fileName.split('.').pop() || 'pdf'
    const finalFileName = `${sanitizedName}_${documentType}_${dateStr}.${extension}`

    // Subir archivo
    const response = await drive.files.create({
      requestBody: {
        name: finalFileName,
        parents: [folderId],
        description: `Documento de ${distributorName} - ID: ${distributorId}`,
      },
      media: {
        mimeType,
        body: require('stream').Readable.from(file),
      },
      fields: 'id, webViewLink',
    })

    if (!response.data.id) {
      throw new Error('Failed to get file ID from Google Drive response')
    }

    // Hacer el archivo accesible por link (solo lectura)
    await drive.permissions.create({
      fileId: response.data.id,
      requestBody: {
        role: 'reader',
        type: 'anyone',
      },
    })

    return {
      success: true,
      fileId: response.data.id,
      webViewLink: response.data.webViewLink || undefined,
    }
  } catch (error) {
    console.error('Error uploading to Google Drive:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

/**
 * Obtiene la URL de visualización de un archivo
 */
export async function getFileViewUrl(fileId: string): Promise<string | null> {
  try {
    const drive = createDriveClient()
    const response = await drive.files.get({
      fileId,
      fields: 'webViewLink',
    })
    return response.data.webViewLink || null
  } catch (error) {
    console.error('Error getting file URL:', error)
    return null
  }
}

/**
 * Elimina un archivo de Google Drive
 */
export async function deleteFromGoogleDrive(fileId: string): Promise<boolean> {
  try {
    const drive = createDriveClient()
    await drive.files.delete({ fileId })
    return true
  } catch (error) {
    console.error('Error deleting from Google Drive:', error)
    return false
  }
}

/**
 * Lista archivos en una carpeta específica
 */
export async function listFilesInFolder(documentType: DocumentType): Promise<any[]> {
  try {
    const drive = createDriveClient()
    const folderId = FOLDER_IDS[documentType]

    if (!folderId) {
      throw new Error(`Folder ID not configured for document type: ${documentType}`)
    }

    const response = await drive.files.list({
      q: `'${folderId}' in parents and trashed = false`,
      fields: 'files(id, name, mimeType, size, createdTime, webViewLink)',
      orderBy: 'createdTime desc',
    })

    return response.data.files || []
  } catch (error) {
    console.error('Error listing files:', error)
    return []
  }
}

/**
 * Verifica si las credenciales de Google Drive están configuradas
 */
export function isGoogleDriveConfigured(): boolean {
  return !!(
    process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL &&
    process.env.GOOGLE_PRIVATE_KEY &&
    (process.env.GOOGLE_DRIVE_FOLDER_ESTADOS_FINANCIEROS ||
      process.env.GOOGLE_DRIVE_FOLDER_RUT ||
      process.env.GOOGLE_DRIVE_FOLDER_CAMARA_COMERCIO ||
      process.env.GOOGLE_DRIVE_FOLDER_CERTIFICADOS)
  )
}
