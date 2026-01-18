"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"

export async function toggleFavorite(productId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { error: "Debes iniciar sesión para agregar favoritos" }
  }

  // Verificar si ya es favorito
  const { data: existing } = await supabase
    .from("favorites")
    .select("id")
    .eq("user_id", user.id)
    .eq("product_id", productId)
    .single()

  if (existing) {
    // Eliminar de favoritos
    const { error } = await supabase
      .from("favorites")
      .delete()
      .eq("id", existing.id)

    if (error) return { error: error.message }
    revalidatePath("/perfil/favoritos")
    return { success: true, isFavorite: false }
  } else {
    // Agregar a favoritos
    const { error } = await supabase
      .from("favorites")
      .insert({ user_id: user.id, product_id: productId })

    if (error) return { error: error.message }
    revalidatePath("/perfil/favoritos")
    return { success: true, isFavorite: true }
  }
}

export async function checkIsFavorite(productId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return false

  const { data } = await supabase
    .from("favorites")
    .select("id")
    .eq("user_id", user.id)
    .eq("product_id", productId)
    .single()

  return !!data
}
