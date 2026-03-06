import { NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { enforceRateLimit, enforceSameOrigin } from "@/lib/security/api"

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export async function POST(request: Request) {
  try {
    const sameOriginResponse = enforceSameOrigin(request)
    if (sameOriginResponse) return sameOriginResponse

    const rateLimitResponse = await enforceRateLimit(request, {
      bucket: "contact-form",
      limit: 20,
      windowMs: 60_000,
    })
    if (rateLimitResponse) return rateLimitResponse

    const body = await request.json()
    const { nombre, empresa, email, telefono, ciudad, volumen, mensaje, tipo } = body

    if (!nombre || !email || !telefono) {
      return NextResponse.json(
        { error: "Faltan campos requeridos" },
        { status: 400 }
      )
    }

    if (!EMAIL_REGEX.test(String(email))) {
      return NextResponse.json(
        { error: "Email inválido" },
        { status: 400 }
      )
    }

    const supabase = createAdminClient()

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
