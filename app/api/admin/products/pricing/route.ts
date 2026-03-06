import { NextResponse } from "next/server"

import { dispatchPendingWishlistPriceChangeWhatsApp } from "@/lib/notifications/price-change-whatsapp"
import { createAdminClient } from "@/lib/supabase/admin"
import { createClient } from "@/lib/supabase/server"

type UpdatePricingPayload = {
  productId?: string
  precio?: number
  descuento_porcentaje?: number
  precio_dist?: number | null
  desc_dist?: number
  is_on_sale?: boolean
  request_reason?: string
}

type ReviewPricingPayload = {
  requestId?: string
  action?: "approve" | "reject" | "cancel"
  review_notes?: string
}

type PricingValues = {
  precio: number
  descuento_porcentaje: number
  precio_dist: number | null
  desc_dist: number
  is_on_sale: boolean
}

function parseNumber(value: unknown, fallback = 0) {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : fallback
}

function parsePricingValues(body: UpdatePricingPayload): PricingValues {
  const precio = parseNumber(body.precio, Number.NaN)
  const descuentoPorcentaje = parseNumber(body.descuento_porcentaje, 0)
  const descDist = parseNumber(body.desc_dist, 0)
  const precioDist =
    body.precio_dist === null || body.precio_dist === undefined
      ? null
      : parseNumber(body.precio_dist, Number.NaN)

  if (!Number.isFinite(precio) || precio < 0) {
    throw new Error("Precio inválido")
  }

  if (precioDist !== null && (!Number.isFinite(precioDist) || precioDist < 0)) {
    throw new Error("Precio distribuidor inválido")
  }

  if (!Number.isFinite(descuentoPorcentaje) || descuentoPorcentaje < 0 || descuentoPorcentaje > 100) {
    throw new Error("Descuento público inválido")
  }

  if (!Number.isFinite(descDist) || descDist < 0 || descDist > 100) {
    throw new Error("Descuento distribuidor inválido")
  }

  return {
    precio,
    descuento_porcentaje: descuentoPorcentaje,
    precio_dist: precioDist,
    desc_dist: descDist,
    is_on_sale: body.is_on_sale ?? descuentoPorcentaje > 0,
  }
}

function parseStoredPricing(values: unknown): PricingValues {
  const record = (values || {}) as Record<string, unknown>
  return parsePricingValues({
    precio: parseNumber(record.precio, Number.NaN),
    descuento_porcentaje: parseNumber(record.descuento_porcentaje, 0),
    precio_dist:
      record.precio_dist === null || record.precio_dist === undefined
        ? null
        : parseNumber(record.precio_dist, Number.NaN),
    desc_dist: parseNumber(record.desc_dist, 0),
    is_on_sale: Boolean(record.is_on_sale),
  })
}

async function requireSuperadmin() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return { ok: false as const, status: 401, error: "No autenticado" }

  const { data: profile, error: profileError } = await supabase
    .from("user_profiles")
    .select("role")
    .eq("id", user.id)
    .single()

  if (profileError) return { ok: false as const, status: 500, error: profileError.message }
  if (profile?.role !== "superadmin") return { ok: false as const, status: 403, error: "No autorizado" }

  return { ok: true as const, userId: user.id }
}

