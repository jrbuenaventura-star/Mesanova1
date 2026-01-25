"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
  navigationMenuTriggerStyle,
} from "@/components/ui/navigation-menu"
import { Sheet, SheetClose, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { Menu, ChefHat, UtensilsCrossed, Coffee, Briefcase, Gift } from "lucide-react"
import { SearchAutocomplete } from "@/components/search/search-autocomplete"
import { SearchButton } from "@/components/search-button"
import { CartIcon } from "@/components/cart/cart-icon"
import { UserMenu } from "@/components/user-menu"

const silos = [
  {
    slug: "cocina",
    name: "Cocina",
    icon: ChefHat,
    description: "Organización, preparación y todo para cocinar",
  },
  {
    slug: "mesa",
    name: "Mesa",
    icon: UtensilsCrossed,
    description: "Vajilla, cubiertos y decoración",
  },
  {
    slug: "cafe-te-bar",
    name: "Café, Té y Bar",
    icon: Coffee,
    description: "Copas, vasos y accesorios para bebidas",
  },
  {
    slug: "profesional",
    name: "HoReCa",
    icon: Briefcase,
    description: "Soluciones para hoteles, restaurantes y cafeterías",
  },
]

const contactLinks = [
  { name: "Mayoristas del hogar", href: "/contacto/mayoristas" },
  { name: "Minoristas del hogar", href: "/contacto/minoristas" },
  { name: "Institucional", href: "/contacto/institucional" },
  { name: "Cliente final", href: "/contacto/cliente-final" },
]

export function SiteNav() {
  const router = useRouter()

  return (
    <>
      {/* Desktop Navigation */}
      <NavigationMenu className="hidden md:flex" viewport={false}>
        <NavigationMenuList>
          <NavigationMenuItem>
            <NavigationMenuLink asChild>
              <Link href="/" className={navigationMenuTriggerStyle()}>Home</Link>
            </NavigationMenuLink>
          </NavigationMenuItem>

          <NavigationMenuItem>
            <NavigationMenuTrigger>
              <span
                role="link"
                tabIndex={0}
                onPointerDown={(e) => {
                  e.stopPropagation()
                }}
                onClick={(e) => {
                  e.stopPropagation()
                  router.push("/productos")
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault()
                    e.stopPropagation()
                    router.push("/productos")
                  }
                }}
              >
                Productos
              </span>
            </NavigationMenuTrigger>
            <NavigationMenuContent className="bg-popover text-popover-foreground border shadow-md">
              <ul className="grid w-[400px] gap-3 p-4 md:w-[500px] md:grid-cols-2 lg:w-[600px]">
                {silos.map((silo) => {
                  const Icon = silo.icon
                  return (
                    <li key={silo.slug}>
                      <NavigationMenuLink asChild>
                        <Link
                          href={`/productos/${silo.slug}`}
                          className="block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground"
                        >
                          <div className="flex items-center gap-2">
                            <Icon className="h-4 w-4" />
                            <div className="text-sm font-medium leading-none">{silo.name}</div>
                          </div>
                          <p className="line-clamp-2 text-sm leading-snug text-muted-foreground">{silo.description}</p>
                        </Link>
                      </NavigationMenuLink>
                    </li>
                  )
                })}
              </ul>
            </NavigationMenuContent>
          </NavigationMenuItem>

          <NavigationMenuItem>
            <NavigationMenuLink asChild>
              <Link href="/ofertas" className={navigationMenuTriggerStyle()}>Ofertas</Link>
            </NavigationMenuLink>
          </NavigationMenuItem>

          <NavigationMenuItem>
            <NavigationMenuTrigger>Nosotros</NavigationMenuTrigger>
            <NavigationMenuContent className="bg-popover text-popover-foreground border shadow-md">
              <ul className="grid w-[300px] gap-3 p-4">
                <li>
                  <NavigationMenuLink asChild>
                    <Link
                      href="/nosotros/sobre-mesanova"
                      className="block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground"
                    >
                      <div className="text-sm font-medium leading-none">Sobre Mesanova</div>
                      <p className="line-clamp-2 text-sm leading-snug text-muted-foreground">
                        Conoce nuestra historia y valores
                      </p>
                    </Link>
                  </NavigationMenuLink>
                </li>
                <li>
                  <NavigationMenuLink asChild>
                    <Link
                      href="/nosotros/por-que-elegirnos"
                      className="block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground"
                    >
                      <div className="text-sm font-medium leading-none">¿Por qué elegirnos?</div>
                      <p className="line-clamp-2 text-sm leading-snug text-muted-foreground">
                        Ventajas y testimonios de clientes
                      </p>
                    </Link>
                  </NavigationMenuLink>
                </li>
              </ul>
            </NavigationMenuContent>
          </NavigationMenuItem>

          <NavigationMenuItem>
            <NavigationMenuLink asChild>
              <Link href="/blog" className={navigationMenuTriggerStyle()}>Nuestra Mesa</Link>
            </NavigationMenuLink>
          </NavigationMenuItem>

          <NavigationMenuItem>
            <NavigationMenuLink asChild>
              <Link href="/listas" className={navigationMenuTriggerStyle()}>
                <span className="inline-flex items-center gap-1">
                  <Gift className="h-4 w-4" />
                  Listas de Regalo
                </span>
              </Link>
            </NavigationMenuLink>
          </NavigationMenuItem>

          <NavigationMenuItem>
            <NavigationMenuTrigger>Contacto</NavigationMenuTrigger>
            <NavigationMenuContent className="bg-popover text-popover-foreground border shadow-md">
              <ul className="grid w-[300px] gap-3 p-4">
                {contactLinks.map((link) => (
                  <li key={link.href}>
                    <NavigationMenuLink asChild>
                      <Link
                        href={link.href}
                        className="block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground"
                      >
                        <div className="text-sm font-medium leading-none">{link.name}</div>
                      </Link>
                    </NavigationMenuLink>
                  </li>
                ))}
              </ul>
            </NavigationMenuContent>
          </NavigationMenuItem>
        </NavigationMenuList>
      </NavigationMenu>

      <div className="ml-auto flex items-center gap-4">
        <div className="hidden md:block">
          <SearchAutocomplete />
        </div>
        <div className="md:hidden">
          <SearchButton />
        </div>
        <CartIcon />
        <UserMenu />

        {/* Mobile Navigation */}
        <div className="md:hidden">
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="h-9 w-9">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[300px] sm:w-[400px]">
              <nav className="flex flex-col space-y-6">
                <SheetClose asChild>
                  <Link href="/" className="text-lg font-semibold">Home</Link>
                </SheetClose>

                <SheetClose asChild>
                  <Link href="/productos" className="text-lg font-semibold">Productos</Link>
                </SheetClose>

              <div>
                <h3 className="mb-2 text-sm font-semibold text-muted-foreground">Categorías</h3>
                <div className="pl-4 space-y-2">
                  {silos.map((silo) => (
                    <SheetClose asChild key={silo.slug}>
                      <Link href={`/productos/${silo.slug}`} className="block text-sm hover:text-primary transition-colors">
                        {silo.name}
                      </Link>
                    </SheetClose>
                  ))}
                </div>
              </div>

              <SheetClose asChild>
                <Link href="/ofertas" className="text-lg font-semibold hover:text-primary transition-colors">
                  Ofertas
                </Link>
              </SheetClose>

              <div className="space-y-3">
                <p className="text-sm font-semibold text-muted-foreground">Nosotros</p>
                <div className="pl-4 space-y-2">
                  <SheetClose asChild>
                    <Link href="/nosotros/sobre-mesanova" className="block text-sm hover:text-primary transition-colors">
                      Sobre Mesanova
                    </Link>
                  </SheetClose>
                  <SheetClose asChild>
                    <Link href="/nosotros/por-que-elegirnos" className="block text-sm hover:text-primary transition-colors">
                      ¿Por qué elegirnos?
                    </Link>
                  </SheetClose>
                </div>
              </div>

              <SheetClose asChild>
                <Link href="/blog" className="text-lg font-semibold hover:text-primary transition-colors">
                  Nuestra Mesa
                </Link>
              </SheetClose>

              <SheetClose asChild>
                <Link href="/listas" className="text-lg font-semibold hover:text-primary transition-colors flex items-center gap-2">
                  <Gift className="h-5 w-5" />
                  Listas de Regalo
                </Link>
              </SheetClose>

              <div className="space-y-3">
                <p className="text-sm font-semibold text-muted-foreground">Contacto</p>
                <div className="pl-4 space-y-2">
                  {contactLinks.map((link) => (
                    <SheetClose asChild key={link.href}>
                      <Link href={link.href} className="block text-sm hover:text-primary transition-colors">
                        {link.name}
                      </Link>
                    </SheetClose>
                  ))}
                </div>
              </div>

            </nav>
          </SheetContent>
        </Sheet>
      </div>

      </div>
    </>
  )
}
