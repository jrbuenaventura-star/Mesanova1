"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { ShoppingCart, Minus, Plus, Check } from "lucide-react"
import { useCart } from "@/contexts/cart-context"
import { toast } from "sonner"
import type { ProductWithCategories } from "@/lib/db/types"
import { trackAddToCart } from "@/components/clientify/clientify-tracking"

interface AddToCartButtonProps {
  product: ProductWithCategories
  disabled?: boolean
}

export function AddToCartButton({ product, disabled }: AddToCartButtonProps) {
  const { addItem, isInCart, getItemQuantity } = useCart()
  const [quantity, setQuantity] = useState(1)
  const [isAdding, setIsAdding] = useState(false)

  const totalStock = product.warehouse_stock?.reduce((sum, ws) => sum + ws.available_quantity, 0) || product.upp_existencia || 0
  const currentCartQuantity = getItemQuantity(product.id)
  const availableStock = totalStock - currentCartQuantity

  const handleDecrease = () => {
    if (quantity > 1) setQuantity(quantity - 1)
  }

  const handleIncrease = () => {
    if (quantity < availableStock) {
      setQuantity(quantity + 1)
    }
  }

  const handleAddToCart = async () => {
    if (quantity > availableStock) {
      toast.error("Stock insuficiente", {
        description: `Solo hay ${availableStock} unidades disponibles`
      })
      return
    }

    setIsAdding(true)

    try {
      const primaryCategory = product.categories?.find((c) => c.is_primary)
      const siloSlug = primaryCategory?.subcategory?.silo?.slug || "productos"

      addItem({
        id: product.id,
        productId: product.id,
        productCode: product.pdt_codigo,
        name: product.nombre_comercial || product.pdt_descripcion,
        price: product.precio || 0,
        quantity,
        imageUrl: product.imagen_principal_url || undefined,
        maxStock: totalStock,
        slug: product.slug || product.pdt_codigo,
        silo: siloSlug,
      })

      // Rastrear en Clientify
      trackAddToCart({
        id: product.id,
        name: product.nombre_comercial || product.pdt_descripcion,
        price: product.precio || 0,
        quantity,
        category: primaryCategory?.subcategory?.name,
      })

      toast.success("Producto agregado al carrito", {
        description: `${quantity} ${quantity === 1 ? "unidad" : "unidades"} de ${product.nombre_comercial || product.pdt_descripcion}`,
        action: {
          label: "Ver carrito",
          onClick: () => {
            window.location.href = "/carrito"
          },
        },
      })

      setQuantity(1)
    } catch (error) {
      toast.error("Error al agregar al carrito", {
        description: "Por favor intenta nuevamente"
      })
    } finally {
      setIsAdding(false)
    }
  }

  const inCart = isInCart(product.id)

  return (
    <div className="space-y-3">
      {/* Selector de cantidad */}
      <div className="flex items-center gap-4">
        <span className="text-sm font-medium">Cantidad:</span>
        <div className="flex items-center border rounded-md">
          <Button variant="ghost" size="icon" onClick={handleDecrease} disabled={quantity <= 1 || disabled}>
            <Minus className="h-4 w-4" />
          </Button>
          <span className="px-4 py-2 min-w-12 text-center font-medium">{quantity}</span>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleIncrease}
            disabled={quantity >= availableStock || disabled}
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>
        <span className="text-sm text-muted-foreground">
          {availableStock} disponibles
          {currentCartQuantity > 0 && ` (${currentCartQuantity} en carrito)`}
        </span>
      </div>

      {/* Botón agregar al carrito */}
      <Button 
        size="lg" 
        className="w-full" 
        onClick={handleAddToCart} 
        disabled={disabled || isAdding || availableStock === 0}
        variant={inCart ? "secondary" : "default"}
      >
        {inCart ? (
          <>
            <Check className="h-5 w-5 mr-2" />
            En el carrito - Agregar más
          </>
        ) : (
          <>
            <ShoppingCart className="h-5 w-5 mr-2" />
            {isAdding ? "Agregando..." : "Agregar al Carrito"}
          </>
        )}
      </Button>
    </div>
  )
}
