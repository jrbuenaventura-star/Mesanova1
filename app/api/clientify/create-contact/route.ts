import { NextRequest, NextResponse } from "next/server"
import { enforceRateLimit, enforceSameOrigin } from "@/lib/security/api"
import { redactErrorMessage } from "@/lib/security/redact"

const CLIENTIFY_API_URL = "https://api.clientify.net/v1"
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

interface ClientifyContact {
  email: string
  first_name?: string
  last_name?: string
  phone?: string
  company?: string
  city?: string
  status?: string
  tags?: string[]
  custom_fields?: Array<{ field: string; value: string }>
  owner?: string
  source?: string
}

export async function POST(request: NextRequest) {
  try {
    const sameOriginResponse = enforceSameOrigin(request)
    if (sameOriginResponse) return sameOriginResponse

    const rateLimitResponse = await enforceRateLimit(request, {
      bucket: "clientify-create-contact",
      limit: 40,
      windowMs: 60_000,
    })
    if (rateLimitResponse) return rateLimitResponse

    const apiKey = process.env.CLIENTIFY_API_KEY

    if (!apiKey) {
      console.error("CLIENTIFY_API_KEY not configured")
      return NextResponse.json(
        { error: "Clientify API not configured" },
        { status: 500 }
      )
    }

    const body = await request.json()
    const {
      email,
      first_name,
      last_name,
      phone,
      company,
      city,
      tags = [],
      custom_fields = {},
      source = "web",
      status = "lead",
    } = body

    if (!email) {
      return NextResponse.json(
        { error: "Email is required" },
        { status: 400 }
      )
    }

    if (!EMAIL_REGEX.test(String(email))) {
      return NextResponse.json(
        { error: "Invalid email format" },
        { status: 400 }
      )
    }

    // Preparar custom fields en formato de Clientify
    const formattedCustomFields = Object.entries(custom_fields).map(
      ([field, value]) => ({
        field,
        value: String(value),
      })
    )

    const contactData: ClientifyContact = {
      email,
      first_name,
      last_name,
      phone,
      company,
      city,
      status,
      tags,
      custom_fields: formattedCustomFields,
      source,
    }

    // Intentar crear o actualizar el contacto
    const response = await fetch(`${CLIENTIFY_API_URL}/contacts/`, {
      method: "POST",
      headers: {
        "Authorization": `Token ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(contactData),
    })

    if (!response.ok) {
      // Si el contacto ya existe (409), intentar actualizarlo
      if (response.status === 409) {
        // Buscar el contacto existente
        const searchResponse = await fetch(
          `${CLIENTIFY_API_URL}/contacts/?email=${encodeURIComponent(email)}`,
          {
            headers: {
              "Authorization": `Token ${apiKey}`,
            },
          }
        )

        if (searchResponse.ok) {
          const searchData = await searchResponse.json()
          if (searchData.results && searchData.results.length > 0) {
            const existingContact = searchData.results[0]

            // Actualizar el contacto existente
            const updateResponse = await fetch(
              `${CLIENTIFY_API_URL}/contacts/${existingContact.id}/`,
              {
                method: "PATCH",
                headers: {
                  "Authorization": `Token ${apiKey}`,
                  "Content-Type": "application/json",
                },
                body: JSON.stringify({
                  ...contactData,
                  tags: [...new Set([...(existingContact.tags || []), ...tags])],
                }),
              }
            )

            if (updateResponse.ok) {
              const updatedContact = await updateResponse.json()
              return NextResponse.json({
                success: true,
                action: "updated",
                contact: updatedContact,
              })
            }
          }
        }

        return NextResponse.json({
          success: true,
          action: "existing",
          message: "Contact already exists",
        })
      }

      console.error("Clientify API error")
      return NextResponse.json(
        { error: "Failed to create contact in Clientify" },
        { status: response.status }
      )
    }

    const data = await response.json()
    return NextResponse.json({
      success: true,
      action: "created",
      contact: data,
    })
  } catch (error) {
    console.error("Error creating Clientify contact:", redactErrorMessage(error))
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
