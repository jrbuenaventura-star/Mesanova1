import "server-only"

import { createAdminClient } from "@/lib/supabase/admin"
import { researchProductWithGemini } from "@/lib/price-intelligence/gemini"
import { sendPriceIntelligenceNotifications } from "@/lib/price-intelligence/notifications"
import type {
  PriceDifferenceDirection,
  PriceIntelligenceProduct,
  PriceIntelligenceRunSummaryJson,
  PriceIntelligenceRunSummary,
  PriceIntelligenceTriggerSource,
} from "@/lib/price-intelligence/types"

const DEFAULT_MODEL = process.env.GEMINI_PRICE_INTEL_MODEL || "gemini-2.0-flash"
const DEFAULT_THRESHOLD_PERCENT = 10
const DEFAULT_CRITICAL_THRESHOLD_PERCENT = 20
const DEFAULT_MAX_PRODUCTS_PER_RUN = 400
const DEFAULT_FINDINGS_LIMIT = 300

function envNumber(name: string, fallback: number) {
  const raw = process.env[name]
  const parsed = Number(raw)
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback
}

function normalizeText(value: string | null | undefined) {
  return (value || "").trim()
}

function incrementCounter(map: Map<string, number>, key: string | null | undefined) {
  const normalized = normalizeText(key)
  if (!normalized) return
  map.set(normalized, (map.get(normalized) || 0) + 1)
}

function mapToTopList(map: Map<string, number>, limit = 50) {
  return Array.from(map.entries())
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, limit)
}

function extractDomain(value: string | null | undefined): string | null {
  if (!value) return null
  try {
    return new URL(value).hostname.replace(/^www\./, "")
  } catch {
    return null
  }
}

function computeDifferenceDirection(gapAmount: number): PriceDifferenceDirection {
  if (gapAmount > 0) return "mesanova_mas_caro"
  if (gapAmount < 0) return "mesanova_mas_barato"
  return "similar"
}

function isTableMissingError(error: any) {
  return error?.code === "42P01" || /does not exist|relation .* does not exist/i.test(String(error?.message || ""))
}

export interface RunPriceIntelligenceOptions {
  triggerSource: PriceIntelligenceTriggerSource
  requestedBy?: string | null
  dryRun?: boolean
  maxProducts?: number
  thresholdPercent?: number
  criticalThresholdPercent?: number
  notify?: boolean
}

export interface PriceIntelligenceSnapshot {
  tableMissing: boolean
  runs: any[]
  selectedRunId: string | null
  findings: any[]
  errorMessage?: string
}

