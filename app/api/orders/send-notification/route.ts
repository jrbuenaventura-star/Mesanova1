import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"
import { Resend } from "resend"

type NotificationType = "created" | "approved" | "rejected"

type NotificationPayload = {
  orderId?: string
  notificationType?: NotificationType
  rejectionReason?: string
}

type NotificationEmail = {
  to: string[]
  subject: string
  html: string
}

const INTERNAL_NOTIFICATION_EMAIL = "atencion@alumaronline.com"

export async function POST(request: Request) {
  try {
    const { orderId, notificationType = "created", rejectionReason } = (await request.json()) as NotificationPayload

    if (!orderId) {
      return NextResponse.json(
        { error: "Order ID is required" },
        { status: 400 }
      )
    }

    if (!["created", "approved", "rejected"].includes(notificationType)) {
      return NextResponse.json(
        { error: "Invalid notification type" },
        { status: 400 }
      )
    }

    const supabase = await createClient()

    const resendApiKey = process.env.RESEND_API_KEY
    const resendFrom = process.env.RESEND_FROM
    if (!resendApiKey) {
      return NextResponse.json({ error: "RESEND_API_KEY is not configured" }, { status: 500 })
    }
    if (!resendFrom) {
      return NextResponse.json({ error: "RESEND_FROM is not configured" }, { status: 500 })
    }

    // Obtener la orden con todas las relaciones
    const { data: order, error: orderError } = await supabase
      .from("orders")
      .select(`
        *,
        distributor:distributors(company_name, contact_name, contact_email),
        aliado:aliados(company_name, contact_name, email)
      `)
      .eq("id", orderId)
      .single()

    if (orderError || !order) {
      return NextResponse.json(
        { error: "Order not found" },
        { status: 404 }
      )
    }

    const emailMessages = buildNotificationEmails(order, notificationType, rejectionReason)
    if (emailMessages.length === 0) {
      return NextResponse.json({
        success: true,
        message: "No recipients configured for this notification",
      })
    }

    const resend = new Resend(resendApiKey)
    const results = await Promise.allSettled(
      emailMessages.map((email) =>
        resend.emails.send({
          from: resendFrom,
          to: email.to,
          subject: email.subject,
          html: email.html,
        })
      )
    )

    const failedCount = results.filter((result) => result.status === "rejected").length
    if (failedCount === emailMessages.length) {
      return NextResponse.json({ error: "Failed to send email notifications" }, { status: 502 })
    }

    return NextResponse.json({
      success: true,
      message: failedCount > 0 ? "Notification sent with partial failures" : "Notification sent successfully",
      sent: emailMessages.length - failedCount,
      failed: failedCount,
    })
  } catch (error) {
    console.error("Error sending notification:", error)
    return NextResponse.json(
      { error: "Failed to send notification" },
      { status: 500 }
    )
  }
}

function buildNotificationEmails(
  order: any,
  notificationType: NotificationType,
  rejectionReason?: string
): NotificationEmail[] {
  const orderRef = order.order_number || String(order.id).slice(0, 8)

  if (notificationType === "created") {
    return [
      {
        to: [INTERNAL_NOTIFICATION_EMAIL],
        subject: `Nueva Orden de Compra - ${orderRef}`,
        html: generateOrderEmailHTML(order),
      },
    ]
  }

  const recipients = uniqueEmails([
    order.aliado?.email,
    order.distributor?.contact_email,
    order.customer_email,
  ])

  if (recipients.length === 0) {
    return []
  }

  const subjectPrefix = notificationType === "approved" ? "Orden Aprobada" : "Orden Rechazada"
  return [
    {
      to: recipients,
      subject: `${subjectPrefix} - ${orderRef}`,
      html: generateOrderStatusEmailHTML(order, notificationType, rejectionReason),
    },
  ]
}

function uniqueEmails(candidates: Array<string | null | undefined>): string[] {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return [...new Set(
    candidates
      .map((email) => email?.trim().toLowerCase())
      .filter((email): email is string => Boolean(email && emailRegex.test(email)))
  )]
}

