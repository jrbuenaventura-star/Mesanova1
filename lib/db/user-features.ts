import "server-only"

import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"

// =============================================================================
// FAVORITOS
// =============================================================================

export async function getUserFavorites(userId: string) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("favorites")
    .select(`
      id,
      created_at,
      product:products (
        id, slug, nombre_comercial, precio, imagen_principal_url, upp_existencia
      )
    `)
    .eq("user_id", userId)
    .order("created_at", { ascending: false })

  if (error) throw error
  return data
}

export async function addToFavorites(userId: string, productId: string) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("favorites")
    .insert({ user_id: userId, product_id: productId })
    .select()
    .single()

  if (error) throw error
  return data
}

export async function removeFromFavorites(userId: string, productId: string) {
  const supabase = await createClient()
  const { error } = await supabase
    .from("favorites")
    .delete()
    .eq("user_id", userId)
    .eq("product_id", productId)

  if (error) throw error
}

export async function isProductFavorited(userId: string, productId: string) {
  const supabase = await createClient()
  const { data } = await supabase
    .from("favorites")
    .select("id")
    .eq("user_id", userId)
    .eq("product_id", productId)
    .single()

  return !!data
}

// =============================================================================
// WISHLISTS
// =============================================================================

export async function getUserWishlists(userId: string) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("wishlists")
    .select(`
      id, name, description, is_public, share_token, created_at,
      wishlist_items (count)
    `)
    .eq("user_id", userId)
    .order("created_at", { ascending: false })

  if (error) throw error
  return data
}

export async function getWishlistById(wishlistId: string) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("wishlists")
    .select(`
      id, name, description, is_public, share_token, user_id, created_at,
      wishlist_items (
        id, quantity, priority, notes, added_at,
        product:products (
          id, slug, nombre_comercial, precio, imagen_principal_url, upp_existencia
        )
      )
    `)
    .eq("id", wishlistId)
    .single()

  if (error) throw error
  return data
}

export async function getWishlistByToken(shareToken: string) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("wishlists")
    .select(`
      id, name, description, is_public, share_token, created_at,
      user_profiles:user_id (full_name),
      wishlist_items (
        id, quantity, priority, notes,
        product:products (
          id, slug, nombre_comercial, precio, imagen_principal_url, upp_existencia
        )
      )
    `)
    .eq("share_token", shareToken)
    .single()

  if (error) throw error
  return data
}

export async function createWishlist(userId: string, name: string, description?: string, isPublic = false) {
  const supabase = await createClient()
  const shareToken = crypto.randomUUID().replace(/-/g, "")
  
  const { data, error } = await supabase
    .from("wishlists")
    .insert({ user_id: userId, name, description, is_public: isPublic, share_token: shareToken })
    .select()
    .single()

  if (error) throw error
  return data
}

export async function updateWishlist(wishlistId: string, updates: { name?: string; description?: string; is_public?: boolean }) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("wishlists")
    .update(updates)
    .eq("id", wishlistId)
    .select()
    .single()

  if (error) throw error
  return data
}

export async function deleteWishlist(wishlistId: string) {
  const supabase = await createClient()
  const { error } = await supabase.from("wishlists").delete().eq("id", wishlistId)
  if (error) throw error
}

export async function addToWishlist(wishlistId: string, productId: string, quantity = 1, notes?: string) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("wishlist_items")
    .insert({ wishlist_id: wishlistId, product_id: productId, quantity, notes })
    .select()
    .single()

  if (error) throw error
  return data
}

export async function removeFromWishlist(wishlistId: string, productId: string) {
  const supabase = await createClient()
  const { error } = await supabase
    .from("wishlist_items")
    .delete()
    .eq("wishlist_id", wishlistId)
    .eq("product_id", productId)

  if (error) throw error
}

// =============================================================================
// GIFT REGISTRIES (Listas de Matrimonio)
// =============================================================================

export type GiftRegistryEventType = "wedding" | "baby_shower" | "birthday" | "housewarming" | "other"

export async function getUserGiftRegistries(userId: string) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("gift_registries")
    .select(`
      id, name, event_type, event_date, status, share_token, created_at,
      gift_registry_items (count)
    `)
    .eq("user_id", userId)
    .order("created_at", { ascending: false })

  if (error) throw error
  return data
}

