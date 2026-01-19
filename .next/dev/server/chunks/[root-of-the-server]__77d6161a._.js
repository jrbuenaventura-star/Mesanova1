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
"[project]/app/api/products/csv/template/route.ts [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "GET",
    ()=>GET
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/server.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$csv$2f$product$2d$template$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/lib/csv/product-template.ts [app-route] (ecmascript)");
;
;
async function GET(request) {
    const { searchParams } = new URL(request.url);
    const includeDescriptions = searchParams.get('descriptions') === 'true';
    const csvContent = includeDescriptions ? (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$csv$2f$product$2d$template$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["generateCSVWithDescriptions"])() : (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$csv$2f$product$2d$template$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["generateEmptyCSVTemplate"])();
    const filename = includeDescriptions ? 'productos_template_con_instrucciones.csv' : 'productos_template.csv';
    return new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"](csvContent, {
        headers: {
            'Content-Type': 'text/csv; charset=utf-8',
            'Content-Disposition': `attachment; filename="${filename}"`
        }
    });
}
}),
];

//# sourceMappingURL=%5Broot-of-the-server%5D__77d6161a._.js.map