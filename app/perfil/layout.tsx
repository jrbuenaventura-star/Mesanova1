import type React from "react"
import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import {
  User,
  Heart,
  ListChecks,
  Gift,
  MapPin,
  ShoppingBag,
  Star,
  Bell,
  Award,
  Clock,
  Settings,
  ChevronLeft,
} from "lucide-react"

const menuItems = [
  { href: "/perfil", label: "Mi Perfil", icon: User },
  { href: "/perfil/favoritos", label: "Favoritos", icon: Heart },
  { href: "/perfil/wishlists", label: "Listas de Deseos", icon: ListChecks },
  { href: "/perfil/listas-regalo", label: "Listas de Regalo", icon: Gift },
  { href: "/perfil/direcciones", label: "Direcciones", icon: MapPin },
  { href: "/perfil/ordenes", label: "Mis Órdenes", icon: ShoppingBag },
  { href: "/perfil/resenas", label: "Mis Reseñas", icon: Star },
  { href: "/perfil/puntos", label: "Mis Puntos", icon: Award },
  { href: "/perfil/vistos", label: "Vistos Recientemente", icon: Clock },
  { href: "/perfil/notificaciones", label: "Notificaciones", icon: Bell },
  { href: "/perfil/configuracion", label: "Configuración", icon: Settings },
]

export default async function PerfilLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  return (
    <div className="min-h-screen bg-muted/30">
      <div className="container py-6 px-4">
        {/* Mobile back button */}
        <div className="md:hidden mb-4">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/">
              <ChevronLeft className="h-4 w-4 mr-1" />
              Volver
            </Link>
          </Button>
        </div>

        <div className="flex flex-col md:flex-row gap-6">
          {/* Sidebar */}
          <aside className="w-full md:w-64 shrink-0">
            <nav className="bg-background rounded-lg border p-4 space-y-1 sticky top-20">
              <div className="px-3 py-2 mb-2">
                <h2 className="font-semibold text-lg">Mi Cuenta</h2>
              </div>
              {menuItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="flex items-center gap-3 px-3 py-2 rounded-md text-sm hover:bg-muted transition-colors"
                >
                  <item.icon className="h-4 w-4 text-muted-foreground" />
                  {item.label}
                </Link>
              ))}
            </nav>
          </aside>

          {/* Main content */}
          <main className="flex-1 min-w-0">{children}</main>
        </div>
      </div>
    </div>
  )
}
