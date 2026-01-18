"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"

export async function createWishlistAction(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { error: "Debes iniciar sesión" }
  }

  const name = formData.get("name") as string
  const description = formData.get("description") as string
  const isPublic = formData.get("is_public") === "on"
  const shareToken = crypto.randomUUID().replace(/-/g, "")

  const { data, error } = await supabase
    .from("wishlists")
    .insert({
      user_id: user.id,
      name,
      description: description || null,
      is_public: isPublic,
      share_token: shareToken,
    })
    .select("id")
    .single()

  if (error) {
    return { error: error.message }
  }

  revalidatePath("/perfil/wishlists")
  return { success: true, wishlistId: data.id }
}

export async function addToWishlistAction(wishlistId: string, productId: string, quantity: number = 1) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { error: "Debes iniciar sesión" }
  }

  // Verificar que el usuario es dueño de la lista
  const { data: wishlist } = await supabase
    .from("wishlists")
    .select("user_id")
    .eq("id", wishlistId)
    .single()

  if (!wishlist || wishlist.user_id !== user.id) {
    return { error: "No tienes permiso para modificar esta lista" }
  }

  const { error } = await supabase
    .from("wishlist_items")
    .upsert({
      wishlist_id: wishlistId,
      product_id: productId,
      quantity,
    }, { onConflict: "wishlist_id,product_id" })

  if (error) {
    return { error: error.message }
  }

  revalidatePath(`/perfil/wishlists/${wishlistId}`)
  return { success: true }
}

export async function removeFromWishlistAction(wishlistId: string, productId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { error: "Debes iniciar sesión" }
  }

  const { error } = await supabase
    .from("wishlist_items")
    .delete()
    .eq("wishlist_id", wishlistId)
    .eq("product_id", productId)

  if (error) {
    return { error: error.message }
  }

  revalidatePath(`/perfil/wishlists/${wishlistId}`)
  return { success: true }
}

export async function updateWishlistAction(wishlistId: string, formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { error: "Debes iniciar sesión" }
  }

  const name = formData.get("name") as string
  const description = formData.get("description") as string
  const isPublic = formData.get("is_public") === "on"

  const { error } = await supabase
    .from("wishlists")
    .update({
      name,
      description: description || null,
      is_public: isPublic,
    })
    .eq("id", wishlistId)
    .eq("user_id", user.id)

  if (error) {
    return { error: error.message }
  }

  revalidatePath(`/perfil/wishlists/${wishlistId}`)
  revalidatePath("/perfil/wishlists")
  return { success: true }
}

export async function deleteWishlistAction(wishlistId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { error: "Debes iniciar sesión" }
  }

  const { error } = await supabase
    .from("wishlists")
    .delete()
    .eq("id", wishlistId)
    .eq("user_id", user.id)

  if (error) {
    return { error: error.message }
  }

  revalidatePath("/perfil/wishlists")
  return { success: true }
}
