import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { getUserNotifications, markAllNotificationsAsRead } from "@/lib/db/user-features"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Bell, Package, Tag, ShoppingBag, Gift, Star, Award, Megaphone, CheckCheck } from "lucide-react"
import { revalidatePath } from "next/cache"

const notificationTypeConfig: Record<string, { icon: React.ElementType; color: string }> = {
  order_status: { icon: Package, color: "text-blue-600 bg-blue-100" },
  price_drop: { icon: Tag, color: "text-green-600 bg-green-100" },
  back_in_stock: { icon: ShoppingBag, color: "text-purple-600 bg-purple-100" },
  gift_purchased: { icon: Gift, color: "text-pink-600 bg-pink-100" },
  review_response: { icon: Star, color: "text-yellow-600 bg-yellow-100" },
  points_earned: { icon: Award, color: "text-amber-600 bg-amber-100" },
  points_expiring: { icon: Award, color: "text-red-600 bg-red-100" },
  promotion: { icon: Megaphone, color: "text-indigo-600 bg-indigo-100" },
  system: { icon: Bell, color: "text-gray-600 bg-gray-100" },
}

export default async function NotificacionesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login?redirect=/perfil/notificaciones")
  }

  const notifications = await getUserNotifications(user.id, 50)
  const unreadCount = notifications.filter((n: any) => !n.is_read).length

  const handleMarkAllRead = async () => {
    "use server"
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      await markAllNotificationsAsRead(user.id)
      revalidatePath("/perfil/notificaciones")
    }
  }

  const formatDate = (date: string) => {
    const now = new Date()
    const notifDate = new Date(date)
    const diffMs = now.getTime() - notifDate.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMins < 60) return `Hace ${diffMins} min`
    if (diffHours < 24) return `Hace ${diffHours}h`
    if (diffDays < 7) return `Hace ${diffDays} días`
    return notifDate.toLocaleDateString("es-CO", { month: "short", day: "numeric" })
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Bell className="h-8 w-8" />
            Notificaciones
            {unreadCount > 0 && (
              <Badge variant="destructive" className="ml-2">{unreadCount}</Badge>
            )}
          </h1>
          <p className="text-muted-foreground mt-2">
            Mantente al día con tus pedidos y alertas
          </p>
        </div>
        {unreadCount > 0 && (
          <form action={handleMarkAllRead}>
            <Button variant="outline" size="sm" type="submit">
              <CheckCheck className="h-4 w-4 mr-2" />
              Marcar todas como leídas
            </Button>
          </form>
        )}
      </div>

      {notifications.length === 0 ? (
        <Card className="p-12 text-center">
          <Bell className="h-16 w-16 mx-auto text-muted-foreground/50 mb-4" />
          <h2 className="text-xl font-semibold mb-2">No tienes notificaciones</h2>
          <p className="text-muted-foreground">
            Aquí aparecerán tus alertas de pedidos, precios y más
          </p>
        </Card>
      ) : (
        <div className="space-y-2">
          {notifications.map((notification: any) => {
            const config = notificationTypeConfig[notification.type] || notificationTypeConfig.system
            const NotifIcon = config.icon

            return (
              <Card 
                key={notification.id} 
                className={`transition-colors ${!notification.is_read ? "bg-primary/5 border-primary/20" : ""}`}
              >
                <CardContent className="p-4">
                  <div className="flex gap-4">
                    <div className={`p-2 rounded-full shrink-0 ${config.color}`}>
                      <NotifIcon className="h-5 w-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className={`font-medium ${!notification.is_read ? "text-foreground" : "text-muted-foreground"}`}>
                            {notification.title}
                          </p>
                          <p className="text-sm text-muted-foreground mt-1">
                            {notification.message}
                          </p>
                        </div>
                        <span className="text-xs text-muted-foreground whitespace-nowrap">
                          {formatDate(notification.created_at)}
                        </span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
