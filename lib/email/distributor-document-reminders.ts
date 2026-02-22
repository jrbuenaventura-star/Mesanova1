import type { DistributorDocumentReminder, DistributorDocumentReminderItem } from "@/lib/distributor-documents"

const DOCUMENT_STATUS_LABELS: Record<string, string> = {
  due_soon: "Vence pronto",
  expired: "Vencido",
  missing: "Faltante",
  rejected: "Rechazado",
  pending: "Pendiente revisión",
  ok: "Al día",
}

function formatDate(value: string | null): string {
  if (!value) return "Sin fecha"
  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) return "Sin fecha"
  return parsed.toLocaleDateString("es-CO")
}

function buildDocumentUploadUrl(profileUrl: string, documentType: string): string {
  const baseUrl = profileUrl.split("#")[0]
  return `${baseUrl}#doc-card-${documentType}`
}

function buildReminderRows(items: DistributorDocumentReminderItem[], profileUrl: string): string {
  return items
    .map((item) => {
      const statusLabel = DOCUMENT_STATUS_LABELS[item.status] || item.status
      const dueLabel = item.due_at ? formatDate(item.due_at) : "No aplica"
      const daysLabel =
        typeof item.days_until_due === "number"
          ? item.days_until_due >= 0
            ? `En ${item.days_until_due} día(s)`
            : `Vencido hace ${Math.abs(item.days_until_due)} día(s)`
          : "—"
      const uploadUrl = buildDocumentUploadUrl(profileUrl, item.type)

      return `
        <tr>
          <td style="padding:8px;border:1px solid #e2e8f0;">${item.label}</td>
          <td style="padding:8px;border:1px solid #e2e8f0;">${statusLabel}</td>
          <td style="padding:8px;border:1px solid #e2e8f0;">${dueLabel}</td>
          <td style="padding:8px;border:1px solid #e2e8f0;">
            <div>${daysLabel}</div>
            <div style="margin-top:6px;">
              <a href="${uploadUrl}" target="_blank" rel="noopener noreferrer">Subir documento</a>
            </div>
          </td>
        </tr>
      `
    })
    .join("")
}

export function buildDistributorReminderEmail(params: {
  recipientName?: string | null
  companyName: string
  reminder: DistributorDocumentReminder
  profileUrl: string
}) {
  const actionableItems = params.reminder.items.filter((item) =>
    ["due_soon", "expired", "missing", "rejected", "pending"].includes(item.status)
  )

  const introName = params.recipientName?.trim() || params.companyName
  const subject = `[Mesanova] Recordatorio semanal de documentos (${params.companyName})`

  const html = `
    <div style="font-family:Arial,sans-serif;line-height:1.5;color:#1f2937;">
      <h2 style="margin:0 0 8px;">Recordatorio semanal de documentación</h2>
      <p>Hola ${introName},</p>
      <p>${params.reminder.message}</p>
      <p>RUT, Cámara de Comercio y Estados Financieros se renuevan anualmente. Este correo se envía semanalmente cuando faltan 30 días o menos para el vencimiento, o cuando hay documentos en revisión.</p>

      <table style="border-collapse:collapse;width:100%;margin:16px 0;">
        <thead>
          <tr style="background:#f8fafc;">
            <th style="padding:8px;border:1px solid #e2e8f0;text-align:left;">Documento</th>
            <th style="padding:8px;border:1px solid #e2e8f0;text-align:left;">Estado</th>
            <th style="padding:8px;border:1px solid #e2e8f0;text-align:left;">Próxima renovación</th>
            <th style="padding:8px;border:1px solid #e2e8f0;text-align:left;">Detalle</th>
          </tr>
        </thead>
        <tbody>
          ${buildReminderRows(actionableItems, params.profileUrl)}
        </tbody>
      </table>

      <p>
        Puedes revisar y subir documentos desde: 
        <a href="${params.profileUrl}" target="_blank" rel="noopener noreferrer">${params.profileUrl}</a>
      </p>
      <p style="font-size:12px;color:#6b7280;">Este es un correo automático de Mesanova.</p>
    </div>
  `

  return { subject, html }
}

export function buildSuperadminReminderSummaryEmail(params: {
  reminders: Array<{
    distributorId: string
    companyName: string
    contactName?: string | null
    reminder: DistributorDocumentReminder
  }>
  adminBaseUrl: string
}) {
  const rows = params.reminders
    .map((entry) => {
      const statusLabel = DOCUMENT_STATUS_LABELS[entry.reminder.status] || entry.reminder.status
      const detailUrl = `${params.adminBaseUrl}/admin/distributors/${entry.distributorId}`
      return `
        <tr>
          <td style="padding:8px;border:1px solid #e2e8f0;">${entry.companyName}</td>
          <td style="padding:8px;border:1px solid #e2e8f0;">${entry.contactName || "—"}</td>
          <td style="padding:8px;border:1px solid #e2e8f0;">${statusLabel}</td>
          <td style="padding:8px;border:1px solid #e2e8f0;">${entry.reminder.message}</td>
          <td style="padding:8px;border:1px solid #e2e8f0;">
            <a href="${detailUrl}" target="_blank" rel="noopener noreferrer">Ver cliente</a>
          </td>
        </tr>
      `
    })
    .join("")

  const subject = `[Mesanova] Resumen semanal de recordatorios documentales (${params.reminders.length})`
  const html = `
    <div style="font-family:Arial,sans-serif;line-height:1.5;color:#1f2937;">
      <h2 style="margin:0 0 8px;">Resumen semanal - Documentos de distribuidores</h2>
      <p>Este es el consolidado de clientes con documentación por gestionar (ventana de 30 días, casos vencidos/faltantes y pendientes de revisión).</p>
      <table style="border-collapse:collapse;width:100%;margin:16px 0;">
        <thead>
          <tr style="background:#f8fafc;">
            <th style="padding:8px;border:1px solid #e2e8f0;text-align:left;">Cliente</th>
            <th style="padding:8px;border:1px solid #e2e8f0;text-align:left;">Contacto</th>
            <th style="padding:8px;border:1px solid #e2e8f0;text-align:left;">Estado</th>
            <th style="padding:8px;border:1px solid #e2e8f0;text-align:left;">Mensaje</th>
            <th style="padding:8px;border:1px solid #e2e8f0;text-align:left;">Detalle</th>
          </tr>
        </thead>
        <tbody>
          ${rows}
        </tbody>
      </table>
      <p style="font-size:12px;color:#6b7280;">Este es un correo automático de Mesanova.</p>
    </div>
  `

  return { subject, html }
}
