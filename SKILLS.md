# Skills del Proyecto Duke Burgers

Este repositorio utiliza el motor de agentes *Antigravity* y se apoya en las siguientes habilidades (Skills) para garantizar la calidad del código y la infraestructura.

## 1. web-design-guidelines (Vercel)
**Uso:** Auditoría de interfaz de usuario y experiencia de usuario (UX).
**Cuándo activarla:** 
- Al crear nuevas vistas o componentes.
- Al refactorizar el diseño para hacerlo más responsivo.
- Para asegurar la accesibilidad y el rendimiento web.
**Reglas Clave:**
- Usar fuentes legibles (como Inter o Roboto) y paletas de colores armónicas.
- Respetar espaciados y jerarquías visuales.
- Evitar placeholders; generar imágenes reales con IA si es necesario.
- **IMPORTANTE:** Forzar color de texto oscuro (`#333 !important`) en el panel admin para evitar invisibilidad por temas oscuros del sistema del usuario.

## 2. supabase-postgres-best-practices
**Uso:** Optimización de la base de datos PostgreSQL hospedada en Supabase.
**Cuándo activarla:**
- Al diseñar o modificar esquemas de tablas.
- Al escribir consultas complejas para el TPV o inventario.
- Para asegurar el uso correcto de índices y políticas RLS (Row Level Security).

## 3. Automatización de Medios (Procesamiento Interno)
**Funcionalidad:** Conversión automática a WebP.
- Implementada en `backend/api/models.py`.
- Todas las imágenes subidas al modelo `Product` se procesan para optimizar el peso sin perder calidad visual.

## 4. Gestión de Infraestructura (Coolify + Vercel)
**Estrategia:** 
- Despliegue continuo en Vercel (Front) y Coolify (Back).
- **Backend Stability:** Uso obligatorio de `WhiteNoiseMiddleware` y el diccionario `STORAGES` (Django 4.2+).
- **Static Storage:** Para máxima estabilidad en Docker, usar `StaticFilesStorage` en lugar de backends comprimidos si `collectstatic` es incierto.
- **Diagnostics:** Ante errores 500, usar `/api/setup-admin-super/` para sincronizar base de datos Supabase con el código.

## 5. delivery-pricing-standards (Lógica de Negocio)
... (anterior contenido)

## 6. UX de Datos y Presentación (Nuevo)
**Reglas:**
- **Multiline:** Siempre usar `white-space: pre-line` en React para campos `ingredients` y `description`.
- **Proporciones:** Modales desktop a `50vw` con imágenes en `aspect-ratio: 16/9`.
