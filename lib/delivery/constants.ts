export const DELIVERY_OTP_LENGTH = 6
export const DELIVERY_OTP_TTL_MINUTES = 10
export const DELIVERY_OTP_RATE_LIMIT_WINDOW_MINUTES = 15
export const DELIVERY_OTP_RATE_LIMIT_MAX_REQUESTS = 5
export const DELIVERY_SESSION_TTL_MINUTES = 20
export const DELIVERY_QR_DEFAULT_TTL_MINUTES = 60 * 24

export const DELIVERY_DISPATCH_EMAIL = "despachos@alumaronline.com"

export function buildLegalClause(orderId: string) {
  return `Declaro que he recibido el pedido identificado con el número ${orderId}, correspondiente a los bultos verificados anteriormente. La validación realizada mediante OTP y firma digital constituye constancia de entrega conforme, salvo las incidencias registradas en este acto.`
}
