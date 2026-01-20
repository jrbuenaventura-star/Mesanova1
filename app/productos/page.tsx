import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ChefHat, UtensilsCrossed, Coffee, Thermometer, Briefcase, ArrowRight } from "lucide-react"

const silos = [
  {
    id: "cocina",
    name: "Cocina",
    description: "Organización, preparación, corte y todo para cocinar",
    icon: ChefHat,
    href: "/productos/cocina",
    color: "bg-primary text-primary-foreground",
  },
  {
    id: "mesa",
    name: "Mesa",
    description: "Vajilla, cubiertos, vasos y decoración para tu mesa",
    icon: UtensilsCrossed,
    href: "/productos/mesa",
    color: "bg-accent text-accent-foreground",
  },
  {
    id: "cafe-te-bar",
    name: "Café, Té y Bar",
    description: "Copas, vasos y todo para bebidas",
    icon: Coffee,
    href: "/productos/cafe-te-bar",
    color: "bg-secondary text-secondary-foreground",
  },
  {
    id: "termos-neveras",
    name: "Termos y Neveras",
    description: "Termos, neveras portátiles y botellas",
    icon: Thermometer,
    href: "/productos/termos-neveras",
    color: "bg-primary/10 text-primary",
  },
  {
    id: "profesional",
    name: "HoReCa",
    description: "Productos para hoteles, restaurantes y cafeterías",
    icon: Briefcase,
    href: "/productos/profesional",
    color: "bg-foreground text-background",
  },
]

export const metadata = {
  title: "Productos - Mesanova",
  description:
    "Explora nuestro catálogo completo de artículos para cocina, mesa, café, té, bar y HoReCa",
}

export default function ProductosPage() {
  return (
    <main className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="relative py-20 px-4 bg-gradient-to-b from-primary/5 to-background">
        <div className="container mx-auto text-center">
          <h1 className="text-4xl md:text-6xl font-bold text-foreground mb-4">Nuestros Productos</h1>
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-8">
            Tu tienda especializada en artículos para cocina, mesa y hogar. Calidad y variedad para distribuidores y
            consumidores finales.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" asChild>
              <Link href="/productos/cocina">
                Ver Catálogo
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link href="/ofertas">Ver Ofertas</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Silos Section */}
      <section className="py-16 px-4">
        <div className="container mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12">Explora Nuestras Categorías</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {silos.map((silo) => {
              const Icon = silo.icon
              return (
                <Link key={silo.id} href={silo.href}>
                  <Card className="h-full hover:shadow-lg transition-shadow cursor-pointer group">
                    <CardHeader>
                      <div className={`w-12 h-12 rounded-lg ${silo.color} flex items-center justify-center mb-4`}>
                        <Icon className="h-6 w-6" />
                      </div>
                      <CardTitle className="group-hover:text-primary transition-colors">{silo.name}</CardTitle>
                      <CardDescription>{silo.description}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <span className="text-sm text-primary font-medium flex items-center">
                        Ver productos
                        <ArrowRight className="ml-1 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                      </span>
                    </CardContent>
                  </Card>
                </Link>
              )
            })}
          </div>
        </div>
      </section>
    </main>
  )
}
