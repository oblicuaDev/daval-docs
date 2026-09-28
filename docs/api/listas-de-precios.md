---
sidebar_position: 7
title: Listas de precios
---

# Listas de precios

Archivo: `api/src/routes/admin.js` (router `priceLists`) · Prefijo: `/api/price-lists`

Una lista de precios define cuánto paga un cliente. Cada producto puede tener un **precio específico** en la lista; si no lo tiene, se calcula como `base_price × multiplier`. Ver [Reglas de negocio → Precios](../arquitectura/reglas-de-negocio.md#precios).

## `GET /api/price-lists`

**Acceso:** Autenticado

**Respuesta `200`**

```json
{
  "items": [
    {
      "id": "…",
      "name": "Mayorista",
      "description": "Clientes con volumen",
      "multiplier": 0.9,
      "is_default": false,
      "isDefault": false,
      "active": true,
      "scope": "selected",
      "clientIds": ["<users.id>", "<users.id>"]
    }
  ]
}
```

| Campo | Descripción |
|---|---|
| `scope` | `all` si es la lista general (`isDefault`), `selected` si no |
| `clientIds` | IDs de **usuario** (`users.id`) de los clientes que tienen esta lista asignada |

## `POST /api/price-lists`

**Acceso:** admin

| Campo | Tipo | Requerido | Por defecto |
|---|---|---|---|
| `name` | string | Sí (único) | |
| `description` | string | No | |
| `multiplier` | número > 0 | No | 1 |
| `isDefault` | boolean | No | `false` |
| `active` | boolean | No | `true` |

Solo puede existir **una** lista con `isDefault = true` (índice único parcial). Para cambiar la lista por defecto, desmarca primero la actual.

**Respuesta `201`:** `{ "id": "<uuid>" }`

## `PUT /api/price-lists/:id/clients`

Define a quién aplica la lista.

**Acceso:** admin

**Body**

| Campo | Tipo | Descripción |
|---|---|---|
| `scope` | `all` \| `selected` | `all`: la lista pasa a ser la **lista general** (se desmarca la anterior). No cambia las asignaciones explícitas de ningún cliente. `selected`: se asigna exactamente a `userIds` |
| `userIds` | uuid[] | IDs de usuario cliente. Con `selected`, los clientes que tenían la lista y no vienen aquí vuelven a la lista general |

```json
{ "scope": "selected", "userIds": ["0b56…", "db45…"] }
```

**Respuesta `200`:** `{ "id": "<uuid>", "scope": "selected", "assigned": 2 }` · **Errores:** `404 NOT_FOUND`.

## `PUT /api/price-lists/:id`

**Acceso:** admin. Mismos campos, opcionales (`COALESCE`).

**Respuesta `200`:** `{ "id": "<uuid>" }` · **Errores:** `404 NOT_FOUND`.

## `DELETE /api/price-lists/:id`

Borra la lista y sus precios específicos. Los clientes que la usaban quedan sin lista y pasan a usar la lista por defecto.

**Acceso:** admin · **Respuesta `204`**

---

## `GET /api/price-lists/:id/products`

Todos los productos con su precio base y, si existe, su precio específico en esta lista.

**Acceso:** Autenticado

**Respuesta `200`**

```json
{
  "items": [
    {
      "productId": "…",
      "sku": "TOR-001",
      "name": "Tornillo drywall 6x1",
      "unit": "caja",
      "active": true,
      "basePrice": 10000,
      "customPrice": 8800
    }
  ]
}
```

`customPrice` es `null` si el producto no tiene precio específico.

## `POST /api/price-lists/:id/products`

Reemplaza **todos** los precios específicos de la lista por los enviados (borra y vuelve a insertar en una transacción). Enviar `items: []` elimina todos los precios específicos.

**Acceso:** admin

**Body**

```json
{
  "items": [
    { "productId": "a1b2…", "price": 8800 },
    { "productId": "c3d4…", "price": 15500 }
  ]
}
```

**Respuesta `200`:** `{ "updated": 2 }` · **Errores:** `404 NOT_FOUND` si la lista no existe.
