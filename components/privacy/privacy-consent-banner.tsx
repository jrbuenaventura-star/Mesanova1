"use client"

import Link from "next/link"
import { useEffect, useState } from "react"
import { usePathname } from "next/navigation"

import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import {
  buildPrivacyConsent,
  parsePrivacyConsent,
  PRIVACY_CONSENT_COOKIE_MAX_AGE_SECONDS,
  PRIVACY_CONSENT_COOKIE_NAME,
  PRIVACY_CONSENT_STORAGE_KEY,
  PRIVACY_CONSENT_UPDATED_EVENT,
  serializePrivacyConsent,
  type PrivacyConsentPreferences,
} from "@/lib/privacy/consent"

function readCookieValue(name: string) {
  if (typeof document === "undefined") return null
  const match = document.cookie
    .split("; ")
    .find((cookie) => cookie.startsWith(`${name}=`))
  if (!match) return null
  return decodeURIComponent(match.slice(name.length + 1))
}

function readStoredConsent(): PrivacyConsentPreferences | null {
  if (typeof window === "undefined") return null

  const fromStorage = parsePrivacyConsent(window.localStorage.getItem(PRIVACY_CONSENT_STORAGE_KEY))
  if (fromStorage) return fromStorage

  const fromCookie = parsePrivacyConsent(readCookieValue(PRIVACY_CONSENT_COOKIE_NAME))
  if (fromCookie) return fromCookie

  return null
}

function persistConsentInBrowser(consent: PrivacyConsentPreferences) {
  if (typeof window === "undefined") return

  const serialized = serializePrivacyConsent(consent)
  window.localStorage.setItem(PRIVACY_CONSENT_STORAGE_KEY, serialized)
  document.cookie = `${PRIVACY_CONSENT_COOKIE_NAME}=${encodeURIComponent(serialized)}; path=/; max-age=${PRIVACY_CONSENT_COOKIE_MAX_AGE_SECONDS}; samesite=lax`
  window.dispatchEvent(new CustomEvent(PRIVACY_CONSENT_UPDATED_EVENT, { detail: consent }))
}

async function sendConsentAudit(consent: PrivacyConsentPreferences) {
  try {
    await fetch("/api/privacy/consent", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        analytics: consent.analytics,
        marketing: consent.marketing,
        source: consent.source,
        version: consent.version,
        updated_at: consent.updated_at,
      }),
    })
  } catch {
    // Consent capture in client should not fail due to telemetry endpoint issues.
  }
}

export function PrivacyConsentBanner() {
  const pathname = usePathname()
  const [mounted, setMounted] = useState(false)
  const [visible, setVisible] = useState(false)
  const [expanded, setExpanded] = useState(false)
  const [analytics, setAnalytics] = useState(false)
  const [marketing, setMarketing] = useState(false)

  useEffect(() => {
    const hiddenOnPaths = ["/admin", "/aliado", "/distributor"]
    if (hiddenOnPaths.some((path) => pathname.startsWith(path))) {
      setMounted(true)
      setVisible(false)
      return
    }

    const existingConsent = readStoredConsent()
    if (!existingConsent) {
      setVisible(true)
    } else {
      setAnalytics(existingConsent.analytics)
      setMarketing(existingConsent.marketing)
    }
    setMounted(true)
  }, [pathname])

  const saveConsent = async (next: { analytics: boolean; marketing: boolean }, source: "banner" | "settings") => {
    const consent = buildPrivacyConsent({
      analytics: next.analytics,
      marketing: next.marketing,
      source,
    })
    persistConsentInBrowser(consent)
    setAnalytics(consent.analytics)
    setMarketing(consent.marketing)
    setVisible(false)
    setExpanded(false)
    await sendConsentAudit(consent)
  }

  if (!mounted || !visible) return null

  return (
    <div className="fixed inset-x-0 bottom-0 z-[120] border-t bg-background/95 backdrop-blur">
      <div className="container mx-auto flex max-w-6xl flex-col gap-3 px-4 py-4">
        <div className="space-y-1">
          <p className="text-sm font-semibold">Privacidad y cookies</p>
          <p className="text-xs text-muted-foreground">
            Usamos cookies necesarias y, con tu permiso, cookies de analitica y marketing. Puedes cambiar esto en cualquier momento.
          </p>
          <p className="text-xs text-muted-foreground">
            Consulta nuestra{" "}
            <Link className="underline underline-offset-2" href="/privacidad">
              politica de tratamiento
            </Link>{" "}
            y{" "}
            <Link className="underline underline-offset-2" href="/cookies">
              politica de cookies
            </Link>
            .
          </p>
        </div>

        {expanded && (
          <div className="grid gap-3 rounded-md border p-3 md:grid-cols-2">
            <div className="space-y-1">
              <p className="text-sm font-medium">Necesarias</p>
              <p className="text-xs text-muted-foreground">Siempre activas para autenticacion, seguridad y carrito.</p>
            </div>
            <div className="flex items-center justify-end gap-2">
              <Checkbox checked disabled id="consent-necessary" />
              <Label htmlFor="consent-necessary">Activas</Label>
            </div>

            <div className="space-y-1">
              <p className="text-sm font-medium">Analitica</p>
              <p className="text-xs text-muted-foreground">Medicion de uso y rendimiento del sitio.</p>
            </div>
            <div className="flex items-center justify-end gap-2">
              <Checkbox
                id="consent-analytics"
                checked={analytics}
                onCheckedChange={(value) => setAnalytics(Boolean(value))}
              />
              <Label htmlFor="consent-analytics">Permitir</Label>
            </div>

            <div className="space-y-1">
              <p className="text-sm font-medium">Marketing</p>
              <p className="text-xs text-muted-foreground">Personalizacion comercial y seguimiento publicitario.</p>
            </div>
            <div className="flex items-center justify-end gap-2">
              <Checkbox
                id="consent-marketing"
                checked={marketing}
                onCheckedChange={(value) => setMarketing(Boolean(value))}
              />
              <Label htmlFor="consent-marketing">Permitir</Label>
            </div>
          </div>
        )}

        <div className="flex flex-wrap items-center gap-2">
          <Button size="sm" variant="outline" onClick={() => setExpanded((current) => !current)}>
            {expanded ? "Ocultar opciones" : "Personalizar"}
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => void saveConsent({ analytics: false, marketing: false }, "banner")}
          >
            Rechazar opcionales
          </Button>
          <Button size="sm" onClick={() => void saveConsent({ analytics: true, marketing: true }, "banner")}>
            Aceptar todo
          </Button>
          {expanded && (
            <Button
              size="sm"
              variant="secondary"
              onClick={() => void saveConsent({ analytics, marketing }, "settings")}
            >
              Guardar seleccion
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
