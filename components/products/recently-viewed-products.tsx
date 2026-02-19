"use client"

import { useRecentlyViewed } from "@/hooks/use-recently-viewed"
import { Card, CardContent } from "@/components/ui/card"
import Link from "next/link"
import { Clock } from "lucide-react"

interface RecentlyViewedProductsProps {
  excludeProductId?: string
  title?: string
  limit?: number
}

export function RecentlyViewedProducts({ 
  excludeProductId, 
  title = "Vistos recientemente",
  limit = 6 
}: RecentlyViewedProductsProps) {
  const { getItems } = useRecentlyViewed()
  const recentItems = getItems(excludeProductId, limit)

  if (recentItems.length === 0) return null

  return (
    <section className="mb-12">
      <div className="flex items-center gap-2 mb-6">
        <Clock className="h-5 w-5 text-muted-foreground" />
        <h2 className="text-2xl font-bold">{title}</h2>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {recentItems.map((item) => (
          <Link key={item.id} href={`/productos/${item.siloSlug}/${item.slug}`} aria-label="Ver producto">
            <Card className="group hover:shadow-md transition-shadow h-full">
              <CardContent className="p-3">
                <div className="aspect-square rounded-md overflow-hidden bg-muted mb-2">
                  {item.imageUrl ? (
                    <img
                      src={item.imageUrl}
                      alt={item.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-muted-foreground text-xs">
                      Sin imagen
                    </div>
                  )}
                </div>
                <p className="text-sm font-medium line-clamp-2 group-hover:text-primary transition-colors">
                  {item.name}
                </p>
                {item.price > 0 && (
                  <p className="text-sm font-bold mt-1">${item.price.toLocaleString()}</p>
                )}
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </section>
  )
}
