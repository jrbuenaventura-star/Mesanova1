'use client';

import { useState, useEffect } from 'react';
import { format, formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import {
  AlertTriangle,
  AlertCircle,
  Clock,
  CheckCircle,
  RefreshCw,
  Bell,
  BellOff,
  User,
  Building,
  Calendar,
  DollarSign,
  MessageSquare,
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface DistributorAlert {
  id: string;
  distributor_id: string;
  agent_id: string | null;
  alert_type: 'inactivity_warning' | 'inactivity_critical' | 'inactivity_dormant';
  days_since_purchase: number;
  last_purchase_date: string | null;
  last_purchase_amount: number | null;
  is_read: boolean;
  is_resolved: boolean;
  resolved_at: string | null;
  resolution_notes: string | null;
  created_at: string;
  distributor: {
    id: string;
    company_name: string;
  };
  agent: {
    id: string;
    user_profiles: {
      full_name: string;
    };
  } | null;
}

interface AlertStats {
  total: number;
  warning: number;
  critical: number;
  dormant: number;
}

interface DistributorAlertsProps {
  showGenerateButton?: boolean;
}

export function DistributorAlerts({ showGenerateButton = false }: DistributorAlertsProps) {
  const [alerts, setAlerts] = useState<DistributorAlert[]>([]);
  const [stats, setStats] = useState<AlertStats>({ total: 0, warning: 0, critical: 0, dormant: 0 });
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [filter, setFilter] = useState<'all' | 'unresolved'>('unresolved');
  const [selectedAlert, setSelectedAlert] = useState<DistributorAlert | null>(null);
  const [showResolveDialog, setShowResolveDialog] = useState(false);
  const [resolutionNotes, setResolutionNotes] = useState('');
  const [resolving, setResolving] = useState(false);

  useEffect(() => {
    fetchAlerts();
  }, [filter]);

  const fetchAlerts = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filter === 'unresolved') params.set('unresolved', 'true');

      const response = await fetch(`/api/alerts/distributors?${params}`);
      const data = await response.json();

      if (response.ok) {
        setAlerts(data.alerts || []);
        setStats(data.stats || { total: 0, warning: 0, critical: 0, dormant: 0 });
      }
    } catch (error) {
      console.error('Error fetching alerts:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateAlerts = async () => {
    setGenerating(true);
    try {
      const response = await fetch('/api/alerts/distributors', {
        method: 'POST',
      });
      const data = await response.json();

      if (response.ok) {
        alert(`${data.message}`);
        fetchAlerts();
      }
    } catch (error) {
      console.error('Error generating alerts:', error);
    } finally {
      setGenerating(false);
    }
  };

  const markAsRead = async (alertId: string) => {
    try {
      await fetch('/api/alerts/distributors', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ alertId, action: 'mark_read' }),
      });

      setAlerts(alerts.map(a =>
        a.id === alertId ? { ...a, is_read: true } : a
      ));
    } catch (error) {
      console.error('Error marking as read:', error);
    }
  };

  const resolveAlert = async () => {
    if (!selectedAlert) return;

    setResolving(true);
    try {
      const response = await fetch('/api/alerts/distributors', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          alertId: selectedAlert.id,
          action: 'resolve',
          notes: resolutionNotes,
        }),
      });

      if (response.ok) {
        setAlerts(alerts.map(a =>
          a.id === selectedAlert.id
            ? { ...a, is_resolved: true, resolved_at: new Date().toISOString(), resolution_notes: resolutionNotes }
            : a
        ));
        setShowResolveDialog(false);
        setSelectedAlert(null);
        setResolutionNotes('');
      }
    } catch (error) {
      console.error('Error resolving alert:', error);
    } finally {
      setResolving(false);
    }
  };

  const getAlertConfig = (type: string) => {
    const configs: Record<string, { icon: React.ReactNode; color: string; label: string; bgColor: string }> = {
      inactivity_warning: {
        icon: <Clock className="w-5 h-5" />,
        color: 'text-amber-600',
        bgColor: 'bg-amber-50 border-amber-200',
        label: 'Advertencia (30+ días)',
      },
      inactivity_critical: {
        icon: <AlertTriangle className="w-5 h-5" />,
        color: 'text-orange-600',
        bgColor: 'bg-orange-50 border-orange-200',
        label: 'Crítico (60+ días)',
      },
      inactivity_dormant: {
        icon: <AlertCircle className="w-5 h-5" />,
        color: 'text-red-600',
        bgColor: 'bg-red-50 border-red-200',
        label: 'Dormido (90+ días)',
      },
    };
    return configs[type] || configs.inactivity_warning;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Bell className="w-6 h-6" />
            Alertas de Distribuidores
          </h2>
          <p className="text-muted-foreground">
            Distribuidores que no han comprado recientemente
          </p>
        </div>
        <div className="flex gap-2">
          {showGenerateButton && (
            <Button variant="outline" onClick={generateAlerts} disabled={generating}>
              {generating ? (
                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Bell className="w-4 h-4 mr-2" />
              )}
              Generar Alertas
            </Button>
          )}
          <Button variant="outline" onClick={fetchAlerts} disabled={loading}>
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Actualizar
          </Button>
        </div>
      </div>

      {/* Estadísticas */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold">{stats.total}</div>
                <p className="text-sm text-muted-foreground">Total alertas</p>
              </div>
              <Bell className="w-8 h-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
        <Card className="border-amber-200 bg-amber-50">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold text-amber-600">{stats.warning}</div>
                <p className="text-sm text-amber-700">Advertencia</p>
              </div>
              <Clock className="w-8 h-8 text-amber-500" />
            </div>
          </CardContent>
        </Card>
        <Card className="border-orange-200 bg-orange-50">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold text-orange-600">{stats.critical}</div>
                <p className="text-sm text-orange-700">Crítico</p>
              </div>
              <AlertTriangle className="w-8 h-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold text-red-600">{stats.dormant}</div>
                <p className="text-sm text-red-700">Dormido</p>
              </div>
              <AlertCircle className="w-8 h-8 text-red-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filtros */}
      <Tabs value={filter} onValueChange={(v) => setFilter(v as 'all' | 'unresolved')}>
        <TabsList>
          <TabsTrigger value="unresolved">Sin resolver</TabsTrigger>
          <TabsTrigger value="all">Todas</TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Lista de alertas */}
      {loading ? (
        <div className="text-center py-12">
          <RefreshCw className="w-8 h-8 animate-spin mx-auto text-muted-foreground" />
          <p className="mt-2 text-muted-foreground">Cargando alertas...</p>
        </div>
      ) : alerts.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <BellOff className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium">No hay alertas</h3>
            <p className="text-muted-foreground">
              {filter === 'unresolved'
                ? 'Todas las alertas han sido resueltas'
                : 'No se han generado alertas aún'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {alerts.map(alert => {
            const config = getAlertConfig(alert.alert_type);

            return (
              <Card
                key={alert.id}
                className={`${config.bgColor} ${!alert.is_read ? 'ring-2 ring-primary' : ''} ${alert.is_resolved ? 'opacity-60' : ''}`}
              >
                <CardContent className="py-4">
                  <div className="flex items-start gap-4">
                    <div className={config.color}>{config.icon}</div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge variant="outline" className={config.color}>
                          {config.label}
                        </Badge>
                        {!alert.is_read && (
                          <Badge variant="default" className="text-xs">Nuevo</Badge>
                        )}
                        {alert.is_resolved && (
                          <Badge variant="secondary" className="text-xs">
                            <CheckCircle className="w-3 h-3 mr-1" />
                            Resuelto
                          </Badge>
                        )}
                      </div>

                      <div className="flex items-center gap-2 mb-2">
                        <Building className="w-4 h-4 text-muted-foreground" />
                        <span className="font-medium">{alert.distributor?.company_name}</span>
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <span className="text-muted-foreground">Días sin comprar:</span>
                          <p className={`font-bold ${config.color}`}>{alert.days_since_purchase}</p>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Última compra:</span>
                          <p className="font-medium">
                            {alert.last_purchase_date
                              ? format(new Date(alert.last_purchase_date), 'dd/MM/yyyy')
                              : 'Nunca'}
                          </p>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Monto última:</span>
                          <p className="font-medium">
                            {alert.last_purchase_amount
                              ? `$${alert.last_purchase_amount.toLocaleString()}`
                              : '-'}
                          </p>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Corredor:</span>
                          <p className="font-medium">
                            {alert.agent?.user_profiles?.full_name || 'Sin asignar'}
                          </p>
                        </div>
                      </div>

                      {alert.resolution_notes && (
                        <div className="mt-3 p-2 bg-white/50 rounded text-sm">
                          <MessageSquare className="w-3 h-3 inline mr-1" />
                          {alert.resolution_notes}
                        </div>
                      )}
                    </div>

                    <div className="flex flex-col gap-2">
                      {!alert.is_read && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => markAsRead(alert.id)}
                        >
                          Marcar leída
                        </Button>
                      )}
                      {!alert.is_resolved && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSelectedAlert(alert);
                            setShowResolveDialog(true);
                          }}
                        >
                          <CheckCircle className="w-4 h-4 mr-1" />
                          Resolver
                        </Button>
                      )}
                    </div>
                  </div>

                  <div className="mt-2 text-xs text-muted-foreground">
                    Creada {formatDistanceToNow(new Date(alert.created_at), { addSuffix: true, locale: es })}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Dialog para resolver */}
      <Dialog open={showResolveDialog} onOpenChange={setShowResolveDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Resolver Alerta</DialogTitle>
            <DialogDescription>
              Marca esta alerta como resuelta y agrega notas opcionales
            </DialogDescription>
          </DialogHeader>

          {selectedAlert && (
            <div className="space-y-4">
              <div className="p-4 bg-muted rounded-lg">
                <p className="font-medium">{selectedAlert.distributor?.company_name}</p>
                <p className="text-sm text-muted-foreground">
                  {selectedAlert.days_since_purchase} días sin comprar
                </p>
              </div>

              <div>
                <label className="text-sm font-medium">Notas de resolución (opcional)</label>
                <Textarea
                  value={resolutionNotes}
                  onChange={(e) => setResolutionNotes(e.target.value)}
                  placeholder="Ej: Se contactó al cliente, visitará la próxima semana..."
                  className="mt-1"
                  rows={3}
                />
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowResolveDialog(false)}>
              Cancelar
            </Button>
            <Button onClick={resolveAlert} disabled={resolving}>
              {resolving ? (
                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <CheckCircle className="w-4 h-4 mr-2" />
              )}
              Resolver Alerta
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
