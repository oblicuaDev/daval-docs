---
sidebar_position: 3
title: Despliegue
---

# Despliegue

Hay dos formas de desplegar. La configuración actual del repositorio (`vercel.json`) usa la opción A.

## Opción A: todo en Vercel (recomendada)

Frontend estático y API como función serverless en el mismo dominio.

```json title="vercel.json"
{
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "functions": { "api/index.js": { "maxDuration": 30, "memory": 512 } },
  "rewrites": [
    { "source": "/api/(.*)", "destination": "/api" },
    { "source": "/(.*)", "destination": "/index.html" }
  ]
}
```

Pasos:

1. Importa el repositorio en Vercel (detecta Vite).
2. Configura las variables del backend y del frontend en **Settings → Environment Variables** (ver [Variables de entorno](./variables-de-entorno.md)). Como comparten dominio:
   - `VITE_API_URL=https://<app>.vercel.app/api`
   - `CORS_ORIGIN` puede quedar vacío o con el mismo dominio.
   - `NODE_ENV=production` y **no** definas `PORT` (así el pool usa 2 conexiones).
3. Despliega y verifica `https://<app>.vercel.app/api/health`.

Limitaciones del modo serverless:

- Cada invocación dura como máximo 30 s. La sincronización de productos de SIIGO y los correos que se envían después de responder pueden cortarse.
- No hay disco persistente: las imágenes deben ir a Supabase Storage.

## Opción B: frontend en Vercel + API en Railway o Render

La API corre como proceso Node persistente (`node api/src/index.js`). Recomendado si la sincronización de SIIGO tarda más de 30 s.

| Plataforma | Archivo | Notas |
|---|---|---|
| Railway | `railway.toml` | Build `npm install --prefix api`, start `node api/src/index.js` |
| Render | `render.yaml` | `rootDir: api`, start `node src/index.js`, `NODE_ENV=production`, `TZ=America/Bogota` |

:::warning[Ruta de healthcheck]
`railway.toml` y `render.yaml` apuntan a `/health`, pero la API expone el endpoint en **`/api/health`**. Actualiza `healthcheckPath` / `healthCheckPath` a `/api/health` o el healthcheck fallará.
:::

En el frontend configura `VITE_API_URL=https://<api>/api` y en la API `CORS_ORIGIN=https://<app>.vercel.app`.

## Base de datos (Supabase)

1. Crea el proyecto y copia la cadena de conexión en modo **Session / directa (puerto 5432)**.
2. Define `DATABASE_URL` y corre `npm run migrate` desde tu máquina (lee `api/.env`).
3. Deja RLS deshabilitado: la API controla el acceso.
4. Crea el bucket `product-images` como **público** y genera las claves S3 (Storage → S3 Connection).

## Checklist

- [ ] `NODE_ENV=production`
- [ ] `JWT_SECRET` y `JWT_REFRESH_SECRET` robustos y distintos
- [ ] `DATABASE_URL` válida y migraciones aplicadas
- [ ] Claves S3 de Supabase y bucket público
- [ ] `VITE_API_URL` apunta a `/api` del backend correcto
- [ ] `CORS_ORIGIN` incluye el dominio del frontend (si están en dominios distintos)
- [ ] SMTP y `ADMIN_NOTIFICATION_EMAIL` si se quieren correos
- [ ] Credenciales SIIGO cargadas desde `/admin/integraciones` y `test-connection` OK
- [ ] `siigo_seller_id` en los asesores o `SIIGO_DEFAULT_SELLER_ID`
- [ ] `GET /api/health` responde `db: connected`
