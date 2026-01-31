import {
  ProductCSVRow,
  CSV_HEADERS,
  REQUIRED_FIELDS,
  BOOLEAN_FIELDS,
  NUMERIC_FIELDS,
  VALID_CATEGORIES,
  VALID_ROTACION,
  HORECA_VALUES,
  parseDateDDMMYYYY,
  normalizeNumeric,
  normalizeBoolean,
  normalizeEstado,
  normalizeHoReCa,
} from './product-template';

export interface ParsedProduct {
  row: number;
  data: ProductCSVRow;
  errors: ValidationError[];
  warnings: ValidationWarning[];
  isValid: boolean;
}

export interface ValidationError {
  field: keyof ProductCSVRow;
  message: string;
  value: string;
}

export interface ValidationWarning {
  field: keyof ProductCSVRow;
  message: string;
  value: string;
}

export interface CSVParseResult {
  success: boolean;
  totalRows: number;
  validRows: number;
  invalidRows: number;
  products: ParsedProduct[];
  globalErrors: string[];
}

export interface ProductChange {
  field: string;
  oldValue: string | null;
  newValue: string | null;
}

export interface ProductDiff {
  ref: string;
  changeType: 'create' | 'update' | 'unchanged';
  changes: ProductChange[];
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

function splitCSVRows(csvContent: string): string[] {
  const rows: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < csvContent.length; i++) {
    const char = csvContent[i];
    const nextChar = csvContent[i + 1];

    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        current += '"';
        i++;
        continue;
      }
      inQuotes = !inQuotes;
      current += char;
      continue;
    }

    if (!inQuotes && (char === '\n' || char === '\r')) {
      if (char === '\r' && nextChar === '\n') {
        i++;
      }

      if (current.trim() !== '') {
        rows.push(current);
      }
      current = '';
      continue;
    }

    current += char;
  }

  if (current.trim() !== '') {
    rows.push(current);
  }

  return rows;
}

