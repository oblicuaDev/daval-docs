---
sidebar_position: 13.7
title: Webhooks
---

# Webhooks

Archivos: `api/src/services/webhooks.js` · `api/src/routes/webhooks.js` · Prefijo de administración: `/api/webhooks`

DAVAL avisa a un servicio externo (el chatbot de WhatsApp) con una petición `POST` cada vez que algo cambia, para que no tenga que consultar la API constantemente. Esta página explica **qué se envía, cómo validarlo y qué pasa cuando falla**. Para consultar datos a demanda, ver [API para el chatbot](./integraciones-chatbot.md).

## Resumen

| | |
|---|---|
| Método | `POST` con cuerpo JSON a la URL registrada |
| Autenticidad | Firma HMAC-SHA256 en la cabecera `X-Daval-Signature` |
| Éxito | Cualquier respuesta `2xx` en menos de 8 segundos |
| Reintentos | Hasta 8 intentos en unos 2 días, con espera creciente |
| Garantía | **Al menos una vez**: un evento puede llegar repetido. Deduplica por `id` |
| Orden | **No garantizado**. Usa `createdAt` o consulta la API ante la duda |

## Eventos

| Evento | Cuándo se envía |
|---|---|
| `quotation.created` | Se creó una cotización (web o chatbot) |
| `quotation.status_changed` | Cambió el estado de una cotización |
| `quotation.approved` | Una cotización pasó a `approved` |
| `quotation.rejected` | Una cotización pasó a `rejected` |
| `quotation.comment_added` | Se agregó un comentario a una cotización |
| `client.created` | Se creó un cliente |
| `client.updated` | Cambió un cliente: nombre, email, empresa, sucursal, lista de precios, estado o **teléfonos** |
| `branch.updated` | Cambió una sucursal: nombre, dirección, ciudad, **ruta**, **asesor** o estado |
| `route.updated` | Cambió una ruta: nombre, **calendario** (días, frecuencia, cierre) o estado |
| `ping` | Solo de prueba (`POST /api/webhooks/:id/test`). No se puede suscribir |

`quotation.approved` y `quotation.rejected` se envían **además** de `quotation.status_changed` cuando el nuevo estado es ese. Suscríbete solo a lo que necesites: con `quotation.status_changed` ya recibes todos los cambios de estado.

Los eventos de cotización se pueden **filtrar por origen** al registrar el endpoint (`sources`: `web`, `whatsapp`). Por ejemplo, un endpoint con `sources: ["whatsapp"]` solo recibe las cotizaciones creadas por el chatbot. El filtro no afecta a los eventos de clientes, sucursales y rutas.

Los cambios hechos directamente en la base de datos también generan eventos: se registran con triggers en la misma transacción del cambio, así que no se pierde ninguno ni se envía uno de un cambio que se deshizo.

## Qué recibe el servicio externo

### Cabeceras

