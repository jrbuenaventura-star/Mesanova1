import "server-only"

import type { DeliveryOtpChannel } from "@/lib/delivery/types"

type SendDeliveryOtpInput = {
  channel: DeliveryOtpChannel
  destination: string
  otpCode: string
  orderId: string
}

export async function sendDeliveryOtp(input: SendDeliveryOtpInput) {
  const webhookUrl = process.env.DELIVERY_OTP_WEBHOOK_URL

  if (!webhookUrl) {
    // Fallback for local/staging environments.
    console.info(
      `[delivery.otp] ${input.channel.toUpperCase()} -> ${input.destination} | order=${input.orderId} | otp=${input.otpCode}`
    )
    return { ok: true as const, provider: "console" as const }
  }

  const response = await fetch(webhookUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-delivery-otp-token": process.env.DELIVERY_OTP_WEBHOOK_TOKEN || "",
    },
    body: JSON.stringify({
      channel: input.channel,
      destination: input.destination,
      message: `Código de verificación Mesanova: ${input.otpCode}. Vigente por 10 minutos.`,
      order_id: input.orderId,
    }),
  })

  if (!response.ok) {
    const body = await response.text()
    throw new Error(`OTP provider request failed (${response.status}): ${body}`)
  }

  return { ok: true as const, provider: "webhook" as const }
}
