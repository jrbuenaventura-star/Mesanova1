import type React from "react"
import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import {
  LayoutDashboard,
  Home,
  Package,
  ShoppingCart,
  Users,
  Settings,
  BarChart3,
  Gift,
  MessageSquare,
  Tag,
  CreditCard,
  Star,
  FileText,
} from "lucide-react"
import Link from "next/link"
import { MobileSidebar } from "@/components/layout/mobile-sidebar"

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  const { data: profile } = await supabase.from("user_profiles").select("role").eq("id", user.id).single()

  if (profile?.role !== "superadmin") {
    redirect("/")
  }

  const navLinks = (
    <>
      <NavLink href="/admin" icon={<LayoutDashboard className="h-4 w-4" />} label="Dashboard" />
      <NavLink href="/admin/home" icon={<Home className="h-4 w-4" />} label="Home" />
      <NavLink href="/admin/productos" icon={<Package className="h-4 w-4" />} label="Productos" />
      <NavLink href="/admin/ordenes" icon={<ShoppingCart className="h-4 w-4" />} label="Órdenes" />
      <NavLink href="/admin/red-comercial" icon={<Users className="h-4 w-4" />} label="Red Comercial" />
      <NavLink href="/admin/gift-registries" icon={<Gift className="h-4 w-4" />} label="Listas de Regalo" />
      <NavLink href="/admin/blog" icon={<FileText className="h-4 w-4" />} label="Blog" />
      <NavLink href="/admin/analytics" icon={<BarChart3 className="h-4 w-4" />} label="Analíticas" />
      <NavLink href="/admin/pqrs" icon={<MessageSquare className="h-4 w-4" />} label="Gestión de PQRs" />
      <NavLink href="/admin/cupones" icon={<Tag className="h-4 w-4" />} label="Cupones" />
      <NavLink href="/admin/bonos" icon={<CreditCard className="h-4 w-4" />} label="Bonos de Regalo" />
      <NavLink href="/admin/reviews" icon={<Star className="h-4 w-4" />} label="Reviews" />
      <NavLink href="/admin/settings" icon={<Settings className="h-4 w-4" />} label="Configuración" />
    </>
  )

  return (
    <div className="flex min-h-screen flex-col lg:flex-row">
      <MobileSidebar title="Panel de Control">{navLinks}</MobileSidebar>

      <aside className="hidden lg:block w-64 border-r bg-muted/40 shrink-0">
        <div className="flex h-16 items-center border-b px-6">
          <h2 className="text-lg font-semibold">Panel de Control</h2>
        </div>
        <nav className="space-y-1 p-4">{navLinks}</nav>
      </aside>

      <main className="flex-1 min-w-0 panel-typography">{children}</main>
    </div>
  )
}

function NavLink({ href, icon, label }: { href: string; icon: React.ReactNode; label: string }) {
  return (
    <Link href={href} className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-all hover:bg-accent">
      {icon}
      {label}
    </Link>
  )
}
