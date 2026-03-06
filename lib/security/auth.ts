import { NextResponse } from "next/server"

import { createClient } from "@/lib/supabase/server"

export type ApiAuthResult =
  | {
      ok: true
      userId: string
      role: string | null
      supabase: Awaited<ReturnType<typeof createClient>>
    }
  | {
      ok: false
      response: NextResponse
    }

type ApiAuthOptions = {
  roles?: string[]
}

export async function requireApiUser(options?: ApiAuthOptions): Promise<ApiAuthResult> {
  const supabase = await createClient()
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    return {
      ok: false,
      response: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
    }
  }

  let role: string | null = null
  if (options?.roles?.length) {
    const { data: profile, error: profileError } = await supabase
      .from("user_profiles")
      .select("role")
      .eq("id", user.id)
      .single()

    role = profile?.role || null
    if (profileError || !role || !options.roles.includes(role)) {
      return {
        ok: false,
        response: NextResponse.json({ error: "Forbidden" }, { status: 403 }),
      }
    }
  }

  return {
    ok: true,
    userId: user.id,
    role,
    supabase,
  }
}
