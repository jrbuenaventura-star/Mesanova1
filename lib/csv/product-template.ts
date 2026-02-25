// Definición del template CSV para productos
// Los campos están ordenados según la especificación del usuario
// Actualizado: soporte para múltiples categorías, HoReCa, Estado, Ref_Pub

export interface ProductCSVRow {
  // Campos de identificación (ERP)
  Ref: string; // Código único del ERP (obligatorio)
  SKU: string; // Referencia pública/comercial
  Producto: string; // Nombre comercial (obligatorio)
  Estado: string; // ACTIVO/INACTIVO - visibilidad en marketplace (obligatorio)
  Descripcion: string;
  Marca: string;
  
  // Precios y ofertas
  Precio_COP: string; // Obligatorio - Precio público
  Descuento: string; // Porcentaje (0-100) - Aplica solo al catálogo público
  Precio_Dist: string; // Precio base para distribuidores
  Desc_Dist: string; // Descuento distribuidor por producto (0-100%)
  
  // Inventario (sincronizable con ERP)
  Existencia_inv: string;
  Pedido_en_camino: string; // Cantidad numérica de unidades en camino
  Descontinuado: string; // SI/NO - informativo, el fabricante ya no produce
  
  // Empaque
  Inner_pack: string;
  Outer_pack: string;
  
  // Categorización (hasta 3 jerarquías)
  Coleccion: string;
  Categoria_1: string; // Obligatorio
  Subcategoria_1: string; // Obligatorio
  Tipo_producto_1: string; // Obligatorio
  Categoria_2: string;
  Subcategoria_2: string;
  Tipo_producto_2: string;
  
  // Características físicas
  Material: string;
  Color: string;
  Dimensiones: string;
  Peso_kg: string;
  Capacidad: string;
  Pais_origen: string;
  
  // Contenido para cliente final
  Descrip_Cliente_Final: string;
  Momentos_Uso_Cliente: string;
  Productos_Afines_Cliente: string; // Referencias separadas por coma
  
  // Contenido para distribuidor/canal
  Descrip_Distribuidor: string;
  Argumentos_Venta_Distribuidor: string;
  Ubicacion_Tienda_Distribuidor: string;
  Margen_Sugerido: string; // Porcentaje
  Rotacion_Esperada: string; // alta/media/baja
  
  // SEO
  SEO_Title: string;
  SEO_Description: string;
  Tags: string; // Separadas por coma
  
  // Multimedia
  Video_URL: string;
  Ficha_Tecnica_URL: string;
  Fecha_Lanzamiento: string; // DD/MM/YYYY
  
  // HoReCa
  HoReCa: string; // NO/EXCLUSIVO/SI
  
  // Imágenes (URLs)
  Image_1: string;
  Image_2: string;
  Image_3: string;
  Image_4: string;
  Image_5: string;
  Image_6: string;
  Image_7: string;
  Image_8: string;
  Image_9: string;
  Image_10: string;
  SEO_Alt_Text_1: string;
  SEO_Alt_Text_2: string;
  SEO_Alt_Text_3: string;
  SEO_Alt_Text_4: string;
  SEO_Alt_Text_5: string;
  SEO_Alt_Text_6: string;
  SEO_Alt_Text_7: string;
  SEO_Alt_Text_8: string;
  SEO_Alt_Text_9: string;
  SEO_Alt_Text_10: string;
}

export const IMAGE_FIELDS = [
  'Image_1',
  'Image_2',
  'Image_3',
  'Image_4',
  'Image_5',
  'Image_6',
  'Image_7',
  'Image_8',
  'Image_9',
  'Image_10',
] as const;

export const IMAGE_ALT_FIELDS = [
  'SEO_Alt_Text_1',
  'SEO_Alt_Text_2',
  'SEO_Alt_Text_3',
  'SEO_Alt_Text_4',
  'SEO_Alt_Text_5',
  'SEO_Alt_Text_6',
  'SEO_Alt_Text_7',
  'SEO_Alt_Text_8',
  'SEO_Alt_Text_9',
  'SEO_Alt_Text_10',
] as const;

