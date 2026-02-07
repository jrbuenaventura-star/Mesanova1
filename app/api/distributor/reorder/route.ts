import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    const { orderId } = await request.json()

    if (!orderId) {
      return NextResponse.json({ error: "ID de orden requerido" }, { status: 400 })
    }

    // Obtener distribuidor
    const { data: distributor } = await supabase
      .from("distributors")
      .select("id")
      .eq("user_id", user.id)
      .single()

    if (!distributor) {
      return NextResponse.json({ error: "No eres distribuidor" }, { status: 403 })
    }

    // Obtener orden original con items
    const { data: originalOrder, error: orderError } = await supabase
      .from("orders")
      .select(`
        *,
        items:order_items(
          product_id,
          product_code,
          product_name,
          quantity,
          unit_price,
          discount_percentage,
          discount_amount,
          subtotal
        )
      `)
      .eq("id", orderId)
      .eq("distributor_id", distributor.id)
      .single()

    if (orderError || !originalOrder) {
      return NextResponse.json({ error: "Orden no encontrada" }, { status: 404 })
    }

    if (!originalOrder.items || originalOrder.items.length === 0) {
      return NextResponse.json({ error: "La orden original no tiene items" }, { status: 400 })
    }

    // Generar número de orden
    const orderNumber = `ORD-${Date.now().toString(36).toUpperCase()}`

    // Crear nueva orden como borrador
    const { data: newOrder, error: createError } = await supabase
      .from("orders")
      .insert({
        order_number: orderNumber,
        user_id: user.id,
        distributor_id: distributor.id,
        company_id: originalOrder.company_id,
        customer_name: originalOrder.customer_name,
        customer_email: originalOrder.customer_email,
        customer_phone: originalOrder.customer_phone,
        emisor: "distribuidor",
        status: "borrador",
        payment_status: "pending",
        subtotal: originalOrder.subtotal,
        discount_amount: originalOrder.discount_amount,
        discount_percentage: originalOrder.discount_percentage,
        tax_amount: originalOrder.tax_amount,
        iva_porcentaje: originalOrder.iva_porcentaje,
        shipping_cost: originalOrder.shipping_cost,
        total: originalOrder.total,
        shipping_full_name: originalOrder.shipping_full_name,
        shipping_phone: originalOrder.shipping_phone,
        shipping_address: originalOrder.shipping_address,
        shipping_city: originalOrder.shipping_city,
        shipping_state: originalOrder.shipping_state,
        notes: `Reorden basada en ${originalOrder.order_number}`,
      })
      .select()
      .single()

    if (createError || !newOrder) {
      console.error("Error creating reorder:", createError)
      return NextResponse.json({ error: "Error al crear la orden" }, { status: 500 })
    }

    // Copiar items
    const newItems = originalOrder.items.map((item: any) => ({
      order_id: newOrder.id,
      product_id: item.product_id,
      product_code: item.product_code,
      product_name: item.product_name,
      quantity: item.quantity,
      unit_price: item.unit_price,
      discount_percentage: item.discount_percentage || 0,
      discount_amount: item.discount_amount || 0,
      subtotal: item.subtotal,
    }))

    const { error: itemsError } = await supabase
      .from("order_items")
      .insert(newItems)

    if (itemsError) {
      console.error("Error copying order items:", itemsError)
    }

    return NextResponse.json({ 
      order: newOrder,
      message: "Reorden creada como borrador" 
    })
  } catch (error) {
    console.error("Error in POST /api/distributor/reorder:", error)
    return NextResponse.json({ error: "Error interno" }, { status: 500 })
  }
}
