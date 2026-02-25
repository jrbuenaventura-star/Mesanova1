import {
  ProductCSVRow,
  CSV_HEADERS,
  REQUIRED_FIELDS,
  BOOLEAN_FIELDS,
  NUMERIC_FIELDS,
  IMAGE_FIELDS,
  IMAGE_ALT_FIELDS,
  VALID_CATEGORIES,
  VALID_ROTACION,
  HORECA_VALUES,
  parseDateDDMMYYYY,
  normalizeNumeric,
  normalizeBoolean,
  normalizeEstado,
  normalizeHoReCa,
  parseBaseCategorySlug,
} from './product-template';

const IMAGE_FIELD_TO_ALT_FIELD: Record<(typeof IMAGE_FIELDS)[number], (typeof IMAGE_ALT_FIELDS)[number]> = {
  Image_1: 'SEO_Alt_Text_1',
  Image_2: 'SEO_Alt_Text_2',
  Image_3: 'SEO_Alt_Text_3',
  Image_4: 'SEO_Alt_Text_4',
  Image_5: 'SEO_Alt_Text_5',
  Image_6: 'SEO_Alt_Text_6',
  Image_7: 'SEO_Alt_Text_7',
  Image_8: 'SEO_Alt_Text_8',
  Image_9: 'SEO_Alt_Text_9',
  Image_10: 'SEO_Alt_Text_10',
};

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

  const nextSignificantChar = (startIndex: number) => {
    for (let j = startIndex; j < line.length; j++) {
      const candidate = line[j];
      if (candidate !== ' ' && candidate !== '\t') {
        return candidate;
      }
    }
    return undefined;
  };
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    const nextChar = line[i + 1];
    
    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        current += '"';
        i++;
        continue;
      }

      if (inQuotes) {
        // Treat as a closing quote only when followed by delimiter/EOL (ignoring spaces).
        const nextNonWhitespace = nextSignificantChar(i + 1);
        if (nextNonWhitespace === ',' || nextNonWhitespace === undefined) {
          inQuotes = false;
          continue;
        }

        // Tolerate stray quotes inside quoted values (e.g. inch marks 12").
        current += char;
        continue;
      }

      // Start quoted mode only at the beginning of the field (ignoring spaces).
      if (current.trim() === '') {
        inQuotes = true;
        continue;
      }

      // Tolerate stray quotes in unquoted values.
      current += char;
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
  let currentField = '';
  let inQuotes = false;

  const nextSignificantChar = (startIndex: number) => {
    for (let j = startIndex; j < csvContent.length; j++) {
      const candidate = csvContent[j];
      if (candidate !== ' ' && candidate !== '\t') {
        return candidate;
      }
    }
    return undefined;
  };

  for (let i = 0; i < csvContent.length; i++) {
    const char = csvContent[i];
    const nextChar = csvContent[i + 1];

    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        current += '""';
        currentField += '""';
        i++;
        continue;
      }

      if (inQuotes) {
        // Closing quote before delimiter/newline/EOL (ignoring spaces).
        const nextNonWhitespace = nextSignificantChar(i + 1);
        if (
          nextNonWhitespace === ',' ||
          nextNonWhitespace === '\n' ||
          nextNonWhitespace === '\r' ||
          nextNonWhitespace === undefined
        ) {
          inQuotes = false;
          current += char;
          currentField += char;
          continue;
        }

        // Tolerate stray quotes inside quoted values.
        current += char;
        currentField += char;
        continue;
      }

      // Opening quote only at field start (ignoring spaces).
      if (currentField.trim() === '') {
        inQuotes = true;
        current += char;
        currentField += char;
        continue;
      }

      // Stray quote in unquoted field.
      current += char;
      currentField += char;
      continue;
    }

    if (!inQuotes && char === ',') {
      current += char;
      currentField = '';
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
      currentField = '';
      continue;
    }

    current += char;
    currentField += char;
  }

  if (current.trim() !== '') {
    rows.push(current);
  }

  return rows;
}

