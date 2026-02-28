import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Home, MessageCircle, Phone, Mail } from "lucide-react"
import { ContactForm } from "@/components/forms/contact-form"

export const metadata = {
  title: "Cliente Final - Mesanova",
  description: "Atención para clientes finales, consultas de productos y soporte",
}

export default function ClienteFinalPage() {
  return (
    <main className="min-h-screen bg-background">
      <section className="py-12 px-4 bg-gradient-to-b from-primary/5 to-background">
        <div className="container mx-auto max-w-4xl text-center">
          <Home className="h-12 w-12 text-primary mx-auto mb-4" />
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Estamos aquí para ayudarte</h1>
          <p className="text-lg text-muted-foreground leading-relaxed">
            ¿Tienes preguntas sobre nuestros productos? ¿Necesitas ayuda con tu pedido? Contáctanos y te responderemos
            lo antes posible
          </p>
        </div>
      </section>

      <section className="py-12 px-4">
        <div className="container mx-auto max-w-4xl">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
            <Card>
              <CardHeader className="text-center">
                <Phone className="h-8 w-8 text-primary mx-auto mb-2" />
                <CardTitle>Teléfono</CardTitle>
              </CardHeader>
              <CardContent className="text-center">
                <p className="text-sm text-muted-foreground mb-2">Lunes a Viernes</p>
                <p className="text-sm text-muted-foreground mb-2">8:30 AM - 5:30 PM</p>
                <p className="font-semibold">+57 315 4049651</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="text-center">
                <Mail className="h-8 w-8 text-primary mx-auto mb-2" />
                <CardTitle>Email</CardTitle>
              </CardHeader>
              <CardContent className="text-center">
                <p className="text-sm text-muted-foreground mb-2">Respondemos en 24 horas</p>
                <p className="font-semibold break-all">hola@alumaronline.com</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="text-center">
                <MessageCircle className="h-8 w-8 text-primary mx-auto mb-2" />
                <CardTitle>WhatsApp</CardTitle>
              </CardHeader>
              <CardContent className="text-center">
                <p className="text-sm text-muted-foreground mb-2">Chat en tiempo real</p>
                <p className="text-sm text-muted-foreground mb-2">Horario de oficina</p>
                <Button variant="outline" size="sm" asChild>
                  <a
                    href="https://wa.me/573154049651?text=Hola%2C%20necesito%20ayuda%20con%20un%20pedido."
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Iniciar Chat
                  </a>
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      <section className="py-12 px-4 bg-muted/50">
        <div className="container mx-auto max-w-2xl">
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl">Envíanos un mensaje</CardTitle>
              <CardDescription>
                Completa el formulario y nos pondremos en contacto contigo lo antes posible
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ContactForm tipo="cliente-final" showVolumen={false} />
            </CardContent>
          </Card>
        </div>
      </section>

      <section className="py-12 px-4">
        <div className="container mx-auto max-w-3xl">
          <Card>
            <CardHeader>
              <CardTitle>Preguntas Frecuentes</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="font-semibold mb-2">¿Hacen envíos a todo el país?</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Sí, realizamos envíos a nivel nacional. Los tiempos de entrega varían según la ubicación, generalmente
                  entre 3-7 días hábiles.
                </p>
              </div>
              <div>
                <h3 className="font-semibold mb-2">¿Cuál es el monto mínimo de compra?</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Para clientes finales no tenemos monto mínimo. Los envíos son gratuitos para compras superiores a
                  $100.
                </p>
              </div>
              <div>
                <h3 className="font-semibold mb-2">¿Tienen garantía los productos?</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Todos nuestros productos cuentan con garantía del fabricante. Además, aceptamos devoluciones dentro de
                  los primeros 30 días si el producto presenta defectos de fabricación.
                </p>
              </div>
              <div>
                <h3 className="font-semibold mb-2">¿Puedo ver los productos antes de comprar?</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Contamos con un punto de exhibición donde puedes ver nuestros productos. Contáctanos para coordinar
                  una visita.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>
    </main>
  )
}
