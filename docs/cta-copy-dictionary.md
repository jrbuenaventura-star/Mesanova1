# Diccionario de Copy Canónico para CTAs

Fecha de actualización: 2026-02-19

Este diccionario define el texto estándar por destino/acción para mantener consistencia global de CTAs.

## Reglas rápidas
- Para links/cards complejos, se permite texto visual contextual, pero el `aria-label` debe respetar este diccionario.
- Las claves con `x` representan rutas dinámicas normalizadas por la auditoría (ej. `/productos/x/x`).
- Las claves en formato `{...}` representan acciones programáticas (`onClick`, handlers).

## Mapeo Canónico

| Destino / Acción | Copy Canónico |
|---|---|
| `/productos` | `Ver productos` |
| `/` | `Inicio` |
| `/auth/login` | `Iniciar sesión` |
| `/productos/x` | `Ver categoría` |
| `/blog` | `Ver blog` |
| `/blog/x` | `Leer artículo` |
| `/lista/x` | `Ver lista` |
| `{() => router.back()}` | `Volver` |
| `/aliado/leads` | `Ver CRM` |
| `/productos/x/x` | `Ver producto` |
| `/aliado/leads/nuevo` | `Nuevo lead` |
| `{handleReset}` | `Nueva importación` |
| `/aliado/distributors` | `Ver clientes` |
| `/distributor/orders/nueva` | `Nueva orden` |
| `/distributor/orders` | `Ver pedidos` |
| `/perfil/listas-regalo` | `Volver a listas` |
| `/productos/mesa` | `Mesa` |
| `/productos/cocina` | `Cocina` |
| `/productos/cafe-te-bar` | `Café, Té y Bar` |
| `/admin/aliados/x/distributors` | `Ver clientes` |
| `/admin/aliados/nuevo` | `Nuevo aliado` |
| `/admin/orders` | `Ver órdenes` |
| `/auth/signup` | `Crear cuenta` |
| `/bonos/comprar` | `Comprar bono` |
| `/distributor/invoices` | `Facturas` |
| `/perfil/listas-regalo/nueva` | `Nueva lista` |
| `/perfil/ordenes` | `Ver órdenes` |
| `/perfil/ordenes/x` | `Ver detalle` |
| `{() => handleRemoveMedia(media.id)}` | `Eliminar` |
| `{() => setFilters(emptyFilters)}` | `Limpiar filtros` |
| `{() => downloadTemplate(false)}` | `Descargar plantilla vacía` |
| `{() => downloadTemplate(true)}` | `Descargar plantilla con instrucciones` |
| `{handleImport}` | `Importar` |
| `{handleSubmit}` | `Agregar al carrito` |
| `{handleStartChat}` | `Iniciar chat` |
| `{handleAddToCart}` | `Agregar al carrito` |
| `{() => setSelectedIndex(index)}` | `Ver imagen` |
| `/nosotros/sobre-mesanova` | `Sobre Mesanova` |
| `/nosotros/por-que-elegirnos` | `¿Por qué elegirnos?` |

