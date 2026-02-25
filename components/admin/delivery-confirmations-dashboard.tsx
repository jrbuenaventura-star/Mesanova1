"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import Link from "next/link"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/hooks/use-toast"
import { storeOfflineDayDeliveries } from "@/lib/delivery/offline-client"

type DashboardPayload = {
  operativo: {
    entregas_pendientes: number
    entregas_confirmadas: number
    entregas_con_incidencia: number
    tiempo_promedio_validacion_segundos: number
    sincronizaciones_offline_pendientes: number
  }
  analitico: {
    reclamaciones_por_sku: Array<{
      sku: string
      claims: number
      defective_quantity: number
    }>
    reclamaciones_por_transportador: Array<{
      transporter_id: string
      claims: number
    }>
    reclamaciones_por_bodega: Array<{
      warehouse_id: string
      claims: number
    }>
    score_por_transportador: Array<{
      transporter_id: string
      total_deliveries: number
      incidents: number
      score: number
    }>
    indice_merma_potencial: number
    ranking_skus_criticos: Array<{
      sku: string
      score: number
      claims: number
      defective_quantity: number
    }>
  }
}

type QrRecord = {
  id: string
  qr_code_ref: string
  order_id: string
  warehouse_id: string
  delivery_batch_id: string
  transporter_id: string | null
  status: string
  issued_at: string
  expires_at: string
  confirmed_at: string | null
  packages: Array<{
    id: string
    package_number: number
    total_packages: number
    quantity_total: number
  }>
}

function formatDate(value?: string | null) {
  if (!value) {
    return "N/A"
  }
  return new Date(value).toLocaleString("es-CO")
}

function statusVariant(status: string): "default" | "secondary" | "destructive" | "outline" {
  if (status === "pendiente") return "outline"
  if (status === "confirmado") return "default"
  if (status === "confirmado_con_incidente") return "secondary"
  if (status === "rechazado") return "destructive"
  return "secondary"
}