export const CSV_HEADERS: (keyof ProductCSVRow)[] = [
  'Ref',
  'SKU',
  'Producto',
  'Estado',
  'Descripcion',
  'Marca',
  'Precio_COP',
  'Descuento',
  'Precio_Dist',
  'Desc_Dist',
  'Existencia_inv',
  'Pedido_en_camino',
  'Descontinuado',
  'Inner_pack',
  'Outer_pack',
  'Coleccion',
  'Categoria_1',
  'Subcategoria_1',
  'Tipo_producto_1',
  'Categoria_2',
  'Subcategoria_2',
  'Tipo_producto_2',
  'Material',
  'Color',
  'Dimensiones',
  'Peso_kg',
  'Capacidad',
  'Pais_origen',
  'Descrip_Cliente_Final',
  'Momentos_Uso_Cliente',
  'Productos_Afines_Cliente',
  'Descrip_Distribuidor',
  'Argumentos_Venta_Distribuidor',
  'Ubicacion_Tienda_Distribuidor',
  'Margen_Sugerido',
  'Rotacion_Esperada',
  'SEO_Title',
  'SEO_Description',
  'Tags',
  'Video_URL',
  'Ficha_Tecnica_URL',
  'Fecha_Lanzamiento',
  'HoReCa',
  ...IMAGE_FIELDS,
  ...IMAGE_ALT_FIELDS,
];

export const CSV_HEADER_DESCRIPTIONS: Record<keyof ProductCSVRow, string> = {
  Ref: 'Código de referencia único del ERP (obligatorio)',
  SKU: 'Referencia pública/comercial visible para clientes (SKU)',
  Producto: 'Nombre comercial del producto (obligatorio)',
  Estado: 'ACTIVO/INACTIVO - Visibilidad en marketplace (obligatorio)',
  Descripcion: 'Descripción corta o subtítulo',
  Marca: 'Marca del producto',
  Precio_COP: 'Precio público en pesos colombianos (obligatorio)',
  Descuento: 'Porcentaje de descuento (0-100). Aplica solo al catálogo público. Si > 0, aparece en ofertas',
  Precio_Dist: 'Precio base para distribuidores antes de aplicar su descuento',
  Desc_Dist: 'Descuento por producto para distribuidores (0-100%). Aplica a todos los distribuidores sobre Precio_Dist',
  Existencia_inv: 'Cantidad en inventario (sincronizable con ERP)',
  Pedido_en_camino: 'SI/NO - Indica si hay pedido en tránsito',
  Descontinuado: 'SI/NO - El fabricante ya no produce este SKU',
  Inner_pack: 'Empaque primario (unidades por empaque)',
  Outer_pack: 'Empaque secundario (empaques primarios por caja)',
  Coleccion: 'Nombre de la colección a la que pertenece',
  Categoria_1: 'Categoría principal: Cocina, Mesa, Café-Té-Bar (obligatorio)',
  Subcategoria_1: 'Subcategoría dentro de la categoría 1 (obligatorio)',
  Tipo_producto_1: 'Tipo específico de producto (3er nivel) (obligatorio)',
  Categoria_2: 'Segunda categoría (opcional)',
  Subcategoria_2: 'Subcategoría dentro de la categoría 2',
  Tipo_producto_2: 'Tipo específico de producto (3er nivel)',
  Material: 'Material principal del producto',
  Color: 'Color del producto',
  Dimensiones: 'Dimensiones del producto (ej: 30x20x10 cm)',
  Peso_kg: 'Peso en kilogramos',
  Capacidad: 'Capacidad si aplica (ej: 500ml)',
  Pais_origen: 'País de origen del producto',
  Descrip_Cliente_Final: 'Descripción amplia para cliente final',
  Momentos_Uso_Cliente: 'Momentos de uso sugeridos para cliente final',
  Productos_Afines_Cliente: 'Referencias de productos afines separadas por coma',
  Descrip_Distribuidor: 'Descripción visible solo para distribuidores y canal',
  Argumentos_Venta_Distribuidor: 'Argumentos de venta para distribuidores',
  Ubicacion_Tienda_Distribuidor: 'Sugerencia de ubicación en tienda del distribuidor',
  Margen_Sugerido: 'Margen de ganancia sugerido para distribuidor (%)',
  Rotacion_Esperada: 'Rotación esperada: alta, media o baja',
  SEO_Title: 'Título SEO para buscadores',
  SEO_Description: 'Descripción SEO para buscadores',
  Tags: 'Etiquetas de búsqueda separadas por coma',
  Video_URL: 'URL del video del producto',
  Ficha_Tecnica_URL: 'URL del PDF de ficha técnica',
  Fecha_Lanzamiento: 'Fecha de lanzamiento (DD/MM/YYYY)',
  HoReCa: 'NO=Solo retail, EXCLUSIVO=Solo HoReCa, SI=Ambos canales',
  Image_1: 'URL de imagen principal',
  Image_2: 'URL de imagen 2',
  Image_3: 'URL de imagen 3',
  Image_4: 'URL de imagen 4',
  Image_5: 'URL de imagen 5',
  Image_6: 'URL de imagen 6',
  Image_7: 'URL de imagen 7',
  Image_8: 'URL de imagen 8',
  Image_9: 'URL de imagen 9',
  Image_10: 'URL de imagen 10',
  SEO_Alt_Text_1: 'Texto alternativo SEO para Image_1',
  SEO_Alt_Text_2: 'Texto alternativo SEO para Image_2',
  SEO_Alt_Text_3: 'Texto alternativo SEO para Image_3',
  SEO_Alt_Text_4: 'Texto alternativo SEO para Image_4',
  SEO_Alt_Text_5: 'Texto alternativo SEO para Image_5',
  SEO_Alt_Text_6: 'Texto alternativo SEO para Image_6',
  SEO_Alt_Text_7: 'Texto alternativo SEO para Image_7',
  SEO_Alt_Text_8: 'Texto alternativo SEO para Image_8',
  SEO_Alt_Text_9: 'Texto alternativo SEO para Image_9',
  SEO_Alt_Text_10: 'Texto alternativo SEO para Image_10',
};

