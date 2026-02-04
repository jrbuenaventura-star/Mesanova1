import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Star, ThumbsUp, ThumbsDown, Pencil, CheckCircle } from "lucide-react"
import Image from "next/image"
import Link from "next/link"

export default async function MisResenasPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login?redirect=/perfil/resenas")
  }

  const { data: reviews } = await supabase
    .from("product_reviews")
    .select(`
      *,
      product:products (
        id,
        slug,
        nombre_comercial,
        imagen_principal_url,
        categories:product_categories(
          is_primary,
          subcategory:subcategories(
            silo:silos(slug)
          )
        )
      )
    `)
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString("es-CO", {
      year: "numeric",
      month: "short",
      day: "numeric",
    })
  }

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`h-4 w-4 ${i < rating ? "fill-yellow-400 text-yellow-400" : "text-gray-300"}`}
      />
    ))
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <Star className="h-8 w-8" />
          Mis Reseñas
        </h1>
        <p className="text-muted-foreground mt-2">
          Reseñas que has escrito sobre productos
        </p>
      </div>

      {!reviews || reviews.length === 0 ? (
        <Card className="p-12 text-center">
          <Star className="h-16 w-16 mx-auto text-muted-foreground/50 mb-4" />
          <h2 className="text-xl font-semibold mb-2">No has escrito reseñas</h2>
          <p className="text-muted-foreground mb-6">
            Comparte tu opinión sobre los productos que has comprado
          </p>
          <Button asChild>
            <Link href="/perfil/ordenes">Ver mis compras</Link>
          </Button>
        </Card>
      ) : (
        <div className="space-y-4">
          {reviews.map((review: any) => {
            const product = review.product

            const primaryCategory = product?.categories?.find((c: any) => c.is_primary)
            const siloRelation = primaryCategory?.subcategory?.silo
            const siloSlug = Array.isArray(siloRelation) ? siloRelation[0]?.slug : siloRelation?.slug
            const productHref = siloSlug && product?.slug ? `/productos/${siloSlug}/${product.slug}` : "/productos"

            return (
              <Card key={review.id}>
                <CardContent className="p-6">
                  <div className="flex gap-4">
                    {/* Product image */}
                    <div className="w-20 h-20 shrink-0 rounded-lg overflow-hidden bg-muted">
                      {product?.imagen_principal_url ? (
                        <Image
                          src={product.imagen_principal_url}
                          alt={product.nombre_comercial || "Producto"}
                          width={80}
                          height={80}
                          className="object-cover w-full h-full"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-muted-foreground text-xs">
                          Sin imagen
                        </div>
                      )}
                    </div>

                    {/* Review content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div>
                          {product && (
                            <Link
                              href={productHref}
                              className="font-medium hover:text-primary transition-colors"
                            >
                              {product.nombre_comercial}
                            </Link>
                          )}
                          <div className="flex items-center gap-2 mt-1">
                            <div className="flex">{renderStars(review.rating)}</div>
                            {review.is_verified_purchase && (
                              <Badge variant="outline" className="text-green-600 text-xs">
                                <CheckCircle className="h-3 w-3 mr-1" />
                                Compra verificada
                              </Badge>
                            )}
                          </div>
                        </div>
                        <span className="text-sm text-muted-foreground whitespace-nowrap">
                          {formatDate(review.created_at)}
                        </span>
                      </div>

                      {review.title && (
                        <h3 className="font-medium mb-1">{review.title}</h3>
                      )}

                      {review.review_text && (
                        <p className="text-muted-foreground text-sm mb-3">
                          {review.review_text}
                        </p>
                      )}

                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <ThumbsUp className="h-3 w-3" />
                          {review.helpful_count} útil
                        </span>
                        <span className="flex items-center gap-1">
                          <ThumbsDown className="h-3 w-3" />
                          {review.not_helpful_count}
                        </span>
                        <Button variant="ghost" size="sm" className="h-auto p-0 text-primary">
                          <Pencil className="h-3 w-3 mr-1" />
                          Editar
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
