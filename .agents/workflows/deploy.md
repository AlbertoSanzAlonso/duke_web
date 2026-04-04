---
description: Instrucciones y flujo de trabajo para el despliegue del proyecto (Frontend Vercel + Backend Coolify).
---

# Flujo de Despliegue Frontend & Backend

Este proyecto funciona bajo una arquitectura desacoplada donde el Frontend reside en servidor Serverless (Vercel) y el backend en un VPS propio (Coolify). 

### Pasos despliegue Frontend (Vercel)
1. Conectar este repositorio de GitHub a un nuevo proyecto en Vercel.
2. Ir a **Settings** > **Root Directory** y seleccionar `/frontend`.
3. Ir a **Environment Variables** y añadir la variable `VITE_API_URL` con el dominio puro del backend proporcionado en Coolify (ej: `https://api.tudominio.com/api`).
4. Vercel detectará automáticamente que es un proyecto de Vite y lanzará `npm run build`.

### Pasos despliegue Backend (Coolify)
1. En el Dashboard de Coolify, conectar un nuevo Web Service desde un Git Repository público/privado con este repo.
2. Seleccionar como **Base Directory**: `/backend`.
3. Validar de que entre las variables de entorno se encuentren:
    - `DATABASE_URL=postgres://...`
    - `SECRET_KEY=...`
    - `ALLOWED_HOSTS=*`
4. Nixpacks auto-compilará el proyecto Python a partir del `requirements.txt` y ejecutará Gunicorn gracias a nuestra configuración inyectada.

*Todos los cambios estáticos empujados a Git lanzarán despliegues cruzados si ambos entornos rastrean la rama main.*
