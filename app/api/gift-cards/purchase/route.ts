import { NextResponse } from "next/server"

import { createAdminClient } from "@/lib/supabase/admin"
import { createClient } from "@/lib/supabase/server"

type PurchaseGiftCardBody = {
  amount: number
  purchaserName: string
  purchaserEmail: string
  isGift?: boolean
  recipientName?: string
  recipientEmail?: string
  personalMessage?: string
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as PurchaseGiftCardBody

    const amount = Number(body.amount)
    if (!Number.isFinite(amount) || amount < 10000) {
      return NextResponse.json({ error: "Invalid amount" }, { status: 400 })
    }

    if (!body.purchaserName || !body.purchaserEmail) {
      return NextResponse.json({ error: "Missing purchaser info" }, { status: 400 })
    }

    if (body.isGift && (!body.recipientName || !body.recipientEmail)) {
      return NextResponse.json({ error: "Missing recipient info" }, { status: 400 })
    }

    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    const admin = createAdminClient()

    const { data: codeData, error: codeError } = await admin.rpc("generate_gift_card_code")
    if (codeError) {
      return NextResponse.json({ error: codeError.message }, { status: 400 })
    }

    const code = (codeData as string) || `GC-${Date.now()}`

    const expiresAt = new Date()
    expiresAt.setFullYear(expiresAt.getFullYear() + 1)

    const { data: giftCard, error: createError } = await admin
      .from("gift_cards")
      .insert({
        code,
        initial_amount: amount,
        current_balance: amount,
        purchased_by: user?.id || null,
        purchaser_email: body.purchaserEmail,
        purchaser_name: body.purchaserName,
        recipient_email: body.isGift ? body.recipientEmail : body.purchaserEmail,
        recipient_name: body.isGift ? body.recipientName : body.purchaserName,
        personal_message: body.isGift ? body.personalMessage || null : null,
        expires_at: expiresAt.toISOString(),
        status: "active",
      })
      .select()
      .single()

    if (createError || !giftCard) {
      return NextResponse.json({ error: createError?.message || "Failed to create gift card" }, { status: 400 })
    }

    const { error: txError } = await admin.from("gift_card_transactions").insert({
      gift_card_id: giftCard.id,
      amount,
      transaction_type: "purchase",
      balance_before: 0,
      balance_after: amount,
      notes: "Initial purchase",
    })

    if (txError) {
      return NextResponse.json({ error: txError.message }, { status: 400 })
    }

    return NextResponse.json({ success: true, code })
  } catch (e) {
    const message = e instanceof Error ? e.message : "Unknown error"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
