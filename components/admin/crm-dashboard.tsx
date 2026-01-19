'use client';

import { useState, useEffect, useMemo } from 'react';
import { format, subDays, differenceInDays } from 'date-fns';
import { es } from 'date-fns/locale';
import {
  Search,
  Filter,
  Download,
  Users,
  UserCheck,
  UserX,
  TrendingUp,
  TrendingDown,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  Mail,
  Phone,
  MapPin,
  Building,
  DollarSign,
  Calendar,
  Eye,
  Edit,
  MoreHorizontal,
  X,
  SlidersHorizontal,
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
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
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Slider } from '@/components/ui/slider';

interface Customer {
  id: string;
  type: 'b2b' | 'b2c' | 'distributor';
  name: string;
  email: string;
  phone: string;
  documentNumber: string;
  city: string;
  state: string;
  segment: string;
  firstPurchaseAt: string | null;
  lastPurchaseAt: string | null;
  totalPurchases: number;
  totalSpent: number;
  purchaseFrequency: number;
  averageOrderValue: number;
  assignedAgent: string | null;
  creditLimit: number;
  currentBalance: number;
  discountPercentage: number;
  isActive: boolean;
  createdAt: string;
}

interface CRMFilters {
  search: string;
  customerType: string[];
  segment: string[];
  city: string;
  state: string;
  minSpent: number;
  maxSpent: number;
  minFrequency: number;
  maxFrequency: number;
  recencyDays: number;
  hasAgent: string;
  isActive: string;
  sortBy: string;
  sortOrder: 'asc' | 'desc';
}

interface CRMStats {
  totalCustomers: number;
  activeCustomers: number;
  newCustomersThisMonth: number;
  totalRevenue: number;
  averageCustomerValue: number;
  segmentCounts: Record<string, number>;
}

const SEGMENTS = [
  { value: 'vip', label: 'VIP', color: 'bg-purple-100 text-purple-800' },
  { value: 'leal', label: 'Leal', color: 'bg-green-100 text-green-800' },
  { value: 'regular', label: 'Regular', color: 'bg-blue-100 text-blue-800' },
  { value: 'ocasional', label: 'Ocasional', color: 'bg-gray-100 text-gray-800' },
  { value: 'en_riesgo', label: 'En riesgo', color: 'bg-amber-100 text-amber-800' },
  { value: 'dormido', label: 'Dormido', color: 'bg-red-100 text-red-800' },
  { value: 'nuevo', label: 'Nuevo', color: 'bg-indigo-100 text-indigo-800' },
];

const CUSTOMER_TYPES = [
  { value: 'b2b', label: 'B2B' },
  { value: 'b2c', label: 'B2C' },
  { value: 'distributor', label: 'Distribuidor' },
];

const initialFilters: CRMFilters = {
  search: '',
  customerType: [],
  segment: [],
  city: '',
  state: '',
  minSpent: 0,
  maxSpent: 1000000000,
  minFrequency: 0,
  maxFrequency: 100,
  recencyDays: 365,
  hasAgent: 'all',
  isActive: 'all',
  sortBy: 'lastPurchaseAt',
  sortOrder: 'desc',
};

