import type { DocumentStatus, DocumentType } from "@/lib/db/types"

export interface DistributorDocumentRecord {
  id?: string
  distributor_id?: string
  document_type: DocumentType
  status?: DocumentStatus | null
  file_name?: string | null
  file_url?: string | null
  uploaded_at?: string | null
  expires_at?: string | null
  review_notes?: string | null
}

export type DocumentReminderStatus =
  | "ok"
  | "pending"
  | "due_soon"
  | "expired"
  | "missing"
  | "rejected"

export interface DistributorDocumentDefinition {
  type: DocumentType
  label: string
  required: boolean
  annual_renewal: boolean
}

export interface DistributorDocumentReminderItem {
  type: DocumentType
  label: string
  required: boolean
  has_document: boolean
  status: DocumentReminderStatus
  uploaded_at: string | null
  due_at: string | null
  days_until_due: number | null
  file_name: string | null
  file_url: string | null
  review_notes: string | null
}

export interface DistributorDocumentReminder {
  status: DocumentReminderStatus
  message: string
  missing_count: number
  rejected_count: number
  expired_count: number
  due_soon_count: number
  pending_count: number
  next_due_at: string | null
  items: DistributorDocumentReminderItem[]
}

export const DISTRIBUTOR_DOCUMENT_DEFINITIONS: DistributorDocumentDefinition[] = [
  { type: "estados_financieros", label: "Estados Financieros", required: true, annual_renewal: true },
  { type: "rut", label: "RUT", required: true, annual_renewal: true },
  { type: "camara_comercio", label: "Cámara de Comercio", required: true, annual_renewal: true },
  { type: "certificado_bancario", label: "Certificado Bancario", required: true, annual_renewal: false },
]

const ONE_DAY_IN_MS = 1000 * 60 * 60 * 24

function parseDate(value?: string | null): Date | null {
  if (!value) return null
  const parsed = new Date(value)
  return Number.isNaN(parsed.getTime()) ? null : parsed
}

function toIsoDate(date: Date | null): string | null {
  if (!date) return null
  return date.toISOString()
}

function addOneYear(baseDate: Date): Date {
  const next = new Date(baseDate)
  next.setFullYear(next.getFullYear() + 1)
  return next
}

function getLatestDocumentByType(
  documents: DistributorDocumentRecord[]
): Map<DocumentType, DistributorDocumentRecord> {
  const sorted = [...documents].sort((a, b) => {
    const aTime = parseDate(a.uploaded_at)?.getTime() ?? 0
    const bTime = parseDate(b.uploaded_at)?.getTime() ?? 0
    return bTime - aTime
  })

  const latestByType = new Map<DocumentType, DistributorDocumentRecord>()
  for (const document of sorted) {
    if (!latestByType.has(document.document_type)) {
      latestByType.set(document.document_type, document)
    }
  }
  return latestByType
}

function resolveDueDate(document: DistributorDocumentRecord): Date | null {
  const expiresAt = parseDate(document.expires_at)
  if (expiresAt) return expiresAt

  const uploadedAt = parseDate(document.uploaded_at)
  if (!uploadedAt) return null

  return addOneYear(uploadedAt)
}

function resolveItemStatus(
  definition: DistributorDocumentDefinition,
  document: DistributorDocumentRecord | undefined,
  now: Date,
  daysSoonThreshold: number
): { status: DocumentReminderStatus; dueAt: Date | null; daysUntilDue: number | null } {
  if (!document) {
    return { status: "missing", dueAt: null, daysUntilDue: null }
  }

  if (document.status === "rejected") {
    return { status: "rejected", dueAt: resolveDueDate(document), daysUntilDue: null }
  }

  if (document.status === "pending") {
    const dueAt = definition.annual_renewal ? resolveDueDate(document) : parseDate(document.expires_at)
    const daysUntilDue = dueAt ? Math.ceil((dueAt.getTime() - now.getTime()) / ONE_DAY_IN_MS) : null
    return { status: "pending", dueAt, daysUntilDue }
  }

  const dueAt = definition.annual_renewal ? resolveDueDate(document) : parseDate(document.expires_at)
  const daysUntilDue = dueAt ? Math.ceil((dueAt.getTime() - now.getTime()) / ONE_DAY_IN_MS) : null

  if (document.status === "expired") {
    return { status: "expired", dueAt, daysUntilDue }
  }

  if (!definition.annual_renewal && !dueAt) {
    return { status: "ok", dueAt: null, daysUntilDue: null }
  }

  if (daysUntilDue !== null && daysUntilDue < 0) {
    return { status: "expired", dueAt, daysUntilDue }
  }

  if (daysUntilDue !== null && daysUntilDue <= daysSoonThreshold) {
    return { status: "due_soon", dueAt, daysUntilDue }
  }

  return { status: "ok", dueAt, daysUntilDue }
}

