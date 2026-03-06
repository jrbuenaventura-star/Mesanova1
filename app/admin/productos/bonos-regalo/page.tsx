import Link from "next/link"
import { redirect } from "next/navigation"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { createClient } from "@/lib/supabase/server"

function toMoney(value: number | null | undefined) {
  return `$${Number(value || 0).toLocaleString("es-CO")}`
}

export default async function GiftCardProductsAdminPage() {
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

  const { data: products } = await supabase
    .from("gift_card_products")
    .select("id, name, slug, amount, allow_custom_amount, min_custom_amount, max_custom_amount, is_active, sort_order")
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: false })

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Bonos de Regalo en catálogo</CardTitle>
          <CardDescription>
            Desde Productos solo se visualizan. La gestión (crear, editar, eliminar) se hace en <code>/admin/bonos</code>.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button asChild>
            <Link href="/admin/bonos">Ir a gestionar bonos</Link>
          </Button>

          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nombre</TableHead>
                  <TableHead>Monto</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Monto personalizado</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(products || []).length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="h-16 text-center text-muted-foreground">
                      No hay bonos configurados.
                    </TableCell>
                  </TableRow>
                ) : (
                  (products || []).map((product) => (
                    <TableRow key={product.id}>
                      <TableCell>
                        <div className="font-medium">{product.name}</div>
                        <div className="text-xs text-muted-foreground">/{product.slug}</div>
                      </TableCell>
                      <TableCell>{toMoney(product.amount)}</TableCell>
                      <TableCell>
                        <Badge variant={product.is_active ? "default" : "secondary"}>
                          {product.is_active ? "Activo" : "Inactivo"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs">
                        {product.allow_custom_amount
                          ? `Sí (${toMoney(product.min_custom_amount)}${product.max_custom_amount ? ` - ${toMoney(product.max_custom_amount)}` : " - sin tope"})`
                          : "No"}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
