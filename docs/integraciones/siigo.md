---
sidebar_position: 1
title: SIIGO
---

# Integración con SIIGO

[SIIGO](https://www.siigo.com) es el ERP contable de DAVAL. La integración cubre tres flujos:

| Flujo | Dirección | Disparo |
|---|---|---|
| Productos | SIIGO → DAVAL | Manual, desde `/admin/integraciones` |
| Clientes | SIIGO ↔ DAVAL | Manual, desde `/admin/integraciones/clientes-siigo` |
| Cotizaciones | DAVAL → SIIGO | Manual, desde el detalle de la cotización en admin |

Los endpoints están en [Referencia API → SIIGO](../api/siigo.md).

## Credenciales y token

Las credenciales viven en la tabla `siigo_settings` (fila única `id = 1`), **no** en variables de entorno, y se editan desde la pantalla de integraciones (`PUT /settings`):

| Campo | Uso |
|---|---|
| `username` | Usuario de API de SIIGO |
| `access_key` | Clave de acceso (se muestra enmascarada) |
| `partner_id` | Se envía en la cabecera `Partner-Id` (por defecto `DavalApp`) |
| `base_url` | `https://api.siigo.com` |

El cliente HTTP (`lib/siigo/client.js`):

1. Se autentica con `POST {base_url}/auth` y guarda el token en `cached_token` / `cached_token_expires`.
2. Reutiliza el token hasta 60 s antes de que venza.
3. Si SIIGO responde `401`, se re-autentica y reintenta **una** vez.
4. Cualquier otra respuesta no exitosa se convierte en `502 SIIGO_HTTP_ERROR` con `details.siigoStatus`.

## Sincronización de productos

`services/siigoSync.js` → `runProductsSync({ mode })`

### Modos

| Modo | Qué trae de SIIGO | Productos que ya no existen en SIIGO |
|---|---|---|
| `full` (completa) | Todo el catálogo | Se **desactivan** (`active = false`), solo si el recorrido terminó completo |
| `incremental` | Solo lo modificado desde la última sync exitosa (`updated_start` de SIIGO, que incluye **cambios de saldo de inventario**) | No se detectan; los detecta la siguiente completa |

Sin una sync exitosa previa, la incremental se ejecuta como completa. SIIGO filtra por **fecha**, así que la incremental pide desde el día anterior (hora Colombia) a la última sync exitosa; los productos repetidos simplemente se vuelven a actualizar.

### Frecuencia

| Ejecución | Cuándo | Modo |
|---|---|---|
| Automática (Vercel Cron, `vercel.json`) | Todos los días a las 10:00 UTC (5:00 a. m. Colombia) | `full` |
| Manual (botón en *Integraciones → SIIGO*) | Cuando el admin lo pida | `full` |
| `GET /api/cron/siigo-sync?mode=incremental` | Disponible para un programador externo (ver abajo) | `incremental` |

El plan Hobby de Vercel solo permite crons diarios. Para actualizar el stock varias veces al día se necesita un programador externo que llame al endpoint de cron con el secreto (`Authorization: Bearer <CRON_SECRET>`).

**Medición (catálogo de 1 123 productos):** completa ≈ 6 s; incremental de un día (273 productos) ≈ 3,5 s. SIIGO permite 100 peticiones por minuto en producción; una completa usa 12.

### Cómo corre

```text
runProductsSync({ mode })
  ├─ toma el bloqueo (siigo_settings.last_sync_status = running)
  │    └─ si otra sync corre hace menos de 10 min → 409 SYNC_ALREADY_RUNNING
  ├─ inserta log en siigo_sync_logs (mode, status = running)
  ├─ por cada página de GET /v1/products (page_size = 100, reintentos ante 429/errores):
  │    └─ un solo INSERT … ON CONFLICT (siigo_id) DO UPDATE para los 100 productos
  │       (si el lote falla, p. ej. por SKU duplicado, reintenta producto por producto)
  ├─ completa y terminada → desactiva los que no vinieron (salvo que SIIGO devuelva
  │    menos de la mitad de los activos: se asume respuesta incompleta y no se desactiva nada)
  └─ cierra el log: success | partial | error
```

La sync se ejecuta **esperando el resultado** (no en segundo plano): en Vercel una función se congela al responder, y por eso las syncs en segundo plano nunca terminaban. Si una ejecución pasa de 240 s se detiene, queda `partial` y la siguiente la completa.

**Bloqueo abandonado:** si una ejecución muere sin cerrar, el bloqueo vence a los 10 minutos. `resetStuckSync()` solo marca como `error` las syncs con más de 10 minutos en `running` (antes reseteaba cualquiera en cada arranque en frío y mataba la que otra instancia estaba corriendo).

**Marcas de tiempo** (`siigo_settings`): `last_full_sync_at` y `last_incremental_sync_at` guardan el **inicio** de la última sync exitosa de cada tipo (lo que cambie en SIIGO durante la sync entra en la siguiente).

### Mapeo (`lib/siigo/mapper.js`)

| SIIGO | Local |
|---|---|
| `id` | `siigo_id` |
| `code` | `sku` |
| `name` | `name` |
| `unit.name` / `unit.code` | `unit` |
| `available_quantity` | `stock` |
| `stock_control` | `stock_control` (si es `false`, SIIGO no lleva inventario y `stock` no indica disponibilidad) |
| primer valor de `prices[0].price_list` | `base_price` |
| `active` | `active` |
| `metadata.image_url` | `image_url` (solo si viene; no borra la imagen local) |
| cada `prices[0].price_list[]` | fila en `product_price_lists` por `price_list_name` (informativa: el precio de venta usa las listas de DAVAL) |

Cada producto guarda `last_sync_at`. Los campos propios de DAVAL (`category_id`, `quality`, `description`) no se tocan.

### Comportamiento por caso

| En SIIGO | En DAVAL |
|---|---|
| Producto nuevo | Se crea en la próxima sync (completa o incremental), activo según SIIGO, sin categoría ni calidad |
| Producto modificado (nombre, precio, unidad, stock) | Se actualiza en la próxima sync |
| Producto marcado inactivo | `active = false` en la próxima sync: deja de aparecer en el catálogo y no se puede cotizar |
| Producto eliminado | `active = false` en la próxima sync **completa** |
| Producto creado solo en DAVAL (sin `siigo_id`) | La sync no lo toca |

### Disponibilidad para el chatbot

`GET /api/integrations/clients/:id/prices` devuelve por producto `stock`, `stockTracked` (`stock_control`) y `stockSyncedAt`, y en la respuesta `catalogSyncedAt` (última sync exitosa). El chatbot no debe afirmar disponibilidad si `stockTracked` es `false`, y debe aclarar la fecha si `catalogSyncedAt` es antigua.

## Clientes

`services/siigoCustomer.js`, `lib/siigo/customerMapper.js`

### Importar (SIIGO → DAVAL)

1. `GET /v1/customers/{id}` en SIIGO.
2. Busca un duplicado local: primero por `siigo_customer_id`, luego por `nit`.
3. Registra el intento en `siigo_customer_integrations` (`operation = import`).
4. En una transacción:
   - **Si existe:** actualiza nombre, email, teléfono y dirección (los últimos tres solo si vienen), marca `synced` y cambia `siigo_origin` de `local` a `bidirectional`. **No toca** asesor, ruta, lista de precios ni `active`.
   - **Si no existe:** crea la empresa con `siigo_origin = 'siigo'` y, si hay ciudad o dirección, una sucursal `Principal`.
5. Actualiza el log con el resultado y la duración.

Para personas naturales SIIGO devuelve `name` como arreglo (`["NOMBRE", "APELLIDO"]`); el mapper lo une con espacios. La migración 012 corrigió los nombres importados antes de ese arreglo.

### Exportar (DAVAL → SIIGO)

1. Valida que la empresa tenga NIT real (rechaza placeholders `NIT-…`).
2. Construye el payload: `person_type = Company`, `id_type = 31` (NIT), NIT sin puntos ni dígito de verificación, `name` como arreglo, teléfono con indicativo `57`, email como contacto.
3. `POST /v1/customers` o `PUT /v1/customers/{id}` si ya tiene `siigo_customer_id`.
4. Guarda `siigo_customer_id` y `siigo_sync_status = synced`, o `error` con `siigo_last_error`.

### Estados de sincronización de una empresa

| `siigo_sync_status` | Significado |
|---|---|
| `local` | Solo existe en DAVAL |
| `pending` | Envío en curso |
| `synced` | Vinculada con SIIGO |
| `error` | El último intento falló (ver `siigo_last_error`) |

| `siigo_origin` | Significado |
|---|---|
| `local` | Creada en DAVAL |
| `siigo` | Importada desde SIIGO |
| `bidirectional` | Creada en DAVAL y luego vinculada con SIIGO |

## Cotizaciones

`services/siigoQuote.js`, `lib/siigo/quoteMapper.js`

```text
pushQuoteToSiigo(quoteId, userId, { force })
  1. Carga la cotización, sus ítems, el NIT (prefiere el de la empresa) y el asesor
  2. Valida:
       ├─ tiene ítems                         → si no, 422 QUOTE_HAS_NO_ITEMS
       ├─ ningún producto eliminado           → si no, 422 QUOTE_HAS_DELETED_PRODUCTS
       ├─ todos los productos tienen siigo_id → si no, 422 QUOTE_HAS_UNSYNCED_PRODUCTS
       └─ el cliente tiene NIT                → si no, 422 MISSING_CLIENT_NIT
  3. Idempotencia (si force = false): ya hay integración success → 409 ALREADY_SYNCED
  4. GET /v1/customers?identification=<nit> → si no existe, 422 SIIGO_CUSTOMER_NOT_FOUND
  5. Vendedor = users.siigo_seller_id del asesor, o SIIGO_DEFAULT_SELLER_ID
                                              → si no hay, 422 MISSING_SELLER_ID
  6. Construye el payload
  7. Inserta siigo_quote_integrations (status = pending)
  8. POST /v1/quotations con reintentos (429, 500, 502, 503, 504; espera 1 s → 2 s → 4 s)
       └─ falla → integración = error, se relanza el error
  9. GET /v1/quotations/{uuid} para obtener el link del PDF (si falla, sigue sin link)
 10. Transacción: integración = success; cotización = synced + siigo_quotation_id + siigo_url
       └─ falla el commit → 500 DB_COMMIT_FAILED con el ID de SIIGO para recuperarlo a mano
```

### Payload enviado

```json
{
  "document": { "id": 24096 },
  "date": "2026-09-28",
  "customer": { "identification": "900123456", "branch_office": 0 },
  "observations": "Entregar en bodega",
  "items": [
    {
      "code": "TOR-001",
      "description": "Tornillo drywall 6x1",
      "quantity": 20,
      "price": 8500,
      "discount": 0,
      "taxes": [ { "id": 17085 } ]
    }
  ],
  "seller": 1374,
  "payment_type": { "id": 0 }
}
```

`payment_type` solo se incluye si `SIIGO_PAYMENT_TYPE_ID` está definido. Las cotizaciones de SIIGO no llevan `payments`.

### IDs de SIIGO configurables

| Variable | Por defecto | Qué es | Cómo consultarlo |
|---|---|---|---|
| `SIIGO_QUOTE_DOC_TYPE_ID` | `24096` | Tipo de documento "Cotización" | `GET /v1/quotations?page_size=1` → `document.id` |
| `SIIGO_DEFAULT_TAX_ID` | `17085` | IVA 0 % (el `12967` es IVA 19 %) | `GET /v1/taxes` |
| `SIIGO_PAYMENT_TYPE_ID` | — | Forma de pago | `GET /v1/payment-types` |
| `SIIGO_DEFAULT_SELLER_ID` | — | Vendedor por defecto | `GET /api/integrations/siigo/sellers` |
| `SIIGO_QUOTE_MAX_RETRIES` | `3` | Intentos ante errores transitorios | |
| `SIIGO_QUOTE_RETRY_BASE_MS` | `1000` | Espera base del backoff exponencial | |

### Asignar vendedores

Cada asesor debe tener `siigo_seller_id` (el ID numérico del usuario en SIIGO):

1. `GET /api/integrations/siigo/sellers` para ver los IDs.
2. `PUT /api/users/:id` con `{ "siigoSellerId": 1374 }`.

### Link del PDF

SIIGO no siempre devuelve el link del PDF al crear la cotización. Si falta, el botón **Obtener link** llama a `POST /quotes/:id/refresh-url`, que vuelve a consultar SIIGO. Si el plan no incluye PDF, el enlace queda en `null`.

## Checklist para enviar una cotización sin errores

- [ ] Productos sincronizados desde SIIGO (todos con `siigo_id`).
- [ ] La empresa del cliente tiene NIT real y existe en SIIGO (importada o exportada).
- [ ] El asesor de la cotización tiene `siigo_seller_id`, o está definido `SIIGO_DEFAULT_SELLER_ID`.
- [ ] Credenciales válidas (`POST /test-connection` responde `ok: true`).
