# Reparto de Infraestructura e Instrucciones para Agentes AI

Este proyecto se divide en dos entornos de despliegue claramente separados:

1. **Frontend (Vercel)**
   - **Ruta principal:** `/frontend`
   - **Framework:** React / Vite
   - **Variables de Entorno vitales:** `VITE_API_URL` debe apuntar al dominio proporcionado por Coolify, siempre con protocolo `https://`.
   - **Configuración de Vercel:** Es crítico que el *Root Directory* configurado en Vercel sea la carpeta `frontend`.

2. **Backend (Coolify)**
   - **Ruta principal:** `/backend`
   - **Framework:** Django + Django REST Framework
   - **Base de Datos:** PostgreSQL en Supabase.
   - **Configuración Básica:** `CORS_ALLOW_ALL_ORIGINS = True` en `settings.py` permite que el dominio de Vercel se comunique sin bloqueos de seguridad del navegador. Necesita variables de entorno como `DATABASE_URL` instanciadas correctamente en Coolify.

*El Agente no debe romper esta separación. Asegurarse de realizar despliegues parciales según carpeta.*
