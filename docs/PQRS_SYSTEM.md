# Sistema de PQRs (Peticiones, Quejas, Reclamos y Sugerencias)

## Descripción General

Sistema completo de gestión de tickets de soporte para Mesanova que permite a distribuidores, agentes de canal y aliados crear y dar seguimiento a sus solicitudes, mientras que los superadmins pueden gestionar, asignar tareas y resolver los tickets.

## Características Principales

### Para Distribuidores/Agentes/Aliados
- ✅ Crear tickets de soporte (Petición, Queja, Reclamo, Sugerencia)
- ✅ Ver historial de tickets propios
- ✅ Agregar comentarios y seguimiento
- ✅ Adjuntar archivos a los tickets
- ✅ Recibir notificaciones por email de cambios de estado
- ✅ Filtrar tickets por estado, prioridad y tipo

### Para Superadmins
- ✅ Dashboard completo con métricas de tickets
- ✅ Ver todos los tickets del sistema
- ✅ Cambiar estado y prioridad de tickets
- ✅ Asignar tickets a otros superadmins
- ✅ Crear y asignar tareas específicas
- ✅ Agregar comentarios internos (no visibles para usuarios)
- ✅ Marcar tickets como resueltos con explicación
- ✅ Ocultar tickets cerrados de la vista principal
- ✅ Sistema de notificaciones automáticas

## Estructura de Base de Datos

### Tablas Principales

#### `pqrs_tickets`
Tabla principal que almacena todos los tickets.

**Campos clave:**
- `ticket_number`: Número único generado automáticamente (formato: TKT-YYYY-XXXXXX)
- `tipo`: peticion, queja, reclamo, sugerencia
- `estado`: nuevo, en_proceso, pendiente, resuelto, cerrado
- `prioridad`: baja, media, alta, urgente
- `resolucion`: Texto de resolución cuando se marca como resuelto
- `oculto`: Permite ocultar tickets cerrados del dashboard

#### `pqrs_tasks`
Tareas asignadas a superadmins para gestionar tickets.

**Campos clave:**
- `ticket_id`: Referencia al ticket
- `asignado_a`: Superadmin asignado
- `asignado_por`: Quien asignó la tarea
- `estado`: pendiente, en_progreso, completada, cancelada

#### `pqrs_comments`
Historial de comentarios y cambios en el ticket.

**Campos clave:**
- `es_interno`: Si es true, solo visible para superadmins
- `tipo_cambio`: Tipo de cambio registrado (estado, prioridad, etc.)

#### `pqrs_attachments`
Archivos adjuntos a los tickets.

**Storage:** Bucket `pqrs-attachments` en Supabase Storage

## Flujo de Estados

```
nuevo → en_proceso → pendiente → resuelto → cerrado
         ↓              ↓           ↓
         ←──────────────┴───────────┘
```

- **Nuevo**: Ticket recién creado
- **En Proceso**: Superadmin está trabajando en el ticket
- **Pendiente**: Esperando información adicional del usuario o acción externa
- **Resuelto**: Problema solucionado, requiere explicación de resolución
- **Cerrado**: Ticket completamente cerrado (puede ocultarse)

## Sistema de Notificaciones

### Notificaciones Automáticas por Email

1. **Nuevo Ticket Creado**
   - Destinatarios: Todos los superadmins
   - Contenido: Detalles del ticket, prioridad, usuario que lo creó

2. **Cambio de Estado**
   - Destinatarios: Usuario que creó el ticket
   - Contenido: Estado anterior, nuevo estado, resolución (si aplica)

3. **Tarea Asignada**
   - Destinatarios: Superadmin asignado
   - Contenido: Detalles de la tarea, ticket relacionado

### Configuración de Email

El sistema está preparado para integrarse con servicios de email. Editar el archivo:
```
lib/email/pqrs-notifications.ts
```

Descomentar y configurar el servicio de email preferido (SendGrid, Resend, AWS SES, etc.)

## Rutas de la Aplicación

### Para Distribuidores/Agentes/Aliados
- `/distributor/pqrs` - Dashboard principal de tickets
- `/distributor/pqrs/[id]` - Detalle de un ticket específico

### Para Superadmins
- `/admin/pqrs` - Dashboard de gestión de todos los tickets
- `/admin/pqrs/[id]` - Gestión detallada de un ticket

## API Endpoints

### Tickets
- `GET /api/pqrs/tickets` - Listar tickets (con filtros)
- `POST /api/pqrs/tickets` - Crear nuevo ticket
- `GET /api/pqrs/tickets/[id]` - Obtener detalle de ticket
- `PATCH /api/pqrs/tickets/[id]` - Actualizar ticket (solo superadmins)

### Tareas
- `POST /api/pqrs/tasks` - Crear tarea (solo superadmins)
- `PATCH /api/pqrs/tasks` - Actualizar estado de tarea (solo superadmins)

### Comentarios
- `POST /api/pqrs/comments` - Agregar comentario

### Archivos
- `POST /api/pqrs/upload` - Subir archivo adjunto

## Permisos y Seguridad

### Row Level Security (RLS)

Todas las tablas tienen RLS habilitado con las siguientes políticas:

**Distribuidores/Agentes/Aliados:**
- Pueden crear tickets
- Solo ven sus propios tickets
- Pueden agregar comentarios a sus tickets
- Pueden subir archivos a sus tickets

**Superadmins:**
- Ven todos los tickets
- Pueden actualizar cualquier ticket
- Pueden crear y asignar tareas
- Pueden agregar comentarios internos
- Acceso completo a todos los archivos

## Componentes Principales

### Para Usuarios
- `CreateTicketForm` - Formulario de creación de tickets
- `TicketsList` - Lista de tickets con filtros
- `TicketDetail` - Vista detallada de un ticket

### Para Superadmins
- `AdminTicketsDashboard` - Dashboard con métricas y lista completa
- `AdminTicketManagement` - Gestión completa de un ticket individual

## Uso del Sistema

### Crear un Ticket (Distribuidor)

1. Navegar a "Soporte / PQRs" en el menú
2. Ir a la pestaña "Crear Nuevo Ticket"
3. Seleccionar tipo de solicitud
4. Completar asunto y descripción
5. Seleccionar prioridad
6. Opcionalmente adjuntar archivos
7. Enviar ticket

### Gestionar un Ticket (Superadmin)

1. Navegar a "Gestión de PQRs" en el menú admin
2. Ver dashboard con métricas y filtros
3. Hacer clic en "Gestionar" en el ticket deseado
4. Opciones disponibles:
   - Cambiar estado del ticket
   - Asignar a un superadmin
   - Crear tareas específicas
   - Agregar comentarios (públicos o internos)
   - Marcar como resuelto con explicación
   - Ocultar ticket cuando esté cerrado

## Próximas Mejoras Sugeridas

- [ ] Integración con servicio de email real (SendGrid/Resend)
- [ ] Notificaciones en tiempo real con WebSockets
- [ ] Sistema de priorización automática basado en palabras clave
- [ ] Reportes y analíticas de tickets
- [ ] Templates de respuestas predefinidas
- [ ] SLA (Service Level Agreement) tracking
- [ ] Integración con chat en vivo
- [ ] Encuestas de satisfacción post-resolución

## Soporte Técnico

Para dudas o problemas con el sistema de PQRs, contactar al equipo de desarrollo.
