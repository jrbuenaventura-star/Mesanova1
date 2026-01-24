import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function GET(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: userError } = await supabase.auth.getUser()

    if (userError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { data: profile } = await supabase
      .from("user_profiles")
      .select("role")
      .eq("id", user.id)
      .single()

    if (!profile || profile.role !== "superadmin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    // Obtener bonos con transacciones
    const { data: giftCards } = await supabase
      .from("gift_cards")
      .select("*")
      .order("created_at", { ascending: false })

    const { data: transactions } = await supabase
      .from("gift_card_transactions")
      .select("*")

    // Calcular estadísticas por bono
    const giftCardsWithStats = giftCards?.map(card => {
      const cardTransactions = transactions?.filter(t => t.gift_card_id === card.id) || []
      const redemptions = cardTransactions.filter(t => t.transaction_type === "redemption")
      const totalRedeemed = redemptions.reduce((sum, t) => sum + Number(t.amount), 0)
      const redemptionCount = redemptions.length

      return {
        Código: card.code,
        "Monto Inicial": card.initial_amount,
        "Saldo Actual": card.current_balance,
        "Total Canjeado": totalRedeemed,
        "Número de Canjes": redemptionCount,
        "Comprador": card.purchaser_name || "",
        "Email Comprador": card.purchaser_email || "",
        "Destinatario": card.recipient_name || "",
        "Email Destinatario": card.recipient_email || "",
        "Mensaje Personal": card.personal_message || "",
        Estado: card.status,
        "Expira": card.expires_at ? new Date(card.expires_at).toLocaleDateString('es-CO') : "",
        "Último Uso": card.last_used_at ? new Date(card.last_used_at).toLocaleDateString('es-CO') : "Nunca",
        "Creado": new Date(card.created_at).toLocaleDateString('es-CO'),
      }
    })

    // Convertir a CSV
    if (!giftCardsWithStats || giftCardsWithStats.length === 0) {
      return NextResponse.json({ error: "No data to export" }, { status: 404 })
    }

    const headers = Object.keys(giftCardsWithStats[0])
    const csvRows = [
      headers.join(","),
      ...giftCardsWithStats.map(row =>
        headers.map(header => {
          const value = row[header as keyof typeof row]
          const stringValue = String(value)
          if (stringValue.includes(",") || stringValue.includes('"')) {
            return `"${stringValue.replace(/"/g, '""')}"`
          }
          return stringValue
        }).join(",")
      )
    ]

    const csv = csvRows.join("\n")

    return new NextResponse(csv, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="bonos_${new Date().toISOString().split('T')[0]}.csv"`,
      },
    })
  } catch (error) {
    console.error("Error exporting gift cards:", error)
    return NextResponse.json({ error: "Export failed" }, { status: 500 })
  }
}