export async function getGiftRegistryById(registryId: string) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("gift_registries")
    .select(`
      *,
      gift_registry_items (
        id, quantity_desired, quantity_purchased, priority, notes,
        product:products (
          id, slug, nombre_comercial, precio, imagen_principal_url
        )
      )
    `)
    .eq("id", registryId)
    .single()

  if (error) throw error
  return data
}

export async function getGiftRegistryByToken(shareToken: string) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("gift_registries")
    .select(`
      id, name, event_type, event_date, description, partner_name, cover_image_url, status,
      gift_registry_items (
        id, quantity_desired, quantity_purchased, priority, notes,
        product:products (
          id, slug, nombre_comercial, precio, imagen_principal_url, upp_existencia
        )
      )
    `)
    .eq("share_token", shareToken)
    .eq("status", "active")
    .single()

  if (error) throw error
  return data
}

export async function searchGiftRegistries(query: string) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("gift_registries")
    .select("id, name, event_type, event_date, partner_name, share_token")
    .eq("is_searchable", true)
    .eq("status", "active")
    .ilike("name", `%${query}%`)
    .limit(20)

  if (error) throw error
  return data
}

export async function createGiftRegistry(
  userId: string,
  data: {
    name: string
    event_type?: GiftRegistryEventType
    event_date?: string
    description?: string
    partner_name?: string
    notification_email?: string
  }
) {
  const supabase = await createClient()
  const shareToken = crypto.randomUUID().replace(/-/g, "")
  const eventDate = data.event_date ? new Date(data.event_date) : null
  const expiresAt = eventDate ? new Date(eventDate.getTime() + 60 * 24 * 60 * 60 * 1000) : null // 60 días después

  const { data: registry, error } = await supabase
    .from("gift_registries")
    .insert({
      user_id: userId,
      name: data.name,
      event_type: data.event_type || "wedding",
      event_date: data.event_date,
      description: data.description,
      partner_name: data.partner_name,
      notification_email: data.notification_email,
      share_token: shareToken,
      expires_at: expiresAt?.toISOString(),
    })
    .select()
    .single()

  if (error) throw error
  return registry
}

export async function addToGiftRegistry(registryId: string, productId: string, quantityDesired = 1, notes?: string) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("gift_registry_items")
    .insert({ registry_id: registryId, product_id: productId, quantity_desired: quantityDesired, notes })
    .select()
    .single()

  if (error) throw error
  return data
}

export async function purchaseGiftRegistryItem(
  registryItemId: string,
  buyer: { name: string; email?: string; message?: string; is_anonymous?: boolean },
  quantity: number,
  orderId?: string
) {
  const admin = createAdminClient()
  const { data, error } = await admin
    .from("gift_registry_purchases")
    .insert({
      registry_item_id: registryItemId,
      buyer_name: buyer.name,
      buyer_email: buyer.email,
      buyer_message: buyer.message,
      is_anonymous: buyer.is_anonymous || false,
      quantity,
      order_id: orderId,
    })
    .select()
    .single()

  if (error) throw error
  return data
}

// =============================================================================
// SHIPPING ADDRESSES
// =============================================================================

export async function getUserAddresses(userId: string) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("shipping_addresses")
    .select("*")
    .eq("user_id", userId)
    .order("is_default", { ascending: false })
    .order("created_at", { ascending: false })

  if (error) throw error
  return data
}

export async function getDefaultAddress(userId: string) {
  const supabase = await createClient()
  const { data } = await supabase
    .from("shipping_addresses")
    .select("*")
    .eq("user_id", userId)
    .eq("is_default", true)
    .single()

  return data
}

export async function createAddress(
  userId: string,
  address: {
    label: string
    full_name: string
    phone?: string
    address_line1: string
    address_line2?: string
    city: string
    state: string
    postal_code?: string
    country?: string
    is_default?: boolean
  }
) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("shipping_addresses")
    .insert({ user_id: userId, ...address })
    .select()
    .single()

  if (error) throw error
  return data
}

export async function updateAddress(addressId: string, updates: Partial<{
  label: string
  full_name: string
  phone: string
  address_line1: string
  address_line2: string
  city: string
  state: string
  postal_code: string
  country: string
  is_default: boolean
}>) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("shipping_addresses")
    .update(updates)
    .eq("id", addressId)
    .select()
    .single()

  if (error) throw error
  return data
}

export async function deleteAddress(addressId: string) {
  const supabase = await createClient()
  const { error } = await supabase.from("shipping_addresses").delete().eq("id", addressId)
  if (error) throw error
}

// =============================================================================
// ORDER TRACKING
// =============================================================================

