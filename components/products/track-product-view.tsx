"use client"

import { useEffect } from "react"

interface TrackProductViewProps {
  productId: string
  userId?: string
}

export function TrackProductView({ productId, userId }: TrackProductViewProps) {
  useEffect(() => {
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
  }, [productId, userId])

  return null
}
