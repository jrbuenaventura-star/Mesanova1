import { createHash, timingSafeEqual } from "crypto"

import { NextResponse } from "next/server"

type RateLimitEntry = {
  count: number
  resetAt: number
}

type RateLimitOptions = {
  bucket: string
  limit: number
  windowMs: number
  keySuffix?: string | null
}

const rateLimitStore = new Map<string, RateLimitEntry>()

function getDefaultAllowedOrigins() {
  const fromEnv = (process.env.ALLOWED_ORIGINS || "")
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean)
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL?.trim()
  return new Set<string>(siteUrl ? [...fromEnv, siteUrl] : fromEnv)
}

function getClientIp(request: Request) {
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    request.headers.get("cf-connecting-ip") ||
    "unknown"
  )
}

export function enforceSameOrigin(request: Request) {
  const originHeader = request.headers.get("origin")
  if (!originHeader) {
    return null
  }

  const host = request.headers.get("x-forwarded-host") || request.headers.get("host")
  if (!host) {
    return NextResponse.json({ error: "Host header missing" }, { status: 400 })
  }

  let originHost: string
  try {
    originHost = new URL(originHeader).host
  } catch {
    return NextResponse.json({ error: "Invalid origin header" }, { status: 400 })
  }

  const allowedOrigins = getDefaultAllowedOrigins()
  if (originHost === host) {
    return null
  }

  if (allowedOrigins.has(originHeader)) {
    return null
  }

  return NextResponse.json({ error: "Forbidden origin" }, { status: 403 })
}

export function enforceRateLimit(request: Request, options: RateLimitOptions) {
  const now = Date.now()
  const ip = getClientIp(request)
  const suffix = options.keySuffix ? `:${options.keySuffix}` : ""
  const key = `${options.bucket}:${ip}${suffix}`
  const existing = rateLimitStore.get(key)

  if (!existing || now >= existing.resetAt) {
    rateLimitStore.set(key, {
      count: 1,
      resetAt: now + options.windowMs,
    })
    return null
  }

  if (existing.count >= options.limit) {
    const retryAfterSeconds = Math.max(1, Math.ceil((existing.resetAt - now) / 1000))
    return NextResponse.json(
      {
        error: "Too many requests",
        retry_after_seconds: retryAfterSeconds,
      },
      {
        status: 429,
        headers: {
          "Retry-After": String(retryAfterSeconds),
        },
      }
    )
  }

  existing.count += 1
  rateLimitStore.set(key, existing)
  return null
}

export function hashStableValue(value: string) {
  return createHash("sha256").update(value).digest("hex")
}

export function secureCompare(valueA: string, valueB: string) {
  const a = Buffer.from(valueA)
  const b = Buffer.from(valueB)
  if (a.length !== b.length) return false
  return timingSafeEqual(a, b)
}
