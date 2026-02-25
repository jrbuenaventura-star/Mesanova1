import "server-only"

import { createHash, createHmac, randomBytes, randomInt, timingSafeEqual } from "crypto"

import { DELIVERY_OTP_LENGTH } from "@/lib/delivery/constants"
import type { DeliveryOfflineHashInput, DeliveryTokenPayload } from "@/lib/delivery/types"

type DeliveryTokenHeader = {
  alg: "HS256"
  typ: "JWT"
}

function getDeliverySecret() {
  const secret = process.env.DELIVERY_QR_SECRET || process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!secret) {
    throw new Error("Missing DELIVERY_QR_SECRET")
  }
  return secret
}

function base64UrlEncode(value: string | Buffer) {
  return Buffer.from(value)
    .toString("base64")
    .replace(/=/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
}

function base64UrlDecode(value: string) {
  const normalized = value.replace(/-/g, "+").replace(/_/g, "/")
  const padding = normalized.length % 4 === 0 ? "" : "=".repeat(4 - (normalized.length % 4))
  return Buffer.from(normalized + padding, "base64").toString("utf8")
}

function sign(content: string) {
  return base64UrlEncode(createHmac("sha256", getDeliverySecret()).update(content).digest())
}

export function createDeliveryToken(payload: DeliveryTokenPayload) {
  const header: DeliveryTokenHeader = {
    alg: "HS256",
    typ: "JWT",
  }
  const encodedHeader = base64UrlEncode(JSON.stringify(header))
  const encodedPayload = base64UrlEncode(JSON.stringify(payload))
  const signature = sign(`${encodedHeader}.${encodedPayload}`)
  return `${encodedHeader}.${encodedPayload}.${signature}`
}

export function verifyDeliveryToken(token: string): DeliveryTokenPayload {
  const [encodedHeader, encodedPayload, encodedSignature] = token.split(".")
  if (!encodedHeader || !encodedPayload || !encodedSignature) {
    throw new Error("Invalid delivery token format")
  }

  const expectedSignature = sign(`${encodedHeader}.${encodedPayload}`)
  const signatureBuffer = Buffer.from(encodedSignature)
  const expectedBuffer = Buffer.from(expectedSignature)
  if (signatureBuffer.length !== expectedBuffer.length || !timingSafeEqual(signatureBuffer, expectedBuffer)) {
    throw new Error("Invalid delivery token signature")
  }

  const header = JSON.parse(base64UrlDecode(encodedHeader)) as DeliveryTokenHeader
  if (header.alg !== "HS256" || header.typ !== "JWT") {
    throw new Error("Unsupported delivery token header")
  }

  const payload = JSON.parse(base64UrlDecode(encodedPayload)) as DeliveryTokenPayload
  if (payload.typ !== "delivery_qr") {
    throw new Error("Invalid delivery token payload type")
  }

  const nowEpoch = Math.floor(Date.now() / 1000)
  if (payload.exp <= nowEpoch) {
    throw new Error("Delivery token expired")
  }

  return payload
}

export function createDeliveryNonce() {
  return randomBytes(16).toString("hex")
}

export function buildTokenFingerprint(token: string) {
  return createHash("sha256").update(token).digest("hex")
}

export function createSessionToken() {
  return randomBytes(24).toString("hex")
}

export function hashSessionToken(token: string) {
  return createHash("sha256").update(`${getDeliverySecret()}:${token}`).digest("hex")
}

export function generateOtpCode(length = DELIVERY_OTP_LENGTH) {
  const min = 10 ** (length - 1)
  const max = 10 ** length
  return String(randomInt(min, max))
}

export function hashOtpCode(otpCode: string, salt = randomBytes(8).toString("hex")) {
  const digest = createHash("sha256")
    .update(`${getDeliverySecret()}:${salt}:${otpCode}`)
    .digest("hex")
  return {
    salt,
    hash: digest,
  }
}

export function verifyOtpCode(otpCode: string, salt: string, expectedHash: string) {
  const { hash } = hashOtpCode(otpCode, salt)
  const hashBuffer = Buffer.from(hash)
  const expectedBuffer = Buffer.from(expectedHash)
  if (hashBuffer.length !== expectedBuffer.length) {
    return false
  }
  return timingSafeEqual(hashBuffer, expectedBuffer)
}

export function hashOfflineDeliveryEvent(input: DeliveryOfflineHashInput) {
  return createHash("sha256")
    .update(`${input.order_id}:${input.timestamp}:${input.gps}:${input.device_id}`)
    .digest("hex")
}

export function buildDeviceFingerprint(parts: {
  ip?: string | null
  userAgent?: string | null
  device?: string | null
}) {
  return createHash("sha256")
    .update(`${parts.ip || ""}|${parts.userAgent || ""}|${parts.device || ""}`)
    .digest("hex")
}
