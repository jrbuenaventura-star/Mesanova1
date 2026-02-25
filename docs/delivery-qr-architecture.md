# Módulo Confirmación de Entrega QR Dinámico (Mesanova)

## 1) Arquitectura técnica detallada

### Objetivo
Implementar confirmación de entrega con trazabilidad legal y seguridad avanzada, desacoplada del ERP actual, con evolución a PWA offline-first.

### Capas
- **Canales**:
  - Web cliente final: `/entrega/[token]` para OTP + confirmación legal.
  - Admin ejecutivo: `/admin/ordenes?tab=confirmacion-entrega-qr`.
- **API intermedia desacoplada**:
  - Dominio `delivery` (`/api/delivery/*`) para QR/OTP/confirmación/offline.
  - Dominio `admin delivery` (`/api/admin/delivery/*`) para operación y analytics.
  - Integración ERP (`/api/integrations/erp/delivery-events`) con token técnico.
- **Persistencia**:
  - Tablas `delivery_*` dedicadas (sin acoplar llaves foráneas duras a ERP).
  - Snapshot normalizado `delivery_erp_order_snapshots`.
- **Integración PQRS**:
  - Incidencias crean ticket en `pqrs_tickets` automáticamente.
  - Notificación inmediata a `despachos@alumaronline.com`.

### Desacople ERP
- La confirmación no depende del esquema interno del ERP.
- Se usa una **capa de adaptación** (`lib/delivery/erp-adapter.ts`) para:
  - leer desde snapshots normalizados;
  - reconstruir snapshot desde `orders/order_items` (ERP actual);
  - aceptar eventos futuros por endpoint de integración.

## 2) Modelo base de datos

### Nuevas tablas (migración)
Archivo: `supabase/migrations/create_delivery_qr_confirmation_module.sql`

- `delivery_erp_order_snapshots`: estado normalizado del pedido.
- `delivery_erp_sync_events`: cola de eventos ERP.
- `delivery_qr_tokens`: QR dinámico firmado por pedido.
- `delivery_packages`: bultos por QR.
- `delivery_otp_challenges`: OTP con TTL, intentos y rate limit.
- `delivery_validation_sessions`: sesión efímera tras OTP válido.
- `delivery_confirmations`: acta legal con firma y geolocalización.
- `delivery_confirmation_packages`: confirmación por bulto.
- `delivery_incidents`: incidencia/reclamación y vínculo a PQRS.
- `delivery_offline_events`: eventos offline y estado de sincronización.
- `delivery_audit_logs`: bitácora inmutable (hash encadenado).

### Seguridad en BD
- RLS activado en tablas `delivery_*`.
- Logs inmutables con triggers anti `UPDATE/DELETE`.
- Trigger hash chain para evidencia forense.

## 3) Diseño de API

### Admin
- `POST /api/admin/delivery/qr`: generar QR firmado.
- `GET /api/admin/delivery/qr`: listar QRs y estados.
- `GET /api/admin/delivery/dashboard`: KPIs operativo + analítico.
- `GET /api/admin/delivery/export`: export CSV (Excel-compatible).
- `GET /api/admin/delivery/day-list`: predescarga offline del día.

### Público (cliente)
- `POST /api/delivery/scan`: valida token QR (sin exponer pedido).
- `POST /api/delivery/otp/request`: solicita OTP SMS/WhatsApp.
- `POST /api/delivery/otp/verify`: valida OTP y abre sesión.
- `POST /api/delivery/confirm`: confirma entrega + firma + cláusula.
- `GET /api/delivery/evidence/[qrId]`: descarga PDF de evidencia.
- `POST /api/delivery/offline/sync`: sincroniza cola offline.

### Integración ERP
- `POST /api/integrations/erp/delivery-events`: ingreso de eventos/snapshots ERP (token técnico).

## 4) Flujo PWA offline-first

### Elementos implementados
- Manifest: `app/manifest.ts`
- Service worker: `public/delivery-sw.js`
- Fallback offline: `public/offline-delivery.html`
- Registro y sync: `components/delivery/delivery-pwa-register.tsx`
- Caché cifrado local (AES-GCM WebCrypto):
  - `lib/delivery/offline-client.ts`
  - cola local cifrada de acciones
  - predescarga diaria cifrada

