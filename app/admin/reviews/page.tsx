import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Star, CheckCircle, XCircle, Eye, MessageSquare } from "lucide-react"

export default async function ReviewsAdminPage() {
  const supabase = await createClient()
  const { data: { user }, error: userError } = await supabase.auth.getUser()

  if (userError || !user) {
    redirect("/auth/login")
  }

  const { data: profile } = await supabase
    .from("user_profiles")
    .select("role")
    .eq("id", user.id)
    .single()

  if (!profile || profile.role !== "superadmin") {
    redirect("/")
  }

  const { data: reviews } = await supabase
    .from("product_reviews")
    .select(`
      *,
      user:user_profiles(full_name),
      product:products(name, product_code)
    `)
    .order("created_at", { ascending: false })

  const pendingCount = reviews?.filter(r => r.status === 'pending').length || 0
  const approvedCount = reviews?.filter(r => r.status === 'approved').length || 0
  const rejectedCount = reviews?.filter(r => r.status === 'rejected').length || 0
  const avgRating = reviews?.length 
    ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
    : 0

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`h-4 w-4 inline ${i < rating ? "fill-yellow-400 text-yellow-400" : "text-gray-300"}`}
      />
    ))
  }

  const getReviewStatusLabel = (status: string) => {
    if (status === "approved") return "Aprobada"
    if (status === "pending") return "Pendiente"
    if (status === "rejected") return "Rechazada"
    return status
  }

  return (
    <div className="container mx-auto py-8 px-4 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Moderación de reseñas</h1>
        <p className="text-muted-foreground">Gestiona las reseñas de productos</p>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pendientes</CardTitle>
            <Eye className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pendingCount}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Aprobadas</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{approvedCount}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Rechazadas</CardTitle>
            <XCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{rejectedCount}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Calificación promedio</CardTitle>
            <Star className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{avgRating} ⭐</div>
          </CardContent>
        </Card>
      </div>

      {/* Lista de reseñas */}
      <Card>
        <CardHeader>
          <CardTitle>Todas las reseñas</CardTitle>
          <CardDescription>Modera y responde a las reseñas de clientes</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {reviews?.map((review) => (
              <div key={review.id} className="border rounded-lg p-4 space-y-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <div>{renderStars(review.rating)}</div>
                      <Badge variant={
                        review.status === 'approved' ? 'default' :
                        review.status === 'pending' ? 'secondary' : 'destructive'
                      }>
                        {getReviewStatusLabel(review.status)}
                      </Badge>
                      {review.verified_purchase && (
                        <Badge variant="outline" className="text-green-600">
                          Compra Verificada
                        </Badge>
                      )}
                    </div>
                    
                    {review.title && (
                      <h4 className="font-semibold mb-1">{review.title}</h4>
                    )}
                    
                    <p className="text-sm text-muted-foreground mb-2">
                      Por {review.user?.full_name || 'Usuario'} • {new Date(review.created_at).toLocaleDateString('es-CO')}
                    </p>
                    
                    {review.comment && (
                      <p className="text-sm mb-2">{review.comment}</p>
                    )}
                    
                    <p className="text-sm text-muted-foreground">
                      Producto: <strong>{review.product?.name || 'N/D'}</strong> ({review.product?.product_code})
                    </p>
                    
                    <div className="flex gap-2 text-sm text-muted-foreground">
                      <span>👍 {review.helpful_count}</span>
                      <span>👎 {review.not_helpful_count}</span>
                    </div>

                    {review.seller_response && (
                      <div className="mt-3 p-3 bg-blue-50 dark:bg-blue-950 rounded-lg border-l-4 border-blue-500">
                        <p className="text-sm font-medium text-blue-900 dark:text-blue-100 mb-1">
                          <MessageSquare className="h-4 w-4 inline mr-1" />
                          Respuesta del vendedor:
                        </p>
                        <p className="text-sm text-blue-800 dark:text-blue-200">{review.seller_response}</p>
                        <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                          {new Date(review.seller_response_at).toLocaleDateString('es-CO')}
                        </p>
                      </div>
                    )}
                  </div>
                  
                  <div className="flex flex-col gap-2">
                    {review.status === 'pending' && (
                      <>
                        <form action={`/api/reviews/${review.id}/moderate`} method="POST">
                          <input type="hidden" name="action" value="approve" />
                          <Button size="sm" variant="default" type="submit">
                            <CheckCircle className="h-4 w-4 mr-1" />
                            Aprobar
                          </Button>
                        </form>
                        <form action={`/api/reviews/${review.id}/moderate`} method="POST">
                          <input type="hidden" name="action" value="reject" />
                          <Button size="sm" variant="destructive" type="submit">
                            <XCircle className="h-4 w-4 mr-1" />
                            Rechazar
                          </Button>
                        </form>
                      </>
                    )}
                    {!review.seller_response && (
                      <form action={`/api/reviews/${review.id}/respond`} method="POST" className="space-y-2">
                        <input
                          name="response"
                          placeholder="Escribe una respuesta..."
                          className="h-8 w-full min-w-48 rounded-md border bg-background px-2 text-xs"
                          required
                        />
                        <Button size="sm" variant="outline" type="submit">
                          <MessageSquare className="h-4 w-4 mr-1" />
                          Responder
                        </Button>
                      </form>
                    )}
                  </div>
                </div>
              </div>
            ))}

            {(!reviews || reviews.length === 0) && (
              <div className="text-center py-8 text-muted-foreground">
                No hay reseñas aún
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
