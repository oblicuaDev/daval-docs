---
sidebar_position: 1
title: Convenciones
---

# Referencia de la API

API REST en JSON. Todas las rutas cuelgan de `/api`.

| Entorno | URL base |
|---|---|
| Desarrollo local | `http://localhost:3000/api` |
| Producción (Vercel) | `https://<dominio-de-la-app>/api` |

## Autenticación

Casi todos los endpoints requieren un **access token JWT** en la cabecera:

```http
Authorization: Bearer <token>
```

El token se obtiene con [`POST /api/auth/login`](./auth.md#post-apiauthlogin) y dura 8 horas por defecto. Cuando vence, se renueva con [`POST /api/auth/refresh`](./auth.md#post-apiauthrefresh).

Payload del token:

```json
{ "sub": "<uuid del usuario>", "role": "admin | advisor | client", "email": "...", "iat": 0, "exp": 0 }
```

En esta referencia, cada endpoint indica su nivel de acceso:

| Etiqueta | Significado |
|---|---|
| **Público** | No requiere token |
| **Público (auth opcional)** | Funciona sin token; con token de admin habilita campos extra |
| **Autenticado** | Cualquier rol con token válido |
| **admin** / **advisor** / **client** | Solo esos roles |

## Formato de errores

Todas las respuestas de error tienen esta forma:

```json
{
  "error": "CODIGO_EN_MAYUSCULAS",
  "message": "Descripción legible",
  "details": { }
}
```

`details` es opcional. En errores de validación contiene el resultado de `ZodError.flatten()`:

```json
{
  "error": "VALIDATION_ERROR",
  "message": "Invalid request",
  "details": {
    "formErrors": [],
    "fieldErrors": { "email": ["Invalid email"] }
  }
}
```

### Códigos comunes

| HTTP | `error` | Cuándo |
|---|---|---|
| 400 | `VALIDATION_ERROR` | El cuerpo o los parámetros no cumplen el esquema |
| 400 | `EMPTY_PATCH` | Un `PUT`/`PATCH` sin campos para actualizar |
| 401 | `UNAUTHENTICATED` | Falta el token |
| 401 | `INVALID_TOKEN` | Token inválido o vencido |
| 403 | `FORBIDDEN` | El rol no tiene permiso |
| 404 | `NOT_FOUND` | Recurso inexistente, fuera de tu alcance o ruta inexistente |
| 409 | `DUPLICATE_*` | Violación de unicidad (NIT, email) |
| 422 | varios | Regla de negocio incumplida (p. ej. `ROUTE_CLOSED`) |
| 500 | `INTERNAL` | Error no controlado |
| 502 | `SIIGO_*` | Falla al hablar con SIIGO |

## Convenciones

- **Nombres en camelCase** en JSON (`priceListId`), aunque la base de datos use snake_case. Algunos endpoints de listado devuelven filas crudas en snake_case (se indica en cada caso).
- **IDs** son UUID v4, salvo los IDs de SIIGO (cadenas) y `siigoSellerId` (entero).
- **Creación** responde `201` con `{ "id": "<uuid>" }`, salvo que se indique otra cosa.
- **Borrado** responde `204` sin cuerpo. Rutas y usuarios se desactivan (`active = false`); los demás recursos se borran físicamente.
- **Actualizaciones parciales:** los `PUT` aceptan cualquier subconjunto de campos. En varios recursos se usa `COALESCE`, por lo que **enviar `null` no borra el valor** (se indica en cada recurso).
- **Montos** en pesos colombianos (COP) como número.
- **Fechas** en ISO 8601. La zona horaria de negocio es `America/Bogota`.
- **Límites:** cuerpo JSON máximo de 2 MB; imágenes máximo 5 MB.

## Índice de endpoints

### Salud

| Método | Ruta | Acceso |
|---|---|---|
| GET | `/api/health` | Público |

`200 { "ok": true, "ts": "...", "db": "connected" }` o `503 { "ok": false, "db": "<error>" }` si la base de datos no responde.

### Recursos

| Método | Ruta | Acceso | Página |
|---|---|---|---|
| POST | `/api/auth/login` | Público | [Auth](./auth.md) |
| POST | `/api/auth/refresh` | Público | [Auth](./auth.md) |
| GET | `/api/auth/me` | Autenticado | [Auth](./auth.md) |
| GET | `/api/products` | Autenticado | [Productos](./productos.md) |
| GET | `/api/products/catalog` | Público | [Productos](./productos.md) |
| POST | `/api/products` | admin | [Productos](./productos.md) |
| PUT | `/api/products/:id` | admin | [Productos](./productos.md) |
| POST | `/api/products/:id/image` | admin | [Productos](./productos.md) |
| GET | `/api/quotations` | Autenticado | [Cotizaciones](./cotizaciones.md) |
| POST | `/api/quotations` | client | [Cotizaciones](./cotizaciones.md) |
| GET | `/api/quotations/:id` | Autenticado | [Cotizaciones](./cotizaciones.md) |
| PATCH | `/api/quotations/:id` | admin, advisor | [Cotizaciones](./cotizaciones.md) |
| PATCH | `/api/quotations/:id/status` | admin, advisor | [Cotizaciones](./cotizaciones.md) |
| POST | `/api/quotations/:id/comments` | Autenticado | [Cotizaciones](./cotizaciones.md) |
| POST | `/api/quotations/:id/clone` | client | [Cotizaciones](./cotizaciones.md) |
| GET | `/api/routes` | Autenticado | [Rutas](./rutas.md) |
| GET | `/api/routes/me/cutoff` | client | [Rutas](./rutas.md) |
| POST | `/api/routes` | admin | [Rutas](./rutas.md) |
| PUT | `/api/routes/:id` | admin | [Rutas](./rutas.md) |
| DELETE | `/api/routes/:id` | admin | [Rutas](./rutas.md) |
| GET | `/api/categories` | Autenticado o API key `catalog:read` | [Categorías](./categorias.md) |
| POST / PUT / DELETE | `/api/categories[/:id]` | admin | [Categorías](./categorias.md) |
| GET | `/api/price-lists` | Autenticado | [Listas de precios](./listas-de-precios.md) |
| POST / PUT / DELETE | `/api/price-lists[/:id]` | admin | [Listas de precios](./listas-de-precios.md) |
| GET | `/api/price-lists/:id/products` | Autenticado | [Listas de precios](./listas-de-precios.md) |
| POST | `/api/price-lists/:id/products` | admin | [Listas de precios](./listas-de-precios.md) |
| PUT | `/api/price-lists/:id/clients` | admin | [Listas de precios](./listas-de-precios.md) |
| GET | `/api/companies` | Autenticado | [Empresas](./empresas.md) |
| POST | `/api/companies` | Público | [Empresas](./empresas.md) |
| PUT / DELETE | `/api/companies/:id` | admin | [Empresas](./empresas.md) |
| POST | `/api/companies/:id/branches` | Público (auth opcional) | [Empresas](./empresas.md) |
| PUT / DELETE | `/api/companies/:id/branches/:branchId` | admin | [Empresas](./empresas.md) |
| GET | `/api/promotions` | Autenticado | [Promociones](./promociones.md) |
| POST / PUT / DELETE | `/api/promotions[/:id]` | admin | [Promociones](./promociones.md) |
| GET | `/api/users` | admin | [Usuarios](./usuarios.md) |
| POST | `/api/users` | Público (auth opcional) | [Usuarios](./usuarios.md) |
| PUT / DELETE | `/api/users/:id` | admin | [Usuarios](./usuarios.md) |
| GET | `/api/stats/admin` | admin | [Estadísticas](./estadisticas.md) |
| GET | `/api/stats/advisor` | admin, advisor | [Estadísticas](./estadisticas.md) |
| GET | `/api/advisor/clients` | admin, advisor | [Asesor](./asesor.md) |
| GET | `/api/advisor/clients/:clientId/quotations` | admin, advisor | [Asesor](./asesor.md) |
| GET | `/api/advisor/companies` | admin, advisor | [Asesor](./asesor.md) |
| GET | `/api/my-company` | client | [Mi empresa](./mi-empresa.md) |
| POST / PUT / DELETE | `/api/my-company/users[/:id]` | client | [Mi empresa](./mi-empresa.md) |
| POST / PUT / DELETE | `/api/my-company/branches[/:id]` | client | [Mi empresa](./mi-empresa.md) |
| GET / POST / DELETE | `/api/api-keys[/:id]` | admin | [API keys de integración](./api-keys.md) |
| * | `/api/integrations/siigo/*` | admin | [SIIGO](./siigo.md) |

## Colección de Postman

En la raíz del repositorio está `daval_api.postman_collection.json` (y la carpeta `postman/`) con ejemplos listos para importar.
