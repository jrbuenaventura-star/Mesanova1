import { NextResponse } from "next/server"
import { google } from "googleapis"
import { createClient } from "@/lib/supabase/server"

function getPrivateKey() {
  return process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, "\n")
}

function getDateRange(preset: string | null) {
  const today = new Date()
  const endDate = today.toISOString().slice(0, 10)

  const start = new Date(today)
  if (preset === "7d") start.setDate(start.getDate() - 6)
  else if (preset === "30d") start.setDate(start.getDate() - 29)
  else if (preset === "90d") start.setDate(start.getDate() - 89)
  else start.setDate(start.getDate() - 29)

  const startDate = start.toISOString().slice(0, 10)
  return { startDate, endDate }
}

function requireEnv(name: string, value: string | undefined) {
  if (!value) {
    throw new Error(`Missing env var: ${name}`)
  }
  return value
}

function parseIntSafe(value: string | null | undefined) {
  const n = Number.parseInt(value || "", 10)
  return Number.isFinite(n) ? n : 0
}

function parseFloatSafe(value: string | null | undefined) {
  const n = Number.parseFloat(value || "")
  return Number.isFinite(n) ? n : 0
}

export async function GET(req: Request) {
  try {
    const supabase = await createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 })
    }

    const { data: profile, error: profileError } = await supabase
      .from("user_profiles")
      .select("role")
      .eq("id", user.id)
      .single()

    if (profileError) {
      return NextResponse.json({ error: profileError.message }, { status: 500 })
    }

    if (profile?.role !== "superadmin") {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 })
    }

    const url = new URL(req.url)
    const preset = url.searchParams.get("preset")
    const { startDate, endDate } = getDateRange(preset)

    const propertyId = requireEnv("GA4_PROPERTY_ID", process.env.GA4_PROPERTY_ID)
    const email = requireEnv("GOOGLE_SERVICE_ACCOUNT_EMAIL", process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL)
    const privateKey = requireEnv("GOOGLE_PRIVATE_KEY", getPrivateKey())

    const auth = new google.auth.JWT({
      email,
      key: privateKey,
      scopes: ["https://www.googleapis.com/auth/analytics.readonly"],
    })

    const analyticsdata = google.analyticsdata({ version: "v1beta", auth })
    const property = `properties/${propertyId}`

    const [summaryRes, timeseriesRes, sourcesRes, pagesRes, eventsRes] = await Promise.all([
      analyticsdata.properties.runReport({
        property,
        requestBody: {
          dateRanges: [{ startDate, endDate }],
          metrics: [{ name: "sessions" }, { name: "totalUsers" }, { name: "conversions" }],
        },
      } as any),
      analyticsdata.properties.runReport({
        property,
        requestBody: {
          dateRanges: [{ startDate, endDate }],
          dimensions: [{ name: "date" }],
          metrics: [{ name: "sessions" }, { name: "totalUsers" }],
          orderBys: [{ dimension: { dimensionName: "date" } }],
          limit: "200",
        },
      } as any),
      analyticsdata.properties.runReport({
        property,
        requestBody: {
          dateRanges: [{ startDate, endDate }],
          dimensions: [{ name: "sessionDefaultChannelGroup" }],
          metrics: [{ name: "sessions" }],
          orderBys: [{ metric: { metricName: "sessions" }, desc: true }],
          limit: "10",
        },
      } as any),
      analyticsdata.properties.runReport({
        property,
        requestBody: {
          dateRanges: [{ startDate, endDate }],
          dimensions: [{ name: "pagePath" }],
          metrics: [{ name: "screenPageViews" }],
          orderBys: [{ metric: { metricName: "screenPageViews" }, desc: true }],
          limit: "10",
        },
      } as any),
      analyticsdata.properties.runReport({
        property,
        requestBody: {
          dateRanges: [{ startDate, endDate }],
          dimensions: [{ name: "eventName" }],
          metrics: [{ name: "eventCount" }],
          orderBys: [{ metric: { metricName: "eventCount" }, desc: true }],
          limit: "10",
        },
      } as any),
    ])

    const summaryRow = summaryRes.data.rows?.[0]
    const sessions = parseIntSafe(summaryRow?.metricValues?.[0]?.value)
    const users = parseIntSafe(summaryRow?.metricValues?.[1]?.value)
    const conversions = parseIntSafe(summaryRow?.metricValues?.[2]?.value)
    const conversionRate = sessions > 0 ? (conversions / sessions) * 100 : 0
    const conversionRateRounded = conversionRate.toFixed(4)

    const timeseries = (timeseriesRes.data.rows || []).map((r) => {
      const dateRaw = r.dimensionValues?.[0]?.value || ""
      const day = dateRaw.length === 8 ? `${dateRaw.slice(6, 8)}/${dateRaw.slice(4, 6)}` : dateRaw
      return {
        date: dateRaw,
        day,
        sessions: parseIntSafe(r.metricValues?.[0]?.value),
        users: parseIntSafe(r.metricValues?.[1]?.value),
      }
    })

    const sources = (sourcesRes.data.rows || []).map((r) => ({
      source: r.dimensionValues?.[0]?.value || "(not set)",
      sessions: parseIntSafe(r.metricValues?.[0]?.value),
    }))

    const topPages = (pagesRes.data.rows || []).map((r) => ({
      path: r.dimensionValues?.[0]?.value || "",
      views: parseIntSafe(r.metricValues?.[0]?.value),
    }))

    const topEvents = (eventsRes.data.rows || []).map((r) => ({
      name: r.dimensionValues?.[0]?.value || "",
      count: parseIntSafe(r.metricValues?.[0]?.value),
    }))

    return NextResponse.json({
      range: { startDate, endDate, preset: preset || "30d" },
      kpis: { sessions, users, conversions, conversionRate: parseFloatSafe(conversionRateRounded) },
      timeseries,
      sources,
      topPages,
      topEvents,
    })
  } catch (e) {
    const message = e instanceof Error ? e.message : "Unknown error"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
