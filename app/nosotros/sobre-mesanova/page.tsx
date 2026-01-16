import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Award, Heart, Leaf, Users, Shield, Building2, TrendingUp, Globe } from "lucide-react"

export const metadata = {
  title: "Sobre Mesanova - Nosotros",
  description:
    "Conoce la historia, misión y valores de Mesanova, tu tienda especializada en artículos para cocina y hogar",
}

const valores = [
  {
    icon: Award,
    title: "Calidad Premium",
    description: "Seleccionamos cuidadosamente cada producto para garantizar la máxima calidad y durabilidad",
  },
  {
    icon: Heart,
    title: "Pasión por el Hogar",
    description: "Amamos lo que hacemos y nos esforzamos por hacer de tu hogar un lugar especial",
  },
  {
    icon: Users,
    title: "Servicio Personalizado",
    description: "Atención dedicada a distribuidores y clientes finales con soluciones a medida",
  },
  {
    icon: Leaf,
    title: "Sostenibilidad",
    description: "Comprometidos con productos duraderos y prácticas comerciales responsables",
  },
]

const hitos = [
  {
    year: "1992",
    title: "Fundación",
    description: "Inicio de operaciones como distribuidor especializado de artículos para el hogar en Colombia",
  },
  {
    year: "2000",
    title: "Expansión Nacional",
    description: "Consolidación como proveedor líder en el mercado colombiano de housewares",
  },
  {
    year: "2017",
    title: "Catálogo Digital",
    description: "Lanzamiento de nuestra primera plataforma de catálogo en línea",
  },
  {
    year: "2025",
    title: "Mesanova",
    description: "Renovación completa con plataforma e-commerce moderna y experiencia omnicanal",
  },
]

const garantias = [
  {
    icon: Shield,
    title: "Nuestra Garantía",
    description: "Respaldamos cada producto con garantía de calidad. Tu satisfacción es nuestra prioridad.",
  },
  {
    icon: Building2,
    title: "Más de 4,000 Clientes",
    description:
      "Comercios, restaurantes, hoteles y grandes cadenas confían en Mesanova como su proveedor habitual de housewares.",
  },
  {
    icon: TrendingUp,
    title: "Mejores Precios del Mercado",
    description: "Como grandes importadores, ofrecemos precios altamente competitivos sin comprometer la calidad.",
  },
  {
    icon: Globe,
    title: "Fabricantes de Primer Nivel",
    description: "Distribuimos productos de fabricantes globales reconocidos por su excelencia y diseño.",
  },
]

export default function SobreMesanovaPage() {
  return (
    <main className="min-h-screen bg-background">
      <section className="py-16 px-4 bg-gradient-to-b from-primary/5 to-background">
        <div className="container mx-auto">
          <h1 className="text-4xl md:text-5xl font-bold text-center mb-6">Sobre Mesanova</h1>
          <p className="text-lg text-muted-foreground text-center max-w-3xl mx-auto leading-relaxed">
            Fundada en 1992, Mesanova cuenta con profunda experiencia en el mercado colombiano de housewares. Somos
            especialistas en la distribución de artículos para cocina, mesa y hogar, ofreciendo productos de calidad que
            transforman espacios y momentos en experiencias memorables.
          </p>
        </div>
      </section>

      <section className="py-16 px-4 bg-background">
        <div className="container mx-auto">
          <h2 className="text-3xl font-bold text-center mb-4">¿Por Qué Confiar en Nosotros?</h2>
          <p className="text-center text-muted-foreground mb-12 max-w-2xl mx-auto">
            Más de tres décadas de compromiso con la excelencia nos respaldan
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {garantias.map((garantia) => {
              const Icon = garantia.icon
              return (
                <Card key={garantia.title} className="border-2">
                  <CardHeader>
                    <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                      <Icon className="h-6 w-6 text-primary" />
                    </div>
                    <CardTitle className="text-lg">{garantia.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <CardDescription className="leading-relaxed">{garantia.description}</CardDescription>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </div>
      </section>

      <section className="py-16 px-4 bg-muted/50">
        <div className="container mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12">Nuestra Historia</h2>
          <div className="max-w-4xl mx-auto">
            <div className="space-y-8">
              {hitos.map((hito, index) => (
                <div key={hito.year} className="flex gap-6 items-start">
                  <div className="flex-shrink-0">
                    <Badge variant="default" className="text-lg px-4 py-2">
                      {hito.year}
                    </Badge>
                  </div>
                  <div className="flex-1">
                    <h3 className="text-xl font-bold mb-2">{hito.title}</h3>
                    <p className="text-muted-foreground leading-relaxed">{hito.description}</p>
                  </div>
                  {index < hitos.length - 1 && <div className="hidden md:block w-px h-16 bg-border ml-12" />}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="py-16 px-4 bg-background">
        <div className="container mx-auto">
          <h2 className="text-3xl font-bold text-center mb-4">Nuestros Valores</h2>
          <p className="text-center text-muted-foreground mb-12 max-w-2xl mx-auto">
            Estos principios guían cada decisión que tomamos y cada producto que ofrecemos
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {valores.map((valor) => {
              const Icon = valor.icon
              return (
                <Card key={valor.title}>
                  <CardHeader>
                    <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                      <Icon className="h-6 w-6 text-primary" />
                    </div>
                    <CardTitle className="text-lg">{valor.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <CardDescription className="leading-relaxed">{valor.description}</CardDescription>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </div>
      </section>
    </main>
  )
}
