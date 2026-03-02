import "server-only"

export type SendWhatsAppMessageInput = {
  destination: string
  message: string
  context?: string
}

function normalizePhone(destination: string) {
  const cleaned = destination.replace(/[^+0-9]/g, "")
  if (!cleaned) return ""
  if (cleaned.startsWith("+")) return cleaned
  return `+${cleaned}`
}

export async function sendWhatsAppMessage(input: SendWhatsAppMessageInput) {
  const webhookUrl = process.env.DELIVERY_OTP_WEBHOOK_URL
  const destination = normalizePhone(input.destination)

  if (!destination) {
    return { ok: false as const, reason: "invalid_destination" as const }
  }

  if (!webhookUrl) {
    console.info(`[whatsapp.notifications] webhook_not_configured destination=${destination}`)
    return { ok: false as const, reason: "missing_webhook" as const }
  }

  try {
    const response = await fetch(webhookUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-delivery-otp-token": process.env.DELIVERY_OTP_WEBHOOK_TOKEN || "",
      },
      body: JSON.stringify({
        channel: "whatsapp",
        destination,
        message: input.message,
        context: input.context || "wishlist_price_change",
      }),
    })

    if (!response.ok) {
      const body = await response.text()
      return {
        ok: false as const,
        reason: "provider_error" as const,
        error: `Request failed (${response.status}): ${body}`,
      }
    }

    return { ok: true as const }
  } catch (error) {
    return {
      ok: false as const,
      reason: "network_error" as const,
      error: error instanceof Error ? error.message : "Unknown error",
    }
  }
}