export async function runPriceIntelligenceAnalysis(options: RunPriceIntelligenceOptions): Promise<PriceIntelligenceRunSummary> {
  const admin = createAdminClient()
  const thresholdPercent =
    options.thresholdPercent && Number.isFinite(options.thresholdPercent) && options.thresholdPercent > 0
      ? options.thresholdPercent
      : envNumber("PRICE_INTEL_SIGNIFICANT_DIFF_PERCENT", DEFAULT_THRESHOLD_PERCENT)
  const criticalThresholdPercent =
    options.criticalThresholdPercent &&
    Number.isFinite(options.criticalThresholdPercent) &&
    options.criticalThresholdPercent > 0
      ? options.criticalThresholdPercent
      : envNumber("PRICE_INTEL_CRITICAL_DIFF_PERCENT", DEFAULT_CRITICAL_THRESHOLD_PERCENT)
  const maxProducts = options.maxProducts || envNumber("PRICE_INTEL_MAX_PRODUCTS_PER_RUN", DEFAULT_MAX_PRODUCTS_PER_RUN)
  const model = DEFAULT_MODEL

  const { data: products, error: productsError } = await admin
    .from("products")
    .select("id, pdt_codigo, nombre_comercial, pdt_descripcion, marca, precio")
    .eq("is_active", true)
    .not("precio", "is", null)
    .gt("precio", 0)
    .order("pdt_descripcion")
    .limit(maxProducts)

  if (productsError) {
    throw new Error(`No se pudo cargar catálogo de productos: ${productsError.message}`)
  }

  const productList = (products || []) as PriceIntelligenceProduct[]
  const runConfig = {
    threshold_percent: thresholdPercent,
    critical_threshold_percent: criticalThresholdPercent,
    max_products: maxProducts,
    dry_run: !!options.dryRun,
  }

  const { data: runRecord, error: runInsertError } = await admin
    .from("price_intelligence_runs")
    .insert({
      status: "processing",
      trigger_source: options.triggerSource,
      requested_by: options.requestedBy || null,
      model,
      total_products: productList.length,
      config: runConfig,
      started_at: new Date().toISOString(),
    })
    .select("id, status, started_at")
    .single()

  if (runInsertError) {
    if (isTableMissingError(runInsertError)) {
      throw new Error("Faltan tablas de inteligencia de precios. Ejecuta scripts/024_create_price_intelligence_tables.sql")
    }
    throw new Error(`No se pudo crear la ejecución: ${runInsertError.message}`)
  }

  const runId = runRecord.id as string
  let processedProducts = 0
  let findingsCount = 0
  let significantFindingsCount = 0
  let criticalFindingsCount = 0
  let errorsCount = 0
  const errors: string[] = []
  const competitorCounters = new Map<string, number>()
  const sourceDomainCounters = new Map<string, number>()
  const topCriticalFindings: Array<{
    productCode: string
    productName: string
    competitorName: string
    gapPercent: number | null
    sourceDomain: string | null
    recommendation: string | null
  }> = []

  for (const product of productList) {
    try {
      const mesanovaPrice = Number(product.precio || 0)
      const research = await researchProductWithGemini(product, { model })

      const findings = research.observations
        .map((observation) => {
          const competitorPrice = Number(observation.competitor_price_cop || 0)
          if (!Number.isFinite(competitorPrice) || competitorPrice <= 0) return null

          const gapAmount = mesanovaPrice - competitorPrice
          const gapPercent = competitorPrice > 0 ? (gapAmount / competitorPrice) * 100 : null
          const absGapPercent = gapPercent === null ? 0 : Math.abs(gapPercent)
          const significant = gapPercent !== null && Math.abs(gapPercent) >= thresholdPercent
          const critical = gapPercent !== null && absGapPercent >= criticalThresholdPercent
          const sourceDomain = extractDomain(observation.source_url)
          const competitorName = normalizeText(observation.competitor_name)

          incrementCounter(competitorCounters, competitorName)
          incrementCounter(sourceDomainCounters, sourceDomain)

          if (critical) {
            topCriticalFindings.push({
              productCode: product.pdt_codigo,
              productName:
                normalizeText(product.nombre_comercial) || normalizeText(product.pdt_descripcion) || product.pdt_codigo,
              competitorName,
              gapPercent: gapPercent === null ? null : Math.round(gapPercent * 100) / 100,
              sourceDomain,
              recommendation: observation.recommendation || null,
            })
          }

          return {
            run_id: runId,
            product_id: product.id,
            product_code: product.pdt_codigo,
            product_name: normalizeText(product.nombre_comercial) || normalizeText(product.pdt_descripcion) || product.pdt_codigo,
            mesanova_price: Math.round(mesanovaPrice),
            competitor_name: competitorName,
            competitor_product_name: normalizeText(observation.competitor_product_name) || null,
            competitor_price: Math.round(competitorPrice),
            price_gap_amount: Math.round(gapAmount),
            price_gap_percent: gapPercent === null ? null : Math.round(gapPercent * 100) / 100,
            difference_direction: computeDifferenceDirection(gapAmount),
            is_significant: significant,
            is_critical: critical,
            confidence: observation.confidence ?? null,
            source_url: observation.source_url || null,
            source_domain: sourceDomain,
            source_name: observation.source_name || null,
            recommendation: observation.recommendation || null,
            analysis_notes: observation.notes || research.analysis_summary || null,
            raw_json: {
              observation,
              analysis_summary: research.analysis_summary || null,
              raw_text: research.raw_text,
            },
          }
        })
        .filter(Boolean) as Record<string, unknown>[]

      if (findings.length > 0 && !options.dryRun) {
        const { error: findingsInsertError } = await admin.from("price_intelligence_findings").insert(findings)
        if (findingsInsertError) {
          throw new Error(`Error guardando hallazgos: ${findingsInsertError.message}`)
        }
      }

      findingsCount += findings.length
      significantFindingsCount += findings.filter((item) => item.is_significant === true).length
      criticalFindingsCount += findings.filter((item) => item.is_critical === true).length
      processedProducts += 1
    } catch (error) {
      processedProducts += 1
      errorsCount += 1
      if (errors.length < 25) {
        errors.push(`${product.pdt_codigo}: ${error instanceof Error ? error.message : "Error desconocido"}`)
      }
    }
  }

  const completedAt = new Date().toISOString()
  const status =
    errorsCount === 0 ? "completed" : processedProducts > 0 ? "completed_with_errors" : "failed"

  const summary: PriceIntelligenceRunSummaryJson & {
    notifications?: {
      email_sent: boolean
      email_recipients: number
      email_error: string | null
      slack_sent: boolean
      slack_error: string | null
    }
  } = {
    errors,
    threshold_percent: thresholdPercent,
    critical_threshold_percent: criticalThresholdPercent,
    findings_rate: processedProducts > 0 ? Number((findingsCount / processedProducts).toFixed(4)) : 0,
    competitors: mapToTopList(competitorCounters, 100),
    source_domains: mapToTopList(sourceDomainCounters, 100),
    critical_findings_count: criticalFindingsCount,
  }

  if (options.notify) {
    const notificationResult = await sendPriceIntelligenceNotifications({
      runId,
      status,
      triggerSource: options.triggerSource,
      processedProducts,
      findingsCount,
      significantFindingsCount,
      criticalFindingsCount,
      errorsCount,
      thresholdPercent,
      criticalThresholdPercent,
      competitors: summary.competitors,
      sourceDomains: summary.source_domains,
      topCriticalFindings: topCriticalFindings
        .sort((a, b) => Math.abs(Number(b.gapPercent || 0)) - Math.abs(Number(a.gapPercent || 0)))
        .slice(0, 20),
    })

    summary.notifications = {
      email_sent: notificationResult.email.sent,
      email_recipients: notificationResult.email.recipients,
      email_error: notificationResult.email.error,
      slack_sent: notificationResult.slack.sent,
      slack_error: notificationResult.slack.error,
    }
  }

  const { error: updateRunError } = await admin
    .from("price_intelligence_runs")
    .update({
      status,
      processed_products: processedProducts,
      findings_count: findingsCount,
      significant_findings_count: significantFindingsCount,
      errors_count: errorsCount,
      summary,
      error_message: errors.length > 0 ? errors.join(" | ") : null,
      completed_at: completedAt,
    })
    .eq("id", runId)

  if (updateRunError) {
    throw new Error(`No se pudo cerrar la ejecución: ${updateRunError.message}`)
  }

  return {
    runId,
    status,
    totalProducts: productList.length,
    processedProducts,
    findingsCount,
    significantFindingsCount,
    errorsCount,
    triggerSource: options.triggerSource,
    startedAt: runRecord.started_at as string,
    completedAt,
    message:
      errorsCount > 0
        ? `Análisis completado con ${errorsCount} errores. Revisa el detalle en el historial.`
        : "Análisis completado correctamente.",
  }
}

