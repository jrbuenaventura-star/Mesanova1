import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"
import type { UserRole } from "@/lib/db/types"

export async function GET(request: Request) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get("code")
  const origin = requestUrl.origin
  const next = requestUrl.searchParams.get("next") || "/"

  console.log("[v0] Auth callback - code:", code ? "present" : "missing")

  if (code) {
    const supabase = await createClient()

    const { data, error } = await supabase.auth.exchangeCodeForSession(code)

    if (error) {
      console.error("[v0] Auth callback - exchange error:", error)
      return NextResponse.redirect(`${origin}/auth/login?error=auth_failed`)
    }

    if (data?.session) {
      console.log("[v0] Auth callback - session created for user:", data.user?.email)

      const roleFromMeta = (data.user?.user_metadata as { role?: unknown } | null | undefined)?.role
      const isValidRole = (v: unknown): v is UserRole =>
        v === "superadmin" || v === "distributor" || v === "end_user" || v === "aliado"

      if (data.user?.id && isValidRole(roleFromMeta)) {
        const { error: roleUpdateError } = await supabase
          .from("user_profiles")
          .update({ role: roleFromMeta })
          .eq("id", data.user.id)

        if (roleUpdateError) {
          console.error("[v0] Auth callback - failed to sync role:", roleUpdateError)
        }
      }

      await new Promise((resolve) => setTimeout(resolve, 200))

      const redirectUrl = `${origin}${next}`
      console.log("[v0] Auth callback - redirecting to:", redirectUrl)
      return NextResponse.redirect(redirectUrl)
    }
  }

  console.log("[v0] Auth callback - no code, redirecting to login")
  return NextResponse.redirect(`${origin}/auth/login?error=no_code`)
}
