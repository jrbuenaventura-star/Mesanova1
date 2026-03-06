"use client"

import { useEffect, useState, type ReactNode } from "react"

import { parsePrivacyConsent, PRIVACY_CONSENT_STORAGE_KEY, PRIVACY_CONSENT_UPDATED_EVENT } from "@/lib/privacy/consent"

type ConsentCategory = "analytics" | "marketing"

type ConsentGateProps = {
  category: ConsentCategory
  children: ReactNode
}

function readCategoryConsent(category: ConsentCategory) {
  if (typeof window === "undefined") return false
  const parsed = parsePrivacyConsent(window.localStorage.getItem(PRIVACY_CONSENT_STORAGE_KEY))
  if (!parsed) return false
  return category === "analytics" ? parsed.analytics : parsed.marketing
}

export function ConsentGate({ category, children }: ConsentGateProps) {
  const [allowed, setAllowed] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    const apply = () => {
      setAllowed(readCategoryConsent(category))
      setMounted(true)
    }

    apply()
    window.addEventListener(PRIVACY_CONSENT_UPDATED_EVENT, apply)
    window.addEventListener("storage", apply)

    return () => {
      window.removeEventListener(PRIVACY_CONSENT_UPDATED_EVENT, apply)
      window.removeEventListener("storage", apply)
    }
  }, [category])

  if (!mounted || !allowed) return null
  return <>{children}</>
}
