#!/usr/bin/env node

import { createHash, createHmac, randomBytes, randomUUID } from "node:crypto"
import process from "node:process"

import { createClient } from "@supabase/supabase-js"

function getEnv(name) {
  const value = process.env[name]
  if (!value) {
    throw new Error(`Missing required env var: ${name}`)
  }
  return value
}

function base64UrlEncode(value) {
  return Buffer.from(value)
    .toString("base64")
    .replace(/=/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
}

function createDeliveryToken(payload, secret) {
  const header = {
    alg: "HS256",
    typ: "JWT",
  }
  const encodedHeader = base64UrlEncode(JSON.stringify(header))
  const encodedPayload = base64UrlEncode(JSON.stringify(payload))
  const content = `${encodedHeader}.${encodedPayload}`
  const signature = base64UrlEncode(createHmac("sha256", secret).update(content).digest())
  return `${content}.${signature}`
}

function buildTokenFingerprint(token) {
  return createHash("sha256").update(token).digest("hex")
}

async function requestJson(url, init) {
  const response = await fetch(url, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers || {}),
    },
  })

  const text = await response.text()
  let body
  try {
    body = text ? JSON.parse(text) : {}
  } catch {
    body = { raw: text }
  }

  if (!response.ok) {
    throw new Error(`HTTP ${response.status} ${url} -> ${JSON.stringify(body)}`)
  }

  return body
}

function logStep(message) {
  process.stdout.write(`[delivery-e2e] ${message}\n`)
}

