import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = await createClient()
    const { data: { user }, error: userError } = await supabase.auth.getUser()

    if (userError || !user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const { data: attachment, error: attachmentError } = await supabase
      .from('pqrs_attachments')
      .select('*, ticket:pqrs_tickets(creado_por)')
      .eq('id', id)
      .single()

    if (attachmentError || !attachment) {
      return NextResponse.json({ error: 'Archivo no encontrado' }, { status: 404 })
    }

    const { data: profile } = await supabase
      .from('user_profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profile?.role !== 'superadmin' && attachment.ticket.creado_por !== user.id) {
      return NextResponse.json({ error: 'No tienes permisos para descargar este archivo' }, { status: 403 })
    }

    const { data: signedUrlData, error: signedUrlError } = await supabase.storage
      .from('pqrs-attachments')
      .createSignedUrl(attachment.ruta_storage, 3600)

    if (signedUrlError || !signedUrlData) {
      console.error('Error creating signed URL:', signedUrlError)
      return NextResponse.json({ error: 'Error al generar URL de descarga' }, { status: 500 })
    }

    return NextResponse.json({ 
      url: signedUrlData.signedUrl,
      nombre_archivo: attachment.nombre_archivo 
    })
  } catch (error) {
    console.error('Error in GET /api/pqrs/attachments/[id]/download:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}
