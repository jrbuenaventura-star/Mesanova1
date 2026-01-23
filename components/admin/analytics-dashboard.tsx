'use client'

import { useEffect, useMemo, useState } from "react"
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  XAxis,
  YAxis,
} from "recharts"
import { Activity, Eye, MousePointerClick, ShoppingCart, TrendingUp } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ChartContainer, ChartLegend, ChartLegendContent, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"

type DateRangePreset = "7d" | "30d" | "90d"

type AnalyticsApiResponse = {
  range: { startDate: string; endDate: string; preset: string }
  kpis: { sessions: number; users: number; conversions: number; conversionRate: number }
  timeseries: Array<{ date: string; day: string; sessions: number; users: number }>
  sources: Array<{ source: string; sessions: number }>
  topPages: Array<{ path: string; views: number }>
  topEvents: Array<{ name: string; count: number }>
}

const chartConfig = {
  sessions: { label: "Sesiones", color: "hsl(var(--chart-1))" },
  users: { label: "Usuarios", color: "hsl(var(--chart-2))" },
  conversions: { label: "Conversiones", color: "hsl(var(--chart-3))" },
} as const

function formatCompactNumber(value: number) {
  return new Intl.NumberFormat("es-CO", { notation: "compact" }).format(value)
}

export function AnalyticsDashboard() {
  const [preset, setPreset] = useState<DateRangePreset>("30d")
  const [refreshKey, setRefreshKey] = useState(0)
  const [data, setData] = useState<AnalyticsApiResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const controller = new AbortController()

    const fetchAnalytics = async () => {
      setLoading(true)
      setError(null)
      try {
        const res = await fetch(`/api/admin/analytics?preset=${preset}`, {
          method: "GET",
          signal: controller.signal,
          headers: { Accept: "application/json" },
        })

        const json = (await res.json()) as any
        if (!res.ok) {
          throw new Error(json?.error || `Error HTTP ${res.status}`)
        }

        setData(json as AnalyticsApiResponse)
      } catch (e) {
        if ((e as any)?.name !== "AbortError") {
          setError(e instanceof Error ? e.message : "Error desconocido")
          setData(null)
        }
      } finally {
        setLoading(false)
      }
    }

    fetchAnalytics()

    return () => {
      controller.abort()
    }
  }, [preset, refreshKey])

  const trafficData = useMemo(() => data?.timeseries || [], [data])
  const sourceData = useMemo(() => data?.sources || [], [data])

  const totals = useMemo(() => {
    return data?.kpis || { sessions: 0, users: 0, conversions: 0, conversionRate: 0 }
  }, [data])

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold">Analíticas</h1>
          <p className="text-muted-foreground">Resumen de tráfico y performance del sitio</p>
        </div>

        <div className="flex items-center gap-2">
          <Select value={preset} onValueChange={(v) => setPreset(v as DateRangePreset)}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Rango" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">Últimos 7 días</SelectItem>
              <SelectItem value="30d">Últimos 30 días</SelectItem>
              <SelectItem value="90d">Últimos 90 días</SelectItem>
            </SelectContent>
          </Select>

          <Button variant="outline" onClick={() => setRefreshKey((k) => k + 1)}>
            Actualizar
          </Button>
        </div>
      </div>

      {error && (
        <Card>
          <CardHeader>
            <CardTitle>Error</CardTitle>
            <CardDescription>No se pudo cargar analíticas desde GA4</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">{error}</p>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold">{formatCompactNumber(totals.sessions)}</div>
                <p className="text-sm text-muted-foreground">Sesiones</p>
              </div>
              <Activity className="h-7 w-7 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold">{formatCompactNumber(totals.users)}</div>
                <p className="text-sm text-muted-foreground">Usuarios</p>
              </div>
              <Eye className="h-7 w-7 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold">{formatCompactNumber(totals.conversions)}</div>
                <p className="text-sm text-muted-foreground">Conversiones</p>
              </div>
              <ShoppingCart className="h-7 w-7 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold">{totals.conversionRate.toFixed(2)}%</div>
                <p className="text-sm text-muted-foreground">Tasa conversión</p>
              </div>
              <TrendingUp className="h-7 w-7 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Tráfico</CardTitle>
            <CardDescription>Sesiones y usuarios</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig} className="h-[320px] w-full">
              <AreaChart data={trafficData} margin={{ left: 8, right: 8, top: 12, bottom: 0 }}>
                <CartesianGrid vertical={false} />
                <XAxis dataKey="day" tickLine={false} axisLine={false} />
                <YAxis tickLine={false} axisLine={false} width={36} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Area
                  type="monotone"
                  dataKey="sessions"
                  fill="var(--color-sessions)"
                  stroke="var(--color-sessions)"
                  fillOpacity={0.2}
                />
                <Area
                  type="monotone"
                  dataKey="users"
                  fill="var(--color-users)"
                  stroke="var(--color-users)"
                  fillOpacity={0.15}
                />
                <ChartLegend content={<ChartLegendContent />} />
              </AreaChart>
            </ChartContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Fuentes</CardTitle>
            <CardDescription>Sesiones por canal</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={{ sessions: chartConfig.sessions }} className="h-[320px] w-full">
              <BarChart data={sourceData} margin={{ left: 8, right: 8, top: 12, bottom: 0 }}>
                <CartesianGrid vertical={false} />
                <XAxis dataKey="source" tickLine={false} axisLine={false} />
                <YAxis tickLine={false} axisLine={false} width={36} />
                <ChartTooltip content={<ChartTooltipContent nameKey="source" />} />
                <Bar dataKey="sessions" fill="var(--color-sessions)" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="resumen" className="space-y-4">
        <TabsList>
          <TabsTrigger value="resumen">Resumen</TabsTrigger>
          <TabsTrigger value="paginas">Páginas</TabsTrigger>
          <TabsTrigger value="eventos">Eventos</TabsTrigger>
        </TabsList>

        <TabsContent value="resumen">
          <Card>
            <CardHeader>
              <CardTitle>Estado de tracking</CardTitle>
              <CardDescription>Verificación rápida de configuración</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-3">
              <div className="flex items-center justify-between rounded-lg border p-4">
                <div>
                  <div className="font-medium">GA4</div>
                  <div className="text-sm text-muted-foreground">Measurement ID</div>
                </div>
                <Badge variant={process.env.NEXT_PUBLIC_GA4_ID ? "default" : "secondary"}>
                  {process.env.NEXT_PUBLIC_GA4_ID ? "Configurado" : "Pendiente"}
                </Badge>
              </div>

              <div className="flex items-center justify-between rounded-lg border p-4">
                <div>
                  <div className="font-medium">Meta Pixel</div>
                  <div className="text-sm text-muted-foreground">Pixel ID</div>
                </div>
                <Badge variant={process.env.NEXT_PUBLIC_META_PIXEL_ID ? "default" : "secondary"}>
                  {process.env.NEXT_PUBLIC_META_PIXEL_ID ? "Configurado" : "Pendiente"}
                </Badge>
              </div>

              <div className="flex items-center justify-between rounded-lg border p-4">
                <div>
                  <div className="font-medium">GTM</div>
                  <div className="text-sm text-muted-foreground">Container ID</div>
                </div>
                <Badge variant={process.env.NEXT_PUBLIC_GTM_ID ? "default" : "secondary"}>
                  {process.env.NEXT_PUBLIC_GTM_ID ? "Configurado" : "Opcional"}
                </Badge>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="paginas">
          <Card>
            <CardHeader>
              <CardTitle>Top páginas</CardTitle>
              <CardDescription>Páginas más vistas</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Ruta</TableHead>
                    <TableHead className="text-right">Vistas</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={2} className="text-center text-muted-foreground py-8">
                        Cargando...
                      </TableCell>
                    </TableRow>
                  ) : !data?.topPages?.length ? (
                    <TableRow>
                      <TableCell colSpan={2} className="text-center text-muted-foreground py-8">
                        Sin datos
                      </TableCell>
                    </TableRow>
                  ) : (
                    data.topPages.map((p) => (
                      <TableRow key={p.path}>
                        <TableCell className="text-muted-foreground">{p.path}</TableCell>
                        <TableCell className="text-right">{formatCompactNumber(p.views)}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="eventos">
          <Card>
            <CardHeader>
              <CardTitle>Top eventos</CardTitle>
              <CardDescription>Eventos GA4</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Evento</TableHead>
                    <TableHead className="text-right">Ocurrencias</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={2} className="text-center text-muted-foreground py-8">
                        Cargando...
                      </TableCell>
                    </TableRow>
                  ) : !data?.topEvents?.length ? (
                    <TableRow>
                      <TableCell colSpan={2} className="text-center text-muted-foreground py-8">
                        Sin datos
                      </TableCell>
                    </TableRow>
                  ) : (
                    data.topEvents.map((e) => (
                      <TableRow key={e.name}>
                        <TableCell className="font-medium">
                          <div className="flex items-center gap-2">
                            <MousePointerClick className="h-4 w-4 text-muted-foreground" />
                            <span>{e.name}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-right">{formatCompactNumber(e.count)}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
