import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Gift, DollarSign, TrendingUp, CreditCard } from "lucide-react"

export default async function BonosAdminPage() {
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

  const { data: giftCards } = await supabase
    .from("gift_cards")
    .select("*")
    .order("created_at", { ascending: false })

  const totalBalance = giftCards?.reduce((sum, card) => sum + Number(card.current_balance), 0) || 0
  const totalSold = giftCards?.reduce((sum, card) => sum + Number(card.initial_amount), 0) || 0
  const activeCards = giftCards?.filter(c => c.status === 'active').length || 0

  return (
    <div className="container mx-auto py-8 space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Gestión de Bonos</h1>
          <p className="text-muted-foreground">Administra bonos de regalo</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Bonos Activos</CardTitle>
            <Gift className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeCards}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Bonos</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{giftCards?.length || 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Saldo Total</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${totalBalance.toLocaleString('es-CO')}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Vendido</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${totalSold.toLocaleString('es-CO')}</div>
          </CardContent>
        </Card>
      </div>

      {/* Bonos List */}
      <Card>
        <CardHeader>
          <CardTitle>Bonos de Regalo</CardTitle>
          <CardDescription>Lista de todos los bonos creados</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {giftCards?.map((card) => (
              <div key={card.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-mono font-semibold">{card.code}</h3>
                    <Badge variant={
                      card.status === 'active' ? 'default' : 
                      card.status === 'used' ? 'secondary' : 'destructive'
                    }>
                      {card.status}
                    </Badge>
                  </div>
                  <div className="flex gap-4 text-sm">
                    <span>
                      Monto inicial: ${Number(card.initial_amount).toLocaleString('es-CO')}
                    </span>
                    <span className="text-green-600 font-medium">
                      Saldo: ${Number(card.current_balance).toLocaleString('es-CO')}
                    </span>
                    <span className="text-muted-foreground">
                      Para: {card.recipient_name || 'N/A'}
                    </span>
                  </div>
                  {card.expires_at && (
                    <p className="text-xs text-muted-foreground mt-1">
                      Expira: {new Date(card.expires_at).toLocaleDateString('es-CO')}
                    </p>
                  )}
                </div>
              </div>
            ))}

            {(!giftCards || giftCards.length === 0) && (
              <div className="text-center py-8 text-muted-foreground">
                No hay bonos creados aún
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
