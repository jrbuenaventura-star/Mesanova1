"use client"

import { useState, useEffect, useCallback } from "react"

const STORAGE_KEY = "mesanova_recently_viewed"
const MAX_ITEMS = 12

export interface RecentlyViewedItem {
  id: string
  slug: string
  siloSlug: string
  name: string
  price: number
  imageUrl?: string
  viewedAt: number
}

export function useRecentlyViewed() {
  const [items, setItems] = useState<RecentlyViewedItem[]>([])

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) {
        setItems(JSON.parse(stored))
      }
    } catch (e) {}
  }, [])

  const addItem = useCallback((item: Omit<RecentlyViewedItem, "viewedAt">) => {
    setItems((prev) => {
      const filtered = prev.filter((i) => i.id !== item.id)
      const updated = [{ ...item, viewedAt: Date.now() }, ...filtered].slice(0, MAX_ITEMS)
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
      } catch (e) {}
      return updated
    })
  }, [])

  const getItems = useCallback((excludeId?: string, limit = 8) => {
    return items
      .filter((i) => i.id !== excludeId)
      .slice(0, limit)
  }, [items])

  return { items, addItem, getItems }
}
