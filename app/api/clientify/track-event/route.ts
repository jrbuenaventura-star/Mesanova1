import { NextRequest, NextResponse } from "next/server"

const CLIENTIFY_API_URL = "https://api.clientify.net/v1"

export async function POST(request: NextRequest) {
  try {
    const apiKey = process.env.CLIENTIFY_API_KEY

    if (!apiKey) {
      console.error("CLIENTIFY_API_KEY not configured")
      return NextResponse.json(
        { error: "Clientify API not configured" },
        { status: 500 }
      )
    }

    const body = await request.json()
    const { email, event_name, event_data = {} } = body

    if (!email || !event_name) {
      return NextResponse.json(
        { error: "Email and event_name are required" },
        { status: 400 }
      )
    }

    // Buscar el contacto por email
    const searchResponse = await fetch(
      `${CLIENTIFY_API_URL}/contacts/?email=${encodeURIComponent(email)}`,
      {
        headers: {
          "Authorization": `Token ${apiKey}`,
        },
      }
    )

    if (!searchResponse.ok) {
      return NextResponse.json(
        { error: "Failed to find contact" },
        { status: 404 }
      )
    }

    const searchData = await searchResponse.json()

    if (!searchData.results || searchData.results.length === 0) {
      // Si no existe el contacto, crear uno básico
      const createResponse = await fetch(`${CLIENTIFY_API_URL}/contacts/`, {
        method: "POST",
        headers: {
          "Authorization": `Token ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          source: "web_tracking",
          status: "lead",
        }),
      })

      if (!createResponse.ok) {
        return NextResponse.json(
          { error: "Failed to create contact for tracking" },
          { status: 500 }
        )
      }
    }

    // Registrar la actividad/evento
    // Clientify usa "activities" para registrar eventos
    const contact = searchData.results?.[0]
    
    if (contact) {
      const activityResponse = await fetch(
        `${CLIENTIFY_API_URL}/contacts/${contact.id}/activities/`,
        {
          method: "POST",
          headers: {
            "Authorization": `Token ${apiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            type: "note",
            title: event_name,
            description: JSON.stringify(event_data, null, 2),
            done: true,
          }),
        }
      )

      if (activityResponse.ok) {
        return NextResponse.json({
          success: true,
          message: "Event tracked successfully",
        })
      }
    }

    return NextResponse.json({
      success: true,
      message: "Event received",
    })
  } catch (error) {
    console.error("Error tracking Clientify event:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
