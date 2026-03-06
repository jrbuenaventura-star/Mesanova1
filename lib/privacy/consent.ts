export type PrivacyConsentSource = "banner" | "settings" | "migration"

export interface PrivacyConsentPreferences {
  necessary: true
  analytics: boolean
  marketing: boolean
  updated_at: string
  source: PrivacyConsentSource
  version: number
}

export const PRIVACY_CONSENT_STORAGE_KEY = "mesanova.privacy.consent.v1"
export const PRIVACY_CONSENT_COOKIE_NAME = "mesanova_privacy_consent"
export const PRIVACY_CONSENT_COOKIE_MAX_AGE_SECONDS = 180 * 24 * 60 * 60
export const PRIVACY_CONSENT_VERSION = 1
export const PRIVACY_CONSENT_UPDATED_EVENT = "privacy-consent-updated"

type UnknownRecord = Record<string, unknown>

function isObject(value: unknown): value is UnknownRecord {
  return typeof value === "object" && value !== null
}

export function buildPrivacyConsent(
  input?: Partial<Pick<PrivacyConsentPreferences, "analytics" | "marketing" | "source">>
): PrivacyConsentPreferences {
  return {
    necessary: true,
    analytics: !!input?.analytics,
    marketing: !!input?.marketing,
    source: input?.source || "banner",
    version: PRIVACY_CONSENT_VERSION,
    updated_at: new Date().toISOString(),
  }
}

export function normalizePrivacyConsent(value: unknown): PrivacyConsentPreferences | null {
  if (!isObject(value)) return null
  const analytics = value.analytics
  const marketing = value.marketing
  const source = value.source
  const updatedAt = value.updated_at
  const version = value.version

  if (typeof analytics !== "boolean" || typeof marketing !== "boolean") return null
  if (typeof updatedAt !== "string" || !updatedAt.trim()) return null
  if (typeof version !== "number") return null

  const normalizedSource: PrivacyConsentSource =
    source === "banner" || source === "settings" || source === "migration" ? source : "banner"

  return {
    necessary: true,
    analytics,
    marketing,
    source: normalizedSource,
    version,
    updated_at: updatedAt,
  }
}

export function parsePrivacyConsent(raw: string | null | undefined): PrivacyConsentPreferences | null {
  if (!raw) return null
  try {
    const parsed = JSON.parse(raw)
    return normalizePrivacyConsent(parsed)
  } catch {
    return null
  }
}

export function serializePrivacyConsent(consent: PrivacyConsentPreferences) {
  return JSON.stringify(consent)
}
