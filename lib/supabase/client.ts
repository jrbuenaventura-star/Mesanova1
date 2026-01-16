import { createBrowserClient } from "@supabase/ssr"

// Use a more robust singleton pattern that works across module boundaries
declare global {
  var __supabase_client: ReturnType<typeof createBrowserClient> | undefined
}

export function createClient() {
  // Return existing instance if available
  if (globalThis.__supabase_client) {
    return globalThis.__supabase_client
  }

  // Create new instance only if it doesn't exist
  const client = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      auth: {
        // Suppress the multiple instance warning since we're using a singleton
        detectSessionInUrl: true,
        flowType: "pkce",
      },
      global: {
        headers: {
          "X-Client-Info": "mesanova-web@1.0.0",
        },
      },
    },
  )

  // Store in global scope to persist across hot reloads
  globalThis.__supabase_client = client

  return client
}
