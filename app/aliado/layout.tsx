import type React from "react"
import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import Link from "next/link"
import { Home, Users, UserPlus, ShoppingCart, BarChart3, UserCog, MessageSquare } from "lucide-react"
import { MobileSidebar, type SidebarNavItem } from "@/components/layout/mobile-sidebar"

export default async function AliadoLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  // Verificar que es aliado
  const { data: profile } = await supabase.from("user_profiles").select("role").eq("id", user.id).single()

  if (!profile || profile.role !== "aliado") {
    redirect("/")
  }

  // Obtener info del aliado
  const { data: aliado } = await supabase
    .from("aliados")
    .select("company_name")
    .eq("user_id", user.id)
    .single()

  const navItems: SidebarNavItem[] = [
    { href: "/aliado", label: "Inicio", icon: Home },
    { href: "/aliado/distributors", label: "Mis Clientes", icon: Users },
    { href: "/aliado/leads", label: "CRM / Leads", icon: UserPlus },
    { href: "/aliado/orders", label: "Crear Pedido", icon: ShoppingCart },
    { href: "/aliado/stats", label: "Estadísticas", icon: BarChart3 },
    { href: "/distributor/pqrs", label: "Soporte / PQRs", icon: MessageSquare },
    { href: "/aliado/profile", label: "Mi Perfil", icon: UserCog, separator: true },
  ]

  return (
    <div className="flex min-h-screen flex-col lg:flex-row">
      {/* Mobile sidebar */}
      <MobileSidebar title="Panel Aliado" subtitle={aliado?.company_name || undefined} items={navItems} />

      {/* Desktop sidebar */}
      <aside className="hidden lg:block w-64 border-r bg-muted/40 shrink-0">
        <div className="p-6">
          <h2 className="text-lg font-semibold">Panel Aliado</h2>
          {aliado && (
            <p className="text-sm text-muted-foreground truncate">{aliado.company_name}</p>
          )}
        </div>
        
        <nav className="space-y-1 px-4">
          {navItems.map((item) => (
            <div key={item.href}>
              {item.separator && <div className="my-3 border-t" />}
              <Link
                href={item.href}
                className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-all hover:bg-accent"
              >
                <item.icon className="h-4 w-4" />
                {item.label}
              </Link>
            </div>
          ))}
        </nav>
      </aside>
      <main className="flex-1 min-w-0">{children}</main>
    </div>
  )
}
