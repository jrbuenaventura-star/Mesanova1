"use client"

import { useState, useEffect, useMemo } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import {
  Users,
  UserCheck,
  DollarSign,
  ShoppingCart,
  Search,
  Filter,
  Download,
  Eye,
  Loader2,
  X,
  Upload,
} from "lucide-react"
import { toast } from "sonner"
import Link from "next/link"

interface ClientStat {
  distributorId: string
  userId: string
  companyName: string
  businessType: string | null
  aliadoId: string | null
  aliadoName: string | null
  city: string | null
  state: string | null
  isActive: boolean
  totalSpent: number
  orderCount: number
  avgOrderValue: number
  recencyDays: number | null
  ordersLastYear: number
  lastOrderDate: string | null
  segment: string
}

interface StatsData {
  kpis: {
    totalClients: number
    activeClients: number
    totalRevenue: number
    avgTicket: number
  }
  clients: ClientStat[]
  byAliado: Array<{ id: string; name: string; clients: number; revenue: number; orders: number }>
  byCity: Array<{ city: string; clients: number; revenue: number; orders: number }>
  byBusinessType: Array<{ type: string; clients: number; revenue: number; orders: number }>
  bySegment: Record<string, number>
}

interface Filters {
  search: string
  aliado: string
  city: string
  businessType: string
  segment: string
  minSpent: string
  maxSpent: string
  maxRecency: string
}

const emptyFilters: Filters = {
  search: "",
  aliado: "all",
  city: "all",
  businessType: "all",
  segment: "all",
  minSpent: "",
  maxSpent: "",
  maxRecency: "",
}

const segmentColors: Record<string, string> = {
  VIP: "bg-yellow-100 text-yellow-800 border-yellow-300",
  Leal: "bg-green-100 text-green-800 border-green-300",
  Regular: "bg-blue-100 text-blue-800 border-blue-300",
  "En riesgo": "bg-orange-100 text-orange-800 border-orange-300",
  Dormido: "bg-red-100 text-red-800 border-red-300",
  Nuevo: "bg-gray-100 text-gray-800 border-gray-300",
}

function formatCOP(value: number): string {
  return new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value)
}

