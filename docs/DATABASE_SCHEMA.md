# Esquema de Base de Datos - Alumar E-commerce

## Estructura General

La base de datos está diseñada para soportar un catálogo de productos e-commerce con las siguientes capacidades:

- Organización por silos temáticos y subcategorías
- Gestión completa de productos con datos del ERP
- Soporte para múltiples imágenes y videos por producto
- Recomendaciones de productos similares y complementarios
- Gestión de inventario por almacén
- SEO optimizado con slugs y metadatos
- Row Level Security (RLS) para protección de datos

## Tablas Principales

### 1. `silos`
Contiene los 5 silos temáticos principales de la arquitectura.

**Campos:**
- `id`: UUID (Primary Key)
- `slug`: TEXT (URL amigable, ej: 'cocina')
- `name`: TEXT (Nombre visible)
- `description`: TEXT
- `seo_title`: TEXT
- `seo_description`: TEXT
- `order_index`: INTEGER

### 2. `subcategories`
Subcategorías dentro de cada silo (25 subcategorías en total).

**Campos:**
- `id`: UUID (Primary Key)
- `silo_id`: UUID (Foreign Key → silos)
- `slug`: TEXT
- `name`: TEXT
- `description`: TEXT
- `order_index`: INTEGER

### 3. `products`
Tabla principal de productos con todos los datos del ERP y catálogo.

**Campos principales:**
- `id`: UUID (Primary Key)
- `pdt_codigo`: TEXT (Código único del ERP)
- `pdt_descripcion`: TEXT (Descripción del producto)
- `pdt_empaque`: TEXT (Inner pack - cantidad por unidad)
- `upp_existencia`: DECIMAL (Disponibilidad total - calculada automáticamente)
- `precio`: DECIMAL (Precio de venta)
- `nombre_comercial`: TEXT (Nombre para la web)
- `slug`: TEXT (URL amigable)
- `imagen_principal_url`: TEXT
- `is_active`: BOOLEAN
- `is_featured`: BOOLEAN

**Campos de reposición (por implementar):**
- `reposicion_cuando`: TEXT
- `reposicion_cuanto`: INTEGER
- `outer_pack`: INTEGER
- `pertenece_coleccion`: BOOLEAN

### 4. `product_categories`
Relación muchos a muchos entre productos y subcategorías.

**Campos:**
- `product_id`: UUID (Foreign Key → products)
- `subcategory_id`: UUID (Foreign Key → subcategories)
- `is_primary`: BOOLEAN (categoría principal del producto)

### 5. `product_media`
Imágenes y videos adicionales de productos.

**Campos:**
- `product_id`: UUID (Foreign Key → products)
- `media_type`: TEXT ('image' o 'video')
- `url`: TEXT (URL de Vercel Blob)
- `thumbnail_url`: TEXT (miniatura para videos)
- `order_index`: INTEGER

### 6. `product_similar` y `product_complement`
Recomendaciones de productos relacionados.

**Campos:**
- `product_id`: UUID (Foreign Key → products)
- `similar_product_id` / `complement_product_id`: UUID
- `order_index`: INTEGER

### 7. `warehouses`
Gestión de almacenes para control de inventario.

**Campos:**
- `id`: UUID (Primary Key)
- `code`: TEXT (Código único: EX1, EX2, EX3, EX4)
- `name`: TEXT (Nombre del almacén)
- `warehouse_type`: TEXT ('bodega', 'punto_exhibicion', 'segundas', 'otro')
- `address`: TEXT (Dirección física)
- `is_active`: BOOLEAN
- `can_ship`: BOOLEAN (Si puede despachar pedidos)
- `show_in_frontend`: BOOLEAN (Si se muestra en web)
- `order_index`: INTEGER

**Almacenes predefinidos:**
- **EX1**: Bodega Alumar (Principal)
- **EX2**: Bodega Zona Industrial (Secundaria)
- **EX3**: Punto Exhibición (Tienda física)
- **EX4**: Segundas (Productos de segunda calidad)

