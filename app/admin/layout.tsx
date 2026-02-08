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
import { MobileSidebar, type SidebarNavItem } from "@/components/layout/mobile-sidebar"

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

  const navItems: SidebarNavItem[] = [
    { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
    { href: "/admin/users", label: "Usuarios", icon: Users },
    { href: "/admin/products", label: "Productos", icon: Package },
    { href: "/admin/productos/csv", label: "Productos CSV", icon: FileSpreadsheet },
    { href: "/admin/orders", label: "Órdenes", icon: ShoppingCart },
    ...(userRole === "superadmin" ? [{ href: "/admin/orders/approval", label: "Aprobar Órdenes", icon: ShoppingCart }] : []),
    { href: "/admin/distributors", label: "Clientes", icon: Truck },
    { href: "/admin/distributors/csv", label: "Clientes CSV", icon: FileSpreadsheet },
    ...(userRole === "superadmin" ? [{ href: "/admin/aliados", label: "Aliados", icon: Users }] : []),
    { href: "/admin/gift-registries", label: "Listas de Regalo", icon: Gift },
    { href: "/admin/blog", label: "Blog", icon: FileText },
    { href: "/admin/analytics", label: "Analíticas", icon: BarChart3 },
    { href: "/admin/pqrs", label: "Gestión de PQRs", icon: MessageSquare },
    { href: "/admin/cupones", label: "Cupones", icon: Tag },
    { href: "/admin/bonos", label: "Bonos de Regalo", icon: CreditCard },
    { href: "/admin/reviews", label: "Reviews", icon: Star },
    { href: "/admin/productos-destacados", label: "Productos Destacados", icon: Sparkles },
    { href: "/admin/banner-home", label: "Banner del Home", icon: Image },
    { href: "/admin/settings", label: "Configuración", icon: Settings, separator: true },
  ]

  return (
    <div className="flex min-h-screen flex-col lg:flex-row">
      {/* Mobile sidebar */}
      <MobileSidebar title="Panel de Control" items={navItems} />

      {/* Desktop sidebar */}
      <aside className="hidden lg:block w-64 border-r bg-muted/40 shrink-0">
        <div className="flex h-16 items-center border-b px-6">
          <h2 className="text-lg font-semibold">Panel de Control</h2>
        </div>
        <nav className="space-y-2 p-4">
          {navItems.map((item) => (
            <div key={item.href}>
              {item.separator && <div className="my-2 border-t" />}
              <Link href={item.href}>
                <Button variant="ghost" className="w-full justify-start">
                  <item.icon className="mr-2 h-4 w-4" />
                  {item.label}
                </Button>
              </Link>
            </div>
          ))}
        </nav>
      </aside>

      {/* Main content */}
      <main className="flex-1 min-w-0">{children}</main>
    </div>
  )
}
