import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { ArrowLeft, Calendar, Tag, Users, DollarSign } from "lucide-react"

type CouponDetailPageProps = {
  params: { id: string }
}

const DISCOUNT_TYPE_LABEL: Record<string, string> = {
  percentage: "Porcentaje",
  fixed_amount: "Monto fijo",
  free_shipping: "Envío gratis",
}

export default async function CouponDetailPage({ params }: CouponDetailPageProps) {
  const supabase = await createClient()
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  if (userError || !user) {
    redirect("/auth/login")
  }

  const { data: profile } = await supabase.from("user_profiles").select("role").eq("id", user.id).single()
  if (!profile || profile.role !== "superadmin") {
    redirect("/")
  }

  const [{ data: coupon }, { data: usages }] = await Promise.all([
    supabase.from("coupons").select("*").eq("id", params.id).maybeSingle(),
    supabase
      .from("coupon_usages")
      .select("id, user_id, order_id, discount_applied, order_total_before, order_total_after, created_at")
      .eq("coupon_id", params.id)
      .order("created_at", { ascending: false }),
  ])

  if (!coupon) {
    redirect("/admin/cupones")
  }

  const usageCount = usages?.length || 0
  const totalDiscountApplied = usages?.reduce((acc, usage) => acc + Number(usage.discount_applied || 0), 0) || 0

  return (
    <div className="container mx-auto py-8 px-4 space-y-6">
      <div className="space-y-4">
        <Button variant="ghost" asChild className="w-fit">
          <Link href="/admin/cupones">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Volver a cupones
          </Link>
        </Button>

        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-bold">{coupon.name}</h1>
            <p className="text-muted-foreground">
              Código: <span className="font-mono font-semibold">{coupon.code}</span>
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant={coupon.status === "active" ? "default" : "secondary"}>{coupon.status}</Badge>
            {coupon.is_public && <Badge variant="outline">Público</Badge>}
          </div>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Tag className="h-4 w-4" />
              Tipo de descuento
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xl font-bold">{DISCOUNT_TYPE_LABEL[coupon.discount_type] || coupon.discount_type}</p>
            <p className="text-sm text-muted-foreground mt-1">
              {coupon.discount_type === "percentage"
                ? `${coupon.discount_value}%`
                : coupon.discount_type === "fixed_amount"
                  ? `$${Number(coupon.discount_value).toLocaleString("es-CO")}`
                  : "Envío gratis"}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Users className="h-4 w-4" />
              Usos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xl font-bold">
              {usageCount}
              {coupon.max_uses ? <span className="text-base text-muted-foreground"> / {coupon.max_uses}</span> : null}
            </p>
            <p className="text-sm text-muted-foreground mt-1">Máximo por usuario: {coupon.max_uses_per_user || 1}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <DollarSign className="h-4 w-4" />
              Total descontado
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xl font-bold">${totalDiscountApplied.toLocaleString("es-CO")}</p>
            <p className="text-sm text-muted-foreground mt-1">Acumulado histórico de canjes</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Reglas del cupón</CardTitle>
          <CardDescription>Condiciones y validez</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <p className="text-sm text-muted-foreground">Compra mínima</p>
              <p className="font-semibold">${Number(coupon.min_purchase_amount || 0).toLocaleString("es-CO")}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Descuento máximo</p>
              <p className="font-semibold">
                {coupon.max_discount_amount ? `$${Number(coupon.max_discount_amount).toLocaleString("es-CO")}` : "Sin límite"}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Válido desde</p>
              <p className="font-semibold">
                {coupon.valid_from ? new Date(coupon.valid_from).toLocaleString("es-CO") : "Sin restricción"}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Válido hasta</p>
              <p className="font-semibold">
                {coupon.valid_until ? new Date(coupon.valid_until).toLocaleString("es-CO") : "Sin vencimiento"}
              </p>
            </div>
          </div>
          {coupon.description ? (
            <>
              <Separator />
              <div>
                <p className="text-sm text-muted-foreground mb-1">Descripción</p>
                <p>{coupon.description}</p>
              </div>
            </>
          ) : null}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            Historial de uso
          </CardTitle>
          <CardDescription>Últimos canjes registrados</CardDescription>
        </CardHeader>
        <CardContent>
          {!usages || usages.length === 0 ? (
            <p className="text-sm text-muted-foreground">Aún no hay canjes para este cupón.</p>
          ) : (
            <div className="space-y-3">
              {usages.map((usage) => (
                <div key={usage.id} className="rounded-lg border p-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <div className="text-sm">
                    <p className="font-medium">Orden: {usage.order_id}</p>
                    <p className="text-muted-foreground">
                      Usuario: {usage.user_id || "Invitado"} · {new Date(usage.created_at).toLocaleString("es-CO")}
                    </p>
                  </div>
                  <div className="text-sm">
                    <p className="font-semibold text-right">-${Number(usage.discount_applied || 0).toLocaleString("es-CO")}</p>
                    <p className="text-muted-foreground text-right">
                      {Number(usage.order_total_before || 0).toLocaleString("es-CO")} →{" "}
                      {Number(usage.order_total_after || 0).toLocaleString("es-CO")}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
