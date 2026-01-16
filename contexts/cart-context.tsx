"use client"

import type React from "react"
import { createContext, useContext, useEffect, useState } from "react"
import type { CartItem, Cart } from "@/lib/cart/types"

interface CartContextType {
  cart: Cart
  addItem: (item: Omit<CartItem, "quantity"> & { quantity?: number }) => void
  removeItem: (productId: string) => void
  updateQuantity: (productId: string, quantity: number) => void
  clearCart: () => void
  isInCart: (productId: string) => boolean
  getItemQuantity: (productId: string) => number
}

const CartContext = createContext<CartContextType | undefined>(undefined)

const CART_STORAGE_KEY = "mesanova-cart"

function calculateCartTotals(items: CartItem[]): { total: number; itemCount: number } {
  const total = items.reduce((sum, item) => sum + item.price * item.quantity, 0)
  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0)
  return { total, itemCount }
}

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([])
  const [isLoaded, setIsLoaded] = useState(false)

  useEffect(() => {
    const stored = localStorage.getItem(CART_STORAGE_KEY)
    if (stored) {
      try {
        const parsed = JSON.parse(stored)
        setItems(parsed)
      } catch (error) {
        console.error("Error loading cart:", error)
      }
    }
    setIsLoaded(true)
  }, [])

  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items))
    }
  }, [items, isLoaded])

  const addItem = (item: Omit<CartItem, "quantity"> & { quantity?: number }) => {
    setItems((currentItems) => {
      const existingItem = currentItems.find((i) => i.productId === item.productId)

      if (existingItem) {
        const newQuantity = existingItem.quantity + (item.quantity || 1)
        if (newQuantity > item.maxStock) {
          return currentItems
        }

        return currentItems.map((i) =>
          i.productId === item.productId ? { ...i, quantity: newQuantity } : i
        )
      }

      const newItem: CartItem = {
        ...item,
        quantity: item.quantity || 1,
      }

      return [...currentItems, newItem]
    })
  }

  const removeItem = (productId: string) => {
    setItems((currentItems) => currentItems.filter((item) => item.productId !== productId))
  }

  const updateQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      removeItem(productId)
      return
    }

    setItems((currentItems) =>
      currentItems.map((item) => {
        if (item.productId === productId) {
          const newQuantity = Math.min(quantity, item.maxStock)
          return { ...item, quantity: newQuantity }
        }
        return item
      })
    )
  }

  const clearCart = () => {
    setItems([])
  }

  const isInCart = (productId: string) => {
    return items.some((item) => item.productId === productId)
  }

  const getItemQuantity = (productId: string) => {
    const item = items.find((i) => i.productId === productId)
    return item?.quantity || 0
  }

  const { total, itemCount } = calculateCartTotals(items)

  const cart: Cart = {
    items,
    total,
    itemCount,
  }

  return (
    <CartContext.Provider
      value={{
        cart,
        addItem,
        removeItem,
        updateQuantity,
        clearCart,
        isInCart,
        getItemQuantity,
      }}
    >
      {children}
    </CartContext.Provider>
  )
}

export function useCart() {
  const context = useContext(CartContext)
  if (context === undefined) {
    throw new Error("useCart must be used within a CartProvider")
  }
  return context
}
