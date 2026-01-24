import { Resend } from 'resend'

interface EmailNotification {
  to: string
  subject: string
  html: string
}

export async function sendPQRSNotification(notification: EmailNotification) {
  try {
    const resendApiKey = process.env.RESEND_API_KEY
    const resendFrom = process.env.RESEND_FROM

    if (!resendApiKey) {
      throw new Error('RESEND_API_KEY is not configured')
    }

    if (!resendFrom) {
      throw new Error('RESEND_FROM is not configured')
    }

    const resend = new Resend(resendApiKey)
    const { error } = await resend.emails.send({
      from: resendFrom,
      to: notification.to,
      subject: notification.subject,
      html: notification.html,
    })

    if (error) {
      throw error
    }

    return { success: true }
  } catch (error) {
    console.error('Error sending PQRS notification:', error)
    return { success: false, error }
  }
}

export function getTicketStatusChangeEmail(
  ticketNumber: string,
  asunto: string,
  estadoAnterior: string,
  estadoNuevo: string,
  resolucion?: string
) {
  const estadoLabels: Record<string, string> = {
    nuevo: 'Nuevo',
    en_proceso: 'En Proceso',
    pendiente: 'Pendiente',
    resuelto: 'Resuelto',
    cerrado: 'Cerrado',
  }

  let html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: #4F46E5; color: white; padding: 20px; text-align: center; }
        .content { background-color: #f9f9f9; padding: 20px; margin-top: 20px; }
        .ticket-info { background-color: white; padding: 15px; margin: 15px 0; border-left: 4px solid #4F46E5; }
        .status-change { padding: 15px; margin: 15px 0; background-color: #EEF2FF; border-radius: 5px; }
        .resolution { background-color: #D1FAE5; padding: 15px; margin: 15px 0; border-radius: 5px; }
        .footer { text-align: center; margin-top: 20px; font-size: 12px; color: #666; }
        .button { display: inline-block; padding: 12px 24px; background-color: #4F46E5; color: white; text-decoration: none; border-radius: 5px; margin-top: 15px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Actualización de Ticket</h1>
        </div>
        <div class="content">
          <div class="ticket-info">
            <h2>Ticket ${ticketNumber}</h2>
            <p><strong>Asunto:</strong> ${asunto}</p>
          </div>
          
          <div class="status-change">
            <h3>Cambio de Estado</h3>
            <p>El estado de tu ticket ha cambiado:</p>
            <p><strong>${estadoLabels[estadoAnterior] || estadoAnterior}</strong> → <strong>${estadoLabels[estadoNuevo] || estadoNuevo}</strong></p>
          </div>
  `

  if (resolucion && estadoNuevo === 'resuelto') {
    html += `
          <div class="resolution">
            <h3>Resolución</h3>
            <p>${resolucion.replace(/\n/g, '<br>')}</p>
          </div>
    `
  }

  html += `
          <p>Puedes ver los detalles completos de tu ticket y agregar comentarios adicionales haciendo clic en el botón de abajo:</p>
          
          <a href="${process.env.NEXT_PUBLIC_SITE_URL}/distributor/pqrs" class="button">Ver Mis Tickets</a>
        </div>
        
        <div class="footer">
          <p>Este es un correo automático del sistema de PQRs de Mesanova.</p>
          <p>Por favor no respondas a este correo.</p>
        </div>
      </div>
    </body>
    </html>
  `

  return html
}

export function getNewTicketNotificationEmail(
  ticketNumber: string,
  tipo: string,
  asunto: string,
  descripcion: string,
  prioridad: string,
  creadoPor: string,
  creadoPorEmail: string
) {
  const tipoLabels: Record<string, string> = {
    peticion: 'Petición',
    queja: 'Queja',
    reclamo: 'Reclamo',
    sugerencia: 'Sugerencia',
  }

  const prioridadLabels: Record<string, string> = {
    baja: 'Baja',
    media: 'Media',
    alta: 'Alta',
    urgente: 'Urgente',
  }

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: #4F46E5; color: white; padding: 20px; text-align: center; }
        .content { background-color: #f9f9f9; padding: 20px; margin-top: 20px; }
        .ticket-info { background-color: white; padding: 15px; margin: 15px 0; border-left: 4px solid #4F46E5; }
        .priority-${prioridad} { color: ${prioridad === 'urgente' ? '#DC2626' : prioridad === 'alta' ? '#F59E0B' : '#6B7280'}; font-weight: bold; }
        .button { display: inline-block; padding: 12px 24px; background-color: #4F46E5; color: white; text-decoration: none; border-radius: 5px; margin-top: 15px; }
        .footer { text-align: center; margin-top: 20px; font-size: 12px; color: #666; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Nuevo Ticket Creado</h1>
        </div>
        <div class="content">
          <div class="ticket-info">
            <h2>Ticket ${ticketNumber}</h2>
            <p><strong>Tipo:</strong> ${tipoLabels[tipo] || tipo}</p>
            <p><strong>Prioridad:</strong> <span class="priority-${prioridad}">${prioridadLabels[prioridad] || prioridad}</span></p>
            <p><strong>Asunto:</strong> ${asunto}</p>
            <p><strong>Descripción:</strong></p>
            <p>${descripcion.replace(/\n/g, '<br>')}</p>
            <hr>
            <p><strong>Creado por:</strong> ${creadoPor} (${creadoPorEmail})</p>
          </div>
          
          <a href="${process.env.NEXT_PUBLIC_SITE_URL}/admin/pqrs" class="button">Gestionar Tickets</a>
        </div>
        
        <div class="footer">
          <p>Este es un correo automático del sistema de PQRs de Mesanova.</p>
        </div>
      </div>
    </body>
    </html>
  `

  return html
}

export function getTaskAssignmentEmail(
  ticketNumber: string,
  taskTitulo: string,
  taskDescripcion: string,
  asignadoPor: string
) {
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: #4F46E5; color: white; padding: 20px; text-align: center; }
        .content { background-color: #f9f9f9; padding: 20px; margin-top: 20px; }
        .task-info { background-color: white; padding: 15px; margin: 15px 0; border-left: 4px solid #F59E0B; }
        .button { display: inline-block; padding: 12px 24px; background-color: #4F46E5; color: white; text-decoration: none; border-radius: 5px; margin-top: 15px; }
        .footer { text-align: center; margin-top: 20px; font-size: 12px; color: #666; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Nueva Tarea Asignada</h1>
        </div>
        <div class="content">
          <div class="task-info">
            <h2>${taskTitulo}</h2>
            <p><strong>Ticket:</strong> ${ticketNumber}</p>
            ${taskDescripcion ? `<p><strong>Descripción:</strong></p><p>${taskDescripcion.replace(/\n/g, '<br>')}</p>` : ''}
            <hr>
            <p><strong>Asignado por:</strong> ${asignadoPor}</p>
          </div>
          
          <a href="${process.env.NEXT_PUBLIC_SITE_URL}/admin/pqrs" class="button">Ver Tarea</a>
        </div>
        
        <div class="footer">
          <p>Este es un correo automático del sistema de PQRs de Mesanova.</p>
        </div>
      </div>
    </body>
    </html>
  `

  return html
}
