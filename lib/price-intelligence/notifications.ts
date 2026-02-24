import "server-only"

import { Resend } from "resend"
import { createAdminClient } from "@/lib/supabase/admin"
import type { PriceIntelligenceTriggerSource } from "@/lib/price-intelligence/types"

interface PriceIntelNotificationPayload {
  runId: string
  status: string
  triggerSource: PriceIntelligenceTriggerSource
  processedProducts: number
  findingsCount: number
  significantFindingsCount: number
  criticalFindingsCount: number
  errorsCount: number
  thresholdPercent: number
  criticalThresholdPercent: number
  competitors: Array<{ name: string; count: number }>
  sourceDomains: Array<{ name: string; count: number }>
  topCriticalFindings: Array<{
    productCode: string
    productName: string
    competitorName: string
    gapPercent: number | null
    sourceDomain: string | null
    recommendation: string | null
  }>
}

function normalizeEmail(value: string | null | undefined): string | null {
  if (!value) return null
  const normalized = value.trim().toLowerCase()
  if (!normalized) return null
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(normalized) ? normalized : null
}

function formatPercent(value: number | null | undefined): string {
  if (value === null || value === undefined || Number.isNaN(Number(value))) return "N/D"
  return `${Number(value).toLocaleString("es-CO", { minimumFractionDigits: 1, maximumFractionDigits: 1 })}%`
}

async function getSuperadminEmails(): Promise<string[]> {
  const admin = createAdminClient()
  const { data: profiles, error: profileError } = await admin
    .from("user_profiles")
    .select("id")
    .eq("role", "superadmin")

  if (profileError) {
    throw new Error(`No se pudo cargar superadmins: ${profileError.message}`)
  }

  const superadminIds = new Set((profiles || []).map((profile: any) => String(profile.id)))
  if (superadminIds.size === 0) return []

  const emails = new Set<string>()
  let page = 1
  const perPage = 200

  while (true) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage })
    if (error) {
      throw new Error(`No se pudo listar usuarios auth: ${error.message}`)
    }

    const users = data?.users || []
    for (const user of users) {
      if (superadminIds.has(user.id)) {
        const email = normalizeEmail(user.email)
        if (email) emails.add(email)
      }
    }

    if (users.length < perPage) break
    page += 1
  }

  return Array.from(emails)
}

function resolveRecipients(): Promise<string[]> {
  const configured = (process.env.PRICE_INTEL_REPORT_TO || "")
    .split(",")
    .map((value) => normalizeEmail(value))
    .filter(Boolean) as string[]

  if (configured.length > 0) {
    return Promise.resolve(Array.from(new Set(configured)))
  }

  return getSuperadminEmails()
}

function buildReportSubject(payload: PriceIntelNotificationPayload) {
  const trigger = payload.triggerSource === "cron" ? "Diario" : "Manual"
  return `[Mesanova] Reporte ${trigger} de Inteligencia de Precios (${payload.significantFindingsCount} hallazgos relevantes)`
}