export function CRMDashboard() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [stats, setStats] = useState<CRMStats | null>(null);
  const [filters, setFilters] = useState<CRMFilters>(initialFilters);
  const [loading, setLoading] = useState(true);
  const [selectedCustomers, setSelectedCustomers] = useState<Set<string>>(new Set());
  const [showFilters, setShowFilters] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [showCustomerDetail, setShowCustomerDetail] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Datos simulados - en producción serían llamadas a la API
      setStats({
        totalCustomers: 1245,
        activeCustomers: 892,
        newCustomersThisMonth: 47,
        totalRevenue: 2850000000,
        averageCustomerValue: 2289558,
        segmentCounts: {
          vip: 45,
          leal: 156,
          regular: 289,
          ocasional: 234,
          en_riesgo: 98,
          dormido: 376,
          nuevo: 47,
        },
      });

      setCustomers([
        { id: '1', type: 'distributor', name: 'Distribuidora El Éxito', email: 'ventas@elexito.com', phone: '+57 311 234 5678', documentNumber: 'J-12345678-9', city: 'Bogotá', state: 'Cundinamarca', segment: 'vip', firstPurchaseAt: '2023-03-15', lastPurchaseAt: '2026-01-15', totalPurchases: 156, totalSpent: 450000000, purchaseFrequency: 5.2, averageOrderValue: 2884615, assignedAgent: 'Carlos Rodríguez', creditLimit: 100000000, currentBalance: 25000000, discountPercentage: 20, isActive: true, createdAt: '2023-03-10' },
        { id: '2', type: 'distributor', name: 'Comercial La Gran Tienda', email: 'compras@lagrantienda.com', phone: '+57 312 345 6789', documentNumber: 'J-23456789-0', city: 'Medellín', state: 'Antioquia', segment: 'leal', firstPurchaseAt: '2023-06-20', lastPurchaseAt: '2026-01-12', totalPurchases: 98, totalSpent: 280000000, purchaseFrequency: 3.8, averageOrderValue: 2857143, assignedAgent: 'María González', creditLimit: 75000000, currentBalance: 18000000, discountPercentage: 15, isActive: true, createdAt: '2023-06-15' },
        { id: '3', type: 'b2b', name: 'Restaurante El Sabor', email: 'gerencia@elsabor.com', phone: '+57 313 456 7890', documentNumber: 'J-34567890-1', city: 'Cali', state: 'Valle del Cauca', segment: 'regular', firstPurchaseAt: '2024-01-10', lastPurchaseAt: '2026-01-08', totalPurchases: 24, totalSpent: 45000000, purchaseFrequency: 2.0, averageOrderValue: 1875000, assignedAgent: null, creditLimit: 20000000, currentBalance: 5000000, discountPercentage: 10, isActive: true, createdAt: '2024-01-05' },
        { id: '4', type: 'b2c', name: 'Ana María López', email: 'ana.lopez@email.com', phone: '+57 314 567 8901', documentNumber: '52.345.678', city: 'Bogotá', state: 'Cundinamarca', segment: 'ocasional', firstPurchaseAt: '2024-06-15', lastPurchaseAt: '2025-11-20', totalPurchases: 3, totalSpent: 850000, purchaseFrequency: 0.5, averageOrderValue: 283333, assignedAgent: null, creditLimit: 0, currentBalance: 0, discountPercentage: 5, isActive: true, createdAt: '2024-06-10' },
        { id: '5', type: 'b2b', name: 'Hotel Paraíso', email: 'compras@hotelparaiso.com', phone: '+57 315 678 9012', documentNumber: 'J-45678901-2', city: 'Cartagena', state: 'Bolívar', segment: 'en_riesgo', firstPurchaseAt: '2023-09-01', lastPurchaseAt: '2025-10-15', totalPurchases: 18, totalSpent: 65000000, purchaseFrequency: 1.5, averageOrderValue: 3611111, assignedAgent: 'Carlos Rodríguez', creditLimit: 30000000, currentBalance: 12000000, discountPercentage: 12, isActive: true, createdAt: '2023-08-25' },
        { id: '6', type: 'distributor', name: 'Tiendas del Norte', email: 'info@tiendasnorte.com', phone: '+57 316 789 0123', documentNumber: 'J-56789012-3', city: 'Barranquilla', state: 'Atlántico', segment: 'dormido', firstPurchaseAt: '2023-04-10', lastPurchaseAt: '2025-06-20', totalPurchases: 35, totalSpent: 125000000, purchaseFrequency: 1.2, averageOrderValue: 3571429, assignedAgent: 'María González', creditLimit: 50000000, currentBalance: 0, discountPercentage: 15, isActive: true, createdAt: '2023-04-05' },
        { id: '7', type: 'b2c', name: 'Pedro García', email: 'pedro.garcia@email.com', phone: '+57 317 890 1234', documentNumber: '80.123.456', city: 'Bucaramanga', state: 'Santander', segment: 'nuevo', firstPurchaseAt: '2026-01-10', lastPurchaseAt: '2026-01-10', totalPurchases: 1, totalSpent: 450000, purchaseFrequency: 0, averageOrderValue: 450000, assignedAgent: null, creditLimit: 0, currentBalance: 0, discountPercentage: 0, isActive: true, createdAt: '2026-01-08' },
      ]);
    } catch (error) {
      console.error('Error fetching CRM data:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredCustomers = useMemo(() => {
    let result = [...customers];

    // Búsqueda
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      result = result.filter(c =>
        c.name.toLowerCase().includes(searchLower) ||
        c.email.toLowerCase().includes(searchLower) ||
        c.documentNumber.toLowerCase().includes(searchLower) ||
        c.city.toLowerCase().includes(searchLower)
      );
    }

    // Tipo de cliente
    if (filters.customerType.length > 0) {
      result = result.filter(c => filters.customerType.includes(c.type));
    }

    // Segmento
    if (filters.segment.length > 0) {
      result = result.filter(c => filters.segment.includes(c.segment));
    }

    // Ciudad
    if (filters.city) {
      result = result.filter(c => c.city.toLowerCase().includes(filters.city.toLowerCase()));
    }

    // Estado/Departamento
    if (filters.state) {
      result = result.filter(c => c.state.toLowerCase().includes(filters.state.toLowerCase()));
    }

    // Rango de gasto
    result = result.filter(c => c.totalSpent >= filters.minSpent && c.totalSpent <= filters.maxSpent);

    // Frecuencia
    result = result.filter(c => c.purchaseFrequency >= filters.minFrequency && c.purchaseFrequency <= filters.maxFrequency);

    // Recencia
    if (filters.recencyDays < 365) {
      const cutoffDate = subDays(new Date(), filters.recencyDays);
      result = result.filter(c => {
        if (!c.lastPurchaseAt) return false;
        return new Date(c.lastPurchaseAt) >= cutoffDate;
      });
    }

    // Tiene agente asignado
    if (filters.hasAgent === 'yes') {
      result = result.filter(c => c.assignedAgent !== null);
    } else if (filters.hasAgent === 'no') {
      result = result.filter(c => c.assignedAgent === null);
    }

    // Activo
    if (filters.isActive === 'yes') {
      result = result.filter(c => c.isActive);
    } else if (filters.isActive === 'no') {
      result = result.filter(c => !c.isActive);
    }

    // Ordenamiento
    result.sort((a, b) => {
      let aVal: any = a[filters.sortBy as keyof Customer];
      let bVal: any = b[filters.sortBy as keyof Customer];

      if (filters.sortBy.includes('At') && aVal && bVal) {
        aVal = new Date(aVal).getTime();
        bVal = new Date(bVal).getTime();
      }

      if (aVal === null || aVal === undefined) return 1;
      if (bVal === null || bVal === undefined) return -1;

      if (filters.sortOrder === 'asc') {
        return aVal > bVal ? 1 : -1;
      } else {
        return aVal < bVal ? 1 : -1;
      }
    });

    return result;
  }, [customers, filters]);

  const getSegmentBadge = (segment: string) => {
    const seg = SEGMENTS.find(s => s.value === segment);
    if (!seg) return <Badge variant="outline">{segment}</Badge>;
    return <span className={`px-2 py-1 rounded text-xs font-medium ${seg.color}`}>{seg.label}</span>;
  };

  const getTypeBadge = (type: string) => {
    const colors: Record<string, string> = {
      b2b: 'bg-blue-100 text-blue-800',
      b2c: 'bg-green-100 text-green-800',
      distributor: 'bg-purple-100 text-purple-800',
    };
    const labels: Record<string, string> = {
      b2b: 'B2B',
      b2c: 'B2C',
      distributor: 'Distribuidor',
    };
    return <span className={`px-2 py-1 rounded text-xs font-medium ${colors[type]}`}>{labels[type]}</span>;
  };

  const getRecencyColor = (lastPurchaseAt: string | null) => {
    if (!lastPurchaseAt) return 'text-gray-400';
    const days = differenceInDays(new Date(), new Date(lastPurchaseAt));
    if (days <= 30) return 'text-green-600';
    if (days <= 60) return 'text-amber-600';
    return 'text-red-600';
  };

  const toggleCustomerSelection = (id: string) => {
    const newSelection = new Set(selectedCustomers);
    if (newSelection.has(id)) {
      newSelection.delete(id);
    } else {
      newSelection.add(id);
    }
    setSelectedCustomers(newSelection);
  };

  const toggleAllSelection = () => {
    if (selectedCustomers.size === filteredCustomers.length) {
      setSelectedCustomers(new Set());
    } else {
      setSelectedCustomers(new Set(filteredCustomers.map(c => c.id)));
    }
  };

  const clearFilters = () => {
    setFilters(initialFilters);
  };

  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (filters.search) count++;
    if (filters.customerType.length > 0) count++;
    if (filters.segment.length > 0) count++;
    if (filters.city) count++;
    if (filters.state) count++;
    if (filters.minSpent > 0) count++;
    if (filters.maxSpent < 1000000000) count++;
    if (filters.minFrequency > 0) count++;
    if (filters.maxFrequency < 100) count++;
    if (filters.recencyDays < 365) count++;
    if (filters.hasAgent !== 'all') count++;
    if (filters.isActive !== 'all') count++;
    return count;
  }, [filters]);

  const exportToCSV = () => {
    const headers = ['Nombre', 'Tipo', 'Email', 'Teléfono', 'Ciudad', 'Departamento', 'Segmento', 'Total Compras', 'Total Gastado', 'Frecuencia', 'Última Compra', 'Corredor'];
    const rows = filteredCustomers.map(c => [
      c.name,
      c.type,
      c.email,
      c.phone,
      c.city,
      c.state,
      c.segment,
      c.totalPurchases,
      c.totalSpent,
      c.purchaseFrequency,
      c.lastPurchaseAt || '',
      c.assignedAgent || '',
    ]);

    const csv = [headers, ...rows].map(row => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `clientes_${format(new Date(), 'yyyy-MM-dd')}.csv`;
    a.click();
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
          <h1 className="text-3xl font-bold">CRM - Gestión de Clientes</h1>
          <p className="text-muted-foreground">
            {filteredCustomers.length} clientes encontrados
            {activeFiltersCount > 0 && ` (${activeFiltersCount} filtros activos)`}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={exportToCSV}>
            <Download className="w-4 h-4 mr-2" />
            Exportar
          </Button>
          <Button variant="outline" onClick={fetchData}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Actualizar
          </Button>
        </div>
      </div>

      {/* Estadísticas */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold">{stats?.totalCustomers.toLocaleString()}</div>
                <p className="text-sm text-muted-foreground">Total clientes</p>
              </div>
              <Users className="w-8 h-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold text-green-600">{stats?.activeCustomers.toLocaleString()}</div>
                <p className="text-sm text-muted-foreground">Activos</p>
              </div>
              <UserCheck className="w-8 h-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold text-blue-600">+{stats?.newCustomersThisMonth}</div>
                <p className="text-sm text-muted-foreground">Nuevos (mes)</p>
              </div>
              <TrendingUp className="w-8 h-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold">${((stats?.totalRevenue || 0) / 1000000000).toFixed(1)}B</div>
                <p className="text-sm text-muted-foreground">Ingresos totales</p>
              </div>
              <DollarSign className="w-8 h-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold">${((stats?.averageCustomerValue || 0) / 1000000).toFixed(1)}M</div>
                <p className="text-sm text-muted-foreground">Valor promedio</p>
              </div>
              <TrendingUp className="w-8 h-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Segmentos */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium">Distribución por Segmento</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3">
            {SEGMENTS.map(seg => (
              <button
                key={seg.value}
                onClick={() => {
                  const newSegments = filters.segment.includes(seg.value)
                    ? filters.segment.filter(s => s !== seg.value)
                    : [...filters.segment, seg.value];
                  setFilters({ ...filters, segment: newSegments });
                }}
                className={`px-3 py-2 rounded-lg border transition-colors ${
                  filters.segment.includes(seg.value)
                    ? 'border-primary bg-primary/10'
                    : 'border-transparent hover:border-muted'
                }`}
              >
                <span className={`px-2 py-1 rounded text-xs font-medium ${seg.color}`}>
                  {seg.label}
                </span>
                <span className="ml-2 text-lg font-bold">
                  {stats?.segmentCounts[seg.value] || 0}
                </span>
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Búsqueda y filtros */}
      <div className="flex gap-4 items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por nombre, email, documento o ciudad..."
            value={filters.search}
            onChange={(e) => setFilters({ ...filters, search: e.target.value })}
            className="pl-10"
          />
        </div>

        <Sheet open={showFilters} onOpenChange={setShowFilters}>
          <SheetTrigger asChild>
            <Button variant="outline">
              <SlidersHorizontal className="w-4 h-4 mr-2" />
              Filtros
              {activeFiltersCount > 0 && (
                <Badge variant="secondary" className="ml-2">{activeFiltersCount}</Badge>
              )}
            </Button>
          </SheetTrigger>
          <SheetContent className="w-[400px] overflow-y-auto">
            <SheetHeader>
              <SheetTitle>Filtros avanzados</SheetTitle>
              <SheetDescription>
                Filtra clientes por múltiples criterios
              </SheetDescription>
            </SheetHeader>

            <div className="space-y-6 mt-6">
              {/* Tipo de cliente */}
              <div>
                <Label className="mb-2 block">Tipo de cliente</Label>
                <div className="flex flex-wrap gap-2">
                  {CUSTOMER_TYPES.map(type => (
                    <Button
                      key={type.value}
                      variant={filters.customerType.includes(type.value) ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => {
                        const newTypes = filters.customerType.includes(type.value)
                          ? filters.customerType.filter(t => t !== type.value)
                          : [...filters.customerType, type.value];
                        setFilters({ ...filters, customerType: newTypes });
                      }}
                    >
                      {type.label}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Ubicación */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="city">Ciudad</Label>
                  <Input
                    id="city"
                    value={filters.city}
                    onChange={(e) => setFilters({ ...filters, city: e.target.value })}
                    placeholder="Ej: Bogotá"
                  />
                </div>
                <div>
                  <Label htmlFor="state">Departamento</Label>
                  <Input
                    id="state"
                    value={filters.state}
                    onChange={(e) => setFilters({ ...filters, state: e.target.value })}
                    placeholder="Ej: Cundinamarca"
                  />
                </div>
              </div>

              {/* Recencia */}
              <div>
                <Label>Última compra (días)</Label>
                <div className="flex items-center gap-4 mt-2">
                  <Slider
                    value={[filters.recencyDays]}
                    onValueChange={([value]) => setFilters({ ...filters, recencyDays: value })}
                    max={365}
                    step={30}
                    className="flex-1"
                  />
                  <span className="w-20 text-sm">
                    {filters.recencyDays >= 365 ? 'Todos' : `≤${filters.recencyDays}d`}
                  </span>
                </div>
              </div>

              {/* Frecuencia */}
              <div>
                <Label>Frecuencia de compra (compras/año)</Label>
                <div className="flex gap-4 mt-2">
                  <Input
                    type="number"
                    value={filters.minFrequency}
                    onChange={(e) => setFilters({ ...filters, minFrequency: Number(e.target.value) })}
                    placeholder="Mín"
                    className="w-24"
                  />
                  <span className="self-center">-</span>
                  <Input
                    type="number"
                    value={filters.maxFrequency}
                    onChange={(e) => setFilters({ ...filters, maxFrequency: Number(e.target.value) })}
                    placeholder="Máx"
                    className="w-24"
                  />
                </div>
              </div>

              {/* Corredor asignado */}
              <div>
                <Label>Corredor asignado</Label>
                <Select
                  value={filters.hasAgent}
                  onValueChange={(v) => setFilters({ ...filters, hasAgent: v })}
                >
                  <SelectTrigger className="mt-2">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    <SelectItem value="yes">Con corredor</SelectItem>
                    <SelectItem value="no">Sin corredor</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Estado activo */}
              <div>
                <Label>Estado</Label>
                <Select
                  value={filters.isActive}
                  onValueChange={(v) => setFilters({ ...filters, isActive: v })}
                >
                  <SelectTrigger className="mt-2">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    <SelectItem value="yes">Activos</SelectItem>
                    <SelectItem value="no">Inactivos</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Botones */}
              <div className="flex gap-2 pt-4">
                <Button variant="outline" onClick={clearFilters} className="flex-1">
                  Limpiar filtros
                </Button>
                <Button onClick={() => setShowFilters(false)} className="flex-1">
                  Aplicar
                </Button>
              </div>
            </div>
          </SheetContent>
        </Sheet>

        <Select
          value={filters.sortBy}
          onValueChange={(v) => setFilters({ ...filters, sortBy: v })}
        >
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Ordenar por" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="lastPurchaseAt">Última compra</SelectItem>
            <SelectItem value="totalSpent">Total gastado</SelectItem>
            <SelectItem value="purchaseFrequency">Frecuencia</SelectItem>
            <SelectItem value="name">Nombre</SelectItem>
            <SelectItem value="createdAt">Fecha registro</SelectItem>
          </SelectContent>
        </Select>

        <Button
          variant="ghost"
          size="icon"
          onClick={() => setFilters({ ...filters, sortOrder: filters.sortOrder === 'asc' ? 'desc' : 'asc' })}
        >
          {filters.sortOrder === 'asc' ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </Button>
      </div>

      {/* Acciones masivas */}
      {selectedCustomers.size > 0 && (
        <div className="flex items-center gap-4 p-4 bg-muted rounded-lg">
          <span className="font-medium">{selectedCustomers.size} seleccionados</span>
          <Button variant="outline" size="sm">
            <Mail className="w-4 h-4 mr-2" />
            Enviar email
          </Button>
          <Button variant="outline" size="sm">
            <Users className="w-4 h-4 mr-2" />
            Asignar corredor
          </Button>
          <Button variant="ghost" size="sm" onClick={() => setSelectedCustomers(new Set())}>
            <X className="w-4 h-4 mr-2" />
            Cancelar
          </Button>
        </div>
      )}

      {/* Tabla de clientes */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">
                  <Checkbox
                    checked={selectedCustomers.size === filteredCustomers.length && filteredCustomers.length > 0}
                    onCheckedChange={toggleAllSelection}
                  />
                </TableHead>
                <TableHead>Cliente</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Ubicación</TableHead>
                <TableHead>Segmento</TableHead>
                <TableHead>Compras</TableHead>
                <TableHead>Total</TableHead>
                <TableHead>Última compra</TableHead>
                <TableHead>Corredor</TableHead>
                <TableHead className="w-12"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredCustomers.map((customer) => (
                <TableRow key={customer.id}>
                  <TableCell>
                    <Checkbox
                      checked={selectedCustomers.has(customer.id)}
                      onCheckedChange={() => toggleCustomerSelection(customer.id)}
                    />
                  </TableCell>
                  <TableCell>
                    <div>
                      <div className="font-medium">{customer.name}</div>
                      <div className="text-xs text-muted-foreground">{customer.email}</div>
                    </div>
                  </TableCell>
                  <TableCell>{getTypeBadge(customer.type)}</TableCell>
                  <TableCell>
                    <div className="text-sm">
                      <div>{customer.city}</div>
                      <div className="text-xs text-muted-foreground">{customer.state}</div>
                    </div>
                  </TableCell>
                  <TableCell>{getSegmentBadge(customer.segment)}</TableCell>
                  <TableCell>
                    <div className="text-sm">
                      <div>{customer.totalPurchases}</div>
                      <div className="text-xs text-muted-foreground">
                        {customer.purchaseFrequency.toFixed(1)}/año
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="font-medium">${(customer.totalSpent / 1000000).toFixed(1)}M</div>
                  </TableCell>
                  <TableCell>
                    {customer.lastPurchaseAt ? (
                      <span className={getRecencyColor(customer.lastPurchaseAt)}>
                        {format(new Date(customer.lastPurchaseAt), 'dd/MM/yy')}
                      </span>
                    ) : (
                      <span className="text-gray-400">Nunca</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {customer.assignedAgent || (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreHorizontal className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Acciones</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => {
                          setSelectedCustomer(customer);
                          setShowCustomerDetail(true);
                        }}>
                          <Eye className="w-4 h-4 mr-2" />
                          Ver detalle
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <Edit className="w-4 h-4 mr-2" />
                          Editar
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <Mail className="w-4 h-4 mr-2" />
                          Enviar email
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <Users className="w-4 h-4 mr-2" />
                          Asignar corredor
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Diálogo de detalle de cliente */}
      <Dialog open={showCustomerDetail} onOpenChange={setShowCustomerDetail}>
        <DialogContent className="max-w-2xl">
          {selectedCustomer && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-3">
                  {selectedCustomer.name}
                  {getTypeBadge(selectedCustomer.type)}
                  {getSegmentBadge(selectedCustomer.segment)}
                </DialogTitle>
                <DialogDescription>
                  Cliente desde {format(new Date(selectedCustomer.createdAt), "MMMM 'de' yyyy", { locale: es })}
                </DialogDescription>
              </DialogHeader>

              <Tabs defaultValue="info" className="mt-4">
                <TabsList>
                  <TabsTrigger value="info">Información</TabsTrigger>
                  <TabsTrigger value="metrics">Métricas</TabsTrigger>
                  <TabsTrigger value="commercial">Comercial</TabsTrigger>
                </TabsList>

                <TabsContent value="info" className="space-y-4 mt-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex items-center gap-2">
                      <Mail className="w-4 h-4 text-muted-foreground" />
                      <span>{selectedCustomer.email}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Phone className="w-4 h-4 text-muted-foreground" />
                      <span>{selectedCustomer.phone}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Building className="w-4 h-4 text-muted-foreground" />
                      <span>{selectedCustomer.documentNumber}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-muted-foreground" />
                      <span>{selectedCustomer.city}, {selectedCustomer.state}</span>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="metrics" className="space-y-4 mt-4">
                  <div className="grid grid-cols-2 gap-4">
                    <Card>
                      <CardContent className="pt-4">
                        <div className="text-2xl font-bold">{selectedCustomer.totalPurchases}</div>
                        <p className="text-sm text-muted-foreground">Total compras</p>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="pt-4">
                        <div className="text-2xl font-bold">${(selectedCustomer.totalSpent / 1000000).toFixed(1)}M</div>
                        <p className="text-sm text-muted-foreground">Total gastado</p>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="pt-4">
                        <div className="text-2xl font-bold">{selectedCustomer.purchaseFrequency.toFixed(1)}</div>
                        <p className="text-sm text-muted-foreground">Compras/año</p>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="pt-4">
                        <div className="text-2xl font-bold">${(selectedCustomer.averageOrderValue / 1000000).toFixed(2)}M</div>
                        <p className="text-sm text-muted-foreground">Ticket promedio</p>
                      </CardContent>
                    </Card>
                  </div>
                </TabsContent>

                <TabsContent value="commercial" className="space-y-4 mt-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-muted-foreground">Descuento asignado</Label>
                      <p className="text-lg font-medium">{selectedCustomer.discountPercentage}%</p>
                    </div>
                    <div>
                      <Label className="text-muted-foreground">Corredor asignado</Label>
                      <p className="text-lg font-medium">{selectedCustomer.assignedAgent || 'Sin asignar'}</p>
                    </div>
                    {selectedCustomer.type !== 'b2c' && (
                      <>
                        <div>
                          <Label className="text-muted-foreground">Límite de crédito</Label>
                          <p className="text-lg font-medium">${selectedCustomer.creditLimit.toLocaleString()}</p>
                        </div>
                        <div>
                          <Label className="text-muted-foreground">Saldo actual</Label>
                          <p className="text-lg font-medium">${selectedCustomer.currentBalance.toLocaleString()}</p>
                        </div>
                      </>
                    )}
                  </div>
                </TabsContent>
              </Tabs>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
