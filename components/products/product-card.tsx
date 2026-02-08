import Image from "next/image"
import Link from "next/link"
import type { Product } from "@/lib/db/types"
import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ShoppingCart } from "lucide-react"
import { FavoriteButton } from "@/components/products/favorite-button"
import { ProductSegmentBadge } from "@/components/products/product-segment-badge"
import { getImageKitUrl } from "@/lib/imagekit"
import { calculateProductPricing, formatPrice } from "@/lib/pricing"

interface ProductCardProps {
  product: Product & {
    categories?: Array<{
      is_primary?: boolean
      subcategory?: {
        silo?: {
          slug?: string
        }
      }
    }>
  }
  showFavoriteButton?: boolean
  isFavorited?: boolean
  distributor?: { discount_percentage: number } | null
}

export function ProductCard({ product, showFavoriteButton = true, isFavorited = false, distributor = null }: ProductCardProps) {
  const hasStock = product.upp_existencia > 0
  const primaryCategory = product.categories?.find((c) => c.is_primary)
  const siloSlug = primaryCategory?.subcategory?.silo?.slug
  const productHref = siloSlug ? `/productos/${siloSlug}/${product.slug}` : "/productos"
  const imageUrl = product.imagen_principal_url
    ? getImageKitUrl(product.imagen_principal_url, { width: 600, height: 600, quality: 80, format: "auto" })
    : "/placeholder.svg?height=300&width=300"

  const pricing = calculateProductPricing(
    {
      precio: product.precio ?? null,
      descuento_porcentaje: product.descuento_porcentaje ?? null,
      precio_dist: product.precio_dist ?? null,
      desc_dist: product.desc_dist ?? null,
    },
    distributor
  )

  return (
    <Card className="group overflow-hidden h-full flex flex-col">
      <div className="relative">
        <Link href={productHref} className="block">
          <div className="relative aspect-square overflow-hidden bg-muted">
            <Image
              src={imageUrl}
              alt={product.nombre_comercial || product.pdt_descripcion}
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-300"
              sizes="(max-width: 768px) 50vw, 25vw"
            />

            {/* Badges */}
            <div className="absolute top-1.5 left-1.5 sm:top-2 sm:left-2 flex flex-col gap-1">
              <ProductSegmentBadge segment={product.segment} />
              {product.is_new && (
                <Badge variant="default" className="w-fit text-[10px] sm:text-xs px-1.5 py-0.5 sm:px-2 sm:py-1">
                  Nuevo
                </Badge>
              )}
              {product.is_on_sale && (
                <Badge variant="destructive" className="w-fit text-[10px] sm:text-xs px-1.5 py-0.5 sm:px-2 sm:py-1">
                  Oferta
                </Badge>
              )}
              {!hasStock && (
                <Badge variant="secondary" className="w-fit text-[10px] sm:text-xs px-1.5 py-0.5 sm:px-2 sm:py-1">
                  Agotado
                </Badge>
              )}
            </div>
          </div>
        </Link>
        
        {/* Favorite Button */}
        {showFavoriteButton && (
          <div className="absolute top-1.5 right-1.5 sm:top-2 sm:right-2 z-10">
            <FavoriteButton 
              productId={product.id} 
              initialIsFavorite={isFavorited}
              className="bg-background/80 backdrop-blur-sm hover:bg-background h-7 w-7 sm:h-8 sm:w-8"
            />
          </div>
        )}
      </div>

      <CardContent className="p-4 flex-1">
        <Link href={productHref}>
          <h3 className="font-semibold text-sm mb-1 line-clamp-2 group-hover:text-primary transition-colors">
            {product.nombre_comercial || product.pdt_descripcion}
          </h3>
        </Link>
        <p className="text-xs text-muted-foreground mb-2">Código: {product.pdt_codigo}</p>
        
        {/* Public pricing (no distributor) */}
        {!distributor && (
          <div className="flex items-baseline gap-2">
            <span className="text-lg font-bold">{formatPrice(pricing.publicPrice)}</span>
            {pricing.publicHasDiscount && pricing.publicOriginalPrice && (
              <span className="text-sm text-muted-foreground line-through">{formatPrice(pricing.publicOriginalPrice)}</span>
            )}
          </div>
        )}

        {/* Distributor pricing */}
        {distributor && pricing.distributorNetPrice && (
          <div className="space-y-1">
            <div className="flex items-baseline gap-2">
              <span className="text-lg font-bold">{formatPrice(pricing.distributorNetPrice)}</span>
              <span className="text-xs text-muted-foreground">Precio neto</span>
            </div>
            <div className="text-xs text-muted-foreground">
              Base: {formatPrice(pricing.distributorBasePrice)} • Sugerido: {formatPrice(pricing.distributorSuggestedPrice)}
            </div>
          </div>
        )}
      </CardContent>

      <CardFooter className="p-4 pt-0">
        <Button className="w-full" size="sm" disabled={!hasStock}>
          <ShoppingCart className="h-4 w-4 mr-2" />
          {hasStock ? "Agregar" : "Agotado"}
        </Button>
      </CardFooter>
    </Card>
  )
}
