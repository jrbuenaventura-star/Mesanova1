import { NextResponse } from "next/server"

import { sendWhatsAppMessage } from "@/lib/notifications/whatsapp"
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

type PriceNotification = {
  id: string
  user_id: string
  title: string
  message: string
}

type UserProfilePhone = {
  id: string
  full_name: string | null
  phone: string | null
}

type NotificationPreference = {
  user_id: string
  whatsapp_price_alerts: boolean | null
}

function parseNumber(value: unknown, fallback = 0) {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : fallback
}

async function dispatchWishlistPriceChangeWhatsApp(productId: string) {
  if (!process.env.DELIVERY_OTP_WEBHOOK_URL) {
    return
  }

  const admin = createAdminClient()
  const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString()

  const { data: notifications, error: notificationsError } = await admin
    .from("user_notifications")
    .select("id, user_id, title, message")
    .eq("type", "price_change")
    .eq("product_id", productId)
    .eq("whatsapp_sent", false)
    .is("whatsapp_error", null)
    .gte("created_at", fiveMinutesAgo)

  if (notificationsError || !notifications || notifications.length === 0) {
    return
  }

  const userIds = Array.from(new Set(notifications.map((notification) => notification.user_id)))

  const [profilesResult, preferencesResult] = await Promise.all([
    admin.from("user_profiles").select("id, full_name, phone").in("id", userIds),
    admin
      .from("notification_preferences")
      .select("user_id, whatsapp_price_alerts")
      .in("user_id", userIds),
  ])

  const profiles = (profilesResult.data || []) as UserProfilePhone[]
  const preferences = (preferencesResult.data || []) as NotificationPreference[]

  const profilesByUserId = new Map(profiles.map((profile) => [profile.id, profile]))
  const preferencesByUserId = new Map(preferences.map((preference) => [preference.user_id, preference]))

  for (const notification of notifications as PriceNotification[]) {
    const profile = profilesByUserId.get(notification.user_id)

    if (!profile?.phone) {
      await admin
        .from("user_notifications")
        .update({ whatsapp_error: "missing_phone" })
        .eq("id", notification.id)
      continue
    }

    const preference = preferencesByUserId.get(notification.user_id)
    if (preference?.whatsapp_price_alerts === false) {
      await admin
        .from("user_notifications")
        .update({ whatsapp_error: "disabled_by_user" })
        .eq("id", notification.id)
      continue
    }

    const message = `${notification.title}. ${notification.message}`
    const sendResult = await sendWhatsAppMessage({
      destination: profile.phone,
      message,
      context: "wishlist_price_change",
    })

    if (sendResult.ok) {
      await admin
        .from("user_notifications")
        .update({
          whatsapp_sent: true,
          whatsapp_sent_at: new Date().toISOString(),
          whatsapp_error: null,
        })
        .eq("id", notification.id)
      continue
    }

    if (sendResult.reason === "missing_webhook") {
      return
    }

    await admin
      .from("user_notifications")
      .update({ whatsapp_error: sendResult.error || sendResult.reason })
      .eq("id", notification.id)
  }
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

    if (oldPrice !== null && Number.isFinite(oldPrice) && oldPrice !== precio) {
      await dispatchWishlistPriceChangeWhatsApp(productId)
    }

    return NextResponse.json({
      success: true,
      product: updatedProduct,
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Error desconocido"
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}
