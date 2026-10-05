---
sidebar_position: 13.5
title: API para el chatbot (WhatsApp)
---

# API para el chatbot (WhatsApp)

Archivo: `api/src/routes/integrations.js` · Prefijo: `/api/integrations`

Endpoints para que un servicio externo (el chatbot de WhatsApp) identifique clientes, consulte precios y ventanas de corte, y cree cotizaciones en nombre de un cliente.

**Principio:** el chatbot no decide nada comercial. Lista de precios, promociones, precio final, ruta, asesor y corte los resuelve siempre Daval. El chatbot solo pregunta y transmite.

## Autenticación

Todos los endpoints exigen un [API key de integración](./api-keys.md) en la cabecera `Authorization`, con el scope indicado en cada uno. El login de un usuario no sirve aquí.

```http
Authorization: Bearer dvl_…
```

| Error | Cuándo |
|---|---|
| `401 API_KEY_REQUIRED` | No se envió un API key |
| `401 INVALID_API_KEY` | Key inválido o revocado |
| `403 INSUFFICIENT_SCOPE` | El key no tiene el scope del endpoint |

## Flujo recomendado

```text
1. Llega un mensaje de WhatsApp
2. GET  /clients/lookup?phone=…          → ¿quién es? (cliente, empresa, sucursales)
   └─ needsDisambiguation = true          → preguntar empresa / sucursal
3. GET  /cutoff?clientId=…&branchId=…    → ¿puede cotizar ahora? ¿para qué fecha?
4. GET  /clients/:clientId/prices?…      → precios para los productos que pide
5. POST /quotations  (Idempotency-Key)   → crea la cotización en estado "pending"
6. GET  /quotations/:id                  → consultar el estado después
```

---

## Identificar un cliente por WhatsApp

### `GET /api/integrations/clients/lookup?phone=`

**Scope:** `clients:read`

Busca el número en los teléfonos de contacto de los clientes.

**Cómo se compara el teléfono.** Daval guarda los números en formato **E.164** (`+573001234567`) y compara por **igualdad exacta** después de normalizar lo recibido:

| Recibido | Normalizado |
|---|---|
| `+57 300 123 4567`, `+573001234567` | `+573001234567` (se respeta el código de país) |
| `300 123 4567`, `3001234567`, `(300) 123-4567` | `+573001234567` (celular colombiano de 10 dígitos) |
| `573001234567` | `+573001234567` |
| `6012345678`, `12`, … | ambiguo → `400 INVALID_PHONE` |

Se recomienda enviar el número tal como lo entrega WhatsApp, con código de país (`+57…` o `57…`).

**Respuesta `200`**

```json
{
  "phone": "+573001234567",
  "matchCount": 1,
  "needsDisambiguation": true,
  "matches": [
    {
      "clientId": "…",
      "clientName": "Ferretería El Tornillo",
      "company": { "id": "…", "name": "Ferretería El Tornillo S.A.S.", "nit": "900123456-7" },
      "defaultBranchId": "…",
      "branches": [
        {
          "id": "…", "name": "Sede Norte", "city": "Bogotá", "address": "Calle 100 # 15-20",
          "isDefault": true,
          "route": { "id": "…", "name": "Ruta Norte", "schedule": "Lunes y Jueves · cierra 1 día antes a las 16:00" },
          "advisor": { "id": "…", "name": "Carlos Asesor", "email": "asesor@daval.com" }
        },
        {
          "id": "…", "name": "Sede Sur", "city": "Bogotá", "address": "…",
          "isDefault": false,
          "route": null,
          "advisor": null
        }
      ]
    }
  ]
}
```

- **Sin coincidencias:** `200` con `matchCount: 0` y `matches: []`. El número no está registrado; el chatbot debe derivar a un asesor.
- **`needsDisambiguation: true`:** el número pertenece a más de un cliente (varias empresas), o la empresa tiene más de una sucursal. El chatbot debe preguntar con qué empresa y sucursal continuar. `isDefault` marca la sucursal habitual del cliente y sirve para sugerirla.
- Solo se devuelven clientes, empresas y sucursales activos.

