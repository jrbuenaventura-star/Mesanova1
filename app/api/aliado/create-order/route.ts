import { NextResponse } from "next/server"

import { createAdminClient } from "@/lib/supabase/admin"
import { createClient } from "@/lib/supabase/server"

type OrderItem = {
  product_id: string
  product_code: string
  product_name: string
  quantity: number
  unit_price: number
  discount_percentage: number
  subtotal: number
}

type CreateAliadoOrderBody = {
  aliado_id: string
  distributor_id: string
  distributor_user_id: string
  distributor_company_name: string
  distributor_contact_email?: string
  distributor_contact_phone?: string
  discount_percentage: number
  notes?: string
  items: OrderItem[]
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { data: profile } = await supabase.from("user_profiles").select("role").eq("id", user.id).single()

    if (profile?.role !== "aliado" && profile?.role !== "superadmin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const body = (await request.json()) as CreateAliadoOrderBody

    if (!body.aliado_id || !body.distributor_id || !body.distributor_user_id) {
      return NextResponse.json({ error: "Missing distributor/aliado data" }, { status: 400 })
    }

    if (!Array.isArray(body.items) || body.items.length === 0) {
      return NextResponse.json({ error: "Order must include items" }, { status: 400 })
    }

    const admin = createAdminClient()

    const total = body.items.reduce((sum, i) => sum + Number(i.subtotal || 0), 0)

    const { data: order, error: orderError } = await admin
      .from("orders")
      .insert({
        user_id: body.distributor_user_id,
        distributor_id: body.distributor_id,
        aliado_id: body.aliado_id,
        status: "por_aprobar",
        subtotal: total,
        discount_percentage: body.discount_percentage,
        shipping_cost: 0,
        total,
        notes: body.notes || null,
        customer_name: body.distributor_company_name,
        customer_email: body.distributor_contact_email || "",
        customer_phone: body.distributor_contact_phone || "",
        shipping_address: "Por definir",
        shipping_city: "Por definir",
        payment_method: "Por definir",
        shipping_method: "Por definir",
        items: body.items,
      })
      .select()
      .single()

    if (orderError || !order) {
      return NextResponse.json({ error: orderError?.message || "Failed to create order" }, { status: 400 })
    }

    return NextResponse.json({ success: true, order })
  } catch (e) {
    const message = e instanceof Error ? e.message : "Unknown error"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
