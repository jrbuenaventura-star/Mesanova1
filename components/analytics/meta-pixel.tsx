"use client"

import Script from "next/script"

export function MetaPixel({ pixelId }: { pixelId: string }) {
  if (!pixelId) return null

  return (
    <>
      <Script
        id="meta-pixel"
        strategy="afterInteractive"
        dangerouslySetInnerHTML={{
          __html: `
            !function(f,b,e,v,n,t,s)
            {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
            n.callMethod.apply(n,arguments):n.queue.push(arguments)};
            if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
            n.queue=[];t=b.createElement(e);t.async=!0;
            t.src=v;s=b.getElementsByTagName(e)[0];
            s.parentNode.insertBefore(t,s)}(window, document,'script',
            'https://connect.facebook.net/en_US/fbevents.js');
            fbq('init', '${pixelId}');
            fbq('track', 'PageView');
          `,
        }}
      />
      <noscript>
        <img
          height="1"
          width="1"
          style={{ display: "none" }}
          src={`https://www.facebook.com/tr?id=${pixelId}&ev=PageView&noscript=1`}
          alt=""
        />
      </noscript>
    </>
  )
}

// Helper para disparar eventos
export const trackPixelEvent = (eventName: string, eventParams?: Record<string, any>) => {
  if (typeof window !== "undefined" && (window as any).fbq) {
    (window as any).fbq("track", eventName, eventParams)
  }
}

// Eventos específicos de Meta
export const trackPixelViewContent = (contentId: string, contentName: string, value: number) => {
  trackPixelEvent("ViewContent", {
    content_ids: [contentId],
    content_name: contentName,
    content_type: "product",
    value,
    currency: "COP",
  })
}

export const trackPixelAddToCart = (
  contentId: string,
  contentName: string,
  value: number,
  quantity: number
) => {
  trackPixelEvent("AddToCart", {
    content_ids: [contentId],
    content_name: contentName,
    content_type: "product",
    value,
    currency: "COP",
    quantity,
  })
}

export const trackPixelInitiateCheckout = (value: number, numItems: number) => {
  trackPixelEvent("InitiateCheckout", {
    value,
    currency: "COP",
    num_items: numItems,
  })
}

export const trackPixelPurchase = (value: number, orderId: string, numItems: number) => {
  trackPixelEvent("Purchase", {
    value,
    currency: "COP",
    content_type: "product",
    order_id: orderId,
    num_items: numItems,
  })
}
