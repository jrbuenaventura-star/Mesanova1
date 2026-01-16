export interface CartItem {
  id: string
  productId: string
  productCode: string
  name: string
  price: number
  quantity: number
  imageUrl?: string
  maxStock: number
  slug: string
  silo: string
}

export interface Cart {
  items: CartItem[]
  total: number
  itemCount: number
}