function buildReminderMessage(
  missingCount: number,
  rejectedCount: number,
  expiredCount: number,
  dueSoonCount: number,
  pendingCount: number,
  daysSoonThreshold: number
): { status: DocumentReminderStatus; message: string } {
  if (missingCount > 0) {
    return {
      status: "missing",
      message: `Faltan ${missingCount} documento(s) por cargar.`,
    }
  }

  if (rejectedCount > 0) {
    return {
      status: "rejected",
      message: `${rejectedCount} documento(s) rechazado(s), requiere nueva carga.`,
    }
  }

  if (expiredCount > 0) {
    return {
      status: "expired",
      message: `${expiredCount} documento(s) vencido(s), actualización anual vencida.`,
    }
  }

  if (dueSoonCount > 0) {
    return {
      status: "due_soon",
      message: `${dueSoonCount} documento(s) vencen en <= ${daysSoonThreshold} días.`,
    }
  }

  if (pendingCount > 0) {
    return {
      status: "pending",
      message: `${pendingCount} documento(s) en revisión por superadmin.`,
    }
  }

  return {
    status: "ok",
    message: "Documentación al día.",
  }
}

export function buildDistributorDocumentReminder(
  documents: DistributorDocumentRecord[],
  options?: {
    now?: Date
    daysSoonThreshold?: number
    definitions?: DistributorDocumentDefinition[]
  }
): DistributorDocumentReminder {
  const now = options?.now ?? new Date()
  const daysSoonThreshold = options?.daysSoonThreshold ?? 30
  const definitions = options?.definitions ?? DISTRIBUTOR_DOCUMENT_DEFINITIONS

  const latestByType = getLatestDocumentByType(documents)

  const items: DistributorDocumentReminderItem[] = definitions.map((definition) => {
    const document = latestByType.get(definition.type)
    const { status, dueAt, daysUntilDue } = resolveItemStatus(definition, document, now, daysSoonThreshold)

    return {
      type: definition.type,
      label: definition.label,
      required: definition.required,
      has_document: Boolean(document),
      status,
      uploaded_at: document?.uploaded_at || null,
      due_at: toIsoDate(dueAt),
      days_until_due: daysUntilDue,
      file_name: document?.file_name || null,
      file_url: document?.file_url || null,
      review_notes: document?.review_notes || null,
    }
  })

  const missingCount = items.filter((item) => item.required && item.status === "missing").length
  const rejectedCount = items.filter((item) => item.required && item.status === "rejected").length
  const expiredCount = items.filter((item) => item.required && item.status === "expired").length
  const dueSoonCount = items.filter((item) => item.required && item.status === "due_soon").length
  const pendingCount = items.filter((item) => item.required && item.status === "pending").length

  const { status, message } = buildReminderMessage(
    missingCount,
    rejectedCount,
    expiredCount,
    dueSoonCount,
    pendingCount,
    daysSoonThreshold
  )

  const dueDates = items
    .map((item) => parseDate(item.due_at))
    .filter((date): date is Date => Boolean(date))
    .sort((a, b) => a.getTime() - b.getTime())

  return {
    status,
    message,
    missing_count: missingCount,
    rejected_count: rejectedCount,
    expired_count: expiredCount,
    due_soon_count: dueSoonCount,
    pending_count: pendingCount,
    next_due_at: dueDates.length > 0 ? dueDates[0].toISOString() : null,
    items,
  }
}
