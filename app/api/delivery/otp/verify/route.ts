import { NextResponse } from "next/server"

import { writeDeliveryAuditLog } from "@/lib/delivery/audit"
import { DELIVERY_SESSION_TTL_MINUTES } from "@/lib/delivery/constants"
import { buildPublicOrderViewForQr } from "@/lib/delivery/orders"
import { getRequestContext } from "@/lib/delivery/request"
import {
  buildDeviceFingerprint,
  buildTokenFingerprint,
  createSessionToken,
  hashSessionToken,
  verifyDeliveryToken,
  verifyOtpCode,
} from "@/lib/delivery/security"
import { createAdminClient } from "@/lib/supabase/admin"

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      token?: string
      challenge_id?: string
      otp_code?: string
      device?: string
      geo_lat?: number
      geo_lng?: number
      geo_accuracy?: number
    }

    const token = String(body.token || "").trim()
    const challengeId = String(body.challenge_id || "").trim()
    const otpCode = String(body.otp_code || "").trim()
    const device = typeof body.device === "string" ? body.device.trim() : ""

    if (!token || !challengeId || !otpCode) {
      return NextResponse.json(
        { error: "token, challenge_id y otp_code son obligatorios" },
        { status: 400 }
      )
    }

    const payload = verifyDeliveryToken(token)
    const tokenFingerprint = buildTokenFingerprint(token)
    const supabaseAdmin = createAdminClient()
    const context = await getRequestContext()

    const { data: qr, error: qrError } = await supabaseAdmin
      .from("delivery_qr_tokens")
      .select("id, order_id, warehouse_id, status, token_fingerprint, expires_at")
      .eq("id", payload.jti)
      .single()

    if (qrError || !qr || qr.token_fingerprint !== tokenFingerprint) {
      return NextResponse.json({ error: "QR inválido" }, { status: 404 })
    }

    if (["confirmado", "confirmado_con_incidente", "rechazado"].includes(qr.status)) {
      return NextResponse.json({ error: "Este QR ya fue procesado" }, { status: 409 })
    }

    const now = new Date()
    if (new Date(qr.expires_at).getTime() <= now.getTime()) {
      await supabaseAdmin
        .from("delivery_qr_tokens")
        .update({ status: "expirado", updated_at: now.toISOString() })
        .eq("id", qr.id)
      return NextResponse.json({ error: "QR expirado" }, { status: 410 })
    }

    const { data: challenge, error: challengeError } = await supabaseAdmin
      .from("delivery_otp_challenges")
      .select("id, qr_id, otp_hash, otp_salt, attempts, max_attempts, verified_at, expires_at")
      .eq("id", challengeId)
      .eq("qr_id", qr.id)
      .single()

    if (challengeError || !challenge) {
      return NextResponse.json({ error: "Challenge OTP inválido" }, { status: 404 })
    }

    if (challenge.verified_at) {
      return NextResponse.json({ error: "OTP ya utilizado" }, { status: 409 })
    }

    if (challenge.attempts >= challenge.max_attempts) {
      return NextResponse.json({ error: "OTP bloqueado por exceso de intentos" }, { status: 429 })
    }

    if (new Date(challenge.expires_at).getTime() <= now.getTime()) {
      return NextResponse.json({ error: "OTP expirado" }, { status: 410 })
    }

    const isValid = verifyOtpCode(otpCode, challenge.otp_salt, challenge.otp_hash)
    if (!isValid) {
      await supabaseAdmin
        .from("delivery_otp_challenges")
        .update({ attempts: challenge.attempts + 1 })
        .eq("id", challenge.id)

      await writeDeliveryAuditLog(supabaseAdmin, {
        entity_type: "otp",
        entity_id: challenge.id,
        action: "otp_invalid_attempt",
        actor_type: "customer",
        request_id: context.requestId,
        ip_address: context.ip,
        device_info: context.userAgent,
      })

      return NextResponse.json({ error: "OTP incorrecto" }, { status: 401 })
    }

    await supabaseAdmin
      .from("delivery_otp_challenges")
      .update({
        verified_at: now.toISOString(),
        attempts: challenge.attempts + 1,
      })
      .eq("id", challenge.id)

    const sessionToken = createSessionToken()
    const sessionTokenHash = hashSessionToken(sessionToken)
    const sessionExpires = new Date(now.getTime() + DELIVERY_SESSION_TTL_MINUTES * 60 * 1000)
    const deviceFingerprint = buildDeviceFingerprint({
      ip: context.ip,
      userAgent: context.userAgent,
      device,
    })

    const { data: session, error: sessionError } = await supabaseAdmin
      .from("delivery_validation_sessions")
      .insert({
        qr_id: qr.id,
        challenge_id: challenge.id,
        session_token_hash: sessionTokenHash,
        otp_verified: true,
        validation_ip: context.ip,
        validation_geo_lat: Number.isFinite(Number(body.geo_lat)) ? Number(body.geo_lat) : null,
        validation_geo_lng: Number.isFinite(Number(body.geo_lng)) ? Number(body.geo_lng) : null,
        validation_geo_accuracy: Number.isFinite(Number(body.geo_accuracy))
          ? Number(body.geo_accuracy)
          : null,
        validation_device: device || deviceFingerprint,
        validation_user_agent: context.userAgent,
        opened_at: now.toISOString(),
        expires_at: sessionExpires.toISOString(),
        metadata: {
          device_fingerprint: deviceFingerprint,
        },
      })
      .select("id, expires_at")
      .single()

    if (sessionError || !session) {
      return NextResponse.json({ error: sessionError?.message || "No se pudo abrir sesión" }, { status: 500 })
    }

    const orderView = await buildPublicOrderViewForQr(supabaseAdmin, {
      id: qr.id,
      order_id: qr.order_id,
      warehouse_id: qr.warehouse_id,
      status: qr.status,
    })

    if (!orderView) {
      return NextResponse.json(
        { error: "No se pudo cargar la información del pedido para confirmar entrega" },
        { status: 404 }
      )
    }

    await writeDeliveryAuditLog(supabaseAdmin, {
      entity_type: "session",
      entity_id: session.id,
      action: "otp_verified_session_opened",
      actor_type: "customer",
      request_id: context.requestId,
      ip_address: context.ip,
      device_info: context.userAgent,
      metadata: {
        qr_id: qr.id,
      },
    })

    return NextResponse.json({
      session_id: session.id,
      session_token: sessionToken,
      expires_at: session.expires_at,
      order: orderView,
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : "No se pudo verificar OTP"
    return NextResponse.json({ error: message }, { status: 400 })
  }
}