function validateRow(row: ProductCSVRow, rowNumber: number): { errors: ValidationError[]; warnings: ValidationWarning[] } {
  const errors: ValidationError[] = [];
  const warnings: ValidationWarning[] = [];
  
  // Validar campos requeridos
  for (const field of REQUIRED_FIELDS) {
    if (!row[field] || row[field].trim() === '') {
      errors.push({
        field,
        message: `El campo ${field} es obligatorio`,
        value: row[field] || '',
      });
    }
  }
  
  // Validar campos numéricos
  for (const field of NUMERIC_FIELDS) {
    const value = row[field];
    if (value && value.trim() !== '') {
      const numValue = normalizeNumeric(value);
      if (numValue === null || isNaN(numValue)) {
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
  
  // Validar campos booleanos
  for (const field of BOOLEAN_FIELDS) {
    const value = row[field]?.toUpperCase();
    if (value && value !== '' && value !== 'SI' && value !== 'SÍ' && value !== 'NO' && value !== 'TRUE' && value !== 'FALSE' && value !== '1' && value !== '0' && value !== 'YES') {
      errors.push({
        field,
        message: `El campo ${field} debe ser SI/NO`,
        value: row[field],
      });
    }
  }
  
  // Validar Estado (ACTIVO/INACTIVO)
  if (row.Estado && row.Estado.trim() !== '') {
    const estado = row.Estado.toUpperCase().trim();
    const validEstados = ['ACTIVO', 'INACTIVO', 'ACTIVE', 'INACTIVE', 'SI', 'SÍ', 'NO', 'YES', 'TRUE', 'FALSE', '1', '0'];
    if (!validEstados.includes(estado)) {
      errors.push({
        field: 'Estado',
        message: 'El campo Estado debe ser ACTIVO o INACTIVO',
        value: row.Estado,
      });
    }
  }
  
  // Validar HoReCa (NO/EXCLUSIVO/SI)
  if (row.HoReCa && row.HoReCa.trim() !== '') {
    const horeca = row.HoReCa.toUpperCase().trim();
    const validHoReCa = ['NO', 'EXCLUSIVO', 'EXCLUSIVE', 'SI', 'SÍ', 'YES', 'TRUE', '1', '0', 'FALSE', 'AMBOS', 'BOTH'];
    if (!validHoReCa.includes(horeca)) {
      errors.push({
        field: 'HoReCa',
        message: `El campo HoReCa debe ser: ${HORECA_VALUES.join(', ')}`,
        value: row.HoReCa,
      });
    }
  }
  
  // Validar categorías (1, 2, 3)
  const categoryFields: { cat: keyof ProductCSVRow; sub: keyof ProductCSVRow; type: keyof ProductCSVRow; required: boolean }[] = [
    { cat: 'Categoria_1', sub: 'Subcategoria_1', type: 'Tipo_producto_1', required: true },
    { cat: 'Categoria_2', sub: 'Subcategoria_2', type: 'Tipo_producto_2', required: false },
    { cat: 'Categoria_3', sub: 'Subcategoria_3', type: 'Tipo_producto_3', required: false },
  ];
  
  for (const catSet of categoryFields) {
    const catValue = row[catSet.cat]?.trim() || '';
    const subValue = row[catSet.sub]?.trim() || '';
    const typeValue = row[catSet.type]?.trim() || '';
    
    // Si la categoría tiene valor, validar que sea válida
    if (catValue) {
      if (!VALID_CATEGORIES.some(c => c.toLowerCase() === catValue.toLowerCase())) {
        warnings.push({
          field: catSet.cat,
          message: `Categoría "${catValue}" no reconocida. Válidas: ${VALID_CATEGORIES.join(', ')}`,
          value: catValue,
        });
      }
      
      // Si hay categoría pero no subcategoría (y es requerido o parcialmente completado)
      if (!subValue && catSet.required) {
        // Ya está en REQUIRED_FIELDS
      } else if (!subValue && !catSet.required && (catValue || typeValue)) {
        warnings.push({
          field: catSet.sub,
          message: `Se recomienda completar ${catSet.sub} si se especifica ${catSet.cat}`,
          value: '',
        });
      }
    }
    
    // Si hay subcategoría sin categoría
    if (subValue && !catValue) {
      warnings.push({
        field: catSet.cat,
        message: `Falta ${catSet.cat} para ${catSet.sub}`,
        value: '',
      });
    }
  }
  
  // Validar rotación esperada
  if (row.Rotacion_Esperada && row.Rotacion_Esperada.trim() !== '') {
    const rotacion = row.Rotacion_Esperada.toLowerCase().trim();
    if (!VALID_ROTACION.includes(rotacion)) {
      errors.push({
        field: 'Rotacion_Esperada',
        message: `Rotación debe ser: ${VALID_ROTACION.join(', ')}`,
        value: row.Rotacion_Esperada,
      });
    }
  }
  
  // Validar descuento (0-100)
  if (row.Descuento && row.Descuento.trim() !== '') {
    const descuento = parseFloat(row.Descuento);
    if (!isNaN(descuento) && (descuento < 0 || descuento > 100)) {
      errors.push({
        field: 'Descuento',
        message: 'El descuento debe estar entre 0 y 100',
        value: row.Descuento,
      });
    }
  }
  
  // Validar margen sugerido (0-100)
  if (row.Margen_Sugerido && row.Margen_Sugerido.trim() !== '') {
    const margen = parseFloat(row.Margen_Sugerido);
    if (!isNaN(margen) && (margen < 0 || margen > 100)) {
      warnings.push({
        field: 'Margen_Sugerido',
        message: 'El margen sugerido parece fuera de rango normal (0-100%)',
        value: row.Margen_Sugerido,
      });
    }
  }
  
  // Validar fecha de lanzamiento (acepta DD/MM/YYYY, YYYY-MM-DD, o serial de Excel)
  if (row.Fecha_Lanzamiento && row.Fecha_Lanzamiento.trim() !== '') {
    const parsedDate = parseDateDDMMYYYY(row.Fecha_Lanzamiento);
    if (!parsedDate) {
      errors.push({
        field: 'Fecha_Lanzamiento',
        message: 'La fecha debe tener formato DD/MM/YYYY o DD/MM/AA (ej: 15/01/2026 o 15/01/26)',
        value: row.Fecha_Lanzamiento,
      });
    } else {
      const date = new Date(parsedDate);
      if (isNaN(date.getTime())) {
        errors.push({
          field: 'Fecha_Lanzamiento',
          message: 'Fecha inválida',
          value: row.Fecha_Lanzamiento,
        });
      }
    }
  }
  
  // Validar URLs de imágenes
  const imageFields: (keyof ProductCSVRow)[] = [
    'Image_1', 'Image_2', 'Image_3', 'Image_4', 'Image_5',
    'Image_6', 'Image_7', 'Image_8', 'Image_9', 'Image_10',
  ];
  
  for (const field of imageFields) {
    const value = row[field];
    if (value && value.trim() !== '') {
      try {
        new URL(value);
      } catch {
        errors.push({
          field,
          message: 'URL de imagen inválida',
          value,
        });
      }
    }
  }
  
  // Validar Video URL
  if (row.Video_URL && row.Video_URL.trim() !== '') {
    try {
      new URL(row.Video_URL);
    } catch {
      errors.push({
        field: 'Video_URL',
        message: 'URL de video inválida',
        value: row.Video_URL,
      });
    }
  }
  
  // Validar Ficha Técnica URL
  if (row.Ficha_Tecnica_URL && row.Ficha_Tecnica_URL.trim() !== '') {
    try {
      new URL(row.Ficha_Tecnica_URL);
    } catch {
      errors.push({
        field: 'Ficha_Tecnica_URL',
        message: 'URL de ficha técnica inválida',
        value: row.Ficha_Tecnica_URL,
      });
    }
  }
  
  // Warning si no hay imagen principal
  if (!row.Image_1 || row.Image_1.trim() === '') {
    warnings.push({
      field: 'Image_1',
      message: 'Se recomienda incluir al menos una imagen',
      value: '',
    });
  }
  
  return { errors, warnings };
}

export function parseCSV(csvContent: string): CSVParseResult {
  const lines = splitCSVRows(csvContent).filter(line => line.trim() !== '');
  const globalErrors: string[] = [];
  const products: ParsedProduct[] = [];
  
  if (lines.length === 0) {
    return {
      success: false,
      totalRows: 0,
      validRows: 0,
      invalidRows: 0,
      products: [],
      globalErrors: ['El archivo está vacío'],
    };
  }
  
  // Parsear headers
  const headerLine = lines[0];
  const headers = parseCSVLine(headerLine);
  
  // Verificar que los headers coincidan
  const missingHeaders = CSV_HEADERS.filter(h => !headers.includes(h));
  const extraHeaders = headers.filter(h => !CSV_HEADERS.includes(h as keyof ProductCSVRow));
  
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
  
  // Saltar la primera fila si parece ser descripción (contiene texto largo)
  let startRow = 1;
  if (lines.length > 1) {
    const secondLine = parseCSVLine(lines[1]);
    const firstValue = secondLine[0] || '';
    // Si el primer valor de la segunda fila tiene más de 50 caracteres, probablemente es descripción
    if (firstValue.length > 50 || firstValue.toLowerCase().includes('obligatorio')) {
      startRow = 2;
    }
  }
  
  // Parsear filas de datos
  for (let i = startRow; i < lines.length; i++) {
    const line = lines[i];
    if (line.trim() === '') continue;
    
    const values = parseCSVLine(line);
    
    // Crear objeto ProductCSVRow
    const rowData: ProductCSVRow = {} as ProductCSVRow;
    for (const header of CSV_HEADERS) {
      const index = headerIndexMap[header];
      rowData[header] = index !== undefined ? (values[index] || '') : '';
    }
    
    // Validar
    const { errors, warnings } = validateRow(rowData, i + 1);
    
    products.push({
      row: i + 1,
      data: rowData,
      errors,
      warnings,
      isValid: errors.length === 0,
    });
  }
  
  const validRows = products.filter(p => p.isValid).length;
  const invalidRows = products.filter(p => !p.isValid).length;
  
  return {
    success: invalidRows === 0 && globalErrors.length === 0,
    totalRows: products.length,
    validRows,
    invalidRows,
    products,
    globalErrors,
  };
}

export function compareWithExisting(
  newProducts: ParsedProduct[],
  existingProducts: Map<string, Record<string, unknown>>
): ProductDiff[] {
  const diffs: ProductDiff[] = [];
  
  for (const newProduct of newProducts) {
    if (!newProduct.isValid) continue;
    
    const ref = newProduct.data.Ref;
    const existing = existingProducts.get(ref);
    
    if (!existing) {
      // Producto nuevo
      diffs.push({
        ref,
        changeType: 'create',
        changes: [],
      });
    } else {
      // Comparar campos
      const changes: ProductChange[] = [];
      
      const fieldMappings: Record<keyof ProductCSVRow, string> = {
        Ref: 'pdt_codigo',
        Ref_Pub: 'ref_pub',
        Cod_Barra: 'codigo_barras',
        Producto: 'nombre_comercial',
        Estado: 'is_active',
        Descripcion: 'pdt_descripcion',
        Marca: 'marca',
        Precio_COP: 'precio',
        Descuento: 'descuento_porcentaje',
        Existencia_inv: 'upp_existencia',
        Pedido_en_camino: 'pedido_en_camino',
        Descontinuado: 'descontinuado',
        Inner_pack: 'pdt_empaque',
        Outer_pack: 'outer_pack',
        Coleccion: 'nombre_coleccion',
        Categoria_1: '_category_1', // Handled separately via product_categories
        Subcategoria_1: '_subcategory_1',
        Tipo_producto_1: '_type_1',
        Categoria_2: '_category_2',
        Subcategoria_2: '_subcategory_2',
        Tipo_producto_2: '_type_2',
        Categoria_3: '_category_3',
        Subcategoria_3: '_subcategory_3',
        Tipo_producto_3: '_type_3',
        Material: 'material',
        Color: 'color',
        Dimensiones: 'dimensiones',
        Peso_kg: 'peso',
        Capacidad: 'capacidad',
        Pais_origen: 'pais_origen',
        Descrip_Cliente_Final: 'descripcion_larga',
        Momentos_Uso_Cliente: 'momentos_uso',
        Productos_Afines_Cliente: 'productos_afines_csv',
        Descrip_Distribuidor: 'descripcion_distribuidor',
        Argumentos_Venta_Distribuidor: 'argumentos_venta',
        Ubicacion_Tienda_Distribuidor: 'ubicacion_tienda',
        Margen_Sugerido: 'margen_sugerido',
        Rotacion_Esperada: 'rotacion_esperada',
        SEO_Title: 'seo_title',
        SEO_Description: 'seo_description',
        Tags: 'tags',
        Video_URL: 'video_url',
        Ficha_Tecnica_URL: 'ficha_tecnica_url',
        Fecha_Lanzamiento: 'fecha_lanzamiento',
        HoReCa: 'horeca',
        Image_1: 'imagen_principal_url',
        Image_2: '_image_2',
        Image_3: '_image_3',
        Image_4: '_image_4',
        Image_5: '_image_5',
        Image_6: '_image_6',
        Image_7: '_image_7',
        Image_8: '_image_8',
        Image_9: '_image_9',
        Image_10: '_image_10',
      };
      
      for (const [csvField, dbField] of Object.entries(fieldMappings)) {
        if (dbField.startsWith('_')) continue; // Skip special fields
        
        const newValue = newProduct.data[csvField as keyof ProductCSVRow] || '';
        const oldValue = String(existing[dbField] || '');
        
        // Normalize values for comparison
        const normalizedNew = normalizeValue(newValue, csvField as keyof ProductCSVRow);
        const normalizedOld = normalizeValue(oldValue, csvField as keyof ProductCSVRow);
        
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
          ref,
          changeType: 'update',
          changes,
        });
      } else {
        diffs.push({
          ref,
          changeType: 'unchanged',
          changes: [],
        });
      }
    }
  }
  
  return diffs;
}

function normalizeValue(value: string, field: keyof ProductCSVRow): string {
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
  return normalizeBoolean(value);
}

export function parseNumericValue(value: string): number | null {
  return normalizeNumeric(value);
}

export function parseEstadoValue(value: string): boolean {
  return normalizeEstado(value);
}

export function parseHoReCaValue(value: string): 'NO' | 'EXCLUSIVO' | 'SI' {
  return normalizeHoReCa(value);
}
