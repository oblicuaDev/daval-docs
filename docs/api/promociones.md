---
sidebar_position: 9
title: Promociones
---

# Promociones

Archivo: `api/src/routes/admin.js` (router `promotions`) · Prefijo: `/api/promotions`

Una promoción fija precios especiales por **SKU** durante un periodo. Si el precio promocional es menor que el de la lista del cliente, gana la promoción. Ver [Reglas de negocio → Precios](../arquitectura/reglas-de-negocio.md#precios).

| Concepto | Valores |
|---|---|
| `kind` | `eventual`: tiene fecha de fin (obligatoria). `permanent`: sin fecha de fin |
| `scope` | `all`: aplica a todos los clientes. `specific`: solo a los de `clientIds` |

## Objeto `Promotion`

```json
{
  "id": "…",
  "name": "Semana del tornillo",
  "description": null,
  "kind": "eventual",
  "scope": "specific",
  "startsAt": "2026-10-01T00:00:00.000Z",
  "endsAt": "2026-10-07T23:59:59.000Z",
  "active": true,
  "prices": [ { "sku": "TOR-001", "price": 8500 } ],
  "clientIds": [ "…" ]
}
```

`clientIds` son IDs de la tabla `clients` (no de `users`).

---

## `GET /api/promotions`

Todas las promociones, las más recientes primero.

**Acceso:** Autenticado · **Respuesta `200`:** `{ "items": [ Promotion ] }`

---

## `POST /api/promotions`

Crea la promoción con sus precios y clientes en una transacción.

**Acceso:** admin

**Body**

| Campo | Tipo | Requerido | Notas |
|---|---|---|---|
| `name` | string | Sí | |
| `description` | string | No | |
| `kind` | `permanent` \| `eventual` | No | Por defecto `eventual` |
| `scope` | `all` \| `specific` | Sí | |
| `startsAt` | fecha ISO | Sí | |
| `endsAt` | fecha ISO \| null | Si `kind = eventual` | Debe ser posterior a `startsAt` |
| `active` | boolean | No | Por defecto `true` |
| `prices` | `[{ sku, price }]` | No | |
| `clientIds` | uuid[] | No | Solo se guarda si `scope = specific` |

```json
{
  "name": "Semana del tornillo",
  "kind": "eventual",
  "scope": "all",
  "startsAt": "2026-10-01T00:00:00-05:00",
  "endsAt": "2026-10-07T23:59:59-05:00",
  "prices": [ { "sku": "TOR-001", "price": 8500 } ]
}
```

**Respuesta `201`:** `{ "id": "<uuid>" }`

**Errores:** `400 VALIDATION_ERROR` con `fieldErrors.endsAt` si es eventual sin fecha de fin.

---

## `PUT /api/promotions/:id`

Actualiza la promoción.

**Acceso:** admin

- Los campos escalares son opcionales (`COALESCE`), **excepto `endsAt`**, que siempre se sobrescribe: si no lo envías queda en `NULL`. Envía siempre `endsAt` al editar una promoción eventual.
- Si envías `prices`, se reemplazan todos los precios.
- Si envías `clientIds`, se reemplazan todos los clientes.

**Respuesta `200`:** `{ "id": "<uuid>" }`

---

## `DELETE /api/promotions/:id`

Borra la promoción con sus precios y clientes.

**Acceso:** admin · **Respuesta `204`**
