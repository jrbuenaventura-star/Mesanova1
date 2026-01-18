import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { getUserLoyaltyPoints, getLoyaltyTransactions, getLoyaltyConfig } from "@/lib/db/user-features"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Award, TrendingUp, TrendingDown, Gift, Star, ShoppingBag, MessageSquare } from "lucide-react"

const tierConfig: Record<string, { name: string; color: string; icon: string }> = {
  bronze: { name: "Bronce", color: "bg-amber-600", icon: "🥉" },
  silver: { name: "Plata", color: "bg-gray-400", icon: "🥈" },
  gold: { name: "Oro", color: "bg-yellow-500", icon: "🥇" },
  platinum: { name: "Platino", color: "bg-purple-500", icon: "💎" },
}

const transactionTypeConfig: Record<string, { label: string; icon: React.ElementType; color: string }> = {
  purchase: { label: "Compra", icon: ShoppingBag, color: "text-green-600" },
  review: { label: "Reseña", icon: MessageSquare, color: "text-blue-600" },
  referral: { label: "Referido", icon: Gift, color: "text-purple-600" },
  bonus: { label: "Bonus", icon: Star, color: "text-yellow-600" },
  redemption: { label: "Canje", icon: TrendingDown, color: "text-red-600" },
  expiration: { label: "Expiración", icon: TrendingDown, color: "text-gray-600" },
  adjustment: { label: "Ajuste", icon: TrendingUp, color: "text-gray-600" },
}

export default async function PuntosPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login?redirect=/perfil/puntos")
  }

  const [points, transactions, config] = await Promise.all([
    getUserLoyaltyPoints(user.id),
    getLoyaltyTransactions(user.id),
    getLoyaltyConfig(),
  ])

  const tier = tierConfig[points.tier] || tierConfig.bronze
  
  // Calcular progreso al siguiente tier
  let nextTier = null
  let progress = 0
  if (points.tier === "bronze" && config) {
    nextTier = { name: "Plata", threshold: config.silver_threshold }
    progress = (points.total_points / config.silver_threshold) * 100
  } else if (points.tier === "silver" && config) {
    nextTier = { name: "Oro", threshold: config.gold_threshold }
    progress = ((points.total_points - config.silver_threshold) / (config.gold_threshold - config.silver_threshold)) * 100
  } else if (points.tier === "gold" && config) {
    nextTier = { name: "Platino", threshold: config.platinum_threshold }
    progress = ((points.total_points - config.gold_threshold) / (config.platinum_threshold - config.gold_threshold)) * 100
  }

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString("es-CO", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <Award className="h-8 w-8" />
          Mis Puntos
        </h1>
        <p className="text-muted-foreground mt-2">
          Acumula puntos con cada compra y canjéalos por descuentos
        </p>
      </div>

      {/* Resumen de puntos */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="md:col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-4xl font-bold">
                  {points.available_points.toLocaleString()}
                </CardTitle>
                <CardDescription>Puntos disponibles</CardDescription>
              </div>
              <div className="text-right">
                <Badge className={`${tier.color} text-white text-lg px-3 py-1`}>
                  {tier.icon} {tier.name}
                </Badge>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {nextTier && (
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Progreso a {nextTier.name}</span>
                  <span>{points.total_points.toLocaleString()} / {nextTier.threshold.toLocaleString()}</span>
                </div>
                <Progress value={Math.min(progress, 100)} className="h-2" />
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Resumen</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Total acumulado</span>
              <span className="font-medium">{points.total_points.toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Canjeados</span>
              <span className="font-medium">{points.redeemed_points.toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Pendientes</span>
              <span className="font-medium">{points.pending_points.toLocaleString()}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Cómo ganar puntos */}
      {config && (
        <Card>
          <CardHeader>
            <CardTitle>Cómo ganar puntos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-3">
              <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
                <ShoppingBag className="h-8 w-8 text-green-600" />
                <div>
                  <p className="font-medium">{config.points_per_dollar} punto por $1</p>
                  <p className="text-sm text-muted-foreground">En cada compra</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
                <MessageSquare className="h-8 w-8 text-blue-600" />
                <div>
                  <p className="font-medium">{config.points_for_review} puntos</p>
                  <p className="text-sm text-muted-foreground">Por cada reseña</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
                <Gift className="h-8 w-8 text-purple-600" />
                <div>
                  <p className="font-medium">{config.points_for_referral} puntos</p>
                  <p className="text-sm text-muted-foreground">Por referir amigos</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Historial de transacciones */}
      <Card>
        <CardHeader>
          <CardTitle>Historial de Movimientos</CardTitle>
        </CardHeader>
        <CardContent>
          {transactions.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              Aún no tienes movimientos de puntos
            </p>
          ) : (
            <div className="space-y-3">
              {transactions.map((tx: any) => {
                const typeConfig = transactionTypeConfig[tx.transaction_type] || transactionTypeConfig.adjustment
                const TypeIcon = typeConfig.icon

                return (
                  <div key={tx.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-full bg-muted ${typeConfig.color}`}>
                        <TypeIcon className="h-4 w-4" />
                      </div>
                      <div>
                        <p className="font-medium">{typeConfig.label}</p>
                        {tx.description && (
                          <p className="text-sm text-muted-foreground">{tx.description}</p>
                        )}
                        <p className="text-xs text-muted-foreground">{formatDate(tx.created_at)}</p>
                      </div>
                    </div>
                    <span className={`font-bold ${tx.points > 0 ? "text-green-600" : "text-red-600"}`}>
                      {tx.points > 0 ? "+" : ""}{tx.points.toLocaleString()}
                    </span>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
