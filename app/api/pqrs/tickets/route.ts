import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { sendPQRSNotification, getNewTicketNotificationEmail } from '@/lib/email/pqrs-notifications'

type TicketAttachmentType = 'evidencia_fotografica' | 'foto_guia' | 'adjunto_general'

type TicketCreatePayload = {
  tipo: string
  asunto: string
  descripcion: string
  prioridad: string
  numero_factura: string
  referencia_producto: string
  cantidad_productos_defectuosos_raw: string
  files: File[]
  evidenciaFotos: File[]
  fotoGuiaFiles: File[]
}

function asTrimmedString(value: FormDataEntryValue | unknown): string {
  if (typeof value === 'string') {
    return value.trim()
  }
  return ''
}

function getFormFiles(formData: FormData, key: string): File[] {
  return formData
    .getAll(key)
    .filter((entry): entry is File => entry instanceof File && entry.size > 0)
}

function assertImageFiles(files: File[], fieldLabel: string): string | null {
  for (const file of files) {
    if (!file.type?.startsWith('image/')) {
      return `Todos los archivos de ${fieldLabel} deben ser imágenes`
    }
  }
  return null
}

async function parseTicketCreatePayload(request: Request): Promise<TicketCreatePayload> {
  const contentType = request.headers.get('content-type') || ''

  if (contentType.includes('application/json')) {
    const body = await request.json()
    return {
      tipo: asTrimmedString(body?.tipo),
      asunto: asTrimmedString(body?.asunto),
      descripcion: asTrimmedString(body?.descripcion),
      prioridad: asTrimmedString(body?.prioridad) || 'media',
      numero_factura: asTrimmedString(body?.numero_factura),
      referencia_producto: asTrimmedString(body?.referencia_producto),
      cantidad_productos_defectuosos_raw: asTrimmedString(body?.cantidad_productos_defectuosos),
      files: [],
      evidenciaFotos: [],
      fotoGuiaFiles: [],
    }
  }

  const formData = await request.formData()

  return {
    tipo: asTrimmedString(formData.get('tipo')),
    asunto: asTrimmedString(formData.get('asunto')),
    descripcion: asTrimmedString(formData.get('descripcion')),
    prioridad: asTrimmedString(formData.get('prioridad')) || 'media',
    numero_factura: asTrimmedString(formData.get('numero_factura')),
    referencia_producto: asTrimmedString(formData.get('referencia_producto')),
    cantidad_productos_defectuosos_raw: asTrimmedString(formData.get('cantidad_productos_defectuosos')),
    files: getFormFiles(formData, 'files'),
    evidenciaFotos: getFormFiles(formData, 'evidencia_fotografica_files'),
    fotoGuiaFiles: getFormFiles(formData, 'foto_guia_file'),
  }
}

