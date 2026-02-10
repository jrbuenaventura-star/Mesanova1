import { NextRequest, NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/admin"

/**
 * Clientify Webhook Receiver
 * Receives engagement data (email opens, clicks, form submissions) from Clientify
 * and stores it in the user profile for visibility in Mesanova admin.
 * 
 * Configure in Clientify: Settings > Webhooks > Add webhook
 * URL: https://mesanova.co/api/clientify/webhook
 * Secret: Set CLIENTIFY_WEBHOOK_SECRET in env
 */
export async function POST(request: NextRequest) {
  try {
    // Verify webhook secret
    const webhookSecret = process.env.CLIENTIFY_WEBHOOK_SECRET
    if (webhookSecret) {
      const authHeader = request.headers.get("x-webhook-secret") || request.headers.get("authorization")
      if (authHeader !== webhookSecret && authHeader !== `Bearer ${webhookSecret}`) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
      }
    }

    const body = await request.json()
    const { event, contact, data } = body as {
      event?: string
      contact?: { email?: string; id?: number }
      data?: Record<string, any>
    }

    if (!event || !contact?.email) {
      return NextResponse.json({ error: "Missing event or contact email" }, { status: 400 })
    }

    const admin = createAdminClient()

    // Find the user by email through auth
    const { data: authUsers } = await admin.auth.admin.listUsers()
    const matchedUser = authUsers?.users?.find(
      (u) => u.email?.toLowerCase() === contact.email!.toLowerCase()
    )

    if (!matchedUser) {
      // Contact not found in Mesanova — that's ok, just acknowledge
      return NextResponse.json({ received: true, matched: false })
    }

    // Build CRM note entry from webhook event
    const timestamp = new Date().toISOString()
    const eventNote = `[${timestamp}] Clientify: ${event}${data ? ` — ${JSON.stringify(data).slice(0, 200)}` : ""}`

    // Append to crm_notes
    const { data: profile } = await admin
      .from("user_profiles")
      .select("crm_notes")
      .eq("id", matchedUser.id)
      .single()

    const existingNotes = profile?.crm_notes || ""
    const updatedNotes = existingNotes
      ? `${eventNote}\n${existingNotes}`
      : eventNote

    // Keep notes to a reasonable size (last 50 entries)
    const noteLines = updatedNotes.split("\n").slice(0, 50).join("\n")

    await admin
      .from("user_profiles")
      .update({ crm_notes: noteLines })
      .eq("id", matchedUser.id)

    return NextResponse.json({ received: true, matched: true, userId: matchedUser.id })
  } catch (error) {
    console.error("Clientify webhook error:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal error" },
      { status: 500 }
    )
  }
}
