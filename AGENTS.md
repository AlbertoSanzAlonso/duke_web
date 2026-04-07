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
- **Puerto de Servicio:** El contenedor escucha en el **puerto 3000**.
- **Motor de Servidor:** Utiliza `gunicorn` con el worker `gthread` (o `uvicorn` si se despliega como ASGI).
- **Comando de Inicio Recomendado:** `gunicorn -k gthread --threads 12 --workers 2 --bind 0.0.0.0:3000 --timeout 120 config.wsgi:application`.
- **Estatícos:** Se utiliza **Whitenoise** (`whitenoise.middleware.WhiteNoiseMiddleware`) para servir archivos estáticos. 
- **Almacenamiento (Django 4.2+):** ES OBLIGATORIO usar el diccionario `STORAGES` en `settings.py` en lugar de las variables antiguas. Configurar `staticfiles` con `StaticFilesStorage` para mayor estabilidad en Docker.
- **Diagnóstico:** Ante errores 500 tras un despliegue, visitar `/api/setup-admin-super/` para forzar migraciones en la base de datos de Supabase.

## 3. Streaming, Concurrencia y Caché (Crítico)
- **Async Views**: Todos los views de streaming (SSE) como `OrderStreamView` **DEBEN** ser `async def`.
- **Iteradores Asíncronos**: Usar `async for obj in queryset` directamente (Django 4.2+) o `.aiter()` en versiones anteriores para evitar bloqueos.
- **Redis Caching**: Decorar vistas de lectura intensas (ej. Carta, Galería) con `@method_decorator(cache_page(...))`.
- **Resiliencia**: La configuración de caché **SIEMPRE** debe llevar `IGNORE_EXCEPTIONS: True` para que el sistema no falle si Redis cae (Error 111).
- **Workers**: Desplegar con `gthread` workers en Gunicorn (`--threads 12`) para permitir conexiones concurrentes de streaming.
- **Buffering**: Establecer el header `X-Accel-Buffering: no` en respuestas de streaming.
- **Frontend Lazy Loading**: Toda la navegación del frontend DEBE implementarse con `React.lazy` y `Suspense` utilizando el componente `<LoadingScreen />` de la marca como fallback.

## 4. Acciones Masivas y TPV
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
- **Notificaciones:** PROHIBIDO usar `alert()` del navegador. Usar el componente `<Toast />` personalizado.
- **Loading:** Usar el componente `<LoadingScreen />` que incluye el logo de la marca en lugar de mensajes de texto planos.
- **Accesibilidad Admin:** Forzar color de texto oscuro (`#333 !important`) en contenedores claros para evitar conflictos con el modo oscuro del navegador.
- **Responsividad:** 
  - La sección de Contabilidad e Inventario debe usar layouts verticales apilados en móviles.
  - El grid de la carta pública debe usar `minmax(min(100%, 320px), 1fr)` para evitar scroll horizontal.

## 4. Skills Instaladas
- `django-rest-best-practices`: Estabilidad y consistencia del backend.
- `form-design-best-practices`: Formularios premium y usables.
- `supabase-postgres-best-practices`: Optimización de BBDD.
- `web-design-guidelines`: Estándares de calidad visual de Vercel/Next.
- `seo-audit`: Auditoría de posicionamiento orgánico.
- `responsive-design`: Asegurar adaptabilidad total.
- `delivery-pricing-standards`: Lógica de precios por cercanía y validación GPS.

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
- **Contabilidad:** El formulario de compra/gastos debe usar incrementos de `$100`.
- **Base de Datos:** El proyecto usa Supabase en producción. Para crear usuarios u operativos de mantenimiento sobre la BD, se debe asegurar que se ejecuten contra la instancia de Supabase (PostgreSQL) y no la base de datos local de desarrollo.
- **Cierre de Sesión:** El sidebar incluye un botón de "Cerrar Sesión" que limpia el `localStorage` y redirige al login.

---
*Mantener la coherencia visual con la marca Duke Burger (Negros profundos, Rojos vibrantes, Tipografía Bebas Neue).*
