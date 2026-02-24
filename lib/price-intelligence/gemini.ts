import "server-only"

import type { GeminiPriceObservation, GeminiResearchResult, PriceIntelligenceProduct } from "@/lib/price-intelligence/types"

const DEFAULT_GEMINI_MODEL = process.env.GEMINI_PRICE_INTEL_MODEL || "gemini-2.0-flash"
const GEMINI_ENDPOINT_BASE = "https://generativelanguage.googleapis.com/v1beta/models"

interface GeminiCandidatePart {
  text?: string
}

interface GeminiResponse {
  candidates?: Array<{
    content?: {
      parts?: GeminiCandidatePart[]
    }
  }>
}

function getGeminiApiKey() {
  const key = process.env.GEMINI_API_KEY
  if (!key) {
    throw new Error("Falta GEMINI_API_KEY para ejecutar inteligencia de precios")
  }
  return key
}

function extractCandidateText(payload: GeminiResponse): string {
  const parts = payload.candidates?.[0]?.content?.parts || []
  const text = parts.map((part) => part.text || "").join("\n").trim()
  if (!text) {
    throw new Error("Gemini no devolvió contenido utilizable")
  }
  return text
}

function extractJsonBlock(text: string): string {
  const fencedMatch = text.match(/```json\s*([\s\S]*?)\s*```/i)
  if (fencedMatch?.[1]) return fencedMatch[1]

  const fencedGenericMatch = text.match(/```\s*([\s\S]*?)\s*```/)
  if (fencedGenericMatch?.[1]) return fencedGenericMatch[1]

  const firstBrace = text.indexOf("{")
  const lastBrace = text.lastIndexOf("}")
  if (firstBrace >= 0 && lastBrace > firstBrace) {
    return text.slice(firstBrace, lastBrace + 1)
  }

  throw new Error("No se encontró un bloque JSON en la respuesta de Gemini")
}

function clampConfidence(value: unknown): number | undefined {
  const num = Number(value)
  if (!Number.isFinite(num)) return undefined
  if (num <= 0) return 0
  if (num >= 1) return 1
  return Math.round(num * 1000) / 1000
}

function normalizeObservation(raw: any): GeminiPriceObservation | null {
  const competitorName = typeof raw?.competitor_name === "string" ? raw.competitor_name.trim() : ""
  const competitorPrice = Number(raw?.competitor_price_cop)
  if (!competitorName || !Number.isFinite(competitorPrice) || competitorPrice <= 0) {
    return null
  }

  return {
    competitor_name: competitorName,
    competitor_product_name:
      typeof raw?.competitor_product_name === "string" ? raw.competitor_product_name.trim() || undefined : undefined,
    competitor_price_cop: Math.round(competitorPrice),
    source_url: typeof raw?.source_url === "string" ? raw.source_url.trim() || undefined : undefined,
    source_name: typeof raw?.source_name === "string" ? raw.source_name.trim() || undefined : undefined,
    confidence: clampConfidence(raw?.confidence),
    recommendation: typeof raw?.recommendation === "string" ? raw.recommendation.trim() || undefined : undefined,
    notes: typeof raw?.notes === "string" ? raw.notes.trim() || undefined : undefined,
  }
}

function buildPrompt(product: PriceIntelligenceProduct) {
  const productName = product.nombre_comercial || product.pdt_descripcion || product.pdt_codigo
  return [
    "Eres analista senior de precios para retail B2B/B2C en Colombia.",
    "Objetivo: encontrar precios de mercado para el mismo producto o equivalente altamente comparable.",
    "Contexto competitivo: prioriza competidores relevantes de Alumar en Colombia.",
    "Instrucciones:",
    "1) Busca precios en COP de fuentes colombianas confiables (e-commerce, marketplaces, distribuidores, retail especializado).",
    "2) Reporta maximo 5 observaciones con precio, competidor y URL fuente.",
    "3) Excluye fuentes sin precio visible o sin relación clara con el producto.",
    "4) Si no hay evidencia suficiente, devuelve observations vacio.",
    "",
    "Producto Mesanova:",
    `- Codigo: ${product.pdt_codigo}`,
    `- Nombre: ${productName}`,
    `- Marca: ${product.marca || "N/D"}`,
    `- Precio Mesanova (COP): ${Math.round(product.precio || 0)}`,
    "",
    "Responde SOLO JSON válido con esta forma:",
    '{',
    '  "analysis_summary": "texto breve",',
    '  "observations": [',
    "    {",
    '      "competitor_name": "string",',
    '      "competitor_product_name": "string",',
    '      "competitor_price_cop": 12345,',
    '      "source_url": "https://...",',
    '      "source_name": "string",',
    '      "confidence": 0.0,',
    '      "recommendation": "string",',
    '      "notes": "string"',
    "    }",
    "  ]",
    "}",
  ].join("\n")
}

export async function researchProductWithGemini(
  product: PriceIntelligenceProduct,
  options?: { model?: string }
): Promise<GeminiResearchResult> {
  const model = options?.model || DEFAULT_GEMINI_MODEL
  const apiKey = getGeminiApiKey()
  const endpoint = `${GEMINI_ENDPOINT_BASE}/${model}:generateContent?key=${apiKey}`
  const baseBody = {
    generationConfig: {
      temperature: 0.2,
      responseMimeType: "application/json",
    },
    contents: [
      {
        role: "user",
        parts: [{ text: buildPrompt(product) }],
      },
    ],
  }

  let response = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      ...baseBody,
      tools: [{ google_search: {} }],
    }),
  })

  if (!response.ok && response.status === 400) {
    response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(baseBody),
    })
  }

  if (!response.ok) {
    const message = await response.text()
    throw new Error(`Gemini API error (${response.status}): ${message}`)
  }

  const payload = (await response.json()) as GeminiResponse
  const rawText = extractCandidateText(payload)
  const jsonText = extractJsonBlock(rawText)
  const parsed = JSON.parse(jsonText)
  const observations = Array.isArray(parsed?.observations)
    ? parsed.observations.map(normalizeObservation).filter(Boolean)
    : []

  return {
    analysis_summary: typeof parsed?.analysis_summary === "string" ? parsed.analysis_summary.trim() : undefined,
    observations: observations as GeminiPriceObservation[],
    raw_text: rawText,
  }
}
