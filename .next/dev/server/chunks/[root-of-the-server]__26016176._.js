module.exports = [
"[externals]/next/dist/compiled/next-server/app-route-turbo.runtime.dev.js [external] (next/dist/compiled/next-server/app-route-turbo.runtime.dev.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/compiled/next-server/app-route-turbo.runtime.dev.js", () => require("next/dist/compiled/next-server/app-route-turbo.runtime.dev.js"));

module.exports = mod;
}),
"[externals]/next/dist/compiled/@opentelemetry/api [external] (next/dist/compiled/@opentelemetry/api, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/compiled/@opentelemetry/api", () => require("next/dist/compiled/@opentelemetry/api"));

module.exports = mod;
}),
"[externals]/next/dist/compiled/next-server/app-page-turbo.runtime.dev.js [external] (next/dist/compiled/next-server/app-page-turbo.runtime.dev.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/compiled/next-server/app-page-turbo.runtime.dev.js", () => require("next/dist/compiled/next-server/app-page-turbo.runtime.dev.js"));

module.exports = mod;
}),
"[externals]/next/dist/server/app-render/work-unit-async-storage.external.js [external] (next/dist/server/app-render/work-unit-async-storage.external.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/server/app-render/work-unit-async-storage.external.js", () => require("next/dist/server/app-render/work-unit-async-storage.external.js"));

module.exports = mod;
}),
"[externals]/next/dist/server/app-render/work-async-storage.external.js [external] (next/dist/server/app-render/work-async-storage.external.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/server/app-render/work-async-storage.external.js", () => require("next/dist/server/app-render/work-async-storage.external.js"));

module.exports = mod;
}),
"[externals]/next/dist/shared/lib/no-fallback-error.external.js [external] (next/dist/shared/lib/no-fallback-error.external.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/shared/lib/no-fallback-error.external.js", () => require("next/dist/shared/lib/no-fallback-error.external.js"));

module.exports = mod;
}),
"[externals]/next/dist/server/app-render/after-task-async-storage.external.js [external] (next/dist/server/app-render/after-task-async-storage.external.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/server/app-render/after-task-async-storage.external.js", () => require("next/dist/server/app-render/after-task-async-storage.external.js"));

module.exports = mod;
}),
"[project]/lib/supabase/server.ts [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "createClient",
    ()=>createClient
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$supabase$2f$ssr$2f$dist$2f$module$2f$index$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/node_modules/@supabase/ssr/dist/module/index.js [app-route] (ecmascript) <locals>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$supabase$2f$ssr$2f$dist$2f$module$2f$createServerClient$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@supabase/ssr/dist/module/createServerClient.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$headers$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/headers.js [app-route] (ecmascript)");
;
;
async function createClient() {
    const cookieStore = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$headers$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["cookies"])();
    const supabaseUrl = process.env.SUPABASE_URL || ("TURBOPACK compile-time value", "https://hbzgndpouxhxbhngotru.supabase.co");
    const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || ("TURBOPACK compile-time value", "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhiemduZHBvdXhoeGJobmdvdHJ1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU5MDMzMTMsImV4cCI6MjA4MTQ3OTMxM30.2VDdLjXPFfPVON0E3FeCUYGCzkGC_s6_WAdijnzHYr8");
    if ("TURBOPACK compile-time falsy", 0) //TURBOPACK unreachable
    ;
    const client = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$supabase$2f$ssr$2f$dist$2f$module$2f$createServerClient$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["createServerClient"])(supabaseUrl, supabaseAnonKey, {
        cookies: {
            getAll () {
                return cookieStore.getAll();
            },
            setAll (cookiesToSet) {
                try {
                    cookiesToSet.forEach(({ name, value, options })=>cookieStore.set(name, value, options));
                } catch  {
                // The "setAll" method was called from a Server Component.
                // This can be ignored if you have proxy refreshing user sessions.
                }
            }
        },
        auth: {
            detectSessionInUrl: true,
            flowType: "pkce"
        },
        global: {
            headers: {
                "X-Client-Info": "mesanova-web-server@1.0.0"
            }
        }
    });
    return client;
}
}),
"[project]/lib/csv/product-template.ts [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