### Estrategia
1. En online: confirmación se envía directo a `/api/delivery/confirm`.
2. En offline: se encola payload de confirmación en storage cifrado local.
3. Al reconectar: auto-sync intenta replay seguro de cola.
4. Hash criptográfico local por evento (order_id + timestamp + gps + device_id).
5. Servidor valida hash y marca `synced/conflict/rejected`.

## 5) Estrategia de seguridad

- Token QR firmado (JWT HS256 equivalente) con `exp`, `nonce`, `jti`.
- Anti replay:
  - nonce único en BD;
  - revocación inmediata del QR tras confirmación;
  - sesión OTP de un solo uso.
- OTP obligatorio antes de revelar pedido.
- Rate limiting OTP por QR/destino/ventana.
- Registro de IP, geolocalización, timestamp y dispositivo.
- Cláusula legal persistida textual + firma digital + OTP validado.
- PDF de evidencia legal por confirmación.
- Bitácora de auditoría encadenada e inmutable.
- Integración ERP protegida por token técnico.

## 6) Dashboard ejecutivo

### Operativo
- Entregas pendientes.
- Entregas confirmadas.
- Entregas con incidencia.
- Tiempo promedio de validación OTP.
- Sincronizaciones offline pendientes.

### Analítico
- Reclamaciones por SKU.
- Reclamaciones por transportador.
- Reclamaciones por bodega.
- Heatmap geográfico (clusters).
- Score por transportador.
- Índice de merma potencial.
- Ranking SKUs críticos.

## 7) Diagrama de flujo (alto nivel)

```text
ERP -> API Integración -> delivery_erp_order_snapshots
                       -> delivery_qr_tokens + delivery_packages

Cliente escanea QR -> /api/delivery/scan
                   -> /api/delivery/otp/request
                   -> /api/delivery/otp/verify
                   -> /api/delivery/confirm
                      -> delivery_confirmations
                      -> delivery_incidents (si aplica)
                      -> pqrs_tickets + pqrs_attachments
                      -> evidencia PDF + audit logs

Modo offline:
Transportador/cliente -> cola cifrada local -> reconexión -> sync/replay -> server validation
```

## 8) Roadmap por fases

### Fase 1 - Online (implementada base)
- QR dinámico firmado + OTP obligatorio.
- Confirmación legal por bulto + firma + PDF.
- Integración automática con PQRS.
- Dashboard operativo/analítico + export.

### Fase 2 - Offline PWA (implementada base, endurecer operación)
- Predescarga diaria y cache cifrado.
- Cola cifrada y sincronización automática.
- Resolver conflictos con reglas por prioridad temporal/estado.
- Agregar Background Sync nativo según soporte navegador.

### Fase 3 - Analytics avanzado
- Modelo de score con pesos por SLA, reincidencia y severidad.
- Heatmap con capa GIS.
- Forecast de merma por SKU/bodega/proveedor.
- Segmentación de transportadores por riesgo operativo.

## 9) Estimación de complejidad técnica

- Núcleo QR/OTP/legal: **Alta**.
- Integración PQRS automática con adjuntos: **Media-Alta**.
- Offline-first con sincronización confiable: **Alta**.
- Analytics ejecutivo: **Media**.
- Endurecimiento productivo multi-bodega/multi-transportador: **Alta**.

## 10) Riesgos y mitigaciones

- **Proveedor OTP no disponible**:
  - Mitigar con webhook adapter + fallback por canal alterno.
- **Sesiones expiran en redes inestables**:
  - Mitigar con TTL configurable y refresh controlado.
- **Conflictos offline**:
  - Mitigar con hash de evento + estado conflict/rejected + resolución en dashboard.
- **Carga de adjuntos en campo**:
  - Mitigar con límites de tamaño, validación MIME y retries.
- **Cambio de ERP**:
  - Mitigar con API intermedia + snapshots normalizados + adapter pattern.

## 11) Impacto estratégico

- Reduce mermas por evidencia trazable por bulto.
- Reduce reclamaciones injustificadas por OTP+firma+geo+auditoría.
- Mejora trazabilidad legal auditable (PDF + logs inmutables).
- Permite medir desempeño por transportador y bodega.
- Mejora negociación con proveedores con data de incidencias por SKU.
- Aporta ventaja competitiva B2B por cumplimiento y confiabilidad operativa.
