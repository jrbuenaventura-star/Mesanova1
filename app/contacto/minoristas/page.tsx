import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Store, ShoppingBag, Headphones, Award } from "lucide-react"
import { ContactForm } from "@/components/forms/contact-form"

export const metadata = {
  title: "Minoristas del Hogar - Mesanova",
  description: "Soluciones para tiendas minoristas y boutiques del hogar",
}

const beneficios = [
  {
    icon: ShoppingBag,
    title: "Pedidos Accesibles",
    description: "Cantidades mínimas adaptadas para tiendas pequeñas y medianas",
  },
  {
    icon: Award,
    title: "Productos Exclusivos",
    description: "Acceso a líneas especiales y productos de temporada",
  },
  {
    icon: Headphones,
    title: "Soporte Comercial",
    description: "Asesoría en selección de productos y tendencias del mercado",
  },
  {
    icon: Store,
    title: "Material de Punto de Venta",
    description: "Displays, catálogos y material promocional para tu tienda",
  },
]

export default function MinoristasPage() {
  return (
    <main className="min-h-screen bg-background">
      <section className="py-12 px-4 bg-gradient-to-b from-primary/5 to-background">
        <div className="container mx-auto max-w-4xl text-center">
          <Store className="h-12 w-12 text-primary mx-auto mb-4" />
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Minoristas del Hogar</h1>
          <p className="text-lg text-muted-foreground leading-relaxed">
            Tu aliado para tener una tienda bien surtida con productos de calidad y servicio personalizado
          </p>
        </div>
      </section>

      <section className="py-12 px-4">
        <div className="container mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12">¿Por qué trabajar con nosotros?</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto mb-12">
            {beneficios.map((beneficio) => {
              const Icon = beneficio.icon
              return (
                <Card key={beneficio.title}>
                  <CardHeader>
                    <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                      <Icon className="h-6 w-6 text-primary" />
                    </div>
                    <CardTitle>{beneficio.title}</CardTitle>
                    <CardDescription className="leading-relaxed">{beneficio.description}</CardDescription>
                  </CardHeader>
                </Card>
              )
            })}
          </div>

          <div className="max-w-3xl mx-auto">
            <Card className="bg-muted/50">
              <CardHeader>
                <CardTitle>Condiciones Especiales</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm leading-relaxed">
                <p>
                  <strong>Pedidos mínimos:</strong> Desde $500 para tu primera orden
                </p>
                <p>
                  <strong>Plazos de pago:</strong> Condiciones flexibles según tu historial comercial
                </p>
                <p>
                  <strong>Entregas:</strong> Servicio de entrega programada con 2-3 días hábiles
                </p>
                <p>
                  <strong>Devoluciones:</strong> Política de devolución flexible para productos defectuosos
                </p>
                <p>
                  <strong>Catálogos:</strong> Actualizaciones mensuales de catálogo digital y físico sin costo
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      <section className="py-12 px-4 bg-muted/50">
        <div className="container mx-auto max-w-2xl">
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl">Contáctanos</CardTitle>
              <CardDescription>
                Completa el formulario y te enviaremos información sobre precios y condiciones para minoristas
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ContactForm tipo="minoristas" showVolumen={false} />
            </CardContent>
          </Card>
        </div>
      </section>
    </main>
  )
}
