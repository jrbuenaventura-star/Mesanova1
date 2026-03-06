import { NextResponse } from "next/server"

import { createAdminClient } from "@/lib/supabase/admin"

export async function GET() {
  const admin = createAdminClient()
  const { data, error } = await admin
    .from("gift_card_products")
    .select("id, name, slug, description, amount, image_url, allow_custom_amount, min_custom_amount, max_custom_amount, sort_order")
    .eq("is_active", true)
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: false })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true, products: data || [] })
}
