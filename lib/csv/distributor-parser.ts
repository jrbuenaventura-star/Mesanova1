import {
  DistributorCSVRow,
  CSV_HEADERS,
  REQUIRED_FIELDS,
  REQUIRED_FOR_NEW,
  BOOLEAN_FIELDS,
  NUMERIC_FIELDS,
  VALID_DOCUMENT_TYPES,
} from './distributor-template';

export interface ParsedDistributor {
  row: number;
  data: DistributorCSVRow;
  errors: ValidationError[];
  warnings: ValidationWarning[];
  isValid: boolean;
}

export interface ValidationError {
  field: keyof DistributorCSVRow;
  message: string;
  value: string;
}

export interface ValidationWarning {
  field: keyof DistributorCSVRow;
  message: string;
  value: string;
}

export interface CSVParseResult {
  success: boolean;
  totalRows: number;
  validRows: number;
  invalidRows: number;
  distributors: ParsedDistributor[];
  globalErrors: string[];
}

export interface DistributorChange {
  field: string;
  oldValue: string | null;
  newValue: string | null;
}

export interface DistributorDiff {
  companyRif: string;
  changeType: 'create' | 'update' | 'unchanged';
  changes: DistributorChange[];
  existingId?: string;
  existingUserId?: string;
}

function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    const nextChar = line[i + 1];
    
    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  
  result.push(current.trim());
  return result;
}

function validateRow(
  row: DistributorCSVRow,
  rowNumber: number,
  isNew: boolean
): { errors: ValidationError[]; warnings: ValidationWarning[] } {
  const errors: ValidationError[] = [];
  const warnings: ValidationWarning[] = [];
  
  // Validar campos requeridos siempre
  for (const field of REQUIRED_FIELDS) {
    if (!row[field] || row[field].trim() === '') {
      errors.push({
        field,
        message: `El campo ${field} es obligatorio`,
        value: row[field] || '',
      });
    }
  }
  
  // Validar campos requeridos para nuevos distribuidores
  if (isNew) {
    for (const field of REQUIRED_FOR_NEW) {
      if (!row[field] || row[field].trim() === '') {
        errors.push({
          field,
          message: `El campo ${field} es obligatorio para nuevos distribuidores`,
          value: row[field] || '',
        });
      }
    }
  }
  
  // Validar email si está presente
  if (row.email && row.email.trim() !== '') {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(row.email.trim())) {
      errors.push({
        field: 'email',
        message: 'Email inválido',
        value: row.email,
      });
    }
  }
  
  // Validar campos numéricos
  for (const field of NUMERIC_FIELDS) {
    const value = row[field];
    if (value && value.trim() !== '') {
      const numValue = parseFloat(value.replace(/[,$]/g, ''));
      if (isNaN(numValue)) {
        errors.push({
          field,
          message: `El campo ${field} debe ser un número válido`,
          value,
        });
      } else if (numValue < 0) {
        errors.push({
          field,
          message: `El campo ${field} no puede ser negativo`,
          value,
        });
      }
    }
  }
  
  // Validar discount_percentage (0-100)
  if (row.discount_percentage && row.discount_percentage.trim() !== '') {
    const discount = parseFloat(row.discount_percentage);
    if (!isNaN(discount) && (discount < 0 || discount > 100)) {
      errors.push({
        field: 'discount_percentage',
        message: 'El descuento debe estar entre 0 y 100',
        value: row.discount_percentage,
      });
    }
  }
  
  // Validar campos booleanos
  for (const field of BOOLEAN_FIELDS) {
    const value = row[field]?.toUpperCase();
    if (value && value !== '' && value !== 'SI' && value !== 'NO' && value !== 'TRUE' && value !== 'FALSE' && value !== '1' && value !== '0') {
      errors.push({
        field,
        message: `El campo ${field} debe ser SI/NO`,
        value: row[field],
      });
    }
  }
  
  // Validar tipo de documento
  if (row.document_type && row.document_type.trim() !== '') {
    if (!VALID_DOCUMENT_TYPES.some(t => t.toLowerCase() === row.document_type.toLowerCase())) {
      warnings.push({
        field: 'document_type',
        message: `Tipo de documento "${row.document_type}" no reconocido. Válidos: ${VALID_DOCUMENT_TYPES.join(', ')}`,
        value: row.document_type,
      });
    }
  }
  
  // Warning si no hay teléfono
  if (!row.phone || row.phone.trim() === '') {
    warnings.push({
      field: 'phone',
      message: 'Se recomienda incluir teléfono de contacto',
      value: '',
    });
  }
  
  return { errors, warnings };
}

