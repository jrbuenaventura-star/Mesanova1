import "server-only"

import type { SupabaseClient } from "@supabase/supabase-js"

import { DELIVERY_DISPATCH_EMAIL } from "@/lib/delivery/constants"
import { sendPQRSNotification } from "@/lib/email/pqrs-notifications"

type CreateDeliveryClaimInput = {
  orderId: string
  warehouseId: string
  transporterId?: string | null
  invoiceNumber: string
  productReference: string
  defectiveQuantity: number
  description?: string | null
  claimantName?: string | null
  claimantContact?: string | null
  evidenceFiles: File[]
  guideFile: File
}

function getClaimEmailHtml(input: CreateDeliveryClaimInput, ticketNumber: string) {
  return `
    <html>
      <body style="font-family: Arial, sans-serif; color: #1f2937;">
        <h2>Nueva reclamación de entrega (${ticketNumber})</h2>
        <p><strong>Pedido:</strong> ${input.orderId}</p>
        <p><strong>Bodega:</strong> ${input.warehouseId}</p>
        <p><strong>Transportador:</strong> ${input.transporterId || "No informado"}</p>
        <p><strong>Número de factura:</strong> ${input.invoiceNumber}</p>
        <p><strong>Referencia:</strong> ${input.productReference}</p>
        <p><strong>Cantidad defectuosa:</strong> ${input.defectiveQuantity}</p>
        <p><strong>Solicitante:</strong> ${input.claimantName || "Cliente"}</p>
        <p><strong>Contacto:</strong> ${input.claimantContact || "No informado"}</p>
        <p><strong>Descripción:</strong> ${input.description || "Sin descripción adicional"}</p>
        <p>Revisa el ticket en <a href="${process.env.NEXT_PUBLIC_SITE_URL || "https://www.mesanova.co"}/admin/pqrs">/admin/pqrs</a>.</p>
      </body>
    </html>
  `
}

async function resolveSystemCreator(supabaseAdmin: SupabaseClient) {
  const selectProfile = () =>
    supabaseAdmin
      .from("user_profiles")
      .select("id, full_name, role")

  if (process.env.DELIVERY_SYSTEM_USER_ID) {
    const { data: profileByEnv, error: profileByEnvError } = await selectProfile()
      .eq("id", process.env.DELIVERY_SYSTEM_USER_ID)
      .maybeSingle()

    if (profileByEnv) {
      return {
        ...profileByEnv,
        email: null,
      }
    }

    if (profileByEnvError && profileByEnvError.code !== "PGRST116") {
      console.warn("Failed to resolve DELIVERY_SYSTEM_USER_ID profile", profileByEnvError)
    }
  }

  const { data: profile, error: superadminError } = await selectProfile()
    .eq("role", "superadmin")
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle()

  if (profile) {
    return {
      ...profile,
      email: null,
    }
  }

  if (superadminError && superadminError.code !== "PGRST116") {
    console.warn("Failed to resolve superadmin system user", superadminError)
  }

  // Fallback for environments without seeded superadmin profiles.
  const { data: anyProfile, error: anyProfileError } = await selectProfile()
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle()

  if (anyProfile) {
    return {
      ...anyProfile,
      email: null,
    }
  }

  if (anyProfileError && anyProfileError.code !== "PGRST116") {
    console.warn("Failed to resolve fallback system user", anyProfileError)
  }

  const { data: authUsersData, error: authUsersError } = await supabaseAdmin.auth.admin.listUsers({
    page: 1,
    perPage: 1,
  })

  const authUser = authUsersData?.users?.[0]
  if (authUser) {
    return {
      id: authUser.id,
      full_name:
        typeof authUser.user_metadata?.full_name === "string"
          ? authUser.user_metadata.full_name
          : null,
      email: authUser.email || null,
      role: "system",
    }
  }

  if (authUsersError) {
    console.warn("Failed to resolve fallback auth user", authUsersError)
  }

  throw new Error("No system user available to create delivery claim ticket")
}

