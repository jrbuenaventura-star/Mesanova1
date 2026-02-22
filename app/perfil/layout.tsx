import type React from "react"
import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import Link from "next/link"
import {
  Home,
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
  FileText,
  MessageSquare,
  UserCog,
} from "lucide-react"
import { MobileSidebar } from "@/components/layout/mobile-sidebar"

function NavLink({ href, icon, label }: { href: string; icon: React.ReactNode; label: string }) {
  return (
    <Link
      href={href}
      className="flex items-center gap-3 px-3 py-2 rounded-md text-sm hover:bg-muted transition-colors"
    >
      {icon}
      {label}
    </Link>
  )
}

export default async function PerfilLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  const { data: userProfile } = await supabase
    .from("user_profiles")
    .select("role")
    .eq("id", user.id)
    .single()

  const navLinks = (
    <>
      {userProfile?.role === "distributor" && (
        <>
          <NavSection title="Panel Distribuidor" />
          <NavLink href="/distributor" icon={<Home className="h-4 w-4 text-muted-foreground" />} label="Inicio" />
          <NavLink href="/distributor/orders" icon={<ShoppingBag className="h-4 w-4 text-muted-foreground" />} label="Mis Órdenes" />
          <NavLink href="/distributor/invoices" icon={<FileText className="h-4 w-4 text-muted-foreground" />} label="Facturas" />
          <NavLink href="/distributor/pqrs" icon={<MessageSquare className="h-4 w-4 text-muted-foreground" />} label="Soporte / PQRs" />
          <NavLink href="/distributor/profile" icon={<UserCog className="h-4 w-4 text-muted-foreground" />} label="Perfil y Documentos" />
          <div className="my-2 border-t" />
        </>
      )}

      <NavSection title="Mi Cuenta" />
      <NavLink href="/perfil" icon={<User className="h-4 w-4 text-muted-foreground" />} label="Mi Perfil" />
      <NavLink href="/perfil/favoritos" icon={<Heart className="h-4 w-4 text-muted-foreground" />} label="Favoritos" />
      <NavLink href="/perfil/wishlists" icon={<ListChecks className="h-4 w-4 text-muted-foreground" />} label="Listas de Deseos" />
      <NavLink href="/perfil/listas-regalo" icon={<Gift className="h-4 w-4 text-muted-foreground" />} label="Listas de Regalo" />
      <NavLink href="/perfil/direcciones" icon={<MapPin className="h-4 w-4 text-muted-foreground" />} label="Direcciones" />
      <NavLink href="/perfil/ordenes" icon={<ShoppingBag className="h-4 w-4 text-muted-foreground" />} label="Mis Órdenes" />
      <NavLink href="/perfil/resenas" icon={<Star className="h-4 w-4 text-muted-foreground" />} label="Mis Reseñas" />
      <NavLink href="/perfil/puntos" icon={<Award className="h-4 w-4 text-muted-foreground" />} label="Mis Puntos" />
      <NavLink href="/perfil/vistos" icon={<Clock className="h-4 w-4 text-muted-foreground" />} label="Vistos Recientemente" />
      <NavLink href="/perfil/notificaciones" icon={<Bell className="h-4 w-4 text-muted-foreground" />} label="Notificaciones" />
      <div className="my-2 border-t" />
      <NavLink href="/perfil/configuracion" icon={<Settings className="h-4 w-4 text-muted-foreground" />} label="Configuración" />
    </>
  )

  return (
    <div className="min-h-screen bg-muted/30">
      {/* Mobile sidebar */}
      <MobileSidebar title="Mi Cuenta">
        {navLinks}
      </MobileSidebar>

      <div className="container py-6 px-4">
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Desktop sidebar */}
          <aside className="hidden lg:block w-64 shrink-0">
            <nav className="bg-background rounded-lg border p-4 space-y-1 sticky top-20">
              <div className="px-3 py-2 mb-2">
                <h2 className="font-semibold text-lg">Mi Cuenta</h2>
              </div>
              {navLinks}
            </nav>
          </aside>

          {/* Main content */}
          <main className="flex-1 min-w-0 panel-typography">{children}</main>
        </div>
      </div>
    </div>
  )
}

function NavSection({ title }: { title: string }) {
  return <p className="px-3 pt-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">{title}</p>
}
