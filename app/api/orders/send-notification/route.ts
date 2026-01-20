import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"
import { Resend } from "resend"

export async function POST(request: Request) {
  try {
    const { orderId } = await request.json()

    if (!orderId) {
      return NextResponse.json(
        { error: "Order ID is required" },
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
        aliado:aliados(company_name, contact_name, email),
        items:order_items(*)
      `)
      .eq("id", orderId)
      .single()

    if (orderError || !order) {
      return NextResponse.json(
        { error: "Order not found" },
        { status: 404 }
      )
    }

    // Preparar datos del email
    const emailData = {
      to: "atencion@alumaronline.com",
      subject: `Nueva Orden de Compra - ${order.order_number}`,
      html: generateOrderEmailHTML(order),
    }

    const resend = new Resend(resendApiKey)
    const { error: emailError } = await resend.emails.send({
      from: resendFrom,
      to: emailData.to,
      subject: emailData.subject,
      html: emailData.html,
    })

    if (emailError) {
      console.error("Resend error:", emailError)
      return NextResponse.json({ error: "Failed to send email" }, { status: 502 })
    }

    return NextResponse.json({
      success: true,
      message: "Notification sent successfully",
    })
  } catch (error) {
    console.error("Error sending notification:", error)
    return NextResponse.json(
      { error: "Failed to send notification" },
      { status: 500 }
    )
  }
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
          <p><strong>Número de Orden:</strong> ${order.order_number || order.id.slice(0, 8)}</p>
          <p><strong>Fecha:</strong> ${new Date(order.fecha_pedido).toLocaleDateString()}</p>
          <p><strong>Estado:</strong> ${order.status}</p>
        </div>

        <div style="background-color: #f3f4f6; padding: 15px; border-radius: 5px; margin: 20px 0;">
          <h2 style="margin-top: 0;">Información del Aliado</h2>
          <p><strong>Empresa:</strong> ${order.aliado?.company_name || 'N/A'}</p>
          <p><strong>Contacto:</strong> ${order.aliado?.contact_name || 'N/A'}</p>
          <p><strong>Email:</strong> ${order.aliado?.email || 'N/A'}</p>
        </div>

        <div style="background-color: #f3f4f6; padding: 15px; border-radius: 5px; margin: 20px 0;">
          <h2 style="margin-top: 0;">Información del Distribuidor</h2>
          <p><strong>Empresa:</strong> ${order.distributor?.company_name || order.customer_name || 'N/A'}</p>
          <p><strong>Contacto:</strong> ${order.distributor?.contact_name || 'N/A'}</p>
          <p><strong>Email:</strong> ${order.distributor?.contact_email || order.customer_email || 'N/A'}</p>
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
