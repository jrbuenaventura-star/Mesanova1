"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"

function normalizeGiftRegistryStatus(rawStatus: string) {
  const normalizedStatus = (
    {
      borrador: "draft",
      activa: "active",
      archivada: "archived",
      completada: "completed",
      expirada: "expired",
      cancelada: "cancelled",
    } as const
  )[rawStatus as "borrador" | "activa" | "archivada" | "completada" | "expirada" | "cancelada"] || rawStatus

  const allowedStatuses = new Set(["draft", "active", "archived", "completed", "expired", "cancelled"])
  if (!allowedStatuses.has(normalizedStatus)) return null
  return normalizedStatus
}

function parseGiftRegistryPrivacy(formData: FormData) {
  const privacyValue = String(formData.get("privacy") || "").trim().toLowerCase()

  if (privacyValue === "public" || privacyValue === "publica" || privacyValue === "pública") {
    return true
  }

  if (privacyValue === "private" || privacyValue === "privada") {
    return false
  }

  const isSearchable = formData.get("is_searchable")
  if (isSearchable !== null) return isSearchable === "on"

  return null
}

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
  const eventAddress = formData.get("event_address") as string
  const notificationEmail = formData.get("notification_email") as string
  const isSearchable = parseGiftRegistryPrivacy(formData)

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
      event_address: eventAddress || null,
      notification_email: notificationEmail || user.email,
      share_token: shareToken,
      status: "draft",
      ...(typeof isSearchable === "boolean" ? { is_searchable: isSearchable } : {}),
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
  if (name !== null && String(name).trim().length > 0) updates.name = name

  const eventType = formData.get("event_type")
  if (eventType !== null && String(eventType).trim().length > 0) updates.event_type = eventType

  if (formData.has("event_date")) {
    const eventDate = String(formData.get("event_date") || "").trim()
    updates.event_date = eventDate || null

    if (eventDate) {
      const date = new Date(eventDate)
      date.setMonth(date.getMonth() + 2)
      updates.expires_at = date.toISOString()
    } else {
      updates.expires_at = null
    }
  }

  const partnerName = formData.get("partner_name")
  if (partnerName !== null) updates.partner_name = partnerName || null

  const description = formData.get("description")
  if (description !== null) updates.description = description || null

  const eventAddress = formData.get("event_address")
  if (eventAddress !== null) updates.event_address = eventAddress || null

  const notificationEmail = formData.get("notification_email")
  if (notificationEmail !== null) updates.notification_email = notificationEmail || null

  const parsedPrivacy = parseGiftRegistryPrivacy(formData)
  if (typeof parsedPrivacy === "boolean") {
    updates.is_searchable = parsedPrivacy
  }

  const status = formData.get("status")
  if (typeof status === "string" && status.length > 0) {
    const normalizedStatus = normalizeGiftRegistryStatus(status)
    if (normalizedStatus) {
      updates.status = normalizedStatus
    }
  }

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
