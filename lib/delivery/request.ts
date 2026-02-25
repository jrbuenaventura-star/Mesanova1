import { headers } from "next/headers"

export async function getRequestContext() {
  const requestHeaders = await headers()
  const ip =
    requestHeaders.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    requestHeaders.get("x-real-ip") ||
    requestHeaders.get("cf-connecting-ip") ||
    null

  const userAgent = requestHeaders.get("user-agent") || null
  const requestId = requestHeaders.get("x-request-id") || requestHeaders.get("cf-ray") || null

  return {
    ip,
    userAgent,
    requestId,
  }
}
