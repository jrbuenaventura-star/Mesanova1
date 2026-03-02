import { NextResponse } from "next/server"

import { dispatchPendingWishlistPriceChangeWhatsApp } from "@/lib/notifications/price-change-whatsapp"
import { createAdminClient } from "@/lib/supabase/admin"
import { createClient } from "@/lib/supabase/server"

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

type UpdatePricingPayload = {
  productId?: string
  precio?: number
  descuento_porcentaje?: number
  precio_dist?: number | null
  desc_dist?: number
  is_on_sale?: boolean
}

function parseNumber(value: unknown, fallback = 0) {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : fallback
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

    const precio = parseNumber(body.precio, NaN)
    const descuentoPorcentaje = parseNumber(body.descuento_porcentaje, 0)
    const descDist = parseNumber(body.desc_dist, 0)
    const precioDist = body.precio_dist === null || body.precio_dist === undefined
      ? null
      : parseNumber(body.precio_dist, NaN)

    if (!Number.isFinite(precio) || precio < 0) {
      return NextResponse.json({ success: false, error: "Precio inválido" }, { status: 400 })
    }

    if (precioDist !== null && (!Number.isFinite(precioDist) || precioDist < 0)) {
      return NextResponse.json({ success: false, error: "Precio distribuidor inválido" }, { status: 400 })
    }

    const admin = createAdminClient()

    const { data: existingProduct, error: existingError } = await admin
      .from("products")
      .select("id, precio")
      .eq("id", productId)
      .single()

    if (existingError || !existingProduct) {
      return NextResponse.json({ success: false, error: existingError?.message || "Producto no encontrado" }, { status: 404 })
    }

    const oldPrice = existingProduct.precio === null ? null : Number(existingProduct.precio)

    const { data: updatedProduct, error: updateError } = await admin
      .from("products")
      .update({
        precio,
        descuento_porcentaje: descuentoPorcentaje,
        precio_dist: precioDist,
        desc_dist: descDist,
        is_on_sale: body.is_on_sale ?? descuentoPorcentaje > 0,
        updated_at: new Date().toISOString(),
      })
      .eq("id", productId)
      .select("id, precio, descuento_porcentaje, precio_dist, desc_dist, is_on_sale")
      .single()

    if (updateError || !updatedProduct) {
      return NextResponse.json({ success: false, error: updateError?.message || "No se pudo actualizar el producto" }, { status: 500 })
    }

    const shouldDispatchWhatsApp = oldPrice !== null && Number.isFinite(oldPrice) && oldPrice !== precio
    const whatsappDispatch = shouldDispatchWhatsApp
      ? await dispatchPendingWishlistPriceChangeWhatsApp({ productId, limit: 200 })
      : null

    return NextResponse.json({
      success: true,
      product: updatedProduct,
      whatsappDispatch,
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Error desconocido"
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}
