# Configuración Cross-Domain Tracking

## ✅ Ya implementado en el código

- GA4 configurado con `linker` para: `mesanova.co`, `alumaronline.com`, `checkout.wompi.co`
- Meta Pixel ID: `712873079435876`
- GA4 Measurement ID: `G-G6YE90BK9L`
- CrossDomainLinker activo para decorar enlaces automáticamente

---

## 📋 Configuración en Google Analytics 4

### 1. Configurar dominios de referencia no deseados
Esto evita que Wompi aparezca como fuente de tráfico:

1. Ve a **Admin** → **Data Streams** → Selecciona tu stream web
2. Click en **Configure tag settings**
3. Click en **Show more** → **List unwanted referrals**
4. Agrega estos dominios:
   ```
   checkout.wompi.co
   wompi.co
   ```
5. Guarda

### 2. Verificar Data Stream
1. En **Admin** → **Data Streams**
2. Asegúrate de tener configurado:
   - **Website URL:** `https://mesanova.co`
   - **Enhanced measurement:** Activado
   - **Ecommerce events:** Activado

### 3. Configurar conversiones clave
1. Ve a **Admin** → **Events**
2. Marca como conversión:
   - `purchase` ✓
   - `begin_checkout` ✓
   - `add_to_cart` (opcional)

### 4. Verificar en tiempo real
1. Ve a **Reports** → **Realtime**
2. Abre `mesanova.co` en tu navegador
3. Deberías ver tu sesión activa
4. Haz una compra de prueba y verifica que aparezca el evento `purchase`

---

## 📋 Configuración en Meta Business Manager

### 1. Agregar dominio mesanova.co
1. Ve a **Business Settings** → **Brand Safety** → **Domains**
2. Click **Add** → Agrega `mesanova.co`
3. Verifica el dominio usando uno de estos métodos:
   - **Meta tag:** Agrega el meta tag que te dan en el `<head>` de tu sitio
   - **DNS TXT:** Agrega un registro TXT en tu DNS
   - **Archivo HTML:** Sube el archivo que te dan a la raíz de tu sitio

### 2. Configurar el Pixel para múltiples dominios
1. Ve a **Events Manager** → Selecciona tu Pixel (`712873079435876`)
2. Click en **Settings**
3. En **Domains**, agrega:
   ```
   mesanova.co
   alumaronline.com
   ```

### 3. Configurar Aggregated Event Measurement (AEM)
Esto es crítico para iOS 14.5+ y privacidad:

1. En **Events Manager** → **Aggregated Event Measurement**
2. Click **Configure Web Events**
3. Selecciona dominio: `mesanova.co`
4. Prioriza eventos (máximo 8):
   1. **Purchase** (prioridad 1) ⭐
   2. **InitiateCheckout** (prioridad 2)
   3. **AddToCart** (prioridad 3)
   4. **ViewContent** (prioridad 4)
   5. **PageView** (prioridad 5)

### 4. Excluir dominios de referencia
1. En **Events Manager** → **Settings** → **Traffic Permissions**
2. En **Referrer Domain Filtering**, agrega a la lista de exclusión:
   ```
   checkout.wompi.co
   wompi.co
   ```

### 5. Verificar eventos en tiempo real
1. Instala **Meta Pixel Helper** (extensión de Chrome)
2. Abre `mesanova.co`
3. Verifica que el Pixel se cargue correctamente (ícono verde)
4. Ve a **Events Manager** → **Test Events**
5. Ingresa tu navegador y verifica que lleguen:
   - `PageView`
   - `ViewContent` (al ver un producto)
   - `AddToCart` (al agregar al carrito)
   - `InitiateCheckout` (al ir al checkout)
   - `Purchase` (en la página de confirmación)

---

## 🧪 Cómo probar que funciona

### Test 1: Flujo completo con Wompi
1. Abre `mesanova.co` en modo incógnito
2. Navega → Agrega producto → Checkout → Paga con Wompi → Vuelve a confirmación
3. En **GA4 Realtime**, verifica:
   - Session source: NO debe ser "wompi / referral"
   - Debe mantener la fuente original (ej: "google / organic", "direct / none")
   - Evento `purchase` debe aparecer

### Test 2: Cross-domain entre alumaronline.com y mesanova.co
1. Abre `alumaronline.com`
2. Click en un enlace que vaya a `mesanova.co`
3. En GA4, la sesión debe continuar (no debe crear nueva sesión)
4. El parámetro `_gl` debe aparecer en la URL (ej: `?_gl=1*abc123...`)

### Test 3: Meta Pixel
1. Con **Pixel Helper** activo, navega por el sitio
2. Verifica que todos los eventos se disparen
3. En **Events Manager** → **Test Events**, confirma que lleguen los eventos
4. Haz una compra de prueba y verifica que `Purchase` llegue con:
   - `value`: monto correcto
   - `currency`: COP
   - `order_id`: ID de la orden

---

## 🚨 Problemas comunes y soluciones

### Problema: Wompi aparece como fuente de tráfico
**Solución:** Verifica que agregaste `checkout.wompi.co` a "unwanted referrals" en GA4

### Problema: Conversiones no se atribuyen correctamente
**Solución:** 
- Verifica que el parámetro `_gl` se pase en la URL de retorno de Wompi
- Asegúrate de que la página de confirmación dispare el evento `purchase` DESPUÉS de que la página cargue completamente

### Problema: Meta Pixel no dispara Purchase
**Solución:**
- Verifica en la consola del navegador si hay errores
- Confirma que `fbq` esté definido: `console.log(typeof fbq)`
- Verifica que el evento se dispare: abre la consola y busca "Purchase"

### Problema: Sesiones duplicadas entre dominios
**Solución:**
- Verifica que `linker.domains` incluya todos los dominios
- Asegúrate de que los enlaces entre dominios incluyan el parámetro `_gl`

---

## 📊 Métricas clave a monitorear

### En GA4:
- **Acquisition** → **Traffic acquisition**: Verifica que las fuentes sean correctas
- **Engagement** → **Events**: Monitorea `purchase`, `begin_checkout`, `add_to_cart`
- **Monetization** → **Ecommerce purchases**: Revisa ingresos y transacciones

### En Meta:
- **Events Manager** → **Overview**: Verifica volumen de eventos
- **Attribution** → **Conversions**: Monitorea atribución de compras
- **Ads Manager**: Verifica que las conversiones se reporten en tus campañas

---

## ✅ Checklist final

- [ ] Dominios agregados a "unwanted referrals" en GA4
- [ ] `mesanova.co` verificado en Meta Business Manager
- [ ] AEM configurado con `Purchase` como prioridad 1
- [ ] Pixel Helper muestra ícono verde en `mesanova.co`
- [ ] Test de compra completo: eventos llegan a GA4 y Meta
- [ ] Fuente de tráfico NO es "wompi / referral"
- [ ] Cross-domain tracking funciona entre `alumaronline.com` y `mesanova.co`

---

## 🔗 Enlaces útiles

- [GA4 Cross-domain tracking](https://support.google.com/analytics/answer/10071811)
- [Meta Pixel Setup](https://www.facebook.com/business/help/952192354843755)
- [Meta AEM](https://www.facebook.com/business/help/331612538028890)
- [Wompi Docs](https://docs.wompi.co/)
