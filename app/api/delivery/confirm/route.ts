import { createHash } from "crypto"

import { NextResponse } from "next/server"

import { writeDeliveryAuditLog } from "@/lib/delivery/audit"
import { createDeliveryClaimTicket } from "@/lib/delivery/claims"
import { buildLegalClause } from "@/lib/delivery/constants"
import { createDeliveryEvidencePdf } from "@/lib/delivery/pdf"
import { getRequestContext } from "@/lib/delivery/request"
import { hashSessionToken } from "@/lib/delivery/security"
import { createAdminClient } from "@/lib/supabase/admin"

type ParsedConfirmBody = {
  sessionToken: string
  acceptanceMode: "total" | "parcial" | "rechazado"
  acceptedPackageNumbers: number[]
  signatureData: string
  signatureName: string
  legalClauseText: string
  legalAccepted: boolean
  geoLat: number | null
  geoLng: number | null
  geoAccuracy: number | null
  deviceId: string | null
  partialReason: string | null
  incidentEnabled: boolean
  incidentInvoiceNumber: string | null
  incidentProductReference: string | null
  incidentDefectiveQuantity: number | null
  incidentDescription: string | null
  claimantName: string | null
  claimantContact: string | null
  offlineHash: string | null
  offlineTimestamp: string | null
  incidentEvidenceFiles: File[]
  incidentGuideFile: File | null
}

function parseBoolean(value: unknown) {
  if (typeof value === "boolean") return value
  if (typeof value === "string") return value.toLowerCase() === "true" || value === "1"
  return false
}

function parseNumberOrNull(value: unknown) {
  const numeric = Number(value)
  return Number.isFinite(numeric) ? numeric : null
}

function parseAcceptedPackages(value: unknown) {
  if (Array.isArray(value)) {
    return value
      .map((entry) => Number(entry))
      .filter((entry) => Number.isInteger(entry) && entry > 0)
  }

  if (typeof value === "string" && value.trim()) {
    try {
      const parsed = JSON.parse(value)
      if (Array.isArray(parsed)) {
        return parsed
          .map((entry) => Number(entry))
          .filter((entry) => Number.isInteger(entry) && entry > 0)
      }
    } catch {
      return []
    }
  }

  return []
}

function getFormFiles(formData: FormData, key: string) {
  return formData
    .getAll(key)
    .filter((entry): entry is File => entry instanceof File && entry.size > 0)
}

