import "server-only"

import { createClient } from "@/lib/supabase/server"

export async function requireSuperadminUser() {
  const supabase = await createClient()
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  if (userError || !user) {
    return { ok: false as const, status: 401, error: "No autorizado", userId: null as string | null }
  }

  const { data: profile, error: profileError } = await supabase
    .from("user_profiles")
    .select("role")
    .eq("id", user.id)
    .single()

  if (profileError || profile?.role !== "superadmin") {
    return { ok: false as const, status: 403, error: "No autorizado", userId: null as string | null }
  }

  return { ok: true as const, userId: user.id }
}