function validateRow(row: ProductCSVRow, rowNumber: number): { errors: ValidationError[]; warnings: ValidationWarning[] } {
  const errors: ValidationError[] = [];
  const warnings: ValidationWarning[] = [];
  const normalizedHoReCa = normalizeHoReCa(row.HoReCa);
  const requiresHoReCaBaseCategory = normalizedHoReCa === 'SI' || normalizedHoReCa === 'EXCLUSIVO';
  const validCategorySlugs: string[] = [];
  
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
    if (field === 'Pedido_en_camino') continue;
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

  // Pedido_en_camino: aceptar SI/NO o cantidad numérica
  if (row.Pedido_en_camino && row.Pedido_en_camino.trim() !== '') {
    const raw = row.Pedido_en_camino.trim();
    const numericValue = normalizeNumeric(raw);
    const upper = raw.toUpperCase();
    const validBooleanLike = ['SI', 'SÍ', 'NO', 'TRUE', 'FALSE', '1', '0', 'YES', 'ACTIVO', 'INACTIVO', 'ACTIVE', 'INACTIVE'];

    if (numericValue === null && !validBooleanLike.includes(upper)) {
      errors.push({
        field: 'Pedido_en_camino',
        message: 'El campo Pedido_en_camino debe ser SI/NO o una cantidad numérica',
        value: row.Pedido_en_camino,
      });
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
  
  // Validar categorías (1, 2)
  const categoryFields: { cat: keyof ProductCSVRow; sub: keyof ProductCSVRow; type: keyof ProductCSVRow; required: boolean }[] = [
    { cat: 'Categoria_1', sub: 'Subcategoria_1', type: 'Tipo_producto_1', required: true },
    { cat: 'Categoria_2', sub: 'Subcategoria_2', type: 'Tipo_producto_2', required: false },
  ];
  
  for (const catSet of categoryFields) {
    const catValue = row[catSet.cat]?.trim() || '';
    const subValue = row[catSet.sub]?.trim() || '';
    const typeValue = row[catSet.type]?.trim() || '';
    
    // Si la categoría tiene valor, validar que sea válida
    if (catValue) {
      const categorySlug = parseBaseCategorySlug(catValue);
      if (!categorySlug) {
        if (requiresHoReCaBaseCategory) {
          errors.push({
            field: catSet.cat,
            message: `Para HoReCa (SI/EXCLUSIVO), ${catSet.cat} debe ser una de: ${VALID_CATEGORIES.join(', ')}`,
            value: catValue,
          });
        } else {
          warnings.push({
            field: catSet.cat,
            message: `Categoría "${catValue}" no reconocida. Válidas: ${VALID_CATEGORIES.join(', ')}`,
            value: catValue,
          });
        }
      } else {
        validCategorySlugs.push(categorySlug);
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

  if (requiresHoReCaBaseCategory && validCategorySlugs.length === 0) {
    errors.push({
      field: 'Categoria_1',
      message: `Los productos HoReCa (SI/EXCLUSIVO) deben pertenecer a: ${VALID_CATEGORIES.join(', ')}`,
      value: row.Categoria_1 || '',
    });
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
  
  // Validar Desc_Dist (0-100)
  if (row.Desc_Dist && row.Desc_Dist.trim() !== '') {
    const descDist = parseFloat(row.Desc_Dist);
    if (!isNaN(descDist) && (descDist < 0 || descDist > 100)) {
      errors.push({
        field: 'Desc_Dist',
        message: 'El descuento distribuidor debe estar entre 0 y 100',
        value: row.Desc_Dist,
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
  
  // Validar URLs de imágenes y su alt text SEO correspondiente
  for (const imageField of IMAGE_FIELDS) {
    const value = row[imageField];
    const altField = IMAGE_FIELD_TO_ALT_FIELD[imageField];
    const altValue = row[altField];

    if (value && value.trim() !== '') {
      try {
        new URL(value);
      } catch {
        errors.push({
          field: imageField,
          message: 'URL de imagen inválida',
          value,
        });
      }

      if (!altValue || altValue.trim() === '') {
        errors.push({
          field: altField,
          message: `El campo ${altField} es obligatorio cuando ${imageField} tiene URL`,
          value: altValue || '',
        });
      }
    } else if (altValue && altValue.trim() !== '') {
      warnings.push({
        field: altField,
        message: `El campo ${altField} tiene valor pero ${imageField} está vacío`,
        value: altValue,
      });
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

    if (values.length !== headers.length) {
      const rowData: ProductCSVRow = {} as ProductCSVRow;
      for (const header of CSV_HEADERS) {
        const index = headerIndexMap[header];
        rowData[header] = index !== undefined ? (values[index] || '') : '';
      }

      products.push({
        row: i + 1,
        data: rowData,
        errors: [
          {
            field: 'Ref',
            message: `La fila tiene ${values.length} columnas pero se esperaban ${headers.length}. Esto suele ocurrir cuando un campo de texto (por ejemplo Descrip_Cliente_Final) contiene comas o saltos de línea sin estar entre comillas.`,
            value: '',
          },
        ],
        warnings: [],
        isValid: false,
      });
      continue;
    }
    
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
        SKU: 'ref_pub',
        Producto: 'nombre_comercial',
        Estado: 'is_active',
        Descripcion: 'pdt_descripcion',
        Marca: 'marca',
        Precio_COP: 'precio',
        Descuento: 'descuento_porcentaje',
        Precio_Dist: 'precio_dist',
        Desc_Dist: 'desc_dist',
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
        SEO_Alt_Text_1: '_alt_1',
        SEO_Alt_Text_2: '_alt_2',
        SEO_Alt_Text_3: '_alt_3',
        SEO_Alt_Text_4: '_alt_4',
        SEO_Alt_Text_5: '_alt_5',
        SEO_Alt_Text_6: '_alt_6',
        SEO_Alt_Text_7: '_alt_7',
        SEO_Alt_Text_8: '_alt_8',
        SEO_Alt_Text_9: '_alt_9',
        SEO_Alt_Text_10: '_alt_10',
      };
      
      for (const [csvField, dbField] of Object.entries(fieldMappings)) {
        if (dbField.startsWith('_') && !dbField.startsWith('_image_') && !dbField.startsWith('_alt_')) continue;

        const newValue = newProduct.data[csvField as keyof ProductCSVRow] || '';
        let oldValue = '';

        if (dbField.startsWith('_image_')) {
          const orderIndex = Number(dbField.replace('_image_', ''));
          oldValue = getExistingProductMediaValue(existing, orderIndex, 'url');
        } else if (dbField.startsWith('_alt_')) {
          const orderIndex = Number(dbField.replace('_alt_', ''));
          oldValue = getExistingProductMediaValue(existing, orderIndex, 'alt_text');
        } else {
          oldValue = String(existing[dbField] || '');
        }
        
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

  if (field === 'Pedido_en_camino') {
    const numericValue = normalizeNumeric(value);
    if (numericValue !== null) {
      return numericValue > 0 ? 'true' : 'false';
    }
    const upper = value.toUpperCase().trim();
    if (upper === 'SI' || upper === 'SÍ' || upper === 'TRUE' || upper === '1' || upper === 'YES' || upper === 'ACTIVO' || upper === 'ACTIVE') {
      return 'true';
    }
    if (upper === 'NO' || upper === 'FALSE' || upper === '0' || upper === 'INACTIVO' || upper === 'INACTIVE') {
      return 'false';
    }
    return value.trim().toLowerCase();
  }
  
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

type ExistingProductMedia = {
  order_index?: number | null;
  media_type?: string | null;
  url?: string | null;
  alt_text?: string | null;
};

function getExistingProductMediaValue(
  existing: Record<string, unknown>,
  orderIndex: number,
  valueField: 'url' | 'alt_text'
): string {
  const media = Array.isArray(existing.product_media)
    ? (existing.product_media as ExistingProductMedia[])
    : [];

  const mediaByOrder = media.find((m) => (m.media_type === 'image' || !m.media_type) && Number(m.order_index) === orderIndex);
  const mediaValue = mediaByOrder?.[valueField];
  if (typeof mediaValue === 'string') {
    return mediaValue;
  }

  if (valueField === 'url' && orderIndex === 1) {
    const primaryUrl = existing.imagen_principal_url;
    return typeof primaryUrl === 'string' ? primaryUrl : '';
  }

  return '';
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