async function uploadTicketAttachment(
  supabase: Awaited<ReturnType<typeof createClient>>,
  ticketId: string,
  userId: string,
  file: File,
  attachmentType: TicketAttachmentType,
  index: number
): Promise<string> {
  const fileExt = file.name.split('.').pop() || 'bin'
  const fileName = `${userId}/${ticketId}/${Date.now()}-${index}.${fileExt}`

  const { data: uploadData, error: uploadError } = await supabase.storage
    .from('pqrs-attachments')
    .upload(fileName, file, {
      contentType: file.type,
      upsert: false,
    })

  if (uploadError || !uploadData) {
    throw new Error(uploadError?.message || 'No se pudo subir el archivo')
  }

  const { error: dbError } = await supabase
    .from('pqrs_attachments')
    .insert({
      ticket_id: ticketId,
      nombre_archivo: file.name,
      ruta_storage: uploadData.path,
      tipo_mime: file.type,
      tamano_bytes: file.size,
      subido_por: userId,
      metadata: {
        tipo_adjunto: attachmentType,
      },
    })

  if (dbError) {
    await supabase.storage.from('pqrs-attachments').remove([uploadData.path])
    throw new Error(dbError.message)
  }

  return uploadData.path
}

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

    const payload = await parseTicketCreatePayload(request)
    const { tipo, asunto, descripcion, prioridad } = payload

    if (!tipo || !asunto || !descripcion) {
      return NextResponse.json({ error: 'Faltan campos requeridos' }, { status: 400 })
    }

    const isReclamo = tipo === 'reclamo'

    let cantidadProductosDefectuosos: number | null = null
    if (isReclamo) {
      if (!payload.numero_factura || !payload.referencia_producto || !payload.cantidad_productos_defectuosos_raw) {
        return NextResponse.json(
          {
            error:
              'Para reclamaciones son obligatorios: número de factura, referencia del producto y cantidad de productos defectuosos',
          },
          { status: 400 }
        )
      }

      const parsedCantidad = Number(payload.cantidad_productos_defectuosos_raw)
      if (!Number.isFinite(parsedCantidad) || parsedCantidad <= 0 || !Number.isInteger(parsedCantidad)) {
        return NextResponse.json(
          { error: 'La cantidad de productos defectuosos debe ser un número entero mayor a 0' },
          { status: 400 }
        )
      }
      cantidadProductosDefectuosos = parsedCantidad

      if (payload.evidenciaFotos.length === 0) {
        return NextResponse.json(
          { error: 'Para reclamaciones debes adjuntar evidencia fotográfica' },
          { status: 400 }
        )
      }

      if (payload.fotoGuiaFiles.length === 0) {
        return NextResponse.json(
          { error: 'Para reclamaciones debes adjuntar foto de la guía' },
          { status: 400 }
        )
      }

      if (payload.fotoGuiaFiles.length > 1) {
        return NextResponse.json(
          { error: 'Solo se permite una foto de la guía por reclamación' },
          { status: 400 }
        )
      }

      const evidenciaValidationError = assertImageFiles(payload.evidenciaFotos, 'evidencia fotográfica')
      if (evidenciaValidationError) {
        return NextResponse.json({ error: evidenciaValidationError }, { status: 400 })
      }

      const guiaValidationError = assertImageFiles(payload.fotoGuiaFiles, 'foto de la guía')
      if (guiaValidationError) {
        return NextResponse.json({ error: guiaValidationError }, { status: 400 })
      }
    }

    const metadata: Record<string, unknown> = {}
    if (isReclamo) {
      metadata.reclamo = {
        numero_factura: payload.numero_factura,
        referencia_producto: payload.referencia_producto,
        cantidad_productos_defectuosos: cantidadProductosDefectuosos,
      }
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
        metadata,
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating ticket:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    const uploadedPaths: string[] = []
    try {
      let attachmentIndex = 0

      for (const file of payload.evidenciaFotos) {
        const path = await uploadTicketAttachment(supabase, ticket.id, user.id, file, 'evidencia_fotografica', attachmentIndex++)
        uploadedPaths.push(path)
      }

      for (const file of payload.fotoGuiaFiles) {
        const path = await uploadTicketAttachment(supabase, ticket.id, user.id, file, 'foto_guia', attachmentIndex++)
        uploadedPaths.push(path)
      }

      for (const file of payload.files) {
        const path = await uploadTicketAttachment(supabase, ticket.id, user.id, file, 'adjunto_general', attachmentIndex++)
        uploadedPaths.push(path)
      }
    } catch (attachmentError) {
      if (uploadedPaths.length > 0) {
        await supabase.storage.from('pqrs-attachments').remove(uploadedPaths)
      }
      await supabase.from('pqrs_tickets').delete().eq('id', ticket.id)
      return NextResponse.json(
        {
          error:
            attachmentError instanceof Error
              ? attachmentError.message
              : 'No se pudieron guardar los archivos adjuntos del ticket',
        },
        { status: 500 }
      )
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
        try {
          await sendPQRSNotification({
            to: admin.email,
            subject: `Nuevo Ticket ${ticket.ticket_number}: ${asunto}`,
            html: emailHtml,
          })
        } catch (notificationError) {
          console.error('Error sending ticket notification email:', notificationError)
        }
      }
    }

    return NextResponse.json({ ticket }, { status: 201 })
  } catch (error) {
    console.error('Error in POST /api/pqrs/tickets:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}
