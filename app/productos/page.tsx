import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ChefHat, UtensilsCrossed, Coffee, Briefcase, ArrowRight, Shield, Truck, Star, Gift } from "lucide-react"

const silos = [
  {
    id: "cocina",
    name: "Cocina",
    description: "Organización, preparación y todo para cocinar con estilo",
    icon: ChefHat,
    href: "/productos/cocina",
    color: "bg-primary text-primary-foreground",
    image: "/images/hero-mesa-cocina.jpg",
  },
  {
    id: "mesa",
    name: "Mesa",
    description: "Vajillas, platos, cubiertos y decoración elegante",
    icon: UtensilsCrossed,
    href: "/productos/mesa",
    color: "bg-accent text-accent-foreground",
    image: "/images/hero-mesa-cocina.jpg",
  },
  {
    id: "cafe-te-bar",
    name: "Café, Té y Bar",
    description: "Copas, vasos y accesorios para bebidas",
    icon: Coffee,
    href: "/productos/cafe-te-bar",
    color: "bg-secondary text-secondary-foreground",
    image: "/images/hero-mesa-cocina.jpg",
  },
  {
    id: "profesional",
    name: "HoReCa",
    description: "Soluciones profesionales para hoteles, restaurantes y cafeterías",
    icon: Briefcase,
    href: "/productos/profesional",
    color: "bg-foreground text-background",
    image: "/images/hero-mesa-cocina.jpg",
  },
]

export const metadata = {
  title: "Productos - Vajillas, Copas, Vasos y Platos | Mesanova",
  description:
    "Descubre nuestra colección de artículos para mesa y cocina. Vajillas, copas, vasos, platos y utensilios de la más alta calidad. Calidad premium desde 1995.",
}

export default function ProductosPage() {
  return (
    <main className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="relative py-20 md:py-32 px-4 bg-gradient-to-br from-primary/10 via-background to-primary/5">
        <div className="container mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-8">
              <Badge className="w-fit">Calidad Premium desde 1995</Badge>
              <h1 className="text-4xl md:text-6xl font-bold text-foreground">
                Artículos para Cocina y Mesa de la Más Alta Calidad
              </h1>
              <p className="text-lg md:text-xl text-muted-foreground">
                Descubre nuestra amplia selección de vajillas, copas, vasos, platos y utensilios para cocina. Elegancia y funcionalidad para tu hogar.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Button size="lg" asChild>
                  <Link href="/productos/cocina">
                    Explorar Productos
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Link>
                </Button>
                <Button size="lg" variant="outline" asChild>
                  <Link href="/ofertas">
                    <Gift className="mr-2 h-5 w-5" />
                    Ver Ofertas
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
                  <Star className="h-5 w-5 text-primary" />
                  <span className="text-sm font-medium">Productos Premium</span>
                </div>
              </div>
            </div>
            
            <div className="relative h-[400px] md:h-[600px] rounded-2xl overflow-hidden shadow-2xl bg-muted">
              <Image
                src="/images/hero-mesa-cocina.jpg"
                alt="Vajillas, Copas, Vasos y Platos Mesanova"
                fill
                className="object-cover"
                priority
              />
            </div>
          </div>
        </div>
      </section>

      {/* Categorías Section */}
      <section className="py-20 px-4 bg-muted/30">
        <div className="container mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Explora Nuestras Categorías</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Encuentra exactamente lo que necesitas para tu cocina y mesa
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {silos.map((silo) => {
              const Icon = silo.icon
              return (
                <Link key={silo.id} href={silo.href}>
                  <Card className="h-full hover:shadow-xl transition-all duration-300 cursor-pointer group border-2 hover:border-primary/50">
                    <CardHeader className="space-y-4">
                      <div className={`w-16 h-16 rounded-xl ${silo.color} flex items-center justify-center group-hover:scale-110 transition-transform`}>
                        <Icon className="h-8 w-8" />
                      </div>
                      <div>
                        <CardTitle className="text-xl group-hover:text-primary transition-colors mb-2">{silo.name}</CardTitle>
                        <CardDescription className="text-sm">{silo.description}</CardDescription>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <span className="text-sm text-primary font-semibold flex items-center">
                        Explorar categoría
                        <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-2 transition-transform" />
                      </span>
                    </CardContent>
                  </Card>
                </Link>
              )
            })}
          </div>
        </div>
      </section>

      {/* Beneficios Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">¿Por Qué Elegir Mesanova?</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Más de 25 años de experiencia en productos para mesa y cocina
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            <Card className="text-center border-2">
              <CardHeader>
                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Shield className="h-8 w-8 text-primary" />
                </div>
                <CardTitle>Calidad Garantizada</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Productos seleccionados con los más altos estándares de calidad y durabilidad
                </p>
              </CardContent>
            </Card>
            
            <Card className="text-center border-2">
              <CardHeader>
                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Truck className="h-8 w-8 text-primary" />
                </div>
                <CardTitle>Envío Rápido</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Envío gratis en compras superiores a $200.000. Despachos rápidos a todo el país
                </p>
              </CardContent>
            </Card>
            
            <Card className="text-center border-2">
              <CardHeader>
                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Star className="h-8 w-8 text-primary" />
                </div>
                <CardTitle>Atención Personalizada</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Asesoría especializada para ayudarte a encontrar los productos perfectos
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 bg-primary text-primary-foreground">
        <div className="container mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">¿Listo para Descubrir Nuestros Productos?</h2>
          <p className="text-lg mb-8 opacity-90 max-w-2xl mx-auto">
            Explora nuestra amplia selección de artículos para mesa y cocina
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" variant="secondary" asChild>
              <Link href="/productos/cocina">
                Ver Catálogo Completo
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" className="bg-transparent border-primary-foreground text-primary-foreground hover:bg-primary-foreground hover:text-primary" asChild>
              <Link href="/contacto/cliente-final">Contáctanos</Link>
            </Button>
          </div>
        </div>
      </section>
    </main>
  )
}
