# Reparto de Infraestructura e Instrucciones para Agentes AI

Este proyecto se divide en dos entornos de despliegue claramente separados para el sistema de gestión de Duke Burgers.

## 1. Frontend (Vercel)
- **Ruta principal:** `/frontend`
- **Framework:** React / Vite
- **Variables de Entorno vitales:** 
  - `VITE_API_URL`: Debe apuntar al dominio proporcionado por Coolify (ej. `https://api.dukeburger-sj.com`). 
    **CRÍTICO:** NO debe incluir el sufijo `/api/`, ya que el cliente API lo añade automáticamente.
- **Configuración de Vercel:** El *Root Directory* configurado en Vercel debe ser la carpeta `frontend`.

## 2. Backend (Coolify)
- **Ruta principal:** `/backend`
- **Framework:** Django + Django REST Framework
- **Base de Datos:** PostgreSQL alojada en **Supabase (Región Europa)**.
- **Configuración de Imágenes:**
  - El sistema convierte automáticamente todas las imágenes subidas al modelo `Product` a formato **WebP** para optimizar el rendimiento.
  - Las imágenes se almacenan en un **Volumen Persistente de Coolify** mapeado a `/app/media`. Es necesario configurar el Storage en la interfaz de Coolify para evitar la pérdida de fotos entre despliegues.
- **Configuración de Red:**
  - `CORS_ALLOW_ALL_ORIGINS = True` permite la comunicación con el frontend.
  - `SECURE_PROXY_SSL_HEADER` y `USE_X_FORWARDED_HOST` están habilitados para garantizar que las URLs generadas sean siempre HTTPS mediante el proxy de Coolify.
- **Variables de Entorno necesarias:**
  - `DATABASE_URL`: Cadena de conexión de Supabase.
  - `DEBUG`: `False` en producción.
  - `ALLOWED_HOSTS`: Lista de dominios permitidos (ej. `api.dukeburger-sj.com,dukeburger-sj.com`).

## 3. Reglas de Diseño de Panel (Admin)
- **Visibilidad del Texto:** Es OBLIGATORIO que todos los textos del panel de administración (`.admin-content`) tengan un color oscuro explícito (ej. `#333 !important`). Esto evita que si el usuario tiene activado el "Modo Oscuro" en su sistema/navegador, las letras se pongan blancas sobre fondo claro y sean invisibles.
- **Formularios:** Los `input`, `select` y `textarea` deben tener fondo blanco y texto oscuro siempre.

## 3. Skills Installadas
- `django-rest-best-practices`: Para asegurar la estabilidad, migraciones correctas y consistencia en el backend.
- `supabase-postgres-best-practices`: Para optimizaciones de base de datos.
- `web-design-guidelines`: Para asegurar que la UI se mantenga moderna, usable y bajo estándares de alta calidad de Vercel (especialmente en el rediseño de fichas y navegación).

---
*El Agente no debe romper esta separación. Asegurarse de realizar despliegues parciales según carpeta.*
