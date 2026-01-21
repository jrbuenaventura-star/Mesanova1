"use client"

import { useEffect } from "react"

export function CrossDomainLinker() {
  useEffect(() => {
    // Decorar enlaces salientes a dominios relacionados con parámetros de tracking
    const decorateLinks = () => {
      if (typeof window === "undefined" || !(window as any).gtag) return

      const domains = ["alumaronline.com", "checkout.wompi.co"]
      const links = document.querySelectorAll("a")

      links.forEach((link) => {
        const href = link.getAttribute("href")
        if (!href) return

        // Verificar si el enlace apunta a uno de nuestros dominios
        const isDomainMatch = domains.some((domain) => href.includes(domain))

        if (isDomainMatch && !(window as any)._decoratedLinks?.has(link)) {
          link.addEventListener("click", (e) => {
            if ((window as any).gtag) {
              ;(window as any).gtag("event", "click", {
                event_category: "outbound",
                event_label: href,
                transport_type: "beacon",
              })
            }
          })

          // Marcar como decorado
          if (!(window as any)._decoratedLinks) {
            ;(window as any)._decoratedLinks = new Set()
          }
          ;(window as any)._decoratedLinks.add(link)
        }
      })
    }

    // Ejecutar al cargar y cuando cambie el DOM
    decorateLinks()
    const observer = new MutationObserver(decorateLinks)
    observer.observe(document.body, { childList: true, subtree: true })

    return () => observer.disconnect()
  }, [])

  return null
}
