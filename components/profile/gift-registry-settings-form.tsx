"use client"

import { useMemo, useState, useTransition } from "react"
import { useRouter } from "next/navigation"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import { updateGiftRegistryAction } from "@/lib/actions/gift-registry"

type GiftRegistrySettingsFormProps = {
  registryId: string
  initialData: {
    name: string
    event_type: string
    event_date?: string | null
    partner_name?: string | null
    description?: string | null
    event_address?: string | null
    notification_email?: string | null
    status: string
    is_searchable?: boolean | null
  }
}

const EVENT_TYPE_OPTIONS = [
  { value: "wedding", label: "Boda" },
  { value: "baby_shower", label: "Baby Shower" },
  { value: "birthday", label: "Cumpleaños" },
  { value: "housewarming", label: "Inauguración de Casa" },
  { value: "other", label: "Otro" },
]

const STATUS_OPTIONS = [
  { value: "draft", label: "Borrador" },
  { value: "active", label: "Activa" },
  { value: "archived", label: "Archivada" },
  { value: "completed", label: "Completada" },
  { value: "expired", label: "Expirada" },
  { value: "cancelled", label: "Cancelada" },
]

function normalizeStatus(rawStatus: string) {
  return (
    (
      {
        borrador: "draft",
        activa: "active",
        archivada: "archived",
        completada: "completed",
        expirada: "expired",
        cancelada: "cancelled",
      } as const
    )[rawStatus as "borrador" | "activa" | "archivada" | "completada" | "expirada" | "cancelada"] || rawStatus
  )
}

export function GiftRegistrySettingsForm({ registryId, initialData }: GiftRegistrySettingsFormProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [isPending, startTransition] = useTransition()

  const initialEventDate = useMemo(() => {
    if (!initialData.event_date) return ""
    return new Date(initialData.event_date).toISOString().slice(0, 10)
  }, [initialData.event_date])

  const [name, setName] = useState(initialData.name || "")
  const [eventType, setEventType] = useState(initialData.event_type || "wedding")
  const [eventDate, setEventDate] = useState(initialEventDate)
  const [partnerName, setPartnerName] = useState(initialData.partner_name || "")
  const [description, setDescription] = useState(initialData.description || "")
  const [eventAddress, setEventAddress] = useState(initialData.event_address || "")
  const [notificationEmail, setNotificationEmail] = useState(initialData.notification_email || "")
  const initialStatus = useMemo(() => normalizeStatus(initialData.status || "draft"), [initialData.status])
  const [status, setStatus] = useState<string>(initialStatus)
  const [privacy, setPrivacy] = useState(initialData.is_searchable === false ? "private" : "public")

  const handleSubmit = () => {
    if (status === "archived" && initialStatus !== "archived") {
      const shouldArchive = window.confirm(
        "Al archivar esta lista dejará de estar activa para compartir. ¿Quieres continuar?"
      )
      if (!shouldArchive) return
    }

    startTransition(async () => {
      const formData = new FormData()
      formData.set("name", name.trim())
      formData.set("event_type", eventType)
      formData.set("event_date", eventDate)
      formData.set("partner_name", partnerName.trim())
      formData.set("description", description.trim())
      formData.set("event_address", eventAddress.trim())
      formData.set("notification_email", notificationEmail.trim())
      formData.set("status", status)
      formData.set("privacy", privacy)

      const result = await updateGiftRegistryAction(registryId, formData)

      if (result.error) {
        toast({
          title: "No se pudo actualizar",
          description: result.error,
          variant: "destructive",
        })
        return
      }

      toast({
        title: "Lista actualizada",
        description: "Se guardaron los cambios del evento",
      })
      router.refresh()
    })
  }

  return (
    <div className="space-y-5">
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="registry-name">Nombre de la lista</Label>
          <Input
            id="registry-name"
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="Ej: Boda de María y Juan"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="registry-status">Estado</Label>
          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger id="registry-status">
              <SelectValue placeholder="Selecciona estado" />
            </SelectTrigger>
            <SelectContent>
              {STATUS_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="registry-event-type">Tipo de evento</Label>
          <Select value={eventType} onValueChange={setEventType}>
            <SelectTrigger id="registry-event-type">
              <SelectValue placeholder="Selecciona tipo" />
            </SelectTrigger>
            <SelectContent>
              {EVENT_TYPE_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="registry-event-date">Fecha del evento</Label>
          <Input
            id="registry-event-date"
            type="date"
            value={eventDate}
            onChange={(event) => setEventDate(event.target.value)}
          />
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="registry-partner">Pareja / anfitrión(a)</Label>
          <Input
            id="registry-partner"
            value={partnerName}
            onChange={(event) => setPartnerName(event.target.value)}
            placeholder="Nombre de la pareja o anfitrión"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="registry-privacy">Privacidad</Label>
          <Select value={privacy} onValueChange={setPrivacy}>
            <SelectTrigger id="registry-privacy">
              <SelectValue placeholder="Selecciona privacidad" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="public">Pública (visible en búsquedas)</SelectItem>
              <SelectItem value="private">Privada (solo por enlace)</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="registry-address">Dirección del evento</Label>
        <Input
          id="registry-address"
          value={eventAddress}
          onChange={(event) => setEventAddress(event.target.value)}
          placeholder="Ej: Calle 123 #45-67, Bogotá"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="registry-description">Descripción</Label>
        <Textarea
          id="registry-description"
          value={description}
          onChange={(event) => setDescription(event.target.value)}
          rows={3}
          placeholder="Información adicional para invitados"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="registry-email">Email de notificación</Label>
        <Input
          id="registry-email"
          type="email"
          value={notificationEmail}
          onChange={(event) => setNotificationEmail(event.target.value)}
          placeholder="email@ejemplo.com"
        />
      </div>

      <div className="flex justify-end">
        <Button type="button" disabled={isPending} onClick={handleSubmit}>
          {isPending ? "Guardando..." : "Guardar cambios"}
        </Button>
      </div>
    </div>
  )
}
