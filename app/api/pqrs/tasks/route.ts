import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { sendPQRSNotification, getTaskAssignmentEmail } from '@/lib/email/pqrs-notifications'

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

    if (profile?.role !== 'superadmin') {
      return NextResponse.json({ error: 'Solo superadmins pueden crear tareas' }, { status: 403 })
    }

    const body = await request.json()
    const { ticket_id, titulo, descripcion, asignado_a, prioridad = 'media' } = body

    if (!ticket_id || !titulo || !asignado_a) {
      return NextResponse.json({ error: 'Faltan campos requeridos' }, { status: 400 })
    }

    const { data: task, error } = await supabase
      .from('pqrs_tasks')
      .insert({
        ticket_id,
        titulo,
        descripcion,
        asignado_a,
        asignado_por: user.id,
        prioridad,
      })
      .select(`
        *,
        asignado:user_profiles!pqrs_tasks_asignado_a_fkey(id, full_name, email),
        asignado_por_usuario:user_profiles!pqrs_tasks_asignado_por_fkey(id, full_name, email)
      `)
      .single()

    if (error) {
      console.error('Error creating task:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    await supabase.from('pqrs_comments').insert({
      ticket_id,
      usuario_id: user.id,
      usuario_nombre: profile.full_name,
      usuario_rol: profile.role,
      comentario: `Tarea creada: ${titulo}`,
      es_interno: true,
      tipo_cambio: 'tarea_creada',
    })

    const { data: ticketInfo } = await supabase
      .from('pqrs_tickets')
      .select('ticket_number')
      .eq('id', ticket_id)
      .single()

    if (ticketInfo && task.asignado?.email) {
      const emailHtml = getTaskAssignmentEmail(
        ticketInfo.ticket_number,
        titulo,
        descripcion || '',
        profile.full_name
      )

      await sendPQRSNotification({
        to: task.asignado.email,
        subject: `Nueva Tarea Asignada: ${titulo}`,
        html: emailHtml,
      })
    }

    return NextResponse.json({ task }, { status: 201 })
  } catch (error) {
    console.error('Error in POST /api/pqrs/tasks:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}

export async function PATCH(request: Request) {
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
      return NextResponse.json({ error: 'Solo superadmins pueden actualizar tareas' }, { status: 403 })
    }

    const body = await request.json()
    const { id, estado, prioridad } = body

    if (!id) {
      return NextResponse.json({ error: 'ID de tarea requerido' }, { status: 400 })
    }

    const updates: any = {}
    if (estado) updates.estado = estado
    if (prioridad) updates.prioridad = prioridad

    if (estado === 'completada') {
      updates.fecha_completada = new Date().toISOString()
    }

    const { data: task, error } = await supabase
      .from('pqrs_tasks')
      .update(updates)
      .eq('id', id)
      .select(`
        *,
        asignado:user_profiles!pqrs_tasks_asignado_a_fkey(id, full_name, email),
        asignado_por_usuario:user_profiles!pqrs_tasks_asignado_por_fkey(id, full_name, email)
      `)
      .single()

    if (error) {
      console.error('Error updating task:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    if (estado) {
      await supabase.from('pqrs_comments').insert({
        ticket_id: task.ticket_id,
        usuario_id: user.id,
        usuario_nombre: profile.full_name,
        usuario_rol: profile.role,
        comentario: `Tarea "${task.titulo}" marcada como ${estado}`,
        es_interno: true,
        tipo_cambio: 'tarea_actualizada',
      })
    }

    return NextResponse.json({ task })
  } catch (error) {
    console.error('Error in PATCH /api/pqrs/tasks:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}
