import { randomUUID } from "crypto"

import { NextResponse } from "next/server"

import { writeDeliveryAuditLog } from "@/lib/delivery/audit"
import { requireSuperadminUser } from "@/lib/delivery/admin-auth"
import { DELIVERY_QR_DEFAULT_TTL_MINUTES } from "@/lib/delivery/constants"
import { currentErpAdapter } from "@/lib/delivery/erp-adapter"
import {
  buildTokenFingerprint,
  createDeliveryNonce,
  createDeliveryToken,
} from "@/lib/delivery/security"
import type { DeliveryPackageInput } from "@/lib/delivery/types"
import { createAdminClient } from "@/lib/supabase/admin"

function parsePackages(value: unknown): DeliveryPackageInput[] {
  if (!Array.isArray(value)) {
    return []
  }

  return value
    .map((entry) => ({
      package_number: Number((entry as Record<string, unknown>).package_number),
      total_packages: Number((entry as Record<string, unknown>).total_packages),
      customer_number:
        typeof (entry as Record<string, unknown>).customer_number === "string"
          ? ((entry as Record<string, unknown>).customer_number as string)
          : undefined,
      provider_barcode:
        typeof (entry as Record<string, unknown>).provider_barcode === "string"
          ? ((entry as Record<string, unknown>).provider_barcode as string)
          : undefined,
      quantity_total: Number((entry as Record<string, unknown>).quantity_total || 0),
      sku_distribution: Array.isArray((entry as Record<string, unknown>).sku_distribution)
        ? ((entry as Record<string, unknown>).sku_distribution as DeliveryPackageInput["sku_distribution"])
        : [],
    }))
    .filter(
      (pkg) =>
        Number.isInteger(pkg.package_number) &&
        pkg.package_number > 0 &&
        Number.isInteger(pkg.total_packages) &&
        pkg.total_packages > 0
    )
}

function buildQrRef() {
  return `QR-${Date.now().toString(36).toUpperCase()}-${Math.floor(Math.random() * 10_000)
    .toString()
    .padStart(4, "0")}`
}

