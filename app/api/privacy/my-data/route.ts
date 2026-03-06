import { NextRequest, NextResponse } from "next/server"

import { requireApiUser } from "@/lib/security/auth"
import { enforceRateLimit } from "@/lib/security/api"
import { createAdminClient } from "@/lib/supabase/admin"

function isTableMissingError(error: { code?: string; message?: string; details?: string } | null | undefined) {
  const code = String(error?.code || "").toUpperCase()
  const message = String(error?.message || "")
  const details = String(error?.details || "")
  return (
    code === "42P01" ||
    code === "PGRST205" ||
    /does not exist|relation .* does not exist|could not find the table .* in the schema cache/i.test(
      `${message} ${details}`
    )
  )
}

async function readOptionalArray<T>(label: string, query: any, warnings: string[]): Promise<T[]> {
  const { data, error } = await query
  if (!error) return Array.isArray(data) ? (data as T[]) : []
  if (isTableMissingError(error)) {
    warnings.push(`${label}:table_missing`)
    return []
  }
  throw new Error(`${label}:${error.message || "query_failed"}`)
}

async function readOptionalSingle<T>(label: string, query: any, warnings: string[]): Promise<T | null> {
  const { data, error } = await query
  if (!error) return (data as T | null) || null
  if (isTableMissingError(error)) {
    warnings.push(`${label}:table_missing`)
    return null
  }
  throw new Error(`${label}:${error.message || "query_failed"}`)
}

