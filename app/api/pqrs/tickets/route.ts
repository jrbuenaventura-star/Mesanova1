import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { sendPQRSNotification, getNewTicketNotificationEmail } from '@/lib/email/pqrs-notifications'

export async function GET(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: userError } = await supabase.auth.getUser()

    if (userError || !user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const estado = searchParams.get('estado')
    const prioridad = searchParams.get('prioridad')
    const tipo = searchParams.get('tipo')
    const incluirOcultos = searchParams.get('incluir_ocultos') === 'true'

    const { data: profile } = await supabase
      .from('user_profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    let query = supabase
      .from('pqrs_tickets')
      .select(`
        *,
        asignado:user_profiles!pqrs_tickets_asignado_a_fkey(id, full_name, email),
        tareas:pqrs_tasks(count)
      `)
      .order('fecha_creacion', { ascending: false })

    if (profile?.role !== 'superadmin') {
      query = query.eq('creado_por', user.id)
    }

    if (!incluirOcultos) {
      query = query.eq('oculto', false)
    }

    if (estado) {
      query = query.eq('estado', estado)
    }

    if (prioridad) {
      query = query.eq('prioridad', prioridad)
    }

    if (tipo) {
      query = query.eq('tipo', tipo)
    }

    let { data: tickets, error } = await query

    if (error) {
      const errorMessage = (error as any)?.message || String(error)
      const isRelationshipError =
        errorMessage.includes('Could not find a relationship') ||
        errorMessage.includes('schema cache')

      if (isRelationshipError) {
        let fallbackQuery = supabase
          .from('pqrs_tickets')
          .select(`
            *,
            tareas:pqrs_tasks(count)
          `)
          .order('fecha_creacion', { ascending: false })

        if (profile?.role !== 'superadmin') {
          fallbackQuery = fallbackQuery.eq('creado_por', user.id)
        }

        if (!incluirOcultos) {
          fallbackQuery = fallbackQuery.eq('oculto', false)
        }

        if (estado) {
          fallbackQuery = fallbackQuery.eq('estado', estado)
        }

        if (prioridad) {
          fallbackQuery = fallbackQuery.eq('prioridad', prioridad)
        }

        if (tipo) {
          fallbackQuery = fallbackQuery.eq('tipo', tipo)
        }

        const fallbackResult = await fallbackQuery
        tickets = fallbackResult.data
        error = fallbackResult.error
      }
    }

    if (error) {
      console.error('Error fetching tickets:', error)
      return NextResponse.json({ error: (error as any)?.message || 'Error interno' }, { status: 500 })
    }

    return NextResponse.json({ tickets: tickets || [] })
  } catch (error) {
    console.error('Error in GET /api/pqrs/tickets:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: userError } = await supabase.auth.getUser()

    if (userError || !user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const { data: profile } = await supabase
      .from('user_profiles')
      .select('role, full_name, email')
      .eq('id', user.id)
      .single()

    if (!profile || !['distributor', 'aliado'].includes(profile.role)) {
      return NextResponse.json({ error: 'No tienes permisos para crear tickets' }, { status: 403 })
    }

    const body = await request.json()
    const { tipo, asunto, descripcion, prioridad = 'media' } = body

    if (!tipo || !asunto || !descripcion) {
      return NextResponse.json({ error: 'Faltan campos requeridos' }, { status: 400 })
    }

    const { data: ticket, error } = await supabase
      .from('pqrs_tickets')
      .insert({
        tipo,
        asunto,
        descripcion,
        prioridad,
        creado_por: user.id,
        creado_por_nombre: profile.full_name,
        creado_por_email: profile.email,
        creado_por_rol: profile.role,
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating ticket:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    await supabase.from('pqrs_comments').insert({
      ticket_id: ticket.id,
      usuario_id: user.id,
      usuario_nombre: profile.full_name,
      usuario_rol: profile.role,
      comentario: `Ticket creado: ${asunto}`,
      tipo_cambio: 'creacion',
    })

    const { data: superadmins } = await supabase
      .from('user_profiles')
      .select('email, full_name')
      .eq('role', 'superadmin')

    if (superadmins && superadmins.length > 0) {
      const emailHtml = getNewTicketNotificationEmail(
        ticket.ticket_number,
        tipo,
        asunto,
        descripcion,
        prioridad,
        profile.full_name,
        profile.email
      )

      for (const admin of superadmins) {
        await sendPQRSNotification({
          to: admin.email,
          subject: `Nuevo Ticket ${ticket.ticket_number}: ${asunto}`,
          html: emailHtml,
        })
      }
    }

    return NextResponse.json({ ticket }, { status: 201 })
  } catch (error) {
    console.error('Error in POST /api/pqrs/tickets:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}
