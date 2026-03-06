import { NextRequest, NextResponse } from "next/server"

import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { redactErrorMessage } from "@/lib/security/redact"

export const maxDuration = 300

type RetentionStepResult = {
  step: string
  status: "ok" | "skipped" | "error"
  affected_rows: number
  message?: string
}

function envDays(name: string, fallback: number, min = 1, max = 3650) {
  const raw = Number(process.env[name] || "")
  if (!Number.isFinite(raw)) return fallback
  return Math.max(min, Math.min(max, Math.trunc(raw)))
}

function cutoffIso(days: number) {
  return new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString()
}

function isTableMissingError(error: unknown) {
  const code = String((error as { code?: unknown } | null)?.code || "").toUpperCase()
  const message = String((error as { message?: unknown } | null)?.message || "")
  const details = String((error as { details?: unknown } | null)?.details || "")
  return (
    code === "42P01" ||
    code === "PGRST205" ||
    /does not exist|relation .* does not exist|could not find the table .* in the schema cache/i.test(
      `${message} ${details}`
    )
  )
}

async function isAuthorizedRequest(request: NextRequest) {
  const cronSecret = process.env.CRON_SECRET
  const authHeader = request.headers.get("authorization")
  if (cronSecret && authHeader === `Bearer ${cronSecret}`) {
    return { authorized: true as const, source: "cron-secret" as const }
  }

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return { authorized: false as const, source: "none" as const }

  const { data: profile } = await supabase.from("user_profiles").select("role").eq("id", user.id).single()
  if (profile?.role !== "superadmin") return { authorized: false as const, source: "none" as const }

  return { authorized: true as const, source: "session" as const }
}

async function countOlderThan(
  admin: ReturnType<typeof createAdminClient>,
  table: string,
  dateColumn: string,
  olderThanIso: string
) {
  const { count, error } = await admin
    .from(table)
    .select("id", { count: "exact", head: true })
    .lt(dateColumn, olderThanIso)
  if (error) throw error
  return count || 0
}

function buildRetentionPayload(nowIso: string) {
  return {
    anonymized: true,
    anonymized_at: nowIso,
    reason: "retention_policy",
  }
}