async function parseRequestBody(request: Request): Promise<ParsedConfirmBody> {
  const contentType = request.headers.get("content-type") || ""

  if (contentType.includes("multipart/form-data")) {
    const formData = await request.formData()
    const guideFile =
      formData.get("incident_guide_file") instanceof File
        ? (formData.get("incident_guide_file") as File)
        : null

    return {
      sessionToken: String(formData.get("session_token") || "").trim(),
      acceptanceMode: (String(formData.get("acceptance_mode") || "total").trim() as
        | "total"
        | "parcial"
        | "rechazado"),
      acceptedPackageNumbers: parseAcceptedPackages(formData.get("accepted_package_numbers")),
      signatureData: String(formData.get("signature_data") || "").trim(),
      signatureName: String(formData.get("signature_name") || "").trim(),
      legalClauseText: String(formData.get("legal_clause_text") || "").trim(),
      legalAccepted: parseBoolean(formData.get("legal_accepted")),
      geoLat: parseNumberOrNull(formData.get("geo_lat")),
      geoLng: parseNumberOrNull(formData.get("geo_lng")),
      geoAccuracy: parseNumberOrNull(formData.get("geo_accuracy")),
      deviceId: String(formData.get("device_id") || "").trim() || null,
      partialReason: String(formData.get("partial_reason") || "").trim() || null,
      incidentEnabled: parseBoolean(formData.get("incident_enabled")),
      incidentInvoiceNumber: String(formData.get("incident_invoice_number") || "").trim() || null,
      incidentProductReference:
        String(formData.get("incident_product_reference") || "").trim() || null,
      incidentDefectiveQuantity: parseNumberOrNull(formData.get("incident_defective_quantity")),
      incidentDescription: String(formData.get("incident_description") || "").trim() || null,
      claimantName: String(formData.get("claimant_name") || "").trim() || null,
      claimantContact: String(formData.get("claimant_contact") || "").trim() || null,
      offlineHash: String(formData.get("offline_hash") || "").trim() || null,
      offlineTimestamp: String(formData.get("offline_timestamp") || "").trim() || null,
      incidentEvidenceFiles: getFormFiles(formData, "incident_evidence_files"),
      incidentGuideFile: guideFile && guideFile.size > 0 ? guideFile : null,
    }
  }

  const json = (await request.json()) as Record<string, unknown>
  return {
    sessionToken: String(json.session_token || "").trim(),
    acceptanceMode: (String(json.acceptance_mode || "total").trim() as
      | "total"
      | "parcial"
      | "rechazado"),
    acceptedPackageNumbers: parseAcceptedPackages(json.accepted_package_numbers),
    signatureData: String(json.signature_data || "").trim(),
    signatureName: String(json.signature_name || "").trim(),
    legalClauseText: String(json.legal_clause_text || "").trim(),
    legalAccepted: parseBoolean(json.legal_accepted),
    geoLat: parseNumberOrNull(json.geo_lat),
    geoLng: parseNumberOrNull(json.geo_lng),
    geoAccuracy: parseNumberOrNull(json.geo_accuracy),
    deviceId: String(json.device_id || "").trim() || null,
    partialReason: String(json.partial_reason || "").trim() || null,
    incidentEnabled: parseBoolean(json.incident_enabled),
    incidentInvoiceNumber: String(json.incident_invoice_number || "").trim() || null,
    incidentProductReference: String(json.incident_product_reference || "").trim() || null,
    incidentDefectiveQuantity: parseNumberOrNull(json.incident_defective_quantity),
    incidentDescription: String(json.incident_description || "").trim() || null,
    claimantName: String(json.claimant_name || "").trim() || null,
    claimantContact: String(json.claimant_contact || "").trim() || null,
    offlineHash: String(json.offline_hash || "").trim() || null,
    offlineTimestamp: String(json.offline_timestamp || "").trim() || null,
    incidentEvidenceFiles: [],
    incidentGuideFile: null,
  }
}

async function ensureDeliveryEvidenceBucket(supabaseAdmin: ReturnType<typeof createAdminClient>) {
  const bucketName = "delivery-evidence"
  const { data: bucket } = await supabaseAdmin.storage.getBucket(bucketName)
  if (!bucket) {
    await supabaseAdmin.storage.createBucket(bucketName, {
      public: false,
      fileSizeLimit: 10 * 1024 * 1024,
      allowedMimeTypes: ["application/pdf"],
    })
  }
  return bucketName
}

