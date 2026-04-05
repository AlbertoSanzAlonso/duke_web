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
- Persistencia de archivos locales mediante volúmenes en Coolify.
- Conexión cifrada a base de datos externa (Supabase).