function buildReportHtml(payload: PriceIntelNotificationPayload, reportUrl: string) {
  const domains = payload.sourceDomains
    .slice(0, 20)
    .map((domain) => `<li>${domain.name} (${domain.count})</li>`)
    .join("")

  const competitors = payload.competitors
    .slice(0, 20)
    .map((item) => `<li>${item.name} (${item.count})</li>`)
    .join("")

  const critical = payload.topCriticalFindings
    .slice(0, 15)
    .map(
      (finding) =>
        `<tr>
          <td style="padding:8px;border:1px solid #ddd;">${finding.productCode}</td>
          <td style="padding:8px;border:1px solid #ddd;">${finding.productName}</td>
          <td style="padding:8px;border:1px solid #ddd;">${finding.competitorName}</td>
          <td style="padding:8px;border:1px solid #ddd;">${formatPercent(finding.gapPercent)}</td>
          <td style="padding:8px;border:1px solid #ddd;">${finding.sourceDomain || "N/D"}</td>
          <td style="padding:8px;border:1px solid #ddd;">${finding.recommendation || "N/D"}</td>
        </tr>`
    )
    .join("")

  return `
    <h2>Reporte de Inteligencia de Precios</h2>
    <p><strong>Ejecución:</strong> ${payload.runId}</p>
    <p><strong>Origen:</strong> ${payload.triggerSource}</p>
    <p><strong>Estado:</strong> ${payload.status}</p>
    <p><strong>Productos analizados:</strong> ${payload.processedProducts}</p>
    <p><strong>Hallazgos:</strong> ${payload.findingsCount} total, ${payload.significantFindingsCount} relevantes, ${payload.criticalFindingsCount} críticos</p>
    <p><strong>Errores:</strong> ${payload.errorsCount}</p>
    <p><strong>Umbrales:</strong> relevante >= ${payload.thresholdPercent}% | crítico >= ${payload.criticalThresholdPercent}%</p>
    <h3>Competidores detectados por IA</h3>
    <ul>${competitors || "<li>Sin datos</li>"}</ul>
    <h3>Dominios fuente detectados</h3>
    <ul>${domains || "<li>Sin datos</li>"}</ul>
    <h3>Top hallazgos críticos</h3>
    <table style="border-collapse:collapse;width:100%;font-size:12px;">
      <thead>
        <tr>
          <th style="padding:8px;border:1px solid #ddd;text-align:left;">SKU</th>
          <th style="padding:8px;border:1px solid #ddd;text-align:left;">Producto</th>
          <th style="padding:8px;border:1px solid #ddd;text-align:left;">Competidor</th>
          <th style="padding:8px;border:1px solid #ddd;text-align:left;">Brecha</th>
          <th style="padding:8px;border:1px solid #ddd;text-align:left;">Dominio</th>
          <th style="padding:8px;border:1px solid #ddd;text-align:left;">Recomendación</th>
        </tr>
      </thead>
      <tbody>${critical || `<tr><td colspan="6" style="padding:8px;border:1px solid #ddd;">Sin hallazgos críticos</td></tr>`}</tbody>
    </table>
    <p style="margin-top:16px;"><a href="${reportUrl}" target="_blank" rel="noreferrer">Abrir tablero de inteligencia de precios</a></p>
  `
}

function buildSlackText(payload: PriceIntelNotificationPayload, reportUrl: string) {
  const topDomains = payload.sourceDomains.slice(0, 8).map((item) => `${item.name} (${item.count})`).join(", ")
  const topCompetitors = payload.competitors.slice(0, 8).map((item) => `${item.name} (${item.count})`).join(", ")
  return [
    `*Reporte IA Precios* (${payload.triggerSource})`,
    `Run: ${payload.runId}`,
    `Estado: ${payload.status}`,
    `Analizados: ${payload.processedProducts}`,
    `Hallazgos: ${payload.findingsCount} | Relevantes: ${payload.significantFindingsCount} | Críticos: ${payload.criticalFindingsCount}`,
    `Umbral relevante: ${payload.thresholdPercent}% | Umbral crítico: ${payload.criticalThresholdPercent}%`,
    `Competidores IA: ${topCompetitors || "sin datos"}`,
    `Dominios fuente: ${topDomains || "sin datos"}`,
    `Reporte: ${reportUrl}`,
  ].join("\n")
}

export async function sendPriceIntelligenceNotifications(payload: PriceIntelNotificationPayload) {
  const reportUrl = `${process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"}/admin/productos?tab=analisis-precios-ia`
  const result = {
    email: { sent: false, recipients: 0, error: null as string | null },
    slack: { sent: false, error: null as string | null },
  }

  try {
    const webhook = process.env.PRICE_INTEL_SLACK_WEBHOOK_URL
    if (webhook) {
      const response = await fetch(webhook, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: buildSlackText(payload, reportUrl) }),
      })
      if (!response.ok) {
        result.slack.error = `Slack webhook status ${response.status}`
      } else {
        result.slack.sent = true
      }
    }
  } catch (error) {
    result.slack.error = error instanceof Error ? error.message : "Error enviando Slack"
  }

  try {
    const apiKey = process.env.RESEND_API_KEY
    const from = process.env.RESEND_FROM
    if (!apiKey || !from) {
      return result
    }

    const recipients = await resolveRecipients()
    if (recipients.length === 0) {
      return result
    }

    const resend = new Resend(apiKey)
    const subject = buildReportSubject(payload)
    const html = buildReportHtml(payload, reportUrl)

    await resend.emails.send({
      from,
      to: recipients,
      subject,
      html,
    })

    result.email.sent = true
    result.email.recipients = recipients.length
  } catch (error) {
    result.email.error = error instanceof Error ? error.message : "Error enviando correo"
  }

  return result
}

