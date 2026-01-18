"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"

export async function createGiftRegistryAction(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { error: "Debes iniciar sesión" }
  }

  const name = formData.get("name") as string
  const eventType = formData.get("event_type") as string
  const eventDate = formData.get("event_date") as string
  const partnerName = formData.get("partner_name") as string
  const description = formData.get("description") as string
  const notificationEmail = formData.get("notification_email") as string

  const shareToken = crypto.randomUUID().replace(/-/g, "")
  
  // Calcular fecha de expiración (2 meses después del evento)
  let expiresAt = null
  if (eventDate) {
    const date = new Date(eventDate)
    date.setMonth(date.getMonth() + 2)
    expiresAt = date.toISOString()
  }

  const { data, error } = await supabase
    .from("gift_registries")
    .insert({
      user_id: user.id,
      name,
      event_type: eventType || "wedding",
      event_date: eventDate || null,
      partner_name: partnerName || null,
      description: description || null,
      notification_email: notificationEmail || user.email,
      share_token: shareToken,
      expires_at: expiresAt,
    })
    .select("id")
    .single()

  if (error) {
    return { error: error.message }
  }

  revalidatePath("/perfil/listas-regalo")
  return { success: true, registryId: data.id }
}

export async function addProductToRegistryAction(registryId: string, productId: string, quantity: number = 1) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { error: "Debes iniciar sesión" }
  }

  // Verificar que el usuario es dueño de la lista
  const { data: registry } = await supabase
    .from("gift_registries")
    .select("user_id")
    .eq("id", registryId)
    .single()

  if (!registry || registry.user_id !== user.id) {
    return { error: "No tienes permiso para modificar esta lista" }
  }

  const { error } = await supabase
    .from("gift_registry_items")
    .upsert({
      registry_id: registryId,
      product_id: productId,
      quantity_desired: quantity,
    }, { onConflict: "registry_id,product_id" })

  if (error) {
    return { error: error.message }
  }

  revalidatePath(`/perfil/listas-regalo/${registryId}`)
  return { success: true }
}

export async function removeProductFromRegistryAction(registryId: string, productId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { error: "Debes iniciar sesión" }
  }

  const { error } = await supabase
    .from("gift_registry_items")
    .delete()
    .eq("registry_id", registryId)
    .eq("product_id", productId)

  if (error) {
    return { error: error.message }
  }

  revalidatePath(`/perfil/listas-regalo/${registryId}`)
  return { success: true }
}

export async function updateGiftRegistryAction(registryId: string, formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { error: "Debes iniciar sesión" }
  }

  const updates: Record<string, any> = {}

  const name = formData.get("name")
  if (name) updates.name = name

  const eventType = formData.get("event_type")
  if (eventType) updates.event_type = eventType

  const eventDate = formData.get("event_date")
  if (eventDate) {
    updates.event_date = eventDate
    const date = new Date(eventDate as string)
    date.setMonth(date.getMonth() + 2)
    updates.expires_at = date.toISOString()
  }

  const partnerName = formData.get("partner_name")
  if (partnerName !== null) updates.partner_name = partnerName || null

  const description = formData.get("description")
  if (description !== null) updates.description = description || null

  const notificationEmail = formData.get("notification_email")
  if (notificationEmail !== null) updates.notification_email = notificationEmail || null

  const isSearchable = formData.get("is_searchable")
  if (isSearchable !== null) updates.is_searchable = isSearchable === "on"

  const { error } = await supabase
    .from("gift_registries")
    .update(updates)
    .eq("id", registryId)
    .eq("user_id", user.id)

  if (error) {
    return { error: error.message }
  }

  revalidatePath(`/perfil/listas-regalo/${registryId}`)
  revalidatePath("/perfil/listas-regalo")
  return { success: true }
}

export async function deleteGiftRegistryAction(registryId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { error: "Debes iniciar sesión" }
  }

  const { error } = await supabase
    .from("gift_registries")
    .delete()
    .eq("id", registryId)
    .eq("user_id", user.id)

  if (error) {
    return { error: error.message }
  }

  revalidatePath("/perfil/listas-regalo")
  return { success: true }
}
