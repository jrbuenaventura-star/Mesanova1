import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { 
  ArrowRight, 
  Truck, 
  Shield, 
  Headphones, 
  CheckCircle,
  UtensilsCrossed,
  ChefHat,
  Wine,
  BookOpen
} from "lucide-react"
import { HeroCarousel } from "@/components/home/hero-carousel"
import { ProductCard } from "@/components/products/product-card"
import { createClient } from "@/lib/supabase/server"
import { getFeaturedProducts, getBlogPosts } from "@/lib/db/queries"
import { getCurrentDistributorPricingContext } from "@/lib/distributor-pricing-context"

export const metadata = {
  title: "Mesa y cocina bien pensadas",
  description: "Diseño, funcionalidad y calidad para usar todos los días.",
  openGraph: {
    title: "Mesa y cocina bien pensadas",
    description: "Diseño, funcionalidad y calidad para usar todos los días.",
    url: "https://mesanova.co/",
    siteName: "Mesanova",
    type: "website",
    locale: "es_CO",
  },
  twitter: {
    card: "summary_large_image",
    title: "Mesa y cocina bien pensadas",
    description: "Diseño, funcionalidad y calidad para usar todos los días.",
  },
}

async function getBannerSlides() {
  const supabase = await createClient()
  const { data } = await supabase
    .from('home_banner_slides')
    .select('*')
    .eq('is_active', true)
    .order('order_index', { ascending: true })
  return data || []
}

async function getCollections() {
  const supabase = await createClient()
  const { data } = await supabase
    .from('collections')
    .select('id, name, slug, description, image_url')
    .eq('is_active', true)
    .order('order_index', { ascending: true })
    .limit(3)
  return data || []
}

