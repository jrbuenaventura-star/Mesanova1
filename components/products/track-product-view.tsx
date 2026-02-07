"use client"

import { useEffect } from "react"
import { trackProductViewed } from "@/components/clientify/clientify-tracking"
import { useRecentlyViewed } from "@/hooks/use-recently-viewed"

interface TrackProductViewProps {
  productId: string
  productName?: string
  price?: number
  category?: string
  userId?: string
  slug?: string
  siloSlug?: string
  imageUrl?: string
}

export function TrackProductView({ 
  productId, 
  productName,
  price,
  category,
  userId,
  slug,
  siloSlug,
  imageUrl,
}: TrackProductViewProps) {
  const { addItem } = useRecentlyViewed()

  useEffect(() => {
    // Guardar en productos vistos recientemente (localStorage)
    if (productName && slug && siloSlug) {
      addItem({
        id: productId,
        slug,
        siloSlug,
        name: productName,
        price: price || 0,
        imageUrl,
      })
    }

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
