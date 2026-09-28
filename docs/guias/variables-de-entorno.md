---
sidebar_position: 2
title: Variables de entorno
---

# Variables de entorno

## Backend (`api/.env`)

### Servidor

| Variable | Requerida | Por defecto | Descripción |
|---|---|---|---|
| `PORT` | No | `3000` | Puerto del servidor local. Si no está definida y `NODE_ENV=production`, el pool asume entorno serverless |
| `NODE_ENV` | Sí en prod | — | Debe ser `production` en despliegue (desactiva los endpoints de depuración) |
| `TZ` | Recomendada | — | `America/Bogota` |
| `CORS_ORIGIN` | No | `*` | Orígenes permitidos separados por coma, sin espacios |

### Base de datos

| Variable | Descripción |
|---|---|
| `DATABASE_URL` | Cadena de conexión. Tiene precedencia sobre `DB_*` y activa SSL. En Supabase usa el puerto `5432` (conexión directa), no el pooler `6543` |
| `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASSWORD` | Conexión sin SSL para desarrollo local |
| `DB_MAX_CONNECTIONS` | Tamaño del pool en servidor Node (por defecto 10) |

### Autenticación

| Variable | Por defecto | Descripción |
|---|---|---|
| `JWT_SECRET` | — (**requerida**) | Firma de access tokens. Genera con `openssl rand -base64 32` |
| `JWT_EXPIRES_IN` | `8h` | Duración del access token |
| `JWT_REFRESH_SECRET` | `JWT_SECRET + '_refresh'` | Firma de refresh tokens. Usa uno distinto en producción |
| `JWT_REFRESH_EXPIRES_IN` | `30d` | Duración del refresh token |

### Supabase Storage

| Variable | Descripción |
|---|---|
| `SUPABASE_S3_ENDPOINT` | `https://<proyecto>.storage.supabase.co/storage/v1/s3` |
| `SUPABASE_S3_ACCESS_KEY` | Access Key ID |
| `SUPABASE_S3_SECRET_KEY` | Secret Access Key |
| `SUPABASE_S3_REGION` | Opcional (`auto`) |
| `SUPABASE_BUCKET` | Por defecto `product-images` |

### SIIGO

Las credenciales de SIIGO se guardan en la tabla `siigo_settings`, no en variables. Estas variables ajustan el envío de cotizaciones:

| Variable | Por defecto | Descripción |
|---|---|---|
| `SIIGO_DEFAULT_SELLER_ID` | — | Vendedor si el asesor no tiene `siigo_seller_id` |
| `SIIGO_QUOTE_DOC_TYPE_ID` | `24096` | Tipo de documento Cotización |
| `SIIGO_DEFAULT_TAX_ID` | `17085` | Impuesto por ítem (IVA 0 %) |
| `SIIGO_PAYMENT_TYPE_ID` | — | Forma de pago (se omite si no está) |
| `SIIGO_QUOTE_MAX_RETRIES` | `3` | Reintentos ante 429/5xx |
| `SIIGO_QUOTE_RETRY_BASE_MS` | `1000` | Espera base del backoff |

### Correo

| Variable | Descripción |
|---|---|
| `SMTP_HOST`, `SMTP_PORT`, `SMTP_SECURE`, `SMTP_USER`, `SMTP_PASS`, `SMTP_FROM` | Servidor SMTP |
| `ADMIN_NOTIFICATION_EMAIL` | Destinatario de avisos de nuevos registros |
| `APP_URL` | URL pública del frontend, para enlaces en correos |

## Frontend (`.env` en la raíz)

| Variable | Descripción |
|---|---|
| `VITE_API_URL` | URL base de la API **incluyendo `/api`**. Local: `http://localhost:3000/api`. En Vercel con API en el mismo dominio: `https://<app>.vercel.app/api` |
| `VITE_GOOGLE_MAPS_API_KEY` | Clave de Google Maps (Maps JavaScript API + Geocoding). Restríngela por dominio |

:::caution[Variables de Vite]
Las variables `VITE_*` se incrustan en el bundle durante el build. Cambiarlas exige volver a construir y desplegar el frontend. Nunca pongas secretos en ellas.
:::
