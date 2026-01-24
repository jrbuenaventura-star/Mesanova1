import Link from "next/link"
import Image from "next/image"
import { MesanovaLogo } from "@/components/mesanova-logo"
import { Instagram, Facebook } from "lucide-react"

export function SiteFooter() {
  return (
    <footer className="border-t bg-muted/50">
      <div className="container max-w-7xl mx-auto py-12 md:py-16 px-6 md:px-8">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-5">
          <div className="space-y-4">
            <MesanovaLogo className="h-8" />
            <p className="text-sm text-muted-foreground">
              Tu tienda especializada en artículos para cocina, mesa y hogar.
            </p>
            <div className="pt-4">
              <p className="text-sm font-semibold mb-3">Síguenos</p>
              <div className="flex gap-3">
                <a
                  href="https://www.instagram.com/stories/alumar.colombia/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center w-10 h-10 rounded-full bg-primary/10 text-primary hover:bg-primary hover:text-primary-foreground transition-colors"
                  aria-label="Instagram"
                >
                  <Instagram className="h-5 w-5" />
                </a>
                <a
                  href="https://www.facebook.com/Alumar.Colombia"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center w-10 h-10 rounded-full bg-primary/10 text-primary hover:bg-primary hover:text-primary-foreground transition-colors"
                  aria-label="Facebook"
                >
                  <Facebook className="h-5 w-5" />
                </a>
              </div>
            </div>
          </div>

          <div>
            <h3 className="mb-4 text-sm font-semibold">Categorías</h3>
            <ul className="space-y-3 text-sm">
              <li>
                <Link
                  href="/productos/cocina"
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  Cocina
                </Link>
              </li>
              <li>
                <Link href="/productos/mesa" className="text-muted-foreground hover:text-foreground transition-colors">
                  Mesa
                </Link>
              </li>
              <li>
                <Link
                  href="/productos/cafe-te-bar"
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  Café, Té y Bar
                </Link>
              </li>
              <li>
                <Link
                  href="/productos/profesional"
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  HoReCa
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="mb-4 text-sm font-semibold">Empresa</h3>
            <ul className="space-y-3 text-sm">
              <li>
                <Link href="/nosotros" className="text-muted-foreground hover:text-foreground transition-colors">
                  Nosotros
                </Link>
              </li>
              <li>
                <Link href="/ofertas" className="text-muted-foreground hover:text-foreground transition-colors">
                  Ofertas
                </Link>
              </li>
              <li>
                <Link href="/blog" className="text-muted-foreground hover:text-foreground transition-colors">
                  Nuestra Mesa
                </Link>
              </li>
            </ul>
            <div className="mt-6 space-y-3">
              <p className="text-sm text-muted-foreground">Con la certificación:</p>
              <a
                href="https://www.coface.com"
                target="_blank"
                rel="noopener noreferrer"
                className="block transition-opacity hover:opacity-80"
              >
                <Image
                  src="/images/coface.png"
                  alt="Coface - For Safer Trade"
                  width={140}
                  height={50}
                  className="h-10 w-auto"
                />
              </a>
            </div>
          </div>

          <div>
            <h3 className="mb-4 text-sm font-semibold">Contacto</h3>
            <ul className="space-y-3 text-sm">
              <li>
                <Link
                  href="/contacto/mayoristas"
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  Mayoristas del hogar
                </Link>
              </li>
              <li>
                <Link
                  href="/contacto/minoristas"
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  Minoristas del hogar
                </Link>
              </li>
              <li>
                <Link
                  href="/contacto/institucional"
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  Institucional
                </Link>
              </li>
              <li>
                <Link
                  href="/contacto/cliente-final"
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  Cliente final
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="mb-4 text-sm font-semibold">Encuéntranos en</h3>
            <div className="space-y-4">
              <a
                href="https://www.falabella.com.co"
                target="_blank"
                rel="noopener noreferrer"
                className="block transition-opacity hover:opacity-80"
              >
                <Image
                  src="/images/falabella-logo.png"
                  alt="Falabella"
                  width={160}
                  height={40}
                  className="h-8 w-auto"
                />
              </a>
              <a
                href="https://www.exito.com"
                target="_blank"
                rel="noopener noreferrer"
                className="block transition-opacity hover:opacity-80"
              >
                <Image src="/images/exitocom.png" alt="Éxito" width={160} height={40} className="h-8 w-auto" />
              </a>
              <a
                href="https://www.homecenter.com.co"
                target="_blank"
                rel="noopener noreferrer"
                className="block transition-opacity hover:opacity-80"
              >
                <Image src="/images/homecenter.png" alt="Homecenter" width={200} height={60} className="h-12 w-auto" />
              </a>
            </div>
          </div>
        </div>

        <div className="mt-8 border-t pt-8 text-center text-sm text-muted-foreground">
          <p>&copy; {new Date().getFullYear()} Mesanova. Todos los derechos reservados.</p>
        </div>
      </div>
    </footer>
  )
}
