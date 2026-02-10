const CLIENTIFY_API_URL = "https://api.clientify.net/v1"

interface ClientifyContactPayload {
  email: string
  first_name?: string
  last_name?: string
  phone?: string
  company?: string
  city?: string
  status?: string
  tags?: string[]
  custom_fields?: Array<{ field: string; value: string }>
  source?: string
}

export interface SyncClientData {
  email: string
  fullName?: string
  phone?: string
  companyName?: string
  businessType?: string
  city?: string
  state?: string
  aliadoName?: string
  segment?: string
  totalSpent?: number
  orderCount?: number
  avgOrderValue?: number
  lastPurchaseDate?: string
  isDistributor?: boolean
}

/**
 * Upsert a client contact in Clientify.
 * Creates the contact if it doesn't exist, updates if it does.
 */
export async function syncClientToClientify(data: SyncClientData): Promise<{
  success: boolean
  action: "created" | "updated" | "skipped"
  error?: string
}> {
  const apiKey = process.env.CLIENTIFY_API_KEY

  if (!apiKey) {
    return { success: false, action: "skipped", error: "CLIENTIFY_API_KEY not configured" }
  }

  if (!data.email) {
    return { success: false, action: "skipped", error: "Email is required" }
  }

  const nameParts = (data.fullName || "").split(" ")
  const firstName = nameParts[0] || ""
  const lastName = nameParts.slice(1).join(" ") || ""

  const tags = ["cliente-mesanova"]
  if (data.businessType) tags.push(`tipo-${data.businessType.toLowerCase().replace(/\s+/g, "-")}`)
  if (data.aliadoName) tags.push(`aliado-${data.aliadoName.toLowerCase().replace(/\s+/g, "-")}`)
  if (data.segment) tags.push(`segmento-${data.segment.toLowerCase().replace(/\s+/g, "-")}`)
  if (data.isDistributor) tags.push("distribuidor")

  const customFields: Array<{ field: string; value: string }> = []
  if (data.companyName) customFields.push({ field: "empresa", value: data.companyName })
  if (data.businessType) customFields.push({ field: "tipo_negocio", value: data.businessType })
  if (data.aliadoName) customFields.push({ field: "aliado", value: data.aliadoName })
  if (data.segment) customFields.push({ field: "segmento_rfm", value: data.segment })
  if (data.totalSpent !== undefined) customFields.push({ field: "total_gastado", value: data.totalSpent.toFixed(0) })
  if (data.orderCount !== undefined) customFields.push({ field: "total_ordenes", value: String(data.orderCount) })
  if (data.avgOrderValue !== undefined) customFields.push({ field: "ticket_promedio", value: data.avgOrderValue.toFixed(0) })
  if (data.lastPurchaseDate) customFields.push({ field: "ultima_compra", value: data.lastPurchaseDate })
  if (data.state) customFields.push({ field: "departamento", value: data.state })

  const contactData: ClientifyContactPayload = {
    email: data.email,
    first_name: firstName,
    last_name: lastName,
    phone: data.phone,
    company: data.companyName,
    city: data.city,
    status: "customer",
    tags,
    custom_fields: customFields,
    source: "mesanova_crm",
  }

  try {
    // Try to create
    const createRes = await fetch(`${CLIENTIFY_API_URL}/contacts/`, {
      method: "POST",
      headers: {
        Authorization: `Token ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(contactData),
    })

    if (createRes.ok) {
      return { success: true, action: "created" }
    }

    // If 409, contact exists — update it
    if (createRes.status === 409) {
      const searchRes = await fetch(
        `${CLIENTIFY_API_URL}/contacts/?email=${encodeURIComponent(data.email)}`,
        { headers: { Authorization: `Token ${apiKey}` } }
      )

      if (searchRes.ok) {
        const searchData = await searchRes.json()
        if (searchData.results?.length > 0) {
          const existingId = searchData.results[0].id
          const existingTags = searchData.results[0].tags || []

          const updateRes = await fetch(`${CLIENTIFY_API_URL}/contacts/${existingId}/`, {
            method: "PATCH",
            headers: {
              Authorization: `Token ${apiKey}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              ...contactData,
              tags: [...new Set([...existingTags, ...tags])],
            }),
          })

          if (updateRes.ok) {
            return { success: true, action: "updated" }
          }

          const errText = await updateRes.text()
          return { success: false, action: "skipped", error: `Update failed: ${errText}` }
        }
      }

      return { success: true, action: "updated" }
    }

    const errText = await createRes.text()
    return { success: false, action: "skipped", error: `Create failed (${createRes.status}): ${errText}` }
  } catch (error) {
    return {
      success: false,
      action: "skipped",
      error: error instanceof Error ? error.message : "Unknown error",
    }
  }
}
