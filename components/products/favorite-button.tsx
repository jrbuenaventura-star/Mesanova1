"use client"

import { useState, useTransition } from "react"
import { Heart } from "lucide-react"
import { Button } from "@/components/ui/button"
import { toggleFavorite } from "@/lib/actions/favorites"
import { cn } from "@/lib/utils"
import { useToast } from "@/hooks/use-toast"

interface FavoriteButtonProps {
  productId: string
  initialIsFavorite?: boolean
  variant?: "icon" | "button"
  className?: string
}

export function FavoriteButton({ productId, initialIsFavorite = false, variant = "icon", className }: FavoriteButtonProps) {
  const [isFavorite, setIsFavorite] = useState(initialIsFavorite)
  const [isPending, startTransition] = useTransition()
  const { toast } = useToast()

  const handleClick = () => {
    startTransition(async () => {
      const result = await toggleFavorite(productId)

      if (result.error) {
        toast({
          title: "Error",
          description: result.error,
          variant: "destructive",
        })
        return
      }

      setIsFavorite(result.isFavorite ?? false)
      toast({
        title: result.isFavorite ? "Agregado a favoritos" : "Eliminado de favoritos",
        description: result.isFavorite
          ? "El producto ha sido agregado a tus favoritos"
          : "El producto ha sido eliminado de tus favoritos",
      })
    })
  }

  if (variant === "button") {
    return (
      <Button
        variant={isFavorite ? "default" : "outline"}
        size="sm"
        onClick={handleClick}
        disabled={isPending}
        className={className}
       aria-label="Favorito">
        <Heart className={cn("h-4 w-4 mr-2", isFavorite && "fill-current")} />
        {isFavorite ? "En favoritos" : "Agregar a favoritos"}
      </Button>
    )
  }

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={handleClick}
      disabled={isPending}
      className={cn(
        "h-9 w-9 rounded-full",
        isFavorite && "text-red-500 hover:text-red-600",
        className
      )}
     aria-label="Favorito">
      <Heart className={cn("h-5 w-5", isFavorite && "fill-current")} />
      <span className="sr-only">{isFavorite ? "Eliminar de favoritos" : "Agregar a favoritos"}</span>
    </Button>
  )
}