export function parseCSV(csvContent: string): CSVParseResult {
  const lines = csvContent.split(/\r?\n/).filter(line => line.trim() !== '');
  const globalErrors: string[] = [];
  const distributors: ParsedDistributor[] = [];
  
  if (lines.length === 0) {
    return {
      success: false,
      totalRows: 0,
      validRows: 0,
      invalidRows: 0,
      distributors: [],
      globalErrors: ['El archivo está vacío'],
    };
  }
  
  // Parsear headers
  const headerLine = lines[0];
  const headers = parseCSVLine(headerLine);
  
  // Verificar que los headers coincidan
  const missingHeaders = CSV_HEADERS.filter(h => !headers.includes(h));
  const extraHeaders = headers.filter(h => !CSV_HEADERS.includes(h as keyof DistributorCSVRow));
  
  if (missingHeaders.length > 0) {
    globalErrors.push(`Columnas faltantes: ${missingHeaders.join(', ')}`);
  }
  
  if (extraHeaders.length > 0) {
    globalErrors.push(`Columnas no reconocidas (serán ignoradas): ${extraHeaders.join(', ')}`);
  }
  
  // Crear mapa de índices
  const headerIndexMap: Record<string, number> = {};
  headers.forEach((h, i) => {
    headerIndexMap[h] = i;
  });
  
  // Saltar la primera fila si parece ser descripción
  let startRow = 1;
  if (lines.length > 1) {
    const secondLine = parseCSVLine(lines[1]);
    const firstValue = secondLine[0] || '';
    if (firstValue.length > 50 || firstValue.toLowerCase().includes('obligatorio')) {
      startRow = 2;
    }
  }
  
  // Parsear filas de datos
  for (let i = startRow; i < lines.length; i++) {
    const line = lines[i];
    if (line.trim() === '') continue;
    
    const values = parseCSVLine(line);
    
    // Crear objeto DistributorCSVRow
    const rowData: DistributorCSVRow = {} as DistributorCSVRow;
    for (const header of CSV_HEADERS) {
      const index = headerIndexMap[header];
      rowData[header] = index !== undefined ? (values[index] || '') : '';
    }
    
    // Validar (asumimos isNew=true por ahora, se ajusta en compareWithExisting)
    const { errors, warnings } = validateRow(rowData, i + 1, true);
    
    distributors.push({
      row: i + 1,
      data: rowData,
      errors,
      warnings,
      isValid: errors.length === 0,
    });
  }
  
  const validRows = distributors.filter(d => d.isValid).length;
  const invalidRows = distributors.filter(d => !d.isValid).length;
  
  return {
    success: invalidRows === 0 && globalErrors.length === 0,
    totalRows: distributors.length,
    validRows,
    invalidRows,
    distributors,
    globalErrors,
  };
}

export function compareWithExisting(
  newDistributors: ParsedDistributor[],
  existingDistributors: Map<string, { id: string; user_id: string; data: Record<string, unknown> }>
): DistributorDiff[] {
  const diffs: DistributorDiff[] = [];
  
  for (const newDist of newDistributors) {
    if (!newDist.isValid) continue;
    
    const rif = newDist.data.company_rif.trim();
    const existing = existingDistributors.get(rif);
    
    if (!existing) {
      // Nuevo distribuidor - revalidar con isNew=true
      const { errors } = validateRow(newDist.data, newDist.row, true);
      if (errors.length > 0) {
        // Actualizar errores del distribuidor
        newDist.errors = errors;
        newDist.isValid = false;
      }
      
      diffs.push({
        companyRif: rif,
        changeType: 'create',
        changes: [],
      });
    } else {
      // Comparar campos
      const changes: DistributorChange[] = [];
      
      const fieldMappings: Record<keyof DistributorCSVRow, string> = {
        company_rif: 'company_rif',
        company_name: 'company_name',
        business_type: 'business_type',
        email: '_email', // No se actualiza
        full_name: '_full_name', // Se actualiza en user_profiles
        phone: '_phone', // Se actualiza en user_profiles
        document_type: '_document_type', // Se actualiza en user_profiles
        document_number: '_document_number', // Se actualiza en user_profiles
        discount_percentage: 'discount_percentage',
        credit_limit: 'credit_limit',
        is_active: 'is_active',
      };
      
      for (const [csvField, dbField] of Object.entries(fieldMappings)) {
        if (dbField.startsWith('_')) continue; // Skip special fields for diff display
        
        const newValue = newDist.data[csvField as keyof DistributorCSVRow] || '';
        const oldValue = String(existing.data[dbField] || '');
        
        const normalizedNew = normalizeValue(newValue, csvField as keyof DistributorCSVRow);
        const normalizedOld = normalizeValue(oldValue, csvField as keyof DistributorCSVRow);
        
        if (normalizedNew !== normalizedOld) {
          changes.push({
            field: csvField,
            oldValue: oldValue || null,
            newValue: newValue || null,
          });
        }
      }
      
      if (changes.length > 0) {
        diffs.push({
          companyRif: rif,
          changeType: 'update',
          changes,
          existingId: existing.id,
          existingUserId: existing.user_id,
        });
      } else {
        diffs.push({
          companyRif: rif,
          changeType: 'unchanged',
          changes: [],
          existingId: existing.id,
          existingUserId: existing.user_id,
        });
      }
    }
  }
  
  return diffs;
}

function normalizeValue(value: string, field: keyof DistributorCSVRow): string {
  if (!value) return '';
  
  // Para booleanos
  if (BOOLEAN_FIELDS.includes(field)) {
    const upper = value.toUpperCase();
    if (upper === 'SI' || upper === 'TRUE' || upper === '1') return 'true';
    if (upper === 'NO' || upper === 'FALSE' || upper === '0') return 'false';
    return value.toLowerCase();
  }
  
  // Para numéricos
  if (NUMERIC_FIELDS.includes(field)) {
    const num = parseFloat(value.replace(/[,$]/g, ''));
    return isNaN(num) ? '' : num.toString();
  }
  
  return value.trim().toLowerCase();
}

export function parseBooleanValue(value: string): boolean {
  if (!value) return true; // Default to active
  const upper = value.toUpperCase();
  return upper === 'SI' || upper === 'TRUE' || upper === '1';
}

export function parseNumericValue(value: string): number | null {
  if (!value || value.trim() === '') return null;
  const num = parseFloat(value.replace(/[,$]/g, ''));
  return isNaN(num) ? null : num;
}
