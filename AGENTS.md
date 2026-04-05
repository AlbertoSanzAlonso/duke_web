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
- **Infraestructura:** Despliegue en Coolify con base de datos PostgreSQL en Supabase.
- **Media:** Almacenamiento en volumen persistente `/app/media`. Conversión automática a WebP en el modelo `Product`.

## 3. Guía de Estilo y UX (Crítico)
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

---
*Mantener la coherencia visual con la marca Duke Burger (Negros profundos, Rojos vibrantes, Tipografía Bebas Neue).*
