import type React from "react"
import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import {
  LayoutDashboard,
  Users,
  Package,
  ShoppingCart,
  FileSpreadsheet,
  FileText,
  Settings,
  BarChart3,
  Building2,
  Truck,
  Gift,
  MessageSquare,
  Tag,
  CreditCard,
  Star,
  Sparkles,
  Image,
} from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
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

  const userRole = profile?.role

  const navLinks = (
    <>
      <NavLink href="/admin" icon={<LayoutDashboard className="h-4 w-4" />} label="Dashboard" />
      <NavLink href="/admin/users" icon={<Users className="h-4 w-4" />} label="Usuarios" />
      <NavLink href="/admin/products" icon={<Package className="h-4 w-4" />} label="Productos" />
      <NavLink href="/admin/productos/csv" icon={<FileSpreadsheet className="h-4 w-4" />} label="Productos CSV" />
      <NavLink href="/admin/orders" icon={<ShoppingCart className="h-4 w-4" />} label="Órdenes" />
      {userRole === "superadmin" && (
        <NavLink href="/admin/orders/approval" icon={<ShoppingCart className="h-4 w-4" />} label="Aprobar Órdenes" />
      )}
      <NavLink href="/admin/distributors" icon={<Truck className="h-4 w-4" />} label="Clientes" />
      <NavLink href="/admin/distributors/csv" icon={<FileSpreadsheet className="h-4 w-4" />} label="Clientes CSV" />
      {userRole === "superadmin" && (
        <NavLink href="/admin/aliados" icon={<Users className="h-4 w-4" />} label="Aliados" />
      )}
      <NavLink href="/admin/gift-registries" icon={<Gift className="h-4 w-4" />} label="Listas de Regalo" />
      <NavLink href="/admin/blog" icon={<FileText className="h-4 w-4" />} label="Blog" />
      <NavLink href="/admin/analytics" icon={<BarChart3 className="h-4 w-4" />} label="Analíticas" />
      <NavLink href="/admin/pqrs" icon={<MessageSquare className="h-4 w-4" />} label="Gestión de PQRs" />
      <NavLink href="/admin/cupones" icon={<Tag className="h-4 w-4" />} label="Cupones" />
      <NavLink href="/admin/bonos" icon={<CreditCard className="h-4 w-4" />} label="Bonos de Regalo" />
      <NavLink href="/admin/reviews" icon={<Star className="h-4 w-4" />} label="Reviews" />
      <NavLink href="/admin/productos-destacados" icon={<Sparkles className="h-4 w-4" />} label="Productos Destacados" />
      <NavLink href="/admin/banner-home" icon={<Image className="h-4 w-4" />} label="Banner del Home" />
      <div className="my-2 border-t" />
      <NavLink href="/admin/settings" icon={<Settings className="h-4 w-4" />} label="Configuración" />
    </>
  )

  return (
    <div className="flex min-h-screen flex-col lg:flex-row">
      {/* Mobile sidebar */}
      <MobileSidebar title="Panel de Control">
        {navLinks}
      </MobileSidebar>

      {/* Desktop sidebar */}
      <aside className="hidden lg:block w-64 border-r bg-muted/40 shrink-0">
        <div className="flex h-16 items-center border-b px-6">
          <h2 className="text-lg font-semibold">Panel de Control</h2>
        </div>
        <nav className="space-y-1 p-4">
          {navLinks}
        </nav>
      </aside>

      {/* Main content */}
      <main className="flex-1 min-w-0 panel-typography">{children}</main>
    </div>
  )
}

function NavLink({ href, icon, label }: { href: string; icon: React.ReactNode; label: string }) {
  return (
    <Link
      href={href}
      className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-all hover:bg-accent"
    >
      {icon}
      {label}
    </Link>
  )
}
