'use client';

import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { createClient } from '@/lib/supabase/client';
import {
  Upload,
  Download,
  FileSpreadsheet,
  AlertCircle,
  CheckCircle,
  XCircle,
  ChevronDown,
  ChevronUp,
  RefreshCw,
  FileText,
  Info,
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

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

interface ParsedProduct {
  row: number;
  data: Record<string, string>;
  errors: ValidationError[];
  warnings: ValidationWarning[];
  isValid: boolean;
}

interface ProductDiff {
  ref: string;
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
  products: ParsedProduct[];
  errorProducts?: ParsedProduct[];
  diffs: ProductDiff[];
  hasMore: boolean;
  hasMoreErrors?: boolean;
}

interface ImportResult {
  success: boolean;
  importId: string;
  created: number;
  updated: number;
  skipped: number;
  errors: { row: number; ref: string; error: string }[];
  hasMoreErrors: boolean;
}

type ImportMode = 'update' | 'add_only' | 'replace_all';
type Step = 'upload' | 'preview' | 'importing' | 'complete';

interface UploadedCSVRef {
  bucket: string;
  path: string;
  filename: string;
  token: string;
}

export function CSVProductManager() {
  const supabase = createClient();
  const [step, setStep] = useState<Step>('upload');
  const [file, setFile] = useState<File | null>(null);
  const [uploadedRef, setUploadedRef] = useState<UploadedCSVRef | null>(null);
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
      ?
        'Vercel está bloqueando la ruta (Deployment Protection/SSO). Desactiva la protección del deployment o permite acceso público a /api/* y redeploy.'
      :
        'La API devolvió una respuesta no-JSON.';

    throw new Error(`${hint} (HTTP ${response.status})`);
  };

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    const csvFile = acceptedFiles[0];
    if (!csvFile) return;

    setFile(csvFile);
    setUploadedRef(null);
    setError(null);
    setIsValidating(true);

    try {
      // Pedir signed upload URL
      const signedResp = await fetch('/api/products/csv/upload-url', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          filename: csvFile.name,
          contentType: csvFile.type || 'text/csv',
        }),
      });

      const signedResult = await parseApiResponse(signedResp);
      if (!signedResp.ok) {
        throw new Error(signedResult.error || 'No se pudo preparar la subida del archivo');
      }

      const { bucket, path, token, filename } = signedResult as {
        bucket: string;
        path: string;
        token: string;
        filename: string;
      };

      // Subir directo a Storage (evita pasar el CSV por Vercel)
      const { error: uploadError } = await supabase.storage
        .from(bucket)
        .uploadToSignedUrl(path, token, csvFile, {
          contentType: csvFile.type || 'text/csv',
        });

      if (uploadError) {
        throw new Error(uploadError.message || 'No se pudo subir el archivo');
      }

      setUploadedRef({ bucket, path, filename, token });

      // Validar usando referencia del archivo
      const response = await fetch('/api/products/csv/validate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          bucket,
          path,
          filename,
        }),
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
  }, [supabase]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'text/csv': ['.csv'],
      'application/vnd.ms-excel': ['.csv'],
    },
    maxFiles: 1,
  });

  const handleImport = async () => {
    if (!file || !uploadedRef) return;

    setIsImporting(true);
    setStep('importing');
    setError(null);

    try {
      const response = await fetch('/api/products/csv/import', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          bucket: uploadedRef.bucket,
          path: uploadedRef.path,
          filename: uploadedRef.filename,
          mode: importMode,
        }),
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
      ? '/api/products/csv/template?descriptions=true'
      : '/api/products/csv/template';
    window.open(url, '_blank');
  };

  const downloadExport = async () => {
    window.open('/api/products/csv/export', '_blank');
  };

  const invalidPreviewProducts = validationResult
    ? validationResult.errorProducts ?? validationResult.products.filter((product) => !product.isValid)
    : [];

  return (
    <div className="space-y-6">
      {/* Header con opciones de descarga */}
      <div className="flex flex-wrap gap-4 justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Gestión de Productos CSV</h2>
          <p className="text-muted-foreground">
            Importa, exporta y sincroniza productos masivamente
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => downloadTemplate(false)}>
            <Download className="w-4 h-4 mr-2" />
            Descargar plantilla vacía
          </Button>
          <Button variant="outline" onClick={() => downloadTemplate(true)}>
            <FileText className="w-4 h-4 mr-2" />
            Descargar plantilla con instrucciones
          </Button>
          <Button variant="secondary" onClick={downloadExport}>
            <FileSpreadsheet className="w-4 h-4 mr-2" />
            Exportar productos
          </Button>
        </div>
      </div>

      {/* Error global */}
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
            <CardTitle>Subir archivo CSV</CardTitle>
            <CardDescription>
              Arrastra un archivo CSV o haz clic para seleccionarlo
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div
              {...getRootProps()}
              className={`
                border-2 border-dashed rounded-lg p-12 text-center cursor-pointer
                transition-colors
                ${isDragActive ? 'border-primary bg-primary/5' : 'border-muted-foreground/25'}
                ${isValidating ? 'opacity-50 pointer-events-none' : ''}
              `}
            >
              <input {...getInputProps()} />
              {isValidating ? (
                <div className="flex flex-col items-center gap-4">
                  <RefreshCw className="w-12 h-12 animate-spin text-primary" />
                  <p className="text-lg">Validando archivo...</p>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-4">
                  <Upload className="w-12 h-12 text-muted-foreground" />
                  <div>
                    <p className="text-lg font-medium">
                      {isDragActive
                        ? 'Suelta el archivo aquí'
                        : 'Arrastra un archivo CSV aquí'}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      o haz clic para seleccionar
                    </p>
                  </div>
                </div>
              )}
            </div>

            <div className="mt-6 p-4 bg-muted rounded-lg">
              <div className="flex items-start gap-2">
                <Info className="w-5 h-5 text-blue-500 mt-0.5" />
                <div className="text-sm">
                  <p className="font-medium mb-1">Información importante:</p>
                  <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                    <li>El archivo debe estar en formato CSV con codificación UTF-8</li>
                    <li>Los campos obligatorios son: Ref, Producto, Precio_COP</li>
                    <li>Las imágenes deben ser URLs válidas</li>
                    <li>Los productos existentes se identifican por la columna Ref</li>
                  </ul>
                </div>
              </div>
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
                <p className="text-sm text-muted-foreground">Total filas</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="text-2xl font-bold text-green-600">
                  {validationResult.stats.valid}
                </div>
                <p className="text-sm text-muted-foreground">Válidas</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="text-2xl font-bold text-red-600">
                  {validationResult.stats.invalid}
                </div>
                <p className="text-sm text-muted-foreground">Con errores</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="text-2xl font-bold text-blue-600">
                  {validationResult.stats.toCreate}
                </div>
                <p className="text-sm text-muted-foreground">Nuevos</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="text-2xl font-bold text-amber-600">
                  {validationResult.stats.toUpdate}
                </div>
                <p className="text-sm text-muted-foreground">A actualizar</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="text-2xl font-bold text-gray-600">
                  {validationResult.stats.unchanged}
                </div>
                <p className="text-sm text-muted-foreground">Sin cambios</p>
              </CardContent>
            </Card>
          </div>

          {/* Errores globales */}
          {validationResult.globalErrors.length > 0 && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Problemas con el archivo</AlertTitle>
              <AlertDescription>
                <ul className="list-disc list-inside mt-2">
                  {validationResult.globalErrors.map((err, i) => (
                    <li key={i}>{err}</li>
                  ))}
                </ul>
              </AlertDescription>
            </Alert>
          )}

          {/* Tabs de preview */}
          <Tabs defaultValue="changes">
            <TabsList>
              <TabsTrigger value="changes">
                Cambios ({validationResult.stats.toCreate + validationResult.stats.toUpdate})
              </TabsTrigger>
              <TabsTrigger value="errors">
                Errores ({validationResult.stats.invalid})
              </TabsTrigger>
              <TabsTrigger value="all">Todos los productos</TabsTrigger>
            </TabsList>

            <TabsContent value="changes" className="mt-4">
              <Card>
                <CardContent className="pt-6">
                  <div className="max-h-96 overflow-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Ref</TableHead>
                          <TableHead>Acción</TableHead>
                          <TableHead>Campos modificados</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {validationResult.diffs
                          .filter((d) => d.changeType !== 'unchanged')
                          .map((diff) => (
                            <TableRow key={diff.ref}>
                              <TableCell className="font-mono">{diff.ref}</TableCell>
                              <TableCell>
                                <Badge
                                  variant={
                                    diff.changeType === 'create' ? 'default' : 'secondary'
                                  }
                                >
                                  {diff.changeType === 'create' ? 'Nuevo' : 'Actualizar'}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                {diff.changeType === 'create' ? (
                                  <span className="text-muted-foreground">
                                    Producto nuevo
                                  </span>
                                ) : (
                                  <div className="flex flex-wrap gap-1">
                                    {diff.changes.slice(0, 5).map((change) => (
                                      <Badge key={change.field} variant="outline">
                                        {change.field}
                                      </Badge>
                                    ))}
                                    {diff.changes.length > 5 && (
                                      <Badge variant="outline">
                                        +{diff.changes.length - 5} más
                                      </Badge>
                                    )}
                                  </div>
                                )}
                              </TableCell>
                            </TableRow>
                          ))}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="errors" className="mt-4">
              <Card>
                <CardContent className="pt-6">
                  {validationResult.stats.invalid === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <CheckCircle className="w-12 h-12 mx-auto mb-4 text-green-500" />
                      <p>No hay errores de validación</p>
                    </div>
                  ) : invalidPreviewProducts.length === 0 ? (
                    <Alert>
                      <Info className="h-4 w-4" />
                      <AlertTitle>No se pudo cargar el detalle de errores</AlertTitle>
                      <AlertDescription>
                        Hay filas inválidas en el archivo, pero no llegaron al preview.
                        Revalida el archivo para recargar el detalle.
                      </AlertDescription>
                    </Alert>
                  ) : (
                    <Accordion type="single" collapsible className="w-full">
                      {invalidPreviewProducts.map((product) => (
                          <AccordionItem key={product.row} value={`row-${product.row}`}>
                            <AccordionTrigger>
                              <div className="flex items-center gap-4">
                                <XCircle className="w-4 h-4 text-red-500" />
                                <span>Fila {product.row}</span>
                                <span className="font-mono text-sm">
                                  {product.data.Ref || '(sin referencia)'}
                                </span>
                                <Badge variant="destructive">
                                  {product.errors.length} error(es)
                                </Badge>
                              </div>
                            </AccordionTrigger>
                            <AccordionContent>
                              <ul className="space-y-2 pl-8">
                                {product.errors.map((err, i) => (
                                  <li key={i} className="text-sm">
                                    <span className="font-medium">{err.field}:</span>{' '}
                                    {err.message}
                                    {err.value && (
                                      <span className="text-muted-foreground">
                                        {' '}
                                        (valor: &quot;{err.value}&quot;)
                                      </span>
                                    )}
                                  </li>
                                ))}
                              </ul>
                            </AccordionContent>
                          </AccordionItem>
                        ))}
                    </Accordion>
                  )}
                  {validationResult.hasMoreErrors && (
                    <p className="text-center text-sm text-muted-foreground mt-4">
                      Mostrando los primeros 100 errores...
                    </p>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="all" className="mt-4">
              <Card>
                <CardContent className="pt-6">
                  <div className="max-h-96 overflow-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Fila</TableHead>
                          <TableHead>Ref</TableHead>
                          <TableHead>Producto</TableHead>
                          <TableHead>Precio</TableHead>
                          <TableHead>Estado</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {validationResult.products.map((product) => (
                          <TableRow key={product.row}>
                            <TableCell>{product.row}</TableCell>
                            <TableCell className="font-mono">
                              {product.data.Ref}
                            </TableCell>
                            <TableCell className="max-w-xs truncate">
                              {product.data.Producto}
                            </TableCell>
                            <TableCell>
                              ${Number(product.data.Precio_COP || 0).toLocaleString()}
                            </TableCell>
                            <TableCell>
                              {product.isValid ? (
                                <Badge variant="outline" className="text-green-600">
                                  <CheckCircle className="w-3 h-3 mr-1" />
                                  Válido
                                </Badge>
                              ) : (
                                <Badge variant="destructive">
                                  <XCircle className="w-3 h-3 mr-1" />
                                  {product.errors.length} error(es)
                                </Badge>
                              )}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                  {validationResult.hasMore && (
                    <p className="text-center text-sm text-muted-foreground mt-4">
                      Mostrando los primeros 100 productos...
                    </p>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          {/* Opciones de importación */}
          <Card>
            <CardHeader>
              <CardTitle>Opciones de importación</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col md:flex-row gap-6 items-start md:items-end">
                <div className="flex-1">
                  <label className="text-sm font-medium mb-2 block">
                    Modo de importación
                  </label>
                  <Select
                    value={importMode}
                    onValueChange={(v) => setImportMode(v as ImportMode)}
                  >
                    <SelectTrigger className="w-full md:w-64">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="update">
                        Actualizar existentes y crear nuevos
                      </SelectItem>
                      <SelectItem value="add_only">Solo agregar nuevos</SelectItem>
                      <SelectItem value="replace_all">
                        Reemplazar toda la base (peligroso)
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground mt-1">
                    {importMode === 'update' &&
                      'Los productos existentes se actualizarán con los nuevos valores'}
                    {importMode === 'add_only' &&
                      'Solo se crearán productos nuevos, los existentes no se modificarán'}
                    {importMode === 'replace_all' &&
                      '⚠️ Todos los productos serán reemplazados'}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" onClick={handleReset}>
                    Nueva importación
                  </Button>
                  <Button
                    onClick={handleImport}
                    disabled={validationResult.stats.invalid > 0}
                   aria-label="Importar">
                    {validationResult.stats.invalid > 0 ? (
                      'Corrige los errores primero'
                    ) : (
                      <>
                        <Upload className="w-4 h-4 mr-2" />
                        Importar {validationResult.stats.valid} productos
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Step: Importing */}
      {step === 'importing' && (
        <Card>
          <CardContent className="py-12">
            <div className="flex flex-col items-center gap-6">
              <RefreshCw className="w-16 h-16 animate-spin text-primary" />
              <div className="text-center">
                <h3 className="text-xl font-bold mb-2">Importando productos...</h3>
                <p className="text-muted-foreground">
                  Por favor espera mientras se procesan los productos
                </p>
              </div>
              <Progress value={33} className="w-64" />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step: Complete */}
      {step === 'complete' && importResult && (
        <div className="space-y-6">
          <Alert variant={importResult.success ? 'default' : 'destructive'}>
            {importResult.success ? (
              <CheckCircle className="h-4 w-4" />
            ) : (
              <AlertCircle className="h-4 w-4" />
            )}
            <AlertTitle>
              {importResult.success
                ? 'Importación completada'
                : 'Importación completada con errores'}
            </AlertTitle>
            <AlertDescription>
              Se procesaron {importResult.created + importResult.updated + importResult.skipped}{' '}
              productos
            </AlertDescription>
          </Alert>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="pt-6">
                <div className="text-2xl font-bold text-green-600">
                  {importResult.created}
                </div>
                <p className="text-sm text-muted-foreground">Creados</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="text-2xl font-bold text-blue-600">
                  {importResult.updated}
                </div>
                <p className="text-sm text-muted-foreground">Actualizados</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="text-2xl font-bold text-gray-600">
                  {importResult.skipped}
                </div>
                <p className="text-sm text-muted-foreground">Omitidos</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="text-2xl font-bold text-red-600">
                  {importResult.errors.length}
                </div>
                <p className="text-sm text-muted-foreground">Errores</p>
              </CardContent>
            </Card>
          </div>

          {importResult.errors.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-red-600">
                  Errores durante la importación
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Fila</TableHead>
                      <TableHead>Ref</TableHead>
                      <TableHead>Error</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {importResult.errors.map((err, i) => (
                      <TableRow key={i}>
                        <TableCell>{err.row}</TableCell>
                        <TableCell className="font-mono">{err.ref}</TableCell>
                        <TableCell>{err.error}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                {importResult.hasMoreErrors && (
                  <p className="text-center text-sm text-muted-foreground mt-4">
                    Mostrando los primeros 20 errores...
                  </p>
                )}
              </CardContent>
            </Card>
          )}

          <div className="flex justify-center">
            <Button onClick={handleReset} aria-label="Nueva importación">
              <RefreshCw className="w-4 h-4 mr-2" />
              Nueva importación
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
