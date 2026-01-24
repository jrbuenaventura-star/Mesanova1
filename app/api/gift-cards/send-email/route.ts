import { NextResponse } from 'next/server'
import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

export async function POST(request: Request) {
  try {
    const { giftCard, type } = await request.json()

    if (!giftCard) {
      return NextResponse.json({ error: 'Gift card data required' }, { status: 400 })
    }

    const emailType = type || 'purchase'
    let subject = ''
    let htmlContent = ''

    if (emailType === 'purchase') {
      subject = `Tu Bono de Regalo Mesanova - ${giftCard.code}`
      htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
            .code-box { background: white; border: 2px dashed #667eea; padding: 20px; text-align: center; margin: 20px 0; border-radius: 8px; }
            .code { font-size: 32px; font-weight: bold; color: #667eea; letter-spacing: 2px; font-family: monospace; }
            .amount { font-size: 24px; color: #2d3748; margin: 10px 0; }
            .button { display: inline-block; background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
            .footer { text-align: center; color: #666; font-size: 12px; margin-top: 30px; }
            .info-box { background: #e6fffa; border-left: 4px solid #38b2ac; padding: 15px; margin: 20px 0; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🎁 ¡Tu Bono de Regalo está Listo!</h1>
            </div>
            <div class="content">
              <p>Hola ${giftCard.recipient_name || 'Cliente'},</p>
              
              ${giftCard.personal_message ? `
                <div class="info-box">
                  <strong>Mensaje especial:</strong><br>
                  "${giftCard.personal_message}"
                  <br><br>
                  <em>- De parte de ${giftCard.purchaser_name}</em>
                </div>
              ` : ''}
              
              <p>¡Tienes un bono de regalo de Mesanova! Aquí están los detalles:</p>
              
              <div class="code-box">
                <div class="code">${giftCard.code}</div>
                <div class="amount">Valor: $${Number(giftCard.initial_amount).toLocaleString('es-CO')}</div>
                <p style="color: #666; font-size: 14px; margin-top: 10px;">
                  Válido hasta: ${new Date(giftCard.expires_at).toLocaleDateString('es-CO', { year: 'numeric', month: 'long', day: 'numeric' })}
                </p>
              </div>
              
              <h3>¿Cómo usar tu bono?</h3>
              <ol>
                <li>Agrega productos a tu carrito en mesanova.co</li>
                <li>Ve al checkout</li>
                <li>Ingresa el código del bono en el campo correspondiente</li>
                <li>¡El descuento se aplicará automáticamente!</li>
              </ol>
              
              <div style="text-align: center;">
                <a href="https://mesanova.co/productos" class="button">Comprar Ahora</a>
              </div>
              
              <div class="info-box">
                <strong>💡 Importante:</strong><br>
                • El bono es válido por 12 meses desde la fecha de compra<br>
                • Puedes usar el bono en múltiples compras hasta agotar el saldo<br>
                • No es canjeable por dinero en efectivo<br>
                • Guarda este email para futuras referencias
              </div>
              
              <p>Si tienes alguna pregunta, no dudes en contactarnos.</p>
              
              <p>¡Gracias por elegir Mesanova!</p>
            </div>
            <div class="footer">
              <p>Mesanova - Artículos para Cocina, Mesa y Hogar</p>
              <p>Este es un email automático, por favor no respondas a este mensaje.</p>
            </div>
          </div>
        </body>
        </html>
      `
    } else if (emailType === 'reminder') {
      const daysUntilExpiry = Math.ceil((new Date(giftCard.expires_at).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
      
      subject = `Recordatorio: Tu Bono Mesanova expira en ${daysUntilExpiry} días`
      htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #f59e0b; color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
            .code-box { background: white; border: 2px solid #f59e0b; padding: 20px; text-align: center; margin: 20px 0; border-radius: 8px; }
            .code { font-size: 28px; font-weight: bold; color: #f59e0b; letter-spacing: 2px; font-family: monospace; }
            .button { display: inline-block; background: #f59e0b; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
            .footer { text-align: center; color: #666; font-size: 12px; margin-top: 30px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>⏰ ¡No dejes que tu bono expire!</h1>
            </div>
            <div class="content">
              <p>Hola ${giftCard.recipient_name},</p>
              
              <p>Te recordamos que tu bono de regalo de Mesanova expirará pronto.</p>
              
              <div class="code-box">
                <div class="code">${giftCard.code}</div>
                <p style="margin: 10px 0;">
                  Saldo disponible: <strong>$${Number(giftCard.current_balance).toLocaleString('es-CO')}</strong>
                </p>
                <p style="color: #dc2626; font-weight: bold;">
                  ⚠️ Expira en ${daysUntilExpiry} días
                </p>
              </div>
              
              <p>¡No pierdas la oportunidad de usar tu bono! Tenemos productos increíbles esperándote.</p>
              
              <div style="text-align: center;">
                <a href="https://mesanova.co/productos" class="button">Usar Mi Bono Ahora</a>
              </div>
            </div>
            <div class="footer">
              <p>Mesanova - Artículos para Cocina, Mesa y Hogar</p>
            </div>
          </div>
        </body>
        </html>
      `
    }

    const { data, error } = await resend.emails.send({
      from: 'Mesanova <noreply@mesanova.co>',
      to: [giftCard.recipient_email],
      subject,
      html: htmlContent,
    })

    if (error) {
      throw error
    }

    return NextResponse.json({ success: true, data })
  } catch (error) {
    console.error('Error sending gift card email:', error)
    return NextResponse.json({ error: 'Failed to send email' }, { status: 500 })
  }
}
