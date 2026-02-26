import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: userError } = await supabase.auth.getUser()

    if (userError || !user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const { data: profile } = await supabase
      .from('user_profiles')
      .select('role, full_name')
      .eq('id', user.id)
      .single()

    const body = await request.json()
    const { ticket_id, comentario, es_interno = false } = body

    if (!ticket_id || !comentario) {
      return NextResponse.json({ error: 'Faltan campos requeridos' }, { status: 400 })
    }

    const { data: ticket } = await supabase
      .from('pqrs_tickets')
      .select('creado_por')
      .eq('id', ticket_id)
      .single()

    if (!ticket) {
      return NextResponse.json({ error: 'Ticket no encontrado' }, { status: 404 })
    }

    if (profile?.role !== 'superadmin' && ticket.creado_por !== user.id) {
      return NextResponse.json({ error: 'No tienes permisos para comentar en este ticket' }, { status: 403 })
    }

    if (es_interno && profile?.role !== 'superadmin') {
      return NextResponse.json({ error: 'Solo superadmins pueden crear comentarios internos' }, { status: 403 })
    }

    const { data: comment, error } = await supabase
      .from('pqrs_comments')
      .insert({
        ticket_id,
        usuario_id: user.id,
        usuario_nombre: profile?.full_name,
        usuario_rol: profile?.role,
        comentario,
        es_interno,
      })
      .select('*, usuario:user_profiles(id, full_name)')
      .single()

    if (error) {
      console.error('Error creating comment:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ comment }, { status: 201 })
  } catch (error) {
    console.error('Error in POST /api/pqrs/comments:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}
