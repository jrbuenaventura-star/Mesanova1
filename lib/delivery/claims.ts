import "server-only"

import type { SupabaseClient } from "@supabase/supabase-js"

import { DELIVERY_DISPATCH_EMAIL } from "@/lib/delivery/constants"
import { sendPQRSNotification } from "@/lib/email/pqrs-notifications"

type CreateDeliveryClaimInput = {
  orderId: string
  warehouseId: string
  transporterId?: string | null
  customerId?: string | null
  invoiceNumber: string
  productReference: string
  defectiveQuantity: number
  description?: string | null
  claimantName?: string | null
  claimantContact?: string | null
  evidenceFiles: File[]
  guideFile: File
}

type ClaimTicketOwner = {
  userId: string
  fullName: string | null
  email: string | null
  role: string
  distributorId: string | null
  source: string
}

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

function isUuidLike(value: string | null | undefined) {
  if (!value) return false
  return UUID_PATTERN.test(value.trim())
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

async function resolveOwnerFromUserId(
  supabaseAdmin: SupabaseClient,
  userId: string,
  source: string
): Promise<ClaimTicketOwner | null> {
  const { data: profile } = await supabaseAdmin
    .from("user_profiles")
    .select("id, full_name, role")
    .eq("id", userId)
    .maybeSingle()

  const { data: distributor } = await supabaseAdmin
    .from("distributors")
    .select("id, company_name, contact_email")
    .eq("user_id", userId)
    .maybeSingle()

  if (!profile && !distributor) {
    return null
  }

  const role = profile?.role || (distributor ? "distributor" : "end_user")
  if (role === "superadmin") {
    return null
  }

  return {
    userId,
    fullName: profile?.full_name || distributor?.company_name || null,
    email: distributor?.contact_email || null,
    role,
    distributorId: distributor?.id || null,
    source,
  }
}

async function resolveOwnerFromDistributorId(
  supabaseAdmin: SupabaseClient,
  distributorId: string,
  source: string
): Promise<ClaimTicketOwner | null> {
  const { data: distributor } = await supabaseAdmin
    .from("distributors")
    .select("id, user_id, company_name, contact_email")
    .eq("id", distributorId)
    .maybeSingle()

  if (!distributor?.user_id) {
    return null
  }

  const ownerByUser = await resolveOwnerFromUserId(
    supabaseAdmin,
    distributor.user_id,
    `${source}:user_id`
  )

  if (ownerByUser) {
    return {
      ...ownerByUser,
      distributorId: distributor.id,
      email: ownerByUser.email || distributor.contact_email || null,
    }
  }

  return {
    userId: distributor.user_id,
    fullName: distributor.company_name || null,
    email: distributor.contact_email || null,
    role: "distributor",
    distributorId: distributor.id,
    source,
  }
}

function extractRawPayloadCandidates(rawPayload: unknown): string[] {
  if (!rawPayload || typeof rawPayload !== "object" || Array.isArray(rawPayload)) {
    return []
  }

  const candidateKeys = [
    "distributor_user_id",
    "distributor_id",
    "recipient_user_id",
    "user_id",
    "customer_id",
  ]

  const objectsToInspect = [
    rawPayload as Record<string, unknown>,
    ((rawPayload as Record<string, unknown>).order || null) as Record<string, unknown> | null,
    ((rawPayload as Record<string, unknown>).customer || null) as Record<string, unknown> | null,
    ((rawPayload as Record<string, unknown>).recipient || null) as Record<string, unknown> | null,
  ].filter((entry): entry is Record<string, unknown> => !!entry && typeof entry === "object")

  const values: string[] = []
  for (const obj of objectsToInspect) {
    for (const key of candidateKeys) {
      const value = obj[key]
      if (typeof value === "string" && value.trim()) {
        values.push(value.trim())
      }
    }
  }

  return values
}

async function resolveDeliveryClaimTicketOwner(
  supabaseAdmin: SupabaseClient,
  input: { orderId: string; customerId?: string | null }
): Promise<ClaimTicketOwner | null> {
  const seen = new Set<string>()

  const tryCandidate = async (rawCandidate: string | null | undefined, source: string) => {
    const candidate = (rawCandidate || "").trim()
    if (!candidate || seen.has(candidate)) {
      return null
    }
    seen.add(candidate)

    const byDistributor = await resolveOwnerFromDistributorId(
      supabaseAdmin,
      candidate,
      `${source}:distributor_id`
    )
    if (byDistributor) {
      return byDistributor
    }

    if (isUuidLike(candidate)) {
      const byUser = await resolveOwnerFromUserId(supabaseAdmin, candidate, `${source}:user_id`)
      if (byUser) {
        return byUser
      }
    }

    return null
  }

  const fromCustomerId = await tryCandidate(input.customerId, "delivery_qr.customer_id")
  if (fromCustomerId) {
    return fromCustomerId
  }

  if (isUuidLike(input.orderId)) {
    const { data: order } = await supabaseAdmin
      .from("orders")
      .select("id, user_id, distributor_id")
      .eq("id", input.orderId)
      .maybeSingle()

    if (order?.distributor_id) {
      const fromOrderDistributor = await tryCandidate(
        order.distributor_id,
        "orders.distributor_id"
      )
      if (fromOrderDistributor) {
        return fromOrderDistributor
      }
    }

    if (order?.user_id) {
      const fromOrderUser = await tryCandidate(order.user_id, "orders.user_id")
      if (fromOrderUser) {
        return fromOrderUser
      }
    }
  }

  const { data: snapshot } = await supabaseAdmin
    .from("delivery_erp_order_snapshots")
    .select("order_id, customer_id, raw_payload")
    .eq("order_id", input.orderId)
    .maybeSingle()

  if (snapshot?.customer_id) {
    const fromSnapshotCustomer = await tryCandidate(
      snapshot.customer_id,
      "delivery_erp_order_snapshots.customer_id"
    )
    if (fromSnapshotCustomer) {
      return fromSnapshotCustomer
    }
  }

  const snapshotCandidates = extractRawPayloadCandidates(snapshot?.raw_payload)
  for (const [index, candidate] of snapshotCandidates.entries()) {
    const fromRawPayload = await tryCandidate(
      candidate,
      `delivery_erp_order_snapshots.raw_payload.${index}`
    )
    if (fromRawPayload) {
      return fromRawPayload
    }
  }

  return null
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
  const systemCreator = await resolveSystemCreator(supabaseAdmin)
  const ticketOwner = await resolveDeliveryClaimTicketOwner(supabaseAdmin, {
    orderId: input.orderId,
    customerId: input.customerId || null,
  })

  const ticketOwnerUserId = ticketOwner?.userId || systemCreator.id
  const ticketOwnerName =
    ticketOwner?.fullName ||
    input.claimantName ||
    systemCreator.full_name ||
    "Cliente Mesanova"
  const ticketOwnerEmail = ticketOwner?.email || null
  const ticketOwnerRole = ticketOwner?.role || systemCreator.role || "system"

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
      ticket_owner_user_id: ticketOwnerUserId,
      ticket_owner_role: ticketOwnerRole,
      ticket_owner_distributor_id: ticketOwner?.distributorId || null,
      ticket_owner_source: ticketOwner?.source || "system_fallback",
      system_actor_user_id: systemCreator.id,
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
      creado_por: ticketOwnerUserId,
      creado_por_nombre: ticketOwnerName,
      creado_por_email: ticketOwnerEmail,
      creado_por_rol: ticketOwnerRole,
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
        userId: systemCreator.id,
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
      userId: systemCreator.id,
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
    usuario_id: systemCreator.id,
    usuario_nombre: systemCreator.full_name || "Sistema Mesanova",
    usuario_rol: systemCreator.role || "superadmin",
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