export async function updatePriceIntelligenceFindingReview(input: {
  findingId: string
  reviewStatus: "pendiente" | "en_revision" | "ajustado" | "descartado"
  reviewNotes?: string | null
  reviewerId: string
}) {
  const admin = createAdminClient()
  const { data, error } = await admin
    .from("price_intelligence_findings")
    .update({
      review_status: input.reviewStatus,
      review_notes: input.reviewNotes || null,
      reviewed_by: input.reviewerId,
      reviewed_at: new Date().toISOString(),
    })
    .eq("id", input.findingId)
    .select("*")
    .single()

  if (error) {
    throw new Error(`No se pudo actualizar la revisión del hallazgo: ${error.message}`)
  }

  return data
}

export async function getPriceIntelligenceSnapshot(args?: {
  runId?: string | null
  runsLimit?: number
  findingsLimit?: number
}): Promise<PriceIntelligenceSnapshot> {
  const admin = createAdminClient()
  const runsLimit = args?.runsLimit || 20
  const findingsLimit = args?.findingsLimit || DEFAULT_FINDINGS_LIMIT

  const { data: runs, error: runsError } = await admin
    .from("price_intelligence_runs")
    .select("*")
    .order("started_at", { ascending: false })
    .limit(runsLimit)

  if (runsError) {
    if (isTableMissingError(runsError)) {
      return {
        tableMissing: true,
        runs: [],
        selectedRunId: null,
        findings: [],
        errorMessage: "Faltan tablas de inteligencia de precios. Ejecuta scripts/024_create_price_intelligence_tables.sql",
      }
    }
    throw new Error(`No se pudo cargar ejecuciones: ${runsError.message}`)
  }

  const runList = runs || []
  const selectedRunId =
    args?.runId && runList.some((run: any) => run.id === args.runId) ? args.runId : runList[0]?.id || null

  if (!selectedRunId) {
    return {
      tableMissing: false,
      runs: runList,
      selectedRunId: null,
      findings: [],
    }
  }

  const { data: findings, error: findingsError } = await admin
    .from("price_intelligence_findings")
    .select("*")
    .eq("run_id", selectedRunId)
    .eq("is_significant", true)
    .order("created_at", { ascending: false })
    .limit(findingsLimit)

  if (findingsError) {
    throw new Error(`No se pudieron cargar hallazgos: ${findingsError.message}`)
  }

  const sortedFindings = [...(findings || [])].sort((a: any, b: any) => {
    const gapA = Math.abs(Number(a.price_gap_percent || 0))
    const gapB = Math.abs(Number(b.price_gap_percent || 0))
    return gapB - gapA
  })

  return {
    tableMissing: false,
    runs: runList,
    selectedRunId,
    findings: sortedFindings,
  }
}