export default async function HomePage() {
  const [slides, featuredProducts, blogPosts, collections, distributorForPricing] = await Promise.all([
    getBannerSlides(),
    getFeaturedProducts(8),
    getBlogPosts(3),
    getCollections(),
    getCurrentDistributorPricingContext(),
  ])

  // Colecciones con copy personalizado (fallback si no hay colecciones en DB)
  const collectionCards = collections.length > 0
    ? collections.map((c) => ({
        name: c.name,
        slug: c.slug,
        description: c.description || "",
        imageUrl: c.image_url,
      }))
    : [
        {
          name: "La mesa diaria",
          slug: "mesa-diaria",
          description: "Piezas prácticas, combinables y pensadas para el uso cotidiano.",
          imageUrl: null,
        },
        {
          name: "Para recibir en casa",
          slug: "recibir-en-casa",
          description: "Productos que elevan la mesa cuando hay invitados.",
          imageUrl: null,
        },
        {
          name: "Bar & sobremesa",
          slug: "bar-sobremesa",
          description: "Copas y accesorios para disfrutar sin complicaciones.",
          imageUrl: null,
        },
      ]

  return (
    <div className="flex flex-col">
      {/* ═══════════════════════════════════════════
          BLOQUE 1 – HERO
      ═══════════════════════════════════════════ */}
      {slides.length > 0 ? (
        <section className="relative">
          <HeroCarousel slides={slides} hideContent />
          <div className="absolute inset-0 z-20">
            <div className="h-full container mx-auto px-4 flex items-center">
              <div className="max-w-2xl space-y-6 text-white">
                <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold tracking-tight leading-[1.05]">
                  Mesa y cocina bien pensadas
                </h1>
                <p className="text-lg md:text-xl opacity-90 max-w-lg">
                  Diseño, funcionalidad y calidad para usar todos los días.
                </p>
                <div className="flex flex-wrap gap-4 pt-2">
                  <Button asChild size="lg" className="text-base">
                    <Link href="/productos">
                      Ver productos
                      <ArrowRight className="ml-2 h-5 w-5" />
                    </Link>
                  </Button>
                  <Button asChild size="lg" variant="outline" className="text-base bg-transparent text-white border-white/40 hover:bg-white/10">
                    <Link href="#categorias">
                      Ver categorías
                    </Link>
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </section>
      ) : (
        <section className="relative py-24 md:py-36 px-4 bg-gradient-to-br from-stone-100 via-background to-stone-50 overflow-hidden">
          <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-5" />
          <div className="container mx-auto relative">
            <div className="max-w-2xl">
              <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold tracking-tight leading-[1.05] mb-6">
                Mesa y cocina bien pensadas
              </h1>
              <p className="text-lg md:text-xl text-muted-foreground mb-8 max-w-lg">
                Diseño, funcionalidad y calidad para usar todos los días.
              </p>
              <div className="flex flex-wrap gap-4">
                <Button asChild size="lg" className="text-base">
                  <Link href="/productos">
                    Ver productos
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Link>
                </Button>
                <Button asChild size="lg" variant="outline" className="text-base">
                  <Link href="#categorias">
                    Ver categorías
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ═══════════════════════════════════════════
          BLOQUE 2 – CATEGORÍAS PRINCIPALES
      ═══════════════════════════════════════════ */}
      <section id="categorias" className="py-20 px-4">
        <div className="container mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-14">
            Explora por categoría
          </h2>

          <div className="grid md:grid-cols-3 gap-8">
            {/* Mesa */}
            <Link href="/productos/mesa" className="group" aria-label="Mesa">
              <Card className="h-full overflow-hidden border-0 shadow-sm hover:shadow-xl transition-all duration-300">
                <div className="aspect-[4/3] bg-gradient-to-br from-amber-50 to-orange-50 flex items-center justify-center">
                  <UtensilsCrossed className="h-20 w-20 text-amber-600/60 group-hover:scale-110 transition-transform duration-300" />
                </div>
                <CardContent className="p-6">
                  <h3 className="text-xl font-bold mb-2">Mesa</h3>
                  <p className="text-muted-foreground text-sm mb-4">
                    Vajillas, cristalería y accesorios para el día a día y ocasiones especiales.
                  </p>
                  <span className="text-primary font-medium text-sm inline-flex items-center gap-1 group-hover:gap-2 transition-all">
                    Ver Mesa <ArrowRight className="h-4 w-4" />
                  </span>
                </CardContent>
              </Card>
            </Link>

            {/* Cocina */}
            <Link href="/productos/cocina" className="group" aria-label="Cocina">
              <Card className="h-full overflow-hidden border-0 shadow-sm hover:shadow-xl transition-all duration-300">
                <div className="aspect-[4/3] bg-gradient-to-br from-emerald-50 to-teal-50 flex items-center justify-center">
                  <ChefHat className="h-20 w-20 text-emerald-600/60 group-hover:scale-110 transition-transform duration-300" />
                </div>
                <CardContent className="p-6">
                  <h3 className="text-xl font-bold mb-2">Cocina</h3>
                  <p className="text-muted-foreground text-sm mb-4">
                    Ollas, utensilios y productos funcionales para cocinar mejor.
                  </p>
                  <span className="text-primary font-medium text-sm inline-flex items-center gap-1 group-hover:gap-2 transition-all">
                    Ver Cocina <ArrowRight className="h-4 w-4" />
                  </span>
                </CardContent>
              </Card>
            </Link>

            {/* Bar · Té · Café */}
            <Link href="/productos/cafe-te-bar" className="group" aria-label="Café, Té y Bar">
              <Card className="h-full overflow-hidden border-0 shadow-sm hover:shadow-xl transition-all duration-300">
                <div className="aspect-[4/3] bg-gradient-to-br from-violet-50 to-purple-50 flex items-center justify-center">
                  <Wine className="h-20 w-20 text-violet-600/60 group-hover:scale-110 transition-transform duration-300" />
                </div>
                <CardContent className="p-6">
                  <h3 className="text-xl font-bold mb-2">Bar · Té · Café</h3>
                  <p className="text-muted-foreground text-sm mb-4">
                    Copas, vasos y piezas pensadas para disfrutar cada momento.
                  </p>
                  <span className="text-primary font-medium text-sm inline-flex items-center gap-1 group-hover:gap-2 transition-all">
                    Ver Bar · Té · Café <ArrowRight className="h-4 w-4" />
                  </span>
                </CardContent>
              </Card>
            </Link>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════
          BLOQUE 3 – PRODUCTOS DESTACADOS
      ═══════════════════════════════════════════ */}
      {featuredProducts && featuredProducts.length > 0 && (
        <section className="py-20 px-4 bg-muted/30">
          <div className="container mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold mb-3">Los más elegidos</h2>
              <p className="text-muted-foreground max-w-lg mx-auto">
                Productos que funcionan bien, se usan todos los días y vuelven a comprarse.
              </p>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
              {featuredProducts.slice(0, 8).map((product: any) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  showFavoriteButton={false}
                  distributor={distributorForPricing}
                />
              ))}
            </div>

            <div className="text-center mt-10">
              <Button asChild variant="outline" size="lg">
                <Link href="/productos">
                  Ver productos
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
            </div>
          </div>
        </section>
      )}

      {/* ═══════════════════════════════════════════
          BLOQUE 4 – ¿POR QUÉ MESANOVA?
      ═══════════════════════════════════════════ */}
      <section className="py-20 px-4">
        <div className="container mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-14">
            ¿Por qué Mesanova?
          </h2>

          <div className="grid md:grid-cols-3 gap-10">
            <div className="text-center md:text-left">
              <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center mb-4 mx-auto md:mx-0">
                <CheckCircle className="h-6 w-6 text-primary" />
              </div>
              <h3 className="font-bold text-lg mb-2">Curaduría especializada</h3>
              <p className="text-muted-foreground text-sm leading-relaxed">
                Seleccionamos productos que funcionan en el uso real, no solo en la vitrina.
              </p>
            </div>

            <div className="text-center md:text-left">
              <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center mb-4 mx-auto md:mx-0">
                <Shield className="h-6 w-6 text-primary" />
              </div>
              <h3 className="font-bold text-lg mb-2">Diseño + durabilidad</h3>
              <p className="text-muted-foreground text-sm leading-relaxed">
                Materiales bien elegidos, pensados para durar y verse bien con el tiempo.
              </p>
            </div>

            <div className="text-center md:text-left">
              <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center mb-4 mx-auto md:mx-0">
                <Headphones className="h-6 w-6 text-primary" />
              </div>
              <h3 className="font-bold text-lg mb-2">Respaldo y experiencia</h3>
              <p className="text-muted-foreground text-sm leading-relaxed">
                Marca especializada de Alumar, con años de experiencia en el mercado colombiano.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════
          BLOQUE 5 – COLECCIONES
      ═══════════════════════════════════════════ */}
      <section className="py-20 px-4 bg-stone-50">
        <div className="container mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-14">
            Colecciones que se arman solas
          </h2>

          <div className="grid md:grid-cols-3 gap-8">
            {collectionCards.map((col) => (
              <Link aria-label="Ver productos"
                key={col.slug}
                href={`/productos?coleccion=${col.slug}`}
                className="group"
              >
                <Card className="h-full overflow-hidden border-0 shadow-sm hover:shadow-xl transition-all duration-300 bg-white">
                  {col.imageUrl ? (
                    <div className="aspect-[3/2] relative overflow-hidden">
                      <Image
                        src={col.imageUrl}
                        alt={col.name}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-500"
                        sizes="(max-width: 768px) 100vw, 33vw"
                      />
                    </div>
                  ) : (
                    <div className="aspect-[3/2] bg-gradient-to-br from-stone-100 to-stone-200 flex items-center justify-center">
                      <UtensilsCrossed className="h-16 w-16 text-stone-400/50" />
                    </div>
                  )}
                  <CardContent className="p-6">
                    <h3 className="text-lg font-bold mb-2">{col.name}</h3>
                    <p className="text-muted-foreground text-sm mb-4">{col.description}</p>
                    <span className="text-primary font-medium text-sm inline-flex items-center gap-1 group-hover:gap-2 transition-all">
                      Ver colección <ArrowRight className="h-4 w-4" />
                    </span>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════
          BLOQUE 6 – A MESA PUESTA (BLOG)
      ═══════════════════════════════════════════ */}
      {blogPosts && blogPosts.length > 0 && (
        <section className="py-20 px-4">
          <div className="container mx-auto">
            <div className="flex items-end justify-between mb-12">
              <div>
                <h2 className="text-3xl md:text-4xl font-bold mb-3">
                  Elegir mejor también es parte de la experiencia
                </h2>
              </div>
              <Button asChild variant="ghost" className="hidden md:flex">
                <Link href="/blog">
                  Ver blog
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              {blogPosts.slice(0, 3).map((post) => (
                <Link key={post.id} href={`/blog/${post.slug}`} className="group" aria-label="Leer artículo">
                  <Card className="h-full overflow-hidden border-0 shadow-sm hover:shadow-xl transition-all duration-300">
                    {post.featured_image_url ? (
                      <div className="aspect-[16/10] relative overflow-hidden">
                        <Image
                          src={post.featured_image_url}
                          alt={post.title}
                          fill
                          className="object-cover group-hover:scale-105 transition-transform duration-500"
                          sizes="(max-width: 768px) 100vw, 33vw"
                        />
                      </div>
                    ) : (
                      <div className="aspect-[16/10] bg-gradient-to-br from-primary/5 to-primary/10 flex items-center justify-center">
                        <BookOpen className="h-12 w-12 text-primary/30" />
                      </div>
                    )}
                    <CardContent className="p-6">
                      <h3 className="font-bold text-base mb-2 line-clamp-2 group-hover:text-primary transition-colors">
                        {post.title}
                      </h3>
                      {post.excerpt && (
                        <p className="text-muted-foreground text-sm line-clamp-2 mb-3">{post.excerpt}</p>
                      )}
                      <span className="text-primary font-medium text-sm inline-flex items-center gap-1 group-hover:gap-2 transition-all">
                        Leer artículo <ArrowRight className="h-4 w-4" />
                      </span>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>

            <div className="text-center mt-8 md:hidden">
              <Button asChild variant="outline">
                <Link href="/blog">
                  Ver blog
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>
          </div>
        </section>
      )}

      {/* ═══════════════════════════════════════════
          BLOQUE 7 – CONFIANZA Y SERVICIO
      ═══════════════════════════════════════════ */}
      <section className="py-12 px-4 border-y bg-muted/20">
        <div className="container mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <div className="flex flex-col items-center text-center gap-3">
              <Truck className="h-7 w-7 text-primary" />
              <span className="text-sm font-medium">Envíos a todo Colombia</span>
            </div>
            <div className="flex flex-col items-center text-center gap-3">
              <Shield className="h-7 w-7 text-primary" />
              <span className="text-sm font-medium">Compra segura</span>
            </div>
            <div className="flex flex-col items-center text-center gap-3">
              <Headphones className="h-7 w-7 text-primary" />
              <span className="text-sm font-medium">Atención al cliente</span>
            </div>
            <div className="flex flex-col items-center text-center gap-3">
              <CheckCircle className="h-7 w-7 text-primary" />
              <span className="text-sm font-medium">Productos seleccionados con criterio</span>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════
          BLOQUE 8 – CTA FINAL
      ═══════════════════════════════════════════ */}
      <section className="py-24 px-4 bg-primary text-primary-foreground">
        <div className="container mx-auto text-center">
          <h2 className="text-3xl md:text-5xl font-bold mb-8 max-w-xl mx-auto leading-tight">
            Empieza por la mesa. El resto se va armando.
          </h2>
          <Button asChild size="lg" variant="secondary" className="text-base">
            <Link href="/productos">
              Ver productos
              <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
          </Button>
        </div>
      </section>
    </div>
  )
}
