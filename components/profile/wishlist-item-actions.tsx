"use client"

import { useTransition } from "react"
import { useRouter } from "next/navigation"
import { useCart } from "@/contexts/cart-context"
import { useToast } from "@/hooks/use-toast"
import { moveWishlistItemAction, removeFromWishlistAction } from "@/lib/actions/wishlists"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { ArrowRightLeft, ShoppingCart, Trash2 } from "lucide-react"

type WishlistItemActionsProps = {
  wishlistId: string
  product: {
    id: string
    slug?: string | null
    pdt_codigo?: string | null
    nombre_comercial?: string | null
    precio?: number | null
    upp_existencia?: number | null
    imagen_principal_url?: string | null
    categories?: Array<{
      is_primary?: boolean
      subcategory?: {
        silo?: {
          slug?: string | null
        } | null
      } | null
    }> | null
  }
  quantity?: number | null
  targetWishlists: Array<{ id: string; name: string }>
}

function resolveSiloSlug(product: WishlistItemActionsProps["product"]) {
  const primaryCategory =
    product.categories?.find((category) => category?.is_primary) ||
    product.categories?.[0]
  return primaryCategory?.subcategory?.silo?.slug || "productos"
}

export function WishlistItemActions({ wishlistId, product, quantity, targetWishlists }: WishlistItemActionsProps) {
  const [isPending, startTransition] = useTransition()
  const { addItem } = useCart()
  const { toast } = useToast()
  const router = useRouter()

  const stock = Number(product.upp_existencia || 0)
  const desiredQuantity = Math.max(1, Number(quantity || 1))
  const quantityToCart = Math.min(desiredQuantity, Math.max(stock, 1))

  const handleRemove = () => {
    startTransition(async () => {
      const result = await removeFromWishlistAction(wishlistId, product.id)

      if (result.error) {
        toast({
          title: "No se pudo eliminar",
          description: result.error,
          variant: "destructive",
        })
        return
      }

      toast({
        title: "Producto eliminado",
        description: "Se eliminó de tu lista de deseos",
      })
      router.refresh()
    })
  }

  const handleMove = (targetWishlistId: string, targetWishlistName: string) => {
    startTransition(async () => {
      const result = await moveWishlistItemAction(wishlistId, targetWishlistId, product.id)

      if (result.error) {
        toast({
          title: "No se pudo mover",
          description: result.error,
          variant: "destructive",
        })
        return
      }

      toast({
        title: "Producto movido",
        description: `El producto se movió a "${targetWishlistName}"`,
      })
      router.refresh()
    })
  }

  const handleAddToCart = () => {
    if (stock <= 0) {
      toast({
        title: "Sin stock",
        description: "Este producto no está disponible para agregar al carrito",
        variant: "destructive",
      })
      return
    }

    const productName = product.nombre_comercial || "Producto"

    addItem({
      id: product.id,
      productId: product.id,
      productCode: product.pdt_codigo || "",
      name: productName,
      price: Number(product.precio || 0),
      quantity: quantityToCart,
      imageUrl: product.imagen_principal_url || undefined,
      maxStock: stock,
      slug: product.slug || "",
      silo: resolveSiloSlug(product),
    })

    startTransition(async () => {
      const result = await removeFromWishlistAction(wishlistId, product.id)

      if (result.error) {
        toast({
          title: "Agregado al carrito",
          description: "No se pudo quitar de la lista automáticamente. Puedes eliminarlo manualmente.",
          variant: "destructive",
        })
        return
      }

      toast({
        title: "Producto movido al carrito",
        description: `${quantityToCart} × ${productName}`,
      })
      router.refresh()
    })
  }

  return (
    <div className="flex flex-wrap items-center gap-2 mt-3">
      <Button type="button" size="sm" onClick={handleAddToCart} disabled={isPending || stock <= 0}>
        <ShoppingCart className="h-4 w-4 mr-2" />
        Al carrito
      </Button>

      {targetWishlists.length > 0 && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button type="button" size="sm" variant="outline" disabled={isPending}>
              <ArrowRightLeft className="h-4 w-4 mr-2" />
              Mover
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-64">
            {targetWishlists.map((target) => (
              <DropdownMenuItem
                key={target.id}
                onClick={() => handleMove(target.id, target.name)}
                disabled={isPending}
              >
                {target.name}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      )}

      <Button type="button" size="sm" variant="ghost" onClick={handleRemove} disabled={isPending}>
        <Trash2 className="h-4 w-4 mr-2" />
        Eliminar
      </Button>
    </div>
  )
}
