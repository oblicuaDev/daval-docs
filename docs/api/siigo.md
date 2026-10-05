---
sidebar_position: 13
title: Integración SIIGO
---

# Integración SIIGO

Archivo: `api/src/routes/siigo.js` · Prefijo: `/api/integrations/siigo`

**Acceso de todos los endpoints:** admin

Para entender los flujos completos (qué se valida, qué se guarda y cómo se reintenta), ver [Integraciones → SIIGO](../integraciones/siigo.md).

## Configuración

### `GET /api/integrations/siigo/settings`

Credenciales (con la clave enmascarada) y estado de la última sincronización.

**Respuesta `200`**

```json
{
  "partnerId": "DavalApp",
  "username": "usuario@daval.com",
  "accessKey": "abcd…wxyz",
  "accessKeySet": true,
  "baseUrl": "https://api.siigo.com",
  "tokenExpiresAt": "2026-09-29T14:00:00.000Z",
  "lastSync": {
    "startedAt": "…",
    "finishedAt": "…",
    "status": "success",
    "count": 1840,
    "error": null
  }
}
```

### `PUT /api/integrations/siigo/settings`

Actualiza las credenciales. Solo cambian los campos enviados. Si cambia `username` o `accessKey`, se invalida el token cacheado.

**Body**

| Campo | Tipo |
|---|---|
| `partnerId` | string |
| `username` | string |
| `accessKey` | string |
| `baseUrl` | URL |

**Respuesta `200`:** `{ "updated": true, "settings": { "partner_id": "…", "username": "…", "base_url": "…" } }`

### `POST /api/integrations/siigo/test-connection`

Se autentica contra SIIGO y lista un producto como prueba.

**Respuesta `200`**

```json
{
  "ok": true,
  "partnerId": "DavalApp",
  "username": "usuario@daval.com",
  "tokenExpiresAt": "2026-09-29T14:00:00.000Z",
  "productCountSample": 1840
}
```

**Errores:** `400 SIIGO_NOT_CONFIGURED`, `502 SIIGO_AUTH_FAILED`, `502 SIIGO_HTTP_ERROR`.

---

## Sincronización de productos

### `POST /api/integrations/siigo/sync/products`

