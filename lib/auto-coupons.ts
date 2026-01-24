import { createClient } from "@/lib/supabase/client"

/**
 * Sistema de cupones automáticos
 * Genera cupones personalizados basados en eventos del usuario
 */

interface AutoCouponConfig {
  code: string
  name: string
  description: string
  discountType: "percentage" | "fixed_amount" | "free_shipping"
  discountValue: number
  validDays: number
  maxUsesPerUser?: number
}

const AUTO_COUPON_CONFIGS = {
  firstPurchase: {
    code: "PRIMERACOMPRA10",
    name: "Primera Compra - 10% Descuento",
    description: "Descuento especial para tu primera compra",
    discountType: "percentage" as const,
    discountValue: 10,
    validDays: 30,
    maxUsesPerUser: 1,
  },
  birthday: {
    name: "Feliz Cumpleaños",
    description: "Regalo especial de cumpleaños",
    discountType: "percentage" as const,
    discountValue: 15,
    validDays: 7,
    maxUsesPerUser: 1,
  },
  abandonedCart: {
    name: "Recupera tu Carrito",
    description: "Descuento especial para completar tu compra",
    discountType: "percentage" as const,
    discountValue: 10,
    validDays: 3,
    maxUsesPerUser: 1,
  },
}

/**
 * Genera un cupón de primera compra para un usuario
 */
export async function generateFirstPurchaseCoupon(userId: string, userEmail: string) {
  const supabase = createClient()

  // Verificar si el usuario ya tiene órdenes
  const { count } = await supabase
    .from("orders")
    .select("*", { count: "exact", head: true })
    .eq("user_id", userId)

  if (count && count > 0) {
    return null // Usuario ya tiene compras
  }

  // Verificar si ya tiene el cupón
  const { data: existingCoupon } = await supabase
    .from("coupons")
    .select("id")
    .eq("code", AUTO_COUPON_CONFIGS.firstPurchase.code)
    .single()

  if (!existingCoupon) {
    // Crear cupón global de primera compra si no existe
    const validUntil = new Date()
    validUntil.setDate(validUntil.getDate() + 365) // Válido por 1 año

    await supabase.from("coupons").insert({
      code: AUTO_COUPON_CONFIGS.firstPurchase.code,
      name: AUTO_COUPON_CONFIGS.firstPurchase.name,
      description: AUTO_COUPON_CONFIGS.firstPurchase.description,
      discount_type: AUTO_COUPON_CONFIGS.firstPurchase.discountType,
      discount_value: AUTO_COUPON_CONFIGS.firstPurchase.discountValue,
      max_uses_per_user: AUTO_COUPON_CONFIGS.firstPurchase.maxUsesPerUser,
      valid_until: validUntil.toISOString(),
      is_public: true,
      status: "active",
    })
  }

  return AUTO_COUPON_CONFIGS.firstPurchase.code
}

/**
 * Genera un cupón de cumpleaños personalizado
 */
export async function generateBirthdayCoupon(userId: string, userName: string) {
  const supabase = createClient()

  const code = `CUMPLE${userId.substring(0, 8).toUpperCase()}`
  const validFrom = new Date()
  const validUntil = new Date()
  validUntil.setDate(validUntil.getDate() + AUTO_COUPON_CONFIGS.birthday.validDays)

  const { error } = await supabase.from("coupons").insert({
    code,
    name: `${AUTO_COUPON_CONFIGS.birthday.name} - ${userName}`,
    description: AUTO_COUPON_CONFIGS.birthday.description,
    discount_type: AUTO_COUPON_CONFIGS.birthday.discountType,
    discount_value: AUTO_COUPON_CONFIGS.birthday.discountValue,
    max_uses_per_user: AUTO_COUPON_CONFIGS.birthday.maxUsesPerUser,
    applicable_to: "specific_users",
    applicable_user_ids: [userId],
    valid_from: validFrom.toISOString(),
    valid_until: validUntil.toISOString(),
    is_public: false,
    status: "active",
  })

  if (error) {
    console.error("Error creating birthday coupon:", error)
    return null
  }

  return code
}

/**
 * Genera un cupón para carrito abandonado
 */
export async function generateAbandonedCartCoupon(userEmail: string, cartTotal: number) {
  const supabase = createClient()

  const code = `CARRITO${Date.now().toString(36).toUpperCase()}`
  const validFrom = new Date()
  const validUntil = new Date()
  validUntil.setDate(validUntil.getDate() + AUTO_COUPON_CONFIGS.abandonedCart.validDays)

  // Calcular descuento basado en el total del carrito
  let discountValue = AUTO_COUPON_CONFIGS.abandonedCart.discountValue
  if (cartTotal > 500000) {
    discountValue = 15 // 15% para carritos grandes
  }

  const { data: user } = await supabase.auth.getUser()

  const { error } = await supabase.from("coupons").insert({
    code,
    name: AUTO_COUPON_CONFIGS.abandonedCart.name,
    description: `${AUTO_COUPON_CONFIGS.abandonedCart.description} - ${discountValue}% de descuento`,
    discount_type: AUTO_COUPON_CONFIGS.abandonedCart.discountType,
    discount_value: discountValue,
    max_uses_per_user: AUTO_COUPON_CONFIGS.abandonedCart.maxUsesPerUser,
    applicable_to: user?.user ? "specific_users" : "all",
    applicable_user_ids: user?.user ? [user.user.id] : null,
    valid_from: validFrom.toISOString(),
    valid_until: validUntil.toISOString(),
    is_public: false,
    status: "active",
  })

  if (error) {
    console.error("Error creating abandoned cart coupon:", error)
    return null
  }

  return code
}

/**
 * Verifica y genera cupones automáticos para un usuario
 */
export async function checkAndGenerateAutoCoupons(userId: string, userEmail: string, userName?: string) {
  const coupons: string[] = []

  // Cupón de primera compra
  const firstPurchaseCoupon = await generateFirstPurchaseCoupon(userId, userEmail)
  if (firstPurchaseCoupon) {
    coupons.push(firstPurchaseCoupon)
  }

  return coupons
}

/**
 * Envía email con cupón de cumpleaños (integración con Resend)
 */
export async function sendBirthdayCouponEmail(userEmail: string, userName: string, couponCode: string) {
  try {
    await fetch("/api/emails/birthday-coupon", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: userEmail,
        name: userName,
        couponCode,
      }),
    })
  } catch (error) {
    console.error("Error sending birthday coupon email:", error)
  }
}

/**
 * Envía email con cupón de carrito abandonado
 */
export async function sendAbandonedCartEmail(userEmail: string, couponCode: string, cartItems: any[]) {
  try {
    await fetch("/api/emails/abandoned-cart", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: userEmail,
        couponCode,
        cartItems,
      }),
    })
  } catch (error) {
    console.error("Error sending abandoned cart email:", error)
  }
}
