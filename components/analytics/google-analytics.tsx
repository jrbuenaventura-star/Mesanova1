"use client"

import Script from "next/script"

export function GoogleAnalytics({ gaId }: { gaId: string }) {
  if (!gaId) return null

  return (
    <>
      <Script
        strategy="afterInteractive"
        src={`https://www.googletagmanager.com/gtag/js?id=${gaId}`}
      />
      <Script
        id="google-analytics"
        strategy="afterInteractive"
        dangerouslySetInnerHTML={{
          __html: `
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', '${gaId}', {
              page_path: window.location.pathname,
              linker: {
                domains: ['mesanova.co', 'alumaronline.com', 'checkout.wompi.co']
              },
              allow_google_signals: true,
              allow_ad_personalization_signals: true
            });
          `,
        }}
      />
    </>
  )
}

// Helper para disparar eventos
export const trackEvent = (eventName: string, eventParams?: Record<string, any>) => {
  if (typeof window !== "undefined" && (window as any).gtag) {
    (window as any).gtag("event", eventName, eventParams)
  }
}

// Eventos ecommerce específicos
export const trackViewItem = (item: {
  item_id: string
  item_name: string
  price: number
  currency?: string
}) => {
  trackEvent("view_item", {
    currency: item.currency || "COP",
    value: item.price,
    items: [
      {
        item_id: item.item_id,
        item_name: item.item_name,
        price: item.price,
      },
    ],
  })
}

export const trackAddToCart = (item: {
  item_id: string
  item_name: string
  price: number
  quantity: number
  currency?: string
}) => {
  trackEvent("add_to_cart", {
    currency: item.currency || "COP",
    value: item.price * item.quantity,
    items: [
      {
        item_id: item.item_id,
        item_name: item.item_name,
        price: item.price,
        quantity: item.quantity,
      },
    ],
  })
}

export const trackBeginCheckout = (items: any[], value: number, currency = "COP") => {
  trackEvent("begin_checkout", {
    currency,
    value,
    items,
  })
}

export const trackPurchase = (
  transactionId: string,
  value: number,
  items: any[],
  currency = "COP"
) => {
  trackEvent("purchase", {
    transaction_id: transactionId,
    value,
    currency,
    items,
  })
}
