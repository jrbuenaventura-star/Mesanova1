"use client"

import { useCart } from "@/contexts/cart-context"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Minus, Plus, Trash2, ShoppingBag, ArrowLeft } from "lucide-react"
import Link from "next/link"
import Image from "next/image"
import { toast } from "sonner"

export default function CartPage() {
  const { cart, updateQuantity, removeItem, clearCart } = useCart()

  const handleUpdateQuantity = (productId: string, newQuantity: number, maxStock: number) => {
    if (newQuantity > maxStock) {
      toast.error("Stock insuficiente", {
        description: `Solo hay ${maxStock} unidades disponibles`
      })
      return
    }
    updateQuantity(productId, newQuantity)
  }

  const handleRemoveItem = (productId: string, productName: string) => {
    removeItem(productId)
    toast.success("Producto eliminado", {
      description: `${productName} fue eliminado del carrito`
    })
  }

  const handleClearCart = () => {
    if (confirm("¿Estás seguro de que quieres vaciar el carrito?")) {
      clearCart()
      toast.success("Carrito vaciado")
    }
  }

  if (cart.items.length === 0) {
    return (
      <div className="container mx-auto py-16 px-4">
        <Card className="max-w-md mx-auto text-center">
          <CardHeader>
            <div className="mx-auto mb-4 h-24 w-24 rounded-full bg-muted flex items-center justify-center">
              <ShoppingBag className="h-12 w-12 text-muted-foreground" />
            </div>
            <CardTitle className="text-2xl">Tu carrito está vacío</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-6">
              Agrega productos a tu carrito para continuar con tu compra
            </p>
            <Button asChild size="lg">
              <Link href="/productos">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Explorar Productos
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-3xl font-bold">Carrito de Compras</h1>
        <Button variant="ghost" asChild>
          <Link href="/productos">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Seguir Comprando
          </Link>
        </Button>
      </div>

      <div className="grid gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-4">
          {cart.items.map((item) => (
            <Card key={item.id}>
              <CardContent className="p-6">
                <div className="flex gap-4">
                  <div className="relative h-24 w-24 flex-shrink-0 overflow-hidden rounded-lg border">
                    {item.imageUrl ? (
                      <Image
                        src={item.imageUrl}
                        alt={item.name}
                        fill
                        className="object-cover"
                      />
                    ) : (
                      <div className="h-full w-full bg-muted flex items-center justify-center">
                        <ShoppingBag className="h-8 w-8 text-muted-foreground" />
                      </div>
                    )}
                  </div>

                  <div className="flex-1 space-y-2">
                    <div className="flex items-start justify-between">
                      <div>
                        <Link 
                          href={`/productos/${item.silo}/${item.slug}`}
                          className="font-semibold hover:text-primary transition-colors"
                        >
                          {item.name}
                        </Link>
                        <p className="text-sm text-muted-foreground">Código: {item.productCode}</p>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleRemoveItem(item.productId, item.name)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => handleUpdateQuantity(item.productId, item.quantity - 1, item.maxStock)}
                          disabled={item.quantity <= 1}
                        >
                          <Minus className="h-3 w-3" />
                        </Button>
                        <span className="w-12 text-center font-medium">{item.quantity}</span>
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => handleUpdateQuantity(item.productId, item.quantity + 1, item.maxStock)}
                          disabled={item.quantity >= item.maxStock}
                        >
                          <Plus className="h-3 w-3" />
                        </Button>
                        <span className="text-sm text-muted-foreground ml-2">
                          (Máx: {item.maxStock})
                        </span>
                      </div>

                      <div className="text-right">
                        <p className="font-semibold text-lg">
                          ${(item.price * item.quantity).toLocaleString("es-CO", { minimumFractionDigits: 2 })}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          ${item.price.toLocaleString("es-CO", { minimumFractionDigits: 2 })} c/u
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}

          <div className="flex justify-end">
            <Button variant="outline" onClick={handleClearCart}>
              <Trash2 className="mr-2 h-4 w-4" />
              Vaciar Carrito
            </Button>
          </div>
        </div>

        <div className="lg:col-span-1">
          <Card className="sticky top-4">
            <CardHeader>
              <CardTitle>Resumen del Pedido</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Subtotal ({cart.itemCount} {cart.itemCount === 1 ? "producto" : "productos"})</span>
                  <span className="font-medium">
                    ${cart.total.toLocaleString("es-CO", { minimumFractionDigits: 2 })}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Envío</span>
                  <span className="font-medium">
                    {cart.total >= 200000 ? (
                      <span className="text-green-600">Gratis</span>
                    ) : (
                      "Calculado en checkout"
                    )}
                  </span>
                </div>
                {cart.total < 200000 && (
                  <p className="text-xs text-muted-foreground">
                    Agrega ${(200000 - cart.total).toLocaleString("es-CO")} más para envío gratis
                  </p>
                )}
              </div>

              <Separator />

              <div className="flex justify-between text-lg font-bold">
                <span>Total</span>
                <span>${cart.total.toLocaleString("es-CO", { minimumFractionDigits: 2 })}</span>
              </div>
            </CardContent>
            <CardFooter className="flex flex-col gap-2">
              <Button size="lg" className="w-full" asChild>
                <Link href="/checkout">
                  Proceder al Checkout
                </Link>
              </Button>
              <Button variant="outline" size="lg" className="w-full" asChild>
                <Link href="/productos">
                  Continuar Comprando
                </Link>
              </Button>
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  )
}
