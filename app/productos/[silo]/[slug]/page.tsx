import Link from "next/link"
import { notFound } from "next/navigation"
import { getProductBySlug, getRelatedProducts } from "@/lib/db/queries"
import { createClient } from "@/lib/supabase/server"
import { getProductReviews, getProductRatingStats, getUserWishlists, getUserGiftRegistries, isProductFavorited } from "@/lib/db/user-features"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Package, Truck, CheckCircle, AlertCircle, Percent } from "lucide-react"
import { ProductImageGallery } from "@/components/products/product-image-gallery"
import { ProductCard } from "@/components/products/product-card"
import { AddToCartButton } from "@/components/products/add-to-cart-button"
import { FavoriteButton } from "@/components/products/favorite-button"
import { AddToListButton } from "@/components/products/add-to-list-button"
import { ProductReviews } from "@/components/products/product-reviews"
import { TrackProductView } from "@/components/products/track-product-view"
import { RecentlyViewedProducts } from "@/components/products/recently-viewed-products"
import { NotifyStockButton } from "@/components/products/notify-stock-button"
import { ShareButton } from "@/components/ui/share-button"
import { calculateProductPricing, formatPrice } from "@/lib/pricing"
import { getCurrentDistributorPricingContext } from "@/lib/distributor-pricing-context"

interface ProductPageProps {
  params: Promise<{
    silo: string
    slug: string
  }>
}

