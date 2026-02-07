import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function POST(request: Request) {
  try {
    const { productId, email } = await request.json()

    if (!productId || !email) {
      return NextResponse.json({ error: "Producto y email son requeridos" }, { status: 400 })
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json({ error: "Email inválido" }, { status: 400 })
    }

    const supabase = await createClient()

    // Verificar si ya existe una suscripción
    const { data: existing } = await supabase
      .from("stock_notifications")
      .select("id")
      .eq("product_id", productId)
      .eq("email", email)
      .eq("notified", false)
      .single()

    if (existing) {
      return NextResponse.json({ message: "Ya estás suscrito para este producto" })
    }

    // Crear suscripción
    const { error } = await supabase
      .from("stock_notifications")
      .insert({
        product_id: productId,
        email,
        notified: false,
      })

    if (error) {
      // Si la tabla no existe, guardar en contacto_stock_alerts como fallback
      console.error("Error creating stock notification:", error)
      return NextResponse.json({ error: "Error al registrarse. Intenta más tarde." }, { status: 500 })
    }

    return NextResponse.json({ message: "Suscripción creada" })
  } catch (error) {
    console.error("Error in POST /api/stock-notifications:", error)
    return NextResponse.json({ error: "Error interno" }, { status: 500 })
  }
}