function generateOrderEmailHTML(order: any): string {
  const itemsHTML = order.items?.map((item: any) => `
    <tr>
      <td style="padding: 8px; border: 1px solid #ddd;">${item.product_name || item.product_code}</td>
      <td style="padding: 8px; border: 1px solid #ddd; text-align: center;">${item.quantity}</td>
      <td style="padding: 8px; border: 1px solid #ddd; text-align: right;">$${item.unit_price.toFixed(2)}</td>
      <td style="padding: 8px; border: 1px solid #ddd; text-align: right;">$${item.subtotal.toFixed(2)}</td>
    </tr>
  `).join('') || ''

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Nueva Orden de Compra</title>
    </head>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
      <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
        <h1 style="color: #2563eb; border-bottom: 2px solid #2563eb; padding-bottom: 10px;">
          Nueva Orden de Compra
        </h1>
        
        <div style="background-color: #f3f4f6; padding: 15px; border-radius: 5px; margin: 20px 0;">
          <h2 style="margin-top: 0;">Información de la Orden</h2>
          <p><strong>Referencia:</strong> ${order.order_number || order.id.slice(0, 8)}</p>
          <p><strong>Fecha:</strong> ${order.created_at ? new Date(order.created_at).toLocaleDateString() : "N/D"}</p>
          <p><strong>Estado:</strong> ${order.status}</p>
        </div>

        <div style="background-color: #f3f4f6; padding: 15px; border-radius: 5px; margin: 20px 0;">
          <h2 style="margin-top: 0;">Información del Aliado</h2>
          <p><strong>Empresa:</strong> ${order.aliado?.company_name || 'N/D'}</p>
          <p><strong>Contacto:</strong> ${order.aliado?.contact_name || 'N/D'}</p>
          <p><strong>Email:</strong> ${order.aliado?.email || 'N/D'}</p>
        </div>

        <div style="background-color: #f3f4f6; padding: 15px; border-radius: 5px; margin: 20px 0;">
          <h2 style="margin-top: 0;">Información del Distribuidor</h2>
          <p><strong>Empresa:</strong> ${order.distributor?.company_name || order.customer_name || 'N/D'}</p>
          <p><strong>Contacto:</strong> ${order.distributor?.contact_name || 'N/D'}</p>
          <p><strong>Email:</strong> ${order.distributor?.contact_email || order.customer_email || 'N/D'}</p>
        </div>

        <h2>Productos</h2>
        <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
          <thead>
            <tr style="background-color: #2563eb; color: white;">
              <th style="padding: 10px; border: 1px solid #ddd; text-align: left;">Producto</th>
              <th style="padding: 10px; border: 1px solid #ddd; text-align: center;">Cantidad</th>
              <th style="padding: 10px; border: 1px solid #ddd; text-align: right;">Precio Unit.</th>
              <th style="padding: 10px; border: 1px solid #ddd; text-align: right;">Subtotal</th>
            </tr>
          </thead>
          <tbody>
            ${itemsHTML}
          </tbody>
        </table>

        <div style="background-color: #2563eb; color: white; padding: 15px; border-radius: 5px; margin: 20px 0;">
          <div style="display: flex; justify-content: space-between; align-items: center;">
            <h2 style="margin: 0;">Total</h2>
            <h2 style="margin: 0;">$${order.total.toFixed(2)}</h2>
          </div>
          ${order.discount_percentage ? `
            <p style="margin: 5px 0 0 0; font-size: 14px;">
              Descuento aplicado: ${order.discount_percentage}%
            </p>
          ` : ''}
        </div>

        ${order.notes ? `
          <div style="background-color: #fef3c7; padding: 15px; border-radius: 5px; margin: 20px 0;">
            <h3 style="margin-top: 0;">Notas</h3>
            <p>${order.notes}</p>
          </div>
        ` : ''}

        <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd; text-align: center; color: #666; font-size: 12px;">
          <p>Este es un correo automático generado por el sistema Mesanova.</p>
          <p>Para aprobar o rechazar esta orden, ingresa al panel de administración.</p>
        </div>
      </div>
    </body>
    </html>
  `
}

function generateOrderStatusEmailHTML(
  order: any,
  notificationType: Exclude<NotificationType, "created">,
  rejectionReason?: string
): string {
  const isApproved = notificationType === "approved"
  const title = isApproved ? "Tu orden fue aprobada" : "Tu orden fue rechazada"
  const statusLabel = isApproved ? "Aprobada" : "Rechazada"
  const statusColor = isApproved ? "#16a34a" : "#dc2626"
  const reason = !isApproved ? (rejectionReason || order.rejected_reason || "No especificada") : null

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>${title}</title>
    </head>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
      <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
        <h1 style="color: ${statusColor}; border-bottom: 2px solid ${statusColor}; padding-bottom: 10px;">
          ${title}
        </h1>

        <div style="background-color: #f3f4f6; padding: 15px; border-radius: 5px; margin: 20px 0;">
          <p><strong>Referencia:</strong> ${order.order_number || order.id.slice(0, 8)}</p>
          <p><strong>Estado:</strong> <span style="color: ${statusColor}; font-weight: bold;">${statusLabel}</span></p>
          <p><strong>Total:</strong> $${Number(order.total || 0).toFixed(2)}</p>
          <p><strong>Fecha:</strong> ${order.created_at ? new Date(order.created_at).toLocaleDateString() : "N/D"}</p>
        </div>

        ${reason ? `
          <div style="background-color: #fef2f2; padding: 15px; border-radius: 5px; margin: 20px 0;">
            <h3 style="margin-top: 0; color: #b91c1c;">Motivo del rechazo</h3>
            <p style="margin-bottom: 0;">${reason}</p>
          </div>
        ` : ""}

        <div style="margin-top: 24px;">
          <p>Si tienes dudas sobre esta orden, por favor contacta al equipo de Mesanova.</p>
        </div>
      </div>
    </body>
    </html>
  `
}
