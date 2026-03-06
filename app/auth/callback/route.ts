import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"
import type { UserRole } from "@/lib/db/types"
import { maskIdentifier, redactErrorMessage } from "@/lib/security/redact"

export async function GET(request: Request) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get("code")
  const origin = requestUrl.origin
  const next = requestUrl.searchParams.get("next") || "/"

  console.log("[auth.callback] code:", code ? "present" : "missing")

  if (code) {
    const supabase = await createClient()

    const { data, error } = await supabase.auth.exchangeCodeForSession(code)

    if (error) {
      console.error("[auth.callback] exchange error:", redactErrorMessage(error))
      return NextResponse.redirect(`${origin}/auth/login?error=auth_failed`)
    }

    if (data?.session) {
      console.log("[auth.callback] session created for user:", maskIdentifier(data.user?.id, 8, 4))

      const roleFromMeta = (data.user?.user_metadata as { role?: unknown } | null | undefined)?.role
      const isValidRole = (v: unknown): v is UserRole =>
        v === "superadmin" || v === "distributor" || v === "end_user" || v === "aliado"

      if (data.user?.id && isValidRole(roleFromMeta)) {
        const { error: roleUpdateError } = await supabase
          .from("user_profiles")
          .update({ role: roleFromMeta })
          .eq("id", data.user.id)

        if (roleUpdateError) {
          console.error("[auth.callback] failed to sync role:", redactErrorMessage(roleUpdateError))
        }
      }

      // Update last_login_at
      if (data.user?.id) {
        await supabase
          .from("user_profiles")
          .update({ last_login_at: new Date().toISOString() })
          .eq("id", data.user.id)
      }

      await new Promise((resolve) => setTimeout(resolve, 200))

      const redirectUrl = `${origin}${next}`
      console.log("[auth.callback] redirecting")
      return NextResponse.redirect(redirectUrl)
    }
  }

  console.log("[auth.callback] no code, redirecting to login")
  return NextResponse.redirect(`${origin}/auth/login?error=no_code`)
}