export async function POST(request: Request) {
  try {
    const body = await parseRequestBody(request)
    if (!body.sessionToken) {
      return NextResponse.json({ error: "session_token es obligatorio" }, { status: 400 })
    }

    if (!body.signatureData) {
      return NextResponse.json({ error: "La firma digital es obligatoria" }, { status: 400 })
    }

    if (!body.legalAccepted) {
      return NextResponse.json(
        { error: "Debes aceptar la cláusula legal para confirmar la entrega" },
        { status: 400 }
      )
    }

    if (body.geoLat === null || body.geoLng === null) {
      return NextResponse.json(
        { error: "La geolocalización es obligatoria para confirmar la entrega" },
        { status: 400 }
      )
    }

    const supabaseAdmin = createAdminClient()
    const context = await getRequestContext()
    const sessionHash = hashSessionToken(body.sessionToken)

    const { data: session, error: sessionError } = await supabaseAdmin
      .from("delivery_validation_sessions")
      .select("id, qr_id, challenge_id, otp_verified, expires_at, consumed_at")
      .eq("session_token_hash", sessionHash)
      .single()

    if (sessionError || !session) {
      return NextResponse.json({ error: "Sesión de validación inválida" }, { status: 401 })
    }

    if (!session.otp_verified) {
      return NextResponse.json({ error: "Sesión sin OTP válido" }, { status: 401 })
    }

    if (session.consumed_at) {
      return NextResponse.json({ error: "La sesión ya fue utilizada" }, { status: 409 })
    }

    const now = new Date()
    if (new Date(session.expires_at).getTime() <= now.getTime()) {
      return NextResponse.json({ error: "Sesión de validación expirada" }, { status: 410 })
    }

    const { data: qr, error: qrError } = await supabaseAdmin
      .from("delivery_qr_tokens")
      .select("id, order_id, warehouse_id, transporter_id, status, expires_at, delivery_batch_id")
      .eq("id", session.qr_id)
      .single()

    if (qrError || !qr) {
      return NextResponse.json({ error: "QR asociado no encontrado" }, { status: 404 })
    }

    if (["confirmado", "confirmado_con_incidente", "rechazado"].includes(qr.status)) {
      return NextResponse.json({ error: "La entrega ya fue confirmada previamente" }, { status: 409 })
    }

    if (new Date(qr.expires_at).getTime() <= now.getTime()) {
      await supabaseAdmin
        .from("delivery_qr_tokens")
        .update({ status: "expirado", updated_at: now.toISOString() })
        .eq("id", qr.id)
      return NextResponse.json({ error: "QR expirado" }, { status: 410 })
    }

    const { data: packageRows, error: packageError } = await supabaseAdmin
      .from("delivery_packages")
      .select("id, package_number, total_packages")
      .eq("qr_id", qr.id)
      .order("package_number", { ascending: true })

    if (packageError) {
      return NextResponse.json({ error: packageError.message }, { status: 500 })
    }

    const packages = packageRows || []
    const totalPackages = packages.length || 1
    const acceptedSet = new Set<number>(
      body.acceptanceMode === "total"
        ? packages.map((pkg) => pkg.package_number)
        : body.acceptedPackageNumbers
    )

    if (body.acceptanceMode === "parcial" && acceptedSet.size === 0) {
      return NextResponse.json(
        { error: "Para aceptación parcial debes confirmar al menos un bulto" },
        { status: 400 }
      )
    }

    if (body.incidentEnabled) {
      if (
        !body.incidentInvoiceNumber ||
        !body.incidentProductReference ||
        !body.incidentDefectiveQuantity ||
        body.incidentDefectiveQuantity <= 0
      ) {
        return NextResponse.json(
          {
            error:
              "Para registrar incidencia debes incluir número de factura, referencia de producto y cantidad defectuosa",
          },
          { status: 400 }
        )
      }

      if (!body.incidentGuideFile || body.incidentEvidenceFiles.length === 0) {
        return NextResponse.json(
          {
            error:
              "Para registrar incidencia son obligatorios evidencia fotográfica y foto de la guía",
          },
          { status: 400 }
        )
      }
    }

    let result: "confirmado" | "confirmado_con_incidente" | "rechazado" | "parcial" = "confirmado"
    if (body.acceptanceMode === "rechazado") {
      result = "rechazado"
    } else if (body.incidentEnabled) {
      result = "confirmado_con_incidente"
    } else if (body.acceptanceMode === "parcial" || acceptedSet.size < totalPackages) {
      result = "parcial"
    }

    const legalClause = body.legalClauseText || buildLegalClause(qr.order_id)

    const { data: confirmation, error: confirmationError } = await supabaseAdmin
      .from("delivery_confirmations")
      .insert({
        qr_id: qr.id,
        session_id: session.id,
        otp_challenge_id: session.challenge_id,
        order_id: qr.order_id,
        result,
        accepted_packages_count: acceptedSet.size,
        total_packages: totalPackages,
        digital_signature: body.signatureData,
        signature_name: body.signatureName || null,
        signature_type: "drawn",
        legal_clause_text: legalClause,
        legal_clause_accepted_at: now.toISOString(),
        legal_clause_ip: context.ip,
        legal_clause_device: body.deviceId || context.userAgent || null,
        client_geo_lat: body.geoLat,
        client_geo_lng: body.geoLng,
        client_geo_accuracy: body.geoAccuracy,
        confirmed_at: now.toISOString(),
        metadata: {
          acceptance_mode: body.acceptanceMode,
          partial_reason: body.partialReason,
          offline_hash: body.offlineHash,
          offline_timestamp: body.offlineTimestamp,
        },
      })
      .select("id")
      .single()

    if (confirmationError || !confirmation) {
      return NextResponse.json(
        { error: confirmationError?.message || "No se pudo registrar la confirmación" },
        { status: 500 }
      )
    }

    const packageConfirmationRows = (packages.length ? packages : [{ id: null, package_number: 1 }]).map(
      (pkg) => ({
        confirmation_id: confirmation.id,
        package_id: pkg.id,
        package_number: pkg.package_number,
        accepted: acceptedSet.has(pkg.package_number),
        rejection_reason: acceptedSet.has(pkg.package_number)
          ? null
          : body.partialReason || (body.acceptanceMode === "rechazado" ? "Entrega rechazada por cliente" : null),
      })
    )

    const { error: packageConfirmationError } = await supabaseAdmin
      .from("delivery_confirmation_packages")
      .insert(packageConfirmationRows)

    if (packageConfirmationError) {
      return NextResponse.json({ error: packageConfirmationError.message }, { status: 500 })
    }

    let pqrsTicket: { id: string; ticket_number: string } | null = null
    let incidentId: string | null = null

    if (body.incidentEnabled && body.incidentGuideFile && body.incidentDefectiveQuantity && body.incidentInvoiceNumber && body.incidentProductReference) {
      const claim = await createDeliveryClaimTicket(supabaseAdmin, {
        orderId: qr.order_id,
        warehouseId: qr.warehouse_id,
        transporterId: qr.transporter_id,
        invoiceNumber: body.incidentInvoiceNumber,
        productReference: body.incidentProductReference,
        defectiveQuantity: body.incidentDefectiveQuantity,
        description: body.incidentDescription,
        claimantName: body.claimantName,
        claimantContact: body.claimantContact,
        evidenceFiles: body.incidentEvidenceFiles,
        guideFile: body.incidentGuideFile,
      })

      pqrsTicket = {
        id: claim.ticket.id,
        ticket_number: claim.ticket.ticket_number,
      }

      const { data: incident, error: incidentError } = await supabaseAdmin
        .from("delivery_incidents")
        .insert({
          qr_id: qr.id,
          confirmation_id: confirmation.id,
          order_id: qr.order_id,
          invoice_number: body.incidentInvoiceNumber,
          product_reference: body.incidentProductReference,
          defective_quantity: body.incidentDefectiveQuantity,
          description: body.incidentDescription,
          evidence_photo_paths: claim.evidencePaths,
          guide_photo_path: claim.guidePath,
          pqrs_ticket_id: claim.ticket.id,
          warehouse_id: qr.warehouse_id,
          transporter_id: qr.transporter_id,
          status: "abierto",
          metadata: {
            claimant_name: body.claimantName,
            claimant_contact: body.claimantContact,
          },
        })
        .select("id")
        .single()

      if (incidentError) {
        return NextResponse.json({ error: incidentError.message }, { status: 500 })
      }

      incidentId = incident?.id || null
    }

    const evidencePdf = createDeliveryEvidencePdf({
      title: `Acta de Confirmación de Entrega - Pedido ${qr.order_id}`,
      lines: [
        `Fecha: ${now.toISOString()}`,
        `Pedido: ${qr.order_id}`,
        `Bodega: ${qr.warehouse_id}`,
        `Lote de reparto: ${qr.delivery_batch_id}`,
        `Resultado: ${result}`,
        `Bultos aceptados: ${acceptedSet.size}/${totalPackages}`,
        `IP validación: ${context.ip || "N/A"}`,
        `Geolocalización: ${body.geoLat}, ${body.geoLng} (±${body.geoAccuracy || 0}m)`,
        `Firma digital: ${body.signatureName || "Firma capturada"}`,
        `Cláusula legal aceptada:`,
        legalClause,
        pqrsTicket ? `Ticket de reclamación generado: ${pqrsTicket.ticket_number}` : "Sin reclamación",
      ],
    })

    const evidenceChecksum = createHash("sha256").update(evidencePdf).digest("hex")
    const bucketName = await ensureDeliveryEvidenceBucket(supabaseAdmin)
    const evidencePath = `${qr.id}/${confirmation.id}/evidencia-${Date.now()}.pdf`

    const uploadResult = await supabaseAdmin.storage.from(bucketName).upload(evidencePath, evidencePdf, {
      contentType: "application/pdf",
      upsert: true,
    })

    if (uploadResult.error) {
      return NextResponse.json({ error: uploadResult.error.message }, { status: 500 })
    }

    await supabaseAdmin
      .from("delivery_confirmations")
      .update({
        evidence_pdf_path: evidencePath,
        evidence_pdf_checksum: evidenceChecksum,
      })
      .eq("id", confirmation.id)

    const qrStatus =
      result === "confirmado"
        ? "confirmado"
        : result === "rechazado"
          ? "rechazado"
          : "confirmado_con_incidente"

    await supabaseAdmin
      .from("delivery_qr_tokens")
      .update({
        status: qrStatus,
        confirmed_at: now.toISOString(),
        revoked_at: now.toISOString(),
        offline_delivery_hash: body.offlineHash,
        updated_at: now.toISOString(),
      })
      .eq("id", qr.id)

    await supabaseAdmin
      .from("delivery_validation_sessions")
      .update({
        consumed_at: now.toISOString(),
      })
      .eq("id", session.id)

    if (body.offlineHash && body.offlineTimestamp && body.deviceId) {
      await supabaseAdmin.from("delivery_offline_events").upsert(
        {
          qr_id: qr.id,
          order_id: qr.order_id,
          device_id: body.deviceId,
          event_type: "confirmacion",
          event_payload: {
            confirmation_id: confirmation.id,
            session_id: session.id,
            accepted_packages: [...acceptedSet],
            result,
            timestamp: body.offlineTimestamp,
          },
          offline_hash: body.offlineHash,
          sync_status: "synced",
          synced_at: now.toISOString(),
          server_validation_message: "accepted",
        },
        { onConflict: "offline_hash" }
      )
    }

    await writeDeliveryAuditLog(supabaseAdmin, {
      entity_type: "confirmation",
      entity_id: confirmation.id,
      action: "delivery_confirmed",
      actor_type: "customer",
      request_id: context.requestId,
      ip_address: context.ip,
      device_info: context.userAgent,
      metadata: {
        qr_id: qr.id,
        order_id: qr.order_id,
        result,
        incident_id: incidentId,
        pqrs_ticket_id: pqrsTicket?.id || null,
      },
    })

    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://www.mesanova.co"
    return NextResponse.json({
      confirmation_id: confirmation.id,
      qr_id: qr.id,
      order_id: qr.order_id,
      result,
      pqrs_ticket: pqrsTicket,
      evidence_pdf_url: `${baseUrl}/api/delivery/evidence/${qr.id}?session_token=${encodeURIComponent(body.sessionToken)}`,
      admin_pqrs_url: `${baseUrl}/admin/pqrs`,
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : "No se pudo confirmar la entrega"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
