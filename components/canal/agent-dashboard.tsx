'use client';

import { useState, useEffect } from 'react';
import { format, subDays, differenceInDays } from 'date-fns';
import { es } from 'date-fns/locale';
import {
  TrendingUp,
  TrendingDown,
  Users,
  ShoppingCart,
  DollarSign,
  Target,
  Calendar,
  AlertCircle,
  RefreshCw,
  Award,
  BarChart3,
  Clock,
  CheckCircle,
  XCircle,
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

interface AgentStats {
  totalCommissions: number;
  pendingCommissions: number;
  paidCommissions: number;
  totalOrders: number;
  totalSales: number;
  monthlySalesTarget: number;
  currentMonthSales: number;
  assignedDistributors: number;
  activeDistributors: number;
}

interface AssignedDistributor {
  id: string;
  companyName: string;
  rif: string;
  commissionRate: number;
  lastPurchaseDate: string | null;
  totalPurchases: number;
  purchaseFrequency: number;
  segment: string;
  currentMonthSales: number;
}

interface RecentOrder {
  id: string;
  orderNumber: string;
  distributorName: string;
  date: string;
  status: string;
  total: number;
  commissionAmount: number;
  commissionStatus: string;
}

interface Commission {
  id: string;
  orderNumber: string;
  distributorName: string;
  orderDate: string;
  invoicePaidAt: string | null;
  commissionDueAt: string;
  amount: number;
  status: string;
}

interface CategorySales {
  category: string;
  sales: number;
  percentage: number;
}

interface AgentDashboardProps {
  agentId: string;
}

export function AgentDashboard({ agentId }: AgentDashboardProps) {
  const [stats, setStats] = useState<AgentStats | null>(null);
  const [distributors, setDistributors] = useState<AssignedDistributor[]>([]);
  const [recentOrders, setRecentOrders] = useState<RecentOrder[]>([]);
  const [commissions, setCommissions] = useState<Commission[]>([]);
  const [categorySales, setCategorySales] = useState<CategorySales[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, [agentId]);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      // En producción, estas serían llamadas a la API real
      setStats({
        totalCommissions: 15800000,
        pendingCommissions: 4200000,
        paidCommissions: 11600000,
        totalOrders: 156,
        totalSales: 450000000,
        monthlySalesTarget: 50000000,
        currentMonthSales: 38500000,
        assignedDistributors: 12,
        activeDistributors: 10,
      });

      setDistributors([
        { id: '1', companyName: 'Distribuidora El Éxito', rif: 'J-12345678-9', commissionRate: 3.5, lastPurchaseDate: '2026-01-15', totalPurchases: 45, purchaseFrequency: 4.2, segment: 'vip', currentMonthSales: 8500000 },
        { id: '2', companyName: 'Comercial La Gran Tienda', rif: 'J-23456789-0', commissionRate: 3.0, lastPurchaseDate: '2026-01-12', totalPurchases: 32, purchaseFrequency: 3.5, segment: 'leal', currentMonthSales: 6200000 },
        { id: '3', companyName: 'Almacén Don José', rif: 'J-34567890-1', commissionRate: 3.5, lastPurchaseDate: '2026-01-08', totalPurchases: 28, purchaseFrequency: 2.8, segment: 'regular', currentMonthSales: 4100000 },
        { id: '4', companyName: 'Hogar & Cocina SAS', rif: 'J-45678901-2', commissionRate: 4.0, lastPurchaseDate: '2025-12-20', totalPurchases: 18, purchaseFrequency: 2.0, segment: 'en_riesgo', currentMonthSales: 0 },
        { id: '5', companyName: 'Tiendas del Norte', rif: 'J-56789012-3', commissionRate: 3.0, lastPurchaseDate: '2025-11-15', totalPurchases: 12, purchaseFrequency: 1.2, segment: 'dormido', currentMonthSales: 0 },
      ]);

      setRecentOrders([
        { id: '1', orderNumber: '2026-000145', distributorName: 'Distribuidora El Éxito', date: '2026-01-15', status: 'delivered', total: 4500000, commissionAmount: 157500, commissionStatus: 'pending' },
        { id: '2', orderNumber: '2026-000142', distributorName: 'Comercial La Gran Tienda', date: '2026-01-12', status: 'shipped', total: 3200000, commissionAmount: 96000, commissionStatus: 'pending' },
        { id: '3', orderNumber: '2026-000138', distributorName: 'Almacén Don José', date: '2026-01-08', status: 'delivered', total: 2100000, commissionAmount: 73500, commissionStatus: 'approved' },
        { id: '4', orderNumber: '2026-000125', distributorName: 'Distribuidora El Éxito', date: '2025-12-28', status: 'delivered', total: 5800000, commissionAmount: 203000, commissionStatus: 'paid' },
      ]);

      setCommissions([
        { id: '1', orderNumber: '2026-000145', distributorName: 'Distribuidora El Éxito', orderDate: '2026-01-15', invoicePaidAt: null, commissionDueAt: '2026-04-15', amount: 157500, status: 'pending' },
        { id: '2', orderNumber: '2026-000142', distributorName: 'Comercial La Gran Tienda', orderDate: '2026-01-12', invoicePaidAt: null, commissionDueAt: '2026-04-12', amount: 96000, status: 'pending' },
        { id: '3', orderNumber: '2026-000138', distributorName: 'Almacén Don José', orderDate: '2026-01-08', invoicePaidAt: '2026-01-10', commissionDueAt: '2026-04-10', amount: 73500, status: 'approved' },
        { id: '4', orderNumber: '2025-000125', distributorName: 'Distribuidora El Éxito', orderDate: '2025-12-28', invoicePaidAt: '2025-12-30', commissionDueAt: '2026-03-30', amount: 203000, status: 'paid' },
      ]);

      setCategorySales([
        { category: 'Cocina', sales: 145000000, percentage: 32 },
        { category: 'Mesa', sales: 108000000, percentage: 24 },
        { category: 'Café-Té-Bar', sales: 90000000, percentage: 20 },
        { category: 'Termos-Neveras', sales: 63000000, percentage: 14 },
        { category: 'HoReCa', sales: 44000000, percentage: 10 },
      ]);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getSegmentBadge = (segment: string) => {
    const config: Record<string, { color: string; label: string }> = {
      vip: { color: 'bg-purple-100 text-purple-800', label: 'VIP' },
      leal: { color: 'bg-green-100 text-green-800', label: 'Leal' },
      regular: { color: 'bg-blue-100 text-blue-800', label: 'Regular' },
      ocasional: { color: 'bg-gray-100 text-gray-800', label: 'Ocasional' },
      en_riesgo: { color: 'bg-amber-100 text-amber-800', label: 'En riesgo' },
      dormido: { color: 'bg-red-100 text-red-800', label: 'Dormido' },
    };
    const { color, label } = config[segment] || { color: 'bg-gray-100', label: segment };
    return <span className={`px-2 py-1 rounded text-xs font-medium ${color}`}>{label}</span>;
  };

  const getCommissionStatusBadge = (status: string) => {
    const variants: Record<string, { variant: 'default' | 'secondary' | 'outline' | 'destructive'; label: string }> = {
      pending: { variant: 'outline', label: 'Pendiente' },
      approved: { variant: 'secondary', label: 'Aprobada' },
      paid: { variant: 'default', label: 'Pagada' },
      cancelled: { variant: 'destructive', label: 'Cancelada' },
    };
    const config = variants[status] || { variant: 'outline', label: status };
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const getRecencyIndicator = (lastPurchaseDate: string | null) => {
    if (!lastPurchaseDate) return <span className="text-red-500">Nunca</span>;
    
    const days = differenceInDays(new Date(), new Date(lastPurchaseDate));
    
    if (days <= 30) return <span className="text-green-600">{days} días</span>;
    if (days <= 60) return <span className="text-amber-600">{days} días</span>;
    return <span className="text-red-600">{days} días</span>;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <RefreshCw className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const targetProgress = ((stats?.currentMonthSales || 0) / (stats?.monthlySalesTarget || 1)) * 100;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Panel de Corredor</h1>
          <p className="text-muted-foreground">Centro de control de ventas y comisiones</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={fetchDashboardData}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Actualizar
          </Button>
          <Button>
            <ShoppingCart className="w-4 h-4 mr-2" />
            Nuevo Pedido
          </Button>
        </div>
      </div>

      {/* Estadísticas principales */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Comisiones Totales</CardTitle>
            <DollarSign className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${(stats?.totalCommissions || 0).toLocaleString()}
            </div>
            <div className="flex gap-4 text-xs mt-1">
              <span className="text-amber-600">
                Pendiente: ${(stats?.pendingCommissions || 0).toLocaleString()}
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Ventas Totales</CardTitle>
            <TrendingUp className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${(stats?.totalSales || 0).toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              {stats?.totalOrders} pedidos generados
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Distribuidores</CardTitle>
            <Users className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats?.activeDistributors}/{stats?.assignedDistributors}
            </div>
            <p className="text-xs text-muted-foreground">
              activos este mes
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Objetivo Mensual</CardTitle>
            <Target className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {targetProgress.toFixed(0)}%
            </div>
            <Progress value={targetProgress} className="mt-2 h-2" />
            <p className="text-xs text-muted-foreground mt-1">
              ${(stats?.currentMonthSales || 0).toLocaleString()} / ${(stats?.monthlySalesTarget || 0).toLocaleString()}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Distribución por categoría */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5" />
            Distribución de Ventas por Categoría
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-5 gap-4">
            {categorySales.map((cat) => (
              <div key={cat.category} className="text-center">
                <div className="text-2xl font-bold">{cat.percentage}%</div>
                <p className="text-sm text-muted-foreground">{cat.category}</p>
                <p className="text-xs">${(cat.sales / 1000000).toFixed(0)}M</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Tabs principales */}
      <Tabs defaultValue="distributors" className="w-full">
        <TabsList>
          <TabsTrigger value="distributors">Mis Distribuidores</TabsTrigger>
          <TabsTrigger value="orders">Pedidos Recientes</TabsTrigger>
          <TabsTrigger value="commissions">Comisiones</TabsTrigger>
        </TabsList>

        <TabsContent value="distributors" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Distribuidores Asignados</CardTitle>
              <CardDescription>Métricas RFM y estado de cada distribuidor</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Empresa</TableHead>
                    <TableHead>Comisión</TableHead>
                    <TableHead>Recencia</TableHead>
                    <TableHead>Frecuencia</TableHead>
                    <TableHead>Ventas Mes</TableHead>
                    <TableHead>Segmento</TableHead>
                    <TableHead>Acción</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {distributors.map((dist) => (
                    <TableRow key={dist.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{dist.companyName}</div>
                          <div className="text-xs text-muted-foreground">{dist.rif}</div>
                        </div>
                      </TableCell>
                      <TableCell>{dist.commissionRate}%</TableCell>
                      <TableCell>{getRecencyIndicator(dist.lastPurchaseDate)}</TableCell>
                      <TableCell>{dist.purchaseFrequency.toFixed(1)}/año</TableCell>
                      <TableCell>
                        {dist.currentMonthSales > 0 
                          ? `$${dist.currentMonthSales.toLocaleString()}`
                          : <span className="text-muted-foreground">-</span>
                        }
                      </TableCell>
                      <TableCell>{getSegmentBadge(dist.segment)}</TableCell>
                      <TableCell>
                        <Button size="sm" variant="outline">
                          <ShoppingCart className="w-3 h-3 mr-1" />
                          Pedir
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="orders" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Pedidos Recientes</CardTitle>
              <CardDescription>Últimos pedidos generados para tus distribuidores</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Pedido</TableHead>
                    <TableHead>Distribuidor</TableHead>
                    <TableHead>Fecha</TableHead>
                    <TableHead>Total</TableHead>
                    <TableHead>Comisión</TableHead>
                    <TableHead>Estado</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recentOrders.map((order) => (
                    <TableRow key={order.id}>
                      <TableCell className="font-mono">{order.orderNumber}</TableCell>
                      <TableCell>{order.distributorName}</TableCell>
                      <TableCell>{format(new Date(order.date), 'dd/MM/yyyy')}</TableCell>
                      <TableCell>${order.total.toLocaleString()}</TableCell>
                      <TableCell className="text-green-600">
                        ${order.commissionAmount.toLocaleString()}
                      </TableCell>
                      <TableCell>{getCommissionStatusBadge(order.commissionStatus)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="commissions" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Detalle de Comisiones</CardTitle>
              <CardDescription>
                Las comisiones se pagan cuando la factura es cancelada antes de 90 días
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Pedido</TableHead>
                    <TableHead>Distribuidor</TableHead>
                    <TableHead>Fecha Pedido</TableHead>
                    <TableHead>Factura Pagada</TableHead>
                    <TableHead>Vence</TableHead>
                    <TableHead>Monto</TableHead>
                    <TableHead>Estado</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {commissions.map((commission) => (
                    <TableRow key={commission.id}>
                      <TableCell className="font-mono">{commission.orderNumber}</TableCell>
                      <TableCell>{commission.distributorName}</TableCell>
                      <TableCell>{format(new Date(commission.orderDate), 'dd/MM/yyyy')}</TableCell>
                      <TableCell>
                        {commission.invoicePaidAt 
                          ? <span className="text-green-600 flex items-center gap-1">
                              <CheckCircle className="w-3 h-3" />
                              {format(new Date(commission.invoicePaidAt), 'dd/MM/yyyy')}
                            </span>
                          : <span className="text-muted-foreground flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              Pendiente
                            </span>
                        }
                      </TableCell>
                      <TableCell>
                        {format(new Date(commission.commissionDueAt), 'dd/MM/yyyy')}
                      </TableCell>
                      <TableCell className="font-medium text-green-600">
                        ${commission.amount.toLocaleString()}
                      </TableCell>
                      <TableCell>{getCommissionStatusBadge(commission.status)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {/* Resumen */}
              <div className="mt-6 grid grid-cols-3 gap-4 p-4 bg-muted rounded-lg">
                <div className="text-center">
                  <div className="text-lg font-bold text-amber-600">
                    ${(stats?.pendingCommissions || 0).toLocaleString()}
                  </div>
                  <p className="text-sm text-muted-foreground">Pendientes</p>
                </div>
                <div className="text-center">
                  <div className="text-lg font-bold text-blue-600">
                    ${(commissions.filter(c => c.status === 'approved').reduce((sum, c) => sum + c.amount, 0)).toLocaleString()}
                  </div>
                  <p className="text-sm text-muted-foreground">Aprobadas</p>
                </div>
                <div className="text-center">
                  <div className="text-lg font-bold text-green-600">
                    ${(stats?.paidCommissions || 0).toLocaleString()}
                  </div>
                  <p className="text-sm text-muted-foreground">Pagadas</p>
                </div>
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
            Alertas de Gestión
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2 text-sm text-amber-700">
            <li className="flex items-center gap-2">
              <Clock className="w-4 h-4" />
              <span>2 distribuidores no han comprado en más de 30 días</span>
            </li>
            <li className="flex items-center gap-2">
              <Target className="w-4 h-4" />
              <span>Te faltan ${((stats?.monthlySalesTarget || 0) - (stats?.currentMonthSales || 0)).toLocaleString()} para cumplir el objetivo mensual</span>
            </li>
            <li className="flex items-center gap-2">
              <Award className="w-4 h-4" />
              <span>3 comisiones próximas a vencer en los próximos 15 días</span>
            </li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
