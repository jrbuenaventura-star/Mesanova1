#!/usr/bin/env node

import { randomUUID } from "node:crypto"
import process from "node:process"

import { createClient } from "@supabase/supabase-js"

function logStep(message) {
  process.stdout.write(`[gift-cards-e2e] ${message}\n`)
}

async function requestJson(url, init) {
  const response = await fetch(url, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers || {}),
    },
  })

  const text = await response.text()
  let body
  try {
    body = text ? JSON.parse(text) : {}
  } catch {
    body = { raw: text }
  }

  if (!response.ok) {
    throw new Error(`HTTP ${response.status} ${url} -> ${JSON.stringify(body)}`)
  }

  return body
}

async function main() {
  const baseUrl =
    process.env.GIFT_CARDS_E2E_BASE_URL || process.env.DELIVERY_E2E_BASE_URL || "http://127.0.0.1:3001"
  const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl) throw new Error("Missing SUPABASE_URL or NEXT_PUBLIC_SUPABASE_URL")
  if (!serviceRoleKey) throw new Error("Missing SUPABASE_SERVICE_ROLE_KEY")

  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })

  const runId = `${Date.now()}-${randomUUID().slice(0, 8)}`
  const slug = `e2e-bono-${runId}`
  const initialName = `Bono E2E ${runId}`
  const updatedName = `Bono E2E Editado ${runId}`

  let productId = null
  let purchasedGiftCardId = null
  let purchasedGiftCardCode = null

  const cleanup = async () => {
    if (purchasedGiftCardId) {
      await supabase.from("gift_card_transactions").delete().eq("gift_card_id", purchasedGiftCardId)
    }

    if (purchasedGiftCardCode) {
      await supabase.from("gift_cards").delete().eq("code", purchasedGiftCardCode)
    }

    if (productId) {
      await supabase.from("gift_card_products").delete().eq("id", productId)
    }
  }

  try {
    logStep("creating gift card catalog product")
    const { data: createdProduct, error: createError } = await supabase
      .from("gift_card_products")
      .insert({
        name: initialName,
        slug,
        description: "Registro temporal para validación E2E",
        amount: 120000,
        allow_custom_amount: true,
        min_custom_amount: 120000,
        max_custom_amount: 150000,
        sort_order: 9999,
        is_active: true,
      })
      .select("id")
      .single()

    if (createError || !createdProduct) {
      throw new Error(`Could not create gift_card_products row: ${createError?.message || "unknown"}`)
    }

    productId = createdProduct.id

    logStep("checking /api/gift-cards/catalog contains created product")
    const catalogBefore = await requestJson(`${baseUrl}/api/gift-cards/catalog`, { method: "GET" })
    const listedBefore = Array.isArray(catalogBefore?.products)
      ? catalogBefore.products.find((item) => String(item.id) === String(productId))
      : null

    if (!listedBefore) {
      throw new Error("Catalog API does not include newly created product")
    }

    logStep("updating catalog product")
    const { error: updateError } = await supabase
      .from("gift_card_products")
      .update({
        name: updatedName,
        min_custom_amount: 125000,
        max_custom_amount: 135000,
      })
      .eq("id", productId)

    if (updateError) {
      throw new Error(`Could not update gift_card_products row: ${updateError.message}`)
    }

    logStep("purchasing gift card through public API")
    const purchaseBody = await requestJson(`${baseUrl}/api/gift-cards/purchase`, {
      method: "POST",
      body: JSON.stringify({
        amount: 130000,
        giftCardProductId: productId,
        purchaserName: "Comprador E2E",
        purchaserEmail: "comprador.e2e@mesanova.test",
        isGift: true,
        recipientName: "Destinatario E2E",
        recipientEmail: "destinatario.e2e@mesanova.test",
        personalMessage: "Prueba E2E",
      }),
    })

    if (!purchaseBody?.success || !purchaseBody?.code) {
      throw new Error(`Unexpected purchase response: ${JSON.stringify(purchaseBody)}`)
    }

    purchasedGiftCardCode = String(purchaseBody.code)

    const { data: giftCard, error: giftCardError } = await supabase
      .from("gift_cards")
      .select("id, initial_amount, current_balance")
      .eq("code", purchasedGiftCardCode)
      .single()

    if (giftCardError || !giftCard) {
      throw new Error(`Created gift card not found: ${giftCardError?.message || "unknown"}`)
    }

    purchasedGiftCardId = giftCard.id

    if (Number(giftCard.initial_amount) !== 130000 || Number(giftCard.current_balance) !== 130000) {
      throw new Error(`Unexpected gift card balances: ${JSON.stringify(giftCard)}`)
    }

    const { data: transactions, error: txError } = await supabase
      .from("gift_card_transactions")
      .select("id, transaction_type, amount")
      .eq("gift_card_id", purchasedGiftCardId)

    if (txError) {
      throw new Error(`Could not load gift card transactions: ${txError.message}`)
    }

    const purchaseTx = (transactions || []).find((tx) => tx.transaction_type === "purchase")
    if (!purchaseTx) {
      throw new Error("Purchase transaction not found")
    }

    logStep("deleting catalog product")
    const { error: deleteError } = await supabase.from("gift_card_products").delete().eq("id", productId)
    if (deleteError) {
      throw new Error(`Could not delete gift card product: ${deleteError.message}`)
    }

    const deletedProductId = productId
    productId = null

    logStep("checking /api/gift-cards/catalog no longer contains deleted product")
    const catalogAfter = await requestJson(`${baseUrl}/api/gift-cards/catalog`, { method: "GET" })
    const stillListed = Array.isArray(catalogAfter?.products)
      ? catalogAfter.products.some((item) => String(item.id) === String(deletedProductId))
      : false

    if (stillListed) {
      throw new Error("Deleted product still appears in catalog API")
    }

    logStep(`success -> code=${purchasedGiftCardCode}`)
  } finally {
    await cleanup()
  }
}

main().catch((error) => {
  process.stderr.write(`[gift-cards-e2e] FAILED ${error instanceof Error ? error.message : String(error)}\n`)
  process.exit(1)
})
