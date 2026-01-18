"use client"

import { useState, useTransition } from "react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { ListPlus, Heart, Gift, Plus, Check } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { addToWishlistAction } from "@/lib/actions/wishlists"
import { addProductToRegistryAction } from "@/lib/actions/gift-registry"

interface Wishlist {
  id: string
  name: string
}

interface GiftRegistry {
  id: string
  name: string
}

interface AddToListButtonProps {
  productId: string
  wishlists?: Wishlist[]
  giftRegistries?: GiftRegistry[]
  onCreateWishlist?: () => void
  onCreateRegistry?: () => void
}

export function AddToListButton({
  productId,
  wishlists = [],
  giftRegistries = [],
  onCreateWishlist,
  onCreateRegistry,
}: AddToListButtonProps) {
  const [isPending, startTransition] = useTransition()
  const [addedTo, setAddedTo] = useState<Set<string>>(new Set())
  const { toast } = useToast()

  const handleAddToWishlist = (wishlistId: string, wishlistName: string) => {
    startTransition(async () => {
      const result = await addToWishlistAction(wishlistId, productId)

      if (result.error) {
        toast({
          title: "Error",
          description: result.error,
          variant: "destructive",
        })
        return
      }

      setAddedTo((prev) => new Set(prev).add(`wishlist-${wishlistId}`))
      toast({
        title: "Agregado a la lista",
        description: `El producto se agregó a "${wishlistName}"`,
      })
    })
  }

  const handleAddToRegistry = (registryId: string, registryName: string) => {
    startTransition(async () => {
      const result = await addProductToRegistryAction(registryId, productId)

      if (result.error) {
        toast({
          title: "Error",
          description: result.error,
          variant: "destructive",
        })
        return
      }

      setAddedTo((prev) => new Set(prev).add(`registry-${registryId}`))
      toast({
        title: "Agregado a la lista de regalos",
        description: `El producto se agregó a "${registryName}"`,
      })
    })
  }

  const hasLists = wishlists.length > 0 || giftRegistries.length > 0

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" disabled={isPending}>
          <ListPlus className="h-4 w-4 mr-2" />
          Agregar a lista
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        {wishlists.length > 0 && (
          <>
            <DropdownMenuLabel className="flex items-center gap-2">
              <Heart className="h-4 w-4" />
              Listas de Deseos
            </DropdownMenuLabel>
            {wishlists.map((wishlist) => {
              const isAdded = addedTo.has(`wishlist-${wishlist.id}`)
              return (
                <DropdownMenuItem
                  key={wishlist.id}
                  onClick={() => handleAddToWishlist(wishlist.id, wishlist.name)}
                  disabled={isAdded}
                >
                  {isAdded ? (
                    <Check className="h-4 w-4 mr-2 text-green-600" />
                  ) : (
                    <Plus className="h-4 w-4 mr-2" />
                  )}
                  {wishlist.name}
                </DropdownMenuItem>
              )
            })}
            <DropdownMenuSeparator />
          </>
        )}

        {giftRegistries.length > 0 && (
          <>
            <DropdownMenuLabel className="flex items-center gap-2">
              <Gift className="h-4 w-4" />
              Listas de Regalo
            </DropdownMenuLabel>
            {giftRegistries.map((registry) => {
              const isAdded = addedTo.has(`registry-${registry.id}`)
              return (
                <DropdownMenuItem
                  key={registry.id}
                  onClick={() => handleAddToRegistry(registry.id, registry.name)}
                  disabled={isAdded}
                >
                  {isAdded ? (
                    <Check className="h-4 w-4 mr-2 text-green-600" />
                  ) : (
                    <Plus className="h-4 w-4 mr-2" />
                  )}
                  {registry.name}
                </DropdownMenuItem>
              )
            })}
            <DropdownMenuSeparator />
          </>
        )}

        {!hasLists && (
          <div className="px-2 py-4 text-center text-sm text-muted-foreground">
            No tienes listas creadas
          </div>
        )}

        <DropdownMenuItem onClick={onCreateWishlist}>
          <Plus className="h-4 w-4 mr-2" />
          Nueva lista de deseos
        </DropdownMenuItem>
        <DropdownMenuItem onClick={onCreateRegistry}>
          <Plus className="h-4 w-4 mr-2" />
          Nueva lista de regalo
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
