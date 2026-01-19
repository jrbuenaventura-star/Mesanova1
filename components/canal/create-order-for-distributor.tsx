'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import {
  Search,
  Plus,
  Minus,
  Trash2,
  ShoppingCart,
  Building,
  Package,
  DollarSign,
  AlertCircle,
  CheckCircle,
  Loader2,
  X,
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';

interface AssignedDistributor {
  id: string;
  companyName: string;
  rif: string;
  discountPercentage: number;
  minimumOrder: number;
  creditLimit: number;
  currentBalance: number;
  creditDays: number;
}

interface Product {
  id: string;
  code: string;
  name: string;
  price: number;
  stock: number;
  image: string;
  category: string;
  rotacion: string;
}

interface CartItem {
  product: Product;
  quantity: number;
  unitPrice: number;
  discountedPrice: number;
  subtotal: number;
}

interface CreateOrderForDistributorProps {
  agentId: string;
}

export function CreateOrderForDistributor({ agentId }: CreateOrderForDistributorProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [distributors, setDistributors] = useState<AssignedDistributor[]>([]);
  const [selectedDistributor, setSelectedDistributor] = useState<AssignedDistributor | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [notes, setNotes] = useState('');
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState(false);
  const [orderNumber, setOrderNumber] = useState('');

  useEffect(() => {
    fetchInitialData();
  }, [agentId]);

  const fetchInitialData = async () => {
    setLoading(true);
    try {
      // Simular carga de distribuidores asignados
      setDistributors([
        { id: '1', companyName: 'Distribuidora El Éxito', rif: 'J-12345678-9', discountPercentage: 20, minimumOrder: 500000, creditLimit: 100000000, currentBalance: 25000000, creditDays: 30 },
        { id: '2', companyName: 'Comercial La Gran Tienda', rif: 'J-23456789-0', discountPercentage: 15, minimumOrder: 300000, creditLimit: 75000000, currentBalance: 18000000, creditDays: 30 },
        { id: '3', companyName: 'Almacén Don José', rif: 'J-34567890-1', discountPercentage: 12, minimumOrder: 200000, creditLimit: 30000000, currentBalance: 5000000, creditDays: 15 },
      ]);

      // Simular carga de productos
      setProducts([
        { id: '1', code: 'ABC-001', name: 'Tabla de Cortar Bambú Premium', price: 89900, stock: 150, image: '/bamboo-cutting-board.png', category: 'Cocina', rotacion: 'alta' },
        { id: '2', code: 'DEF-002', name: 'Set de Cuchillos Profesionales', price: 199000, stock: 45, image: '/cookware-set.png', category: 'Cocina', rotacion: 'media' },
        { id: '3', code: 'GHI-003', name: 'Olla a Presión 6L', price: 199000, stock: 30, image: '/cookware-set.png', category: 'Cocina', rotacion: 'alta' },
        { id: '4', code: 'JKL-004', name: 'Vajilla Porcelana 24 piezas', price: 199000, stock: 25, image: '/crystal-wine-glasses.png', category: 'Mesa', rotacion: 'media' },
        { id: '5', code: 'MNO-005', name: 'Termo Acero Inoxidable 1L', price: 49000, stock: 200, image: '/cookware-set.png', category: 'Termos-Neveras', rotacion: 'alta' },
        { id: '6', code: 'PQR-006', name: 'Copa Vino Cristal x6', price: 85000, stock: 80, image: '/crystal-wine-glasses.png', category: 'Café-Té-Bar', rotacion: 'media' },
        { id: '7', code: 'STU-007', name: 'Bandeja Servir Madera', price: 65000, stock: 60, image: '/bamboo-cutting-board.png', category: 'Mesa', rotacion: 'baja' },
        { id: '8', code: 'VWX-008', name: 'Set Cubiertos 24 piezas', price: 120000, stock: 40, image: '/cookware-set.png', category: 'Mesa', rotacion: 'media' },
      ]);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredProducts = useMemo(() => {
    return products.filter(product => {
      const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           product.code.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = categoryFilter === 'all' || product.category === categoryFilter;
      return matchesSearch && matchesCategory;
    });
  }, [products, searchQuery, categoryFilter]);

  const categories = useMemo(() => {
    return [...new Set(products.map(p => p.category))];
  }, [products]);

  const addToCart = (product: Product) => {
    if (!selectedDistributor) return;

    const existingItem = cart.find(item => item.product.id === product.id);
    const discount = selectedDistributor.discountPercentage;
    const discountedPrice = product.price * (1 - discount / 100);

    if (existingItem) {
      setCart(cart.map(item =>
        item.product.id === product.id
          ? { ...item, quantity: item.quantity + 1, subtotal: (item.quantity + 1) * discountedPrice }
          : item
      ));
    } else {
      setCart([...cart, {
        product,
        quantity: 1,
        unitPrice: product.price,
        discountedPrice,
        subtotal: discountedPrice,
      }]);
    }
  };

  const updateQuantity = (productId: string, newQuantity: number) => {
    if (newQuantity <= 0) {
      removeFromCart(productId);
      return;
    }

    const product = products.find(p => p.id === productId);
    if (product && newQuantity > product.stock) {
      newQuantity = product.stock;
    }

    setCart(cart.map(item =>
      item.product.id === productId
        ? { ...item, quantity: newQuantity, subtotal: newQuantity * item.discountedPrice }
        : item
    ));
  };

  const removeFromCart = (productId: string) => {
    setCart(cart.filter(item => item.product.id !== productId));
  };

  const clearCart = () => {
    setCart([]);
  };

  const cartTotals = useMemo(() => {
    const subtotal = cart.reduce((sum, item) => sum + (item.unitPrice * item.quantity), 0);
    const discount = cart.reduce((sum, item) => sum + ((item.unitPrice - item.discountedPrice) * item.quantity), 0);
    const total = subtotal - discount;
    const itemCount = cart.reduce((sum, item) => sum + item.quantity, 0);
    return { subtotal, discount, total, itemCount };
  }, [cart]);

  const canSubmitOrder = useMemo(() => {
    if (!selectedDistributor) return false;
    if (cart.length === 0) return false;
    if (cartTotals.total < selectedDistributor.minimumOrder) return false;
    
    const availableCredit = selectedDistributor.creditLimit - selectedDistributor.currentBalance;
    if (cartTotals.total > availableCredit) return false;
    
    return true;
  }, [selectedDistributor, cart, cartTotals]);

  const handleSubmitOrder = async () => {
    if (!canSubmitOrder || !selectedDistributor) return;

    setSubmitting(true);
    try {
      // Simular envío de pedido
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Generar número de pedido
      const orderNum = `2026-${String(Math.floor(Math.random() * 999999)).padStart(6, '0')}`;
      setOrderNumber(orderNum);
      setOrderSuccess(true);
      setShowConfirmDialog(false);
    } catch (error) {
      console.error('Error submitting order:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDistributorChange = (distributorId: string) => {
    const distributor = distributors.find(d => d.id === distributorId);
    setSelectedDistributor(distributor || null);
    
    // Recalcular precios del carrito con nuevo descuento
    if (distributor) {
      setCart(cart.map(item => {
        const discountedPrice = item.unitPrice * (1 - distributor.discountPercentage / 100);
        return {
          ...item,
          discountedPrice,
          subtotal: item.quantity * discountedPrice,
        };
      }));
    }
  };

  const getRotacionBadge = (rotacion: string) => {
    const colors: Record<string, string> = {
      alta: 'bg-green-100 text-green-800',
      media: 'bg-yellow-100 text-yellow-800',
      baja: 'bg-red-100 text-red-800',
    };
    return <span className={`px-2 py-0.5 rounded text-xs font-medium ${colors[rotacion]}`}>{rotacion}</span>;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (orderSuccess) {
    return (
      <Card className="max-w-lg mx-auto">
        <CardContent className="py-12 text-center">
          <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-2">¡Pedido Creado!</h2>
          <p className="text-muted-foreground mb-4">
            El pedido ha sido registrado exitosamente
          </p>
          <div className="bg-muted p-4 rounded-lg mb-6">
            <p className="text-sm text-muted-foreground">Número de pedido</p>
            <p className="text-2xl font-mono font-bold">{orderNumber}</p>
          </div>
          <div className="flex gap-4 justify-center">
            <Button variant="outline" onClick={() => {
              setOrderSuccess(false);
              setCart([]);
              setNotes('');
            }}>
              Nuevo Pedido
            </Button>
            <Button onClick={() => router.push('/canal')}>
              Volver al Panel
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Columna izquierda: Selección de productos */}
      <div className="lg:col-span-2 space-y-6">
        {/* Selector de distribuidor */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2">
              <Building className="w-5 h-5" />
              Seleccionar Distribuidor
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Select
              value={selectedDistributor?.id || ''}
              onValueChange={handleDistributorChange}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecciona un distribuidor asignado" />
              </SelectTrigger>
              <SelectContent>
                {distributors.map(dist => (
                  <SelectItem key={dist.id} value={dist.id}>
                    <div className="flex items-center gap-2">
                      <span>{dist.companyName}</span>
                      <Badge variant="secondary">{dist.discountPercentage}% desc.</Badge>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {selectedDistributor && (
              <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Descuento</p>
                  <p className="font-semibold text-green-600">{selectedDistributor.discountPercentage}%</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Pedido mínimo</p>
                  <p className="font-semibold">${selectedDistributor.minimumOrder.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Crédito disponible</p>
                  <p className="font-semibold">
                    ${(selectedDistributor.creditLimit - selectedDistributor.currentBalance).toLocaleString()}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">Plazo</p>
                  <p className="font-semibold">{selectedDistributor.creditDays} días</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Catálogo de productos */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="w-5 h-5" />
              Catálogo de Productos
            </CardTitle>
            <CardDescription>
              Agrega productos al pedido
            </CardDescription>
          </CardHeader>
          <CardContent>
            {/* Filtros */}
            <div className="flex gap-4 mb-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por nombre o código..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Categoría" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas</SelectItem>
                  {categories.map(cat => (
                    <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Lista de productos */}
            <ScrollArea className="h-96">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {filteredProducts.map(product => {
                  const inCart = cart.find(item => item.product.id === product.id);
                  const discountedPrice = selectedDistributor
                    ? product.price * (1 - selectedDistributor.discountPercentage / 100)
                    : product.price;

                  return (
                    <div
                      key={product.id}
                      className={`border rounded-lg p-3 flex gap-3 ${
                        !selectedDistributor ? 'opacity-50' : 'hover:border-primary cursor-pointer'
                      } ${inCart ? 'border-primary bg-primary/5' : ''}`}
                      onClick={() => selectedDistributor && addToCart(product)}
                    >
                      <div className="w-16 h-16 bg-muted rounded flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="font-mono text-xs text-muted-foreground">{product.code}</p>
                        <p className="font-medium text-sm truncate">{product.name}</p>
                        <div className="flex items-center gap-2 mt-1">
                          {getRotacionBadge(product.rotacion)}
                          <span className="text-xs text-muted-foreground">
                            Stock: {product.stock}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                          {selectedDistributor && (
                            <span className="text-xs text-muted-foreground line-through">
                              ${product.price.toLocaleString()}
                            </span>
                          )}
                          <span className="font-semibold text-green-600">
                            ${Math.round(discountedPrice).toLocaleString()}
                          </span>
                        </div>
                      </div>
                      {inCart && (
                        <Badge className="self-start">{inCart.quantity}</Badge>
                      )}
                    </div>
                  );
                })}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      </div>

      {/* Columna derecha: Carrito */}
      <div className="space-y-6">
        <Card className="sticky top-4">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span className="flex items-center gap-2">
                <ShoppingCart className="w-5 h-5" />
                Carrito
              </span>
              {cart.length > 0 && (
                <Button variant="ghost" size="sm" onClick={clearCart}>
                  <Trash2 className="w-4 h-4" />
                </Button>
              )}
            </CardTitle>
            <CardDescription>
              {cartTotals.itemCount} productos
            </CardDescription>
          </CardHeader>
          <CardContent>
            {cart.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <ShoppingCart className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p>El carrito está vacío</p>
              </div>
            ) : (
              <ScrollArea className="h-64">
                <div className="space-y-3">
                  {cart.map(item => (
                    <div key={item.product.id} className="flex items-center gap-2 p-2 bg-muted rounded">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{item.product.name}</p>
                        <p className="text-xs text-muted-foreground">
                          ${item.discountedPrice.toLocaleString()} c/u
                        </p>
                      </div>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-6 w-6"
                          onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                        >
                          <Minus className="w-3 h-3" />
                        </Button>
                        <span className="w-8 text-center text-sm">{item.quantity}</span>
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-6 w-6"
                          onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                        >
                          <Plus className="w-3 h-3" />
                        </Button>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 text-red-500"
                        onClick={() => removeFromCart(item.product.id)}
                      >
                        <X className="w-3 h-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            )}

            <Separator className="my-4" />

            {/* Totales */}
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Subtotal</span>
                <span>${cartTotals.subtotal.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-green-600">
                <span>Descuento ({selectedDistributor?.discountPercentage || 0}%)</span>
                <span>-${cartTotals.discount.toLocaleString()}</span>
              </div>
              <Separator />
              <div className="flex justify-between font-bold text-lg">
                <span>Total</span>
                <span>${cartTotals.total.toLocaleString()}</span>
              </div>
            </div>

            {/* Validaciones */}
            {selectedDistributor && cart.length > 0 && (
              <div className="mt-4 space-y-2">
                {cartTotals.total < selectedDistributor.minimumOrder && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      Pedido mínimo: ${selectedDistributor.minimumOrder.toLocaleString()}. 
                      Faltan ${(selectedDistributor.minimumOrder - cartTotals.total).toLocaleString()}
                    </AlertDescription>
                  </Alert>
                )}
                {cartTotals.total > (selectedDistributor.creditLimit - selectedDistributor.currentBalance) && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      Excede el crédito disponible
                    </AlertDescription>
                  </Alert>
                )}
              </div>
            )}

            {/* Notas */}
            <div className="mt-4">
              <Label htmlFor="notes">Notas del pedido</Label>
              <Textarea
                id="notes"
                placeholder="Instrucciones especiales..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="mt-1"
                rows={2}
              />
            </div>
          </CardContent>
          <CardFooter>
            <Button
              className="w-full"
              size="lg"
              disabled={!canSubmitOrder}
              onClick={() => setShowConfirmDialog(true)}
            >
              <ShoppingCart className="w-4 h-4 mr-2" />
              Crear Pedido
            </Button>
          </CardFooter>
        </Card>
      </div>

      {/* Dialog de confirmación */}
      <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmar Pedido</DialogTitle>
            <DialogDescription>
              Revisa los detalles antes de confirmar
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="p-4 bg-muted rounded-lg">
              <p className="text-sm text-muted-foreground">Distribuidor</p>
              <p className="font-medium">{selectedDistributor?.companyName}</p>
              <p className="text-xs text-muted-foreground">{selectedDistributor?.rif}</p>
            </div>

            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-muted-foreground">Productos</p>
                <p className="font-medium">{cartTotals.itemCount}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Descuento aplicado</p>
                <p className="font-medium text-green-600">{selectedDistributor?.discountPercentage}%</p>
              </div>
            </div>

            <Separator />

            <div className="flex justify-between text-lg font-bold">
              <span>Total del Pedido</span>
              <span>${cartTotals.total.toLocaleString()}</span>
            </div>

            {notes && (
              <div className="p-3 bg-muted rounded text-sm">
                <p className="text-muted-foreground">Notas:</p>
                <p>{notes}</p>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowConfirmDialog(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSubmitOrder} disabled={submitting}>
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Procesando...
                </>
              ) : (
                <>
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Confirmar Pedido
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