export const REQUIRED_FIELDS: (keyof ProductCSVRow)[] = [
  'Ref',
  'Producto',
  'Estado',
  'Precio_COP',
  'Categoria_1',
  'Subcategoria_1',
  'Tipo_producto_1',
];

export const BOOLEAN_FIELDS: (keyof ProductCSVRow)[] = [
  'Descontinuado',
];

export const ESTADO_FIELDS: (keyof ProductCSVRow)[] = [
  'Estado',
];

export const HORECA_VALUES = ['NO', 'EXCLUSIVO', 'SI'] as const;
export type HoReCaValue = typeof HORECA_VALUES[number];

export const NUMERIC_FIELDS: (keyof ProductCSVRow)[] = [
  'Precio_COP',
  'Descuento',
  'Precio_Dist',
  'Desc_Dist',
  'Existencia_inv',
  'Pedido_en_camino',
  'Peso_kg',
  'Margen_Sugerido',
];

export const VALID_CATEGORIES = [
  'Cocina',
  'Mesa',
  'Café-Té-Bar',
];
export const BASE_CATEGORY_SLUGS = ['mesa', 'cocina', 'cafe-te-bar'] as const;
export type BaseCategorySlug = typeof BASE_CATEGORY_SLUGS[number];

const BASE_CATEGORY_ALIASES: Record<BaseCategorySlug, string[]> = {
  mesa: ['mesa'],
  cocina: ['cocina'],
  'cafe-te-bar': [
    'cafe te bar',
    'cafe te y bar',
    'cafe y bar',
    'cafe bar',
    'cafe/te/bar',
    'cafe-te-bar',
    'cafe, te y bar',
  ],
};