export async function GET(request: Request) {
  const auth = await requireSuperadmin()
  if (!auth.ok) {
    return NextResponse.json({ success: false, error: auth.error }, { status: auth.status })
  }

  const admin = createAdminClient()
  const { searchParams } = new URL(request.url)
  const status = String(searchParams.get("status") || "pending").trim().toLowerCase()
  const productId = String(searchParams.get("productId") || "").trim()
  const requestedLimit = Number(searchParams.get("limit") || 100)
  const limit = Number.isFinite(requestedLimit) ? Math.max(1, Math.min(300, Math.trunc(requestedLimit))) : 100

  let query = admin
    .from("product_price_adjustment_requests")
    .select(
      "id, product_id, requested_by, approved_by, status, request_reason, review_notes, previous_values, requested_values, reviewed_at, applied_at, created_at, updated_at"
    )
    .order("created_at", { ascending: false })
    .limit(limit)

  if (status && status !== "all") {
    query = query.eq("status", status)
  }

  if (productId) {
    query = query.eq("product_id", productId)
  }

  const { data: requestRows, error: requestError } = await query

  if (requestError) {
    return NextResponse.json({ success: false, error: requestError.message }, { status: 500 })
  }

  const rows = requestRows || []
  if (rows.length === 0) {
    return NextResponse.json({ success: true, requests: [] })
  }

  const productIds = Array.from(new Set(rows.map((row) => row.product_id).filter(Boolean)))
  const profileIds = Array.from(
    new Set(rows.flatMap((row) => [row.requested_by, row.approved_by]).filter((value): value is string => !!value))
  )

  const [{ data: products, error: productsError }, { data: profiles, error: profilesError }] = await Promise.all([
    productIds.length
      ? admin
          .from("products")
          .select("id, pdt_codigo, nombre_comercial, pdt_descripcion")
          .in("id", productIds)
      : Promise.resolve({ data: [], error: null }),
    profileIds.length
      ? admin.from("user_profiles").select("id, full_name").in("id", profileIds)
      : Promise.resolve({ data: [], error: null }),
  ])

  if (productsError || profilesError) {
    return NextResponse.json(
      {
        success: false,
        error: productsError?.message || profilesError?.message || "No se pudo hidratar solicitudes",
      },
      { status: 500 }
    )
  }

  const productMap = new Map((products || []).map((product) => [product.id, product]))
  const profileMap = new Map((profiles || []).map((profile) => [profile.id, profile]))

  const requests = rows.map((row) => {
    const product = productMap.get(row.product_id)
    return {
      ...row,
      product_code: product?.pdt_codigo || null,
      product_name: product?.nombre_comercial || product?.pdt_descripcion || null,
      requested_by_name: profileMap.get(row.requested_by)?.full_name || null,
      approved_by_name: row.approved_by ? profileMap.get(row.approved_by)?.full_name || null : null,
    }
  })

  return NextResponse.json({ success: true, requests })
}