export function DeliveryConfirmationsDashboard() {
  const { toast } = useToast()
  const [dashboard, setDashboard] = useState<DashboardPayload | null>(null)
  const [records, setRecords] = useState<QrRecord[]>([])
  const [loading, setLoading] = useState(false)
  const [createdQr, setCreatedQr] = useState<{
    qr_id: string
    qr_code_ref: string
    delivery_url: string
    expires_at: string
  } | null>(null)
  const [qrForm, setQrForm] = useState({
    order_id: "",
    warehouse_id: "",
    delivery_batch_id: "",
    customer_id: "",
    transporter_id: "",
    expires_in_minutes: "1440",
    total_packages: "1",
    package_definitions_json: "",
  })

  const loadDashboard = useCallback(async () => {
    const response = await fetch("/api/admin/delivery/dashboard", { cache: "no-store" })
    const payload = await response.json()
    if (!response.ok) {
      throw new Error(payload.error || "No se pudo cargar el dashboard")
    }
    setDashboard(payload)
  }, [])

  const loadRecords = useCallback(async () => {
    const response = await fetch("/api/admin/delivery/qr?status=all", { cache: "no-store" })
    const payload = await response.json()
    if (!response.ok) {
      throw new Error(payload.error || "No se pudo cargar QR de entregas")
    }
    setRecords(payload.records || [])
  }, [])

  const refresh = useCallback(async () => {
    setLoading(true)
    try {
      await Promise.all([loadDashboard(), loadRecords()])
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "No se pudo cargar el módulo",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }, [loadDashboard, loadRecords, toast])

  useEffect(() => {
    void refresh()
  }, [refresh])

  const buildPackages = () => {
    if (qrForm.package_definitions_json.trim()) {
      const parsed = JSON.parse(qrForm.package_definitions_json)
      if (!Array.isArray(parsed)) {
        throw new Error("package_definitions_json debe ser un array JSON")
      }
      return parsed
    }

    const totalPackages = Number(qrForm.total_packages || "1")
    if (!Number.isInteger(totalPackages) || totalPackages <= 0) {
      throw new Error("total_packages debe ser entero mayor a 0")
    }

    return Array.from({ length: totalPackages }, (_, index) => ({
      package_number: index + 1,
      total_packages: totalPackages,
      quantity_total: 0,
      sku_distribution: [],
    }))
  }

  const createQr = async () => {
    try {
      const packages = buildPackages()
      const response = await fetch("/api/admin/delivery/qr", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          order_id: qrForm.order_id.trim(),
          warehouse_id: qrForm.warehouse_id.trim(),
          delivery_batch_id: qrForm.delivery_batch_id.trim(),
          customer_id: qrForm.customer_id.trim() || undefined,
          transporter_id: qrForm.transporter_id.trim() || undefined,
          expires_in_minutes: Number(qrForm.expires_in_minutes || "1440"),
          packages,
        }),
      })
      const payload = await response.json()
      if (!response.ok) {
        throw new Error(payload.error || "No se pudo generar el QR")
      }

      setCreatedQr(payload)
      toast({
        title: "QR generado",
        description: `Código ${payload.qr_code_ref} creado para pedido ${payload.order_id}.`,
      })

      await refresh()
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "No se pudo generar el QR",
        variant: "destructive",
      })
    }
  }

  const preloadDayDeliveries = async () => {
    try {
      const response = await fetch("/api/admin/delivery/day-list", { cache: "no-store" })
      const payload = await response.json()
      if (!response.ok) {
        throw new Error(payload.error || "No se pudo descargar entregas del día")
      }
      await storeOfflineDayDeliveries(payload)
      toast({
        title: "Entregas descargadas",
        description: `Se guardaron ${payload.records?.length || 0} entregas en caché cifrado local.`,
      })
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "No se pudo preparar el modo offline",
        variant: "destructive",
      })
    }
  }

  const operationalCards = useMemo(() => {
    if (!dashboard) return []
    return [
      { label: "Pendientes", value: dashboard.operativo.entregas_pendientes },
      { label: "Confirmadas", value: dashboard.operativo.entregas_confirmadas },
      { label: "Con incidencia", value: dashboard.operativo.entregas_con_incidencia },
      {
        label: "Validación OTP promedio (s)",
        value: dashboard.operativo.tiempo_promedio_validacion_segundos,
      },
      {
        label: "Sincronizaciones offline pendientes",
        value: dashboard.operativo.sincronizaciones_offline_pendientes,
      },
    ]
  }, [dashboard])

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-2">
        <Button onClick={() => void refresh()} disabled={loading}>
          Actualizar métricas
        </Button>
        <Button variant="outline" onClick={preloadDayDeliveries}>
          Descargar entregas del día (offline)
        </Button>
        <Button
          variant="outline"
          onClick={() => window.open("/api/admin/delivery/export", "_blank", "noopener,noreferrer")}
        >
          Exportar Excel (CSV)
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        {operationalCards.map((card) => (
          <Card key={card.label}>
            <CardHeader className="pb-2">
              <CardDescription>{card.label}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{card.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Generar QR dinámico de entrega</CardTitle>
          <CardDescription>
            Crea QR firmado por pedido, bodega y lote de transporte. No expone datos sensibles en el QR.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="order_id">Order ID</Label>
              <Input
                id="order_id"
                value={qrForm.order_id}
                onChange={(event) => setQrForm((prev) => ({ ...prev, order_id: event.target.value }))}
                placeholder="UUID o ID ERP"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="warehouse_id">Warehouse ID</Label>
              <Input
                id="warehouse_id"
                value={qrForm.warehouse_id}
                onChange={(event) => setQrForm((prev) => ({ ...prev, warehouse_id: event.target.value }))}
                placeholder="BOD-BOG-01"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="delivery_batch_id">Delivery Batch ID</Label>
              <Input
                id="delivery_batch_id"
                value={qrForm.delivery_batch_id}
                onChange={(event) =>
                  setQrForm((prev) => ({ ...prev, delivery_batch_id: event.target.value }))
                }
                placeholder="RUTA-2026-02-25-AM"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="customer_id">Cliente ID (opcional)</Label>
              <Input
                id="customer_id"
                value={qrForm.customer_id}
                onChange={(event) => setQrForm((prev) => ({ ...prev, customer_id: event.target.value }))}
                placeholder="CLIENTE-001"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="transporter_id">Transportador ID (opcional)</Label>
              <Input
                id="transporter_id"
                value={qrForm.transporter_id}
                onChange={(event) =>
                  setQrForm((prev) => ({ ...prev, transporter_id: event.target.value }))
                }
                placeholder="TRANS-045"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="expires_in_minutes">Expiración (minutos)</Label>
              <Input
                id="expires_in_minutes"
                type="number"
                min={15}
                step={1}
                value={qrForm.expires_in_minutes}
                onChange={(event) =>
                  setQrForm((prev) => ({ ...prev, expires_in_minutes: event.target.value }))
                }
              />
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="total_packages">Total de bultos (modo rápido)</Label>
              <Input
                id="total_packages"
                type="number"
                min={1}
                step={1}
                value={qrForm.total_packages}
                onChange={(event) =>
                  setQrForm((prev) => ({ ...prev, total_packages: event.target.value }))
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="package_definitions_json">Definición avanzada bultos (JSON opcional)</Label>
              <Textarea
                id="package_definitions_json"
                value={qrForm.package_definitions_json}
                onChange={(event) =>
                  setQrForm((prev) => ({ ...prev, package_definitions_json: event.target.value }))
                }
                placeholder='[{"package_number":1,"total_packages":2,"customer_number":"C-1","provider_barcode":"123","quantity_total":4,"sku_distribution":[{"sku":"ABC","quantity":2}]}]'
                rows={3}
              />
            </div>
          </div>

          <Button onClick={createQr}>Generar QR</Button>

          {createdQr && (
            <div className="rounded-md border p-4 space-y-2">
              <p className="text-sm">
                <strong>QR ID:</strong> {createdQr.qr_id}
              </p>
              <p className="text-sm">
                <strong>Código:</strong> {createdQr.qr_code_ref}
              </p>
              <p className="text-sm">
                <strong>Expira:</strong> {formatDate(createdQr.expires_at)}
              </p>
              <p className="text-sm break-all">
                <strong>URL:</strong> {createdQr.delivery_url}
              </p>
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  void navigator.clipboard.writeText(createdQr.delivery_url)
                  toast({
                    title: "Copiado",
                    description: "URL del QR copiada al portapapeles",
                  })
                }}
              >
                Copiar URL
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Ranking SKUs críticos</CardTitle>
            <CardDescription>Basado en volumen de reclamaciones y cantidad defectuosa.</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>SKU</TableHead>
                  <TableHead>Claims</TableHead>
                  <TableHead>Cant. defectuosa</TableHead>
                  <TableHead>Score</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(dashboard?.analitico.ranking_skus_criticos || []).slice(0, 8).map((sku) => (
                  <TableRow key={sku.sku}>
                    <TableCell>{sku.sku}</TableCell>
                    <TableCell>{sku.claims}</TableCell>
                    <TableCell>{sku.defective_quantity}</TableCell>
                    <TableCell>{sku.score}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Score por transportador</CardTitle>
            <CardDescription>
              Índice de cumplimiento neto por incidencias. Merma potencial:{" "}
              <strong>{dashboard?.analitico.indice_merma_potencial ?? 0}</strong>
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Transportador</TableHead>
                  <TableHead>Entregas</TableHead>
                  <TableHead>Incidencias</TableHead>
                  <TableHead>Score</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(dashboard?.analitico.score_por_transportador || []).slice(0, 8).map((row) => (
                  <TableRow key={row.transporter_id}>
                    <TableCell>{row.transporter_id}</TableCell>
                    <TableCell>{row.total_deliveries}</TableCell>
                    <TableCell>{row.incidents}</TableCell>
                    <TableCell>{row.score}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Trazabilidad de QRs</CardTitle>
          <CardDescription>
            Monitorea estado por pedido, lote y transportador. Descarga evidencia PDF de confirmaciones.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>QR</TableHead>
                <TableHead>Pedido</TableHead>
                <TableHead>Bodega</TableHead>
                <TableHead>Lote</TableHead>
                <TableHead>Transportador</TableHead>
                <TableHead>Bultos</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Confirmado</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {records.slice(0, 80).map((record) => (
                <TableRow key={record.id}>
                  <TableCell>{record.qr_code_ref}</TableCell>
                  <TableCell>{record.order_id}</TableCell>
                  <TableCell>{record.warehouse_id}</TableCell>
                  <TableCell>{record.delivery_batch_id}</TableCell>
                  <TableCell>{record.transporter_id || "N/A"}</TableCell>
                  <TableCell>{record.packages?.length || 0}</TableCell>
                  <TableCell>
                    <Badge variant={statusVariant(record.status)}>{record.status}</Badge>
                  </TableCell>
                  <TableCell>{formatDate(record.confirmed_at)}</TableCell>
                  <TableCell className="text-right space-x-2">
                    {(record.status === "confirmado" ||
                      record.status === "confirmado_con_incidente" ||
                      record.status === "rechazado") && (
                      <Button asChild size="sm" variant="outline">
                        <a
                          href={`/api/delivery/evidence/${record.id}`}
                          target="_blank"
                          rel="noreferrer noopener"
                        >
                          Evidencia PDF
                        </a>
                      </Button>
                    )}
                    {record.status === "confirmado_con_incidente" && (
                      <Button asChild size="sm">
                        <Link href="/admin/pqrs">Ver PQRS</Link>
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
