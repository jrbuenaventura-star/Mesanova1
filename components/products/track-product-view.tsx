"use client"

import { useEffect } from "react"
import { trackProductViewed } from "@/components/clientify/clientify-tracking"

interface TrackProductViewProps {
  productId: string
  productName?: string
  price?: number
  category?: string
  userId?: string
}

export function TrackProductView({ 
  productId, 
  productName,
  price,
  category,
  userId 
}: TrackProductViewProps) {
  useEffect(() => {
    // Rastrear vista de producto en Clientify (siempre, incluso sin login)
    if (productName) {
      trackProductViewed({
        id: productId,
        name: productName,
        price: price || 0,
        category,
      })
    }

    // Solo rastrear en nuestra BD si hay usuario
    if (!userId) return

    const trackView = async () => {
      try {
        await fetch("/api/track-view", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ productId }),
        })
      } catch (error) {
        console.error("Error tracking product view:", error)
      }
    }

    trackView()
  }, [productId, productName, price, category, userId])

  return null
}