export async function getOrderTracking(orderId: string) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("order_tracking_history")
    .select("*")
    .eq("order_id", orderId)
    .order("occurred_at", { ascending: false })

  if (error) throw error
  return data
}

export async function getCarriers() {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("carriers")
    .select("*")
    .eq("is_active", true)
    .order("name")

  if (error) throw error
  return data
}

export async function addTrackingEvent(
  orderId: string,
  event: {
    status: string
    status_description?: string
    location?: string
    occurred_at: string
  }
) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("order_tracking_history")
    .insert({ order_id: orderId, ...event })
    .select()
    .single()

  if (error) throw error

  // Actualizar last_tracking_update en la orden
  await supabase.from("orders").update({ last_tracking_update: new Date().toISOString() }).eq("id", orderId)

  return data
}

// =============================================================================
// PRODUCT REVIEWS
// =============================================================================

export async function getProductReviews(productId: string, limit = 10, offset = 0) {
  const supabase = await createClient()
  const { data, error, count } = await supabase
    .from("product_reviews")
    .select(`
      id, rating, title, review_text, images, is_verified_purchase, 
      helpful_count, not_helpful_count, created_at,
      user:user_profiles (full_name)
    `, { count: "exact" })
    .eq("product_id", productId)
    .eq("is_approved", true)
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1)

  if (error) throw error
  return { reviews: data, total: count }
}

export async function getProductRatingStats(productId: string) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("product_reviews")
    .select("rating")
    .eq("product_id", productId)
    .eq("is_approved", true)

  if (error) throw error

  if (!data || data.length === 0) {
    return { average: 0, total: 0, distribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 } }
  }

  const distribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
  let total = 0
  data.forEach((r) => {
    distribution[r.rating as keyof typeof distribution]++
    total += r.rating
  })

  return {
    average: Math.round((total / data.length) * 10) / 10,
    total: data.length,
    distribution,
  }
}

export async function createReview(
  userId: string,
  productId: string,
  review: {
    rating: number
    title?: string
    review_text?: string
    images?: string[]
    order_id?: string
  }
) {
  const supabase = await createClient()
  const isVerifiedPurchase = !!review.order_id

  const { data, error } = await supabase
    .from("product_reviews")
    .insert({
      user_id: userId,
      product_id: productId,
      rating: review.rating,
      title: review.title,
      review_text: review.review_text,
      images: review.images || [],
      order_id: review.order_id,
      is_verified_purchase: isVerifiedPurchase,
    })
    .select()
    .single()

  if (error) throw error
  return data
}

export async function voteReview(userId: string, reviewId: string, isHelpful: boolean) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("review_votes")
    .upsert({ user_id: userId, review_id: reviewId, is_helpful: isHelpful }, { onConflict: "review_id,user_id" })
    .select()
    .single()

  if (error) throw error
  return data
}

// =============================================================================
// RECENTLY VIEWED
// =============================================================================

export async function trackProductView(userId: string, productId: string) {
  const supabase = await createClient()
  await supabase.rpc("upsert_recently_viewed", { p_user_id: userId, p_product_id: productId })
}

export async function getRecentlyViewed(userId: string, limit = 12) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("recently_viewed_products")
    .select(`
      viewed_at,
      product:products (
        id, slug, nombre_comercial, precio, imagen_principal_url, upp_existencia
      )
    `)
    .eq("user_id", userId)
    .order("viewed_at", { ascending: false })
    .limit(limit)

  if (error) throw error
  return data
}

// =============================================================================
// PRICE & STOCK ALERTS
// =============================================================================

export async function createPriceAlert(userId: string, productId: string, targetPrice: number, originalPrice: number) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("price_alerts")
    .upsert(
      { user_id: userId, product_id: productId, target_price: targetPrice, original_price: originalPrice, is_active: true },
      { onConflict: "user_id,product_id" }
    )
    .select()
    .single()

  if (error) throw error
  return data
}

export async function createStockAlert(userId: string, productId: string) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("stock_alerts")
    .upsert({ user_id: userId, product_id: productId, is_active: true }, { onConflict: "user_id,product_id" })
    .select()
    .single()

  if (error) throw error
  return data
}

