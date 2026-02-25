import { NextResponse } from "next/server"

import { writeDeliveryAuditLog } from "@/lib/delivery/audit"
import {
  DELIVERY_OTP_RATE_LIMIT_MAX_REQUESTS,
  DELIVERY_OTP_RATE_LIMIT_WINDOW_MINUTES,
  DELIVERY_OTP_TTL_MINUTES,
} from "@/lib/delivery/constants"
import { sendDeliveryOtp } from "@/lib/delivery/otp-sender"
import { getRequestContext } from "@/lib/delivery/request"
import {
  buildTokenFingerprint,
  createDeliveryNonce,
  generateOtpCode,
  hashOtpCode,
  verifyDeliveryToken,
} from "@/lib/delivery/security"
import type { DeliveryOtpChannel } from "@/lib/delivery/types"
import { createAdminClient } from "@/lib/supabase/admin"

const PHONE_REGEX = /^[+0-9][0-9\s-]{6,20}$/

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      token?: string
      channel?: DeliveryOtpChannel
      destination?: string
      device?: string
      geo_lat?: number
      geo_lng?: number
    }

    const token = String(body.token || "").trim()
    const channel = body.channel
    const destination = String(body.destination || "").trim()
    const device = typeof body.device === "string" ? body.device.trim() : ""

    if (!token || !channel || !destination) {
      return NextResponse.json(
        { error: "token, channel y destination son obligatorios" },
        { status: 400 }
      )
    }

    if (!["sms", "whatsapp"].includes(channel)) {
      return NextResponse.json({ error: "Canal OTP inválido" }, { status: 400 })
    }

    if (!PHONE_REGEX.test(destination)) {
      return NextResponse.json(
        { error: "Destino inválido. Usa formato internacional de teléfono." },
        { status: 400 }
      )
    }

    const payload = verifyDeliveryToken(token)
    const tokenFingerprint = buildTokenFingerprint(token)
    const supabaseAdmin = createAdminClient()
    const context = await getRequestContext()

    const { data: qr, error: qrError } = await supabaseAdmin
      .from("delivery_qr_tokens")
      .select("id, order_id, status, expires_at, token_fingerprint")
      .eq("id", payload.jti)
      .single()

    if (qrError || !qr || qr.token_fingerprint !== tokenFingerprint) {
      return NextResponse.json({ error: "QR inválido" }, { status: 404 })
    }

    if (["confirmado", "confirmado_con_incidente", "rechazado"].includes(qr.status)) {
      return NextResponse.json({ error: "Este QR ya no permite validación OTP" }, { status: 409 })
    }

    const now = new Date()
    if (new Date(qr.expires_at).getTime() <= now.getTime()) {
      await supabaseAdmin
        .from("delivery_qr_tokens")
        .update({ status: "expirado", updated_at: now.toISOString() })
        .eq("id", qr.id)
      return NextResponse.json({ error: "QR expirado" }, { status: 410 })
    }

    const limitFrom = new Date(now.getTime() - DELIVERY_OTP_RATE_LIMIT_WINDOW_MINUTES * 60 * 1000)
    const { count } = await supabaseAdmin
      .from("delivery_otp_challenges")
      .select("id", { count: "exact", head: true })
      .eq("qr_id", qr.id)
      .eq("destination", destination)
      .gte("requested_at", limitFrom.toISOString())

    if ((count || 0) >= DELIVERY_OTP_RATE_LIMIT_MAX_REQUESTS) {
      return NextResponse.json(
        {
          error: `Demasiados intentos OTP. Espera ${DELIVERY_OTP_RATE_LIMIT_WINDOW_MINUTES} minutos antes de reintentar.`,
        },
        { status: 429 }
      )
    }

    const otpCode = generateOtpCode()
    const otpHash = hashOtpCode(otpCode)
    const expiresAt = new Date(now.getTime() + DELIVERY_OTP_TTL_MINUTES * 60 * 1000)
    const challengeNonce = createDeliveryNonce()

    const { data: challenge, error: challengeError } = await supabaseAdmin
      .from("delivery_otp_challenges")
      .insert({
        qr_id: qr.id,
        challenge_nonce: challengeNonce,
        channel,
        destination,
        otp_hash: otpHash.hash,
        otp_salt: otpHash.salt,
        requested_ip: context.ip,
        requested_user_agent: context.userAgent,
        requested_device: device || null,
        requested_geo_lat: Number.isFinite(Number(body.geo_lat)) ? Number(body.geo_lat) : null,
        requested_geo_lng: Number.isFinite(Number(body.geo_lng)) ? Number(body.geo_lng) : null,
        requested_at: now.toISOString(),
        expires_at: expiresAt.toISOString(),
      })
      .select("id")
      .single()

    if (challengeError || !challenge) {
      return NextResponse.json({ error: challengeError?.message || "No se pudo crear OTP" }, { status: 500 })
    }

    try {
      await sendDeliveryOtp({
        channel,
        destination,
        otpCode,
        orderId: qr.order_id,
      })
    } catch (sendError) {
      await supabaseAdmin.from("delivery_otp_challenges").delete().eq("id", challenge.id)
      throw sendError
    }

    await writeDeliveryAuditLog(supabaseAdmin, {
      entity_type: "otp",
      entity_id: challenge.id,
      action: "otp_requested",
      actor_type: "customer",
      request_id: context.requestId,
      ip_address: context.ip,
      device_info: context.userAgent,
      metadata: {
        qr_id: qr.id,
        channel,
        destination_masked: destination.slice(-4).padStart(destination.length, "*"),
      },
    })

    return NextResponse.json({
      challenge_id: challenge.id,
      ttl_minutes: DELIVERY_OTP_TTL_MINUTES,
      debug_otp:
        process.env.NODE_ENV !== "production" ? otpCode : undefined,
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : "No se pudo solicitar OTP"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
