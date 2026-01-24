import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function GET(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: userError } = await supabase.auth.getUser()

    if (userError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { data: profile } = await supabase
      .from("user_profiles")
      .select("role")
      .eq("id", user.id)
      .single()

    if (!profile || profile.role !== "superadmin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    // Obtener cupones con estadísticas de uso
    const { data: coupons } = await supabase
      .from("coupons")
      .select(`
        *,
        coupon_usages(count)
      `)
      .order("created_at", { ascending: false })

    const { data: usages } = await supabase
      .from("coupon_usages")
      .select("coupon_id, discount_applied")

    // Calcular estadísticas por cupón
    const couponsWithStats = coupons?.map(coupon => {
      const couponUsages = usages?.filter(u => u.coupon_id === coupon.id) || []
      const totalDiscount = couponUsages.reduce((sum, u) => sum + Number(u.discount_applied), 0)
      const usageCount = couponUsages.length

      return {
        Código: coupon.code,
        Nombre: coupon.name,
        Descripción: coupon.description || "",
        Tipo: coupon.discount_type === "percentage" ? "Porcentaje" :
              coupon.discount_type === "fixed_amount" ? "Monto Fijo" : "Envío Gratis",
        Valor: coupon.discount_value,
        "Compra Mínima": coupon.min_purchase_amount || 0,
        "Descuento Máximo": coupon.max_discount_amount || "",
        "Usos Máximos": coupon.max_uses || "Ilimitado",
        "Usos por Usuario": coupon.max_uses_per_user,
        "Aplicable a": coupon.applicable_to === "all" ? "Todos" :
                       coupon.applicable_to === "specific_products" ? "Productos Específicos" :
                       coupon.applicable_to === "specific_categories" ? "Categorías Específicas" : "Usuarios Específicos",
        "Válido Desde": coupon.valid_from ? new Date(coupon.valid_from).toLocaleDateString('es-CO') : "",
        "Válido Hasta": coupon.valid_until ? new Date(coupon.valid_until).toLocaleDateString('es-CO') : "",
        Estado: coupon.status,
        Público: coupon.is_public ? "Sí" : "No",
        "Total Usos": usageCount,
        "Total Descuentos": totalDiscount,
        "Creado": new Date(coupon.created_at).toLocaleDateString('es-CO'),
      }
    })

    // Convertir a CSV
    if (!couponsWithStats || couponsWithStats.length === 0) {
      return NextResponse.json({ error: "No data to export" }, { status: 404 })
    }

    const headers = Object.keys(couponsWithStats[0])
    const csvRows = [
      headers.join(","),
      ...couponsWithStats.map(row =>
        headers.map(header => {
          const value = row[header as keyof typeof row]
          // Escapar valores con comas o comillas
          const stringValue = String(value)
          if (stringValue.includes(",") || stringValue.includes('"')) {
            return `"${stringValue.replace(/"/g, '""')}"`
          }
          return stringValue
        }).join(",")
      )
    ]

    const csv = csvRows.join("\n")

    return new NextResponse(csv, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="cupones_${new Date().toISOString().split('T')[0]}.csv"`,
      },
    })
  } catch (error) {
    console.error("Error exporting coupons:", error)
    return NextResponse.json({ error: "Export failed" }, { status: 500 })
  }
}
