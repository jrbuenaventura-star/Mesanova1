"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"

export async function createAddressAction(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { error: "Debes iniciar sesión" }
  }

  const address = {
    user_id: user.id,
    label: formData.get("label") as string,
    full_name: formData.get("full_name") as string,
    phone: formData.get("phone") as string || null,
    address_line1: formData.get("address_line1") as string,
    address_line2: formData.get("address_line2") as string || null,
    city: formData.get("city") as string,
    state: formData.get("state") as string,
    postal_code: formData.get("postal_code") as string || null,
    country: formData.get("country") as string || "Colombia",
    is_default: formData.get("is_default") === "on",
  }

  const { error } = await supabase.from("shipping_addresses").insert(address)

  if (error) {
    return { error: error.message }
  }

  revalidatePath("/perfil/direcciones")
  return { success: true }
}

export async function updateAddressAction(addressId: string, formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { error: "Debes iniciar sesión" }
  }

  const updates = {
    label: formData.get("label") as string,
    full_name: formData.get("full_name") as string,
    phone: formData.get("phone") as string || null,
    address_line1: formData.get("address_line1") as string,
    address_line2: formData.get("address_line2") as string || null,
    city: formData.get("city") as string,
    state: formData.get("state") as string,
    postal_code: formData.get("postal_code") as string || null,
    country: formData.get("country") as string || "Colombia",
    is_default: formData.get("is_default") === "on",
  }

  const { error } = await supabase
    .from("shipping_addresses")
    .update(updates)
    .eq("id", addressId)
    .eq("user_id", user.id)

  if (error) {
    return { error: error.message }
  }

  revalidatePath("/perfil/direcciones")
  return { success: true }
}

export async function deleteAddressAction(addressId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { error: "Debes iniciar sesión" }
  }

  const { error } = await supabase
    .from("shipping_addresses")
    .delete()
    .eq("id", addressId)
    .eq("user_id", user.id)

  if (error) {
    return { error: error.message }
  }

  revalidatePath("/perfil/direcciones")
  return { success: true }
}

export async function setDefaultAddressAction(addressId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { error: "Debes iniciar sesión" }
  }

  const { error } = await supabase
    .from("shipping_addresses")
    .update({ is_default: true })
    .eq("id", addressId)
    .eq("user_id", user.id)

  if (error) {
    return { error: error.message }
  }

  revalidatePath("/perfil/direcciones")
  return { success: true }
}
