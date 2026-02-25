"use client"

import { useEffect } from "react"

import {
  loadEncryptedOfflineQueue,
  saveEncryptedOfflineQueue,
  type DeliveryOfflineQueueItem,
} from "@/lib/delivery/offline-client"

async function syncOfflineQueue() {
  const queue = await loadEncryptedOfflineQueue()
  if (queue.length === 0) {
    return
  }

  const remaining: DeliveryOfflineQueueItem[] = []
  for (const item of queue) {
    try {
      const response = await fetch(item.endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(item.payload),
      })
      if (!response.ok) {
        remaining.push(item)
      }
    } catch {
      remaining.push(item)
    }
  }

  await saveEncryptedOfflineQueue(remaining)
}

export function DeliveryPwaRegister() {
  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/delivery-sw.js").catch((error) => {
        console.error("[delivery.pwa] service worker registration failed", error)
      })
    }

    const onOnline = () => {
      void syncOfflineQueue()
    }

    window.addEventListener("online", onOnline)
    void syncOfflineQueue()

    return () => {
      window.removeEventListener("online", onOnline)
    }
  }, [])

  return null
}
