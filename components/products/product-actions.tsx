"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ShoppingCart, Minus, Plus, Bell, BellOff } from "lucide-react"
import { FavoriteButton } from "@/components/products/favorite-button"
import { AddToListButton } from "@/components/products/add-to-list-button"
import { useToast } from "@/hooks/use-toast"
import { useCart } from "@/contexts/cart-context"

interface Wishlist {
  id: string
  name: string
}

interface GiftRegistry {
  id: string
  name: string
}

interface ProductActionsProps {
  product: {
    id: string
    pdt_codigo?: string
    nombre_comercial: string
    precio: number
    upp_existencia: number
    imagen_principal_url?: string
    slug: string
    silo?: string
  }
  isFavorited?: boolean
  wishlists?: Wishlist[]
  giftRegistries?: GiftRegistry[]
  hasStockAlert?: boolean
  onCreateWishlist?: () => void
  onCreateRegistry?: () => void
}

export function ProductActions({
  product,
  isFavorited = false,
  wishlists = [],
  giftRegistries = [],
  hasStockAlert = false,
  onCreateWishlist,
  onCreateRegistry,
}: ProductActionsProps) {
  const [quantity, setQuantity] = useState(1)
  const [stockAlertActive, setStockAlertActive] = useState(hasStockAlert)
  const { toast } = useToast()
  const { addItem } = useCart()

  const hasStock = product.upp_existencia > 0

  const handleQuantityChange = (delta: number) => {
    setQuantity((prev) => Math.max(1, Math.min(prev + delta, product.upp_existencia)))
  }

  const handleAddToCart = () => {
    addItem({
      id: product.id,
      productId: product.id,
      productCode: product.pdt_codigo || "",
      name: product.nombre_comercial,
      price: product.precio,
      quantity,
      imageUrl: product.imagen_principal_url,
      maxStock: product.upp_existencia,
      slug: product.slug,
      silo: product.silo || "",
    })

    toast({
      title: "Agregado al carrito",
      description: `${quantity} x ${product.nombre_comercial}`,
    })
  }

  const handleStockAlert = async () => {
    try {
      const response = await fetch("/api/stock-alert", {
        method: stockAlertActive ? "DELETE" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId: product.id }),
      })

      if (response.ok) {
        setStockAlertActive(!stockAlertActive)
        toast({
          title: stockAlertActive ? "Alerta desactivada" : "Alerta activada",
          description: stockAlertActive
            ? "Ya no recibirás notificaciones de este producto"
            : "Te avisaremos cuando el producto esté disponible",
        })
      }
    } catch {
      toast({
        title: "Error",
        description: "No se pudo procesar tu solicitud",
        variant: "destructive",
      })
    }
  }

  return (
    <div className="space-y-4">
      {/* Quantity Selector */}
      {hasStock && (
        <div className="flex items-center gap-4">
          <span className="text-sm font-medium">Cantidad:</span>
          <div className="flex items-center border rounded-md">
            <Button
              variant="ghost"
              size="icon"
              className="h-10 w-10"
              onClick={() => handleQuantityChange(-1)}
              disabled={quantity <= 1}
             aria-label="Quitar">
              <Minus className="h-4 w-4" />
            </Button>
            <Input
              type="number"
              value={quantity}
              onChange={(e) => setQuantity(Math.max(1, Math.min(Number(e.target.value), product.upp_existencia)))}
              className="w-16 h-10 text-center border-0"
              min={1}
              max={product.upp_existencia}
            />
            <Button
              variant="ghost"
              size="icon"
              className="h-10 w-10"
              onClick={() => handleQuantityChange(1)}
              disabled={quantity >= product.upp_existencia}
             aria-label="Agregar">
              <Plus className="h-4 w-4" />
            </Button>
          </div>
          <span className="text-sm text-muted-foreground">
            {product.upp_existencia} disponibles
          </span>
        </div>
      )}

      {/* Main Actions */}
      <div className="flex flex-col sm:flex-row gap-3">
        {hasStock ? (
          <Button size="lg" className="flex-1" onClick={handleAddToCart} aria-label="Agregar al carrito">
            <ShoppingCart className="h-5 w-5 mr-2" />
            Agregar al carrito
          </Button>
        ) : (
          <Button
            size="lg"
            variant={stockAlertActive ? "secondary" : "outline"}
            className="flex-1"
            onClick={handleStockAlert}
           aria-label="Notificaciones">
            {stockAlertActive ? (
              <>
                <BellOff className="h-5 w-5 mr-2" />
                Cancelar alerta
              </>
            ) : (
              <>
                <Bell className="h-5 w-5 mr-2" />
                Avisarme cuando esté disponible
              </>
            )}
          </Button>
        )}

        <FavoriteButton
          productId={product.id}
          initialIsFavorite={isFavorited}
          variant="button"
        />
      </div>

      {/* Secondary Actions */}
      <div className="flex gap-2">
        <AddToListButton
          productId={product.id}
          wishlists={wishlists}
          giftRegistries={giftRegistries}
          onCreateWishlist={onCreateWishlist}
          onCreateRegistry={onCreateRegistry}
        />
      </div>
    </div>
  )
}
