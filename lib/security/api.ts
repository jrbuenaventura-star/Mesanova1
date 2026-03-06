import { createHash, timingSafeEqual } from "crypto"

import { NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/admin"

type RateLimitEntry = {
  count: number
  resetAt: number
}

type RateLimitBackend = "auto" | "memory" | "supabase"

type RateLimitOptions = {
  bucket: string
  limit: number
  windowMs: number
  keySuffix?: string | null
  backend?: RateLimitBackend
}

const rateLimitStore = new Map<string, RateLimitEntry>()
const RATE_LIMIT_RPC_NAME = "enforce_api_rate_limit"
const DISTRIBUTED_BACKEND_FROM_ENV = (process.env.RATE_LIMIT_BACKEND || "auto").toLowerCase()
const RATE_LIMIT_BACKEND: RateLimitBackend =
  DISTRIBUTED_BACKEND_FROM_ENV === "memory" ||
  DISTRIBUTED_BACKEND_FROM_ENV === "supabase" ||
  DISTRIBUTED_BACKEND_FROM_ENV === "auto"
    ? DISTRIBUTED_BACKEND_FROM_ENV
    : "auto"
let lastDistributedWarningAt = 0

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

function warnDistributedRateLimitFallback(message: string) {
  const now = Date.now()
  if (now - lastDistributedWarningAt < 60_000) return
  lastDistributedWarningAt = now
  console.warn(`[security.rate_limit] ${message}`)
}

function buildRateLimitResponse(retryAfterSeconds: number) {
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

function enforceInMemoryRateLimit(key: string, options: RateLimitOptions, now: number) {
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
    return buildRateLimitResponse(retryAfterSeconds)
  }

  existing.count += 1
  rateLimitStore.set(key, existing)
  return null
}

async function enforceDistributedRateLimit(input: {
  bucket: string
  key: string
  limit: number
  windowMs: number
}) {
  try {
    const supabaseAdmin = createAdminClient()
    const windowSeconds = Math.max(1, Math.ceil(input.windowMs / 1000))
    const { data, error } = await supabaseAdmin.rpc(RATE_LIMIT_RPC_NAME, {
      p_bucket: input.bucket,
      p_subject: input.key,
      p_limit: input.limit,
      p_window_seconds: windowSeconds,
    })

    if (error) {
      warnDistributedRateLimitFallback(`rpc_error ${error.message}`)
      return { handled: false as const, response: null }
    }

    const row = Array.isArray(data) ? data[0] : data
    if (!row || typeof row.allowed !== "boolean") {
      warnDistributedRateLimitFallback("rpc_invalid_response")
      return { handled: false as const, response: null }
    }

    if (row.allowed) {
      return { handled: true as const, response: null }
    }

    const retryAfterSeconds = Math.max(1, Number(row.retry_after_seconds || 1))
    return {
      handled: true as const,
      response: buildRateLimitResponse(retryAfterSeconds),
    }
  } catch (error) {
    warnDistributedRateLimitFallback(
      `unexpected_error ${error instanceof Error ? error.message : "unknown"}`
    )
    return { handled: false as const, response: null }
  }
}

export async function enforceRateLimit(request: Request, options: RateLimitOptions) {
  const now = Date.now()
  const ip = getClientIp(request)
  const suffix = options.keySuffix ? `:${options.keySuffix}` : ""
  const subjectKey = `${ip}${suffix}`
  const memoryKey = `${options.bucket}:${subjectKey}`
  const backend = options.backend || RATE_LIMIT_BACKEND

  if (backend !== "memory") {
    const distributedResult = await enforceDistributedRateLimit({
      bucket: options.bucket,
      key: subjectKey,
      limit: options.limit,
      windowMs: options.windowMs,
    })
    if (distributedResult.handled) {
      return distributedResult.response
    }
  }

  return enforceInMemoryRateLimit(memoryKey, options, now)
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
