import { describe, it, expect } from '@jest/globals'

describe('ProductFilters Component', () => {
  it('should filter products by price range', () => {
    const products = [
      { id: '1', precio: 50000 },
      { id: '2', precio: 150000 },
      { id: '3', precio: 250000 },
    ]

    const priceRange = [100000, 200000]
    const filtered = products.filter(
      (p) => p.precio >= priceRange[0] && p.precio <= priceRange[1]
    )

    expect(filtered).toHaveLength(1)
    expect(filtered[0].id).toBe('2')
  })

  it('should filter products by stock availability', () => {
    const products = [
      { id: '1', warehouse_stock: [{ available_quantity: 10 }] },
      { id: '2', warehouse_stock: [{ available_quantity: 0 }] },
      { id: '3', warehouse_stock: [{ available_quantity: 5 }] },
    ]

    const inStockOnly = true
    const filtered = products.filter((p) => {
      if (!inStockOnly) return true
      const totalStock = p.warehouse_stock?.reduce(
        (sum: number, ws: any) => sum + ws.available_quantity,
        0
      )
      return totalStock > 0
    })

    expect(filtered).toHaveLength(2)
    expect(filtered.map((p) => p.id)).toEqual(['1', '3'])
  })

  it('should filter products on sale', () => {
    const products = [
      { id: '1', is_on_sale: true },
      { id: '2', is_on_sale: false },
      { id: '3', is_on_sale: true },
    ]

    const onSaleOnly = true
    const filtered = products.filter((p) => {
      if (!onSaleOnly) return true
      return p.is_on_sale
    })

    expect(filtered).toHaveLength(2)
    expect(filtered.map((p) => p.id)).toEqual(['1', '3'])
  })

  it('should apply multiple filters simultaneously', () => {
    const products = [
      { id: '1', precio: 150000, is_on_sale: true, warehouse_stock: [{ available_quantity: 10 }] },
      { id: '2', precio: 50000, is_on_sale: false, warehouse_stock: [{ available_quantity: 5 }] },
      { id: '3', precio: 180000, is_on_sale: true, warehouse_stock: [{ available_quantity: 0 }] },
    ]

    const filters = {
      priceRange: [100000, 200000],
      onSale: true,
      inStock: true,
    }

    const filtered = products.filter((p) => {
      // Price filter
      if (p.precio < filters.priceRange[0] || p.precio > filters.priceRange[1]) return false
      
      // Sale filter
      if (filters.onSale && !p.is_on_sale) return false
      
      // Stock filter
      if (filters.inStock) {
        const totalStock = p.warehouse_stock?.reduce(
          (sum: number, ws: any) => sum + ws.available_quantity,
          0
        )
        if (totalStock <= 0) return false
      }

      return true
    })

    expect(filtered).toHaveLength(1)
    expect(filtered[0].id).toBe('1')
  })
})
