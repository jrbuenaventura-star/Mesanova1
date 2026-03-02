"use client"

import { useMemo, useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import Link from "next/link"

import { useCart } from "@/contexts/cart-context"
import { useToast } from "@/hooks/use-toast"
import { moveWishlistItemAction, removeFromWishlistAction } from "@/lib/actions/wishlists"

import { WishlistItemActions } from "@/components/profile/wishlist-item-actions"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { ArrowRightLeft, ShoppingCart, Trash2 } from "lucide-react"

type WishlistItem = {
  id: string
  quantity?: number | null
  priority?: number | null
  notes?: string | null
  product: {
    id: string
    slug?: string | null
    pdt_codigo?: string | null
    nombre_comercial?: string | null
    precio?: number | null
    imagen_principal_url?: string | null
    upp_existencia?: number | null
    categories?: Array<{
      is_primary?: boolean
      subcategory?: {
        silo?: {
          slug?: string | null
        } | null
      } | null
    }> | null
  } | null
}

type WishlistItemsListProps = {
  wishlistId: string
  items: WishlistItem[]
  targetWishlists: Array<{ id: string; name: string }>
}

function resolveSiloSlug(product: WishlistItem["product"]) {
  const primaryCategory =
    product?.categories?.find((category) => category?.is_primary) ||
    product?.categories?.[0]
  return primaryCategory?.subcategory?.silo?.slug || "productos"
}

function getProductUrl(product: WishlistItem["product"]) {
  if (!product?.slug) return null
  const siloSlug = resolveSiloSlug(product)
  if (!siloSlug) return null
  return `/productos/${siloSlug}/${product.slug}`
}

export function WishlistItemsList({ wishlistId, items, targetWishlists }: WishlistItemsListProps) {
  const [selectedProductIds, setSelectedProductIds] = useState<Set<string>>(new Set())
  const [isPending, startTransition] = useTransition()

  const router = useRouter()
  const { addItem } = useCart()
  const { toast } = useToast()

  const selectableItems = useMemo(
    () => items.filter((item) => item.product?.id).map((item) => item as WishlistItem & { product: NonNullable<WishlistItem["product"]> }),
    [items]
  )

  const selectedItems = useMemo(
    () => selectableItems.filter((item) => selectedProductIds.has(item.product.id)),
    [selectableItems, selectedProductIds]
  )

  const allSelected = selectableItems.length > 0 && selectedItems.length === selectableItems.length

  const toggleSelectAll = (checked: boolean) => {
    if (!checked) {
      setSelectedProductIds(new Set())
      return
    }

    setSelectedProductIds(new Set(selectableItems.map((item) => item.product.id)))
  }

  const toggleItemSelection = (productId: string, checked: boolean) => {
    setSelectedProductIds((current) => {
      const next = new Set(current)
      if (checked) {
        next.add(productId)
      } else {
        next.delete(productId)
      }
      return next
    })
  }

  const runBulkRemove = () => {
    if (selectedItems.length === 0) return

    startTransition(async () => {
      let removedCount = 0

      for (const item of selectedItems) {
        const result = await removeFromWishlistAction(wishlistId, item.product.id)
        if (!result.error) removedCount += 1
      }

      setSelectedProductIds(new Set())
      router.refresh()

      if (removedCount === selectedItems.length) {
        toast({
          title: "Productos eliminados",
          description: `Se eliminaron ${removedCount} producto${removedCount === 1 ? "" : "s"} de la lista`,
        })
        return
      }

      toast({
        title: "Eliminación parcial",
        description: `Se eliminaron ${removedCount} de ${selectedItems.length} productos`,
        variant: "destructive",
      })
    })
  }

  const runBulkMove = (targetWishlistId: string, targetWishlistName: string) => {
    if (selectedItems.length === 0) return

    startTransition(async () => {
      let movedCount = 0

      for (const item of selectedItems) {
        const result = await moveWishlistItemAction(wishlistId, targetWishlistId, item.product.id)
        if (!result.error) movedCount += 1
      }

      setSelectedProductIds(new Set())
      router.refresh()

      if (movedCount === selectedItems.length) {
        toast({
          title: "Productos movidos",
          description: `Se movieron ${movedCount} producto${movedCount === 1 ? "" : "s"} a "${targetWishlistName}"`,
        })
        return
      }

      toast({
        title: "Movimiento parcial",
        description: `Se movieron ${movedCount} de ${selectedItems.length} productos`,
        variant: "destructive",
      })
    })
  }

  const runBulkAddToCart = () => {
    if (selectedItems.length === 0) return

    startTransition(async () => {
      let movedToCart = 0

      for (const item of selectedItems) {
        const stock = Number(item.product.upp_existencia || 0)
        if (stock <= 0) continue

        const desiredQuantity = Math.max(1, Number(item.quantity || 1))
        const quantityToCart = Math.min(desiredQuantity, stock)

        addItem({
          id: item.product.id,
          productId: item.product.id,
          productCode: item.product.pdt_codigo || "",
          name: item.product.nombre_comercial || "Producto",
          price: Number(item.product.precio || 0),
          quantity: quantityToCart,
          imageUrl: item.product.imagen_principal_url || undefined,
          maxStock: stock,
          slug: item.product.slug || "",
          silo: resolveSiloSlug(item.product),
        })

        const removeResult = await removeFromWishlistAction(wishlistId, item.product.id)
        if (!removeResult.error) movedToCart += 1
      }

      setSelectedProductIds(new Set())
      router.refresh()

      if (movedToCart === 0) {
        toast({
          title: "Sin cambios",
          description: "No se pudieron mover productos al carrito (revisa stock disponible)",
          variant: "destructive",
        })
        return
      }

      toast({
        title: "Productos movidos al carrito",
        description: `Se movieron ${movedToCart} producto${movedToCart === 1 ? "" : "s"} al carrito`,
      })
    })
  }

  return (
    <div className="space-y-3">
      {selectableItems.length > 0 && (
        <div className="rounded-lg border p-3 bg-muted/20 flex flex-wrap items-center gap-2 justify-between">
          <div className="flex items-center gap-2">
            <Checkbox
              id="select-all-wishlist-items"
              checked={allSelected}
              onCheckedChange={(checked) => toggleSelectAll(Boolean(checked))}
            />
            <label htmlFor="select-all-wishlist-items" className="text-sm text-muted-foreground">
              Seleccionar todo ({selectedItems.length}/{selectableItems.length})
            </label>
          </div>

          {selectedItems.length > 0 && (
            <div className="flex flex-wrap items-center gap-2">
              <Button type="button" size="sm" variant="outline" onClick={runBulkAddToCart} disabled={isPending}>
                <ShoppingCart className="h-4 w-4 mr-2" />
                Al carrito
              </Button>

              {targetWishlists.length > 0 && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button type="button" size="sm" variant="outline" disabled={isPending}>
                      <ArrowRightLeft className="h-4 w-4 mr-2" />
                      Mover seleccionados
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-64">
                    {targetWishlists.map((target) => (
                      <DropdownMenuItem
                        key={target.id}
                        onClick={() => runBulkMove(target.id, target.name)}
                        disabled={isPending}
                      >
                        {target.name}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              )}

              <Button type="button" size="sm" variant="ghost" onClick={runBulkRemove} disabled={isPending}>
                <Trash2 className="h-4 w-4 mr-2" />
                Eliminar seleccionados
              </Button>
            </div>
          )}
        </div>
      )}

      {items.map((item) => {
        const product = item.product
        if (!product) return null

        const productUrl = getProductUrl(product)

        return (
          <div key={item.id} className="rounded-lg border p-3 flex gap-3">
            <div className="pt-1">
              <Checkbox
                checked={selectedProductIds.has(product.id)}
                onCheckedChange={(checked) => toggleItemSelection(product.id, Boolean(checked))}
                aria-label={`Seleccionar ${product.nombre_comercial || "producto"}`}
              />
            </div>

            <div className="relative h-16 w-16 rounded-md overflow-hidden bg-muted shrink-0">
              {product.imagen_principal_url ? (
                <Image
                  src={product.imagen_principal_url}
                  alt={product.nombre_comercial || "Producto"}
                  fill
                  className="object-cover"
                />
              ) : null}
            </div>

            <div className="flex-1 min-w-0">
              {productUrl ? (
                <Link href={productUrl} className="font-medium hover:underline truncate block">
                  {product.nombre_comercial || "Producto"}
                </Link>
              ) : (
                <p className="font-medium truncate">{product.nombre_comercial || "Producto"}</p>
              )}

              <p className="text-sm text-muted-foreground">${Number(product.precio || 0).toLocaleString("es-CO")}</p>
              <p className="text-sm text-muted-foreground mt-1">
                Cantidad: {item.quantity || 1}
                {typeof item.priority === "number" ? ` · Prioridad: ${item.priority}` : ""}
              </p>
              {item.notes ? <p className="text-xs text-muted-foreground mt-1 italic">&ldquo;{item.notes}&rdquo;</p> : null}

              <WishlistItemActions
                wishlistId={wishlistId}
                product={product}
                quantity={item.quantity}
                targetWishlists={targetWishlists}
              />
            </div>
          </div>
        )
      })}
    </div>
  )
}
