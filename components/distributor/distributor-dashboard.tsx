'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import {
  TrendingUp,
  TrendingDown,
  Package,
  ShoppingCart,
  DollarSign,
  Clock,
  AlertCircle,
  BarChart3,
  RefreshCw,
  Calendar,
  CreditCard,
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface DistributorStats {
  totalPurchases: number;
  totalSpent: number;
  averageOrderValue: number;
  purchaseFrequency: number;
  lastPurchaseDate: string | null;
  creditLimit: number;
  currentBalance: number;
  creditDays: number;
  discountPercentage: number;
  minimumOrder: number;
}

interface MonthlyBudget {
  category: string;
  budget: number;
  spent: number;
  percentage: number;
}

interface RecentOrder {
  id: string;
  orderNumber: string;
  date: string;
  status: string;
  total: number;
  itemCount: number;
}

interface TopProduct {
  id: string;
  code: string;
  name: string;
  quantityOrdered: number;
  totalSpent: number;
  rotacion: string;
}

interface DistributorDashboardProps {
  distributorId: string;
}

export function DistributorDashboard({ distributorId }: DistributorDashboardProps) {
  const [stats, setStats] = useState<DistributorStats | null>(null);
  const [monthlyBudgets, setMonthlyBudgets] = useState<MonthlyBudget[]>([]);
  const [recentOrders, setRecentOrders] = useState<RecentOrder[]>([]);
  const [topProducts, setTopProducts] = useState<TopProduct[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, [distributorId]);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      // En producción, estas serían llamadas a la API real
      // Por ahora, simulamos los datos
      setStats({
        totalPurchases: 47,
        totalSpent: 125000000,
        averageOrderValue: 2659574,
        purchaseFrequency: 5.2,
        lastPurchaseDate: '2026-01-15',
        creditLimit: 50000000,
        currentBalance: 12500000,
        creditDays: 30,
        discountPercentage: 15,
        minimumOrder: 500000,
      });

      setMonthlyBudgets([
        { category: 'Cocina', budget: 10000000, spent: 7500000, percentage: 75 },
        { category: 'Mesa', budget: 8000000, spent: 4000000, percentage: 50 },
        { category: 'Café-Té-Bar', budget: 5000000, spent: 5000000, percentage: 100 },
        { category: 'Termos-Neveras', budget: 3000000, spent: 1500000, percentage: 50 },
        { category: 'HoReCa', budget: 4000000, spent: 2000000, percentage: 50 },
      ]);

      setRecentOrders([
        { id: '1', orderNumber: '2026-000123', date: '2026-01-15', status: 'delivered', total: 3500000, itemCount: 12 },
        { id: '2', orderNumber: '2026-000118', date: '2026-01-10', status: 'shipped', total: 2800000, itemCount: 8 },
        { id: '3', orderNumber: '2026-000112', date: '2026-01-05', status: 'delivered', total: 4200000, itemCount: 15 },
        { id: '4', orderNumber: '2026-000098', date: '2025-12-28', status: 'delivered', total: 1900000, itemCount: 6 },
      ]);

      setTopProducts([
        { id: '1', code: 'ABC-001', name: 'Tabla de Cortar Bambú Premium', quantityOrdered: 150, totalSpent: 13485000, rotacion: 'alta' },
        { id: '2', code: 'DEF-002', name: 'Set de Cuchillos Profesionales', quantityOrdered: 45, totalSpent: 8955000, rotacion: 'media' },
        { id: '3', code: 'GHI-003', name: 'Olla a Presión 6L', quantityOrdered: 30, totalSpent: 5970000, rotacion: 'alta' },
        { id: '4', code: 'JKL-004', name: 'Vajilla Porcelana 24 piezas', quantityOrdered: 25, totalSpent: 4975000, rotacion: 'media' },
        { id: '5', code: 'MNO-005', name: 'Termo Acero Inoxidable 1L', quantityOrdered: 80, totalSpent: 3920000, rotacion: 'alta' },
      ]);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { variant: 'default' | 'secondary' | 'outline' | 'destructive'; label: string }> = {
      pending: { variant: 'outline', label: 'Pendiente' },
      approved: { variant: 'secondary', label: 'Aprobado' },
      in_preparation: { variant: 'secondary', label: 'En preparación' },
      shipped: { variant: 'default', label: 'Enviado' },
      delivered: { variant: 'default', label: 'Entregado' },
      cancelled: { variant: 'destructive', label: 'Cancelado' },
    };
    const config = variants[status] || { variant: 'outline', label: status };
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const getRotacionBadge = (rotacion: string) => {
    const colors: Record<string, string> = {
      alta: 'bg-green-100 text-green-800',
      media: 'bg-yellow-100 text-yellow-800',
      baja: 'bg-red-100 text-red-800',
    };
    return (
      <span className={`px-2 py-1 rounded text-xs font-medium ${colors[rotacion] || ''}`}>
        {rotacion}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <RefreshCw className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Panel de Distribuidor</h1>
          <p className="text-muted-foreground">Bienvenido a tu centro de control</p>
        </div>
        <Button onClick={fetchDashboardData}>
          <RefreshCw className="w-4 h-4 mr-2" />
          Actualizar
        </Button>
      </div>

      {/* Estadísticas principales */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Compras</CardTitle>
            <ShoppingCart className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalPurchases}</div>
            <p className="text-xs text-muted-foreground">
              Frecuencia: {stats?.purchaseFrequency.toFixed(1)} compras/año
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Valor Total</CardTitle>
            <DollarSign className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${(stats?.totalSpent || 0).toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              Promedio: ${(stats?.averageOrderValue || 0).toLocaleString()}/pedido
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Tu Descuento</CardTitle>
            <TrendingDown className="w-4 h-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {stats?.discountPercentage}%
            </div>
            <p className="text-xs text-muted-foreground">
              Pedido mínimo: ${(stats?.minimumOrder || 0).toLocaleString()}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Crédito</CardTitle>
            <CreditCard className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${((stats?.creditLimit || 0) - (stats?.currentBalance || 0)).toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              Disponible de ${(stats?.creditLimit || 0).toLocaleString()} ({stats?.creditDays} días)
            </p>
            <Progress 
              value={((stats?.currentBalance || 0) / (stats?.creditLimit || 1)) * 100} 
              className="mt-2 h-2"
            />
          </CardContent>
        </Card>
      </div>

      {/* Última compra */}
      {stats?.lastPurchaseDate && (
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="py-4">
            <div className="flex items-center gap-4">
              <Calendar className="w-8 h-8 text-blue-500" />
              <div>
                <p className="text-sm text-blue-700">Última compra</p>
                <p className="text-lg font-semibold text-blue-900">
                  {format(new Date(stats.lastPurchaseDate), "d 'de' MMMM 'de' yyyy", { locale: es })}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tabs para contenido */}
      <Tabs defaultValue="budget" className="w-full">
        <TabsList>
          <TabsTrigger value="budget">Presupuesto Mensual</TabsTrigger>
          <TabsTrigger value="orders">Pedidos Recientes</TabsTrigger>
          <TabsTrigger value="products">Productos Más Comprados</TabsTrigger>
        </TabsList>

        <TabsContent value="budget" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Presupuesto por Categoría</CardTitle>
              <CardDescription>Tu avance mensual por línea de producto</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {monthlyBudgets.map((budget) => (
                  <div key={budget.category}>
                    <div className="flex justify-between mb-2">
                      <span className="font-medium">{budget.category}</span>
                      <span className="text-sm text-muted-foreground">
                        ${budget.spent.toLocaleString()} / ${budget.budget.toLocaleString()}
                      </span>
                    </div>
                    <div className="flex items-center gap-4">
                      <Progress value={budget.percentage} className="flex-1" />
                      <span className="text-sm font-medium w-12 text-right">
                        {budget.percentage}%
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="orders" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Pedidos Recientes</CardTitle>
              <CardDescription>Tus últimos pedidos realizados</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Pedido</TableHead>
                    <TableHead>Fecha</TableHead>
                    <TableHead>Productos</TableHead>
                    <TableHead>Total</TableHead>
                    <TableHead>Estado</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recentOrders.map((order) => (
                    <TableRow key={order.id}>
                      <TableCell className="font-mono">{order.orderNumber}</TableCell>
                      <TableCell>
                        {format(new Date(order.date), 'dd/MM/yyyy')}
                      </TableCell>
                      <TableCell>{order.itemCount} items</TableCell>
                      <TableCell>${order.total.toLocaleString()}</TableCell>
                      <TableCell>{getStatusBadge(order.status)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              <div className="mt-4 text-center">
                <Button variant="outline" asChild>
                  <Link href="/distributor/orders">Ver pedidos</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="products" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Productos Más Comprados</CardTitle>
              <CardDescription>Tus productos favoritos con indicador de rotación</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Código</TableHead>
                    <TableHead>Producto</TableHead>
                    <TableHead>Cantidad</TableHead>
                    <TableHead>Total</TableHead>
                    <TableHead>Rotación</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {topProducts.map((product) => (
                    <TableRow key={product.id}>
                      <TableCell className="font-mono">{product.code}</TableCell>
                      <TableCell className="max-w-xs truncate">{product.name}</TableCell>
                      <TableCell>{product.quantityOrdered}</TableCell>
                      <TableCell>${product.totalSpent.toLocaleString()}</TableCell>
                      <TableCell>{getRotacionBadge(product.rotacion)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              <div className="mt-4 text-center">
                <Button variant="outline" asChild>
                  <Link href="/distributor/orders/nueva">Nueva orden</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Alertas */}
      <Card className="border-amber-200 bg-amber-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-amber-800">
            <AlertCircle className="w-5 h-5" />
            Alertas y Notificaciones
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2 text-sm text-amber-700">
            <li className="flex items-center gap-2">
              <Package className="w-4 h-4" />
              <span>3 productos de tu lista frecuente tienen bajo stock</span>
            </li>
            <li className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4" />
              <span>5 productos nuevos en la categoría Cocina</span>
            </li>
            <li className="flex items-center gap-2">
              <DollarSign className="w-4 h-4" />
              <span>Ofertas especiales disponibles para tu nivel de descuento</span>
            </li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