Ejecuta la sincronización del catálogo y **espera a que termine** (unos segundos). Ver [Sincronización de productos](../integraciones/siigo.md#sincronización-de-productos).

**Body (opcional):** `{ "mode": "full" | "incremental" }` (por defecto `full`).

**Respuesta `200`**

```json
{
  "logId": "…", "mode": "full", "status": "success",
  "processed": 1123, "created": 0, "updated": 1123, "errors": 0, "deactivated": 2,
  "message": null, "durationMs": 6200
}
```

`status`: `success`, `partial` (se agotó el tiempo; la siguiente la completa) o `error`.

**Errores:** `409 SYNC_ALREADY_RUNNING`.

### `GET /api/integrations/siigo/sync/status`

**Respuesta `200`**

```json
{
  "running": false,
  "last": {
    "id": "…", "kind": "products", "mode": "full", "status": "success",
    "started_at": "…", "finished_at": "…",
    "items_processed": 1123, "items_created": 0, "items_updated": 1123, "items_deactivated": 2,
    "error_message": null
  },
  "lastFullSyncAt": "…",
  "lastSuccessfulSyncAt": "…"
}
```

### `GET /api/cron/siigo-sync`

Sync programada. La llama Vercel Cron (diaria, `mode=full`) o un programador externo.

**Acceso:** cabecera `Authorization: Bearer <CRON_SECRET>` (variable de entorno). Sin `CRON_SECRET` configurado responde `503 CRON_NOT_CONFIGURED`; con un secreto incorrecto, `401`.

**Query:** `mode` = `incremental` (por defecto) o `full`.

**Respuesta `200`:** el mismo resumen que `POST /sync/products`, o `{ "skipped": true, "reason": "running" }` si ya había una en curso, o `"staging"` en el ambiente de pruebas.

### `GET /api/integrations/siigo/sync/logs`

Historial de sincronizaciones.

**Query:** `limit` (por defecto 50, máximo 200).

**Respuesta `200`:** `{ "items": [ { …campos de last…, "triggered_by_name": "Admin Daval" } ] }`

---

## Envío de cotizaciones

### `POST /api/integrations/siigo/quotes/:quoteId`

Crea la cotización en SIIGO (`POST /v1/quotations`). Si tiene éxito, la cotización local pasa a `status = 'synced'` y guarda `siigoQuotationId` (p. ej. `C-1-26329`) y, si SIIGO lo entrega, `siigoUrl` (enlace al PDF).

**Respuesta `201`**

```json
{
  "integrationId": "…",
  "siigoQuoteId": "C-1-26329",
  "status": "success",
  "quotationCode": "COT-000042",
  "siigoResponse": { "id": "…uuid SIIGO…", "name": "C-1-26329", "number": 26329, "total": 170000 }
}
```

**Errores**

| HTTP | `error` | Causa |
|---|---|---|
| 404 | `QUOTE_NOT_FOUND` | La cotización no existe |
| 409 | `ALREADY_SYNCED` | Ya se envió con éxito. `details` trae `siigoQuoteId` e `integrationId`. Usa `/retry` para forzar |
| 422 | `QUOTE_HAS_NO_ITEMS` | Sin ítems |
| 422 | `QUOTE_HAS_DELETED_PRODUCTS` | Algún producto fue eliminado del catálogo |
| 422 | `QUOTE_HAS_UNSYNCED_PRODUCTS` | Algún producto no tiene `siigo_id`. `details.unsyncedSkus` |
| 422 | `MISSING_CLIENT_NIT` | El cliente no tiene NIT |
| 422 | `MISSING_SELLER_ID` | El asesor no tiene `siigo_seller_id` y no hay `SIIGO_DEFAULT_SELLER_ID` |
| 422 | `SIIGO_CUSTOMER_NOT_FOUND` | El cliente no existe en SIIGO con ese NIT. Hay que crearlo allá o [exportarlo](#post-apiintegrationssiigocustomerscompanyidexport) |
| 500 | `DB_COMMIT_FAILED` | SIIGO aceptó, pero falló el guardado local. `details.siigoQuoteId` para recuperarlo a mano |
| 502 | `SIIGO_HTTP_ERROR` | SIIGO rechazó el payload o no respondió tras los reintentos |

### `POST /api/integrations/siigo/quotes/:quoteId/retry`

Igual que el anterior pero **omite la verificación de idempotencia** (`force: true`). Úsalo solo si sabes que la cotización no quedó creada en SIIGO: si ya hay una integración exitosa, el índice único de la base de datos impedirá registrar un segundo éxito.

### `GET /api/integrations/siigo/quotes/:quoteId/history`

Intentos de envío de una cotización.

```json
{
  "items": [
    {
      "id": "…", "siigo_quote_id": "C-1-26329", "status": "success",
      "error_message": null, "attempt_count": 1,
      "created_at": "…", "updated_at": "…", "triggered_by_name": "Admin Daval"
    }
  ]
}
```

### `POST /api/integrations/siigo/quotes/:quoteId/refresh-url`

Vuelve a consultar la cotización en SIIGO (`GET /v1/quotations/{uuid}`) para obtener el enlace del PDF y lo guarda en `siigo_url`. Se usa desde el botón "Obtener link" cuando el envío original no trajo el enlace.

**Respuesta `200`:** `{ "siigoUrl": "https://…" | null, "siigoUuid": "…", "raw": { …respuesta de SIIGO… } }`

Si SIIGO no devuelve PDF (depende del plan), `siigoUrl` queda en `null`.

**Errores:** `404 NO_SIIGO_ID` si no hay integración exitosa.

### `POST /api/integrations/siigo/quotations/:id/push`

Alias heredado de `POST /quotes/:quoteId`. Mismo comportamiento.

---

## Clientes

:::caution[Orden de rutas]
Las rutas fijas (`/customers/local`, `/customers/import`) están declaradas antes que las parametrizadas (`/customers/:companyId/…`). Si agregas rutas nuevas, mantén ese orden.
:::

### `GET /api/integrations/siigo/customers`

Lista clientes **desde SIIGO** e indica si ya existen localmente (por `siigo_customer_id` o NIT).

**Query**

| Parámetro | Por defecto | Descripción |
|---|---|---|
| `page` | 1 | |
| `page_size` | 25 | Máximo 100 |
| `name` | — | Filtro de SIIGO |
| `identification` | — | NIT |

**Respuesta `200`**

```json
{
  "items": [
    {
      "siigoId": "…",
      "identification": "900123456",
      "name": "FERRETERIA NORTE SAS",
      "email": "…", "phone": "…", "city": "Bogotá",
      "active": true,
      "alreadyImported": true,
      "localCompanyId": "…",
      "localCompanyName": "Ferretería Norte"
    }
  ],
  "total": 420,
  "page": 1,
  "pageSize": 25
}
```

### `GET /api/integrations/siigo/customers/local`

Empresas locales con su estado de sincronización.

**Query:** `sync_status` (`local` | `pending` | `synced` | `error`), `limit` (por defecto 100, máximo 500).

**Respuesta `200`**

```json
{
  "items": [
    {
      "id": "…", "name": "…", "nit": "…", "email": "…", "phone": "…", "address": "…", "active": true,
      "siigoCustomerId": "…",
      "siigoSyncStatus": "synced",
      "siigoOrigin": "bidirectional",
      "siigoLastSyncAt": "…", "siigoLastImportAt": "…", "siigoLastError": null,
      "branches": [ { "id": "…", "name": "Principal", "city": "Bogotá" } ]
    }
  ]
}
```

### `POST /api/integrations/siigo/customers/import/:siigoId`

Importa (o actualiza) un cliente de SIIGO como empresa local.

**Respuesta:** `201` si la empresa es nueva, `200` si se actualizó.

```json
{
  "companyId": "…",
  "isNew": true,
  "name": "FERRETERIA NORTE SAS",
  "nit": "900123456",
  "siigoCustomerId": "…"
}
```

**Errores:** `404 SIIGO_CUSTOMER_NOT_FOUND`.

### `POST /api/integrations/siigo/customers/import`

Importación masiva, procesada en secuencia.

**Body**

```json
{ "siigoIds": ["id1", "id2", "id3"] }
```

Entre 1 y 100 IDs.

**Respuesta `207 Multi-Status`**

```json
{
  "imported": [ { "siigoId": "id1", "companyId": "…", "name": "…", "nit": "…" } ],
  "updated":  [ { "siigoId": "id2", "companyId": "…", "name": "…", "nit": "…" } ],
  "errors":   [ { "siigoId": "id3", "error": "…" } ]
}
```

### `POST /api/integrations/siigo/customers/:companyId/export`

Envía la empresa local a SIIGO: `POST /v1/customers` si aún no tiene `siigo_customer_id`, o `PUT /v1/customers/{id}` si ya lo tiene. El NIT se limpia (sin puntos ni dígito de verificación) y se envía como tipo de documento `31` (NIT).

**Respuesta `201`:** `{ "siigoCustomerId": "…", "companyId": "…", "name": "…" }`

**Errores**

| HTTP | `error` | Causa |
|---|---|---|
| 404 | `COMPANY_NOT_FOUND` | |
| 422 | `MISSING_NIT` | La empresa no tiene NIT |
| 422 | `INVALID_NIT` | El NIT es un placeholder `NIT-…` |
| 502 | `SIIGO_HTTP_ERROR` | SIIGO rechazó los datos |

### `GET /api/integrations/siigo/customers/:companyId/history`

Últimas 50 operaciones de importación/exportación de la empresa.

```json
{
  "items": [
    {
      "id": "…", "siigo_customer_id": "…", "operation": "import", "status": "success",
      "error_message": null, "duration_ms": 842,
      "created_at": "…", "updated_at": "…", "triggered_by_name": "Admin Daval"
    }
  ]
}
```

---

## Vendedores

### `GET /api/integrations/siigo/sellers`

Usuarios de SIIGO (`GET /v1/users`), para asignar `siigoSellerId` a los asesores.

```json
{
  "items": [
    { "id": 1374, "username": "…", "firstName": "JUAN CARLOS", "lastName": "LAVERDE", "active": true }
  ]
}
```
