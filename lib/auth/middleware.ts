import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"
import type { UserRole } from "@/lib/db/types"

export async function checkAuth() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  return user
}

export async function requireAuth(allowedRoles?: UserRole[]) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.redirect(new URL("/auth/login", process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"))
  }

  if (allowedRoles) {
    const { data: profile } = await supabase.from("user_profiles").select("role").eq("id", user.id).single()

    if (!profile || !allowedRoles.includes(profile.role as UserRole)) {
      return NextResponse.redirect(
        new URL("/unauthorized", process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"),
      )
    }
  }

  return null
}

export async function getUserRole(): Promise<UserRole | null> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return null

  const { data: profile } = await supabase.from("user_profiles").select("role").eq("id", user.id).single()

  return (profile?.role as UserRole) || null
}