export default async function ProductPage({ params }: ProductPageProps) {
  const { slug, silo } = await params
  const product = await getProductBySlug(slug)

  if (!product) {
    notFound()
  }

  // Obtener usuario y datos relacionados
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const distributorForPricing = await getCurrentDistributorPricingContext()

  const pricing = calculateProductPricing(
    {
      precio: product.precio ?? null,
      descuento_porcentaje: product.descuento_porcentaje ?? null,
      precio_dist: product.precio_dist ?? null,
      desc_dist: product.desc_dist ?? null,
    },
    distributorForPricing
  )

  // Datos del usuario (favoritos, listas, etc.)
  let isFavorited = false
  let wishlists: { id: string; name: string }[] = []
  let giftRegistries: { id: string; name: string }[] = []

  if (user) {
    const [favResult, wishlistsData, registriesData] = await Promise.all([
      isProductFavorited(user.id, product.id),
      getUserWishlists(user.id),
      getUserGiftRegistries(user.id),
    ])
    isFavorited = favResult
    wishlists = (wishlistsData || []).map((w: any) => ({ id: w.id, name: w.name }))
    giftRegistries = (registriesData || []).filter((r: any) => r.status === "active").map((r: any) => ({ id: r.id, name: r.name }))
  }

  // Obtener reseñas del producto
  const [reviewsData, ratingStats] = await Promise.all([
    getProductReviews(product.id, 10),
    getProductRatingStats(product.id),
  ])

  const images = [
    {
      url: product.imagen_principal_url || "/placeholder.svg?height=600&width=600",
      alt: product.nombre_comercial || product.pdt_descripcion,
    },
    ...(product.media
      ?.filter((m) => m.media_type === "image")
      .map((m) => ({ url: m.url, alt: m.alt_text || product.nombre_comercial || "" })) || []),
  ]

  const videos = product.media?.filter((m) => m.media_type === "video") || []

  // Calcular disponibilidad total
  const totalStock = product.warehouse_stock?.reduce((sum, ws) => sum + ws.available_quantity, 0) || 0
  const hasStock = totalStock > 0

  // Obtener productos relacionados automáticamente
  const relatedProducts = await getRelatedProducts(product.id, 8)

  // Obtener categoría principal
  const primaryCategory = product.categories?.find((c) => c.is_primary)

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Track product view */}
      <TrackProductView 
        productId={product.id} 
        userId={user?.id}
        productName={product.nombre_comercial || product.pdt_descripcion}
        price={product.precio}
        slug={slug}
        siloSlug={silo}
        imageUrl={product.imagen_principal_url || undefined}
        category={primaryCategory?.subcategory?.name}
      />

      {/* JSON-LD Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Product",
            name: product.nombre_comercial || product.pdt_descripcion,
            description: product.descripcion_larga || product.pdt_descripcion,
            image: product.imagen_principal_url || undefined,
            sku: product.pdt_codigo,
            brand: product.marca ? { "@type": "Brand", name: product.marca } : undefined,
            color: product.color || undefined,
            material: product.material || undefined,
            weight: product.peso ? { "@type": "QuantitativeValue", value: product.peso, unitCode: "KGM" } : undefined,
            offers: {
              "@type": "Offer",
              url: `https://mesanova.co/productos/${silo}/${slug}`,
              priceCurrency: "COP",
              price: product.precio || 0,
              availability: hasStock ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
              seller: { "@type": "Organization", name: "Mesanova" },
            },
            ...(ratingStats.total > 0 ? {
              aggregateRating: {
                "@type": "AggregateRating",
                ratingValue: ratingStats.average,
                reviewCount: ratingStats.total,
              },
            } : {}),
          }),
        }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "BreadcrumbList",
            itemListElement: [
              { "@type": "ListItem", position: 1, name: "Inicio", item: "https://mesanova.co" },
              { "@type": "ListItem", position: 2, name: "Productos", item: "https://mesanova.co/productos" },
              ...(primaryCategory?.subcategory?.silo ? [{
                "@type": "ListItem",
                position: 3,
                name: primaryCategory.subcategory.silo.name,
                item: `https://mesanova.co/productos/${primaryCategory.subcategory.silo.slug}`,
              }] : []),
              {
                "@type": "ListItem",
                position: primaryCategory?.subcategory?.silo ? 4 : 3,
                name: product.nombre_comercial || product.pdt_descripcion,
              },
            ],
          }),
        }}
      />

      {/* Breadcrumb */}
      <nav className="mb-6 text-sm">
        <ol className="flex items-center gap-2 text-muted-foreground">
          <li>
            <Link href="/" className="hover:text-foreground" aria-label="Inicio">
              Inicio
            </Link>
          </li>
          <li>/</li>
          <li>
            <Link href="/productos" className="hover:text-foreground">
              Ver productos
            </Link>
          </li>
          {primaryCategory?.subcategory?.silo && (
            <>
              <li>/</li>
              <li>
                <Link href={`/productos/${primaryCategory.subcategory.silo.slug}`} className="hover:text-foreground" aria-label="Ver categoría">
                  {primaryCategory.subcategory.silo.name}
                </Link>
              </li>
            </>
          )}
          <li>/</li>
          <li className="text-foreground font-medium">{product.nombre_comercial || product.pdt_descripcion}</li>
        </ol>
      </nav>

      {/* Sección principal del producto */}
      <div className="grid md:grid-cols-2 gap-8 lg:gap-12 mb-12">
        {/* Galería de imágenes */}
        <div>
          <ProductImageGallery images={images} productName={product.nombre_comercial || product.pdt_descripcion} />
        </div>

        {/* Información del producto */}
        <div className="space-y-6">
          {/* Badges de estado - Order: tags, collection, subcategory */}
          <div className="flex flex-wrap gap-2">
            {product.is_new && <Badge variant="default">Nuevo</Badge>}
            {product.is_featured && <Badge variant="secondary">Destacado</Badge>}
            {product.is_on_sale && <Badge variant="destructive">En Oferta</Badge>}
            {product.descontinuado && <Badge variant="outline" className="bg-yellow-100 text-yellow-800">Descontinuado</Badge>}
            {product.tags && product.tags.length > 0 && product.tags.map((tag) => (
              <Badge key={tag} variant="outline">{tag}</Badge>
            ))}
            {product.collection && (
              <Link href={`/productos?coleccion=${encodeURIComponent(product.collection.slug || product.collection.name)}`}>
                <Badge variant="outline" className="cursor-pointer hover:bg-muted">Ver productos {product.collection.name}</Badge>
              </Link>
            )}
            {primaryCategory?.subcategory && (
              <Badge variant="outline">{primaryCategory.subcategory.name}</Badge>
            )}
          </div>

          {/* Título y código */}
          <div>
            <h1 className="text-3xl font-bold mb-2">{product.nombre_comercial || product.pdt_descripcion}</h1>
            <div className="flex flex-wrap gap-3 text-sm text-muted-foreground">
              <span>Código: {product.pdt_codigo}</span>
              {product.ref_pub && <span>SKU: {product.ref_pub}</span>}
            </div>
          </div>

          {/* Precio */}
          {!distributorForPricing ? (
            <div className="flex items-baseline gap-2">
              <span className="text-4xl font-bold">{formatPrice(pricing.publicPrice)}</span>
              {pricing.publicHasDiscount && pricing.publicOriginalPrice && (
                <span className="text-2xl text-muted-foreground line-through">{formatPrice(pricing.publicOriginalPrice)}</span>
              )}
              {pricing.publicHasDiscount && (
                <Badge variant="destructive">-{pricing.publicDiscount}%</Badge>
              )}
            </div>
          ) : (
            <div className="space-y-2">
              <div className="grid gap-1 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Precio sugerido al público</span>
                  <span className="font-medium">{formatPrice(pricing.distributorSuggestedPrice)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Precio distribuidor</span>
                  <span className="font-medium">{formatPrice(pricing.distributorBasePrice)}</span>
                </div>
              </div>
              <div className="flex items-baseline justify-between rounded-lg border bg-muted/20 p-3">
                <div className="flex items-center gap-1 text-sm text-muted-foreground">
                  <Percent className="h-3 w-3" />
                  Tu precio ({pricing.distributorDiscount}% desc.)
                </div>
                <span className="text-3xl font-bold text-green-700">{formatPrice(pricing.distributorNetPrice)}</span>
              </div>
            </div>
          )}

          {/* Disponibilidad */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              {hasStock ? (
                <>
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  <span className="text-green-600 font-medium">En stock ({totalStock} unidades)</span>
                </>
              ) : (
                <>
                  <AlertCircle className="h-5 w-5 text-red-600" />
                  <span className="text-red-600 font-medium">Sin stock</span>
                </>
              )}
            </div>

            {/* Disponibilidad por almacén */}
            {product.warehouse_stock && product.warehouse_stock.length > 0 && (
              <div className="text-sm text-muted-foreground space-y-1">
                {product.warehouse_stock
                  .filter((ws) => ws.warehouse?.show_in_frontend)
                  .map((ws) => (
                    <div key={ws.id} className="flex items-center justify-between">
                      <span>{ws.warehouse?.name}:</span>
                      <span className={ws.available_quantity > 0 ? "text-green-600" : "text-red-600"}>
                        {ws.available_quantity > 0 ? `${ws.available_quantity} disponibles` : "Agotado"}
                      </span>
                    </div>
                  ))}
              </div>
            )}
          </div>

          {/* Información de empaque y pedidos */}
          {(product.pdt_empaque || product.outer_pack || (product.pedido_en_camino && product.pedido_en_camino > 0)) && (
            <div className="flex flex-wrap gap-4 text-sm">
              {product.pdt_empaque && (
                <div className="flex items-center gap-2">
                  <Package className="h-4 w-4 text-muted-foreground" />
                  <span>MOQ: {product.pdt_empaque}</span>
                </div>
              )}
              {product.outer_pack && (
                <div className="flex items-center gap-2">
                  <Package className="h-4 w-4 text-muted-foreground" />
                  <span>Outer Pack: {product.outer_pack}</span>
                </div>
              )}
              {product.pedido_en_camino && product.pedido_en_camino > 0 && (
                <div className="flex items-center gap-2">
                  <Truck className="h-4 w-4 text-blue-600" />
                  <span className="text-blue-600">En camino: {product.pedido_en_camino} unidades</span>
                </div>
              )}
            </div>
          )}

          {/* Información de producto */}
          {(product.material || product.color || product.marca || product.capacidad || product.dimensiones || product.peso || product.pais_origen) && (
            <div className="grid grid-cols-2 gap-2 text-sm border rounded-lg p-4 bg-muted/30">
              {product.marca && (
                <div>
                  <span className="text-muted-foreground">Marca:</span>
                  <Link href={`/productos?marca=${encodeURIComponent(product.marca)}`} className="ml-2 font-medium hover:underline" aria-label="Ver productos">
                    {product.marca}
                  </Link>
                </div>
              )}
              {product.material && (
                <div>
                  <span className="text-muted-foreground">Material:</span>
                  <Link href={`/productos?material=${encodeURIComponent(product.material)}`} className="ml-2 font-medium hover:underline" aria-label="Ver productos">
                    {product.material}
                  </Link>
                </div>
              )}
              {product.color && (
                <div>
                  <span className="text-muted-foreground">Color:</span>
                  <Link href={`/productos?color=${encodeURIComponent(product.color)}`} className="ml-2 font-medium hover:underline" aria-label="Ver productos">
                    {product.color}
                  </Link>
                </div>
              )}
              {product.dimensiones && (
                <div>
                  <span className="text-muted-foreground">Dimensiones:</span>
                  <span className="ml-2 font-medium">{product.dimensiones}</span>
                </div>
              )}
              {product.peso && (
                <div>
                  <span className="text-muted-foreground">Peso:</span>
                  <span className="ml-2 font-medium">{product.peso} kg</span>
                </div>
              )}
              {product.capacidad && (
                <div>
                  <span className="text-muted-foreground">Capacidad:</span>
                  <span className="ml-2 font-medium">{product.capacidad}</span>
                </div>
              )}
              {product.pais_origen && (
                <div>
                  <span className="text-muted-foreground">País de Origen:</span>
                  <span className="ml-2 font-medium">{product.pais_origen}</span>
                </div>
              )}
            </div>
          )}

          {/* Botones de acción */}
          <div className="space-y-3">
            <AddToCartButton product={product} disabled={!hasStock} />
            {!hasStock && (
              <NotifyStockButton
                productId={product.id}
                productName={product.nombre_comercial || product.pdt_descripcion}
                userEmail={user?.email || undefined}
              />
            )}
            <div className="flex gap-2">
              <FavoriteButton 
                productId={product.id} 
                initialIsFavorite={isFavorited}
                variant="button"
                className="flex-1"
              />
              <ShareButton
                variant="outline"
                className="flex-1 bg-transparent"
                url={`/productos/${silo}/${slug}`}
                title={product.nombre_comercial || product.pdt_descripcion}
                text={`Mira este producto en Mesanova: ${product.nombre_comercial || product.pdt_descripcion}`}
                label="Compartir"
              />
            </div>
            <AddToListButton
              productId={product.id}
              wishlists={wishlists}
              giftRegistries={giftRegistries}
            />
          </div>

          {/* Información de envío */}
          <div className="border rounded-lg p-4 space-y-2 bg-muted/50">
            <div className="flex items-center gap-2">
              <Truck className="h-5 w-5 text-muted-foreground" />
              <span className="font-medium">Envío disponible</span>
            </div>
            <p className="text-sm text-muted-foreground">Envío gratis en compras superiores a $200.000</p>
          </div>

          {/* Categorías */}
          {product.categories && product.categories.length > 0 && (
            <div>
              <p className="text-sm font-medium mb-2">Categorías:</p>
              <div className="flex flex-wrap gap-2">
                {product.categories.map((cat) => (
                  <Badge key={cat.id} variant="outline">
                    <Link href={`/productos/${cat.subcategory?.silo?.slug}#${cat.subcategory?.slug}`} aria-label="Ver categoría">
                      {cat.subcategory?.name}
                    </Link>
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {product.product_types && product.product_types.length > 0 && (
            <div>
              <p className="text-sm font-medium mb-2">Tipo de producto:</p>
              <div className="flex flex-wrap gap-2">
                {product.product_types.map((pt) => (
                  <Badge key={pt.id} variant="secondary">
                    {pt.product_type?.name}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      <Separator className="my-8" />

      {/* Tabs de información detallada */}
      <Tabs defaultValue="description" className="mb-12">
        <TabsList className="grid w-full grid-cols-4 md:grid-cols-6">
          <TabsTrigger value="description">Descripción</TabsTrigger>
          <TabsTrigger value="specs">Especificaciones</TabsTrigger>
          <TabsTrigger value="reviews">Reseñas ({ratingStats.total})</TabsTrigger>
          {(product.instrucciones_uso || product.instrucciones_cuidado || product.garantia) && (
            <TabsTrigger value="instructions">Instrucciones</TabsTrigger>
          )}
          {videos.length > 0 && <TabsTrigger value="videos">Videos</TabsTrigger>}
          <TabsTrigger value="shipping">Envío</TabsTrigger>
        </TabsList>

        <TabsContent value="description" className="mt-6">
          <div className="prose max-w-none">
            <h3 className="text-xl font-semibold mb-4">Descripción del Producto</h3>
            <p className="text-muted-foreground leading-relaxed">
              {product.descripcion_larga || product.pdt_descripcion}
            </p>
            {product.caracteristicas && (
              <div className="mt-6">
                <h4 className="text-lg font-semibold mb-3">Características</h4>
                <p className="text-muted-foreground whitespace-pre-line">{product.caracteristicas}</p>
              </div>
            )}
            {product.momentos_uso && (
              <div className="mt-6">
                <h4 className="text-lg font-semibold mb-3">Momentos de Uso</h4>
                <p className="text-muted-foreground whitespace-pre-line">{product.momentos_uso}</p>
              </div>
            )}
            {!!distributorForPricing && product.descripcion_distribuidor && (
              <div className="mt-6">
                <h4 className="text-lg font-semibold mb-3">Descrip Distribuidor</h4>
                <p className="text-muted-foreground whitespace-pre-line">{product.descripcion_distribuidor}</p>
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="specs" className="mt-6">
          <h3 className="text-xl font-semibold mb-4">Especificaciones Técnicas</h3>
          <div className="grid gap-2">
            {!!distributorForPricing && product.argumentos_venta && (
              <div className="flex justify-between py-2 border-b">
                <span className="font-medium">Argumentos de Venta Distribuidor:</span>
                <span className="text-muted-foreground">{product.argumentos_venta}</span>
              </div>
            )}
            {!!distributorForPricing && product.ubicacion_tienda && (
              <div className="flex justify-between py-2 border-b">
                <span className="font-medium">Ubicación Tienda Distribuidor:</span>
                <span className="text-muted-foreground">{product.ubicacion_tienda}</span>
              </div>
            )}
            {!!distributorForPricing && typeof product.margen_sugerido === "number" && (
              <div className="flex justify-between py-2 border-b">
                <span className="font-medium">Margen Sugerido:</span>
                <span className="text-muted-foreground">{product.margen_sugerido}%</span>
              </div>
            )}
            {!!distributorForPricing && product.rotacion_esperada && (
              <div className="flex justify-between py-2 border-b">
                <span className="font-medium">Rotación Esperada:</span>
                <span className="text-muted-foreground capitalize">{product.rotacion_esperada}</span>
              </div>
            )}
            {product.dimensiones && (
              <div className="flex justify-between py-2 border-b">
                <span className="font-medium">Dimensiones:</span>
                <span className="text-muted-foreground">{product.dimensiones}</span>
              </div>
            )}
            {product.peso && (
              <div className="flex justify-between py-2 border-b">
                <span className="font-medium">Peso:</span>
                <span className="text-muted-foreground">{product.peso} kg</span>
              </div>
            )}
            {product.pais_origen && (
              <div className="flex justify-between py-2 border-b">
                <span className="font-medium">País de Origen:</span>
                <span className="text-muted-foreground">{product.pais_origen}</span>
              </div>
            )}
            {product.linea_producto && (
              <div className="flex justify-between py-2 border-b">
                <span className="font-medium">Línea:</span>
                <span className="text-muted-foreground">{product.linea_producto}</span>
              </div>
            )}
            {product.especificaciones_tecnicas && Object.keys(product.especificaciones_tecnicas).length > 0 && (
              <>
                {Object.entries(product.especificaciones_tecnicas).map(([key, value]) => (
                  <div key={key} className="flex justify-between py-2 border-b">
                    <span className="font-medium capitalize">{key.replace(/_/g, " ")}:</span>
                    <span className="text-muted-foreground">{String(value)}</span>
                  </div>
                ))}
              </>
            )}
          </div>
        </TabsContent>

        <TabsContent value="reviews" className="mt-6">
          <ProductReviews
            productId={product.id}
            reviews={(reviewsData.reviews || []).map((r: any) => ({
              ...r,
              user: Array.isArray(r.user) ? r.user[0] : r.user
            }))}
            stats={ratingStats}
            currentUserId={user?.id}
          />
        </TabsContent>

        {(product.instrucciones_uso || product.instrucciones_cuidado || product.garantia) && (
          <TabsContent value="instructions" className="mt-6">
            <div className="space-y-6">
              {product.instrucciones_uso && (
                <div>
                  <h3 className="text-xl font-semibold mb-4">Instrucciones de Uso</h3>
                  <p className="text-muted-foreground whitespace-pre-line leading-relaxed">
                    {product.instrucciones_uso}
                  </p>
                </div>
              )}
              {product.instrucciones_cuidado && (
                <div>
                  <h3 className="text-xl font-semibold mb-4">Cuidado y Mantenimiento</h3>
                  <p className="text-muted-foreground whitespace-pre-line leading-relaxed">
                    {product.instrucciones_cuidado}
                  </p>
                </div>
              )}
              {product.garantia && (
                <div>
                  <h3 className="text-xl font-semibold mb-4">Garantía</h3>
                  <p className="text-muted-foreground whitespace-pre-line leading-relaxed">{product.garantia}</p>
                </div>
              )}
            </div>
          </TabsContent>
        )}

        {videos.length > 0 && (
          <TabsContent value="videos" className="mt-6">
            <h3 className="text-xl font-semibold mb-4">Videos del Producto</h3>
            <div className="grid md:grid-cols-2 gap-4">
              {videos.map((video) => (
                <div key={video.id} className="aspect-video rounded-lg overflow-hidden bg-muted">
                  <iframe
                    src={video.url}
                    title={video.title || "Video del producto"}
                    className="w-full h-full"
                    allowFullScreen
                  />
                </div>
              ))}
            </div>
          </TabsContent>
        )}

        {/* Tab de envío */}
        <TabsContent value="shipping" className="mt-6">
          <div className="space-y-6">
            <div>
              <h3 className="text-xl font-semibold mb-4">Envíos</h3>
              <ul className="space-y-2 text-muted-foreground">
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                  <span>Envío gratis en compras superiores a $200.000</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                  <span>Entrega en 2-5 días hábiles</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                  <span>Seguimiento de pedido en tiempo real</span>
                </li>
              </ul>
            </div>
          </div>
        </TabsContent>
      </Tabs>

      {/* Productos relacionados */}
      {relatedProducts.length > 0 && (
        <section className="mb-12">
          <h2 className="text-2xl font-bold mb-6">Productos Relacionados</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {relatedProducts.map((p) => (
              <ProductCard key={p.id} product={p} distributor={distributorForPricing} />
            ))}
          </div>
        </section>
      )}

      {/* Productos vistos recientemente */}
      <RecentlyViewedProducts excludeProductId={product.id} />
    </div>
  )
}

export async function generateMetadata({ params }: ProductPageProps) {
  const { slug, silo } = await params
  const product = await getProductBySlug(slug)

  if (!product) {
    return {
      title: "Producto no encontrado",
    }
  }

  const title = product.seo_title || product.nombre_comercial || product.pdt_descripcion
  const description = product.seo_description || product.descripcion_larga || product.pdt_descripcion
  const imageUrl = product.imagen_principal_url || undefined

  return {
    title,
    description,
    keywords: product.seo_keywords?.join(", "),
    openGraph: {
      title,
      description,
      type: "website",
      url: `https://mesanova.co/productos/${silo}/${slug}`,
      images: imageUrl ? [{ url: imageUrl, alt: title }] : [],
      siteName: "Mesanova",
      locale: "es_CO",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: imageUrl ? [imageUrl] : [],
    },
    alternates: {
      canonical: `https://mesanova.co/productos/${silo}/${slug}`,
    },
  }
}
