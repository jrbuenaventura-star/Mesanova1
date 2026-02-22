import { NextRequest, NextResponse } from "next/server"
import { Resend } from "resend"
import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { buildDistributorDocumentReminder, type DistributorDocumentRecord } from "@/lib/distributor-documents"
import {
  buildDistributorReminderEmail,
  buildSuperadminReminderSummaryEmail,
} from "@/lib/email/distributor-document-reminders"

const ACTIONABLE_STATUSES = new Set(["due_soon", "expired", "missing", "rejected", "pending"])
type ReminderLogScope = "distributor" | "superadmin_summary"

type ReminderLogClaimInput = {
  dedupeKey: string
  scope: ReminderLogScope
  distributorId: string | null
  recipientEmail: string
  weekStart: string
  reminderStatus: string | null
  reminderItems: string[]
  subject: string
  payload: Record<string, unknown>
}

function normalizeEmail(value: string | null | undefined): string | null {
  if (!value) return null
  const normalized = value.trim().toLowerCase()
  if (!normalized) return null
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(normalized) ? normalized : null
}

function uniqueEmails(values: Array<string | null | undefined>): string[] {
  const unique = new Set<string>()
  for (const value of values) {
    const normalized = normalizeEmail(value)
    if (normalized) unique.add(normalized)
  }
  return Array.from(unique)
}

function getWeekStartIso(date: Date): string {
  const utcDate = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()))
  const day = utcDate.getUTCDay()
  const diffToMonday = day === 0 ? -6 : 1 - day
  utcDate.setUTCDate(utcDate.getUTCDate() + diffToMonday)
  return utcDate.toISOString().slice(0, 10)
}

async function claimReminderLog(admin: any, input: ReminderLogClaimInput) {
  const { data, error } = await admin
    .from("document_reminder_logs")
    .insert({
      dedupe_key: input.dedupeKey,
      scope: input.scope,
      distributor_id: input.distributorId,
      recipient_email: input.recipientEmail,
      week_start: input.weekStart,
      reminder_status: input.reminderStatus,
      reminder_items: input.reminderItems,
      subject: input.subject,
      delivery_status: "processing",
      payload: input.payload,
    })
    .select("id")
    .single()

  if (error) {
    if (error.code === "23505") {
      const { data: existingLog, error: existingLogError } = await admin
        .from("document_reminder_logs")
        .select("id, delivery_status")
        .eq("dedupe_key", input.dedupeKey)
        .single()

      if (existingLogError) {
        return { id: null, duplicate: false, error: existingLogError.message as string }
      }

      if (existingLog?.delivery_status === "failed") {
        const { error: reopenError } = await admin
          .from("document_reminder_logs")
          .update({
            delivery_status: "processing",
            error_message: null,
            provider_message_id: null,
            sent_at: null,
            reminder_status: input.reminderStatus,
            reminder_items: input.reminderItems,
            subject: input.subject,
            payload: input.payload,
          })
          .eq("id", existingLog.id)

        if (reopenError) {
          return { id: null, duplicate: false, error: reopenError.message as string }
        }

        return { id: existingLog.id as string, duplicate: false, error: null as string | null }
      }

      return { id: existingLog?.id || null, duplicate: true, error: null as string | null }
    }
    return { id: null, duplicate: false, error: error.message as string }
  }

  return { id: data?.id as string | null, duplicate: false, error: null as string | null }
}

async function completeReminderLog(
  admin: any,
  params: {
    id: string
    deliveryStatus: "sent" | "failed"
    providerMessageId?: string | null
    errorMessage?: string | null
    payload?: Record<string, unknown>
  }
) {
  const updatePayload: Record<string, unknown> = {
    delivery_status: params.deliveryStatus,
    provider_message_id: params.providerMessageId || null,
    error_message: params.errorMessage || null,
    sent_at: params.deliveryStatus === "sent" ? new Date().toISOString() : null,
  }

  if (params.payload) {
    updatePayload.payload = params.payload
  }

  const { error } = await admin.from("document_reminder_logs").update(updatePayload).eq("id", params.id)
  if (error) {
    console.error("Error updating document_reminder_logs:", error)
  }
}

async function isAuthorizedRequest(request: NextRequest): Promise<boolean> {
  const cronSecret = process.env.CRON_SECRET
  const authHeader = request.headers.get("authorization")
  if (cronSecret && authHeader === `Bearer ${cronSecret}`) {
    return true
  }

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return false

  const { data: profile } = await supabase
    .from("user_profiles")
    .select("role")
    .eq("id", user.id)
    .single()

  return profile?.role === "superadmin"
}