// Definición del template CSV para productos
// Los campos están ordenados según la especificación del usuario
__turbopack_context__.s([
    "BOOLEAN_FIELDS",
    ()=>BOOLEAN_FIELDS,
    "CSV_HEADERS",
    ()=>CSV_HEADERS,
    "CSV_HEADER_DESCRIPTIONS",
    ()=>CSV_HEADER_DESCRIPTIONS,
    "NUMERIC_FIELDS",
    ()=>NUMERIC_FIELDS,
    "REQUIRED_FIELDS",
    ()=>REQUIRED_FIELDS,
    "VALID_CATEGORIES",
    ()=>VALID_CATEGORIES,
    "VALID_ROTACION",
    ()=>VALID_ROTACION,
    "generateCSVWithDescriptions",
    ()=>generateCSVWithDescriptions,
    "generateEmptyCSVTemplate",
    ()=>generateEmptyCSVTemplate
]);
const CSV_HEADERS = [
    'Ref',
    'Cod_Barra',
    'Producto',
    'Descripcion',
    'Marca',
    'Precio_COP',
    'Descuento',
    'Existencia_inv',
    'Pedido_en_camino',
    'Descontinuado',
    'Inner_pack',
    'Outer_pack',
    'Coleccion',
    'Categoria',
    'Subcategoria',
    'Tipo_producto',
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
    'Image_1',
    'Image_2',
    'Image_3',
    'Image_4',
    'Image_5',
    'Image_6',
    'Image_7',
    'Image_8',
    'Image_9',
    'Image_10'
];
const CSV_HEADER_DESCRIPTIONS = {
    Ref: 'Código de referencia único del producto (obligatorio)',
    Cod_Barra: 'Código de barras EAN/UPC',
    Producto: 'Nombre comercial del producto (obligatorio)',
    Descripcion: 'Descripción corta o subtítulo',
    Marca: 'Marca del producto',
    Precio_COP: 'Precio base en pesos colombianos (obligatorio)',
    Descuento: 'Porcentaje de descuento (0-100). Si > 0, aparece en ofertas',
    Existencia_inv: 'Cantidad en inventario',
    Pedido_en_camino: 'SI/NO - Indica si hay pedido en tránsito',
    Descontinuado: 'SI/NO - Producto que no se volverá a pedir',
    Inner_pack: 'Empaque primario (unidades por empaque)',
    Outer_pack: 'Empaque secundario (empaques primarios por caja)',
    Coleccion: 'Nombre de la colección a la que pertenece',
    Categoria: 'Categoría principal (Cocina, Mesa, Café-Té-Bar, Termos-Neveras, Profesional)',
    Subcategoria: 'Subcategoría dentro de la categoría principal',
    Tipo_producto: 'Tipo específico de producto (3er nivel)',
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
    Fecha_Lanzamiento: 'Fecha de lanzamiento (YYYY-MM-DD)',
    Image_1: 'URL de imagen principal (obligatoria)',
    Image_2: 'URL de imagen 2',
    Image_3: 'URL de imagen 3',
    Image_4: 'URL de imagen 4',
    Image_5: 'URL de imagen 5',
    Image_6: 'URL de imagen 6',
    Image_7: 'URL de imagen 7',
    Image_8: 'URL de imagen 8',
    Image_9: 'URL de imagen 9',
    Image_10: 'URL de imagen 10'
};
const REQUIRED_FIELDS = [
    'Ref',
    'Producto',
    'Precio_COP'
];
const BOOLEAN_FIELDS = [
    'Pedido_en_camino',
    'Descontinuado'
];
const NUMERIC_FIELDS = [
    'Precio_COP',
    'Descuento',
    'Existencia_inv',
    'Peso_kg',
    'Margen_Sugerido'
];
const VALID_CATEGORIES = [
    'Cocina',
    'Mesa',
    'Café-Té-Bar',
    'Termos-Neveras',
    'Profesional'
];
const VALID_ROTACION = [
    'alta',
    'media',
    'baja'
];
function generateEmptyCSVTemplate() {
    return CSV_HEADERS.join(',');
}
function generateCSVWithDescriptions() {
    const headerRow = CSV_HEADERS.join(',');
    const descriptionRow = CSV_HEADERS.map((h)=>`"${CSV_HEADER_DESCRIPTIONS[h]}"`).join(',');
    const exampleRow = generateExampleRow();
    return `${headerRow}\n${descriptionRow}\n${exampleRow}`;
}
function generateExampleRow() {
    const example = {
        Ref: 'ABC-001',
        Cod_Barra: '7701234567890',
        Producto: 'Tabla de Cortar Bambú Premium',
        Descripcion: 'Tabla de cortar profesional en bambú ecológico',
        Marca: 'Mesa Nova',
        Precio_COP: '89900',
        Descuento: '15',
        Existencia_inv: '150',
        Pedido_en_camino: 'NO',
        Descontinuado: 'NO',
        Inner_pack: '1',
        Outer_pack: '12',
        Coleccion: 'Eco Kitchen',
        Categoria: 'Cocina',
        Subcategoria: 'Corte y Picado',
        Tipo_producto: 'Tablas de Cortar',
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
        Fecha_Lanzamiento: '2026-01-15',
        Image_1: 'https://cdn.mesanova.com/products/abc-001-1.jpg',
        Image_2: 'https://cdn.mesanova.com/products/abc-001-2.jpg',
        Image_3: '',
        Image_4: '',
        Image_5: '',
        Image_6: '',
        Image_7: '',
        Image_8: '',
        Image_9: '',
        Image_10: ''
    };
    return CSV_HEADERS.map((h)=>{
        const value = example[h] || '';
        return value.includes(',') || value.includes('"') ? `"${value.replace(/"/g, '""')}"` : value;
    }).join(',');
}
}),
"[project]/lib/csv/product-parser.ts [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "compareWithExisting",
    ()=>compareWithExisting,
    "parseBooleanValue",
    ()=>parseBooleanValue,
    "parseCSV",
    ()=>parseCSV,
    "parseNumericValue",
    ()=>parseNumericValue
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$csv$2f$product$2d$template$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/lib/csv/product-template.ts [app-route] (ecmascript)");
;
function parseCSVLine(line) {
    const result = [];
    let current = '';
    let inQuotes = false;
    for(let i = 0; i < line.length; i++){
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
function validateRow(row, rowNumber) {
    const errors = [];
    const warnings = [];
    // Validar campos requeridos
    for (const field of __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$csv$2f$product$2d$template$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["REQUIRED_FIELDS"]){
        if (!row[field] || row[field].trim() === '') {
            errors.push({
                field,
                message: `El campo ${field} es obligatorio`,
                value: row[field] || ''
            });
        }
    }
    // Validar campos numéricos
    for (const field of __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$csv$2f$product$2d$template$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NUMERIC_FIELDS"]){
        const value = row[field];
        if (value && value.trim() !== '') {
            const numValue = parseFloat(value.replace(/[,$]/g, ''));
            if (isNaN(numValue)) {
                errors.push({
                    field,
                    message: `El campo ${field} debe ser un número válido`,
                    value
                });
            } else if (numValue < 0) {
                errors.push({
                    field,
                    message: `El campo ${field} no puede ser negativo`,
                    value
                });
            }
        }
    }
    // Validar campos booleanos
    for (const field of __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$csv$2f$product$2d$template$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["BOOLEAN_FIELDS"]){
        const value = row[field]?.toUpperCase();
        if (value && value !== '' && value !== 'SI' && value !== 'NO' && value !== 'TRUE' && value !== 'FALSE' && value !== '1' && value !== '0') {
            errors.push({
                field,
                message: `El campo ${field} debe ser SI/NO`,
                value: row[field]
            });
        }
    }
    // Validar categoría
    if (row.Categoria && row.Categoria.trim() !== '') {
        const normalizedCat = row.Categoria.trim();
        if (!__TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$csv$2f$product$2d$template$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["VALID_CATEGORIES"].some((c)=>c.toLowerCase() === normalizedCat.toLowerCase())) {
            warnings.push({
                field: 'Categoria',
                message: `Categoría "${normalizedCat}" no reconocida. Válidas: ${__TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$csv$2f$product$2d$template$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["VALID_CATEGORIES"].join(', ')}`,
                value: row.Categoria
            });
        }
    }
    // Validar rotación esperada
    if (row.Rotacion_Esperada && row.Rotacion_Esperada.trim() !== '') {
        const rotacion = row.Rotacion_Esperada.toLowerCase().trim();
        if (!__TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$csv$2f$product$2d$template$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["VALID_ROTACION"].includes(rotacion)) {
            errors.push({
                field: 'Rotacion_Esperada',
                message: `Rotación debe ser: ${__TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$csv$2f$product$2d$template$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["VALID_ROTACION"].join(', ')}`,
                value: row.Rotacion_Esperada
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
                value: row.Descuento
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
                value: row.Margen_Sugerido
            });
        }
    }
    // Validar fecha de lanzamiento
    if (row.Fecha_Lanzamiento && row.Fecha_Lanzamiento.trim() !== '') {
        const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
        if (!dateRegex.test(row.Fecha_Lanzamiento)) {
            errors.push({
                field: 'Fecha_Lanzamiento',
                message: 'La fecha debe tener formato YYYY-MM-DD',
                value: row.Fecha_Lanzamiento
            });
        } else {
            const date = new Date(row.Fecha_Lanzamiento);
            if (isNaN(date.getTime())) {
                errors.push({
                    field: 'Fecha_Lanzamiento',
                    message: 'Fecha inválida',
                    value: row.Fecha_Lanzamiento
                });
            }
        }
    }
    // Validar URLs de imágenes
    const imageFields = [
        'Image_1',
        'Image_2',
        'Image_3',
        'Image_4',
        'Image_5',
        'Image_6',
        'Image_7',
        'Image_8',
        'Image_9',
        'Image_10'
    ];
    for (const field of imageFields){
        const value = row[field];
        if (value && value.trim() !== '') {
            try {
                new URL(value);
            } catch  {
                errors.push({
                    field,
                    message: 'URL de imagen inválida',
                    value
                });
            }
        }
    }
    // Validar Video URL
    if (row.Video_URL && row.Video_URL.trim() !== '') {
        try {
            new URL(row.Video_URL);
        } catch  {
            errors.push({
                field: 'Video_URL',
                message: 'URL de video inválida',
                value: row.Video_URL
            });
        }
    }
    // Validar Ficha Técnica URL
    if (row.Ficha_Tecnica_URL && row.Ficha_Tecnica_URL.trim() !== '') {
        try {
            new URL(row.Ficha_Tecnica_URL);
        } catch  {
            errors.push({
                field: 'Ficha_Tecnica_URL',
                message: 'URL de ficha técnica inválida',
                value: row.Ficha_Tecnica_URL
            });
        }
    }
    // Warning si no hay imagen principal
    if (!row.Image_1 || row.Image_1.trim() === '') {
        warnings.push({
            field: 'Image_1',
            message: 'Se recomienda incluir al menos una imagen',
            value: ''
        });
    }
    return {
        errors,
        warnings
    };
}
function parseCSV(csvContent) {
    const lines = csvContent.split(/\r?\n/).filter((line)=>line.trim() !== '');
    const globalErrors = [];
    const products = [];
    if (lines.length === 0) {
        return {
            success: false,
            totalRows: 0,
            validRows: 0,
            invalidRows: 0,
            products: [],
            globalErrors: [
                'El archivo está vacío'
            ]
        };
    }
    // Parsear headers
    const headerLine = lines[0];
    const headers = parseCSVLine(headerLine);
    // Verificar que los headers coincidan
    const missingHeaders = __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$csv$2f$product$2d$template$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["CSV_HEADERS"].filter((h)=>!headers.includes(h));
    const extraHeaders = headers.filter((h)=>!__TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$csv$2f$product$2d$template$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["CSV_HEADERS"].includes(h));
    if (missingHeaders.length > 0) {
        globalErrors.push(`Columnas faltantes: ${missingHeaders.join(', ')}`);
    }
    if (extraHeaders.length > 0) {
        globalErrors.push(`Columnas no reconocidas (serán ignoradas): ${extraHeaders.join(', ')}`);
    }
    // Crear mapa de índices
    const headerIndexMap = {};
    headers.forEach((h, i)=>{
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
    for(let i = startRow; i < lines.length; i++){
        const line = lines[i];
        if (line.trim() === '') continue;
        const values = parseCSVLine(line);
        // Crear objeto ProductCSVRow
        const rowData = {};
        for (const header of __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$csv$2f$product$2d$template$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["CSV_HEADERS"]){
            const index = headerIndexMap[header];
            rowData[header] = index !== undefined ? values[index] || '' : '';
        }
        // Validar
        const { errors, warnings } = validateRow(rowData, i + 1);
        products.push({
            row: i + 1,
            data: rowData,
            errors,
            warnings,
            isValid: errors.length === 0
        });
    }
    const validRows = products.filter((p)=>p.isValid).length;
    const invalidRows = products.filter((p)=>!p.isValid).length;
    return {
        success: invalidRows === 0 && globalErrors.length === 0,
        totalRows: products.length,
        validRows,
        invalidRows,
        products,
        globalErrors
    };
}
function compareWithExisting(newProducts, existingProducts) {
    const diffs = [];
    for (const newProduct of newProducts){
        if (!newProduct.isValid) continue;
        const ref = newProduct.data.Ref;
        const existing = existingProducts.get(ref);
        if (!existing) {
            // Producto nuevo
            diffs.push({
                ref,
                changeType: 'create',
                changes: []
            });
        } else {
            // Comparar campos
            const changes = [];
            const fieldMappings = {
                Ref: 'pdt_codigo',
                Cod_Barra: 'codigo_barras',
                Producto: 'nombre_comercial',
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
                Categoria: '_category',
                Subcategoria: '_subcategory',
                Tipo_producto: '_type',
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
                Image_1: 'imagen_principal_url',
                Image_2: '_image_2',
                Image_3: '_image_3',
                Image_4: '_image_4',
                Image_5: '_image_5',
                Image_6: '_image_6',
                Image_7: '_image_7',
                Image_8: '_image_8',
                Image_9: '_image_9',
                Image_10: '_image_10'
            };
            for (const [csvField, dbField] of Object.entries(fieldMappings)){
                if (dbField.startsWith('_')) continue; // Skip special fields
                const newValue = newProduct.data[csvField] || '';
                const oldValue = String(existing[dbField] || '');
                // Normalize values for comparison
                const normalizedNew = normalizeValue(newValue, csvField);
                const normalizedOld = normalizeValue(oldValue, csvField);
                if (normalizedNew !== normalizedOld) {
                    changes.push({
                        field: csvField,
                        oldValue: oldValue || null,
                        newValue: newValue || null
                    });
                }
            }
            if (changes.length > 0) {
                diffs.push({
                    ref,
                    changeType: 'update',
                    changes
                });
            } else {
                diffs.push({
                    ref,
                    changeType: 'unchanged',
                    changes: []
                });
            }
        }
    }
    return diffs;
}
function normalizeValue(value, field) {
    if (!value) return '';
    // Para booleanos
    if (__TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$csv$2f$product$2d$template$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["BOOLEAN_FIELDS"].includes(field)) {
        const upper = value.toUpperCase();
        if (upper === 'SI' || upper === 'TRUE' || upper === '1') return 'true';
        if (upper === 'NO' || upper === 'FALSE' || upper === '0') return 'false';
        return value.toLowerCase();
    }
    // Para numéricos
    if (__TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$csv$2f$product$2d$template$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NUMERIC_FIELDS"].includes(field)) {
        const num = parseFloat(value.replace(/[,$]/g, ''));
        return isNaN(num) ? '' : num.toString();
    }
    return value.trim().toLowerCase();
}
function parseBooleanValue(value) {
    const upper = (value || '').toUpperCase().trim();
    return upper === 'SI' || upper === 'TRUE' || upper === '1' || upper === 'YES';
}
function parseNumericValue(value) {
    if (!value || value.trim() === '') return null;
    const num = parseFloat(value.replace(/[,$]/g, ''));
    return isNaN(num) ? null : num;
}
}),
"[project]/lib/csv/product-importer.ts [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "exportProductsToCSV",
    ()=>exportProductsToCSV,
    "getExistingProductsMap",
    ()=>getExistingProductsMap,
    "importProducts",
    ()=>importProducts
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$supabase$2f$server$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/lib/supabase/server.ts [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$csv$2f$product$2d$parser$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/lib/csv/product-parser.ts [app-route] (ecmascript)");
;
;
async function importProducts(products, diffs, importMode, userId, filename) {
    const supabase = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$supabase$2f$server$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["createClient"])();
    const errors = [];
    let created = 0;
    let updated = 0;
    let skipped = 0;
    // Crear registro de importación
    const { data: importRecord, error: importError } = await supabase.from('csv_imports').insert({
        filename,
        total_rows: products.length,
        status: 'processing',
        import_mode: importMode,
        imported_by: userId,
        started_at: new Date().toISOString()
    }).select('id').single();
    if (importError || !importRecord) {
        return {
            success: false,
            importId: '',
            created: 0,
            updated: 0,
            skipped: 0,
            errors: [
                {
                    row: 0,
                    ref: '',
                    error: 'Error al crear registro de importación'
                }
            ]
        };
    }
    const importId = importRecord.id;
    // Pre-cargar categorías
    const categoryCache = await loadCategoryCache(supabase);
    // Procesar cada producto
    for(let i = 0; i < products.length; i++){
        const product = products[i];
        const diff = diffs.find((d)=>d.ref === product.data.Ref);
        if (!product.isValid) {
            skipped++;
            continue;
        }
        if (!diff) {
            skipped++;
            continue;
        }
        try {
            if (diff.changeType === 'create') {
                if (importMode === 'update') {
                    // En modo update, también se crean nuevos
                    await createProduct(supabase, product.data, categoryCache, userId, importId, product.row);
                    created++;
                } else if (importMode === 'add_only') {
                    await createProduct(supabase, product.data, categoryCache, userId, importId, product.row);
                    created++;
                } else {
                    await createProduct(supabase, product.data, categoryCache, userId, importId, product.row);
                    created++;
                }
            } else if (diff.changeType === 'update') {
                if (importMode === 'add_only') {
                    skipped++;
                } else {
                    await updateProduct(supabase, product.data, diff, categoryCache, userId, importId, product.row);
                    updated++;
                }
            } else {
                skipped++;
            }
        } catch (error) {
            errors.push({
                row: product.row,
                ref: product.data.Ref,
                error: error instanceof Error ? error.message : 'Error desconocido'
            });
        }
    }
    // Actualizar registro de importación
    await supabase.from('csv_imports').update({
        rows_created: created,
        rows_updated: updated,
        rows_skipped: skipped,
        rows_error: errors.length,
        errors: errors.length > 0 ? errors : null,
        status: errors.length === 0 ? 'completed' : 'completed_with_errors',
        completed_at: new Date().toISOString()
    }).eq('id', importId);
    return {
        success: errors.length === 0,
        importId,
        created,
        updated,
        skipped,
        errors
    };
}
async function loadCategoryCache(supabase) {
    const cache = new Map();
    // Cargar silos
    const { data: silos } = await supabase.from('silos').select('id, slug, name');
    // Cargar subcategorías
    const { data: subcategories } = await supabase.from('subcategories').select('id, slug, name, silo_id');
    // Cargar tipos de producto
    const { data: productTypes } = await supabase.from('product_types').select('id, slug, name, subcategory_id');
    // Crear mapa combinado
    if (silos && subcategories) {
        for (const silo of silos){
            const siloSubs = subcategories.filter((s)=>s.silo_id === silo.id);
            for (const sub of siloSubs){
                // Clave: "categoria|subcategoria"
                const key = `${silo.name.toLowerCase()}|${sub.name.toLowerCase()}`;
                cache.set(key, {
                    siloId: silo.id,
                    subcategoryId: sub.id
                });
                // También agregar tipos si existen
                if (productTypes) {
                    const subTypes = productTypes.filter((t)=>t.subcategory_id === sub.id);
                    for (const type of subTypes){
                        const typeKey = `${silo.name.toLowerCase()}|${sub.name.toLowerCase()}|${type.name.toLowerCase()}`;
                        cache.set(typeKey, {
                            siloId: silo.id,
                            subcategoryId: sub.id,
                            productTypeId: type.id
                        });
                    }
                }
            }
        }
    }
    return cache;
}
function getCategoryInfo(data, cache) {
    const categoria = data.Categoria?.toLowerCase().trim() || '';
    const subcategoria = data.Subcategoria?.toLowerCase().trim() || '';
    const tipo = data.Tipo_producto?.toLowerCase().trim() || '';
    // Intentar con los 3 niveles
    if (tipo) {
        const key = `${categoria}|${subcategoria}|${tipo}`;
        const info = cache.get(key);
        if (info) return info;
    }
    // Intentar con 2 niveles
    if (subcategoria) {
        const key = `${categoria}|${subcategoria}`;
        const info = cache.get(key);
        if (info) return info;
    }
    return null;
}
async function createProduct(supabase, data, categoryCache, userId, importId, rowNumber) {
    // Generar slug
    const slug = generateSlug(data.Producto);
    // Obtener categoría
    const categoryInfo = getCategoryInfo(data, categoryCache);
    // Crear producto
    const { data: product, error } = await supabase.from('products').insert({
        pdt_codigo: data.Ref,
        codigo_barras: data.Cod_Barra || null,
        nombre_comercial: data.Producto,
        pdt_descripcion: data.Descripcion || null,
        marca: data.Marca || null,
        precio: (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$csv$2f$product$2d$parser$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["parseNumericValue"])(data.Precio_COP),
        descuento_porcentaje: (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$csv$2f$product$2d$parser$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["parseNumericValue"])(data.Descuento) || 0,
        upp_existencia: (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$csv$2f$product$2d$parser$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["parseNumericValue"])(data.Existencia_inv) || 0,
        pedido_en_camino: (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$csv$2f$product$2d$parser$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["parseBooleanValue"])(data.Pedido_en_camino),
        descontinuado: (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$csv$2f$product$2d$parser$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["parseBooleanValue"])(data.Descontinuado),
        pdt_empaque: data.Inner_pack || null,
        outer_pack: (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$csv$2f$product$2d$parser$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["parseNumericValue"])(data.Outer_pack),
        nombre_coleccion: data.Coleccion || null,
        product_type_id: categoryInfo?.productTypeId || null,
        material: data.Material || null,
        color: data.Color || null,
        dimensiones: data.Dimensiones || null,
        peso: (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$csv$2f$product$2d$parser$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["parseNumericValue"])(data.Peso_kg),
        capacidad: data.Capacidad || null,
        pais_origen: data.Pais_origen || null,
        descripcion_larga: data.Descrip_Cliente_Final || null,
        momentos_uso: data.Momentos_Uso_Cliente || null,
        productos_afines_csv: data.Productos_Afines_Cliente || null,
        descripcion_distribuidor: data.Descrip_Distribuidor || null,
        argumentos_venta: data.Argumentos_Venta_Distribuidor || null,
        ubicacion_tienda: data.Ubicacion_Tienda_Distribuidor || null,
        margen_sugerido: (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$csv$2f$product$2d$parser$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["parseNumericValue"])(data.Margen_Sugerido),
        rotacion_esperada: data.Rotacion_Esperada?.toLowerCase() || null,
        seo_title: data.SEO_Title || null,
        seo_description: data.SEO_Description || null,
        tags: data.Tags ? data.Tags.split(',').map((t)=>t.trim()) : null,
        video_url: data.Video_URL || null,
        ficha_tecnica_url: data.Ficha_Tecnica_URL || null,
        fecha_lanzamiento: data.Fecha_Lanzamiento || null,
        imagen_principal_url: data.Image_1 || null,
        slug,
        is_active: true,
        is_on_sale: ((0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$csv$2f$product$2d$parser$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["parseNumericValue"])(data.Descuento) || 0) > 0,
        last_csv_update: new Date().toISOString(),
        created_by: userId,
        updated_by: userId
    }).select('id').single();
    if (error) {
        throw new Error(`Error creando producto: ${error.message}`);
    }
    // Asociar con categoría
    if (product && categoryInfo) {
        await supabase.from('product_categories').insert({
            product_id: product.id,
            subcategory_id: categoryInfo.subcategoryId,
            is_primary: true
        });
    }
    // Insertar imágenes adicionales
    if (product) {
        await insertProductImages(supabase, product.id, data);
    }
    // Crear log de cambio
    await supabase.from('product_change_log').insert({
        product_id: product?.id,
        change_type: 'create',
        change_source: 'csv',
        fields_changed: {
            all: 'new product'
        },
        changed_by: userId,
        csv_filename: importId,
        csv_row_number: rowNumber
    });
}
async function updateProduct(supabase, data, diff, categoryCache, userId, importId, rowNumber) {
    // Obtener producto existente
    const { data: existingProduct } = await supabase.from('products').select('id').eq('pdt_codigo', data.Ref).single();
    if (!existingProduct) {
        throw new Error('Producto no encontrado para actualizar');
    }
    const productId = existingProduct.id;
    const categoryInfo = getCategoryInfo(data, categoryCache);
    // Construir objeto de actualización solo con campos cambiados
    const updateData = {
        updated_by: userId,
        last_csv_update: new Date().toISOString(),
        is_on_sale: ((0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$csv$2f$product$2d$parser$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["parseNumericValue"])(data.Descuento) || 0) > 0
    };
    // Mapear campos CSV a campos de BD
    const fieldMap = {
        Cod_Barra: {
            dbField: 'codigo_barras'
        },
        Producto: {
            dbField: 'nombre_comercial'
        },
        Descripcion: {
            dbField: 'pdt_descripcion'
        },
        Marca: {
            dbField: 'marca'
        },
        Precio_COP: {
            dbField: 'precio',
            transform: __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$csv$2f$product$2d$parser$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["parseNumericValue"]
        },
        Descuento: {
            dbField: 'descuento_porcentaje',
            transform: (v)=>(0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$csv$2f$product$2d$parser$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["parseNumericValue"])(v) || 0
        },
        Existencia_inv: {
            dbField: 'upp_existencia',
            transform: (v)=>(0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$csv$2f$product$2d$parser$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["parseNumericValue"])(v) || 0
        },
        Pedido_en_camino: {
            dbField: 'pedido_en_camino',
            transform: __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$csv$2f$product$2d$parser$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["parseBooleanValue"]
        },
        Descontinuado: {
            dbField: 'descontinuado',
            transform: __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$csv$2f$product$2d$parser$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["parseBooleanValue"]
        },
        Inner_pack: {
            dbField: 'pdt_empaque'
        },
        Outer_pack: {
            dbField: 'outer_pack',
            transform: __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$csv$2f$product$2d$parser$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["parseNumericValue"]
        },
        Coleccion: {
            dbField: 'nombre_coleccion'
        },
        Material: {
            dbField: 'material'
        },
        Color: {
            dbField: 'color'
        },
        Dimensiones: {
            dbField: 'dimensiones'
        },
        Peso_kg: {
            dbField: 'peso',
            transform: __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$csv$2f$product$2d$parser$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["parseNumericValue"]
        },
        Capacidad: {
            dbField: 'capacidad'
        },
        Pais_origen: {
            dbField: 'pais_origen'
        },
        Descrip_Cliente_Final: {
            dbField: 'descripcion_larga'
        },
        Momentos_Uso_Cliente: {
            dbField: 'momentos_uso'
        },
        Productos_Afines_Cliente: {
            dbField: 'productos_afines_csv'
        },
        Descrip_Distribuidor: {
            dbField: 'descripcion_distribuidor'
        },
        Argumentos_Venta_Distribuidor: {
            dbField: 'argumentos_venta'
        },
        Ubicacion_Tienda_Distribuidor: {
            dbField: 'ubicacion_tienda'
        },
        Margen_Sugerido: {
            dbField: 'margen_sugerido',
            transform: __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$csv$2f$product$2d$parser$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["parseNumericValue"]
        },
        Rotacion_Esperada: {
            dbField: 'rotacion_esperada',
            transform: (v)=>v?.toLowerCase() || null
        },
        SEO_Title: {
            dbField: 'seo_title'
        },
        SEO_Description: {
            dbField: 'seo_description'
        },
        Tags: {
            dbField: 'tags',
            transform: (v)=>v ? v.split(',').map((t)=>t.trim()) : null
        },
        Video_URL: {
            dbField: 'video_url'
        },
        Ficha_Tecnica_URL: {
            dbField: 'ficha_tecnica_url'
        },
        Fecha_Lanzamiento: {
            dbField: 'fecha_lanzamiento'
        },
        Image_1: {
            dbField: 'imagen_principal_url'
        }
    };
    for (const change of diff.changes){
        const mapping = fieldMap[change.field];
        if (mapping) {
            const value = data[change.field];
            updateData[mapping.dbField] = mapping.transform ? mapping.transform(value) : value || null;
        }
    }
    // Actualizar producto
    const { error } = await supabase.from('products').update(updateData).eq('id', productId);
    if (error) {
        throw new Error(`Error actualizando producto: ${error.message}`);
    }
    // Actualizar tipo de producto si cambió
    if (categoryInfo?.productTypeId) {
        await supabase.from('products').update({
            product_type_id: categoryInfo.productTypeId
        }).eq('id', productId);
    }
    // Actualizar imágenes si cambiaron
    const imageChanges = diff.changes.filter((c)=>c.field.startsWith('Image_'));
    if (imageChanges.length > 0) {
        // Eliminar imágenes existentes y reinsertar
        await supabase.from('product_media').delete().eq('product_id', productId);
        await insertProductImages(supabase, productId, data);
    }
    // Crear log de cambio
    const changesJson = {};
    for (const change of diff.changes){
        changesJson[change.field] = {
            old: change.oldValue,
            new: change.newValue
        };
    }
    await supabase.from('product_change_log').insert({
        product_id: productId,
        change_type: 'update',
        change_source: 'csv',
        fields_changed: changesJson,
        changed_by: userId,
        csv_filename: importId,
        csv_row_number: rowNumber
    });
}
async function insertProductImages(supabase, productId, data) {
    const images = [];
    const imageFields = [
        'Image_2',
        'Image_3',
        'Image_4',
        'Image_5',
        'Image_6',
        'Image_7',
        'Image_8',
        'Image_9',
        'Image_10'
    ];
    for(let i = 0; i < imageFields.length; i++){
        const url = data[imageFields[i]];
        if (url && url.trim() !== '') {
            images.push({
                product_id: productId,
                media_type: 'image',
                url: url.trim(),
                order_index: i + 2
            });
        }
    }
    if (images.length > 0) {
        await supabase.from('product_media').insert(images);
    }
}
function generateSlug(name) {
    return name.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '') // Remover acentos
    .replace(/[^a-z0-9\s-]/g, '') // Solo alfanuméricos
    .replace(/\s+/g, '-') // Espacios a guiones
    .replace(/-+/g, '-') // Múltiples guiones a uno
    .replace(/^-|-$/g, ''); // Remover guiones inicio/fin
}
async function getExistingProductsMap(supabase) {
    const { data: products } = await supabase.from('products').select('*');
    const map = new Map();
    if (products) {
        for (const product of products){
            map.set(product.pdt_codigo, product);
        }
    }
    return map;
}
async function exportProductsToCSV(supabase) {
    const { data: products } = await supabase.from('products').select(`
      *,
      product_categories!inner(
        subcategory:subcategories(
          name,
          silo:silos(name)
        )
      ),
      product_type:product_types(name),
      product_media(url, order_index)
    `).order('pdt_codigo');
    if (!products || products.length === 0) {
        return '';
    }
    const { CSV_HEADERS } = await __turbopack_context__.A("[project]/lib/csv/product-template.ts [app-route] (ecmascript, async loader)");
    const rows = [
        CSV_HEADERS.join(',')
    ];
    for (const product of products){
        const category = product.product_categories?.[0]?.subcategory;
        const images = product.product_media?.sort((a, b)=>a.order_index - b.order_index) || [];
        const row = [
            escapeCSV(product.pdt_codigo || ''),
            escapeCSV(product.codigo_barras || ''),
            escapeCSV(product.nombre_comercial || ''),
            escapeCSV(product.pdt_descripcion || ''),
            escapeCSV(product.marca || ''),
            String(product.precio || ''),
            String(product.descuento_porcentaje || '0'),
            String(product.upp_existencia || '0'),
            product.pedido_en_camino ? 'SI' : 'NO',
            product.descontinuado ? 'SI' : 'NO',
            escapeCSV(product.pdt_empaque || ''),
            String(product.outer_pack || ''),
            escapeCSV(product.nombre_coleccion || ''),
            escapeCSV(category?.silo?.name || ''),
            escapeCSV(category?.name || ''),
            escapeCSV(product.product_type?.name || ''),
            escapeCSV(product.material || ''),
            escapeCSV(product.color || ''),
            escapeCSV(product.dimensiones || ''),
            String(product.peso || ''),
            escapeCSV(product.capacidad || ''),
            escapeCSV(product.pais_origen || ''),
            escapeCSV(product.descripcion_larga || ''),
            escapeCSV(product.momentos_uso || ''),
            escapeCSV(product.productos_afines_csv || ''),
            escapeCSV(product.descripcion_distribuidor || ''),
            escapeCSV(product.argumentos_venta || ''),
            escapeCSV(product.ubicacion_tienda || ''),
            String(product.margen_sugerido || ''),
            escapeCSV(product.rotacion_esperada || ''),
            escapeCSV(product.seo_title || ''),
            escapeCSV(product.seo_description || ''),
            escapeCSV((product.tags || []).join(',')),
            escapeCSV(product.video_url || ''),
            escapeCSV(product.ficha_tecnica_url || ''),
            escapeCSV(product.fecha_lanzamiento || ''),
            escapeCSV(product.imagen_principal_url || ''),
            ...Array.from({
                length: 9
            }, (_, i)=>{
                const img = images.find((m)=>m.order_index === i + 2);
                return escapeCSV(img?.url || '');
            })
        ];
        rows.push(row.join(','));
    }
    return rows.join('\n');
}
function escapeCSV(value) {
    if (!value) return '';
    if (value.includes(',') || value.includes('"') || value.includes('\n')) {
        return `"${value.replace(/"/g, '""')}"`;
    }
    return value;
}
}),
"[project]/app/api/products/csv/validate/route.ts [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "POST",
    ()=>POST
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/server.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$supabase$2f$server$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/lib/supabase/server.ts [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$csv$2f$product$2d$parser$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/lib/csv/product-parser.ts [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$csv$2f$product$2d$importer$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/lib/csv/product-importer.ts [app-route] (ecmascript)");
;
;
;
;
async function POST(request) {
    try {
        const supabase = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$supabase$2f$server$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["createClient"])();
        // Verificar autenticación
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError || !user) {
            return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
                error: 'No autorizado'
            }, {
                status: 401
            });
        }
        // Verificar rol de superadmin
        const { data: profile } = await supabase.from('user_profiles').select('role').eq('id', user.id).single();
        if (profile?.role !== 'superadmin') {
            return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
                error: 'No autorizado'
            }, {
                status: 403
            });
        }
        // Obtener contenido del archivo
        const formData = await request.formData();
        const file = formData.get('file');
        if (!file) {
            return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
                error: 'No se proporcionó archivo'
            }, {
                status: 400
            });
        }
        // Leer contenido
        const content = await file.text();
        // Parsear y validar CSV
        const parseResult = (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$csv$2f$product$2d$parser$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["parseCSV"])(content);
        // Obtener productos existentes para comparación
        const existingProducts = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$csv$2f$product$2d$importer$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["getExistingProductsMap"])(supabase);
        // Comparar con existentes
        const diffs = (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$csv$2f$product$2d$parser$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["compareWithExisting"])(parseResult.products, existingProducts);
        // Calcular estadísticas
        const stats = {
            total: parseResult.totalRows,
            valid: parseResult.validRows,
            invalid: parseResult.invalidRows,
            toCreate: diffs.filter((d)=>d.changeType === 'create').length,
            toUpdate: diffs.filter((d)=>d.changeType === 'update').length,
            unchanged: diffs.filter((d)=>d.changeType === 'unchanged').length
        };
        return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
            success: parseResult.success,
            stats,
            globalErrors: parseResult.globalErrors,
            products: parseResult.products.slice(0, 100),
            diffs: diffs.slice(0, 100),
            hasMore: parseResult.products.length > 100
        });
    } catch (error) {
        console.error('Error validando CSV:', error);
        return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
            error: 'Error al validar archivo CSV'
        }, {
            status: 500
        });
    }
}
}),
];

//# sourceMappingURL=%5Broot-of-the-server%5D__26016176._.js.map