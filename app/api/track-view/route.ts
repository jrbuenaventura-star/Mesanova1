import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { productId } = await request.json()

    if (!productId) {
      return NextResponse.json({ error: "Product ID required" }, { status: 400 })
    }

    // Usar la función de Supabase para upsert
    const { error } = await supabase.rpc("upsert_recently_viewed", {
      p_user_id: user.id,
      p_product_id: productId,
    })

    if (error) {
      console.error("Error tracking view:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error in track-view:", error)
    return NextResponse.json({ error: "Internal error" }, { status: 500 })
  }
}
