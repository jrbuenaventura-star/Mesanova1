"use server"

import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { upsertUserProfile } from "@/lib/db/queries"

export async function signUp(formData: {
  email: string
  password: string
  full_name: string
  role?: "distributor" | "end_user"
  company_name?: string
}) {
  const supabase = await createClient()

  const { data, error } = await supabase.auth.signUp({
    email: formData.email,
    password: formData.password,
    options: {
      emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"}/auth/callback`,
      data: {
        full_name: formData.full_name,
        role: formData.role || "end_user",
      },
    },
  })

  if (error) {
    return { error: error.message }
  }

  if (data.user) {
    // Crear perfil de usuario
    await upsertUserProfile(data.user.id, {
      role: formData.role || "end_user",
      full_name: formData.full_name,
    })

    // Si es distribuidor, crear registro adicional
    if (formData.role === "distributor" && formData.company_name) {
      const { error: distributorError } = await supabase.from("distributors").insert({
        user_id: data.user.id,
        company_name: formData.company_name,
        requires_approval: true, // Requiere aprobación del admin
      })

      if (distributorError) {
        console.error("Error creating distributor:", distributorError)
      }
    }
  }

  return { success: true, message: "Revisa tu correo para confirmar tu cuenta" }
}

export async function signIn(email: string, password: string) {
  const supabase = await createClient()

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (error) {
    return { error: error.message }
  }

  // Actualizar último login
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (user) {
    await supabase.from("user_profiles").update({ last_login_at: new Date().toISOString() }).eq("id", user.id)
  }

  return { success: true }
}

export async function signOut() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect("/")
}

export async function getCurrentUser() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  return user
}

export async function updateUserProfile(updates: {
  full_name?: string
  phone?: string
  document_type?: string
  document_number?: string
  shipping_address?: string
  shipping_city?: string
  shipping_state?: string
  shipping_postal_code?: string
  shipping_country?: string
}) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { error: "No autenticado" }
  }

  const { error } = await supabase.from("user_profiles").update(updates).eq("id", user.id)

  if (error) {
    return { error: error.message }
  }

  return { success: true }
}
