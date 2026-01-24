import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: userError } = await supabase.auth.getUser()

    if (userError || !user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const formData = await request.formData()
    const file = formData.get('file') as File
    const ticket_id = formData.get('ticket_id') as string

    if (!file || !ticket_id) {
      return NextResponse.json({ error: 'Archivo y ticket_id requeridos' }, { status: 400 })
    }

    const { data: ticket } = await supabase
      .from('pqrs_tickets')
      .select('creado_por')
      .eq('id', ticket_id)
      .single()

    if (!ticket) {
      return NextResponse.json({ error: 'Ticket no encontrado' }, { status: 404 })
    }

    const { data: profile } = await supabase
      .from('user_profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profile?.role !== 'superadmin' && ticket.creado_por !== user.id) {
      return NextResponse.json({ error: 'No tienes permisos para subir archivos a este ticket' }, { status: 403 })
    }

    const fileExt = file.name.split('.').pop()
    const fileName = `${user.id}/${ticket_id}/${Date.now()}.${fileExt}`

    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('pqrs-attachments')
      .upload(fileName, file, {
        contentType: file.type,
        upsert: false,
      })

    if (uploadError) {
      console.error('Error uploading file:', uploadError)
      return NextResponse.json({ error: uploadError.message }, { status: 500 })
    }

    const { data: attachment, error: dbError } = await supabase
      .from('pqrs_attachments')
      .insert({
        ticket_id,
        nombre_archivo: file.name,
        ruta_storage: uploadData.path,
        tipo_mime: file.type,
        tamano_bytes: file.size,
        subido_por: user.id,
      })
      .select()
      .single()

    if (dbError) {
      console.error('Error saving attachment:', dbError)
      await supabase.storage.from('pqrs-attachments').remove([fileName])
      return NextResponse.json({ error: dbError.message }, { status: 500 })
    }

    return NextResponse.json({ attachment }, { status: 201 })
  } catch (error) {
    console.error('Error in POST /api/pqrs/upload:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}
