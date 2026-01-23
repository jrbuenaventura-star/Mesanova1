'use client'

import { useMemo, useState } from "react"
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts"
import { BarChart3, Building2, TrendingUp, UserPlus, Users } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ChartContainer, ChartLegend, ChartLegendContent, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"

type DateRangePreset = "30d" | "90d" | "ytd"

export type AliadoStatsSummary = {
  companyName?: string | null
  distributors: {
    total: number
    active: number
    totalSales: number
    top: Array<{ id: string; company_name: string; is_active: boolean; total_purchases: number | null; last_purchase_date: string | null }>
  }
  leads: {
    total: number
    byStage: Record<string, number>
    pendingFollowUps: number
  }
}

const chartConfig = {
  sales: { label: "Ventas", color: "hsl(var(--chart-1))" },
  leads: { label: "Leads", color: "hsl(var(--chart-2))" },
} as const

function formatCompactNumber(value: number) {
  return new Intl.NumberFormat("es-CO", { notation: "compact" }).format(value)
}

export function AliadoStatsDashboard({ summary }: { summary: AliadoStatsSummary }) {
  const [preset, setPreset] = useState<DateRangePreset>("90d")

  const series = useMemo(() => {
    const baseSales = summary.distributors.totalSales
    const baseLeads = summary.leads.total

    if (preset === "30d") {
      return Array.from({ length: 30 }).map((_, idx) => ({
        day: String(idx + 1),
        sales: Math.round((baseSales / 30) * (0.7 + ((idx * 13) % 30) / 100)),
        leads: Math.round((baseLeads / 30) * (0.7 + ((idx * 9) % 30) / 100)),
      }))
    }

    if (preset === "ytd") {
      return ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"].map(
        (m, idx) => ({
          day: m,
          sales: Math.round((baseSales / 12) * (0.75 + ((idx * 7) % 20) / 100)),
          leads: Math.round((baseLeads / 12) * (0.75 + ((idx * 11) % 20) / 100)),
        }),
      )
    }

    return Array.from({ length: 12 }).map((_, idx) => ({
      day: `S${idx + 1}`,
      sales: Math.round((baseSales / 12) * (0.75 + ((idx * 7) % 20) / 100)),
      leads: Math.round((baseLeads / 12) * (0.75 + ((idx * 11) % 20) / 100)),
    }))
  }, [preset, summary.distributors.totalSales, summary.leads.total])

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold">Estadísticas</h1>
          <p className="text-muted-foreground">Resumen de tu cartera y pipeline</p>
        </div>

        <div className="flex items-center gap-2">
          <Select value={preset} onValueChange={(v) => setPreset(v as DateRangePreset)}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Rango" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="30d">Últimos 30 días</SelectItem>
              <SelectItem value="90d">Últimos 90 días</SelectItem>
              <SelectItem value="ytd">Año en curso</SelectItem>
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
                <div className="text-2xl font-bold">{summary.distributors.total}</div>
                <p className="text-sm text-muted-foreground">Distribuidores</p>
              </div>
              <Building2 className="h-7 w-7 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold">{summary.distributors.active}</div>
                <p className="text-sm text-muted-foreground">Activos</p>
              </div>
              <Users className="h-7 w-7 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold">${formatCompactNumber(summary.distributors.totalSales)}</div>
                <p className="text-sm text-muted-foreground">Ventas (total)</p>
              </div>
              <TrendingUp className="h-7 w-7 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold">{summary.leads.total}</div>
                <p className="text-sm text-muted-foreground">Leads</p>
              </div>
              <UserPlus className="h-7 w-7 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Performance</CardTitle>
            <CardDescription>Ventas y leads (estimado)</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig} className="h-[320px] w-full">
              <AreaChart data={series} margin={{ left: 8, right: 8, top: 12, bottom: 0 }}>
                <CartesianGrid vertical={false} />
                <XAxis dataKey="day" tickLine={false} axisLine={false} />
                <YAxis tickLine={false} axisLine={false} width={36} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Area type="monotone" dataKey="sales" fill="var(--color-sales)" stroke="var(--color-sales)" fillOpacity={0.2} />
                <Area type="monotone" dataKey="leads" fill="var(--color-leads)" stroke="var(--color-leads)" fillOpacity={0.15} />
                <ChartLegend content={<ChartLegendContent />} />
              </AreaChart>
            </ChartContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Pipeline</CardTitle>
            <CardDescription>Leads por etapa</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {Object.keys(summary.leads.byStage).length === 0 ? (
              <div className="text-sm text-muted-foreground">Sin datos de pipeline</div>
            ) : (
              <div className="space-y-2">
                {Object.entries(summary.leads.byStage)
                  .sort((a, b) => b[1] - a[1])
                  .map(([stage, count]) => (
                    <div key={stage} className="flex items-center justify-between rounded-lg border p-3">
                      <div className="flex items-center gap-2">
                        <BarChart3 className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm font-medium">{stage}</span>
                      </div>
                      <Badge variant="secondary">{count}</Badge>
                    </div>
                  ))}
              </div>
            )}

            <div className="rounded-lg border p-3 flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Seguimientos pendientes</span>
              <Badge variant={summary.leads.pendingFollowUps > 0 ? "default" : "secondary"}>
                {summary.leads.pendingFollowUps}
              </Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="distribuidores" className="space-y-4">
        <TabsList>
          <TabsTrigger value="distribuidores">Distribuidores</TabsTrigger>
          <TabsTrigger value="notas">Notas</TabsTrigger>
        </TabsList>

        <TabsContent value="distribuidores">
          <Card>
            <CardHeader>
              <CardTitle>Top distribuidores</CardTitle>
              <CardDescription>Por total de compras</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Empresa</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead className="text-right">Total compras</TableHead>
                    <TableHead className="text-right">Última compra</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {summary.distributors.top.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                        Sin distribuidores
                      </TableCell>
                    </TableRow>
                  ) : (
                    summary.distributors.top.map((d) => (
                      <TableRow key={d.id}>
                        <TableCell className="font-medium">{d.company_name}</TableCell>
                        <TableCell>
                          <Badge variant={d.is_active ? "default" : "secondary"}>{d.is_active ? "Activo" : "Inactivo"}</Badge>
                        </TableCell>
                        <TableCell className="text-right font-medium">${(d.total_purchases || 0).toLocaleString()}</TableCell>
                        <TableCell className="text-right text-muted-foreground">
                          {d.last_purchase_date ? new Date(d.last_purchase_date).toLocaleDateString() : "-"}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notas">
          <Card>
            <CardHeader>
              <CardTitle>Conectar datos</CardTitle>
              <CardDescription>Este panel está listo para conectarse a tus métricas reales</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2 text-sm text-muted-foreground">
              <div>Para métricas reales, lo ideal es calcular ventas por órdenes y agrupar por fechas.</div>
              <div>También se puede segmentar por distribuidor, etapa de lead y actividad de seguimiento.</div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
