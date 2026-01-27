"use client"

import Script from "next/script"

export function ClientifyTracking() {
  const accountId = process.env.NEXT_PUBLIC_CLIENTIFY_ACCOUNT_ID
  const trackingHostRaw = process.env.NEXT_PUBLIC_CLIENTIFY_TRACKING_HOST || "tracking.clientify.com"

  if (!accountId) return null

  const trackingHost = trackingHostRaw
    .replace(/^https?:\/\//, "")
    .replace(/\/$/, "")

  return (
    <Script
      id="clientify-tracking"
      strategy="afterInteractive"
      dangerouslySetInnerHTML={{
        __html: `
          (function(c,l,i,e,n,t,f,y){
            c['ClientifyObject']=n;c[n]=c[n]||function(){
            (c[n].q=c[n].q||[]).push(arguments)};t=l.createElement(i);
            f=l.getElementsByTagName(i)[0];t.async=1;t.src=e;
            f.parentNode.insertBefore(t,f);
          })(window,document,'script','https://${trackingHost}/${accountId}.js','cf');
        `,
      }}
    />
  )
}

// Declaración de tipos para el objeto global cf
declare global {
  interface Window {
    cf: (...args: any[]) => void
  }
}

// Identificar usuario (llamar al login o cuando se tenga el email)
export const identifyUser = (userData: {
  email: string
  phone?: string
  first_name?: string
  last_name?: string
  company?: string
}) => {
  if (typeof window !== "undefined" && window.cf) {
    window.cf("identify", userData)
  }
}

// Rastrear evento genérico
export const trackClientifyEvent = (
  eventName: string,
  eventData?: Record<string, any>
) => {
  if (typeof window !== "undefined" && window.cf) {
    window.cf("track", eventName, eventData)
  }
}

// Eventos de e-commerce específicos
export const trackProductViewed = (product: {
  id: string
  name: string
  price: number
  category?: string
  sku?: string
}) => {
  trackClientifyEvent("product_viewed", {
    product_id: product.id,
    product_name: product.name,
    price: product.price,
    category: product.category,
    sku: product.sku,
  })
}

export const trackAddToCart = (product: {
  id: string
  name: string
  price: number
  quantity: number
  category?: string
}) => {
  trackClientifyEvent("add_to_cart", {
    product_id: product.id,
    product_name: product.name,
    price: product.price,
    quantity: product.quantity,
    value: product.price * product.quantity,
    category: product.category,
  })
}

export const trackRemoveFromCart = (product: {
  id: string
  name: string
  quantity: number
}) => {
  trackClientifyEvent("remove_from_cart", {
    product_id: product.id,
    product_name: product.name,
    quantity: product.quantity,
  })
}

export const trackBeginCheckout = (data: {
  value: number
  items_count: number
  currency?: string
}) => {
  trackClientifyEvent("begin_checkout", {
    value: data.value,
    items_count: data.items_count,
    currency: data.currency || "COP",
  })
}

export const trackPurchase = (order: {
  order_id: string
  value: number
  items: Array<{
    id: string
    name: string
    price: number
    quantity: number
  }>
  currency?: string
}) => {
  trackClientifyEvent("purchase", {
    order_id: order.order_id,
    value: order.value,
    currency: order.currency || "COP",
    items: order.items,
  })
}

export const trackSearch = (query: string, results_count?: number) => {
  trackClientifyEvent("search", {
    search_query: query,
    results_count,
  })
}

export const trackPageView = (page: string, title?: string) => {
  trackClientifyEvent("page_view", {
    page,
    title: title || document.title,
  })
}

export const trackFormSubmission = (formName: string, formData?: Record<string, any>) => {
  trackClientifyEvent("form_submitted", {
    form_name: formName,
    ...formData,
  })
}
