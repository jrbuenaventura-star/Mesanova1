'use client';

import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import {
  Upload,
  Download,
  FileSpreadsheet,
  AlertCircle,
  CheckCircle,
  XCircle,
  RefreshCw,
  Info,
  Mail,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
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

interface ValidationError {
  field: string;
  message: string;
  value: string;
}

interface ValidationWarning {
  field: string;
  message: string;
  value: string;
}

interface ParsedDistributor {
  row: number;
  data: Record<string, string>;
  errors: ValidationError[];
  warnings: ValidationWarning[];
  isValid: boolean;
}

interface DistributorDiff {
  companyRif: string;
  changeType: 'create' | 'update' | 'unchanged';
  changes: { field: string; oldValue: string | null; newValue: string | null }[];
}

interface ValidationResult {
  success: boolean;
  stats: {
    total: number;
    valid: number;
    invalid: number;
    toCreate: number;
    toUpdate: number;
    unchanged: number;
  };
  globalErrors: string[];
  distributors: ParsedDistributor[];
  diffs: DistributorDiff[];
  hasMore: boolean;
}

interface ImportResult {
  success: boolean;
  importId: string;
  created: number;
  updated: number;
  skipped: number;
  invited: number;
  errors: { row: number; companyRif: string; error: string }[];
  hasMoreErrors: boolean;
}

type ImportMode = 'update' | 'add_only';
type Step = 'upload' | 'preview' | 'importing' | 'complete';

export function CSVDistributorManager() {
  const [step, setStep] = useState<Step>('upload');
  const [file, setFile] = useState<File | null>(null);
  const [validationResult, setValidationResult] = useState<ValidationResult | null>(null);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [importMode, setImportMode] = useState<ImportMode>('update');
  const [isValidating, setIsValidating] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const parseApiResponse = async (response: Response) => {
    const contentType = response.headers.get('content-type') || '';
    if (contentType.includes('application/json')) {
      return response.json();
    }

    const text = await response.text();
    const isVercelProtected =
      response.status === 401 && (text.includes('_vercel_sso_nonce') || text.toLowerCase().includes('vercel'));

    const hint = isVercelProtected
      ? 'Vercel está bloqueando la ruta (Deployment Protection/SSO). Desactiva la protección del deployment o permite acceso público a /api/* y redeploy.'
      : 'La API devolvió una respuesta no-JSON.';

    throw new Error(`${hint} (HTTP ${response.status})`);
  };

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    const csvFile = acceptedFiles[0];
    if (!csvFile) return;

    setFile(csvFile);
    setError(null);
    setIsValidating(true);

    try {
      const formData = new FormData();
      formData.append('file', csvFile);

      const response = await fetch('/api/distributors/csv/validate', {
        method: 'POST',
        body: formData,
      });

      const result = await parseApiResponse(response);

      if (!response.ok) {
        throw new Error(result.error || 'Error al validar archivo');
      }

      setValidationResult(result);
      setStep('preview');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setIsValidating(false);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'text/csv': ['.csv'],
      'application/vnd.ms-excel': ['.csv'],
    },
    maxFiles: 1,
  });

  const handleImport = async () => {
    if (!file) return;

    setIsImporting(true);
    setStep('importing');
    setError(null);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('mode', importMode);

      const response = await fetch('/api/distributors/csv/import', {
        method: 'POST',
        body: formData,
      });

      const result = await parseApiResponse(response);

      if (!response.ok) {
        throw new Error(result.error || 'Error al importar archivo');
      }

      setImportResult(result);
      setStep('complete');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
      setStep('preview');
    } finally {
      setIsImporting(false);
    }
  };

  const handleReset = () => {
    setStep('upload');
    setFile(null);
    setValidationResult(null);
    setImportResult(null);
    setError(null);
  };

  const downloadTemplate = async (withDescriptions: boolean) => {
    const url = withDescriptions
      ? '/api/distributors/csv/template?descriptions=true'
      : '/api/distributors/csv/template';
    window.open(url, '_blank');
  };

  return (
    <div className="space-y-6">
      {/* Header con opciones de descarga */}
      <div className="flex flex-wrap gap-4 justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Importación de Distribuidores</h2>
          <p className="text-muted-foreground">
            Importa distribuidores masivamente desde un archivo CSV
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => downloadTemplate(false)}>
            <Download className="mr-2 h-4 w-4" />
            Plantilla Vacía
          </Button>
          <Button variant="outline" onClick={() => downloadTemplate(true)}>
            <FileSpreadsheet className="mr-2 h-4 w-4" />
            Plantilla con Instrucciones
          </Button>
        </div>
      </div>

      {/* Alerta informativa */}
      <Alert>
        <Info className="h-4 w-4" />
        <AlertTitle>Información importante</AlertTitle>
        <AlertDescription>
          <ul className="list-disc list-inside mt-2 space-y-1 text-sm">
            <li>Los distribuidores se identifican por su <strong>NIT/RIF (company_rif)</strong></li>
            <li>Los nuevos distribuidores recibirán un <strong>email de invitación</strong> para configurar su contraseña</li>
            <li>Las direcciones de envío se gestionan por separado (cada distribuidor puede tener varias)</li>
          </ul>
        </AlertDescription>
      </Alert>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Step: Upload */}
      {step === 'upload' && (
        <Card>
          <CardHeader>
            <CardTitle>Subir Archivo CSV</CardTitle>
            <CardDescription>
              Arrastra un archivo CSV o haz clic para seleccionar
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div
              {...getRootProps()}
              className={`border-2 border-dashed rounded-lg p-12 text-center cursor-pointer transition-colors
                ${isDragActive ? 'border-primary bg-primary/5' : 'border-muted-foreground/25 hover:border-primary/50'}`}
            >
              <input {...getInputProps()} />
              {isValidating ? (
                <div className="flex flex-col items-center gap-4">
                  <RefreshCw className="h-12 w-12 animate-spin text-primary" />
                  <p>Validando archivo...</p>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-4">
                  <Upload className="h-12 w-12 text-muted-foreground" />
                  <div>
                    <p className="text-lg font-medium">
                      {isDragActive ? 'Suelta el archivo aquí' : 'Arrastra tu archivo CSV aquí'}
                    </p>
                    <p className="text-sm text-muted-foreground mt-1">
                      o haz clic para seleccionar
                    </p>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step: Preview */}
      {step === 'preview' && validationResult && (
        <div className="space-y-6">
          {/* Estadísticas */}
          <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
            <Card>
              <CardContent className="pt-6">
                <div className="text-2xl font-bold">{validationResult.stats.total}</div>
                <p className="text-xs text-muted-foreground">Total filas</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="text-2xl font-bold text-green-600">{validationResult.stats.valid}</div>
                <p className="text-xs text-muted-foreground">Válidas</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="text-2xl font-bold text-red-600">{validationResult.stats.invalid}</div>
                <p className="text-xs text-muted-foreground">Con errores</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="text-2xl font-bold text-blue-600">{validationResult.stats.toCreate}</div>
                <p className="text-xs text-muted-foreground">A crear</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="text-2xl font-bold text-amber-600">{validationResult.stats.toUpdate}</div>
                <p className="text-xs text-muted-foreground">A actualizar</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="text-2xl font-bold text-gray-500">{validationResult.stats.unchanged}</div>
                <p className="text-xs text-muted-foreground">Sin cambios</p>
              </CardContent>
            </Card>
          </div>

          {/* Errores globales */}
          {validationResult.globalErrors.length > 0 && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Errores en el archivo</AlertTitle>
              <AlertDescription>
                <ul className="list-disc list-inside mt-2">
                  {validationResult.globalErrors.map((err, i) => (
                    <li key={i}>{err}</li>
                  ))}
                </ul>
              </AlertDescription>
            </Alert>
          )}

          {/* Preview de datos */}
          <Card>
            <CardHeader>
              <CardTitle>Vista previa de datos</CardTitle>
              <CardDescription>
                {validationResult.hasMore && 'Mostrando los primeros 100 registros'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-16">Fila</TableHead>
                      <TableHead>Estado</TableHead>
                      <TableHead>NIT/RIF</TableHead>
                      <TableHead>Empresa</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Contacto</TableHead>
                      <TableHead>Descuento</TableHead>
                      <TableHead>Crédito</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {validationResult.distributors.map((dist) => {
                      const diff = validationResult.diffs.find(
                        d => d.companyRif === dist.data.company_rif?.trim()
                      );
                      return (
                        <TableRow key={dist.row} className={!dist.isValid ? 'bg-red-50' : ''}>
                          <TableCell>{dist.row}</TableCell>
                          <TableCell>
                            {!dist.isValid ? (
                              <Badge variant="destructive">Error</Badge>
                            ) : diff?.changeType === 'create' ? (
                              <Badge className="bg-blue-600">Nuevo</Badge>
                            ) : diff?.changeType === 'update' ? (
                              <Badge className="bg-amber-600">Actualizar</Badge>
                            ) : (
                              <Badge variant="secondary">Sin cambios</Badge>
                            )}
                          </TableCell>
                          <TableCell className="font-mono text-sm">{dist.data.company_rif}</TableCell>
                          <TableCell>{dist.data.company_name}</TableCell>
                          <TableCell>{dist.data.email}</TableCell>
                          <TableCell>{dist.data.full_name}</TableCell>
                          <TableCell>{dist.data.discount_percentage}%</TableCell>
                          <TableCell>${Number(dist.data.credit_limit || 0).toLocaleString()}</TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>

              {/* Errores por fila */}
              {validationResult.distributors.some(d => d.errors.length > 0) && (
                <Accordion type="single" collapsible className="mt-4">
                  <AccordionItem value="errors">
                    <AccordionTrigger className="text-red-600">
                      <span className="flex items-center gap-2">
                        <XCircle className="h-4 w-4" />
                        Ver errores de validación ({validationResult.stats.invalid} filas)
                      </span>
                    </AccordionTrigger>
                    <AccordionContent>
                      <div className="space-y-2">
                        {validationResult.distributors
                          .filter(d => d.errors.length > 0)
                          .map(dist => (
                            <div key={dist.row} className="p-3 bg-red-50 rounded-md">
                              <p className="font-medium">Fila {dist.row}: {dist.data.company_name || 'Sin nombre'}</p>
                              <ul className="text-sm text-red-600 mt-1">
                                {dist.errors.map((err, i) => (
                                  <li key={i}>• {err.field}: {err.message}</li>
                                ))}
                              </ul>
                            </div>
                          ))}
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
              )}
            </CardContent>
          </Card>

          {/* Opciones de importación */}
          <Card>
            <CardHeader>
              <CardTitle>Opciones de importación</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-4 items-end">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Modo de importación</label>
                  <Select value={importMode} onValueChange={(v) => setImportMode(v as ImportMode)}>
                    <SelectTrigger className="w-[250px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="update">Crear nuevos y actualizar existentes</SelectItem>
                      <SelectItem value="add_only">Solo crear nuevos</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" onClick={handleReset}>
                    Cancelar
                  </Button>
                  <Button
                    onClick={handleImport}
                    disabled={validationResult.stats.invalid > 0}
                  >
                    <Upload className="mr-2 h-4 w-4" />
                    Importar {validationResult.stats.valid} distribuidores
                  </Button>
                </div>
              </div>
              {validationResult.stats.invalid > 0 && (
                <p className="text-sm text-red-600 mt-2">
                  Corrige los errores antes de importar
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Step: Importing */}
      {step === 'importing' && (
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col items-center gap-4">
              <RefreshCw className="h-12 w-12 animate-spin text-primary" />
              <div className="text-center">
                <p className="text-lg font-medium">Importando distribuidores...</p>
                <p className="text-sm text-muted-foreground">
                  Por favor no cierres esta página
                </p>
              </div>
              <Progress value={50} className="w-full max-w-md" />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step: Complete */}
      {step === 'complete' && importResult && (
        <div className="space-y-6">
          <Alert className={importResult.success ? 'border-green-500' : 'border-amber-500'}>
            {importResult.success ? (
              <CheckCircle className="h-4 w-4 text-green-500" />
            ) : (
              <AlertCircle className="h-4 w-4 text-amber-500" />
            )}
            <AlertTitle>
              {importResult.success
                ? 'Importación completada'
                : 'Importación completada con errores'}
            </AlertTitle>
            <AlertDescription>
              <div className="mt-2 space-y-1">
                <p>• <strong>{importResult.created}</strong> distribuidores creados</p>
                <p>• <strong>{importResult.updated}</strong> distribuidores actualizados</p>
                <p>• <strong>{importResult.skipped}</strong> sin cambios/omitidos</p>
                {importResult.invited > 0 && (
                  <p className="flex items-center gap-1">
                    <Mail className="h-4 w-4" />
                    <strong>{importResult.invited}</strong> invitaciones enviadas por email
                  </p>
                )}
                {importResult.errors.length > 0 && (
                  <p className="text-red-600">• <strong>{importResult.errors.length}</strong> errores</p>
                )}
              </div>
            </AlertDescription>
          </Alert>

          {importResult.errors.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-red-600">Errores durante la importación</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {importResult.errors.map((err, i) => (
                    <div key={i} className="p-3 bg-red-50 rounded-md">
                      <p className="font-medium">Fila {err.row}: {err.companyRif}</p>
                      <p className="text-sm text-red-600">{err.error}</p>
                    </div>
                  ))}
                  {importResult.hasMoreErrors && (
                    <p className="text-sm text-muted-foreground">
                      Hay más errores que no se muestran aquí
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          <div className="flex gap-2">
            <Button onClick={handleReset}>
              <RefreshCw className="mr-2 h-4 w-4" />
              Nueva importación
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
