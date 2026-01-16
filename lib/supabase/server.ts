import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"
import type { Database } from "@/lib/db/types"

// Cache server clients per request to avoid creating multiple instances
const serverClientCache = new Map<string, ReturnType<typeof createServerClient<Database>>>()

export async function createClient() {
  const cookieStore = await cookies()

  // Create a cache key based on the current session token
  const sessionCookie = cookieStore.get("sb-hbzgndpouxhxbhngotru-auth-token")
  const cacheKey = sessionCookie?.value || "anonymous"

  // Return cached client if it exists for this session
  if (serverClientCache.has(cacheKey)) {
    return serverClientCache.get(cacheKey)!
  }

  const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error("Missing Supabase environment variables")
  }

  const client = createServerClient<Database>(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll()
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options))
        } catch {
          // The "setAll" method was called from a Server Component.
          // This can be ignored if you have proxy refreshing user sessions.
        }
      },
    },
    auth: {
      detectSessionInUrl: true,
      flowType: "pkce",
    },
    global: {
      headers: {
        "X-Client-Info": "mesanova-web-server@1.0.0",
      },
    },
  })

  // Cache the client for this session
  serverClientCache.set(cacheKey, client)

  // Clean up cache after 5 minutes to prevent memory leaks
  setTimeout(
    () => {
      serverClientCache.delete(cacheKey)
    },
    5 * 60 * 1000,
  )

  return client
}