export function ClientsDashboard() {
  const router = useRouter()
  const [data, setData] = useState<StatsData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [filters, setFilters] = useState<Filters>(emptyFilters)
  const [showFilters, setShowFilters] = useState(false)
  const [isSyncing, setIsSyncing] = useState(false)

  useEffect(() => {
    loadStats()
  }, [])

  async function loadStats() {
    setIsLoading(true)
    try {
      const res = await fetch("/api/admin/distributors/stats")
      const json = await res.json()
      if (!res.ok) throw new Error(json.error)
      setData(json)
    } catch (error) {
      console.error("Error loading stats:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const activeFilterCount = useMemo(() => {
    let count = 0
    if (filters.aliado !== "all") count++
    if (filters.city !== "all") count++
    if (filters.businessType !== "all") count++
    if (filters.segment !== "all") count++
    if (filters.minSpent) count++
    if (filters.maxSpent) count++
    if (filters.maxRecency) count++
    return count
  }, [filters])

  const filteredClients = useMemo(() => {
    if (!data) return []

    return data.clients.filter((c) => {
      if (filters.search) {
        const q = filters.search.toLowerCase()
        if (
          !c.companyName?.toLowerCase().includes(q) &&
          !c.city?.toLowerCase().includes(q) &&
          !c.aliadoName?.toLowerCase().includes(q)
        ) {
          return false
        }
      }
      if (filters.aliado !== "all") {
        if (filters.aliado === "__direct" && c.aliadoId) return false
        if (filters.aliado !== "__direct" && c.aliadoId !== filters.aliado) return false
      }
      if (filters.city !== "all" && (c.city || "Sin ciudad") !== filters.city) return false
      if (filters.businessType !== "all" && (c.businessType || "Sin tipo") !== filters.businessType) return false
      if (filters.segment !== "all" && c.segment !== filters.segment) return false
      if (filters.minSpent && c.totalSpent < parseFloat(filters.minSpent)) return false
      if (filters.maxSpent && c.totalSpent > parseFloat(filters.maxSpent)) return false
      if (filters.maxRecency && (c.recencyDays === null || c.recencyDays > parseInt(filters.maxRecency))) return false
      return true
    })
  }, [data, filters])

  function exportCSV() {
    if (!filteredClients.length) return

    const headers = [
      "Empresa",
      "Tipo de Negocio",
      "Aliado",
      "Ciudad",
      "Departamento",
      "Segmento",
      "Total Gastado",
      "# Órdenes",
      "Ticket Promedio",
      "Días desde última compra",
      "Órdenes último año",
      "Última compra",
    ]

    const rows = filteredClients.map((c) => [
      c.companyName,
      c.businessType || "",
      c.aliadoName || "Cliente directo",
      c.city || "",
      c.state || "",
      c.segment,
      c.totalSpent.toFixed(0),
      c.orderCount,
      c.avgOrderValue.toFixed(0),
      c.recencyDays ?? "N/D",
      c.ordersLastYear,
      c.lastOrderDate ? new Date(c.lastOrderDate).toLocaleDateString("es-CO") : "Nunca",
    ])

    const csv = [headers, ...rows].map((row) => row.map((v) => `"${v}"`).join(",")).join("\n")
    const blob = new Blob(["\ufeff" + csv], { type: "text/csv;charset=utf-8" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `clientes_mesanova_${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  async function syncToClientify() {
    if (!filteredClients.length) return
    setIsSyncing(true)
    try {
      const res = await fetch("/api/admin/clientify/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          distributorIds: filteredClients.map((c) => c.distributorId),
        }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error)
      toast.success(`Sincronización completada`, {
        description: `${json.synced} sincronizados, ${json.errors} errores de ${json.total} total`,
      })
    } catch (error) {
      toast.error("Error al sincronizar con Clientify", {
        description: error instanceof Error ? error.message : "Error desconocido",
      })
    } finally {
      setIsSyncing(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (!data) {
    return <div className="text-center py-20 text-muted-foreground">Error al cargar datos</div>
  }

  const uniqueAliados = data.byAliado
  const uniqueCities = data.byCity.map((c) => c.city)
  const uniqueTypes = data.byBusinessType.map((t) => t.type)
  const segments = Object.keys(data.bySegment)

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Clientes</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.kpis.totalClients}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Clientes Activos</CardTitle>
            <UserCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.kpis.activeClients}</div>
            <p className="text-xs text-muted-foreground">Con compra en últimos 90 días</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ingresos Totales</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCOP(data.kpis.totalRevenue)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ticket Promedio</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCOP(data.kpis.avgTicket)}</div>
          </CardContent>
        </Card>
      </div>

      {/* Segment Badges */}
      <div className="flex flex-wrap gap-2">
        {segments.map((seg) => (
          <button
            key={seg}
            onClick={() =>
              setFilters((f) => ({
                ...f,
                segment: f.segment === seg ? "all" : seg,
              }))
            }
            className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-sm font-medium transition-all ${
              filters.segment === seg
                ? segmentColors[seg] + " ring-2 ring-offset-1 ring-primary/30"
                : segmentColors[seg] + " opacity-70 hover:opacity-100"
            }`}
          >
            {seg}
            <span className="text-xs font-normal">({data.bySegment[seg]})</span>
          </button>
        ))}
      </div>

      {/* Tabs: Table / Stats by Aliado / Stats by City / Stats by Type */}
      <Tabs defaultValue="clients" className="space-y-4">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <TabsList>
            <TabsTrigger value="clients">Clientes</TabsTrigger>
            <TabsTrigger value="byAliado">Por Aliado</TabsTrigger>
            <TabsTrigger value="byCity">Por Ciudad</TabsTrigger>
            <TabsTrigger value="byType">Por Tipo</TabsTrigger>
          </TabsList>

          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Buscar cliente..."
                value={filters.search}
                onChange={(e) => setFilters((f) => ({ ...f, search: e.target.value }))}
                className="pl-10 w-64"
              />
            </div>

            <Sheet open={showFilters} onOpenChange={setShowFilters}>
              <SheetTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2">
                  <Filter className="h-4 w-4" />
                  Filtros
                  {activeFilterCount > 0 && (
                    <Badge variant="secondary" className="ml-1">
                      {activeFilterCount}
                    </Badge>
                  )}
                </Button>
              </SheetTrigger>
              <SheetContent>
                <SheetHeader>
                  <SheetTitle>Filtros avanzados</SheetTitle>
                  <SheetDescription>Filtra clientes por criterios específicos</SheetDescription>
                </SheetHeader>
                <div className="space-y-4 mt-6">
                  <div className="space-y-2">
                    <Label>Aliado</Label>
                    <Select
                      value={filters.aliado}
                      onValueChange={(v) => setFilters((f) => ({ ...f, aliado: v }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todos</SelectItem>
                        <SelectItem value="__direct">Cliente directo</SelectItem>
                        {uniqueAliados
                          .filter((a) => a.id !== "__direct")
                          .map((a) => (
                            <SelectItem key={a.id} value={a.id}>
                              {a.name}
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Ciudad</Label>
                    <Select
                      value={filters.city}
                      onValueChange={(v) => setFilters((f) => ({ ...f, city: v }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todas</SelectItem>
                        {uniqueCities.map((city) => (
                          <SelectItem key={city} value={city}>
                            {city}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Tipo de Negocio</Label>
                    <Select
                      value={filters.businessType}
                      onValueChange={(v) => setFilters((f) => ({ ...f, businessType: v }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todos</SelectItem>
                        {uniqueTypes.map((t) => (
                          <SelectItem key={t} value={t}>
                            {t}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Segmento</Label>
                    <Select
                      value={filters.segment}
                      onValueChange={(v) => setFilters((f) => ({ ...f, segment: v }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todos</SelectItem>
                        {segments.map((s) => (
                          <SelectItem key={s} value={s}>
                            {s} ({data.bySegment[s]})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Gasto mínimo ($)</Label>
                    <Input
                      type="number"
                      value={filters.minSpent}
                      onChange={(e) => setFilters((f) => ({ ...f, minSpent: e.target.value }))}
                      placeholder="0"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Gasto máximo ($)</Label>
                    <Input
                      type="number"
                      value={filters.maxSpent}
                      onChange={(e) => setFilters((f) => ({ ...f, maxSpent: e.target.value }))}
                      placeholder="Sin límite"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Última compra (máx. días)</Label>
                    <Input
                      type="number"
                      value={filters.maxRecency}
                      onChange={(e) => setFilters((f) => ({ ...f, maxRecency: e.target.value }))}
                      placeholder="Ej: 90"
                    />
                  </div>

                  <div className="flex gap-2 pt-4">
                    <Button
                      variant="outline"
                      className="flex-1"
                      onClick={() => setFilters(emptyFilters)}
                    >
                      Limpiar filtros
                    </Button>
                    <Button className="flex-1" onClick={() => setShowFilters(false)}>
                      Aplicar
                    </Button>
                  </div>
                </div>
              </SheetContent>
            </Sheet>

            <Button variant="outline" size="sm" className="gap-2" onClick={exportCSV}>
              <Download className="h-4 w-4" />
              Exportar CSV ({filteredClients.length})
            </Button>

            <Button
              variant="outline"
              size="sm"
              className="gap-2"
              onClick={syncToClientify}
              disabled={isSyncing || !filteredClients.length}
             aria-label="Subir">
              {isSyncing ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Upload className="h-4 w-4" />
              )}
              {isSyncing ? "Sincronizando..." : `Sync Clientify (${filteredClients.length})`}
            </Button>
          </div>
        </div>

        {/* Active filters display */}
        {activeFilterCount > 0 && (
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm text-muted-foreground">Filtros activos:</span>
            {filters.aliado !== "all" && (
              <Badge variant="secondary" className="gap-1">
                Aliado: {filters.aliado === "__direct" ? "Directo" : uniqueAliados.find((a) => a.id === filters.aliado)?.name}
                <button onClick={() => setFilters((f) => ({ ...f, aliado: "all" }))} aria-label="Cerrar">
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            )}
            {filters.city !== "all" && (
              <Badge variant="secondary" className="gap-1">
                Ciudad: {filters.city}
                <button onClick={() => setFilters((f) => ({ ...f, city: "all" }))} aria-label="Cerrar">
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            )}
            {filters.businessType !== "all" && (
              <Badge variant="secondary" className="gap-1">
                Tipo: {filters.businessType}
                <button onClick={() => setFilters((f) => ({ ...f, businessType: "all" }))} aria-label="Cerrar">
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            )}
            {filters.segment !== "all" && (
              <Badge variant="secondary" className="gap-1">
                Segmento: {filters.segment}
                <button onClick={() => setFilters((f) => ({ ...f, segment: "all" }))} aria-label="Cerrar">
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            )}
            {filters.minSpent && (
              <Badge variant="secondary" className="gap-1">
                Gasto &ge; {formatCOP(parseFloat(filters.minSpent))}
                <button onClick={() => setFilters((f) => ({ ...f, minSpent: "" }))} aria-label="Cerrar">
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            )}
            {filters.maxSpent && (
              <Badge variant="secondary" className="gap-1">
                Gasto &le; {formatCOP(parseFloat(filters.maxSpent))}
                <button onClick={() => setFilters((f) => ({ ...f, maxSpent: "" }))} aria-label="Cerrar">
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            )}
            {filters.maxRecency && (
              <Badge variant="secondary" className="gap-1">
                Recencia &le; {filters.maxRecency}d
                <button onClick={() => setFilters((f) => ({ ...f, maxRecency: "" }))} aria-label="Cerrar">
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            )}
            <button
              className="text-xs text-muted-foreground hover:text-foreground underline"
              onClick={() => setFilters(emptyFilters)}
            >
              Limpiar filtros
            </button>
          </div>
        )}

        {/* Clients Table */}
        <TabsContent value="clients">
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Empresa</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Aliado</TableHead>
                  <TableHead>Ciudad</TableHead>
                  <TableHead>Segmento</TableHead>
                  <TableHead className="text-right">Total Gastado</TableHead>
                  <TableHead className="text-right"># Órdenes</TableHead>
                  <TableHead className="text-right">Recencia</TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredClients.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                      No se encontraron clientes con los filtros aplicados
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredClients.map((client) => (
                    <TableRow key={client.distributorId}>
                      <TableCell className="font-medium">{client.companyName}</TableCell>
                      <TableCell>
                        {client.businessType && (
                          <Badge variant="outline" className="text-xs">
                            {client.businessType}
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-sm">
                        {client.aliadoName || (
                          <span className="text-muted-foreground">Directo</span>
                        )}
                      </TableCell>
                      <TableCell className="text-sm">{client.city || "—"}</TableCell>
                      <TableCell>
                        <span
                          className={`inline-flex rounded-full border px-2 py-0.5 text-xs font-medium ${
                            segmentColors[client.segment] || ""
                          }`}
                        >
                          {client.segment}
                        </span>
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {formatCOP(client.totalSpent)}
                      </TableCell>
                      <TableCell className="text-right">{client.orderCount}</TableCell>
                      <TableCell className="text-right text-sm text-muted-foreground">
                        {client.recencyDays !== null ? `${client.recencyDays}d` : "—"}
                      </TableCell>
                      <TableCell>
                        <Button variant="ghost" size="icon" className="h-8 w-8" asChild aria-label="Ver distribuidor">
                          <Link href={`/admin/distributors/${client.distributorId}`} aria-label="Ver distribuidor">
                            <Eye className="h-4 w-4" />
                          </Link>
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
          <div className="text-sm text-muted-foreground mt-2">
            Mostrando {filteredClients.length} de {data.clients.length} clientes
          </div>
        </TabsContent>

        {/* By Aliado */}
        <TabsContent value="byAliado">
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Aliado</TableHead>
                  <TableHead className="text-right">Clientes</TableHead>
                  <TableHead className="text-right">Ingresos</TableHead>
                  <TableHead className="text-right">Órdenes</TableHead>
                  <TableHead className="text-right">Ticket Promedio</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.byAliado
                  .sort((a, b) => b.revenue - a.revenue)
                  .map((row) => (
                    <TableRow key={row.id}>
                      <TableCell className="font-medium">{row.name}</TableCell>
                      <TableCell className="text-right">{row.clients}</TableCell>
                      <TableCell className="text-right font-medium">
                        {formatCOP(row.revenue)}
                      </TableCell>
                      <TableCell className="text-right">{row.orders}</TableCell>
                      <TableCell className="text-right">
                        {row.orders > 0 ? formatCOP(row.revenue / row.orders) : "—"}
                      </TableCell>
                    </TableRow>
                  ))}
              </TableBody>
            </Table>
          </div>
        </TabsContent>

        {/* By City */}
        <TabsContent value="byCity">
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Ciudad</TableHead>
                  <TableHead className="text-right">Clientes</TableHead>
                  <TableHead className="text-right">Ingresos</TableHead>
                  <TableHead className="text-right">Órdenes</TableHead>
                  <TableHead className="text-right">Ticket Promedio</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.byCity.map((row) => (
                  <TableRow key={row.city}>
                    <TableCell className="font-medium">{row.city}</TableCell>
                    <TableCell className="text-right">{row.clients}</TableCell>
                    <TableCell className="text-right font-medium">
                      {formatCOP(row.revenue)}
                    </TableCell>
                    <TableCell className="text-right">{row.orders}</TableCell>
                    <TableCell className="text-right">
                      {row.orders > 0 ? formatCOP(row.revenue / row.orders) : "—"}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </TabsContent>

        {/* By Business Type */}
        <TabsContent value="byType">
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tipo de Negocio</TableHead>
                  <TableHead className="text-right">Clientes</TableHead>
                  <TableHead className="text-right">Ingresos</TableHead>
                  <TableHead className="text-right">Órdenes</TableHead>
                  <TableHead className="text-right">Ticket Promedio</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.byBusinessType.map((row) => (
                  <TableRow key={row.type}>
                    <TableCell className="font-medium">{row.type}</TableCell>
                    <TableCell className="text-right">{row.clients}</TableCell>
                    <TableCell className="text-right font-medium">
                      {formatCOP(row.revenue)}
                    </TableCell>
                    <TableCell className="text-right">{row.orders}</TableCell>
                    <TableCell className="text-right">
                      {row.orders > 0 ? formatCOP(row.revenue / row.orders) : "—"}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
