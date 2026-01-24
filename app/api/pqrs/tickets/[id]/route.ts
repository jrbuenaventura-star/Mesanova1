import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { sendPQRSNotification, getTicketStatusChangeEmail } from '@/lib/email/pqrs-notifications'

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: userError } = await supabase.auth.getUser()

    if (userError || !user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const { data: ticket, error } = await supabase
      .from('pqrs_tickets')
      .select(`
        *,
        asignado:user_profiles!pqrs_tickets_asignado_a_fkey(id, full_name, email),
        tareas:pqrs_tasks(*,
          asignado:user_profiles!pqrs_tasks_asignado_a_fkey(id, full_name, email),
          asignado_por_usuario:user_profiles!pqrs_tasks_asignado_por_fkey(id, full_name, email)
        ),
        comentarios:pqrs_comments(*, usuario:user_profiles(id, full_name, email)),
        archivos:pqrs_attachments(*)
      `)
      .eq('id', params.id)
      .single()

    if (error) {
      console.error('Error fetching ticket:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    if (!ticket) {
      return NextResponse.json({ error: 'Ticket no encontrado' }, { status: 404 })
    }

    const { data: profile } = await supabase
      .from('user_profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profile?.role !== 'superadmin' && ticket.creado_por !== user.id) {
      return NextResponse.json({ error: 'No tienes permisos para ver este ticket' }, { status: 403 })
    }

    return NextResponse.json({ ticket })
  } catch (error) {
    console.error('Error in GET /api/pqrs/tickets/[id]:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
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

    if (profile?.role !== 'superadmin') {
      return NextResponse.json({ error: 'Solo superadmins pueden actualizar tickets' }, { status: 403 })
    }

    const body = await request.json()
    const { estado, prioridad, asignado_a, resolucion, oculto } = body

    const { data: ticketActual, error: fetchError } = await supabase
      .from('pqrs_tickets')
      .select('*')
      .eq('id', params.id)
      .single()

    if (fetchError || !ticketActual) {
      return NextResponse.json({ error: 'Ticket no encontrado' }, { status: 404 })
    }

    const updates: any = {}
    const comentarios = []

    if (estado && estado !== ticketActual.estado) {
      updates.estado = estado
      comentarios.push({
        ticket_id: params.id,
        usuario_id: user.id,
        usuario_nombre: profile.full_name,
        usuario_rol: profile.role,
        comentario: `Estado cambiado de "${ticketActual.estado}" a "${estado}"`,
        es_interno: false,
        tipo_cambio: 'estado',
        cambio_anterior: ticketActual.estado,
        cambio_nuevo: estado,
      })

      if (estado === 'resuelto' && resolucion) {
        updates.resolucion = resolucion
        comentarios.push({
          ticket_id: params.id,
          usuario_id: user.id,
          usuario_nombre: profile.full_name,
          usuario_rol: profile.role,
          comentario: `Resolución: ${resolucion}`,
          es_interno: false,
          tipo_cambio: 'resolucion',
        })
      }
    }

    if (prioridad && prioridad !== ticketActual.prioridad) {
      updates.prioridad = prioridad
      comentarios.push({
        ticket_id: params.id,
        usuario_id: user.id,
        usuario_nombre: profile.full_name,
        usuario_rol: profile.role,
        comentario: `Prioridad cambiada de "${ticketActual.prioridad}" a "${prioridad}"`,
        es_interno: true,
        tipo_cambio: 'prioridad',
        cambio_anterior: ticketActual.prioridad,
        cambio_nuevo: prioridad,
      })
    }

    if (asignado_a !== undefined && asignado_a !== ticketActual.asignado_a) {
      updates.asignado_a = asignado_a
      const mensaje = asignado_a 
        ? `Ticket asignado a un administrador`
        : `Ticket desasignado`
      comentarios.push({
        ticket_id: params.id,
        usuario_id: user.id,
        usuario_nombre: profile.full_name,
        usuario_rol: profile.role,
        comentario: mensaje,
        es_interno: true,
        tipo_cambio: 'asignacion',
      })
    }

    if (oculto !== undefined && oculto !== ticketActual.oculto) {
      updates.oculto = oculto
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: 'No hay cambios para actualizar' }, { status: 400 })
    }

    const { data: ticket, error } = await supabase
      .from('pqrs_tickets')
      .update(updates)
      .eq('id', params.id)
      .select()
      .single()

    if (error) {
      console.error('Error updating ticket:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    if (comentarios.length > 0) {
      await supabase.from('pqrs_comments').insert(comentarios)
    }

    if (estado && estado !== ticketActual.estado) {
      const emailHtml = getTicketStatusChangeEmail(
        ticketActual.ticket_number,
        ticketActual.asunto,
        ticketActual.estado,
        estado,
        resolucion
      )

      await sendPQRSNotification({
        to: ticketActual.creado_por_email,
        subject: `Actualización de Ticket ${ticketActual.ticket_number}`,
        html: emailHtml,
      })
    }

    return NextResponse.json({ ticket })
  } catch (error) {
    console.error('Error in PATCH /api/pqrs/tickets/[id]:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}
