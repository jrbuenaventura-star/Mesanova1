const PROMPT_FIELD_MAX_LENGTH_DEFAULT = 320
const MODEL_TEXT_MAX_LENGTH_DEFAULT = 800

const INCLUDE_EXACT_MESANOVA_PRICE = /^(1|true|yes)$/i.test(
  process.env.PRICE_INTEL_INCLUDE_EXACT_MESANOVA_PRICE || ""
)
const SOURCE_DOMAIN_ALLOWLIST = (process.env.PRICE_INTEL_ALLOWED_SOURCE_DOMAINS || "")
  .split(",")
  .map((value) => value.trim().toLowerCase())
  .filter(Boolean)
const ALLOW_HTTP_SOURCES = /^(1|true|yes)$/i.test(process.env.PRICE_INTEL_ALLOW_HTTP_SOURCES || "")

function normalizeWhitespace(value: string) {
  return value.replace(/\s+/g, " ").trim()
}

function isPrivateOrLocalHost(hostname: string) {
  const normalized = hostname.toLowerCase()
  if (
    normalized === "localhost" ||
    normalized.endsWith(".local") ||
    normalized.endsWith(".internal")
  ) {
    return true
  }

  const ipv4Match = normalized.match(/^(\d{1,3}\.){3}\d{1,3}$/)
  if (!ipv4Match) return false

  const parts = normalized.split(".").map((part) => Number(part))
  if (parts.some((part) => !Number.isInteger(part) || part < 0 || part > 255)) return true

  if (parts[0] === 10) return true
  if (parts[0] === 127) return true
  if (parts[0] === 169 && parts[1] === 254) return true
  if (parts[0] === 172 && parts[1] >= 16 && parts[1] <= 31) return true
  if (parts[0] === 192 && parts[1] === 168) return true
  return false
}

export function sanitizePromptField(value: string | null | undefined, maxLength = PROMPT_FIELD_MAX_LENGTH_DEFAULT) {
  if (!value) return ""
  return normalizeWhitespace(String(value))
    .replace(/[\u0000-\u001f\u007f-\u009f]/g, " ")
    .replace(/[<>`]/g, "")
    .slice(0, Math.max(1, maxLength))
}

export function sanitizeModelText(value: string | null | undefined, maxLength = MODEL_TEXT_MAX_LENGTH_DEFAULT) {
  if (!value) return ""
  return normalizeWhitespace(String(value))
    .replace(/[\u0000-\u001f\u007f-\u009f]/g, " ")
    .slice(0, Math.max(1, maxLength))
}

function buildPriceRangeLabel(price: number) {
  if (!Number.isFinite(price) || price <= 0) return "N/D"
  const roundedStep = 5_000
  const lower = Math.max(0, Math.floor(price / roundedStep) * roundedStep)
  const upper = lower + roundedStep
  return `${lower.toLocaleString("es-CO")} - ${upper.toLocaleString("es-CO")} COP`
}

export function buildMesanovaPricePromptContext(price: number | null | undefined) {
  const numericPrice = Number(price || 0)
  if (!Number.isFinite(numericPrice) || numericPrice <= 0) return "N/D"
  if (INCLUDE_EXACT_MESANOVA_PRICE) {
    return `${Math.round(numericPrice).toLocaleString("es-CO")} COP`
  }
  return `Rango aproximado: ${buildPriceRangeLabel(numericPrice)}`
}

function isAllowedSourceHost(hostname: string) {
  if (SOURCE_DOMAIN_ALLOWLIST.length === 0) return true
  return SOURCE_DOMAIN_ALLOWLIST.some(
    (domain) => hostname === domain || hostname.endsWith(`.${domain}`)
  )
}

export function normalizeAndValidateSourceUrl(raw: string | null | undefined): string | undefined {
  if (!raw) return undefined
  const cleaned = sanitizeModelText(raw, 2000)
  if (!cleaned) return undefined

  let parsed: URL
  try {
    parsed = new URL(cleaned)
  } catch {
    return undefined
  }

  const protocol = parsed.protocol.toLowerCase()
  if (protocol !== "https:" && !(ALLOW_HTTP_SOURCES && protocol === "http:")) {
    return undefined
  }

  const host = parsed.hostname.toLowerCase()
  if (!host || isPrivateOrLocalHost(host) || !isAllowedSourceHost(host)) {
    return undefined
  }

  parsed.hash = ""
  return parsed.toString()
}

export function sanitizeModelOutputForStorage(raw: string, maxChars: number) {
  return normalizeWhitespace(raw)
    .slice(0, Math.max(200, maxChars))
    .replace(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi, "[redacted_email]")
    .replace(/(?:\+?\d[\d\s().-]{7,}\d)/g, "[redacted_phone]")
}
