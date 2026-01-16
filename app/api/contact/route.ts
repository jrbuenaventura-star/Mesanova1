import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { nombre, empresa, email, telefono, ciudad, volumen, mensaje, tipo } = body

    if (!nombre || !email || !telefono) {
      return NextResponse.json(
        { error: "Faltan campos requeridos" },
        { status: 400 }
      )
    }

    const supabase = await createClient()

    const { data, error } = await supabase
      .from("contact_leads")
      .insert({
        full_name: nombre,
        company_name: empresa,
        email,
        phone: telefono,
        city: ciudad,
        estimated_volume: volumen,
        message: mensaje,
        lead_type: tipo || "general",
        status: "new",
      })
      .select()
      .single()

    if (error) {
      return NextResponse.json(
        { error: "Error al guardar la información" },
        { status: 500 }
      )
    }

    return NextResponse.json(
      { 
        success: true, 
        message: "Solicitud enviada exitosamente",
        data 
      },
      { status: 200 }
    )
  } catch (error) {
    return NextResponse.json(
      { error: "Error al procesar la solicitud" },
      { status: 500 }
    )
  }
}