async function uploadClaimAttachment(params: {
  supabaseAdmin: SupabaseClient
  ticketId: string
  userId: string
  file: File
  attachmentType: "evidencia_fotografica" | "foto_guia"
  index: number
}) {
  const fileExt = params.file.name.split(".").pop() || "bin"
  const fileName = `${params.userId}/${params.ticketId}/${Date.now()}-${params.index}.${fileExt}`

  const { data: uploadData, error: uploadError } = await params.supabaseAdmin.storage
    .from("pqrs-attachments")
    .upload(fileName, params.file, {
      contentType: params.file.type,
      upsert: false,
    })

  if (uploadError || !uploadData) {
    throw new Error(uploadError?.message || "Failed to upload claim attachment")
  }

  const { error: dbError } = await params.supabaseAdmin.from("pqrs_attachments").insert({
    ticket_id: params.ticketId,
    nombre_archivo: params.file.name,
    ruta_storage: uploadData.path,
    tipo_mime: params.file.type,
    tamano_bytes: params.file.size,
    subido_por: params.userId,
    metadata: {
      tipo_adjunto: params.attachmentType,
      origen: "delivery_qr_module",
    },
  })

  if (dbError) {
    await params.supabaseAdmin.storage.from("pqrs-attachments").remove([uploadData.path])
    throw new Error(dbError.message)
  }

  return uploadData.path
}

export async function createDeliveryClaimTicket(
  supabaseAdmin: SupabaseClient,
  input: CreateDeliveryClaimInput
) {
  const creator = await resolveSystemCreator(supabaseAdmin)

  const metadata = {
    reclamo: {
      numero_factura: input.invoiceNumber,
      referencia_producto: input.productReference,
      cantidad_productos_defectuosos: input.defectiveQuantity,
    },
    delivery_confirmation: {
      order_id: input.orderId,
      warehouse_id: input.warehouseId,
      transporter_id: input.transporterId || null,
      claimant_name: input.claimantName || null,
      claimant_contact: input.claimantContact || null,
    },
  }

  const descripcionPartes = [
    `Reclamación automática asociada a entrega QR.`,
    `Pedido: ${input.orderId}`,
    `Bodega: ${input.warehouseId}`,
    `Número de factura: ${input.invoiceNumber}`,
    `Referencia: ${input.productReference}`,
    `Cantidad defectuosa: ${input.defectiveQuantity}`,
    `Transportador: ${input.transporterId || "No informado"}`,
    input.description ? `Detalle: ${input.description}` : null,
  ].filter(Boolean)

  const { data: ticket, error: ticketError } = await supabaseAdmin
    .from("pqrs_tickets")
    .insert({
      tipo: "reclamo",
      asunto: `Reclamación de entrega ${input.orderId}`,
      descripcion: descripcionPartes.join("\n"),
      prioridad: "alta",
      creado_por: creator.id,
      creado_por_nombre: creator.full_name || "Sistema Mesanova",
      creado_por_email: creator.email || "sistema@mesanova.co",
      creado_por_rol: creator.role || "superadmin",
      metadata,
    })
    .select()
    .single()

  if (ticketError || !ticket) {
    throw new Error(ticketError?.message || "Unable to create PQRS claim ticket")
  }

  const uploadedPaths: string[] = []
  const evidencePaths: string[] = []
  let guidePath: string | null = null
  try {
    let index = 0
    for (const evidence of input.evidenceFiles) {
      const path = await uploadClaimAttachment({
        supabaseAdmin,
        ticketId: ticket.id,
        userId: creator.id,
        file: evidence,
        attachmentType: "evidencia_fotografica",
        index: index++,
      })
      uploadedPaths.push(path)
      evidencePaths.push(path)
    }

    guidePath = await uploadClaimAttachment({
      supabaseAdmin,
      ticketId: ticket.id,
      userId: creator.id,
      file: input.guideFile,
      attachmentType: "foto_guia",
      index: index++,
    })
    uploadedPaths.push(guidePath)
  } catch (error) {
    if (uploadedPaths.length > 0) {
      await supabaseAdmin.storage.from("pqrs-attachments").remove(uploadedPaths)
    }
    await supabaseAdmin.from("pqrs_tickets").delete().eq("id", ticket.id)
    throw error
  }

  await supabaseAdmin.from("pqrs_comments").insert({
    ticket_id: ticket.id,
    usuario_id: creator.id,
    usuario_nombre: creator.full_name || "Sistema Mesanova",
    usuario_rol: creator.role || "superadmin",
    comentario: `Ticket creado automáticamente desde confirmación de entrega QR para pedido ${input.orderId}.`,
    tipo_cambio: "creacion",
  })

  const subject = `Reclamación de entrega ${ticket.ticket_number} - Pedido ${input.orderId}`
  const html = getClaimEmailHtml(input, ticket.ticket_number)

  await sendPQRSNotification({
    to: DELIVERY_DISPATCH_EMAIL,
    subject,
    html,
  })

  return {
    ticket,
    evidencePaths,
    guidePath,
  }
}
