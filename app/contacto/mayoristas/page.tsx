import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Building2, Package, TrendingUp, Truck } from "lucide-react"
import { ContactForm } from "@/components/forms/contact-form"

export const metadata = {
  title: "Mayoristas del Hogar - Mesanova",
  description: "Soluciones para mayoristas del hogar con precios especiales y condiciones preferenciales",
}

const beneficios = [
  {
    icon: TrendingUp,
    title: "Descuentos por Volumen",
    description: "Precios especiales según volumen de compra con descuentos progresivos",
  },
  {
    icon: Package,
    title: "Pedidos Mínimos Flexibles",
    description: "Condiciones adaptadas a tus necesidades de stock y rotación",
  },
  {
    icon: Truck,
    title: "Logística Dedicada",
    description: "Entregas programadas y servicio de distribución prioritario",
  },
  {
    icon: Building2,
    title: "Asesoría Comercial",
    description: "Equipo comercial dedicado para optimizar tu inventario",
  },
]

export default function MayoristasPage() {
  return (
    <main className="min-h-screen bg-background">
      <section className="py-12 px-4 bg-gradient-to-b from-primary/5 to-background">
        <div className="container mx-auto max-w-4xl text-center">
          <Building2 className="h-12 w-12 text-primary mx-auto mb-4" />
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Mayoristas del Hogar</h1>
          <p className="text-lg text-muted-foreground leading-relaxed">
            Soluciones integrales para distribuidores mayoristas con más de 40 años respaldando tu negocio
          </p>
        </div>
      </section>

      <section className="py-12 px-4">
        <div className="container mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12">Beneficios para Mayoristas</h2>
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
        </div>
      </section>

      <section className="py-12 px-4 bg-muted/50">
        <div className="container mx-auto max-w-2xl">
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl">Solicita Información</CardTitle>
              <CardDescription>
                Completa el formulario y nuestro equipo comercial se pondrá en contacto contigo en menos de 24 horas
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ContactForm tipo="mayoristas" showVolumen={true} />
            </CardContent>
          </Card>
        </div>
      </section>
    </main>
  )
}
