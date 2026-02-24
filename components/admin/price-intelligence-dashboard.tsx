"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { AlertTriangle, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import type { PriceIntelligenceReviewStatus } from "@/lib/price-intelligence/types"

interface PriceIntelligenceRun {
  id: string
  status: "processing" | "completed" | "completed_with_errors" | "failed"
  trigger_source: "manual" | "cron"
  started_at: string
  completed_at: string | null
  total_products: number
  processed_products: number
  findings_count: number
  significant_findings_count: number
  errors_count: number
  model: string
  config?: {
    threshold_percent?: number
    max_products?: number
    dry_run?: boolean
  } | null
  summary?: {
    threshold_percent?: number
    critical_threshold_percent?: number
    competitors?: Array<{ name: string; count: number }>
    source_domains?: Array<{ name: string; count: number }>
    critical_findings_count?: number
    notifications?: {
      email_sent?: boolean
      email_recipients?: number
      email_error?: string | null
      slack_sent?: boolean
      slack_error?: string | null
    }
  } | null
}

interface PriceIntelligenceFinding {
  id: string
  product_code: string
  product_name: string
  mesanova_price: number
  competitor_name: string
  competitor_product_name: string | null
  competitor_price: number
  price_gap_amount: number
  price_gap_percent: number | null
  difference_direction: "mesanova_mas_caro" | "mesanova_mas_barato" | "similar"
  confidence: number | null
  source_url: string | null
  source_domain: string | null
  recommendation: string | null
  analysis_notes: string | null
  is_critical?: boolean
  review_status?: PriceIntelligenceReviewStatus
  review_notes?: string | null
}

interface SnapshotResponse {
  tableMissing: boolean
  runs: PriceIntelligenceRun[]
  selectedRunId: string | null
  findings: PriceIntelligenceFinding[]
  errorMessage?: string
}

type ReviewDraft = {
  status: PriceIntelligenceReviewStatus
  notes: string
}

const REVIEW_STATUS_LABELS: Record<PriceIntelligenceReviewStatus, string> = {
  pendiente: "Pendiente",
  en_revision: "En revisión",
  ajustado: "Ajustado",
  descartado: "Descartado",
}

function formatMoney(value: number | null | undefined) {
  const numberValue = Number(value || 0)
  return `$${numberValue.toLocaleString("es-CO")}`
}

function formatPercent(value: number | null | undefined) {
  if (value === null || value === undefined || Number.isNaN(Number(value))) return "N/D"
  return `${Number(value).toLocaleString("es-CO", { minimumFractionDigits: 1, maximumFractionDigits: 1 })}%`
}

function formatDate(value: string | null | undefined) {
  if (!value) return "N/D"
  return new Date(value).toLocaleString("es-CO")
}

function statusLabel(status: PriceIntelligenceRun["status"]) {
  if (status === "completed") return "Completado"
  if (status === "completed_with_errors") return "Completado con errores"
  if (status === "failed") return "Fallido"
  return "Procesando"
}

function statusVariant(status: PriceIntelligenceRun["status"]): "default" | "secondary" | "destructive" | "outline" {
  if (status === "completed") return "default"
  if (status === "completed_with_errors") return "secondary"
  if (status === "failed") return "destructive"
  return "outline"
}

function directionLabel(direction: PriceIntelligenceFinding["difference_direction"]) {
  if (direction === "mesanova_mas_caro") return "Mesanova más caro"
  if (direction === "mesanova_mas_barato") return "Mesanova más barato"
  return "Precio similar"
}

