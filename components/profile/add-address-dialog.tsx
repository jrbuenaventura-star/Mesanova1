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
import { createAddressAction } from "@/lib/actions/addresses"

interface AddAddressDialogProps {
  children: React.ReactNode
}

export function AddAddressDialog({ children }: AddAddressDialogProps) {
  const [open, setOpen] = useState(false)
  const [isPending, startTransition] = useTransition()
  const { toast } = useToast()

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)

    startTransition(async () => {
      const result = await createAddressAction(formData)

      if (result.error) {
        toast({
          title: "Error",
          description: result.error,
          variant: "destructive",
        })
        return
      }

      toast({
        title: "Dirección guardada",
        description: "Tu dirección ha sido agregada correctamente",
      })
      setOpen(false)
    })
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Nueva Dirección</DialogTitle>
          <DialogDescription>
            Agrega una nueva dirección de envío a tu cuenta
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="label">Etiqueta</Label>
                <Input id="label" name="label" placeholder="Ej: Casa, Oficina" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="full_name">Nombre completo</Label>
                <Input id="full_name" name="full_name" placeholder="Quien recibe" required />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Teléfono</Label>
              <Input id="phone" name="phone" placeholder="Número de contacto" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="address_line1">Dirección</Label>
              <Input id="address_line1" name="address_line1" placeholder="Calle, número, apartamento" required />
            </div>

            <div className="space-y-2">
              <Label htmlFor="address_line2">Dirección adicional (opcional)</Label>
              <Input id="address_line2" name="address_line2" placeholder="Barrio, edificio, referencias" />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="city">Ciudad</Label>
                <Input id="city" name="city" placeholder="Ciudad" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="state">Departamento</Label>
                <Input id="state" name="state" placeholder="Departamento" required />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="postal_code">Código postal</Label>
                <Input id="postal_code" name="postal_code" placeholder="Opcional" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="country">País</Label>
                <Input id="country" name="country" placeholder="Colombia" defaultValue="Colombia" />
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox id="is_default" name="is_default" />
              <Label htmlFor="is_default" className="text-sm font-normal">
                Establecer como dirección predeterminada
              </Label>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isPending} aria-label="Enviar">
              {isPending ? "Guardando..." : "Guardar dirección"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
