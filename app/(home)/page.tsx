import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ShoppingBag, Truck, Shield, CreditCard, Star, ArrowRight, Gift, Percent } from "lucide-react"

export default function HomePage() {
  return (
    <div className="flex flex-col">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-primary/10 via-background to-primary/5 py-20 md:py-32">
        <div className="container mx-auto px-4">
          <div className="grid gap-12 lg:grid-cols-2 items-center">
            <div className="space-y-8">
              <Badge className="w-fit">Calidad Premium desde 1995</Badge>
              <h1 className="text-4xl md:text-6xl font-bold tracking-tight">
                Productos de Aluminio de la Más Alta Calidad
              </h1>
              <p className="text-xl text-muted-foreground">
                Descubre nuestra amplia selección de utensilios de cocina, artículos para el hogar y soluciones profesionales en aluminio.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Button asChild size="lg" className="text-lg">
                  <Link href="/productos">
                    <ShoppingBag className="mr-2 h-5 w-5" />
                    Explorar Productos
                  </Link>
                </Button>
                <Button asChild variant="outline" size="lg" className="text-lg">
                  <Link href="/nosotros/sobre-mesanova">
                    Conoce Más
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Link>
                </Button>
              </div>
              
              {/* Trust Indicators */}
              <div className="flex flex-wrap gap-6 pt-4">
                <div className="flex items-center gap-2">
                  <Shield className="h-5 w-5 text-primary" />
                  <span className="text-sm font-medium">Garantía de Calidad</span>
                </div>
                <div className="flex items-center gap-2">
                  <Truck className="h-5 w-5 text-primary" />
                  <span className="text-sm font-medium">Envío Gratis +$200k</span>
                </div>
                <div className="flex items-center gap-2">
                  <CreditCard className="h-5 w-5 text-primary" />
                  <span className="text-sm font-medium">Pago Seguro</span>
                </div>
              </div>
            </div>
            
            <div className="relative h-[400px] md:h-[600px] rounded-2xl overflow-hidden shadow-2xl">
              <Image
                src="/images/hero-products.jpg"
                alt="Productos Mesanova"
                fill
                className="object-cover"
                priority
                onError={(e) => {
                  e.currentTarget.src = "/placeholder-hero.jpg"
                }}
              />
            </div>
          </div>
        </div>
      </section>

      {/* Ofertas Especiales */}
      <section className="py-16 bg-primary/5">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-2 gap-6">
            <Card className="overflow-hidden border-2 border-primary/20 hover:border-primary/40 transition-colors">
              <CardContent className="p-8">
                <div className="flex items-start gap-4">
                  <div className="p-3 bg-primary/10 rounded-lg">
                    <Percent className="h-8 w-8 text-primary" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-2xl font-bold mb-2">Cupones de Descuento</h3>
                    <p className="text-muted-foreground mb-4">
                      Usa el código <Badge variant="secondary" className="mx-1">BIENVENIDA10</Badge> y obtén 10% de descuento en tu primera compra
                    </p>
                    <Button asChild variant="outline">
                      <Link href="/ofertas">Ver Todas las Ofertas</Link>
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="overflow-hidden border-2 border-primary/20 hover:border-primary/40 transition-colors">
              <CardContent className="p-8">
                <div className="flex items-start gap-4">
                  <div className="p-3 bg-primary/10 rounded-lg">
                    <Gift className="h-8 w-8 text-primary" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-2xl font-bold mb-2">Bonos de Regalo</h3>
                    <p className="text-muted-foreground mb-4">
                      Regala calidad. Compra bonos desde $50,000 y sorprende a tus seres queridos
                    </p>
                    <Button asChild variant="outline">
                      <Link href="/bonos/comprar">Comprar Bono</Link>
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Categorías Destacadas */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Explora Nuestras Categorías</h2>
            <p className="text-xl text-muted-foreground">
              Encuentra exactamente lo que necesitas
            </p>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {[
              { name: "Cocina", href: "/productos/cocina", icon: "🍳" },
              { name: "Hogar", href: "/productos/hogar", icon: "🏠" },
              { name: "Profesional", href: "/productos/profesional", icon: "👨‍🍳" },
              { name: "Ofertas", href: "/ofertas", icon: "🏷️" },
            ].map((category) => (
              <Link key={category.name} href={category.href}>
                <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full">
                  <CardContent className="p-6 text-center">
                    <div className="text-5xl mb-4">{category.icon}</div>
                    <h3 className="font-semibold text-lg">{category.name}</h3>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Beneficios */}
      <section className="py-16 bg-muted/50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">¿Por Qué Elegir Mesanova?</h2>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            <Card>
              <CardContent className="p-6 text-center">
                <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                  <Star className="h-8 w-8 text-primary" />
                </div>
                <h3 className="font-bold text-xl mb-2">Calidad Garantizada</h3>
                <p className="text-muted-foreground">
                  Más de 25 años fabricando productos de aluminio de la más alta calidad
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6 text-center">
                <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                  <Truck className="h-8 w-8 text-primary" />
                </div>
                <h3 className="font-bold text-xl mb-2">Envío Rápido</h3>
                <p className="text-muted-foreground">
                  Envío gratis en compras superiores a $200,000. Entrega en 3-5 días hábiles
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6 text-center">
                <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                  <Shield className="h-8 w-8 text-primary" />
                </div>
                <h3 className="font-bold text-xl mb-2">Compra Segura</h3>
                <p className="text-muted-foreground">
                  Múltiples métodos de pago seguros. Tus datos están protegidos
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Final */}
      <section className="py-20 bg-primary text-primary-foreground">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-5xl font-bold mb-6">
            ¿Listo para Comenzar?
          </h2>
          <p className="text-xl mb-8 opacity-90 max-w-2xl mx-auto">
            Descubre nuestra colección completa de productos de aluminio premium
          </p>
          <Button asChild size="lg" variant="secondary" className="text-lg">
            <Link href="/productos">
              Ver Todos los Productos
              <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
          </Button>
        </div>
      </section>
    </div>
  )
}