export function PriceIntelligenceDashboard() {
  const [snapshot, setSnapshot] = useState<SnapshotResponse | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isRunning, setIsRunning] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [selectedRunId, setSelectedRunId] = useState<string>("")
  const [maxProducts, setMaxProducts] = useState<string>("")
  const [thresholdPercent, setThresholdPercent] = useState<string>("10")
  const [notifyOnManualRun, setNotifyOnManualRun] = useState(false)
  const [reviewDrafts, setReviewDrafts] = useState<Record<string, ReviewDraft>>({})
  const [savingReviewId, setSavingReviewId] = useState<string | null>(null)

  const loadSnapshot = useCallback(async (runId?: string) => {
    setIsLoading(true)
    setError(null)
    try {
      const url = new URL("/api/admin/price-intelligence/summary", window.location.origin)
      if (runId) url.searchParams.set("run_id", runId)

      const response = await fetch(url.toString(), { method: "GET" })
      const result = await response.json()
      if (!response.ok || !result.success) {
        throw new Error(result.error || "No se pudo cargar el resumen")
      }

      const payload = result as SnapshotResponse & { success: boolean }
      setSnapshot(payload)
      setSelectedRunId(payload.selectedRunId || "")

      const selectedRun = payload.runs.find((run) => run.id === payload.selectedRunId)
      const runThreshold = selectedRun?.summary?.threshold_percent || selectedRun?.config?.threshold_percent
      if (runThreshold && Number.isFinite(Number(runThreshold))) {
        setThresholdPercent(String(runThreshold))
      }

      setReviewDrafts(
        Object.fromEntries(
          (payload.findings || []).map((finding) => [
            finding.id,
            {
              status: (finding.review_status || "pendiente") as PriceIntelligenceReviewStatus,
              notes: finding.review_notes || "",
            },
          ])
        )
      )
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Error desconocido")
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    loadSnapshot().catch(() => undefined)
  }, [loadSnapshot])

  const selectedRun = useMemo(
    () => snapshot?.runs?.find((run) => run.id === selectedRunId) || null,
    [selectedRunId, snapshot?.runs]
  )
  const selectedRunSummary = selectedRun?.summary || null

  const handleRunNow = async () => {
    setIsRunning(true)
    setError(null)
    try {
      const payload: {
        maxProducts?: number
        thresholdPercent?: number
        notify?: boolean
      } = {}

      const parsedLimit = Number(maxProducts)
      if (Number.isFinite(parsedLimit) && parsedLimit > 0) {
        payload.maxProducts = parsedLimit
      }

      const parsedThreshold = Number(thresholdPercent)
      if (Number.isFinite(parsedThreshold) && parsedThreshold > 0) {
        payload.thresholdPercent = parsedThreshold
      }

      payload.notify = notifyOnManualRun

      const response = await fetch("/api/admin/price-intelligence/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })
      const result = await response.json()
      if (!response.ok || !result.success) {
        throw new Error(result.error || "No fue posible ejecutar el análisis")
      }

      await loadSnapshot(result.run?.runId)
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Error desconocido")
    } finally {
      setIsRunning(false)
    }
  }

  const handleRunSelection = async (runId: string) => {
    setSelectedRunId(runId)
    await loadSnapshot(runId)
  }

  const handleReviewDraftChange = (findingId: string, patch: Partial<ReviewDraft>) => {
    setReviewDrafts((previous) => {
      const current = previous[findingId] || { status: "pendiente" as PriceIntelligenceReviewStatus, notes: "" }
      return {
        ...previous,
        [findingId]: { ...current, ...patch },
      }
    })
  }

  const handleSaveReview = async (findingId: string) => {
    const draft = reviewDrafts[findingId]
    if (!draft) return

    setSavingReviewId(findingId)
    setError(null)
    try {
      const response = await fetch(`/api/admin/price-intelligence/findings/${findingId}/review`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reviewStatus: draft.status,
          reviewNotes: draft.notes,
        }),
      })
      const result = await response.json()
      if (!response.ok || !result.success) {
        throw new Error(result.error || "No se pudo actualizar la revisión")
      }

      setSnapshot((previous) => {
        if (!previous) return previous
        return {
          ...previous,
          findings: previous.findings.map((finding) =>
            finding.id === findingId
              ? {
                  ...finding,
                  review_status: draft.status,
                  review_notes: draft.notes || null,
                }
              : finding
          ),
        }
      })
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Error desconocido")
    } finally {
      setSavingReviewId(null)
    }
  }

  if (isLoading && !snapshot) {
    return <p className="text-sm text-muted-foreground">Cargando inteligencia de precios...</p>
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="space-y-3">
          <CardTitle className="text-xl">Inteligencia de Precios con IA</CardTitle>
          <CardDescription>
            Investigación automática diaria del mercado colombiano con Gemini para detectar diferencias relevantes frente a
            competidores de Alumar.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-3 md:grid-cols-[2fr_auto_auto]">
            <div className="grid gap-3 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="maxProducts">Máximo de productos (opcional)</Label>
                <Input
                  id="maxProducts"
                  value={maxProducts}
                  onChange={(event) => setMaxProducts(event.target.value)}
                  placeholder="Ej: 300"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="thresholdPercent">Umbral relevante (%)</Label>
                <Input
                  id="thresholdPercent"
                  value={thresholdPercent}
                  onChange={(event) => setThresholdPercent(event.target.value)}
                  placeholder="Ej: 10"
                />
              </div>
              <div className="col-span-full flex items-center gap-2">
                <Checkbox
                  id="notifyOnManualRun"
                  checked={notifyOnManualRun}
                  onCheckedChange={(checked) => setNotifyOnManualRun(Boolean(checked))}
                />
                <Label htmlFor="notifyOnManualRun" className="text-sm font-normal">
                  Enviar notificación al equipo en esta ejecución manual
                </Label>
              </div>
            </div>

            <Button variant="outline" onClick={() => loadSnapshot(selectedRunId || undefined)} disabled={isLoading}>
              <RefreshCw className="mr-2 h-4 w-4" />
              Recargar
            </Button>
            <Button onClick={handleRunNow} disabled={isRunning}>
              {isRunning ? "Ejecutando..." : "Ejecutar análisis ahora"}
            </Button>
          </div>

          {error && (
            <div className="rounded-md border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
              {error}
            </div>
          )}

          {snapshot?.tableMissing && (
            <div className="rounded-md border border-yellow-300 bg-yellow-50 p-3 text-sm text-yellow-900">
              <div className="flex items-start gap-2">
                <AlertTriangle className="mt-0.5 h-4 w-4" />
                <div>
                  <p className="font-medium">Módulo pendiente de base de datos</p>
                  <p>{snapshot.errorMessage || "Ejecuta el script SQL de inteligencia de precios para habilitar reportes."}</p>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {!snapshot?.tableMissing && (
        <>
          <div className="grid gap-4 md:grid-cols-4">
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Última ejecución</CardDescription>
                <CardTitle className="text-sm">{selectedRun ? formatDate(selectedRun.started_at) : "Sin datos"}</CardTitle>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Productos analizados</CardDescription>
                <CardTitle>{selectedRun ? selectedRun.processed_products : 0}</CardTitle>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Hallazgos relevantes</CardDescription>
                <CardTitle>{selectedRun ? selectedRun.significant_findings_count : 0}</CardTitle>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Estado</CardDescription>
                <div>
                  {selectedRun ? <Badge variant={statusVariant(selectedRun.status)}>{statusLabel(selectedRun.status)}</Badge> : "Sin datos"}
                </div>
              </CardHeader>
            </Card>
          </div>

          <Card>
            <CardHeader className="space-y-3">
              <CardTitle className="text-lg">Reporte de diferencias relevantes</CardTitle>
              <div className="grid gap-3 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="runSelector">Ejecución</Label>
                  <Select value={selectedRunId} onValueChange={handleRunSelection}>
                    <SelectTrigger id="runSelector">
                      <SelectValue placeholder="Selecciona ejecución" />
                    </SelectTrigger>
                    <SelectContent>
                      {(snapshot?.runs || []).map((run) => (
                        <SelectItem key={run.id} value={run.id}>
                          {new Date(run.started_at).toLocaleString("es-CO")} - {statusLabel(run.status)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="text-sm text-muted-foreground">
                  <p>Origen: {selectedRun?.trigger_source === "cron" ? "Programado (cron)" : "Manual"}</p>
                  <p>Modelo: {selectedRun?.model || "N/D"}</p>
                  <p>Finalizado: {formatDate(selectedRun?.completed_at || null)}</p>
                  <p>
                    Umbral relevante:{" "}
                    {selectedRunSummary?.threshold_percent
                      ? `${selectedRunSummary.threshold_percent}%`
                      : `${thresholdPercent || "10"}%`}
                  </p>
                  <p>
                    Umbral crítico:{" "}
                    {selectedRunSummary?.critical_threshold_percent ? `${selectedRunSummary.critical_threshold_percent}%` : "20%"}
                  </p>
                  {selectedRunSummary?.notifications && (
                    <p>
                      Notificaciones: email{" "}
                      {selectedRunSummary.notifications.email_sent ? "enviado" : "no enviado"} / slack{" "}
                      {selectedRunSummary.notifications.slack_sent ? "enviado" : "no enviado"}
                    </p>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="mb-6 grid gap-4 md:grid-cols-2">
                <div>
                  <p className="mb-2 text-sm font-medium">Competidores detectados por IA</p>
                  <div className="flex flex-wrap gap-2">
                    {(selectedRunSummary?.competitors || []).slice(0, 12).map((item) => (
                      <Badge key={`${item.name}-${item.count}`} variant="secondary">
                        {item.name} ({item.count})
                      </Badge>
                    ))}
                    {(selectedRunSummary?.competitors || []).length === 0 && (
                      <span className="text-xs text-muted-foreground">Sin datos en esta ejecución</span>
                    )}
                  </div>
                </div>
                <div>
                  <p className="mb-2 text-sm font-medium">Dominios fuente del reporte diario</p>
                  <div className="flex flex-wrap gap-2">
                    {(selectedRunSummary?.source_domains || []).slice(0, 12).map((item) => (
                      <Badge key={`${item.name}-${item.count}`} variant="outline">
                        {item.name} ({item.count})
                      </Badge>
                    ))}
                    {(selectedRunSummary?.source_domains || []).length === 0 && (
                      <span className="text-xs text-muted-foreground">Sin datos en esta ejecución</span>
                    )}
                  </div>
                </div>
              </div>

              {(snapshot?.findings || []).length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No hay hallazgos relevantes en esta ejecución. Ajusta el umbral o ejecuta un nuevo análisis.
                </p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Producto</TableHead>
                      <TableHead>Mesanova</TableHead>
                      <TableHead>Competidor</TableHead>
                      <TableHead>Precio competidor</TableHead>
                      <TableHead>Diferencia</TableHead>
                      <TableHead>Fuente</TableHead>
                      <TableHead>Recomendación</TableHead>
                      <TableHead>Revisión Comercial</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {snapshot?.findings.map((finding) => (
                      <TableRow key={finding.id}>
                        <TableCell>
                          <p className="font-medium">{finding.product_name}</p>
                          <p className="text-xs text-muted-foreground">SKU: {finding.product_code}</p>
                          {finding.is_critical && (
                            <Badge variant="destructive" className="mt-1 text-[10px]">
                              Crítico
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell>{formatMoney(finding.mesanova_price)}</TableCell>
                        <TableCell>
                          <p>{finding.competitor_name}</p>
                          {finding.competitor_product_name && (
                            <p className="text-xs text-muted-foreground">{finding.competitor_product_name}</p>
                          )}
                        </TableCell>
                        <TableCell>{formatMoney(finding.competitor_price)}</TableCell>
                        <TableCell>
                          <p className="font-medium">{formatPercent(finding.price_gap_percent)}</p>
                          <p className="text-xs text-muted-foreground">
                            {directionLabel(finding.difference_direction)} ({formatMoney(finding.price_gap_amount)})
                          </p>
                        </TableCell>
                        <TableCell>
                          {finding.source_url ? (
                            <a
                              href={finding.source_url}
                              target="_blank"
                              rel="noreferrer"
                              className="text-sm text-primary underline-offset-2 hover:underline"
                            >
                              {finding.source_domain || "Ver fuente"}
                            </a>
                          ) : (
                            <span className="text-xs text-muted-foreground">Sin URL</span>
                          )}
                        </TableCell>
                        <TableCell className="max-w-xs text-sm text-muted-foreground">
                          {finding.recommendation || finding.analysis_notes || "Sin recomendación"}
                        </TableCell>
                        <TableCell className="min-w-[260px]">
                          <div className="space-y-2">
                            <Select
                              value={reviewDrafts[finding.id]?.status || finding.review_status || "pendiente"}
                              onValueChange={(value) =>
                                handleReviewDraftChange(finding.id, { status: value as PriceIntelligenceReviewStatus })
                              }
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Estado de revisión" />
                              </SelectTrigger>
                              <SelectContent>
                                {Object.entries(REVIEW_STATUS_LABELS).map(([status, label]) => (
                                  <SelectItem key={status} value={status}>
                                    {label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <Input
                              value={reviewDrafts[finding.id]?.notes || ""}
                              onChange={(event) => handleReviewDraftChange(finding.id, { notes: event.target.value })}
                              placeholder="Nota interna (opcional)"
                            />
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleSaveReview(finding.id)}
                              disabled={savingReviewId === finding.id}
                            >
                              {savingReviewId === finding.id ? "Guardando..." : "Guardar revisión"}
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  )
}
