import type React from "react"
import type { Metadata } from "next"
import Script from "next/script"

import { Analytics } from "@vercel/analytics/next"
import { SiteHeader } from "@/components/site-header"
import { SiteFooter } from "@/components/site-footer"
import { CartProvider } from "@/contexts/cart-context"
import { Toaster } from "@/components/ui/sonner"
import { GoogleAnalytics } from "@/components/analytics/google-analytics"
import { MetaPixel } from "@/components/analytics/meta-pixel"
import { CrossDomainLinker } from "@/components/analytics/cross-domain-linker"
import { ClientifyTracking } from "@/components/clientify/clientify-tracking"
import { WhatsAppWidget } from "@/components/whatsapp-widget"
import { LeadCapturePopup } from "@/components/clientify/lead-capture-popup"
import "./globals.css"

export const metadata: Metadata = {
  metadataBase: new URL("https://mesanova.co"),
  title: {
    default: "Mesanova - Vajillas, Copas, Vasos y Platos | Artículos para Mesa y Cocina",
    template: "%s | Mesanova",
  },
  description:
    "Especialistas en artículos para mesa y cocina. Descubre nuestra selección de vajillas, copas, vasos, platos y utensilios de cocina. Calidad premium desde 1995.",
  icons: {
    icon: [
      {
        url: "/favicon.svg",
        type: "image/svg+xml",
      },
    ],
    apple: "/favicon.svg",
  },
  openGraph: {
    type: "website",
    locale: "es_CO",
    url: "https://mesanova.co",
    siteName: "Mesanova",
    title: "Mesanova - Vajillas, Copas, Vasos y Platos",
    description: "Especialistas en artículos para mesa y cocina. Vajillas, copas, vasos, platos y utensilios de cocina de calidad premium.",
  },
  twitter: {
    card: "summary_large_image",
    title: "Mesanova - Artículos para Mesa y Cocina",
    description: "Especialistas en artículos para mesa y cocina. Calidad premium desde 1995.",
  },
  robots: {
    index: true,
    follow: true,
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const gtmId = process.env.NEXT_PUBLIC_GTM_ID
  const gaId = process.env.NEXT_PUBLIC_GA4_ID
  const pixelId = process.env.NEXT_PUBLIC_META_PIXEL_ID

  return (
    <html lang="es">
      <head>
        {gtmId && (
          <Script
            id="gtm-script"
            strategy="beforeInteractive"
            dangerouslySetInnerHTML={{
              __html: `(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
})(window,document,'script','dataLayer','${gtmId}');`,
            }}
          />
        )}
      </head>
      <body className={`font-sans antialiased`}>
        {gtmId && (
          <noscript>
            <iframe
              src={`https://www.googletagmanager.com/ns.html?id=${gtmId}`}
              height="0"
              width="0"
              style={{ display: "none", visibility: "hidden" }}
            />
          </noscript>
        )}
        {gaId && <GoogleAnalytics gaId={gaId} />}
        {pixelId && <MetaPixel pixelId={pixelId} />}
        <CrossDomainLinker />
        <ClientifyTracking />
        <CartProvider>
          <SiteHeader />
          {children}
          <SiteFooter />
          <Toaster />
          <Analytics />
          <WhatsAppWidget />
          <LeadCapturePopup 
            delaySeconds={30} 
            scrollPercentage={50}
            showOnExitIntent={true}
            offer="10% de descuento en tu primera compra"
          />
        </CartProvider>
      </body>
    </html>
  )
}
