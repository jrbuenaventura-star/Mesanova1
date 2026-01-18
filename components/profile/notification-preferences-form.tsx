"use client"

import { useTransition } from "react"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { useToast } from "@/hooks/use-toast"
import { updateNotificationPreferencesAction } from "@/lib/actions/notifications"

interface NotificationPreferencesFormProps {
  preferences: {
    email_order_updates: boolean
    email_price_alerts: boolean
    email_stock_alerts: boolean
    email_gift_purchases: boolean
    email_promotions: boolean
    email_newsletter: boolean
  }
}

export function NotificationPreferencesForm({ preferences }: NotificationPreferencesFormProps) {
  const [isPending, startTransition] = useTransition()
  const { toast } = useToast()

  const handleChange = (key: string, value: boolean) => {
    startTransition(async () => {
      const result = await updateNotificationPreferencesAction({ [key]: value })

      if (result.error) {
        toast({
          title: "Error",
          description: result.error,
          variant: "destructive",
        })
        return
      }

      toast({
        title: "Preferencias actualizadas",
        description: "Tus preferencias han sido guardadas",
      })
    })
  }

  const items = [
    {
      key: "email_order_updates",
      label: "Actualizaciones de pedidos",
      description: "Recibe notificaciones sobre el estado de tus pedidos",
      value: preferences.email_order_updates,
    },
    {
      key: "email_price_alerts",
      label: "Alertas de precio",
      description: "Notificaciones cuando baje el precio de productos que sigues",
      value: preferences.email_price_alerts,
    },
    {
      key: "email_stock_alerts",
      label: "Alertas de stock",
      description: "Notificaciones cuando un producto vuelva a estar disponible",
      value: preferences.email_stock_alerts,
    },
    {
      key: "email_gift_purchases",
      label: "Compras de listas de regalo",
      description: "Notificaciones cuando alguien compre de tu lista de regalos",
      value: preferences.email_gift_purchases,
    },
    {
      key: "email_promotions",
      label: "Promociones y ofertas",
      description: "Recibe información sobre descuentos y ofertas especiales",
      value: preferences.email_promotions,
    },
    {
      key: "email_newsletter",
      label: "Newsletter",
      description: "Recibe nuestro boletín con novedades y contenido",
      value: preferences.email_newsletter,
    },
  ]

  return (
    <div className="space-y-6">
      {items.map((item) => (
        <div key={item.key} className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label htmlFor={item.key}>{item.label}</Label>
            <p className="text-sm text-muted-foreground">{item.description}</p>
          </div>
          <Switch
            id={item.key}
            checked={item.value}
            onCheckedChange={(checked) => handleChange(item.key, checked)}
            disabled={isPending}
          />
        </div>
      ))}
    </div>
  )
}
