'use client';

import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import {
  History,
  ChevronDown,
  ChevronUp,
  FileSpreadsheet,
  Database,
  User,
  Filter,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

interface ChangeLogEntry {
  id: string;
  product_id: string;
  change_type: 'create' | 'update' | 'csv_import' | 'erp_sync';
  change_source: 'csv' | 'erp' | 'admin' | 'api';
  fields_changed: Record<string, { old: string | null; new: string | null }>;
  changed_by: string;
  csv_filename?: string;
  csv_row_number?: number;
  changed_at: string;
  product?: {
    pdt_codigo: string;
    nombre_comercial: string;
  };
  user?: {
    full_name: string;
  };
}

interface ProductChangelogProps {
  productId?: string;
}

export function ProductChangelog({ productId }: ProductChangelogProps) {
  const [logs, setLogs] = useState<ChangeLogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [changeTypeFilter, setChangeTypeFilter] = useState<string>('all');
  const [sourceFilter, setSourceFilter] = useState<string>('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [hasMore, setHasMore] = useState(false);
  const [offset, setOffset] = useState(0);

  const fetchLogs = async (reset = false) => {
    setLoading(true);
    const newOffset = reset ? 0 : offset;
    
    try {
      const params = new URLSearchParams();
      if (productId) params.set('product_id', productId);
      if (changeTypeFilter !== 'all') params.set('change_type', changeTypeFilter);
      if (startDate) params.set('start_date', startDate);
      if (endDate) params.set('end_date', endDate);
      params.set('limit', '20');
      params.set('offset', newOffset.toString());

      const response = await fetch(`/api/products/csv/changelog?${params}`);
      const data = await response.json();

      if (reset) {
        setLogs(data.logs || []);
      } else {
        setLogs((prev) => [...prev, ...(data.logs || [])]);
      }
      setHasMore(data.hasMore);
      setOffset(newOffset + 20);
    } catch (error) {
      console.error('Error fetching changelog:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs(true);
  }, [productId, changeTypeFilter, sourceFilter, startDate, endDate]);

  const getChangeTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      create: 'Creación',
      update: 'Actualización',
      csv_import: 'Importación CSV',
      erp_sync: 'Sincronización ERP',
    };
    return labels[type] || type;
  };

  const getChangeTypeBadgeVariant = (type: string) => {
    const variants: Record<string, 'default' | 'secondary' | 'outline' | 'destructive'> = {
      create: 'default',
      update: 'secondary',
      csv_import: 'outline',
      erp_sync: 'outline',
    };
    return variants[type] || 'outline';
  };

  const getSourceIcon = (source: string) => {
    switch (source) {
      case 'csv':
        return <FileSpreadsheet className="w-4 h-4" />;
      case 'erp':
        return <Database className="w-4 h-4" />;
      case 'admin':
        return <User className="w-4 h-4" />;
      default:
        return null;
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <History className="w-5 h-5" />
            Historial de Cambios
          </CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        {/* Filtros */}
        <div className="flex flex-wrap gap-4 mb-6">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm font-medium">Filtros:</span>
          </div>
          <Select value={changeTypeFilter} onValueChange={setChangeTypeFilter}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Tipo de cambio" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="create">Creación</SelectItem>
              <SelectItem value="update">Actualización</SelectItem>
              <SelectItem value="csv_import">CSV Import</SelectItem>
              <SelectItem value="erp_sync">ERP Sync</SelectItem>
            </SelectContent>
          </Select>
          <Input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="w-40"
            placeholder="Desde"
          />
          <Input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="w-40"
            placeholder="Hasta"
          />
        </div>

        {/* Lista de cambios */}
        {loading && logs.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            Cargando historial...
          </div>
        ) : logs.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            No hay cambios registrados
          </div>
        ) : (
          <Accordion type="single" collapsible className="w-full">
            {logs.map((log) => (
              <AccordionItem key={log.id} value={log.id}>
                <AccordionTrigger>
                  <div className="flex items-center gap-4 flex-1 text-left">
                    <span className="text-sm text-muted-foreground">
                      {format(new Date(log.changed_at), 'dd MMM yyyy HH:mm', {
                        locale: es,
                      })}
                    </span>
                    <Badge variant={getChangeTypeBadgeVariant(log.change_type)}>
                      {getChangeTypeLabel(log.change_type)}
                    </Badge>
                    {!productId && log.product && (
                      <span className="font-mono text-sm">
                        {log.product.pdt_codigo}
                      </span>
                    )}
                    <span className="flex items-center gap-1 text-sm text-muted-foreground">
                      {getSourceIcon(log.change_source)}
                      {log.change_source}
                    </span>
                  </div>
                </AccordionTrigger>
                <AccordionContent>
                  <div className="pl-4 space-y-4">
                    {/* Info del cambio */}
                    <div className="flex flex-wrap gap-4 text-sm">
                      {log.user && (
                        <div>
                          <span className="text-muted-foreground">Usuario:</span>{' '}
                          {log.user.full_name}
                        </div>
                      )}
                      {log.csv_filename && (
                        <div>
                          <span className="text-muted-foreground">Archivo:</span>{' '}
                          {log.csv_filename}
                        </div>
                      )}
                      {log.csv_row_number && (
                        <div>
                          <span className="text-muted-foreground">Fila:</span>{' '}
                          {log.csv_row_number}
                        </div>
                      )}
                    </div>

                    {/* Detalle de campos cambiados */}
                    {log.change_type === 'create' ? (
                      <p className="text-sm text-muted-foreground">
                        Producto creado
                      </p>
                    ) : (
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Campo</TableHead>
                            <TableHead>Valor anterior</TableHead>
                            <TableHead>Nuevo valor</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {Object.entries(log.fields_changed).map(
                            ([field, values]) => (
                              <TableRow key={field}>
                                <TableCell className="font-medium">
                                  {field}
                                </TableCell>
                                <TableCell className="text-red-600 max-w-xs truncate">
                                  {values.old || '(vacío)'}
                                </TableCell>
                                <TableCell className="text-green-600 max-w-xs truncate">
                                  {values.new || '(vacío)'}
                                </TableCell>
                              </TableRow>
                            )
                          )}
                        </TableBody>
                      </Table>
                    )}
                  </div>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        )}

        {/* Cargar más */}
        {hasMore && (
          <div className="text-center mt-4">
            <Button
              variant="outline"
              onClick={() => fetchLogs(false)}
              disabled={loading}
            >
              {loading ? 'Cargando...' : 'Cargar más'}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
