import "server-only"

import { sendWhatsAppMessage } from "@/lib/notifications/whatsapp"
import { createAdminClient } from "@/lib/supabase/admin"

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

type DispatchOptions = {
  productId?: string
  limit?: number
  createdSince?: string
}

export type PriceChangeWhatsAppDispatchResult = {
  success: boolean
  reason?: "missing_webhook"
  queued: number
  sent: number
  skipped_missing_phone: number
  skipped_disabled: number
  failed: number
}

export async function dispatchPendingWishlistPriceChangeWhatsApp(
  options: DispatchOptions = {}
): Promise<PriceChangeWhatsAppDispatchResult> {
  if (!process.env.DELIVERY_OTP_WEBHOOK_URL) {
    return {
      success: false,
      reason: "missing_webhook",
      queued: 0,
      sent: 0,
      skipped_missing_phone: 0,
      skipped_disabled: 0,
      failed: 0,
    }
  }

  const admin = createAdminClient()
  const limit = Number.isFinite(options.limit) && Number(options.limit) > 0 ? Number(options.limit) : 300

  let query = admin
    .from("user_notifications")
    .select("id, user_id, title, message")
    .eq("type", "price_change")
    .eq("whatsapp_sent", false)
    .is("whatsapp_error", null)
    .order("created_at", { ascending: true })
    .limit(limit)

  if (options.productId) {
    query = query.eq("product_id", options.productId)
  }

  if (options.createdSince) {
    query = query.gte("created_at", options.createdSince)
  }

  const { data: notifications, error: notificationsError } = await query

  if (notificationsError || !notifications || notifications.length === 0) {
    return {
      success: true,
      queued: 0,
      sent: 0,
      skipped_missing_phone: 0,
      skipped_disabled: 0,
      failed: 0,
    }
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

  let sent = 0
  let skippedMissingPhone = 0
  let skippedDisabled = 0
  let failed = 0

  for (const notification of notifications as PriceNotification[]) {
    const profile = profilesByUserId.get(notification.user_id)

    if (!profile?.phone) {
      await admin
        .from("user_notifications")
        .update({ whatsapp_error: "missing_phone" })
        .eq("id", notification.id)
      skippedMissingPhone += 1
      continue
    }

    const preference = preferencesByUserId.get(notification.user_id)
    if (preference?.whatsapp_price_alerts === false) {
      await admin
        .from("user_notifications")
        .update({ whatsapp_error: "disabled_by_user" })
        .eq("id", notification.id)
      skippedDisabled += 1
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
      sent += 1
      continue
    }

    await admin
      .from("user_notifications")
      .update({ whatsapp_error: sendResult.error || sendResult.reason })
      .eq("id", notification.id)
    failed += 1
  }

  return {
    success: true,
    queued: notifications.length,
    sent,
    skipped_missing_phone: skippedMissingPhone,
    skipped_disabled: skippedDisabled,
    failed,
  }
}
