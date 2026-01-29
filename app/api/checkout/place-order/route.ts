import { NextResponse } from "next/server"

import { createAdminClient } from "@/lib/supabase/admin"

type CheckoutItem = {
  productId: string
  productCode?: string
  name: string
  quantity: number
  price: number
}

type PlaceOrderBody = {
  order: {
    user_id?: string | null
    customer_name: string
    customer_email: string
    customer_phone: string
    shipping_address: string
    shipping_city: string
    shipping_postal_code?: string
    notes?: string
    payment_method?: string
    shipping_method?: string
    subtotal: number
    shipping_cost: number
    total: number
    status?: string
    items: CheckoutItem[]
  }
  coupon?: {
    id: string
    discount_applied: number
    order_total_before: number
    order_total_after: number
  } | null
  giftCardRedemption?: {
    gift_card_id: string
    amount: number
  } | null
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as PlaceOrderBody

    if (!body?.order) {
      return NextResponse.json({ error: "Missing order payload" }, { status: 400 })
    }

    const order = body.order

    if (!order.customer_name || !order.customer_email || !order.customer_phone) {
      return NextResponse.json({ error: "Missing customer info" }, { status: 400 })
    }

    if (!order.shipping_address || !order.shipping_city) {
      return NextResponse.json({ error: "Missing shipping info" }, { status: 400 })
    }

    if (!Array.isArray(order.items) || order.items.length === 0) {
      return NextResponse.json({ error: "Order must include items" }, { status: 400 })
    }

    const admin = createAdminClient()

    // 1) Create order
    const { data: createdOrder, error: orderError } = await admin
      .from("orders")
      .insert({
        ...order,
        status: order.status || "pending",
      })
      .select()
      .single()

    if (orderError || !createdOrder) {
      return NextResponse.json({ error: orderError?.message || "Failed to create order" }, { status: 400 })
    }

    // 2) Coupon usage (optional)
    if (body.coupon) {
      const { error: couponUsageError } = await admin.from("coupon_usages").insert({
        coupon_id: body.coupon.id,
        user_id: order.user_id ?? null,
        order_id: createdOrder.id,
        discount_applied: body.coupon.discount_applied,
        order_total_before: body.coupon.order_total_before,
        order_total_after: body.coupon.order_total_after,
      })

      if (couponUsageError) {
        return NextResponse.json({ error: couponUsageError.message }, { status: 400 })
      }
    }

    // 3) Gift card redemption (optional)
    if (body.giftCardRedemption?.gift_card_id && body.giftCardRedemption.amount > 0) {
      const { data: giftCard, error: giftCardError } = await admin
        .from("gift_cards")
        .select("id,current_balance,status")
        .eq("id", body.giftCardRedemption.gift_card_id)
        .single()

      if (giftCardError || !giftCard) {
        return NextResponse.json({ error: "Gift card not found" }, { status: 404 })
      }

      if (giftCard.status !== "active") {
        return NextResponse.json({ error: "Gift card is not active" }, { status: 400 })
      }

      const balanceBefore = Number(giftCard.current_balance || 0)
      const redeemAmount = Number(body.giftCardRedemption.amount || 0)

      if (!Number.isFinite(redeemAmount) || redeemAmount <= 0) {
        return NextResponse.json({ error: "Invalid gift card amount" }, { status: 400 })
      }

      if (redeemAmount > balanceBefore) {
        return NextResponse.json({ error: "Insufficient gift card balance" }, { status: 400 })
      }

      const balanceAfter = balanceBefore - redeemAmount

      const { error: updateGiftCardError } = await admin
        .from("gift_cards")
        .update({
          current_balance: balanceAfter,
          last_used_at: new Date().toISOString(),
          status: balanceAfter <= 0 ? "used" : "active",
        })
        .eq("id", giftCard.id)

      if (updateGiftCardError) {
        return NextResponse.json({ error: updateGiftCardError.message }, { status: 400 })
      }

      const { error: insertTxError } = await admin.from("gift_card_transactions").insert({
        gift_card_id: giftCard.id,
        order_id: createdOrder.id,
        amount: redeemAmount,
        transaction_type: "redemption",
        balance_before: balanceBefore,
        balance_after: balanceAfter,
      })

      if (insertTxError) {
        return NextResponse.json({ error: insertTxError.message }, { status: 400 })
      }
    }

    return NextResponse.json({ success: true, order: createdOrder })
  } catch (e) {
    const message = e instanceof Error ? e.message : "Unknown error"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
