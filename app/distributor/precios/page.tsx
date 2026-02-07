import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Input } from "@/components/ui/input"
import { 
  DollarSign, 
  Percent, 
  Package, 
  Search, 
  AlertCircle,
  Tag
} from "lucide-react"

export default async function DistributorPricingPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect("/auth/login")

  // Obtener distribuidor
  const { data: distributor } = await supabase
    .from("distributors")
    .select("id, company_name, discount_percentage, has_custom_pricing")
    .eq("user_id", user.id)
    .single()

  if (!distributor) {
    return (
      <div className="container mx-auto py-8 px-4">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>No tienes un perfil de distribuidor configurado.</AlertDescription>
        </Alert>
      </div>
    )
  }

  // Obtener precios personalizados
  let customPrices: any[] = []
  if (distributor.has_custom_pricing) {
    const { data } = await supabase
      .from("distributor_custom_prices")
      .select(`
        *,
        product:products(id, pdt_codigo, nombre_comercial, pdt_descripcion, precio, imagen_principal_url, marca)
      `)
      .eq("distributor_id", distributor.id)
      .eq("is_active", true)
      .order("created_at", { ascending: false })
    customPrices = data || []
  }

  // Obtener productos activos con precios (para mostrar el descuento general)
  const { data: products } = await supabase
    .from("products")
    .select("id, pdt_codigo, nombre_comercial, pdt_descripcion, precio, precio_dist, imagen_principal_url, marca")
    .eq("is_active", true)
    .not("precio", "is", null)
    .order("nombre_comercial")
    .limit(200)

  // Mapa de precios custom
  const customPriceMap = new Map<string, any>()
  customPrices.forEach(cp => {
    customPriceMap.set(cp.product_id, cp)
  })

  return (
    <div className="container mx-auto py-8 px-4 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold mb-2">Mi Lista de Precios</h1>
        <p className="text-muted-foreground">
          Precios personalizados para {distributor.company_name}
        </p>
      </div>

      {/* Resumen de descuento */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-primary/10 rounded-lg">
                <Percent className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Descuento General</p>
                <p className="text-2xl font-bold">{distributor.discount_percentage}%</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-green-100 rounded-lg">
                <Tag className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Precios Especiales</p>
                <p className="text-2xl font-bold">{customPrices.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-blue-100 rounded-lg">
                <Package className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Productos Disponibles</p>
                <p className="text-2xl font-bold">{products?.length || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Precios personalizados */}
      {customPrices.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Tag className="h-5 w-5" />
              Precios Especiales
            </CardTitle>
            <CardDescription>Productos con precio personalizado para ti</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {customPrices.map((cp) => (
                <div key={cp.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded bg-muted flex items-center justify-center overflow-hidden">
                      {cp.product?.imagen_principal_url ? (
                        <img src={cp.product.imagen_principal_url} alt="" className="h-full w-full object-cover" />
                      ) : (
                        <Package className="h-5 w-5 text-muted-foreground" />
                      )}
                    </div>
                    <div>
                      <p className="font-medium text-sm">
                        {cp.product?.nombre_comercial || cp.product?.pdt_descripcion}
                      </p>
                      <p className="text-xs text-muted-foreground">{cp.product?.pdt_codigo}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-muted-foreground line-through">
                      ${cp.product?.precio?.toLocaleString()}
                    </p>
                    <p className="font-bold text-green-600">${cp.custom_price.toLocaleString()}</p>
                    {cp.discount_percentage && (
                      <Badge variant="secondary" className="text-xs">-{cp.discount_percentage}%</Badge>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Lista general de productos con precio distribuidor */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Catálogo de Precios
          </CardTitle>
          <CardDescription>
            Tu descuento general del {distributor.discount_percentage}% se aplica sobre el precio lista
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-2 font-medium">Producto</th>
                  <th className="text-left py-3 px-2 font-medium">Código</th>
                  <th className="text-left py-3 px-2 font-medium">Marca</th>
                  <th className="text-right py-3 px-2 font-medium">Precio Lista</th>
                  <th className="text-right py-3 px-2 font-medium">Tu Precio</th>
                  <th className="text-right py-3 px-2 font-medium">Ahorro</th>
                </tr>
              </thead>
              <tbody>
                {(products || []).map((product) => {
                  const customPrice = customPriceMap.get(product.id)
                  const listPrice = product.precio || 0
                  const yourPrice = customPrice 
                    ? customPrice.custom_price 
                    : product.precio_dist 
                      ? product.precio_dist
                      : listPrice * (1 - (distributor.discount_percentage / 100))
                  const savings = listPrice - yourPrice
                  const savingsPercent = listPrice > 0 ? (savings / listPrice) * 100 : 0

                  return (
                    <tr key={product.id} className="border-b hover:bg-muted/30">
                      <td className="py-3 px-2">
                        <div className="flex items-center gap-2">
                          <div className="h-8 w-8 rounded bg-muted flex items-center justify-center overflow-hidden flex-shrink-0">
                            {product.imagen_principal_url ? (
                              <img src={product.imagen_principal_url} alt="" className="h-full w-full object-cover" />
                            ) : (
                              <Package className="h-4 w-4 text-muted-foreground" />
                            )}
                          </div>
                          <span className="truncate max-w-[200px]">
                            {product.nombre_comercial || product.pdt_descripcion}
                          </span>
                          {customPrice && (
                            <Badge variant="outline" className="text-xs flex-shrink-0">Especial</Badge>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-2 text-muted-foreground">{product.pdt_codigo}</td>
                      <td className="py-3 px-2 text-muted-foreground">{product.marca || "-"}</td>
                      <td className="py-3 px-2 text-right">${listPrice.toLocaleString()}</td>
                      <td className="py-3 px-2 text-right font-bold text-green-600">
                        ${Math.round(yourPrice).toLocaleString()}
                      </td>
                      <td className="py-3 px-2 text-right">
                        <span className="text-muted-foreground">
                          -{Math.round(savingsPercent)}%
                        </span>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
