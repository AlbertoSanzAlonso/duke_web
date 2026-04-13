# Reparto de Infraestructura e Instrucciones para Agentes AI

Este proyecto se divide en dos entornos de despliegue claramente separados para el sistema de gestión de Duke Burgers.

## 1. Frontend (Vercel)
- **Ruta principal:** `/frontend`
- **Framework:** React + Vite.
- **Estilo:** Vanilla CSS (App.css / index.css).
- **Variables de Entorno:**
  - `VITE_API_URL`: URL base de la API (ej. `https://api.dukeburger-sj.com`). El cliente añade automáticamente `/api/`.
- **Navegación:** El logo de Duke en el sidebar de administración enlaza siempre a la raíz pública `/`.

## 2. Backend (Coolify)
- **Ruta principal:** `/backend`
- **Framework:** Django + DRF (Django REST Framework).
- **Arquitectura Modular (NUEVO):** El backend se organiza en paquetes especializados para máxima escalabilidad:
  - `api/models/`: Modelos divididos por dominio (menu, inventory, sales, accounting, etc).
  - `api/views/`: Controladores especializados y endpoints de streaming.
  - `api/serializers/`: Transformación de datos aislada por contexto.
- **Puerto de Servicio:** El contenedor escucha en el **puerto 3000**.
- **Variables de Envío Críticas:**
  - `GROQ_API_KEY`: Requerida para **Duke Assist** (IA).
- **Motor de Servidor:** Utiliza `gunicorn` con el worker `gthread` (Threads: 12, Workers: 2).
- **Estatícos:** Se utiliza **Whitenoise** (`whitenoise.middleware.WhiteNoiseMiddleware`).
- **Almacenamiento (Django 4.2+):** ES OBLIGATORIO usar el diccionario `STORAGES` en `settings.py` para `staticfiles` con `StaticFilesStorage`.

## 3. Streaming, Concurrencia y Caché (Crítico)
- **SSE Resilience**: Las conexiones `EventSource` deben incluir:
  - Validación de token preventiva en frontend.
  - Retorno de `HttpResponse(status=401)` en backend.
  - **Backoff Exponencial**: Reintento progresivo en frontend (5s, 10s, 20s... máx 30s).
  - **Indicador de Salud**: Punto de estado reactivo en el sidebar (Verde/Amarillo/Rojo).
  - **Heartbeat**: Envío obligatorio de `: ping` y heartbeats JSON cada 15s o menos para evitar timeouts de proxies.
- **Async Views**: Todos los views de streaming (SSE) como `OrderStreamView` **DEBEN** ser `async def`.
- **Iteradores Asíncronos**: Usar `async for obj in queryset` directamente (Django 4.2+) o `.aiter()` en versiones anteriores.
- **Workers**: Desplegar con `gthread` workers en Gunicorn (`--threads 12`) para permitir conexiones persistentes de streaming.
- **Buffering**: Establecer el header `X-Accel-Buffering: no` y `Cache-Control: no-cache` específicamente en la respuesta de streaming.
- **Frontend Lazy Loading**: Toda la navegación del frontend DEBE implementarse con `React.lazy` y `Suspense` utilizando el componente `<LoadingScreen />` de la marca como fallback.

## 4. Performance y Optimización de Estado (Crítico)
- **Localización de Estado**: Evitar re-renderizados globales. Componentes de alta frecuencia (como relojes o timers) deben estar encapsulados en componentes hijos dedicados (ej. `DigitalClock.jsx`).
- **Memoización**: Usar `useMemo` obligatoriamente para cálculos financieros (balances, totales), filtros de búsqueda de gran volumen y extracción de categorías.
- **Transiciones**: Implementar `useTransition` en todos los inputs de búsqueda y filtros de periodo para mantener la fluidez del teclado mientras se procesan los datos.
- **Memorización de Handlers**: En el TPV y Contabilidad, envolver handlers de manipulación de datos en `useCallback` para evitar roturas de referencia en componentes hijos.

## 5. Acciones Masivas y TPV
- **Bulk Actions**: Las operaciones repetitivas (cobrar tickets, eliminar múltiples registros) deben implementarse mediante endpoints de tipo `@action(detail=False, methods=['post'], url_path='bulk-actions')` para optimizar el tráfico de red.
- **Selección Múltiple**: Los listados administrativos deben permitir selección múltiple con barras de herramientas contextuales y animaciones de entrada (`slideIn`).

## 5. Guía de Estilo y UX (Crítico)
... (rest of the content remains)
- **Git Mandatory:** Para cualquier cambio en producción (Coolify), DEBES realizar un `push` a la rama `main` de GitHub. Coolify ignora los archivos locales que no se han empujado al repositorio.
- **S3 Management:** Si se activa `USE_S3=True`, deben configurarse las variables `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY` y `AWS_S3_ENDPOINT_URL` en el panel de Coolify para evitar caídas del servidor.
... (rest of labels)