export async function GET(request: Request) {
  try {
    const auth = await requireSuperadminUser()
    if (!auth.ok) {
      return NextResponse.json({ error: auth.error }, { status: auth.status })
    }

    const supabaseAdmin = createAdminClient()
    const { searchParams } = new URL(request.url)
    const status = searchParams.get("status")
    const warehouseId = searchParams.get("warehouse_id")
    const from = searchParams.get("from")
    const to = searchParams.get("to")

    const nowIso = new Date().toISOString()
    await supabaseAdmin
      .from("delivery_qr_tokens")
      .update({ status: "expirado", updated_at: nowIso })
      .eq("status", "pendiente")
      .lt("expires_at", nowIso)

    let query = supabaseAdmin
      .from("delivery_qr_tokens")
      .select(
        `
          id,
          qr_code_ref,
          order_id,
          customer_id,
          warehouse_id,
          delivery_batch_id,
          transporter_id,
          status,
          issued_at,
          expires_at,
          confirmed_at,
          metadata,
          packages:delivery_packages(
            id,
            package_number,
            total_packages,
            quantity_total
          )
        `
      )
      .order("issued_at", { ascending: false })
      .limit(200)

    if (status && status !== "all") {
      query = query.eq("status", status)
    }
    if (warehouseId && warehouseId !== "all") {
      query = query.eq("warehouse_id", warehouseId)
    }
    if (from) {
      query = query.gte("issued_at", from)
    }
    if (to) {
      query = query.lte("issued_at", to)
    }

    const { data, error } = await query
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ records: data || [] })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unexpected error"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const auth = await requireSuperadminUser()
    if (!auth.ok) {
      return NextResponse.json({ error: auth.error }, { status: auth.status })
    }

    const body = (await request.json()) as Record<string, unknown>
    const orderId = String(body.order_id || "").trim()
    const warehouseId = String(body.warehouse_id || "").trim()
    const deliveryBatchId = String(body.delivery_batch_id || "").trim()
    const customerId = body.customer_id ? String(body.customer_id).trim() : null
    const transporterId = body.transporter_id ? String(body.transporter_id).trim() : null
    const expiresInMinutes = Number(body.expires_in_minutes || DELIVERY_QR_DEFAULT_TTL_MINUTES)
    const metadata =
      body.metadata && typeof body.metadata === "object" && !Array.isArray(body.metadata)
        ? (body.metadata as Record<string, unknown>)
        : {}

    if (!orderId || !warehouseId || !deliveryBatchId) {
      return NextResponse.json(
        { error: "order_id, warehouse_id y delivery_batch_id son obligatorios" },
        { status: 400 }
      )
    }

    const supabaseAdmin = createAdminClient()

    let packages = parsePackages(body.packages)
    if (packages.length === 0) {
      const snapshot = await currentErpAdapter.getOrderSnapshot(supabaseAdmin, orderId)
      if (snapshot?.packages?.length) {
        packages = snapshot.packages.map((pkg) => ({
          package_number: pkg.package_number,
          total_packages: pkg.total_packages,
          customer_number: pkg.customer_number || undefined,
          provider_barcode: pkg.provider_barcode || undefined,
          quantity_total: pkg.quantity_total,
          sku_distribution: [],
        }))
      }
    }

    if (packages.length === 0) {
      packages = [
        {
          package_number: 1,
          total_packages: 1,
          quantity_total: 0,
          sku_distribution: [],
        },
      ]
    }

    const qrId = randomUUID()
    const nonce = createDeliveryNonce()
    const now = new Date()
    const exp = new Date(now.getTime() + Math.max(15, expiresInMinutes) * 60 * 1000)
    const iatEpoch = Math.floor(now.getTime() / 1000)
    const expEpoch = Math.floor(exp.getTime() / 1000)

    const signedToken = createDeliveryToken({
      typ: "delivery_qr",
      jti: qrId,
      order_id: orderId,
      warehouse_id: warehouseId,
      delivery_batch_id: deliveryBatchId,
      nonce,
      iat: iatEpoch,
      exp: expEpoch,
    })

    const tokenFingerprint = buildTokenFingerprint(signedToken)
    const qrCodeRef = buildQrRef()

    const { error: qrError } = await supabaseAdmin.from("delivery_qr_tokens").insert({
      id: qrId,
      qr_code_ref: qrCodeRef,
      signed_token: signedToken,
      token_fingerprint: tokenFingerprint,
      nonce,
      order_id: orderId,
      customer_id: customerId,
      warehouse_id: warehouseId,
      delivery_batch_id: deliveryBatchId,
      transporter_id: transporterId,
      status: "pendiente",
      issued_at: now.toISOString(),
      expires_at: exp.toISOString(),
      metadata,
    })

    if (qrError) {
      return NextResponse.json({ error: qrError.message }, { status: 500 })
    }

    const packageRows = packages.map((pkg) => ({
      qr_id: qrId,
      package_number: pkg.package_number,
      total_packages: pkg.total_packages,
      customer_number: pkg.customer_number || null,
      provider_barcode: pkg.provider_barcode || null,
      quantity_total: Number(pkg.quantity_total || 0),
      sku_distribution: pkg.sku_distribution || [],
      metadata: {},
    }))

    const { error: packagesError } = await supabaseAdmin.from("delivery_packages").insert(packageRows)
    if (packagesError) {
      await supabaseAdmin.from("delivery_qr_tokens").delete().eq("id", qrId)
      return NextResponse.json({ error: packagesError.message }, { status: 500 })
    }

    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://www.mesanova.co"
    const deliveryUrl = `${baseUrl}/entrega/${encodeURIComponent(signedToken)}`

    await writeDeliveryAuditLog(supabaseAdmin, {
      entity_type: "qr",
      entity_id: qrId,
      action: "qr_created",
      actor_type: "admin",
      actor_id: auth.userId,
      metadata: {
        order_id: orderId,
        warehouse_id: warehouseId,
        delivery_batch_id: deliveryBatchId,
        total_packages: packageRows.length,
      },
    })

    return NextResponse.json({
      qr_id: qrId,
      qr_code_ref: qrCodeRef,
      order_id: orderId,
      warehouse_id: warehouseId,
      delivery_batch_id: deliveryBatchId,
      expires_at: exp.toISOString(),
      signed_token: signedToken,
      delivery_url: deliveryUrl,
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unexpected error"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
