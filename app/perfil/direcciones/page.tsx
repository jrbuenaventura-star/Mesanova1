import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { getUserAddresses } from "@/lib/db/user-features"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { MapPin, Plus, Star, Trash2 } from "lucide-react"
import { AddAddressDialog } from "@/components/profile/add-address-dialog"
import { deleteAddressAction, setDefaultAddressAction } from "@/lib/actions/addresses"

export default async function DireccionesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login?redirect=/perfil/direcciones")
  }

  const addresses = await getUserAddresses(user.id)

  async function setDefaultAddressFormAction(formData: FormData) {
    "use server"
    const addressId = String(formData.get("address_id") || "")
    if (!addressId) return
    await setDefaultAddressAction(addressId)
  }

  async function deleteAddressFormAction(formData: FormData) {
    "use server"
    const addressId = String(formData.get("address_id") || "")
    if (!addressId) return
    await deleteAddressAction(addressId)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <MapPin className="h-8 w-8" />
            Mis Direcciones
          </h1>
          <p className="text-muted-foreground mt-2">
            Gestiona tus direcciones de envío
          </p>
        </div>
        <AddAddressDialog>
          <Button type="button">
            <Plus className="h-4 w-4 mr-2" />
            Nueva Dirección
          </Button>
        </AddAddressDialog>
      </div>

      {addresses.length === 0 ? (
        <Card className="p-12 text-center">
          <MapPin className="h-16 w-16 mx-auto text-muted-foreground/50 mb-4" />
          <h2 className="text-xl font-semibold mb-2">No tienes direcciones guardadas</h2>
          <p className="text-muted-foreground mb-6">
            Agrega una dirección para agilizar tus compras
          </p>
          <AddAddressDialog>
            <Button type="button">
              <Plus className="h-4 w-4 mr-2" />
              Agregar Dirección
            </Button>
          </AddAddressDialog>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {addresses.map((address) => (
            <Card key={address.id} className={address.is_default ? "border-primary" : ""}>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg flex items-center gap-2">
                    {address.label}
                    {address.is_default && (
                      <span className="text-xs bg-primary text-primary-foreground px-2 py-0.5 rounded-full flex items-center gap-1">
                        <Star className="h-3 w-3" />
                        Predeterminada
                      </span>
                    )}
                  </CardTitle>
                  <div className="flex gap-1">
                    <form action={setDefaultAddressFormAction}>
                      <input type="hidden" name="address_id" value={address.id} />
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        type="submit"
                        disabled={address.is_default}
                        aria-label={`Marcar ${address.label} como predeterminada`}
                        title="Marcar como predeterminada"
                      >
                        <Star className="h-4 w-4" />
                      </Button>
                    </form>
                    <form action={deleteAddressFormAction}>
                      <input type="hidden" name="address_id" value={address.id} />
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive"
                        type="submit"
                        aria-label={`Eliminar dirección ${address.label}`}
                        title="Eliminar dirección"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </form>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="font-medium">{address.full_name}</p>
                <p className="text-muted-foreground text-sm mt-1">
                  {address.address_line1}
                  {address.address_line2 && <>, {address.address_line2}</>}
                </p>
                <p className="text-muted-foreground text-sm">
                  {address.city}, {address.state} {address.postal_code}
                </p>
                <p className="text-muted-foreground text-sm">{address.country}</p>
                {address.phone && (
                  <p className="text-muted-foreground text-sm mt-2">Tel: {address.phone}</p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
