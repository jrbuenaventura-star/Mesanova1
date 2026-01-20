import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { Star, Quote } from "lucide-react"

export const metadata = {
  title: "¿Por qué elegirnos? - Mesanova",
  description: "Descubre por qué somos la mejor opción para distribuidores y clientes del hogar",
}

const testimonios = [
  {
    name: "María González",
    role: "Cliente desde 2019",
    rating: 5,
    comment:
      "Excelente servicio y productos de calidad. Compré un juego completo de ollas y quedé encantada con la durabilidad. La atención al cliente es excepcional.",
  },
  {
    name: "Carlos Ramírez",
    role: "Distribuidor mayorista",
    rating: 5,
    comment:
      "Como distribuidor, valoro mucho la disponibilidad de inventario y los tiempos de entrega. Mesanova nunca me ha fallado. Su plataforma es muy fácil de usar.",
  },
  {
    name: "Ana Martínez",
    role: "Propietaria de restaurante",
    rating: 5,
    comment:
      "La línea HoReCa tiene todo lo que necesito para mi cocina. Precios competitivos y productos que realmente duran. Recomendados 100%.",
  },
  {
    name: "Jorge Díaz",
    role: "Cliente desde 2020",
    rating: 5,
    comment:
      "Renovamos toda la vajilla de nuestro hogar con productos de aquí. La variedad es impresionante y los diseños modernos. Muy satisfechos con la compra.",
  },
]

export default function PorQueElegirnosPage() {
  return (
    <main className="min-h-screen bg-background">
      <section className="py-16 px-4 bg-gradient-to-b from-primary/5 to-background">
        <div className="container mx-auto">
          <h1 className="text-4xl md:text-5xl font-bold text-center mb-6">¿Por qué elegirnos?</h1>
          <p className="text-lg text-muted-foreground text-center max-w-3xl mx-auto leading-relaxed">
            Descubre las razones por las que miles de clientes y distribuidores confían en nosotros
          </p>
        </div>
      </section>

      <section className="py-16 px-4">
        <div className="container mx-auto">
          <div className="max-w-3xl mx-auto">
            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Amplio Catálogo</CardTitle>
                  <CardDescription className="leading-relaxed">
                    Más de 5,000 productos organizados en 5 silos temáticos: Cocina, Mesa, Café/Té/Bar, Termos y
                    Neveras, y HoReCa. Desde utensilios básicos hasta equipamiento profesional.
                  </CardDescription>
                </CardHeader>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle>Marcas de Confianza</CardTitle>
                  <CardDescription className="leading-relaxed">
                    Trabajamos con las mejores marcas nacionales e internacionales, garantizando productos probados y
                    certificados que cumplen los más altos estándares de calidad.
                  </CardDescription>
                </CardHeader>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle>Atención Especializada</CardTitle>
                  <CardDescription className="leading-relaxed">
                    Nuestro equipo cuenta con décadas de experiencia. Ofrecemos asesoría personalizada tanto para
                    distribuidores mayoristas como para minoristas y clientes finales.
                  </CardDescription>
                </CardHeader>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle>Logística Eficiente</CardTitle>
                  <CardDescription className="leading-relaxed">
                    Contamos con 4 centros de distribución estratégicamente ubicados para garantizar entregas rápidas y
                    stock disponible en todo momento.
                  </CardDescription>
                </CardHeader>
              </Card>
            </div>
          </div>
        </div>
      </section>

      <section className="py-16 px-4 bg-muted/50">
        <div className="container mx-auto">
          <h2 className="text-3xl font-bold text-center mb-4">Lo que dicen nuestros clientes</h2>
          <p className="text-center text-muted-foreground mb-12 max-w-2xl mx-auto">
            Testimonios reales de clientes satisfechos con nuestros productos y servicios
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-6xl mx-auto">
            {testimonios.map((testimonio, index) => (
              <Card key={index} className="relative">
                <CardHeader>
                  <Quote className="absolute top-4 right-4 h-8 w-8 text-primary/20" />
                  <div className="flex gap-1 mb-3">
                    {Array.from({ length: testimonio.rating }).map((_, i) => (
                      <Star key={i} className="h-4 w-4 fill-primary text-primary" />
                    ))}
                  </div>
                  <CardDescription className="leading-relaxed text-base mb-4">"{testimonio.comment}"</CardDescription>
                  <div>
                    <CardTitle className="text-base">{testimonio.name}</CardTitle>
                    <p className="text-sm text-muted-foreground">{testimonio.role}</p>
                  </div>
                </CardHeader>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16 px-4">
        <div className="container mx-auto text-center">
          <h2 className="text-2xl md:text-3xl font-bold mb-4">¿Eres distribuidor?</h2>
          <p className="text-muted-foreground mb-8 max-w-xl mx-auto">
            Accede a precios especiales, información de inventario en tiempo real y herramientas exclusivas para
            gestionar tu negocio.
          </p>
          <Button variant="default" size="lg" asChild>
            <Link href="/auth/signup?tipo=distribuidor">Registrarme como Distribuidor</Link>
          </Button>
        </div>
      </section>
    </main>
  )
}