export async function GET(request: NextRequest) {
  const auth = await requireApiUser()
  if (!auth.ok) return auth.response

  const rateLimitResponse = await enforceRateLimit(request, {
    bucket: "privacy-my-data-export",
    limit: 6,
    windowMs: 60 * 60 * 1000,
    keySuffix: auth.userId,
  })
  if (rateLimitResponse) return rateLimitResponse

  const admin = createAdminClient()
  const warnings: string[] = []

  const {
    data: { user },
  } = await auth.supabase.auth.getUser()
  const userEmail = user?.email || null

  try {
    const [profile, shippingAddresses, orders, wishlists, giftRegistries, notifications, notificationPreferences] =
      await Promise.all([
        readOptionalSingle(
          "user_profiles",
          admin
            .from("user_profiles")
            .select(
              "id, role, full_name, phone, company_name, nit, main_city, main_state, city, state, created_at, updated_at"
            )
            .eq("id", auth.userId)
            .maybeSingle(),
          warnings
        ),
        readOptionalArray(
          "shipping_addresses",
          admin.from("shipping_addresses").select("*").eq("user_id", auth.userId).order("created_at", { ascending: false }),
          warnings
        ),
        readOptionalArray(
          "orders",
          admin.from("orders").select("*").eq("user_id", auth.userId).order("created_at", { ascending: false }).limit(1000),
          warnings
        ),
        readOptionalArray(
          "wishlists",
          admin.from("wishlists").select("*").eq("user_id", auth.userId).order("created_at", { ascending: false }),
          warnings
        ),
        readOptionalArray(
          "gift_registries",
          admin.from("gift_registries").select("*").eq("user_id", auth.userId).order("created_at", { ascending: false }),
          warnings
        ),
        readOptionalArray(
          "user_notifications",
          admin
            .from("user_notifications")
            .select("*")
            .eq("user_id", auth.userId)
            .order("created_at", { ascending: false })
            .limit(1000),
          warnings
        ),
        readOptionalSingle(
          "notification_preferences",
          admin.from("notification_preferences").select("*").eq("user_id", auth.userId).maybeSingle(),
          warnings
        ),
      ])

    const orderIds = orders.map((order: any) => String(order.id || "")).filter(Boolean)
    const wishlistIds = wishlists.map((wishlist: any) => String(wishlist.id || "")).filter(Boolean)
    const registryIds = giftRegistries.map((registry: any) => String(registry.id || "")).filter(Boolean)

    const [orderItems, wishlistItems, registryItems, consentEvents, dataRequests, loyaltyPoints, loyaltyTransactions] =
      await Promise.all([
        orderIds.length
          ? readOptionalArray("order_items", admin.from("order_items").select("*").in("order_id", orderIds), warnings)
          : Promise.resolve([]),
        wishlistIds.length
          ? readOptionalArray("wishlist_items", admin.from("wishlist_items").select("*").in("wishlist_id", wishlistIds), warnings)
          : Promise.resolve([]),
        registryIds.length
          ? readOptionalArray(
              "gift_registry_items",
              admin.from("gift_registry_items").select("*").in("registry_id", registryIds),
              warnings
            )
          : Promise.resolve([]),
        readOptionalArray(
          "privacy_consent_events",
          admin
            .from("privacy_consent_events")
            .select("id, consent_analytics, consent_marketing, source, version, created_at")
            .eq("user_id", auth.userId)
            .order("created_at", { ascending: false })
            .limit(200),
          warnings
        ),
        readOptionalArray(
          "privacy_data_requests",
          admin
            .from("privacy_data_requests")
            .select("id, request_type, status, request_payload, resolution_notes, resolved_at, created_at, updated_at")
            .eq("user_id", auth.userId)
            .order("created_at", { ascending: false })
            .limit(200),
          warnings
        ),
        readOptionalSingle("loyalty_points", admin.from("loyalty_points").select("*").eq("user_id", auth.userId).maybeSingle(), warnings),
        readOptionalArray(
          "loyalty_transactions",
          admin
            .from("loyalty_transactions")
            .select("*")
            .eq("user_id", auth.userId)
            .order("created_at", { ascending: false })
            .limit(1000),
          warnings
        ),
      ])

    const registryItemIds = registryItems.map((item: any) => String(item.id || "")).filter(Boolean)

    const [registryPurchases, giftCardsPurchased, giftCardsReceived, contactLeads] = await Promise.all([
      registryItemIds.length
        ? readOptionalArray(
            "gift_registry_purchases",
            admin.from("gift_registry_purchases").select("*").in("registry_item_id", registryItemIds),
            warnings
          )
        : Promise.resolve([]),
      readOptionalArray(
        "gift_cards_purchased",
        admin.from("gift_cards").select("*").eq("purchased_by", auth.userId).order("created_at", { ascending: false }),
        warnings
      ),
      userEmail
        ? readOptionalArray(
            "gift_cards_received",
            admin.from("gift_cards").select("*").eq("recipient_email", userEmail).order("created_at", { ascending: false }),
            warnings
          )
        : Promise.resolve([]),
      userEmail
        ? readOptionalArray(
            "contact_leads",
            admin
              .from("contact_leads")
              .select("id, full_name, company_name, email, phone, city, estimated_volume, message, lead_type, status, created_at, updated_at")
              .eq("email", userEmail)
              .order("created_at", { ascending: false })
              .limit(200),
            warnings
          )
        : Promise.resolve([]),
    ])

    const giftCardMap = new Map<string, any>()
    const mergedGiftCards = [...(giftCardsPurchased as any[]), ...(giftCardsReceived as any[])]
    for (const card of mergedGiftCards) {
      if (card?.id) giftCardMap.set(String(card.id), card)
    }
    const giftCards = Array.from(giftCardMap.values()) as any[]
    const giftCardIds = giftCards.map((card) => String(card?.id || "")).filter(Boolean)

    const giftCardTransactions = giftCardIds.length
      ? await readOptionalArray(
          "gift_card_transactions",
          admin.from("gift_card_transactions").select("*").in("gift_card_id", giftCardIds).order("created_at", { ascending: false }),
          warnings
        )
      : []

    return NextResponse.json(
      {
        success: true,
        export_version: 1,
        generated_at: new Date().toISOString(),
        user_id: auth.userId,
        warnings,
        data: {
          auth_user: {
            id: auth.userId,
            email: userEmail,
          },
          profile,
          shipping_addresses: shippingAddresses,
          orders,
          order_items: orderItems,
          wishlists,
          wishlist_items: wishlistItems,
          gift_registries: giftRegistries,
          gift_registry_items: registryItems,
          gift_registry_purchases: registryPurchases,
          gift_cards: giftCards,
          gift_card_transactions: giftCardTransactions,
          loyalty_points: loyaltyPoints,
          loyalty_transactions: loyaltyTransactions,
          notifications,
          notification_preferences: notificationPreferences,
          privacy_consent_events: consentEvents,
          privacy_data_requests: dataRequests,
          contact_leads: contactLeads,
        },
      },
      {
        headers: {
          "Cache-Control": "no-store",
        },
      }
    )
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "No se pudo preparar exportación",
      },
      { status: 500 }
    )
  }
}