### 8. `product_warehouse_stock`
Inventario específico por producto y almacén.

**Campos:**
- `id`: UUID (Primary Key)
- `product_id`: UUID (Foreign Key → products)
- `warehouse_id`: UUID (Foreign Key → warehouses)
- `quantity`: DECIMAL (Cantidad física)
- `reserved_quantity`: DECIMAL (Cantidad reservada en pedidos)
- `available_quantity`: DECIMAL (Calculado: quantity - reserved_quantity)
- `min_stock`: DECIMAL (Stock mínimo para alertas)
- `max_stock`: DECIMAL (Stock máximo)
- `last_sync_at`: TIMESTAMPTZ (Última sincronización con ERP)

**Funcionalidad:**
- Sincronización automática del total en `products.upp_existencia`
- Alertas de stock bajo por almacén
- Control de reservas para pedidos pendientes
- Trazabilidad de última actualización

## Arquitectura de Silos

### 1. Cocina (`/cocina/`)
- Organización
- Preparación
- Corte y Picado
- Para cocinar
- Repostería

### 2. Mesa (`/mesa/`)
- Servir
- Vajilla
- Vajilla temporada
- Vasos
- Decoración y Accesorios
- Cubiertos
- Ropa de mesa

### 3. Café, té y Bar (`/cafe-te-bar/`)
- Vasos
- Copas Vino
- Copas Agua
- Copas Champaña
- Otras Copas
- Bar
- Café
- Té

### 4. Termos y Neveras portátiles (`/termos-neveras/`)
- Termos
- Neveras
- Botellas y Botilitos

### 5. Profesional (`/profesional/`)
- Preparación y Utensilios
- Servir y Vajilla

## Integración con ERP

Los siguientes campos se sincronizan automáticamente con el ERP:

- `pdt_codigo`: Código único del producto
- `upp_existencia`: Disponibilidad total (calculada desde warehouses)
- `precio`: Precio de venta actualizado
- `pdt_empaque`: Cantidad por unidad (inner pack)
- `product_warehouse_stock.quantity`: Existencias por almacén (UGR_EX1, UGR_EX2, UGR_EX3, UGR_EX4)

## Almacenamiento de Media

Las imágenes y videos se almacenan en **Vercel Blob**:
- URLs públicas generadas automáticamente
- Soporte para múltiples archivos por producto
- Miniaturas para videos

## Row Level Security (RLS)

**Políticas implementadas:**
- Lectura pública para productos activos
- Lectura completa para usuarios autenticados
- Escritura solo para usuarios autenticados
- Lectura pública de almacenes activos
- Gestión de stock solo para administradores

## Queries Disponibles

Ver `/lib/db/queries.ts` para funciones útiles:
- `getSilosWithSubcategories()`: Navegación principal
- `getProductBySlug()`: Detalle de producto con stock por almacén
- `getProductsBySubcategory()`: Listado por categoría
- `getFeaturedProducts()`: Productos destacados
- `searchProducts()`: Búsqueda de productos
- `getProductAvailability()`: Disponibilidad en tiempo real
- `getActiveWarehouses()`: Lista de almacenes activos
- `getProductStockByWarehouses()`: Stock de producto por almacén
- `getAvailableStockForShipping()`: Stock disponible para despacho
- `updateWarehouseStock()`: Actualizar inventario de almacén
- `getLowStockProducts()`: Productos con stock bajo
- `getWarehouseSummary()`: Resumen estadístico de almacenes

## Flujo de Sincronización de Stock

1. El ERP actualiza `product_warehouse_stock` con las existencias de cada almacén
2. Un trigger automático suma todas las cantidades disponibles
3. Se actualiza `products.upp_existencia` con el total
4. El frontend consulta ambas tablas según necesidad:
   - Total general para listados
   - Detalle por almacén para páginas de producto