function normalizeCategoryLabel(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/&/g, ' y ')
    .replace(/[^a-z0-9/-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function parseBaseCategorySlug(value: string): BaseCategorySlug | null {
  const normalized = normalizeCategoryLabel(value);
  if (!normalized) return null;

  for (const [slug, aliases] of Object.entries(BASE_CATEGORY_ALIASES) as Array<[BaseCategorySlug, string[]]>) {
    if (aliases.some((alias) => normalizeCategoryLabel(alias) === normalized)) {
      return slug;
    }
  }

  return null;
}

export const VALID_ROTACION = ['alta', 'media', 'baja'];

export function generateEmptyCSVTemplate(): string {
  return CSV_HEADERS.join(',');
}

export function generateCSVWithDescriptions(): string {
  const headerRow = CSV_HEADERS.join(',');
  const descriptionRow = CSV_HEADERS.map(h => `"${CSV_HEADER_DESCRIPTIONS[h]}"`).join(',');
  const exampleRow = generateExampleRow();
  
  return `${headerRow}\n${descriptionRow}\n${exampleRow}`;
}

function generateExampleRow(): string {
  const example: Partial<ProductCSVRow> = {
    Ref: 'ABC-001',
    SKU: 'MN-001',
    Producto: 'Tabla de Cortar Bambú Premium',
    Estado: 'ACTIVO',
    Descripcion: 'Tabla de cortar profesional en bambú ecológico',
    Marca: 'Mesa Nova',
    Precio_COP: '89900',
    Descuento: '15',
    Precio_Dist: '67425',
    Desc_Dist: '5',
    Existencia_inv: '150',
    Pedido_en_camino: 'NO',
    Descontinuado: 'NO',
    Inner_pack: '1',
    Outer_pack: '12',
    Coleccion: 'Eco Kitchen',
    Categoria_1: 'Cocina',
    Subcategoria_1: 'Corte y Picado',
    Tipo_producto_1: 'Tablas de Cortar',
    Categoria_2: '',
    Subcategoria_2: '',
    Tipo_producto_2: '',
    Material: 'Bambú',
    Color: 'Natural',
    Dimensiones: '40x30x2 cm',
    Peso_kg: '0.8',
    Capacidad: '',
    Pais_origen: 'China',
    Descrip_Cliente_Final: 'Tabla de cortar elaborada en bambú 100% natural...',
    Momentos_Uso_Cliente: 'Ideal para preparar tus comidas diarias...',
    Productos_Afines_Cliente: 'ABC-002,ABC-003',
    Descrip_Distribuidor: 'Producto de alta rotación con excelente margen...',
    Argumentos_Venta_Distribuidor: 'Material ecológico muy demandado...',
    Ubicacion_Tienda_Distribuidor: 'Zona de cocina cerca de cuchillos',
    Margen_Sugerido: '40',
    Rotacion_Esperada: 'alta',
    SEO_Title: 'Tabla de Cortar Bambú | Mesa Nova',
    SEO_Description: 'Compra tabla de cortar en bambú ecológico...',
    Tags: 'tabla,cortar,bambú,cocina,ecológico',
    Video_URL: 'https://youtube.com/watch?v=xxx',
    Ficha_Tecnica_URL: 'https://cdn.mesanova.com/fichas/abc-001.pdf',
    Fecha_Lanzamiento: '15/01/2026',
    HoReCa: 'SI',
    Image_1: 'https://cdn.mesanova.com/products/abc-001-1.jpg',
    Image_2: 'https://cdn.mesanova.com/products/abc-001-2.jpg',
    Image_3: '',
    Image_4: '',
    Image_5: '',
    Image_6: '',
    Image_7: '',
    Image_8: '',
    Image_9: '',
    Image_10: '',
    SEO_Alt_Text_1: 'Tabla de cortar en bambu vista frontal',
    SEO_Alt_Text_2: 'Tabla de cortar en bambu vista detalle',
    SEO_Alt_Text_3: '',
    SEO_Alt_Text_4: '',
    SEO_Alt_Text_5: '',
    SEO_Alt_Text_6: '',
    SEO_Alt_Text_7: '',
    SEO_Alt_Text_8: '',
    SEO_Alt_Text_9: '',
    SEO_Alt_Text_10: '',
  };
  
  return CSV_HEADERS.map(h => {
    const value = example[h] || '';
    return value.includes(',') || value.includes('"') ? `"${value.replace(/"/g, '""')}"` : value;
  }).join(',');
}

// Función para parsear fecha DD/MM/YYYY a YYYY-MM-DD (formato DB)
export function parseDateDDMMYYYY(dateStr: string): string | null {
  if (!dateStr || dateStr.trim() === '') return null;
  
  const trimmed = dateStr.trim();
  
  // Intentar formato DD/MM/YYYY o DD/MM/YY
  const ddmmyyyy = /^([0-9]{1,2})\/([0-9]{1,2})\/([0-9]{2}|[0-9]{4})$/;
  const match = trimmed.match(ddmmyyyy);
  if (match) {
    const day = parseInt(match[1], 10);
    const month = parseInt(match[2], 10);
    let year = parseInt(match[3], 10);
    if (match[3].length === 2) {
      year = year >= 50 ? 1900 + year : 2000 + year;
    }
    
    if (month < 1 || month > 12 || day < 1 || day > 31) return null;
    
    // Crear fecha y validar
    const date = new Date(year, month - 1, day);
    if (isNaN(date.getTime())) return null;
    
    return date.toISOString().split('T')[0];
  }
  
  // Intentar formato YYYY-MM-DD (ya está en formato correcto)
  const yyyymmdd = /^\d{4}-\d{2}-\d{2}$/;
  if (yyyymmdd.test(trimmed)) {
    return trimmed;
  }
  
  // Intentar detectar formato Excel serial
  const excelSerial = parseFloat(trimmed);
  if (!isNaN(excelSerial) && excelSerial > 40000 && excelSerial < 60000) {
    const date = new Date((excelSerial - 25569) * 86400 * 1000);
    if (!isNaN(date.getTime())) {
      return date.toISOString().split('T')[0];
    }
  }
  
  return null;
}

// Función para formatear fecha YYYY-MM-DD a DD/MMM/YY para mostrar en UI
export function formatDateForDisplay(dateStr: string): string {
  if (!dateStr) return '';
  
  try {
    const date = new Date(dateStr + 'T00:00:00');
    if (isNaN(date.getTime())) return dateStr;
    
    const months = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
    const day = date.getDate().toString().padStart(2, '0');
    const month = months[date.getMonth()];
    const year = date.getFullYear().toString().slice(-2);
    
    return `${day}/${month}/${year}`;
  } catch {
    return dateStr;
  }
}

// Función para normalizar valores booleanos
export function normalizeBoolean(value: string): boolean {
  if (!value) return false;
  const upper = value.toUpperCase().trim();
  return ['SI', 'SÍ', 'YES', 'TRUE', '1', 'ACTIVO', 'ACTIVE'].includes(upper);
}

// Función para normalizar Estado (ACTIVO/INACTIVO)
export function normalizeEstado(value: string): boolean {
  if (!value) return true; // Default: activo
  const upper = value.toUpperCase().trim();
  return ['ACTIVO', 'ACTIVE', 'SI', 'SÍ', 'YES', 'TRUE', '1'].includes(upper);
}

// Función para normalizar HoReCa
export function normalizeHoReCa(value: string): 'NO' | 'EXCLUSIVO' | 'SI' {
  if (!value) return 'NO';
  const upper = value.toUpperCase().trim();
  if (upper === 'EXCLUSIVO' || upper === 'EXCLUSIVE') return 'EXCLUSIVO';
  if (['SI', 'SÍ', 'YES', 'TRUE', '1', 'AMBOS', 'BOTH'].includes(upper)) return 'SI';
  return 'NO';
}

// Función para normalizar números (acepta , o . como separador decimal)
export function normalizeNumeric(value: string): number | null {
  if (!value || value.trim() === '') return null;
  
  let normalized = value.trim();
  
  // Si tiene punto de miles y coma decimal (formato europeo/colombiano): 1.234,56
  if (/^\d{1,3}(\.\d{3})*(,\d+)?$/.test(normalized)) {
    normalized = normalized.replace(/\./g, '').replace(',', '.');
  }
  // Si tiene coma de miles y punto decimal (formato US): 1,234.56
  else if (/^\d{1,3}(,\d{3})*(\.\d+)?$/.test(normalized)) {
    normalized = normalized.replace(/,/g, '');
  }
  // Si solo tiene coma como decimal: 1234,56
  else if (/^\d+(,\d+)?$/.test(normalized)) {
    normalized = normalized.replace(',', '.');
  }
  
  // Remover símbolos de moneda
  normalized = normalized.replace(/[$€]/g, '').trim();
  
  const num = parseFloat(normalized);
  return isNaN(num) ? null : num;
}
