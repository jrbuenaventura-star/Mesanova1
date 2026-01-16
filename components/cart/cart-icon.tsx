"use client"

import { ShoppingCart } from "lucide-react"
import { useCart } from "@/contexts/cart-context"
import { Button } from "@/components/ui/button"
import Link from "next/link"

export function CartIcon() {
  const { cart } = useCart()

  return (
    <Button variant="ghost" size="icon" asChild className="relative">
      <Link href="/carrito">
        <ShoppingCart className="h-5 w-5" />
        {cart.itemCount > 0 && (
          <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center font-medium">
            {cart.itemCount > 99 ? "99+" : cart.itemCount}
          </span>
        )}
        <span className="sr-only">Carrito de compras</span>
      </Link>
    </Button>
  )
}
