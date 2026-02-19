import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import Link from "next/link"
import { AdminSectionTabs, type AdminSectionTab } from "@/components/admin/admin-section-tabs"
import { UserManagementTable } from "@/components/admin/user-management-table"
import { InviteUserForm } from "@/components/admin/invite-user-form"

const SETTINGS_TABS: AdminSectionTab[] = [
  { value: "general", label: "General" },
  { value: "usuarios", label: "Usuarios" },
]

export default async function SettingsPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>
}) {
  const params = await searchParams
  const currentTab = SETTINGS_TABS.some((tab) => tab.value === params.tab) ? (params.tab as string) : "general"

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  const { data: profile } = await supabase
    .from("user_profiles")
    .select("role")
    .eq("id", user.id)
    .single()

  if (profile?.role !== "superadmin") {
    redirect("/")
  }

  const { data: users } =
    currentTab === "usuarios"
      ? await supabase
          .from("user_profiles")
          .select(`
            id,
            full_name,
            phone,
            role,
            is_active,
            created_at,
            last_login_at
          `)
          .eq("role", "superadmin")
          .order("created_at", { ascending: false })
      : { data: [] as any[] }

  return (
    <div className="container mx-auto py-8 px-4 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Configuración</h1>
        <p className="text-muted-foreground">Administra la configuración general del sistema</p>
      </div>

      <AdminSectionTabs basePath="/admin/settings" activeTab={currentTab} tabs={SETTINGS_TABS} />

      {currentTab === "usuarios" ? (
        <Card>
          <CardHeader>
            <CardTitle>Gestión de Usuarios</CardTitle>
            <CardDescription>Administra usuarios superadmin desde la pestaña de configuración.</CardDescription>
          </CardHeader>
          <CardContent className="pt-2">
            <InviteUserForm />
            <UserManagementTable users={users || []} />
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Gestión de Usuarios</CardTitle>
              <CardDescription>Accede al módulo de usuarios dentro de Configuración</CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild variant="outline">
                <Link href="/admin/settings?tab=usuarios">Ir a Usuarios</Link>
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Información de la Empresa</CardTitle>
              <CardDescription>Datos generales de Mesanova</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-2">
                <Label htmlFor="company-name">Nombre de la Empresa</Label>
                <Input id="company-name" defaultValue="Mesanova" />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="company-email">Email de Contacto</Label>
                <Input id="company-email" type="email" defaultValue="info@mesanova.co" />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="company-phone">Teléfono</Label>
                <Input id="company-phone" type="tel" placeholder="+57 300 000 0000" />
              </div>
              <Button disabled title="Edición directa pendiente de implementación">
                Guardar Cambios (próximamente)
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Analytics y Tracking</CardTitle>
              <CardDescription>Configuración de Google Analytics 4 y Meta Pixel</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-2">
                <Label htmlFor="ga4-id">Google Analytics 4 Measurement ID</Label>
                <Input id="ga4-id" placeholder="G-XXXXXXXXXX" defaultValue={process.env.NEXT_PUBLIC_GA4_ID || ""} />
                <p className="text-xs text-muted-foreground">Formato: G-XXXXXXXXXX</p>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="pixel-id">Meta Pixel ID</Label>
                <Input
                  id="pixel-id"
                  placeholder="123456789012345"
                  defaultValue={process.env.NEXT_PUBLIC_META_PIXEL_ID || ""}
                />
                <p className="text-xs text-muted-foreground">ID numérico de tu Meta Pixel</p>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="gtm-id">Google Tag Manager ID (opcional)</Label>
                <Input id="gtm-id" placeholder="GTM-XXXXXXX" defaultValue={process.env.NEXT_PUBLIC_GTM_ID || ""} />
                <p className="text-xs text-muted-foreground">Si usas GTM, formato: GTM-XXXXXXX</p>
              </div>
              <Separator />
              <div className="bg-blue-50 p-4 rounded-lg">
                <p className="text-sm font-medium mb-2">ℹ️ Nota importante</p>
                <p className="text-sm text-muted-foreground">
                  Estos valores deben configurarse en las variables de entorno (.env.local) para que funcionen correctamente:
                </p>
                <ul className="text-xs text-muted-foreground mt-2 space-y-1 list-disc list-inside">
                  <li>NEXT_PUBLIC_GA4_ID</li>
                  <li>NEXT_PUBLIC_META_PIXEL_ID</li>
                  <li>NEXT_PUBLIC_GTM_ID (opcional)</li>
                </ul>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Pasarela de Pagos</CardTitle>
              <CardDescription>Configuración de Wompi</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-2">
                <Label htmlFor="wompi-public-key">Wompi Public Key</Label>
                <Input id="wompi-public-key" placeholder="pub_test_..." type="password" />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="wompi-private-key">Wompi Private Key</Label>
                <Input id="wompi-private-key" placeholder="prv_test_..." type="password" />
              </div>
              <Button disabled title="Edición directa pendiente de implementación">
                Guardar Configuración (próximamente)
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>SEO y Dominios</CardTitle>
              <CardDescription>Configuración de dominio y SEO</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-2">
                <Label htmlFor="site-url">URL del Sitio</Label>
                <Input id="site-url" defaultValue={process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"} />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="site-name">Nombre del Sitio</Label>
                <Input id="site-name" defaultValue="Mesanova" />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="site-description">Descripción</Label>
                <Input
                  id="site-description"
                  defaultValue="Artículos para cocina y mesa - Vajillas, copas, vasos, platos y utensilios"
                />
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