---
*Mantener la coherencia visual con la marca Duke Burger (Negros profundos, Rojos vibrantes, Tipografía Bebas Neue).*
- **Moneda:** Todos los precios deben mostrarse en **Pesos Argentinos** utilizando el locale `es-AR` (ej. `$12.900`). Evitar el formato `12900.00`.
- **Notificaciones y Avisos:** PROHIBIDO usar `alert()` o `confirm()` del navegador. Todos los avisos, errores y confirmaciones deben gestionarse a través del componente `<Toast />` personalizado o modales integrados en la app para mantener la experiencia de usuario dentro de la marca.
- **Loading:** Usar el componente `<LoadingScreen />` que incluye el logo de la marca en lugar de mensajes de texto planos.
- **Accesibilidad Admin:** Forzar color de texto oscuro (#333 !important) en contenedores claros para evitar conflictos con el modo oscuro del navegador, pero asegurar que los botones con fondo oscuro (ej. .btn-dark, .add-movement-btn, .checkout-btn) mantengan su texto blanco mediante selectores específicos o eliminando el !important global de los botones.
- **Responsividad:** 
  - La sección de Contabilidad e Inventario DEBE usar **renderizado dual**: tabla normal en desktop (`.accounting-desktop-only`) y tarjetas `<div>` nativas en móvil (`.accounting-mobile-only`). NUNCA usar transformaciones CSS de tabla (`display: block` en `<td>`) porque colapsan en Safari/Chrome móvil.
  - El grid de la carta pública debe usar `minmax(min(100%, 320px), 1fr)` para evitar scroll horizontal.
  - **Paginación**: Todos los listados administrativos (Contabilidad, Compras, Pedidos) deben paginar cada 10 elementos estrictamente en móvil para facilitar el scroll.
  - **AI Assist**: El chat nunca debe auto-abrirse en móviles por defecto. Debe soportar `white-space: pre-wrap`.
  - **Categorías TPV (móvil)**: El contenedor `.pos-left-content` NUNCA debe tener `overflow: hidden`. Usar `min-width: 0` para contener el flex sin recortar el scroll horizontal de las categorías.


## 5. Logística y Seguridad (Nuevas Reglas)
- **Cálculo de Envío:** 
  - Si distancia < 1km: Cobrar `delivery_base_price`.
  - Si distancia >= 1km: Cobrar `distancia * delivery_km_price`.
  - Redondeo: Siempre redondear al siguiente múltiple de $100.
- **Blindaje de Pedidos:** El mensaje de WhatsApp NUNCA debe incluir el total. Debe incluir un link a `/ticket/:id` que es la única fuente de verdad inalterable.
- **Geolocalización:** El sistema está optimizado para San Juan, Argentina. Usa Nominatim con prefijos locales (O/E/N/S).
- **Timezone:** Forzar siempre `America/Argentina/Buenos_Aires` para evitar desfases en tickets y reportes.

## 6. Seguridad y Gestión Administrativa
- **Login:** Acceso vía `/login` usando `TokenAuthentication` de DRF.
- **Contabilidad y Proveedores**: 
  - Ambos módulos deben incluir selector de periodo **TODOS / Diario / Semanal / Mensual** — el valor por defecto es **`'all'`** (Todos) para que en móvil el historial sea visible desde el primer momento.
  - El selector debe tener siempre el botón "TODOS" resaltado al cargar (sin filtro activo).
  - Incluir filtros avanzados de rango "Desde/Hasta" con botón de limpiar.
  - El formulario de compra/gastos debe usar incrementos de `$100`.
- **Base de Datos:** El proyecto usa Supabase en producción. Para crear usuarios u operativos de mantenimiento sobre la BD, se debe asegurar que se ejecuten contra la instancia de Supabase (PostgreSQL) y no la base de datos local de desarrollo.
- **Cierre de Sesión:** El sidebar incluye un botón de "Cerrar Sesión" que limpia el `localStorage` y redirige al login.

## 7. Nuevas Funcionalidades UI/UX
- **Scroll Indicator**: El menú incluye un indicador visual (flecha flotante) en "Nuestra Carta" con desplazamiento suave para mejorar el descubrimiento de categorías.
- **Botón de Contacto Dinámico**: Se implementó un FAB de contacto (WhatsApp/Llamada) que solo aparece cuando el carrito está vacío, alternándose con el botón del carrito según el estado del pedido.
- **Edición de Imágenes**: El administrador permite recortar imágenes ya existentes en el catálogo mediante `ImageCropper` con soporte Cross-Origin para S3/Supabase.
- **Sincronización Cocina-TPV**: Al marcar un pedido como "Recogido" en el monitor de cocina, **SOLAMENTE** se marca como entregado (`is_delivered=True`). La **Caja (TPV)** es la única autoridad que puede cambiar el estado a `COMPLETED` (cobrando el ticket) para registrarlo en el historial financiero y descontar el stock. De este modo se evitan deducciones dobles o errores operativos entre agentes.
- **Persistencia SSE**: Las conexiones de streaming deben ser independientes del estado de navegación local (tabs) para evitar micro-cortos en la recepción de pedidos.
- **Refresco Silencioso (SSE)**: Cuando un evento SSE dispara un `loadData()`, SIEMPRE usar el parámetro `silent=true` para evitar el parpadeo del `<LoadingScreen />`. El patrón es: `loadData(silent = false) { if (!silent) setLoading(true); ... finally { if (!silent) setLoading(false); } }`. Los handlers de SSE llaman `loadData(true)`.

## 8. Pitfalls Conocidos (CSS/React)
- **`overflow: hidden` en `.admin-card`**: NUNCA usar `overflow: hidden` en el contenedor principal de tarjetas admin. En móvil recorta los elementos renderizados, haciéndolos invisibles. Usar `overflow: visible`.
- **`!important` en estilos inline React**: Los estilos inline de React NO admiten `!important`. `color: '#fff !important'` es ignorado — el motor de estilo lo descarta silenciosamente. Usar siempre `color: '#fff'` y resolver conflictos a nivel CSS.
- **Transformaciones CSS de tabla**: Cambiar `display: block` en `<table>/<tbody>/<tr>/<td>` para layout responsive es inestable en Safari/Chrome mobile. La fila colapsa a altura 0. Usar **renderizado dual JSX** en su lugar.

---
*Mantener la coherencia visual con la marca Duke Burger (Negros profundos, Rojos vibrantes, Tipografía Bebas Neue).*
