"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Gift, ArrowLeft } from "lucide-react"
import Link from "next/link"
import { useToast } from "@/hooks/use-toast"
import { createGiftRegistryAction } from "@/lib/actions/gift-registry"

export default function NuevaListaRegaloPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [isPending, startTransition] = useTransition()

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)

    startTransition(async () => {
      const result = await createGiftRegistryAction(formData)

      if (result.error) {
        toast({
          title: "Error",
          description: result.error,
          variant: "destructive",
        })
        return
      }

      toast({
        title: "Lista creada",
        description: "Tu lista de regalo ha sido creada. Ahora puedes agregar productos.",
      })
      router.push(`/perfil/listas-regalo/${result.registryId}`)
    })
  }

  return (
    <div className="space-y-6">
      <div>
        <Button variant="ghost" size="sm" asChild className="mb-4">
          <Link href="/perfil/listas-regalo">
            <ArrowLeft className="h-4 w-4 mr-1" />
            Volver a listas
          </Link>
        </Button>
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <Gift className="h-8 w-8" />
          Nueva Lista de Regalo
        </h1>
        <p className="text-muted-foreground mt-2">
          Crea una lista para tu evento especial
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Información del Evento</CardTitle>
          <CardDescription>
            Esta información será visible para quienes visiten tu lista
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="name">Nombre de la lista *</Label>
                <Input
                  id="name"
                  name="name"
                  placeholder="Ej: Boda de María y Juan"
                  required
                />
                <p className="text-xs text-muted-foreground">
                  Este nombre será usado para buscar tu lista
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="event_type">Tipo de evento *</Label>
                <Select name="event_type" defaultValue="wedding">
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona el tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="wedding">Boda</SelectItem>
                    <SelectItem value="baby_shower">Baby Shower</SelectItem>
                    <SelectItem value="birthday">Cumpleaños</SelectItem>
                    <SelectItem value="housewarming">Inauguración de Casa</SelectItem>
                    <SelectItem value="other">Otro</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="event_date">Fecha del evento</Label>
                <Input id="event_date" name="event_date" type="date" />
                <p className="text-xs text-muted-foreground">
                  La lista expirará 2 meses después de esta fecha
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="partner_name">Nombre del co-anfitrión</Label>
                <Input
                  id="partner_name"
                  name="partner_name"
                  placeholder="Ej: Juan Pérez (para bodas)"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Descripción</Label>
              <Textarea
                id="description"
                name="description"
                placeholder="Cuéntale a tus invitados sobre tu evento..."
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="notification_email">Email para notificaciones</Label>
              <Input
                id="notification_email"
                name="notification_email"
                type="email"
                placeholder="email@ejemplo.com"
              />
              <p className="text-xs text-muted-foreground">
                Recibirás un email cuando alguien compre de tu lista
              </p>
            </div>

            <div className="flex gap-4 pt-4">
              <Button type="button" variant="outline" asChild>
                <Link href="/perfil/listas-regalo">Volver a listas</Link>
              </Button>
              <Button type="submit" disabled={isPending} aria-label="Enviar">
                {isPending ? "Creando..." : "Crear Lista"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
