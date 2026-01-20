import type { OrderStatus } from "@/lib/db/types"

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  borrador: "Borrador",
  por_aprobar: "Por Aprobar",
  aprobada: "Aprobada",
  en_preparacion: "En Preparación",
  enviada: "Enviada",
  entregada: "Entregada",
  cancelada: "Cancelada",
  devuelta_rechazada: "Devuelta/Rechazada",
}

export const ORDER_STATUS_COLORS: Record<OrderStatus, "default" | "secondary" | "destructive" | "outline"> = {
  borrador: "secondary",
  por_aprobar: "outline",
  aprobada: "default",
  en_preparacion: "default",
  enviada: "default",
  entregada: "default",
  cancelada: "destructive",
  devuelta_rechazada: "destructive",
}

export function getOrderStatusLabel(status: OrderStatus): string {
  return ORDER_STATUS_LABELS[status] || status
}

export function getOrderStatusColor(status: OrderStatus): "default" | "secondary" | "destructive" | "outline" {
  return ORDER_STATUS_COLORS[status] || "secondary"
}
