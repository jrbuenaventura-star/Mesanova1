export type PriceIntelligenceRunStatus = "processing" | "completed" | "completed_with_errors" | "failed"
export type PriceIntelligenceTriggerSource = "manual" | "cron"
export type PriceDifferenceDirection = "mesanova_mas_caro" | "mesanova_mas_barato" | "similar"
export type PriceIntelligenceReviewStatus = "pendiente" | "en_revision" | "ajustado" | "descartado"

export interface PriceIntelligenceProduct {
  id: string
  pdt_codigo: string
  nombre_comercial: string | null
  pdt_descripcion: string | null
  marca: string | null
  precio: number | null
}

export interface GeminiPriceObservation {
  competitor_name: string
  competitor_product_name?: string
  competitor_price_cop: number
  source_url?: string
  source_name?: string
  confidence?: number
  recommendation?: string
  notes?: string
}

export interface GeminiResearchResult {
  analysis_summary?: string
  observations: GeminiPriceObservation[]
  raw_text: string
}

export interface PriceIntelSummaryTopItem {
  name: string
  count: number
}

export interface PriceIntelligenceRunSummaryJson {
  errors: string[]
  threshold_percent: number
  critical_threshold_percent: number
  findings_rate: number
  competitors: PriceIntelSummaryTopItem[]
  source_domains: PriceIntelSummaryTopItem[]
  critical_findings_count: number
}

export interface PriceIntelligenceRunSummary {
  runId: string
  status: PriceIntelligenceRunStatus
  totalProducts: number
  processedProducts: number
  findingsCount: number
  significantFindingsCount: number
  errorsCount: number
  triggerSource: PriceIntelligenceTriggerSource
  startedAt: string
  completedAt: string | null
  message?: string
}
