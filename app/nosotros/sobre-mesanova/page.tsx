import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { MesanovaLogo } from "@/components/mesanova-logo"
import Image from "next/image"
import { Award, Heart, Leaf, Users, Shield, Building2, TrendingUp, Globe, ArrowRight } from "lucide-react"

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
    description:
      "Nacemos como Alumar, fundada por María Eugenia Bernal, con el propósito de llevar artículos para el hogar de alta calidad al mercado colombiano.",
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
    year: "2026",
    title: "Renovación de Marca: Mesanova",
    description:
      "En 2026 nos renovamos con una nueva marca: pasamos de llamarnos Alumar a llamarnos Mesanova, con una plataforma e-commerce moderna y una experiencia omnicanal.",
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
            Fundada en 1992 como Alumar por María Eugenia Bernal, Mesanova cuenta con profunda experiencia en el mercado
            colombiano de housewares. Somos especialistas en la distribución de artículos para cocina, mesa y hogar,
            ofreciendo productos de calidad que transforman espacios y momentos en experiencias memorables.
          </p>
        </div>
      </section>

      <section className="py-16 px-4 bg-background">
        <div className="container mx-auto">
          <h2 className="text-3xl font-bold text-center mb-4">El Equipo</h2>
          <p className="text-center text-muted-foreground mb-10 max-w-2xl mx-auto">
            Somos un equipo comprometido con el servicio, la calidad y las relaciones de largo plazo.
          </p>
          <div className="mx-auto max-w-6xl">
            <div className="relative w-full overflow-hidden rounded-xl border bg-muted/20">
              <Image
                src="/images/equipo-alumar.jpg"
                alt="Equipo Alumar"
                width={2400}
                height={900}
                className="h-auto w-full object-cover"
                priority
              />
            </div>
          </div>
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
          <div className="max-w-5xl mx-auto mb-12">
            <Card>
              <CardHeader>
                <CardTitle>Evolución de Marca</CardTitle>
                <CardDescription>De Alumar a Mesanova</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-[1fr_auto_1fr] items-center gap-6">
                  <div className="rounded-lg border bg-background p-6 flex items-center justify-center">
                    <Image
                      src="/images/alumar-logo.jpg"
                      alt="Logo Alumar"
                      width={520}
                      height={200}
                      className="h-auto w-full max-w-[420px] object-contain"
                    />
                  </div>

                  <div className="flex items-center justify-center">
                    <ArrowRight className="h-10 w-10 text-muted-foreground" />
                  </div>

                  <div className="rounded-lg border bg-background p-6 flex items-center justify-center">
                    <MesanovaLogo className="justify-center" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
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