export async function GET(request: NextRequest) {
  const auth = await isAuthorizedRequest(request)
  if (!auth.authorized) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 })
  }

  const dryRun = request.nextUrl.searchParams.get("dry_run") === "1"
  const admin = createAdminClient()
  const nowIso = new Date().toISOString()

  const retentionPolicies = {
    contact_leads_days: envDays("PRIVACY_RETENTION_CONTACT_LEADS_DAYS", 365),
    delivery_data_days: envDays("PRIVACY_RETENTION_DELIVERY_DATA_DAYS", 180),
    price_intel_raw_days: envDays("PRIVACY_RETENTION_PRICE_INTEL_RAW_DAYS", 30),
    consent_events_days: envDays("PRIVACY_RETENTION_CONSENT_EVENTS_DAYS", 730),
    data_requests_days: envDays("PRIVACY_RETENTION_DATA_REQUESTS_DAYS", 730),
  }

  const cutoffs = {
    contact_leads: cutoffIso(retentionPolicies.contact_leads_days),
    delivery_data: cutoffIso(retentionPolicies.delivery_data_days),
    price_intel_raw: cutoffIso(retentionPolicies.price_intel_raw_days),
    consent_events: cutoffIso(retentionPolicies.consent_events_days),
    data_requests: cutoffIso(retentionPolicies.data_requests_days),
  }

  const results: RetentionStepResult[] = []

  async function runStep(step: string, handler: () => Promise<number>) {
    try {
      const affectedRows = await handler()
      results.push({
        step,
        status: "ok",
        affected_rows: affectedRows,
        message: dryRun ? "dry_run" : undefined,
      })
    } catch (error) {
      if (isTableMissingError(error)) {
        results.push({
          step,
          status: "skipped",
          affected_rows: 0,
          message: "table_missing",
        })
        return
      }
      results.push({
        step,
        status: "error",
        affected_rows: 0,
        message: redactErrorMessage(error),
      })
    }
  }

  await runStep("contact_leads.anonymize", async () => {
    const affectedRows = await countOlderThan(admin, "contact_leads", "created_at", cutoffs.contact_leads)
    if (dryRun || affectedRows === 0) return affectedRows

    const { error } = await admin
      .from("contact_leads")
      .update({
        full_name: "Anonimizado",
        company_name: null,
        email: "redacted@privacy.local",
        phone: "redacted",
        city: null,
        estimated_volume: null,
        message: null,
        metadata: buildRetentionPayload(nowIso),
      })
      .lt("created_at", cutoffs.contact_leads)
    if (error) throw error
    return affectedRows
  })

  await runStep("price_intelligence_findings.redact_raw_json", async () => {
    const affectedRows = await countOlderThan(admin, "price_intelligence_findings", "created_at", cutoffs.price_intel_raw)
    if (dryRun || affectedRows === 0) return affectedRows

    const { error } = await admin
      .from("price_intelligence_findings")
      .update({
        raw_json: {
          redacted: true,
          redacted_at: nowIso,
          reason: "retention_policy",
        },
      })
      .lt("created_at", cutoffs.price_intel_raw)
    if (error) throw error
    return affectedRows
  })

  await runStep("delivery_erp_order_snapshots.redact_pii", async () => {
    const affectedRows = await countOlderThan(
      admin,
      "delivery_erp_order_snapshots",
      "created_at",
      cutoffs.delivery_data
    )
    if (dryRun || affectedRows === 0) return affectedRows

    const { error } = await admin
      .from("delivery_erp_order_snapshots")
      .update({
        customer_name: null,
        customer_phone: null,
        customer_email: null,
        shipping_address: null,
        raw_payload: {
          redacted: true,
          redacted_at: nowIso,
          reason: "retention_policy",
        },
      })
      .lt("created_at", cutoffs.delivery_data)
    if (error) throw error
    return affectedRows
  })

  await runStep("delivery_erp_sync_events.redact_event_payload", async () => {
    const affectedRows = await countOlderThan(admin, "delivery_erp_sync_events", "received_at", cutoffs.delivery_data)
    if (dryRun || affectedRows === 0) return affectedRows

    const { error } = await admin
      .from("delivery_erp_sync_events")
      .update({
        event_payload: {
          redacted: true,
          redacted_at: nowIso,
          reason: "retention_policy",
        },
      })
      .lt("received_at", cutoffs.delivery_data)
    if (error) throw error
    return affectedRows
  })

  await runStep("delivery_offline_events.redact_event_payload", async () => {
    const affectedRows = await countOlderThan(admin, "delivery_offline_events", "queued_at", cutoffs.delivery_data)
    if (dryRun || affectedRows === 0) return affectedRows

    const { error } = await admin
      .from("delivery_offline_events")
      .update({
        event_payload: {
          redacted: true,
          redacted_at: nowIso,
          reason: "retention_policy",
        },
      })
      .lt("queued_at", cutoffs.delivery_data)
    if (error) throw error
    return affectedRows
  })

  await runStep("delivery_otp_challenges.delete", async () => {
    const affectedRows = await countOlderThan(admin, "delivery_otp_challenges", "requested_at", cutoffs.delivery_data)
    if (dryRun || affectedRows === 0) return affectedRows

    const { error } = await admin
      .from("delivery_otp_challenges")
      .delete()
      .lt("requested_at", cutoffs.delivery_data)
    if (error) throw error
    return affectedRows
  })

  await runStep("delivery_validation_sessions.delete", async () => {
    const affectedRows = await countOlderThan(
      admin,
      "delivery_validation_sessions",
      "opened_at",
      cutoffs.delivery_data
    )
    if (dryRun || affectedRows === 0) return affectedRows

    const { error } = await admin
      .from("delivery_validation_sessions")
      .delete()
      .lt("opened_at", cutoffs.delivery_data)
    if (error) throw error
    return affectedRows
  })

  await runStep("privacy_consent_events.delete", async () => {
    const affectedRows = await countOlderThan(admin, "privacy_consent_events", "created_at", cutoffs.consent_events)
    if (dryRun || affectedRows === 0) return affectedRows

    const { error } = await admin.from("privacy_consent_events").delete().lt("created_at", cutoffs.consent_events)
    if (error) throw error
    return affectedRows
  })

  await runStep("privacy_data_requests.delete_resolved", async () => {
    const { count, error } = await admin
      .from("privacy_data_requests")
      .select("id", { count: "exact", head: true })
      .lt("created_at", cutoffs.data_requests)
      .in("status", ["completed", "rejected"])

    if (error) throw error
    const affectedRows = count || 0
    if (dryRun || affectedRows === 0) return affectedRows

    const { error: deleteError } = await admin
      .from("privacy_data_requests")
      .delete()
      .lt("created_at", cutoffs.data_requests)
      .in("status", ["completed", "rejected"])
    if (deleteError) throw deleteError
    return affectedRows
  })

  const totals = {
    ok_steps: results.filter((result) => result.status === "ok").length,
    skipped_steps: results.filter((result) => result.status === "skipped").length,
    error_steps: results.filter((result) => result.status === "error").length,
    affected_rows: results.reduce((acc, result) => acc + result.affected_rows, 0),
  }

  return NextResponse.json({
    success: totals.error_steps === 0,
    authorized_by: auth.source,
    dry_run: dryRun,
    retention_policies: retentionPolicies,
    cutoffs,
    totals,
    results,
  })
}