| Cabecera | Descripción |
|---|---|
| `Content-Type` | `application/json` |
| `User-Agent` | `Daval-Webhooks/1` |
| `X-Daval-Event` | Tipo de evento, por ejemplo `quotation.status_changed` |
| `X-Daval-Event-Id` | Id del evento. **Igual en todos los reintentos**: úsalo para deduplicar |
| `X-Daval-Delivery-Id` | Id de este envío (el mismo en todos sus reintentos) |
| `X-Daval-Delivery-Attempt` | Número de intento: `1`, `2`, … |
| `X-Daval-Signature` | Firma. Ver [Verificar la firma](#verificar-la-firma) |

### Cuerpo

```json
{
  "id": "6f1c0a52-0f0e-4a43-9c5a-4a1d3f0f9a11",
  "type": "quotation.status_changed",
  "apiVersion": "2026-10-05",
  "createdAt": "2026-10-05T21:14:03.120Z",
  "data": { }
}
```

`id` es el id del evento (igual a `X-Daval-Event-Id`). `data` depende del tipo. Las entidades (`quotation`, `client`, …) reflejan su **estado al momento de enviar**, que puede ser más reciente que el evento si hubo un reintento tardío.

### `quotation.created`

```json
{
  "quotation": {
    "id": "…", "code": "COT-000123", "status": "pending", "source": "whatsapp",
    "total": 72000, "notes": "Entregar en bodega", "routeDate": "2026-10-08",
    "clientId": "…", "clientName": "Ferretería El Tornillo",
    "company": { "id": "…", "name": "Ferretería El Tornillo S.A.S." },
    "branch": { "id": "…", "name": "Sede Norte" },
    "advisor": { "id": "…", "name": "Carlos Asesor" },
    "siigo": { "quotationId": null, "url": null },
    "createdAt": "…", "updatedAt": "…",
    "items": [
      { "sku": "001001", "name": "Martillo Carpintero 16oz", "quantity": 2,
        "unitPrice": 30000, "priceType": "promotion", "subtotal": 60000 }
    ]
  }
}
```

### `quotation.status_changed` · `quotation.approved` · `quotation.rejected`

```json
{
  "status": "approved",
  "previousStatus": "pending",
  "quotation": { "…": "mismo objeto que en quotation.created" }
}
```

`status` y `previousStatus` describen **este evento**. Estados posibles: `draft`, `sent`, `pending`, `approved`, `rejected`, `synced`, `sent_to_siigo`. Cuando una cotización se envía a SIIGO, pasa a `synced` y `quotation.siigo` trae el número y el enlace.

### `quotation.comment_added`

```json
{
  "comment": {
    "id": "…", "text": "Pedido confirmado", "createdAt": "…",
    "author": { "id": "…", "name": "Carlos Asesor", "role": "advisor" }
  },
  "quotation": { "…": "mismo objeto que en quotation.created" }
}
```

### `client.created` · `client.updated`

```json
{
  "changes": ["phones"],
  "client": {
    "id": "…", "name": "Ferretería El Tornillo", "email": null, "nit": "900123456-7", "active": true,
    "company": { "id": "…", "name": "Ferretería El Tornillo S.A.S." },
    "branch": { "id": "…", "name": "Sede Norte" },
    "priceList": { "id": "…", "name": "Lista Mayorista" },
    "phones": [ { "phone": "+573001234567", "label": "Dueño" } ]
  }
}
```

`changes` lista qué cambió: `name`, `email`, `active`, `company`, `branch`, `priceList`, `phones`. Si cambian los teléfonos, vuelve a identificar al cliente.

### `branch.updated`

```json
{
  "changes": ["route"],
  "branch": {
    "id": "…", "name": "Sede Norte", "city": "Bogotá", "address": "Calle 100 # 15-20", "active": true,
    "company": { "id": "…", "name": "…" },
    "advisor": { "id": "…", "name": "Carlos Asesor" },
    "route": { "id": "…", "name": "Ruta Norte", "schedule": "Lunes y Jueves · cierra 1 día antes a las 16:00" }
  }
}
```

### `route.updated`

```json
{
  "changes": ["cutoffTime"],
  "route": {
    "id": "…", "name": "Ruta Norte", "active": true,
    "schedule": {
      "operationDays": [1, 4], "frequency": "weekly", "anchorDate": null,
      "cutoffDaysBefore": 1, "cutoffTime": "16:00",
      "label": "Lunes y Jueves · cierra 1 día antes a las 16:00"
    },
    "branchIds": ["…", "…"]
  }
}
```

`branchIds` son las sucursales activas que usan la ruta: vuelve a consultar [`/integrations/cutoff`](./integraciones-chatbot.md#ventana-de-corte) para ellas y para tus recordatorios.

### `ping`

```json
{ "message": "Evento de prueba de Daval" }
```

## Verificar la firma

**Valida siempre la firma.** Sin ella, cualquiera que conozca tu URL puede enviarte eventos falsos.

`X-Daval-Signature` tiene la forma:

```text
t=1791234567,v1=5257a869e7ecebeda32affa62cdca3fa51cad7e77a0e56ff536d0ce8e108d8bd
```

- `t`: momento del envío, en segundos Unix.
- `v1`: `HMAC-SHA256(secreto, "<t>.<cuerpo>")` en hexadecimal. El secreto es el que recibiste al registrar el endpoint (`whsec_…`), y `<cuerpo>` es el **cuerpo crudo**, byte a byte, tal como llegó (no el JSON reserializado).
- Durante una [rotación de secreto](#rotar-el-secreto) puede haber **dos** `v1` (uno con el secreto nuevo y otro con el anterior). Basta con que **uno** coincida.

Pasos:

1. Separa `t` y los `v1` de la cabecera.
2. Rechaza si `t` difiere más de **5 minutos** de la hora actual (evita repeticiones de un envío interceptado).
3. Calcula el HMAC con el cuerpo crudo y compara con **comparación en tiempo constante**.
4. Rechaza con `401` si ninguna firma coincide.
5. Deduplica por `id` del evento.

### Node.js (Express)

```js
import crypto from 'crypto';
import express from 'express';

const SECRET = process.env.DAVAL_WEBHOOK_SECRET; // whsec_…
const app = express();

// Importante: el cuerpo crudo, no express.json()
app.post('/webhooks/daval', express.raw({ type: 'application/json' }), (req, res) => {
  const header = req.header('x-daval-signature') ?? '';
  const t = header.match(/t=(\d+)/)?.[1];
  const sigs = [...header.matchAll(/v1=([0-9a-f]+)/g)].map(m => m[1]);
  if (!t || !sigs.length || Math.abs(Date.now() / 1000 - Number(t)) > 300) return res.sendStatus(401);

  const expected = crypto.createHmac('sha256', SECRET).update(`${t}.${req.body}`).digest('hex');
  const ok = sigs.some(s => s.length === expected.length &&
    crypto.timingSafeEqual(Buffer.from(s), Buffer.from(expected)));
  if (!ok) return res.sendStatus(401);

  const event = JSON.parse(req.body);
  // 1) guarda event.id para no procesarlo dos veces; 2) responde YA; 3) procesa después
  res.sendStatus(200);
  handleEvent(event);
});
```

### Python (Flask)

```python
import hmac, hashlib, os, re, time
from flask import Flask, request, abort

SECRET = os.environ["DAVAL_WEBHOOK_SECRET"].encode()
app = Flask(__name__)

@app.post("/webhooks/daval")
def daval_webhook():
    header = request.headers.get("X-Daval-Signature", "")
    t = re.search(r"t=(\d+)", header)
    sigs = re.findall(r"v1=([0-9a-f]+)", header)
    if not t or not sigs or abs(time.time() - int(t.group(1))) > 300:
        abort(401)
    body = request.get_data()  # cuerpo crudo
    expected = hmac.new(SECRET, f"{t.group(1)}.".encode() + body, hashlib.sha256).hexdigest()
    if not any(hmac.compare_digest(s, expected) for s in sigs):
        abort(401)
    event = request.get_json()
    # deduplica por event["id"], responde 200 y procesa después
    return "", 200
```

## Cómo debe responder el receptor

- Responde **`2xx` en menos de 8 segundos**. Guarda el evento y procésalo después: no hagas trabajo pesado dentro de la petición.
- Cualquier otra respuesta cuenta como fallo y se reintenta: `4xx`, `5xx`, timeout o error de conexión.
- Una **redirección (`3xx`) cuenta como fallo y no se sigue**. Registra la URL final.
- Sé **idempotente**: el mismo evento (`id`) puede llegar más de una vez.

## Reintentos

| Intento | Espera antes de intentar de nuevo |
|---|---|
| 1 | Inmediato, al ocurrir el cambio |
| 2 | 1 minuto |
| 3 | 5 minutos |
| 4 | 30 minutos |
| 5 | 2 horas |
| 6 | 6 horas |
| 7 | 12 horas |
| 8 | 24 horas |

Si el intento 8 también falla, el envío queda en estado `failed` y no se reintenta solo. Un administrador puede reenviarlo (`POST /api/webhooks/deliveries/:id/retry`) cuando el receptor esté arreglado.

:::note[Cuándo se reintenta de verdad]
Daval corre en funciones serverless, sin un proceso permanente. Los envíos pendientes se procesan (1) justo después de cada cambio, y (2) cuando vence una espera y hay actividad en la plataforma, (3) con un cron de respaldo diario. Por eso, si no hay actividad, **un reintento puede demorar más que la espera de la tabla**. Para que se respete al minuto, un programador externo debe llamar cada minuto a `GET /api/cron/webhooks` con el `CRON_SECRET`.
:::

## Seguridad de los destinos

- La URL debe ser **`https`**, sin usuario ni contraseña.
- No se aceptan direcciones internas ni privadas: `localhost`, `*.local`, `*.internal`, `10.x`, `172.16–31.x`, `192.168.x`, `127.x`, `169.254.x` (metadatos de la nube), `100.64–127.x` y sus equivalentes IPv6. Tampoco nombres que **resuelvan** a ellas. Se valida al registrar y en cada envío.
- El secreto de firma se guarda en la base para poder firmar y solo se muestra al crearlo o rotarlo. Trátalo como una contraseña.

## Administración (admin)

Todos los endpoints requieren rol `admin`.

### `GET /api/webhooks/events`

Catálogo de eventos y versión de la API.

### `POST /api/webhooks`

Registra un endpoint. Máximo 10.

```json
{
  "name": "Chatbot WhatsApp",
  "url": "https://api.boostify.example/webhooks/daval",
  "events": ["quotation.status_changed", "quotation.comment_added", "client.updated", "branch.updated", "route.updated"],
  "sources": ["whatsapp"]
}
```

| Campo | Tipo | Requerido |
|---|---|---|
| `name` | string | Sí |
| `url` | string `https` | Sí |
| `events` | string[] (de la tabla de eventos, sin `ping`) | Sí, mínimo 1 |
| `sources` | `["web"]`, `["whatsapp"]` o ambos | No. Sin él, todos los orígenes |

**Respuesta `201`:** el endpoint más `"secret": "whsec_…"`. **Es la única vez que se muestra completo.** Entrégalo al equipo externo por un canal seguro (ver [Credenciales y seguridad](../guias/credenciales.md#entregar-un-key)).

### `GET /api/webhooks`

Lista los endpoints (sin secreto, solo `secretHint`) con `lastSuccessAt`, `lastFailureAt` y `stats`: envíos pendientes y entregados/fallidos en las últimas 24 h.

### `PATCH /api/webhooks/:id`

Cambia `name`, `url`, `events`, `sources` (`null` = todos) o `active`. Un endpoint con `active: false` deja de recibir eventos y no acumula pendientes.

### `POST /api/webhooks/:id/test`

Envía un `ping` y devuelve el resultado en el momento, sin reintentos:

```json
{ "deliveryId": "…", "ok": true, "statusCode": 200, "error": null, "durationMs": 25, "status": "delivered", "attempts": 1 }
```

### Rotar el secreto

`POST /api/webhooks/:id/rotate-secret` con `{ "graceHours": 24 }` (0–168, por defecto 24). Devuelve el secreto nuevo. Durante la gracia, los envíos llevan **dos firmas** (nueva y anterior), así que el receptor cambia de secreto sin perder eventos. Con `graceHours: 0` el anterior deja de valer de inmediato (úsalo si el secreto se expuso).

### `GET /api/webhooks/:id/deliveries`

Historial de envíos. **Query:** `status` (`pending`, `delivered`, `failed`), `limit` (por defecto 50, máximo 200).

```json
{
  "items": [
    { "id": "…", "eventId": "…", "type": "quotation.status_changed", "status": "failed", "attempts": 8,
      "nextAttemptAt": null, "lastAttemptAt": "…", "deliveredAt": null,
      "lastStatusCode": 500, "lastError": "HTTP 500: boom", "createdAt": "…" }
  ]
}
```

### `POST /api/webhooks/deliveries/:id/retry`

Reenvía un envío (en cualquier estado) y devuelve el resultado. Reinicia el conteo de intentos.

### `DELETE /api/webhooks/:id`

Elimina el endpoint y su historial.

## Retención

Los eventos y su historial de envíos se conservan 30 días.