export async function getUserAlerts(userId: string) {
  const supabase = await createClient()
  const [priceAlerts, stockAlerts] = await Promise.all([
    supabase
      .from("price_alerts")
      .select(`*, product:products (id, slug, nombre_comercial, precio, imagen_principal_url)`)
      .eq("user_id", userId)
      .eq("is_active", true),
    supabase
      .from("stock_alerts")
      .select(`*, product:products (id, slug, nombre_comercial, precio, imagen_principal_url, upp_existencia)`)
      .eq("user_id", userId)
      .eq("is_active", true),
  ])

  return {
    priceAlerts: priceAlerts.data || [],
    stockAlerts: stockAlerts.data || [],
  }
}

export async function deleteAlert(type: "price" | "stock", alertId: string) {
  const supabase = await createClient()
  const table = type === "price" ? "price_alerts" : "stock_alerts"
  const { error } = await supabase.from(table).delete().eq("id", alertId)
  if (error) throw error
}

// =============================================================================
// LOYALTY POINTS
// =============================================================================

export async function getUserLoyaltyPoints(userId: string) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("loyalty_points")
    .select("*")
    .eq("user_id", userId)
    .single()

  if (error && error.code !== "PGRST116") throw error
  return data || { total_points: 0, available_points: 0, pending_points: 0, redeemed_points: 0, tier: "bronze" }
}

export async function getLoyaltyTransactions(userId: string, limit = 20) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("loyalty_transactions")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(limit)

  if (error) throw error
  return data
}

export async function getLoyaltyConfig() {
  const supabase = await createClient()
  const { data, error } = await supabase.from("loyalty_config").select("*").single()
  if (error) throw error
  return data
}

// =============================================================================
// NOTIFICATIONS
// =============================================================================

export async function getUserNotifications(userId: string, limit = 20, unreadOnly = false) {
  const supabase = await createClient()
  let query = supabase
    .from("user_notifications")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(limit)

  if (unreadOnly) {
    query = query.eq("is_read", false)
  }

  const { data, error } = await query
  if (error) throw error
  return data
}

export async function getUnreadNotificationCount(userId: string) {
  const supabase = await createClient()
  const { count, error } = await supabase
    .from("user_notifications")
    .select("*", { count: "exact", head: true })
    .eq("user_id", userId)
    .eq("is_read", false)

  if (error) throw error
  return count || 0
}

export async function markNotificationAsRead(notificationId: string) {
  const supabase = await createClient()
  const { error } = await supabase
    .from("user_notifications")
    .update({ is_read: true, read_at: new Date().toISOString() })
    .eq("id", notificationId)

  if (error) throw error
}

export async function markAllNotificationsAsRead(userId: string) {
  const supabase = await createClient()
  const { error } = await supabase
    .from("user_notifications")
    .update({ is_read: true, read_at: new Date().toISOString() })
    .eq("user_id", userId)
    .eq("is_read", false)

  if (error) throw error
}

export async function getNotificationPreferences(userId: string) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("notification_preferences")
    .select("*")
    .eq("user_id", userId)
    .single()

  if (error && error.code !== "PGRST116") throw error
  return data || {
    email_order_updates: true,
    email_price_alerts: true,
    email_stock_alerts: true,
    email_gift_purchases: true,
    email_promotions: false,
    email_newsletter: false,
    push_enabled: false,
  }
}

export async function updateNotificationPreferences(userId: string, preferences: Partial<{
  email_order_updates: boolean
  email_price_alerts: boolean
  email_stock_alerts: boolean
  email_gift_purchases: boolean
  email_promotions: boolean
  email_newsletter: boolean
  push_enabled: boolean
}>) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("notification_preferences")
    .upsert({ user_id: userId, ...preferences }, { onConflict: "user_id" })
    .select()
    .single()

  if (error) throw error
  return data
}

// =============================================================================
// ORDERS (para historial)
// =============================================================================

export async function getUserOrders(userId: string, status?: string) {
  const supabase = await createClient()
  let query = supabase
    .from("orders")
    .select(`
      *,
      carrier:carriers (name, tracking_url_template)
    `)
    .eq("user_id", userId)
    .order("created_at", { ascending: false })

  if (status) {
    query = query.eq("status", status)
  }

  const { data, error } = await query
  if (error) throw error
  return data
}

export async function getActiveOrders(userId: string) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("orders")
    .select(`
      *,
      carrier:carriers (name, tracking_url_template),
      order_tracking_history (status, status_description, location, occurred_at)
    `)
    .eq("user_id", userId)
    .in("status", ["pending", "confirmed", "processing", "shipped"])
    .order("created_at", { ascending: false })

  if (error) throw error
  return data
}