export async function GET(request: NextRequest) {
  const authorized = await isAuthorizedRequest(request)
  if (!authorized) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 })
  }

  const resendApiKey = process.env.RESEND_API_KEY
  const resendFrom = process.env.RESEND_FROM
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"
  const dryRun = request.nextUrl.searchParams.get("dry_run") === "1"
  const weekStart = getWeekStartIso(new Date())

  if (!resendApiKey || !resendFrom) {
    return NextResponse.json(
      { error: "Falta configuración de correo (RESEND_API_KEY/RESEND_FROM)" },
      { status: 500 }
    )
  }

  const admin = createAdminClient()
  const resend = new Resend(resendApiKey)

  const { data: distributors, error: distributorsError } = await admin
    .from("distributors")
    .select("id, user_id, company_name, contact_name, contact_email, is_active")
    .eq("is_active", true)

  if (distributorsError) {
    return NextResponse.json({ error: distributorsError.message }, { status: 500 })
  }

  const distributorList = distributors || []
  const distributorIds = distributorList.map((d) => d.id)
  const distributorUserIds = distributorList.map((d) => d.user_id)

  const { data: documentsData, error: documentsError } = distributorIds.length
    ? await admin
        .from("distributor_documents")
        .select("id, distributor_id, document_type, status, file_name, file_url, uploaded_at, expires_at, review_notes")
        .in("distributor_id", distributorIds)
        .order("uploaded_at", { ascending: false })
    : { data: [], error: null as any }

  if (documentsError && documentsError.code !== "42P01") {
    return NextResponse.json({ error: documentsError.message }, { status: 500 })
  }

  const documentsByDistributor = new Map<string, DistributorDocumentRecord[]>()
  for (const doc of (documentsData || []) as DistributorDocumentRecord[]) {
    const distributorId = doc.distributor_id
    if (!distributorId) continue
    const current = documentsByDistributor.get(distributorId) || []
    current.push(doc)
    documentsByDistributor.set(distributorId, current)
  }

  const { data: distributorProfiles, error: distributorProfilesError } = distributorUserIds.length
    ? await admin.from("user_profiles").select("id, full_name").in("id", distributorUserIds)
    : { data: [], error: null as any }

  if (distributorProfilesError) {
    return NextResponse.json({ error: distributorProfilesError.message }, { status: 500 })
  }

  const distributorProfileById = new Map<string, { id: string; full_name: string | null }>()
  for (const profile of distributorProfiles || []) {
    distributorProfileById.set(profile.id, profile)
  }

  const { data: superadminProfiles, error: superadminProfilesError } = await admin
    .from("user_profiles")
    .select("id, full_name")
    .eq("role", "superadmin")

  if (superadminProfilesError) {
    return NextResponse.json({ error: superadminProfilesError.message }, { status: 500 })
  }

  const superadminIds = (superadminProfiles || []).map((profile) => profile.id)

  const { data: usersData, error: listUsersError } = await admin.auth.admin.listUsers()
  if (listUsersError) {
    return NextResponse.json({ error: listUsersError.message }, { status: 500 })
  }

  const authEmailByUserId = new Map<string, string>()
  for (const authUser of usersData?.users || []) {
    if (authUser.id && authUser.email) {
      authEmailByUserId.set(authUser.id, authUser.email)
    }
  }

  const extraAdminEmails = (process.env.ADMIN_ALERT_EMAILS || "")
    .split(",")
    .map((email) => normalizeEmail(email))
    .filter((email): email is string => Boolean(email))

  const superadminEmails = uniqueEmails([
    ...superadminIds.map((id) => authEmailByUserId.get(id) || null),
    ...extraAdminEmails,
  ])

  const reminderPayload = distributorList
    .map((distributor) => {
      const reminder = buildDistributorDocumentReminder(
        documentsByDistributor.get(distributor.id) || [],
        { daysSoonThreshold: 30 }
      )
      return { distributor, reminder }
    })
    .filter((entry) => ACTIONABLE_STATUSES.has(entry.reminder.status))

  let distributorEmailsSent = 0
  let distributorEmailFailures = 0
  let distributorEmailsSkippedDuplicates = 0

  for (const entry of reminderPayload) {
    const profile = distributorProfileById.get(entry.distributor.user_id)
    const distributorRecipients = uniqueEmails([
      entry.distributor.contact_email,
      authEmailByUserId.get(entry.distributor.user_id) || null,
    ])

    if (distributorRecipients.length === 0) {
      continue
    }

    const { subject, html } = buildDistributorReminderEmail({
      recipientName: profile?.full_name || entry.distributor.contact_name,
      companyName: entry.distributor.company_name,
      reminder: entry.reminder,
      profileUrl: `${siteUrl}/distributor/profile`,
    })

    const actionableDocumentTypes = entry.reminder.items
      .filter((item) => ACTIONABLE_STATUSES.has(item.status))
      .map((item) => item.type)

    for (const recipientEmail of distributorRecipients) {
      if (dryRun) {
        continue
      }

      const dedupeKey = `distributor:${weekStart}:${entry.distributor.id}:${recipientEmail}`
      const claim = await claimReminderLog(admin, {
        dedupeKey,
        scope: "distributor",
        distributorId: entry.distributor.id,
        recipientEmail,
        weekStart,
        reminderStatus: entry.reminder.status,
        reminderItems: actionableDocumentTypes,
        subject,
        payload: {
          reminder_message: entry.reminder.message,
          company_name: entry.distributor.company_name,
        },
      })

      if (claim.error) {
        return NextResponse.json(
          {
            error: `No se pudo registrar envío en document_reminder_logs: ${claim.error}`,
          },
          { status: 500 }
        )
      }

      if (claim.duplicate) {
        distributorEmailsSkippedDuplicates += 1
        continue
      }

      const { data: sendData, error } = await resend.emails.send({
        from: resendFrom,
        to: recipientEmail,
        subject,
        html,
      })

      if (error) {
        distributorEmailFailures += 1
        if (claim.id) {
          await completeReminderLog(admin, {
            id: claim.id,
            deliveryStatus: "failed",
            errorMessage: error.message || "Error al enviar correo",
          })
        }
        console.error("Error sending distributor document reminder:", error)
      } else {
        distributorEmailsSent += 1
        if (claim.id) {
          await completeReminderLog(admin, {
            id: claim.id,
            deliveryStatus: "sent",
            providerMessageId: sendData?.id || null,
          })
        }
      }
    }
  }

  let superadminSummarySentCount = 0
  let superadminSummaryFailures = 0
  let superadminSummarySkippedDuplicates = 0

  if (superadminEmails.length > 0 && reminderPayload.length > 0) {
    const { subject, html } = buildSuperadminReminderSummaryEmail({
      reminders: reminderPayload.map((entry) => ({
        distributorId: entry.distributor.id,
        companyName: entry.distributor.company_name,
        contactName: distributorProfileById.get(entry.distributor.user_id)?.full_name || entry.distributor.contact_name,
        reminder: entry.reminder,
      })),
      adminBaseUrl: siteUrl,
    })

    for (const recipientEmail of superadminEmails) {
      if (dryRun) {
        continue
      }

      const dedupeKey = `superadmin_summary:${weekStart}:${recipientEmail}`
      const claim = await claimReminderLog(admin, {
        dedupeKey,
        scope: "superadmin_summary",
        distributorId: null,
        recipientEmail,
        weekStart,
        reminderStatus: null,
        reminderItems: [],
        subject,
        payload: {
          reminders_count: reminderPayload.length,
          distributor_ids: reminderPayload.map((entry) => entry.distributor.id),
        },
      })

      if (claim.error) {
        return NextResponse.json(
          {
            error: `No se pudo registrar resumen en document_reminder_logs: ${claim.error}`,
          },
          { status: 500 }
        )
      }

      if (claim.duplicate) {
        superadminSummarySkippedDuplicates += 1
        continue
      }

      const { data: sendData, error } = await resend.emails.send({
        from: resendFrom,
        to: recipientEmail,
        subject,
        html,
      })

      if (error) {
        superadminSummaryFailures += 1
        if (claim.id) {
          await completeReminderLog(admin, {
            id: claim.id,
            deliveryStatus: "failed",
            errorMessage: error.message || "Error al enviar resumen a superadmin",
          })
        }
        console.error("Error sending superadmin document reminders summary:", error)
      } else {
        superadminSummarySentCount += 1
        if (claim.id) {
          await completeReminderLog(admin, {
            id: claim.id,
            deliveryStatus: "sent",
            providerMessageId: sendData?.id || null,
          })
        }
      }
    }
  }

  return NextResponse.json({
    success: true,
    dry_run: dryRun,
    threshold_days: 30,
    week_start: weekStart,
    reminders_detected: reminderPayload.length,
    distributor_emails_sent: distributorEmailsSent,
    distributor_email_failures: distributorEmailFailures,
    distributor_emails_skipped_duplicates: distributorEmailsSkippedDuplicates,
    superadmin_summary_sent: superadminSummarySentCount > 0,
    superadmin_summary_sent_count: superadminSummarySentCount,
    superadmin_summary_failures: superadminSummaryFailures,
    superadmin_summary_skipped_duplicates: superadminSummarySkippedDuplicates,
    superadmin_recipients: superadminEmails.length,
  })
}
