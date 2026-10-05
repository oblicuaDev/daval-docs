---
sidebar_position: 4
title: Cotizaciones
---

# Cotizaciones

Archivo: `api/src/routes/quotations.js` · Prefijo: `/api/quotations`

Una cotización es el pedido que un cliente arma desde el catálogo. El servidor decide precios, asesor y si la ventana de la ruta está abierta. La creación es la misma para la web y para el chatbot (`api/src/services/quotationService.js`); el chatbot usa [su propio endpoint](./integraciones-chatbot.md#crear-una-cotización).

## Objeto `Quotation`

Lo devuelven `GET /:id`, `POST /` y `POST /:id/clone`.

```json
{
  "id": "…",
  "code": "COT-000042",
  "status": "sent",
  "total": 170000,
  "itemCount": 2,
  "clientId": "…", "clientName": "Juan Cliente",
  "advisorId": "…", "advisorName": null,
  "companyId": "…", "companyName": "Ferretería Norte",
  "branchId": "…", "branchName": "Sede Principal",
  "siigoQuotationId": null,
  "siigoUrl": null,
  "source": "web",
  "routeDate": "2026-10-01",
  "createdAt": "2026-09-28T14:03:11.000Z",
  "updatedAt": "2026-09-28T14:03:11.000Z",
  "notes": "Entregar en bodega",
  "pricesOutdated": false,
  "items": [
    {
      "id": "…", "productId": "…",
      "productName": "Tornillo drywall 6x1", "sku": "TOR-001", "unit": "caja",
      "quantity": 20, "priceType": "promotion",
      "unitPrice": 8500, "subtotal": 170000
    }
  ],
  "comments": [
    {
      "id": "…", "text": "Confirmado",
      "createdAt": "…",
      "authorId": "…", "authorName": "Carlos Asesor", "authorRole": "advisor"
    }
  ]
}
```

| Campo | Notas |
|---|---|
| `status` | `draft`, `sent`, `pending`, `approved`, `rejected`, `synced`, `sent_to_siigo`. Desde la web se crea en `sent`; desde el chatbot, en `pending` |
| `source` | Canal de origen: `web` o `whatsapp` |
| `routeDate` | Fecha de la ruta a la que va el pedido (`YYYY-MM-DD`), según la ventana de corte al crearla. `null` en cotizaciones anteriores a este campo |
| `priceType` | `promotion` si ganó el precio promocional, `price_list` si no |
| `pricesOutdated` | `true` si algún producto se modificó después de crear la cotización |
| `productName` | `"[Producto eliminado]"` si el producto ya no existe |
| `advisorName` | En el detalle viene `null`; en el listado viene poblado |

---

## `GET /api/quotations`

Lista cotizaciones (máximo 200, más recientes primero). **El alcance depende del rol**: el cliente ve las suyas, el asesor las asignadas y el admin todas.

**Acceso:** Autenticado

**Query**

| Parámetro | Tipo | Descripción |
|---|---|---|
| `status` | string | Filtra por estado |
| `search` | string | Busca en nombre del cliente o código |
| `pendingSiigo` | `true` | Solo las que no tienen `siigo_quotation_id` y no están rechazadas |
| `clientId` | uuid | Solo admin |
| `advisorId` | uuid | Solo admin |

**Respuesta `200`:** `{ "items": [ Quotation sin notes, items ni comments ] }`

---

## `POST /api/quotations`

Crea una cotización a nombre del cliente autenticado.

**Acceso:** client (el usuario debe tener una ficha en `clients` y estar activo)

**Body**

| Campo | Tipo | Requerido |
|---|---|---|
| `branchId` | uuid | Sí. Sucursal de la empresa del cliente que recibe el pedido; define ruta y asesor |
| `notes` | string | No |
| `items` | arreglo (mín. 1) | Sí |
| `items[].productId` | uuid | Sí |
| `items[].quantity` | número > 0 | Sí |

```json
{
  "branchId": "3f1c…",
  "notes": "Entregar en bodega",
  "items": [
    { "productId": "a1b2…", "quantity": 20 },
    { "productId": "c3d4…", "quantity": 5 }
  ]
}
```

:::info[No se envían precios]
Cualquier precio o `advisorId` en el cuerpo se ignora. El servidor calcula `unitPrice` con `resolvePrices` y toma el asesor de la sucursal.
:::

**Proceso**

1. Resuelve cliente, lista de precios, sucursal, empresa, asesor y ruta en una sola consulta. La sucursal debe pertenecer a la empresa del cliente.
2. Verifica la ventana de corte de la ruta de la sucursal.
3. Verifica que todos los productos existan y estén activos.
4. Calcula precios de todos los productos.
5. En una transacción: genera el código `COT-NNNNNN`, inserta la cabecera con `status = 'sent'`, `source = 'web'` y `route_date`, y los ítems en un solo `INSERT`.

**Respuesta `201`:** objeto `Quotation` completo.

**Errores**

| HTTP | `error` | Causa |
|---|---|---|
| 404 | `BRANCH_NOT_FOUND` | La sucursal no existe, está inactiva, no es de la empresa del cliente o el usuario no es cliente |
| 404 | `PRODUCT_NOT_FOUND` | Algún `productId` no existe o está inactivo (`details.productIds`) |
| 422 | `ROUTE_CLOSED` | Fuera de la ventana de corte. `details.nextOpenDate` indica cuándo reabre y `details.routeDate` para qué ruta |

```json
{
  "error": "ROUTE_CLOSED",
  "message": "La recepción de cotizaciones está cerrada. Reabre el viernes 2 de octubre a las 00:00 para la ruta del jueves 8 de octubre.",
  "details": {
    "nextOpenDate": "2026-10-02T00:00:00.000-05:00",
    "routeDate": "2026-10-08T00:00:00.000-05:00"
  }
}
```

---

## `GET /api/quotations/:id`

Detalle completo con ítems y comentarios.

**Acceso:** Autenticado, con verificación de alcance (el cliente solo ve las suyas y el asesor solo las asignadas)

**Respuesta `200`:** objeto `Quotation`.

**Errores:** `404 NOT_FOUND` si no existe o está fuera de tu alcance.

---

## `POST /api/quotations/:id/clone`

Repite una cotización anterior con los mismos productos y cantidades, pero con **precios actuales**. Útil para el botón "Repetir pedido".

**Acceso:** client (dueño de la cotización original)

**Body:** vacío.

**Respuesta `201`:** la nueva `Quotation` (código nuevo, `status = 'sent'`). Si un producto de la original ya no existe, conserva su precio original.

**Errores**

| HTTP | `error` | Causa |
|---|---|---|
| 404 | `NOT_FOUND` | La cotización no existe o no es tuya |
| 404 | `BRANCH_NOT_FOUND` | La sucursal original ya no es accesible |
| 422 | `NO_BRANCH` | La original no tiene sucursal |
| 422 | `NO_ITEMS` | La original no tiene ítems |
| 422 | `ROUTE_CLOSED` | Ventana de corte cerrada |

---

## `PATCH /api/quotations/:id`

Actualiza el enlace de SIIGO o reasigna el asesor. Solo se modifican las claves presentes en el cuerpo; `null` limpia el valor.

**Acceso:** admin, advisor

**Body**

| Campo | Tipo |
|---|---|
| `siigoUrl` | URL \| null |
| `advisorId` | uuid \| null |

**Respuesta `200`:** `{ "id": "<uuid>" }` · **Errores:** `400 EMPTY_PATCH`, `404 NOT_FOUND`.

---

## `PATCH /api/quotations/:id/status`

Cambia el estado.

**Acceso:** admin, advisor

**Body**

```json
{ "status": "approved" }
```

Valores válidos: `draft`, `sent`, `pending`, `approved`, `rejected`, `synced`, `sent_to_siigo`.

**Respuesta `200`:** `{ "id": "<uuid>", "status": "approved" }`

---

## `POST /api/quotations/:id/comments`

Agrega un comentario a la cotización.

**Acceso:** Autenticado

**Body**

```json
{ "text": "¿Pueden despachar el martes?" }
```

**Respuesta `201`:** `{ "id": "<uuid>", "createdAt": "…" }`

---

## Enviar a SIIGO

El envío de una cotización al ERP se hace desde la integración: [`POST /api/integrations/siigo/quotes/:quoteId`](./siigo.md#envío-de-cotizaciones).
