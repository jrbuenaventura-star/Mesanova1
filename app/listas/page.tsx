import { searchGiftRegistries } from "@/lib/db/user-features"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Gift, Search, Calendar, ExternalLink } from "lucide-react"
import Link from "next/link"

const eventTypeLabels: Record<string, string> = {
  wedding: "Boda",
  baby_shower: "Baby Shower",
  birthday: "Cumpleaños",
  housewarming: "Inauguración",
  other: "Otro",
}

export default async function BuscarListasPage({
  searchParams,
}: {
  searchParams: { q?: string }
}) {
  const query = searchParams.q || ""
  const registries = query ? await searchGiftRegistries(query) : []

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString("es-CO", {
      year: "numeric",
      month: "long",
      day: "numeric",
    })
  }

  return (
    <div className="min-h-screen bg-muted/30">
      {/* Header */}
      <div className="bg-background border-b">
        <div className="container max-w-4xl py-12 px-4 text-center">
          <Gift className="h-12 w-12 mx-auto text-primary mb-4" />
          <h1 className="text-4xl font-bold mb-2">Buscar Lista de Regalos</h1>
          <p className="text-muted-foreground mb-8">
            Encuentra la lista de bodas, baby shower o evento especial de tus amigos
          </p>

          <form action="/listas" method="GET" className="max-w-md mx-auto">
            <div className="flex gap-2">
              <Input
                name="q"
                placeholder="Buscar por nombre..."
                defaultValue={query}
                className="flex-1"
              />
              <Button type="submit">
                <Search className="h-4 w-4 mr-2" />
                Buscar
              </Button>
            </div>
          </form>
        </div>
      </div>

      {/* Results */}
      <div className="container max-w-4xl py-8 px-4">
        {query && (
          <p className="text-muted-foreground mb-6">
            {registries.length} resultado{registries.length !== 1 ? "s" : ""} para "{query}"
          </p>
        )}

        {query && registries.length === 0 ? (
          <Card className="p-12 text-center">
            <Gift className="h-16 w-16 mx-auto text-muted-foreground/50 mb-4" />
            <h2 className="text-xl font-semibold mb-2">No encontramos listas</h2>
            <p className="text-muted-foreground">
              Intenta con otro nombre o verifica la ortografía
            </p>
          </Card>
        ) : query ? (
          <div className="space-y-4">
            {registries.map((registry: any) => (
              <Card key={registry.id} className="hover:border-primary/50 transition-colors">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <Badge variant="outline">
                          {eventTypeLabels[registry.event_type] || "Evento"}
                        </Badge>
                      </div>
                      <h2 className="text-xl font-semibold mb-1">{registry.name}</h2>
                      {registry.partner_name && (
                        <p className="text-muted-foreground">& {registry.partner_name}</p>
                      )}
                      {registry.event_date && (
                        <p className="flex items-center gap-1 text-sm text-muted-foreground mt-2">
                          <Calendar className="h-4 w-4" />
                          {formatDate(registry.event_date)}
                        </p>
                      )}
                    </div>
                    <Button asChild>
                      <Link href={`/lista/${registry.share_token}`}>
                        Ver Lista
                        <ExternalLink className="h-4 w-4 ml-2" />
                      </Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="p-12 text-center">
            <Search className="h-16 w-16 mx-auto text-muted-foreground/50 mb-4" />
            <h2 className="text-xl font-semibold mb-2">Busca una lista</h2>
            <p className="text-muted-foreground">
              Ingresa el nombre de la lista o de los anfitriones para encontrarla
            </p>
          </Card>
        )}
      </div>
    </div>
  )
}
