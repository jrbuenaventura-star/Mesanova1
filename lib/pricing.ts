/**
 * Pricing utilities for Mesanova
 * Handles different pricing logic for public catalog vs distributor catalog
 */

export interface Product {
  precio: number | null
  descuento_porcentaje: number | null
  precio_dist: number | null
  desc_dist: number | null
}

export interface Distributor {
  discount_percentage: number
}

export interface PricingResult {
  // For public catalog
  publicPrice: number
  publicOriginalPrice: number | null
  publicDiscount: number
  publicHasDiscount: boolean

  // For distributor catalog
  distributorSuggestedPrice: number | null
  distributorBasePrice: number | null
  distributorNetPrice: number | null
  distributorDiscount: number | null
  distributorProductDiscount: number | null
}

/**
 * Calculate pricing for a product based on user type
 * @param product Product with pricing fields
 * @param distributor Optional distributor info if user has one assigned
 * @returns Pricing information for display
 */
export function calculateProductPricing(
  product: Product,
  distributor?: Distributor | null
): PricingResult {
  const precio = product.precio || 0
  const descuentoPublico = product.descuento_porcentaje || 0
  const precioDistribuidor = product.precio_dist || null

  // Public catalog pricing (applies only if user has NO distributor)
  const publicHasDiscount = !distributor && descuentoPublico > 0
  const publicPrice = publicHasDiscount ? precio * (1 - descuentoPublico / 100) : precio
  const publicOriginalPrice = publicHasDiscount ? precio : null

  // Distributor catalog pricing (applies only if user HAS distributor)
  let distributorSuggestedPrice: number | null = null
  let distributorBasePrice: number | null = null
  let distributorNetPrice: number | null = null
  let distributorDiscount: number | null = null
  let distributorProductDiscount: number | null = null

  if (distributor) {
    const distributorBase = precioDistribuidor ?? precio
    distributorSuggestedPrice = precio // Precio sugerido al público
    distributorBasePrice = distributorBase // Precio base para distribuidores
    distributorDiscount = distributor.discount_percentage
    distributorProductDiscount = null
    // Tu precio = Precio_Dist (o precio público fallback) menos descuento del distribuidor
    distributorNetPrice = distributorBase * (1 - distributorDiscount / 100)
  }

  return {
    publicPrice,
    publicOriginalPrice,
    publicDiscount: descuentoPublico,
    publicHasDiscount,
    distributorSuggestedPrice,
    distributorBasePrice,
    distributorNetPrice,
    distributorDiscount,
    distributorProductDiscount,
  }
}

/**
 * Full distributor record for qualification check
 */
export interface DistributorFull {
  aliado_id?: string | null
  business_type?: string | null
  commercial_name?: string | null
  is_active: boolean
  discount_percentage: number
}

/**
 * Check if a distributor record qualifies for distributor pricing.
 * Qualified = active + has aliado assigned + business_type "Tienda".
 */
export function isQualifiedDistributor(d: DistributorFull | null | undefined): boolean {
  if (!d || !d.is_active) return false
  if (!d.aliado_id) return false
  const bt = (d.business_type || '').trim()
  return bt.toLowerCase() === 'tienda'
}

/**
 * Format price in Colombian Pesos
 */
export function formatPrice(price: number | null): string {
  if (price === null || price === undefined) return '$0'
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(price)
}

/**
 * Check if product should be shown in Ofertas page
 * Only products with descuento_porcentaje > 0 appear in Ofertas
 */
export function isProductOnSale(product: Product): boolean {
  return (product.descuento_porcentaje || 0) > 0
}
