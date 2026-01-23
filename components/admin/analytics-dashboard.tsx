'use client'

import { useMemo, useState } from "react"
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

const chartConfig = {
  sessions: { label: "Sesiones", color: "hsl(var(--chart-1))" },
  users: { label: "Usuarios", color: "hsl(var(--chart-2))" },
  conversions: { label: "Conversiones", color: "hsl(var(--chart-3))" },
} as const

const trafficDataByPreset: Record<DateRangePreset, Array<{ day: string; sessions: number; users: number }>> = {
  "7d": [
    { day: "Lun", sessions: 1240, users: 890 },
    { day: "Mar", sessions: 1320, users: 940 },
    { day: "Mié", sessions: 980, users: 760 },
    { day: "Jue", sessions: 1550, users: 1120 },
    { day: "Vie", sessions: 1680, users: 1210 },
    { day: "Sáb", sessions: 1100, users: 820 },
    { day: "Dom", sessions: 950, users: 710 },
  ],
  "30d": Array.from({ length: 30 }).map((_, idx) => ({
    day: String(idx + 1),
    sessions: 900 + ((idx * 47) % 900),
    users: 650 + ((idx * 31) % 700),
  })),
  "90d": Array.from({ length: 12 }).map((_, idx) => ({
    day: `S${idx + 1}`,
    sessions: 18000 + ((idx * 2100) % 9000),
    users: 12000 + ((idx * 1500) % 7000),
  })),
}

const sourceDataByPreset: Record<DateRangePreset, Array<{ source: string; sessions: number }>> = {
  "7d": [
    { source: "Organic", sessions: 3200 },
    { source: "Paid", sessions: 1100 },
    { source: "Direct", sessions: 980 },
    { source: "Referral", sessions: 420 },
  ],
  "30d": [
    { source: "Organic", sessions: 14200 },
    { source: "Paid", sessions: 6800 },
    { source: "Direct", sessions: 5200 },
    { source: "Referral", sessions: 1900 },
  ],
  "90d": [
    { source: "Organic", sessions: 44100 },
    { source: "Paid", sessions: 20200 },
    { source: "Direct", sessions: 15800 },
    { source: "Referral", sessions: 6200 },
  ],
}

const topPages = [
  { path: "/", title: "Home", views: 28450, avgTime: "01:24", bounceRate: 42.1 },
  { path: "/buscar", title: "Buscar", views: 12420, avgTime: "00:58", bounceRate: 55.4 },
  { path: "/carrito", title: "Carrito", views: 6120, avgTime: "01:10", bounceRate: 37.6 },
  { path: "/checkout", title: "Checkout", views: 3410, avgTime: "02:05", bounceRate: 29.3 },
  { path: "/blog", title: "Blog", views: 2890, avgTime: "01:46", bounceRate: 61.2 },
]

const topEvents = [
  { name: "view_item", count: 18420, category: "Ecommerce" },
  { name: "add_to_cart", count: 6420, category: "Ecommerce" },
  { name: "begin_checkout", count: 2190, category: "Ecommerce" },
  { name: "purchase", count: 410, category: "Ecommerce" },
  { name: "generate_lead", count: 380, category: "Lead" },
]

function formatCompactNumber(value: number) {
  return new Intl.NumberFormat("es-CO", { notation: "compact" }).format(value)
}

export function AnalyticsDashboard() {
  const [preset, setPreset] = useState<DateRangePreset>("30d")

  const trafficData = useMemo(() => trafficDataByPreset[preset], [preset])
  const sourceData = useMemo(() => sourceDataByPreset[preset], [preset])

  const totals = useMemo(() => {
    const sessions = trafficData.reduce((sum, d) => sum + d.sessions, 0)
    const users = trafficData.reduce((sum, d) => sum + d.users, 0)
    const conversions = Math.round(sessions * 0.021)
    const conversionRate = sessions > 0 ? (conversions / sessions) * 100 : 0

    return { sessions, users, conversions, conversionRate }
  }, [trafficData])

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

          <Button variant="outline" onClick={() => setPreset(preset)}>
            Actualizar
          </Button>
        </div>
      </div>

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
              <CardDescription>Páginas más vistas (mock)</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Página</TableHead>
                    <TableHead>Ruta</TableHead>
                    <TableHead className="text-right">Vistas</TableHead>
                    <TableHead className="text-right">Tiempo prom.</TableHead>
                    <TableHead className="text-right">Bounce</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {topPages.map((p) => (
                    <TableRow key={p.path}>
                      <TableCell className="font-medium">{p.title}</TableCell>
                      <TableCell className="text-muted-foreground">{p.path}</TableCell>
                      <TableCell className="text-right">{formatCompactNumber(p.views)}</TableCell>
                      <TableCell className="text-right">{p.avgTime}</TableCell>
                      <TableCell className="text-right">{p.bounceRate.toFixed(1)}%</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="eventos">
          <Card>
            <CardHeader>
              <CardTitle>Top eventos</CardTitle>
              <CardDescription>Eventos GA4 (mock)</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Evento</TableHead>
                    <TableHead>Categoría</TableHead>
                    <TableHead className="text-right">Ocurrencias</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {topEvents.map((e) => (
                    <TableRow key={e.name}>
                      <TableCell className="font-medium">{e.name}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <MousePointerClick className="h-4 w-4 text-muted-foreground" />
                          <span className="text-muted-foreground">{e.category}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">{formatCompactNumber(e.count)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
