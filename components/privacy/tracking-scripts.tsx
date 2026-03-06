"use client"

import { useEffect, useState } from "react"

import { CrossDomainLinker } from "@/components/analytics/cross-domain-linker"
import { GoogleAnalytics } from "@/components/analytics/google-analytics"
import { MetaPixel } from "@/components/analytics/meta-pixel"
import { ClientifyTracking } from "@/components/clientify/clientify-tracking"
import { parsePrivacyConsent, PRIVACY_CONSENT_STORAGE_KEY, PRIVACY_CONSENT_UPDATED_EVENT } from "@/lib/privacy/consent"

type TrackingScriptsProps = {
  gaId?: string
  pixelId?: string
}

function readConsentFlags() {
  if (typeof window === "undefined") {
    return { analytics: false, marketing: false }
  }

  const parsed = parsePrivacyConsent(window.localStorage.getItem(PRIVACY_CONSENT_STORAGE_KEY))
  if (!parsed) {
    return { analytics: false, marketing: false }
  }

  return { analytics: parsed.analytics, marketing: parsed.marketing }
}

export function TrackingScripts({ gaId, pixelId }: TrackingScriptsProps) {
  const [ready, setReady] = useState(false)
  const [analyticsEnabled, setAnalyticsEnabled] = useState(false)
  const [marketingEnabled, setMarketingEnabled] = useState(false)

  useEffect(() => {
    const applyConsent = () => {
      const flags = readConsentFlags()
      setAnalyticsEnabled(flags.analytics)
      setMarketingEnabled(flags.marketing)
      setReady(true)
    }

    applyConsent()

    const onConsentUpdate = () => applyConsent()
    window.addEventListener(PRIVACY_CONSENT_UPDATED_EVENT, onConsentUpdate)
    window.addEventListener("storage", onConsentUpdate)

    return () => {
      window.removeEventListener(PRIVACY_CONSENT_UPDATED_EVENT, onConsentUpdate)
      window.removeEventListener("storage", onConsentUpdate)
    }
  }, [])

  if (!ready) return null

  return (
    <>
      {analyticsEnabled && gaId && <GoogleAnalytics gaId={gaId} />}
      {analyticsEnabled && <CrossDomainLinker />}
      {marketingEnabled && pixelId && <MetaPixel pixelId={pixelId} />}
      {marketingEnabled && <ClientifyTracking />}
    </>
  )
}
