"use client"

import Link from "next/link"
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
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { Menu, ChefHat, UtensilsCrossed, Coffee, Thermometer, Briefcase, User, Settings } from "lucide-react"
import { SearchAutocomplete } from "@/components/search/search-autocomplete"
import { CartIcon } from "@/components/cart/cart-icon"

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
    slug: "termos-neveras",
    name: "Termos y Neveras",
    icon: Thermometer,
    description: "Productos portátiles para bebidas",
  },
  {
    slug: "profesional",
    name: "Profesional",
    icon: Briefcase,
    description: "Soluciones para gastronomía profesional",
  },
]

const contactLinks = [
  { name: "Mayoristas del hogar", href: "/contacto/mayoristas" },
  { name: "Minoristas del hogar", href: "/contacto/minoristas" },
  { name: "Institucional", href: "/contacto/institucional" },
  { name: "Cliente final", href: "/contacto/cliente-final" },
]

type SiteUser = {
  id: string
  email?: string
}

type UserProfile = {
  full_name: string | null
  role: string
}

export function SiteNav({ user, userProfile }: { user: SiteUser | null; userProfile: UserProfile | null }) {
  return (
    <>
      {/* Desktop Navigation */}
      <NavigationMenu className="hidden md:flex" viewport={false}>
        <NavigationMenuList>
          <NavigationMenuItem>
            <Link href="/" legacyBehavior passHref>
              <NavigationMenuLink className={navigationMenuTriggerStyle()}>Home</NavigationMenuLink>
            </Link>
          </NavigationMenuItem>

          <NavigationMenuItem>
            <NavigationMenuTrigger>Productos</NavigationMenuTrigger>
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
            <Link href="/ofertas" legacyBehavior passHref>
              <NavigationMenuLink className={navigationMenuTriggerStyle()}>Ofertas</NavigationMenuLink>
            </Link>
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
            <Link href="/blog" legacyBehavior passHref>
              <NavigationMenuLink className={navigationMenuTriggerStyle()}>Nuestra Mesa</NavigationMenuLink>
            </Link>
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
        <SearchAutocomplete />
        <CartIcon />

        {user ? (
          <div className="flex items-center gap-2">
            <span className="text-sm hidden md:inline">{userProfile?.full_name || user.email}</span>
            {userProfile?.role === "superadmin" && (
              <Button variant="outline" size="sm" asChild className="hidden md:inline-flex bg-transparent">
                <Link href="/admin">
                  <Settings className="h-4 w-4 mr-2" />
                  Admin
                </Link>
              </Button>
            )}
            {userProfile?.role === "distributor" && (
              <Button variant="outline" size="sm" asChild className="hidden md:inline-flex bg-transparent">
                <Link href="/distributor">
                  <Settings className="h-4 w-4 mr-2" />
                  Panel
                </Link>
              </Button>
            )}
            <Button variant="ghost" size="icon" asChild>
              <Link href="/perfil">
                <User className="h-5 w-5" />
              </Link>
            </Button>
          </div>
        ) : (
          <Button variant="ghost" size="sm" asChild className="hidden md:inline-flex">
            <Link href="/auth/login">Iniciar sesión</Link>
          </Button>
        )}

        {/* Mobile Navigation */}
        <Sheet>
          <SheetTrigger asChild className="md:hidden">
            <Button variant="ghost" size="icon">
              <Menu className="h-5 w-5" />
              <span className="sr-only">Abrir menú</span>
            </Button>
          </SheetTrigger>
          <SheetContent side="right" className="w-[300px] sm:w-[400px]">
            <nav className="flex flex-col gap-4 mt-8">
              <Link href="/" className="text-lg font-semibold hover:text-primary transition-colors">
                Home
              </Link>

              <div className="space-y-3">
                <p className="text-sm font-semibold text-muted-foreground">Productos</p>
                <div className="pl-4 space-y-2">
                  {silos.map((silo) => (
                    <Link
                      key={silo.slug}
                      href={`/productos/${silo.slug}`}
                      className="block text-sm hover:text-primary transition-colors"
                    >
                      {silo.name}
                    </Link>
                  ))}
                </div>
              </div>

              <Link href="/ofertas" className="text-lg font-semibold hover:text-primary transition-colors">
                Ofertas
              </Link>

              <div className="space-y-3">
                <p className="text-sm font-semibold text-muted-foreground">Nosotros</p>
                <div className="pl-4 space-y-2">
                  <Link href="/nosotros/sobre-mesanova" className="block text-sm hover:text-primary transition-colors">
                    Sobre Mesanova
                  </Link>
                  <Link
                    href="/nosotros/por-que-elegirnos"
                    className="block text-sm hover:text-primary transition-colors"
                  >
                    ¿Por qué elegirnos?
                  </Link>
                </div>
              </div>

              <Link href="/blog" className="text-lg font-semibold hover:text-primary transition-colors">
                Nuestra Mesa
              </Link>

              <div className="space-y-3">
                <p className="text-sm font-semibold text-muted-foreground">Contacto</p>
                <div className="pl-4 space-y-2">
                  {contactLinks.map((link) => (
                    <Link
                      key={link.href}
                      href={link.href}
                      className="block text-sm hover:text-primary transition-colors"
                    >
                      {link.name}
                    </Link>
                  ))}
                </div>
              </div>

              {user ? (
                <>
                  {userProfile?.role === "superadmin" && (
                    <Button asChild className="mt-4 bg-transparent" variant="outline">
                      <Link href="/admin">
                        <Settings className="h-4 w-4 mr-2" />
                        Panel de Control
                      </Link>
                    </Button>
                  )}
                  {userProfile?.role === "distributor" && (
                    <Button asChild className="mt-4 bg-transparent" variant="outline">
                      <Link href="/distributor">
                        <Settings className="h-4 w-4 mr-2" />
                        Panel Distribuidor
                      </Link>
                    </Button>
                  )}
                  <Button asChild className="mt-4 bg-transparent" variant="outline">
                    <Link href="/perfil">Mi Perfil</Link>
                  </Button>
                </>
              ) : (
                <Button asChild className="mt-4">
                  <Link href="/auth/login">Iniciar sesión</Link>
                </Button>
              )}
            </nav>
          </SheetContent>
        </Sheet>
      </div>
    </>
  )
}
