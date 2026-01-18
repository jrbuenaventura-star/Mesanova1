"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"

export async function updateNotificationPreferencesAction(preferences: Partial<{
  email_order_updates: boolean
  email_price_alerts: boolean
  email_stock_alerts: boolean
  email_gift_purchases: boolean
  email_promotions: boolean
  email_newsletter: boolean
  push_enabled: boolean
}>) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { error: "Debes iniciar sesión" }
  }

  const { error } = await supabase
    .from("notification_preferences")
    .upsert({
      user_id: user.id,
      ...preferences,
    }, { onConflict: "user_id" })

  if (error) {
    return { error: error.message }
  }

  revalidatePath("/perfil/configuracion")
  return { success: true }
}

export async function markNotificationAsReadAction(notificationId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { error: "Debes iniciar sesión" }
  }

  const { error } = await supabase
    .from("user_notifications")
    .update({ is_read: true, read_at: new Date().toISOString() })
    .eq("id", notificationId)
    .eq("user_id", user.id)

  if (error) {
    return { error: error.message }
  }

  revalidatePath("/perfil/notificaciones")
  return { success: true }
}
