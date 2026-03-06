const EMAIL_PATTERN = /([A-Z0-9._%+-]+)@([A-Z0-9.-]+\.[A-Z]{2,})/gi

export function maskIdentifier(value: string | null | undefined, visibleStart = 4, visibleEnd = 2) {
  if (!value) return "unknown"
  const normalized = String(value).trim()
  if (!normalized) return "unknown"
  if (normalized.length <= visibleStart + visibleEnd) {
    return `${normalized.slice(0, 1)}***`
  }
  const start = normalized.slice(0, visibleStart)
  const end = normalized.slice(-visibleEnd)
  return `${start}***${end}`
}

export function maskEmail(value: string | null | undefined) {
  if (!value) return "unknown"
  const normalized = String(value).trim().toLowerCase()
  if (!normalized.includes("@")) return "unknown"
  return normalized.replace(EMAIL_PATTERN, (_, localPart: string, domain: string) => {
    const maskedLocal =
      localPart.length <= 2
        ? `${localPart.slice(0, 1)}***`
        : `${localPart.slice(0, 2)}***${localPart.slice(-1)}`
    return `${maskedLocal}@${domain}`
  })
}

export function maskPhone(value: string | null | undefined) {
  if (!value) return "unknown"
  const digits = String(value).replace(/\D/g, "")
  if (!digits) return "unknown"
  if (digits.length <= 4) return `***${digits}`
  return `***${digits.slice(-4)}`
}

export function redactErrorMessage(error: unknown, fallback = "unknown_error") {
  if (!error) return fallback
  const message = error instanceof Error ? error.message : String(error)
  if (!message.trim()) return fallback
  return message
    .replace(EMAIL_PATTERN, "[redacted_email]")
    .replace(/(?:\+?\d[\d\s().-]{7,}\d)/g, "[redacted_phone]")
    .slice(0, 500)
}
