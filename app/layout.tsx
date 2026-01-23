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
import { WhatsAppWidget } from "@/components/clientify/whatsapp-widget"
import { LeadCapturePopup } from "@/components/clientify/lead-capture-popup"
import "./globals.css"

import { Geist, Geist_Mono, Geist as V0_Font_Geist, Geist_Mono as V0_Font_Geist_Mono, Source_Serif_4 as V0_Font_Source_Serif_4 } from 'next/font/google'

// Initialize fonts
const _geist = V0_Font_Geist({ subsets: ['latin'], weight: ["100","200","300","400","500","600","700","800","900"] })
const _geistMono = V0_Font_Geist_Mono({ subsets: ['latin'], weight: ["100","200","300","400","500","600","700","800","900"] })
const _sourceSerif_4 = V0_Font_Source_Serif_4({ subsets: ['latin'], weight: ["200","300","400","500","600","700","800","900"] })

export const metadata: Metadata = {
  title: "Mesanova - Artículos para Cocina, Mesa y Hogar",
  description:
    "Tu tienda especializada en artículos para cocina, mesa y hogar. Calidad y variedad para distribuidores y consumidores finales.",
  generator: "v0.app",
  icons: {
    icon: [
      {
        url: "/favicon.svg",
        type: "image/svg+xml",
      },
    ],
    apple: "/favicon.svg",
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const gaId = process.env.NEXT_PUBLIC_GA4_ID
  const pixelId = process.env.NEXT_PUBLIC_META_PIXEL_ID

  return (
    <html lang="es">
      <head>
        {/* Google Tag Manager */}
        <Script
          id="gtm-script"
          strategy="beforeInteractive"
          dangerouslySetInnerHTML={{
            __html: `(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
})(window,document,'script','dataLayer','GTM-WNCMDR6D');`,
          }}
        />
        {/* End Google Tag Manager */}
      </head>
      <body className={`font-sans antialiased`}>
        {/* Google Tag Manager (noscript) */}
        <noscript>
          <iframe
            src="https://www.googletagmanager.com/ns.html?id=GTM-WNCMDR6D"
            height="0"
            width="0"
            style={{ display: "none", visibility: "hidden" }}
          />
        </noscript>
        {/* End Google Tag Manager (noscript) */}
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