async function main() {
  const baseUrl = process.env.DELIVERY_E2E_BASE_URL || "http://127.0.0.1:3001"
  const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl) throw new Error("Missing SUPABASE_URL or NEXT_PUBLIC_SUPABASE_URL")
  if (!serviceRoleKey) throw new Error("Missing SUPABASE_SERVICE_ROLE_KEY")

  const deliverySecret = getEnv("DELIVERY_QR_SECRET")
  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })

  const now = new Date()
  const nowEpoch = Math.floor(now.getTime() / 1000)
  const orderId = `E2E-DELIVERY-${Date.now()}`
  const qrId = randomUUID()
  const warehouseId = "wh-e2e"
  const deliveryBatchId = `batch-${Date.now()}`
  const nonce = randomBytes(16).toString("hex")
  const exp = nowEpoch + 60 * 60

  const tokenPayload = {
    typ: "delivery_qr",
    jti: qrId,
    nonce,
    order_id: orderId,
    warehouse_id: warehouseId,
    delivery_batch_id: deliveryBatchId,
    exp,
  }

  const signedToken = createDeliveryToken(tokenPayload, deliverySecret)
  const tokenFingerprint = buildTokenFingerprint(signedToken)

  const cleanup = async () => {
    await supabase.from("delivery_confirmations").delete().eq("qr_id", qrId)
    await supabase.from("delivery_validation_sessions").delete().eq("qr_id", qrId)
    await supabase.from("delivery_otp_challenges").delete().eq("qr_id", qrId)
    await supabase.from("delivery_packages").delete().eq("qr_id", qrId)
    await supabase.from("delivery_offline_events").delete().eq("order_id", orderId)
    await supabase.from("delivery_qr_tokens").delete().eq("id", qrId)
    await supabase.from("delivery_erp_order_snapshots").delete().eq("order_id", orderId)
  }

  try {
    logStep("seeding snapshot + qr token")

    const { error: snapshotError } = await supabase.from("delivery_erp_order_snapshots").upsert(
      {
        order_id: orderId,
        source_system: "e2e",
        order_number: orderId,
        customer_name: "Cliente E2E",
        shipping_address: "Calle 123",
        shipping_city: "Bogota",
        warehouse_id: warehouseId,
        warehouse_name: "Bodega E2E",
        status: "out_for_delivery",
        items: [
          {
            sku: "SKU-E2E-1",
            name: "Producto E2E",
            quantity_total: 1,
            package_distribution: [{ package_number: 1, quantity: 1 }],
          },
        ],
        packages: [
          {
            package_number: 1,
            total_packages: 1,
            customer_number: "CUST-1",
            provider_barcode: "BAR-E2E-1",
            quantity_total: 1,
          },
        ],
        raw_payload: { source: "delivery-e2e-script" },
        last_synced_at: now.toISOString(),
        updated_at: now.toISOString(),
      },
      { onConflict: "order_id" }
    )

    if (snapshotError) {
      throw new Error(`Snapshot seed failed: ${snapshotError.message}`)
    }

    const { error: qrError } = await supabase.from("delivery_qr_tokens").insert({
      id: qrId,
      qr_code_ref: `QR-E2E-${Date.now()}`,
      signed_token: signedToken,
      token_fingerprint: tokenFingerprint,
      nonce,
      order_id: orderId,
      warehouse_id: warehouseId,
      delivery_batch_id: deliveryBatchId,
      status: "pendiente",
      issued_at: now.toISOString(),
      expires_at: new Date(exp * 1000).toISOString(),
      metadata: { source: "delivery-e2e-script" },
    })

    if (qrError) {
      throw new Error(`QR seed failed: ${qrError.message}`)
    }

    const { error: packageError } = await supabase.from("delivery_packages").insert({
      qr_id: qrId,
      package_number: 1,
      total_packages: 1,
      customer_number: "CUST-1",
      provider_barcode: "BAR-E2E-1",
      quantity_total: 1,
      sku_distribution: [{ sku: "SKU-E2E-1", quantity: 1 }],
    })

    if (packageError) {
      throw new Error(`Package seed failed: ${packageError.message}`)
    }

    logStep("calling /api/delivery/scan")
    const scanBody = await requestJson(`${baseUrl}/api/delivery/scan`, {
      method: "POST",
      body: JSON.stringify({ token: signedToken }),
    })

    if (scanBody?.qr_id !== qrId || scanBody?.requires_otp !== true) {
      throw new Error(`Unexpected scan response: ${JSON.stringify(scanBody)}`)
    }

    logStep("calling /api/delivery/otp/request")
    const otpRequestBody = await requestJson(`${baseUrl}/api/delivery/otp/request`, {
      method: "POST",
      body: JSON.stringify({
        token: signedToken,
        channel: "sms",
        destination: "+573001234567",
        device: "device-e2e",
        geo_lat: 4.711,
        geo_lng: -74.0721,
      }),
    })

    if (!otpRequestBody?.challenge_id || !otpRequestBody?.debug_otp) {
      throw new Error(
        `OTP request response missing challenge_id/debug_otp: ${JSON.stringify(otpRequestBody)}`
      )
    }

    logStep("calling /api/delivery/otp/verify")
    const otpVerifyBody = await requestJson(`${baseUrl}/api/delivery/otp/verify`, {
      method: "POST",
      body: JSON.stringify({
        token: signedToken,
        challenge_id: otpRequestBody.challenge_id,
        otp_code: otpRequestBody.debug_otp,
        device: "device-e2e",
        geo_lat: 4.711,
        geo_lng: -74.0721,
        geo_accuracy: 8,
      }),
    })

    if (!otpVerifyBody?.session_token || !otpVerifyBody?.session_id || !otpVerifyBody?.order) {
      throw new Error(`Unexpected otp/verify response: ${JSON.stringify(otpVerifyBody)}`)
    }

    const sessionToken = otpVerifyBody.session_token

    logStep("calling /api/delivery/confirm")
    const confirmBody = await requestJson(`${baseUrl}/api/delivery/confirm`, {
      method: "POST",
      body: JSON.stringify({
        session_token: sessionToken,
        acceptance_mode: "total",
        accepted_package_numbers: [1],
        signature_data: "data:image/png;base64,e2e-signature",
        signature_name: "Cliente E2E",
        legal_clause_text: "Acepto la entrega para pruebas E2E.",
        legal_accepted: true,
        geo_lat: 4.711,
        geo_lng: -74.0721,
        geo_accuracy: 8,
        device_id: "device-e2e",
      }),
    })

    if (!confirmBody?.confirmation_id || confirmBody?.result !== "confirmado") {
      throw new Error(`Unexpected confirm response: ${JSON.stringify(confirmBody)}`)
    }

    logStep("calling /api/delivery/evidence/[qrId]")
    const evidenceResponse = await fetch(
      `${baseUrl}/api/delivery/evidence/${encodeURIComponent(qrId)}?session_token=${encodeURIComponent(sessionToken)}`
    )

    if (!evidenceResponse.ok) {
      const errorBody = await evidenceResponse.text()
      throw new Error(`Evidence download failed: HTTP ${evidenceResponse.status} ${errorBody}`)
    }

    const contentType = evidenceResponse.headers.get("content-type") || ""
    if (!contentType.includes("application/pdf")) {
      throw new Error(`Evidence content-type is not PDF: ${contentType}`)
    }

    const bytes = await evidenceResponse.arrayBuffer()
    if (!bytes || bytes.byteLength === 0) {
      throw new Error("Evidence PDF is empty")
    }

    logStep(`success -> confirmation_id=${confirmBody.confirmation_id} pdf_bytes=${bytes.byteLength}`)
  } finally {
    await cleanup()
  }
}

main().catch((error) => {
  process.stderr.write(`[delivery-e2e] FAILED ${error instanceof Error ? error.message : String(error)}\n`)
  process.exit(1)
})
