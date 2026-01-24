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
} from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"

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

  return (
    <div className="flex min-h-screen">
      {/* Sidebar */}
      <aside className="w-64 border-r bg-muted/40">
        <div className="flex h-16 items-center border-b px-6">
          <h2 className="text-lg font-semibold">Panel de Control</h2>
        </div>
        <nav className="space-y-2 p-4">
          <Link href="/admin">
            <Button variant="ghost" className="w-full justify-start">
              <LayoutDashboard className="mr-2 h-4 w-4" />
              Dashboard
            </Button>
          </Link>
          <Link href="/admin/users">
            <Button variant="ghost" className="w-full justify-start">
              <Users className="mr-2 h-4 w-4" />
              Usuarios
            </Button>
          </Link>
          <Link href="/admin/products">
            <Button variant="ghost" className="w-full justify-start">
              <Package className="mr-2 h-4 w-4" />
              Productos
            </Button>
          </Link>
          <Link href="/admin/productos/csv">
            <Button variant="ghost" className="w-full justify-start">
              <FileSpreadsheet className="mr-2 h-4 w-4" />
              Productos CSV
            </Button>
          </Link>
          <Link href="/admin/orders">
            <Button variant="ghost" className="w-full justify-start">
              <ShoppingCart className="mr-2 h-4 w-4" />
              Órdenes
            </Button>
          </Link>
          {userRole === "superadmin" && (
            <Link href="/admin/orders/approval">
              <Button variant="ghost" className="w-full justify-start">
                <ShoppingCart className="mr-2 h-4 w-4" />
                Aprobar Órdenes
              </Button>
            </Link>
          )}
          <Link href="/admin/distributors">
            <Button variant="ghost" className="w-full justify-start">
              <Truck className="mr-2 h-4 w-4" />
              Distribuidores
            </Button>
          </Link>
          <Link href="/admin/distributors/csv">
            <Button variant="ghost" className="w-full justify-start">
              <FileSpreadsheet className="mr-2 h-4 w-4" />
              Distribuidores CSV
            </Button>
          </Link>
          {userRole === "superadmin" && (
            <Link href="/admin/aliados">
              <Button variant="ghost" className="w-full justify-start">
                <Users className="mr-2 h-4 w-4" />
                Aliados
              </Button>
            </Link>
          )}
          <Link href="/admin/clients">
            <Button variant="ghost" className="w-full justify-start">
              <Building2 className="mr-2 h-4 w-4" />
              Clientes
            </Button>
          </Link>
          <Link href="/admin/gift-registries">
            <Button variant="ghost" className="w-full justify-start">
              <Gift className="mr-2 h-4 w-4" />
              Listas de Regalo
            </Button>
          </Link>
          <Link href="/admin/blog">
            <Button variant="ghost" className="w-full justify-start">
              <FileText className="mr-2 h-4 w-4" />
              Blog
            </Button>
          </Link>
          <Link href="/admin/analytics">
            <Button variant="ghost" className="w-full justify-start">
              <BarChart3 className="mr-2 h-4 w-4" />
              Analíticas
            </Button>
          </Link>
          <Link href="/admin/pqrs">
            <Button variant="ghost" className="w-full justify-start">
              <MessageSquare className="mr-2 h-4 w-4" />
              Gestión de PQRs
            </Button>
          </Link>
          <Link href="/admin/settings">
            <Button variant="ghost" className="w-full justify-start">
              <Settings className="mr-2 h-4 w-4" />
              Configuración
            </Button>
          </Link>
        </nav>
      </aside>

      {/* Main content */}
      <main className="flex-1">{children}</main>
    </div>
  )
}