---

## Ventana de corte

### `GET /api/integrations/cutoff?clientId=&branchId=`

**Scope:** `cutoff:read`

Indica si se puede cotizar ahora para la ruta de una sucursal. Se toma siempre la **ruta de la sucursal**, el mismo criterio con que se valida la creación de la cotización. Ver [regla de corte](../arquitectura/reglas-de-negocio.md#ventana-de-corte-de-rutas).

| Parámetros | Comportamiento |
|---|---|
| `clientId` + `branchId` | Valida que la sucursal sea de la empresa del cliente (si no, `404 BRANCH_NOT_FOUND`) |
| solo `clientId` | Usa la sucursal por defecto del cliente |
| solo `branchId` | Consulta la sucursal directamente |
| ninguno | `400 MISSING_PARAMS` |

**Respuesta `200`**

```json
{
  "clientId": "…",
  "branchId": "…",
  "branchName": "Sede Norte",
  "route": { "id": "…", "name": "Ruta Norte" },
  "isOpen": true,
  "routeDate": "2026-10-08T00:00:00.000-05:00",
  "deadline": "2026-10-07T16:00:00.000-05:00",
  "windowOpensAt": "2026-10-06T00:00:00.000-05:00",
  "nextOpenDate": "2026-10-09T00:00:00.000-05:00",
  "upcomingRouteDates": ["2026-10-08", "2026-10-12", "2026-10-15", "2026-10-19"],
  "schedule": {
    "operationDays": [1, 4], "frequency": "weekly", "anchorDate": null,
    "cutoffDaysBefore": 1, "cutoffTime": "16:00",
    "label": "Lunes y Jueves · cierra 1 día antes a las 16:00"
  },
  "message": "Puedes solicitar cotizaciones para la ruta del jueves 8 de octubre hasta el miércoles 7 de octubre a las 16:00."
}
```

| Campo | Para el chatbot |
|---|---|
| `isOpen` | Si puede cotizar ya |
| `routeDate` | Fecha de entrega a la que va la cotización |
| `deadline` | Hasta cuándo puede cotizar para esa ruta |
| `nextOpenDate` | Si está cerrado: cuándo vuelve a abrir |
| `upcomingRouteDates` | Próximas fechas de ruta (para recordatorios) |
| `message` | Texto en español listo para enviar al cliente |

Todas las fechas están en zona `America/Bogota`. Si la sucursal no tiene ruta: `isOpen: false`, `missingRoute: true`.

---

## Precios por cliente

### `GET /api/integrations/clients/:clientId/prices`

**Scope:** `prices:read`

Devuelve el precio que Daval le cobraría a ese cliente hoy: lista de precios del cliente, promociones generales y promociones `specific` asignadas a él. Es el **mismo cálculo** que se usa al crear la cotización.

**Query.** Se requiere al menos un filtro:

| Parámetro | Descripción |
|---|---|
| `skus` | SKUs separados por coma: `PR035,PR036` |
| `productIds` | UUIDs separados por coma |
| `search` | Texto contenido en el nombre o el SKU |
| `categoryId` | UUID de categoría |
| `limit` | Máximo de productos (por defecto 20, máximo 50) |

Solo se devuelven productos activos.

**Respuesta `200`**

```json
{
  "clientId": "…",
  "priceList": { "id": "…", "name": "Lista Mayorista" },
  "currency": "COP",
  "computedAt": "2026-10-05T20:59:32.947Z",
  "items": [
    {
      "productId": "…", "sku": "PR035", "name": "ACOMETIDA HEMBRA 1/2",
      "unit": "unidad", "category": "Plomería",
      "stock": 441, "stockSyncedAt": "2026-10-05T06:00:00.000Z",
      "priceListPrice": 1950,
      "promotionPrice": 1500,
      "finalPrice": 1500,
      "priceType": "promotion"
    }
  ],
  "notFound": { "productIds": [], "skus": ["NO-EXISTE"] }
}
```

- `finalPrice` es el precio a comunicar. El chatbot **no debe** calcular ni redondear precios.
- `priceType`: `promotion` si aplica una promoción, `price_list` si no.
- `stock` y `stockSyncedAt`: disponibilidad según la última sincronización con SIIGO. Úsala como referencia e informa la fecha si es antigua.
- `notFound`: SKUs o IDs pedidos que no existen o están inactivos.

**Errores:** `400 MISSING_PARAMS`, `404 CLIENT_NOT_FOUND`.

---

## Crear una cotización

### `POST /api/integrations/quotations`

**Scope:** `quotations:write`

Crea la cotización en nombre del cliente, en estado **`pending`** (queda para revisión humana) y con origen **`whatsapp`**.

**Cabecera obligatoria: `Idempotency-Key`.** Es un identificador único del pedido, de hasta 100 caracteres (por ejemplo, el ID del mensaje de WhatsApp). Si la petición se repite con la misma key, por un reintento o un timeout, Daval **no crea otra cotización**: responde `200` con la ya creada y `replayed: true`.

**Body**

```json
{
  "clientId": "…",
  "branchId": "…",
  "notes": "Entregar en bodega",
  "items": [
    { "sku": "PR035", "quantity": 10 },
    { "productId": "…", "quantity": 2 }
  ]
}
```

| Campo | Tipo | Requerido |
|---|---|---|
| `clientId` | uuid | Sí |
| `branchId` | uuid, sucursal de la empresa del cliente | Sí |
| `items` | 1–200 ítems; cada uno con `sku` **o** `productId`, y `quantity > 0` | Sí |
| `notes` | string (máx. 2000) | No |

El body **no acepta** precios, asesor, ruta, lista de precios, estado ni origen: un campo extra responde `400 VALIDATION_ERROR`. Daval resuelve:

- **Precios:** lista del cliente + promociones vigentes, al momento de crear.
- **Asesor y ruta:** los de la sucursal.
- **Corte:** se valida con la ruta de la sucursal.
- **Fecha de ruta:** se guarda en `routeDate`.

**Respuesta `201`** (`200` si es una repetición con la misma `Idempotency-Key`)

```json
{
  "id": "…",
  "code": "COT-000123",
  "status": "pending",
  "source": "whatsapp",
  "total": 18900,
  "notes": "Entregar en bodega",
  "routeDate": "2026-10-08",
  "clientId": "…",
  "branch": { "id": "…", "name": "Sede Norte" },
  "advisor": { "id": "…", "name": "Carlos Asesor" },
  "createdAt": "…", "updatedAt": "…",
  "items": [
    { "productId": "…", "sku": "PR035", "name": "ACOMETIDA HEMBRA 1/2",
      "quantity": 10, "unitPrice": 1500, "priceType": "promotion", "subtotal": 15000 }
  ],
  "replayed": false
}
```

**Errores**

| Código | Cuándo |
|---|---|
| `400 VALIDATION_ERROR` | Falta `Idempotency-Key`, body inválido o campos no permitidos |
| `404 BRANCH_NOT_FOUND` | La sucursal no existe, está inactiva o no es de la empresa del cliente |
| `404 PRODUCT_NOT_FOUND` | SKU o producto inexistente o inactivo (`details.skus` / `details.productIds`) |
| `422 ROUTE_CLOSED` | La ventana de corte está cerrada. `message` es apto para el cliente; `details.nextOpenDate` y `details.routeDate` |

---

## Consultar una cotización

### `GET /api/integrations/quotations/:id`

**Scope:** `quotations:write`

Devuelve la cotización con el mismo formato de la creación. Solo se pueden consultar las cotizaciones **creadas con el mismo API key**; cualquier otra responde `404 NOT_FOUND`.

**Estados posibles:** `pending` (en revisión), `sent`, `approved`, `rejected`, `sent_to_siigo`, `synced`, `draft`.
