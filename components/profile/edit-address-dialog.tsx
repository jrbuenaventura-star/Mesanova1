"use client"

import { useState, useTransition } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { useToast } from "@/hooks/use-toast"
import { updateAddressAction } from "@/lib/actions/addresses"
import type { ShippingAddress } from "@/lib/db/types"

interface EditAddressDialogProps {
  children: React.ReactNode
  address: ShippingAddress
}

export function EditAddressDialog({ children, address }: EditAddressDialogProps) {
  const [open, setOpen] = useState(false)
  const [isPending, startTransition] = useTransition()
  const { toast } = useToast()

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)

    startTransition(async () => {
      const result = await updateAddressAction(address.id, formData)

      if (result.error) {
        toast({
          title: "Error",
          description: result.error,
          variant: "destructive",
        })
        return
      }

      toast({
        title: "Dirección actualizada",
        description: "Los cambios se guardaron correctamente",
      })
      setOpen(false)
    })
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Editar Dirección</DialogTitle>
          <DialogDescription>
            Actualiza los datos de esta dirección de envío
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor={`label-${address.id}`}>Etiqueta</Label>
                <Input id={`label-${address.id}`} name="label" defaultValue={address.label} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor={`full_name-${address.id}`}>Nombre completo</Label>
                <Input id={`full_name-${address.id}`} name="full_name" defaultValue={address.full_name} required />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor={`phone-${address.id}`}>Teléfono</Label>
              <Input id={`phone-${address.id}`} name="phone" defaultValue={address.phone || ""} />
            </div>

            <div className="space-y-2">
              <Label htmlFor={`address_line1-${address.id}`}>Dirección</Label>
              <Input
                id={`address_line1-${address.id}`}
                name="address_line1"
                defaultValue={address.address_line1}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor={`address_line2-${address.id}`}>Dirección adicional (opcional)</Label>
              <Input
                id={`address_line2-${address.id}`}
                name="address_line2"
                defaultValue={address.address_line2 || ""}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor={`city-${address.id}`}>Ciudad</Label>
                <Input id={`city-${address.id}`} name="city" defaultValue={address.city} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor={`state-${address.id}`}>Departamento</Label>
                <Input id={`state-${address.id}`} name="state" defaultValue={address.state} required />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor={`postal_code-${address.id}`}>Código postal</Label>
                <Input
                  id={`postal_code-${address.id}`}
                  name="postal_code"
                  defaultValue={address.postal_code || ""}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor={`country-${address.id}`}>País</Label>
                <Input id={`country-${address.id}`} name="country" defaultValue={address.country || "Colombia"} />
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox id={`is_default-${address.id}`} name="is_default" defaultChecked={address.is_default} />
              <Label htmlFor={`is_default-${address.id}`} className="text-sm font-normal">
                Establecer como dirección predeterminada
              </Label>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isPending} aria-label="Enviar">
              {isPending ? "Guardando..." : "Guardar cambios"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