export async function POST(request: Request) {
  try {
    const auth = await requireSuperadmin()
    if (!auth.ok) {
      return NextResponse.json({ success: false, error: auth.error }, { status: auth.status })
    }

    const body = (await request.json().catch(() => ({}))) as UpdatePricingPayload
    const productId = String(body.productId || "").trim()

    if (!productId) {
      return NextResponse.json({ success: false, error: "productId es obligatorio" }, { status: 400 })
    }

    const pricingValues = parsePricingValues(body)
    const requestReason = String(body.request_reason || "").trim() || null

    const admin = createAdminClient()

    const { data: existingProduct, error: existingError } = await admin
      .from("products")
      .select("id, precio, descuento_porcentaje, precio_dist, desc_dist, is_on_sale")
      .eq("id", productId)
      .single()

    if (existingError || !existingProduct) {
      return NextResponse.json(
        { success: false, error: existingError?.message || "Producto no encontrado" },
        { status: 404 }
      )
    }

    const { data: pendingExisting, error: pendingError } = await admin
      .from("product_price_adjustment_requests")
      .select("id")
      .eq("product_id", productId)
      .eq("status", "pending")
      .limit(1)
      .maybeSingle()

    if (pendingError) {
      return NextResponse.json({ success: false, error: pendingError.message }, { status: 500 })
    }

    if (pendingExisting?.id) {
      return NextResponse.json(
        {
          success: false,
          error: "Ya existe una solicitud pendiente para este producto",
          pendingRequestId: pendingExisting.id,
        },
        { status: 409 }
      )
    }

    const { data: createdRequest, error: createError } = await admin
      .from("product_price_adjustment_requests")
      .insert({
        product_id: productId,
        requested_by: auth.userId,
        status: "pending",
        request_reason: requestReason,
        previous_values: {
          precio: existingProduct.precio,
          descuento_porcentaje: existingProduct.descuento_porcentaje,
          precio_dist: existingProduct.precio_dist,
          desc_dist: existingProduct.desc_dist,
          is_on_sale: existingProduct.is_on_sale,
        },
        requested_values: pricingValues,
      })
      .select("id, product_id, requested_by, status, request_reason, previous_values, requested_values, created_at")
      .single()

    if (createError || !createdRequest) {
      return NextResponse.json(
        { success: false, error: createError?.message || "No se pudo crear la solicitud" },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      pendingApproval: true,
      request: createdRequest,
      message: "Solicitud enviada. Requiere aprobación de otro superadmin.",
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Error desconocido"
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}

export async function PATCH(request: Request) {
  try {
    const auth = await requireSuperadmin()
    if (!auth.ok) {
      return NextResponse.json({ success: false, error: auth.error }, { status: auth.status })
    }

    const body = (await request.json().catch(() => ({}))) as ReviewPricingPayload
    const requestId = String(body.requestId || "").trim()
    const action = String(body.action || "").trim().toLowerCase()
    const reviewNotes = String(body.review_notes || "").trim() || null

    if (!requestId) {
      return NextResponse.json({ success: false, error: "requestId es obligatorio" }, { status: 400 })
    }

    if (!action || !["approve", "reject", "cancel"].includes(action)) {
      return NextResponse.json({ success: false, error: "Acción inválida" }, { status: 400 })
    }

    const admin = createAdminClient()

    const { data: existingRequest, error: requestError } = await admin
      .from("product_price_adjustment_requests")
      .select("*")
      .eq("id", requestId)
      .single()

    if (requestError || !existingRequest) {
      return NextResponse.json(
        { success: false, error: requestError?.message || "Solicitud no encontrada" },
        { status: 404 }
      )
    }

    if (existingRequest.status !== "pending") {
      return NextResponse.json(
        { success: false, error: "La solicitud ya fue procesada" },
        { status: 409 }
      )
    }

    const isRequester = existingRequest.requested_by === auth.userId

    if ((action === "approve" || action === "reject") && isRequester) {
      return NextResponse.json(
        { success: false, error: "La revisión debe hacerla otro superadmin" },
        { status: 403 }
      )
    }

    if (action === "cancel" && !isRequester) {
      return NextResponse.json(
        { success: false, error: "Solo quien creó la solicitud puede cancelarla" },
        { status: 403 }
      )
    }

    if (action === "cancel") {
      const { data, error } = await admin
        .from("product_price_adjustment_requests")
        .update({
          status: "cancelled",
          review_notes: reviewNotes,
          reviewed_at: new Date().toISOString(),
        })
        .eq("id", requestId)
        .select("*")
        .single()

      if (error) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 })
      }

      return NextResponse.json({ success: true, request: data })
    }

    if (action === "reject") {
      const { data, error } = await admin
        .from("product_price_adjustment_requests")
        .update({
          status: "rejected",
          approved_by: auth.userId,
          review_notes: reviewNotes,
          reviewed_at: new Date().toISOString(),
        })
        .eq("id", requestId)
        .select("*")
        .single()

      if (error) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 })
      }

      return NextResponse.json({ success: true, request: data })
    }

    const requestedPricing = parseStoredPricing(existingRequest.requested_values)

    const { data: productBeforeUpdate, error: productBeforeError } = await admin
      .from("products")
      .select("id, precio")
      .eq("id", existingRequest.product_id)
      .single()

    if (productBeforeError || !productBeforeUpdate) {
      return NextResponse.json(
        { success: false, error: productBeforeError?.message || "Producto no encontrado" },
        { status: 404 }
      )
    }

    const oldPrice = productBeforeUpdate.precio === null ? null : Number(productBeforeUpdate.precio)

    const { data: updatedProduct, error: updateProductError } = await admin
      .from("products")
      .update({
        ...requestedPricing,
        updated_at: new Date().toISOString(),
      })
      .eq("id", existingRequest.product_id)
      .select("id, precio, descuento_porcentaje, precio_dist, desc_dist, is_on_sale")
      .single()

    if (updateProductError || !updatedProduct) {
      return NextResponse.json(
        { success: false, error: updateProductError?.message || "No se pudo actualizar el producto" },
        { status: 500 }
      )
    }

    const { data: approvedRequest, error: approveRequestError } = await admin
      .from("product_price_adjustment_requests")
      .update({
        status: "approved",
        approved_by: auth.userId,
        review_notes: reviewNotes,
        reviewed_at: new Date().toISOString(),
        applied_at: new Date().toISOString(),
      })
      .eq("id", requestId)
      .select("*")
      .single()

    if (approveRequestError || !approvedRequest) {
      return NextResponse.json(
        { success: false, error: approveRequestError?.message || "No se pudo cerrar la solicitud" },
        { status: 500 }
      )
    }

    const shouldDispatchWhatsApp =
      oldPrice !== null && Number.isFinite(oldPrice) && oldPrice !== Number(updatedProduct.precio)
    const whatsappDispatch = shouldDispatchWhatsApp
      ? await dispatchPendingWishlistPriceChangeWhatsApp({ productId: existingRequest.product_id, limit: 200 })
      : null

    return NextResponse.json({
      success: true,
      product: updatedProduct,
      request: approvedRequest,
      whatsappDispatch,
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Error desconocido"
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}
