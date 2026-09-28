---
sidebar_position: 2
title: Backend (API Express)
---

# Backend

El backend vive en `api/` y es un proyecto Node independiente (`"type": "module"`, ESM).

## Puntos de entrada

| Archivo | Uso |
|---|---|
| `api/src/app.js` | Crea la app Express, registra middlewares y monta routers. No escucha puertos. |
| `api/src/index.js` | Servidor local: `app.listen(PORT)`, calienta el pool y resetea syncs colgados. |
| `api/index.js` | Entrada serverless para Vercel: `export default app`. |

## Pipeline de una petición

```text
cors (CORS_ORIGIN) → express.json({ limit: '2mb' }) → /uploads (estático, dev)
  → reset de sync colgado (solo 1ª petición del proceso)
  → router (/api/...)
      → requireAuth / optionalAuth → requireRole(...)
      → asyncHandler(handler)   ← Zod.parse, queries, lib/*
  → notFound (404)
  → errorHandler
```

## Montaje de rutas

Todas las rutas cuelgan de `/api` (necesario para el rewrite de Vercel):

| Prefijo | Router | Archivo |
|---|---|---|
| `/api/health` | inline | `app.js` |
| `/api/auth` | `authRouter` | `routes/auth.js` |
| `/api/products` | `productsRouter` | `routes/products.js` |
| `/api/quotations` | `quotationsRouter` | `routes/quotations.js` |
| `/api/routes` | `routesRouter` | `routes/routes.js` |
| `/api/stats` | `adminRouter.stats` | `routes/admin.js` |
| `/api/categories` | `adminRouter.categories` | `routes/admin.js` |
| `/api/price-lists` | `adminRouter.priceLists` | `routes/admin.js` |
| `/api/companies` | `adminRouter.companies` | `routes/admin.js` |
| `/api/promotions` | `adminRouter.promotions` | `routes/admin.js` |
| `/api/users` | `adminRouter.users` | `routes/admin.js` |
| `/api/advisor` | `advisorRouter` | `routes/advisor.js` |
| `/api/my-company` | `myCompanyRouter` | `routes/myCompany.js` |
| `/api/integrations/siigo` | `siigoRouter` | `routes/siigo.js` |

## Middlewares

### Autenticación (`middleware/auth.js`)

| Función | Comportamiento |
|---|---|
| `requireAuth` | Exige `Authorization: Bearer <token>`. Sin token → `401 UNAUTHENTICATED`; token inválido o vencido → `401 INVALID_TOKEN`. Deja el payload en `req.user`. |
| `optionalAuth` | Si hay token válido llena `req.user`; si no, sigue sin error. Se usa en endpoints de auto-registro. |
| `requireRole(...roles)` | `403 FORBIDDEN` si `req.user.role` no está en la lista. |
| `signToken` | Access token con `{ sub, role, email }`, expira en `JWT_EXPIRES_IN` (8h por defecto). |
| `signRefreshToken` | Refresh token con `{ sub }`, firmado con `JWT_REFRESH_SECRET` (o `JWT_SECRET + '_refresh'`), expira en `JWT_REFRESH_EXPIRES_IN` (30d). |

### Errores (`middleware/error.js`)

- `ApiError(status, code, message, details?)` es la excepción de negocio.
- `errorHandler` traduce:
  - `ZodError` → `400 { error: 'VALIDATION_ERROR', message, details: err.flatten() }`
  - `ApiError` → `status { error: code, message, details? }`
  - cualquier otro → `500 { error: 'INTERNAL' }` y lo registra en consola.
- `notFound` → `404 { error: 'NOT_FOUND', message: 'Route not found' }`.

### Uploads (`middleware/upload.js`)

- Multer con **almacenamiento en memoria** (compatible con serverless).
- Campo del formulario: `image`. Un solo archivo, máximo **5 MB**.
- Tipos permitidos: JPEG, PNG, WebP, GIF.
- Errores: `FILE_TOO_LARGE`, `INVALID_MIME`, `UNEXPECTED_FILE` (todos `400`).
- `generateFilename` crea un nombre aleatorio de 32 caracteres hex conservando la extensión.

### `asyncHandler` (`lib/validate.js`)

Envuelve handlers `async` para que cualquier excepción llegue a `errorHandler` sin `try/catch` manual.

## Acceso a datos (`config/db.js`)

- `pg.Pool` con configuración según entorno:

| Entorno | `max` | `idleTimeoutMillis` |
|---|---|---|
| Serverless (`NODE_ENV=production` sin `PORT`) | 2 | 1 000 |
| Servidor Node | `DB_MAX_CONNECTIONS` o 10 | 30 000 |

- Si existe `DATABASE_URL` se usa con SSL (`rejectUnauthorized: false`). Si no, se usan `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASSWORD` sin SSL.
- Exporta `query(text, params)` (loguea la duración en desarrollo) y `getClient()` para transacciones manuales (el llamador hace `release()`).
- Los errores de clientes inactivos se registran pero **no** tumban el proceso.

## Librerías de negocio (`lib/`)

| Módulo | Responsabilidad |
|---|---|
| `pricing.js` | `resolvePrices({ productIds, priceListId, clientId })` → precio base, de lista, de promoción y final por producto. Ver [Reglas de negocio](./reglas-de-negocio.md#precios). |
| `cutoff.js` | `computeRouteCutoff(route)` → ventana de corte en `America/Bogota` con Luxon. |
| `mailer.js` | Correos transaccionales con Nodemailer. Ver [Correos](../integraciones/correos.md). |
| `storage.js` | Subida/borrado de imágenes en Supabase Storage vía S3. Ver [Almacenamiento](../integraciones/almacenamiento.md). |
| `siigo/client.js` | Cliente HTTP de SIIGO con token cacheado en BD y reintento en 401. |
| `siigo/mapper.js` | Producto SIIGO → producto local. |
| `siigo/customerMapper.js` | Cliente SIIGO ↔ empresa local. |
| `siigo/quoteMapper.js` | Cotización interna → payload `POST /v1/quotations`. |

## Servicios (`services/`)

| Módulo | Responsabilidad |
|---|---|
| `siigoSync.js` | Sincronización de productos en segundo plano, logs y reseteo de syncs colgados. |
| `siigoQuote.js` | Push de cotizaciones a SIIGO con validaciones, idempotencia y reintentos. |
| `siigoCustomer.js` | Preview, importación (individual y masiva) y exportación de clientes. |

## Dependencias

| Paquete | Uso |
|---|---|
| `express`, `cors` | Servidor HTTP |
| `pg` | PostgreSQL |
| `zod` | Validación de entradas |
| `jsonwebtoken`, `bcryptjs` | Auth |
| `luxon` | Fechas con zona horaria (corte de rutas) |
| `multer` | Subida de imágenes |
| `@aws-sdk/client-s3` | Supabase Storage |
| `nodemailer` | Correos |
| `dotenv` | Variables de entorno |
