import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"

export default async function SettingsPage() {
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

  return (
    <div className="container mx-auto py-8 px-4 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Configuración</h1>
        <p className="text-muted-foreground">
          Administra la configuración general del sistema
        </p>
      </div>

      <div className="grid gap-6">
        {/* Información General */}
        <Card>
          <CardHeader>
            <CardTitle>Información de la Empresa</CardTitle>
            <CardDescription>
              Datos generales de Mesanova
            </CardDescription>
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
            <Button>Guardar Cambios</Button>
          </CardContent>
        </Card>

        {/* Configuración de Tracking */}
        <Card>
          <CardHeader>
            <CardTitle>Analytics y Tracking</CardTitle>
            <CardDescription>
              Configuración de Google Analytics 4 y Meta Pixel
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-2">
              <Label htmlFor="ga4-id">Google Analytics 4 Measurement ID</Label>
              <Input 
                id="ga4-id" 
                placeholder="G-XXXXXXXXXX"
                defaultValue={process.env.NEXT_PUBLIC_GA4_ID || ""}
              />
              <p className="text-xs text-muted-foreground">
                Formato: G-XXXXXXXXXX
              </p>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="pixel-id">Meta Pixel ID</Label>
              <Input 
                id="pixel-id" 
                placeholder="123456789012345"
                defaultValue={process.env.NEXT_PUBLIC_META_PIXEL_ID || ""}
              />
              <p className="text-xs text-muted-foreground">
                ID numérico de tu Meta Pixel
              </p>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="gtm-id">Google Tag Manager ID (opcional)</Label>
              <Input 
                id="gtm-id" 
                placeholder="GTM-XXXXXXX"
                defaultValue={process.env.NEXT_PUBLIC_GTM_ID || ""}
              />
              <p className="text-xs text-muted-foreground">
                Si usas GTM, formato: GTM-XXXXXXX
              </p>
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

        {/* Configuración de Pagos */}
        <Card>
          <CardHeader>
            <CardTitle>Pasarela de Pagos</CardTitle>
            <CardDescription>
              Configuración de Wompi
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-2">
              <Label htmlFor="wompi-public-key">Wompi Public Key</Label>
              <Input 
                id="wompi-public-key" 
                placeholder="pub_test_..."
                type="password"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="wompi-private-key">Wompi Private Key</Label>
              <Input 
                id="wompi-private-key" 
                placeholder="prv_test_..."
                type="password"
              />
            </div>
            <Button>Guardar Configuración</Button>
          </CardContent>
        </Card>

        {/* SEO */}
        <Card>
          <CardHeader>
            <CardTitle>SEO y Dominios</CardTitle>
            <CardDescription>
              Configuración de dominio y SEO
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-2">
              <Label htmlFor="site-url">URL del Sitio</Label>
              <Input 
                id="site-url" 
                defaultValue={process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="site-name">Nombre del Sitio</Label>
              <Input id="site-name" defaultValue="Mesanova" />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="site-description">Descripción</Label>
              <Input 
                id="site-description" 
                defaultValue="Productos de aluminio y menaje para el hogar"
              />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
