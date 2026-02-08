import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Building, ClipboardList, FileCheck, Users2 } from "lucide-react"
import { ContactForm } from "@/components/forms/contact-form"

export const metadata = {
  title: "Institucional - Mesanova",
  description: "Soluciones para hoteles, restaurantes, catering y proyectos institucionales",
}

const sectores = [
  {
    icon: Building,
    title: "Hoteles y Resorts",
    description: "Equipamiento completo para restaurantes, bares, room service y áreas comunes",
  },
  {
    icon: Users2,
    title: "Restaurantes y Cafeterías",
    description: "Vajilla, cristalería y utensilios para establecimientos de todos los tamaños",
  },
  {
    icon: ClipboardList,
    title: "Catering y Eventos",
    description: "Soluciones para servicios de catering, eventos corporativos y celebraciones",
  },
  {
    icon: FileCheck,
    title: "Instituciones",
    description: "Hospitales, escuelas, comedores corporativos y servicios de alimentación",
  },
]

export default function InstitucionalPage() {
  return (
    <main className="min-h-screen bg-background">
      <section className="py-12 px-4 bg-gradient-to-b from-primary/5 to-background">
        <div className="container mx-auto max-w-4xl text-center">
          <Building className="h-12 w-12 text-primary mx-auto mb-4" />
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Sector Institucional</h1>
          <p className="text-lg text-muted-foreground leading-relaxed">
            Proveedor especializado para hoteles, restaurantes, catering y servicios de alimentación institucional
          </p>
        </div>
      </section>

      <section className="py-12 px-4">
        <div className="container mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12">Sectores que Atendemos</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto mb-12">
            {sectores.map((sector) => {
              const Icon = sector.icon
              return (
                <Card key={sector.title}>
                  <CardHeader>
                    <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                      <Icon className="h-6 w-6 text-primary" />
                    </div>
                    <CardTitle>{sector.title}</CardTitle>
                    <CardDescription className="leading-relaxed">{sector.description}</CardDescription>
                  </CardHeader>
                </Card>
              )
            })}
          </div>

          <div className="max-w-3xl mx-auto space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Nuestras Soluciones Institucionales</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm leading-relaxed">
                <p>
                  <strong>Proyectos Llave en Mano:</strong> Asesoría completa desde la planificación hasta la entrega e
                  instalación
                </p>
                <p>
                  <strong>Productos HoReCa:</strong> Línea completa de vajilla resistente, cristalería
                  profesional y utensilios de alta durabilidad
                </p>
                <p>
                  <strong>Personalización:</strong> Opciones de marcado y personalización para hoteles y restaurantes
                </p>
                <p>
                  <strong>Contratos de Suministro:</strong> Convenios a largo plazo con precios fijos y reposición
                  automática
                </p>
                <p>
                  <strong>Logística Especializada:</strong> Entregas programadas, instalación y servicio post-venta
                </p>
              </CardContent>
            </Card>

            <Card className="bg-primary/5">
              <CardHeader>
                <CardTitle>Referencias y Experiencia</CardTitle>
              </CardHeader>
              <CardContent className="text-sm leading-relaxed">
                <p>
                  Con 33 años en el mercado, hemos equipado más de 200 proyectos institucionales incluyendo
                  cadenas hoteleras, restaurantes de alto nivel, servicios de catering corporativo y comedores
                  institucionales. Nuestro compromiso es entregar soluciones duraderas y confiables.
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
              <CardTitle className="text-2xl">Solicita una Cotización</CardTitle>
              <CardDescription>Cuéntanos sobre tu proyecto y te enviaremos una propuesta personalizada</CardDescription>
            </CardHeader>
            <CardContent>
              <ContactForm tipo="institucional" showVolumen={true} />
            </CardContent>
          </Card>
        </div>
      </section>
    </main>
  )
}
