---
sidebar_position: 9.5
title: Clientes
---

# Clientes

Archivo: `api/src/routes/clients.js` · Prefijo: `/api/clients`

Administración de clientes (tabla `clients`), **con o sin usuario de login**. Un cliente sin login se atiende solo por WhatsApp: el chatbot lo identifica por sus teléfonos y cotiza en su nombre.

- Ruta y asesor se toman de la sucursal; no se envían.
- La lista de precios es por cliente.
- Para crear un cliente **con** login usa [`POST /api/users`](./usuarios.md) (rol `client`); después se administra aquí igual que cualquier otro.

**Acceso:** admin en todos los endpoints.

## Objeto `Client`

```json
{
  "id": "…",
  "name": "Ferretería El Tornillo",
  "nit": "900123456-7",
  "email": null,
  "active": true,
  "createdAt": "…",
  "userId": null,
  "userEmail": null,
  "hasLogin": false,
  "companyId": "…", "companyName": "Ferretería El Tornillo S.A.S.",
  "branchId": "…", "branchName": "Sede Norte",
  "priceListId": "…", "priceListName": "Lista Mayorista",
  "routeName": "Ruta Norte",
  "advisorName": "Carlos Asesor",
  "phones": [
    { "id": "…", "phone": "+573001234567", "label": "Dueño", "isWhatsapp": true }
  ]
}
```

`routeName` y `advisorName` son los de la sucursal del cliente.

---

## `GET /api/clients`

Lista todos los clientes, con y sin login, ordenados por nombre.

**Respuesta `200`:** `{ "items": [ Client ] }`

## `GET /api/clients/:id`

**Respuesta `200`:** `Client` · **Errores:** `404 NOT_FOUND`.

---

## `POST /api/clients`

Crea un cliente **sin** usuario de login.

**Body**

| Campo | Tipo | Requerido | Notas |
|---|---|---|---|
| `name` | string | Sí | |
| `companyId` | uuid | Sí | |
| `branchId` | uuid | Sí | Activa y de `companyId`; define ruta y asesor |
| `email` | email \| null | No | |
| `nit` | string \| null | No | Por defecto se usa el NIT de la empresa si está libre; si no, un placeholder `NIT-xxxxxxxx` |
| `priceListId` | uuid \| null | No | `null` = lista general |
| `active` | boolean | No | Por defecto `true` |
| `phones` | `[{ phone, label? }]` | No | Ver [Teléfonos](#teléfonos) |

```json
{
  "name": "Ferretería El Tornillo",
  "companyId": "…",
  "branchId": "…",
  "phones": [{ "phone": "300 123 4567", "label": "Dueño" }]
}
```

**Respuesta `201`:** `{ "id": "<clients.id>" }`

**Errores:** `400 INVALID_PHONE`, `404 BRANCH_NOT_FOUND`, `404 PRICE_LIST_NOT_FOUND`, `409 DUPLICATE_NIT`.

---

## `PUT /api/clients/:id`

Actualiza cualquier subconjunto de `name`, `email`, `nit`, `priceListId`, `companyId`, `branchId`, `active`.

- Si cambia la empresa o la sucursal, se validan juntas (la sucursal debe ser de la empresa) y se actualizan la ruta y el asesor del cliente.
- Si el cliente tiene login, la empresa y la sucursal también se actualizan en su usuario.

**Respuesta `200`:** `{ "id": "<uuid>" }` · **Errores:** `400 EMPTY_PATCH`, `404 NOT_FOUND`, `404 BRANCH_NOT_FOUND`, `404 PRICE_LIST_NOT_FOUND`, `409 DUPLICATE_NIT`.

---

## Teléfonos

Los teléfonos se guardan normalizados a **E.164** (`api/src/lib/phone.js`). Es el único criterio con el que el chatbot identifica a un cliente: coincidencia exacta del número normalizado.

| Entrada | Se guarda como |
|---|---|
| `+57 300 123 4567` | `+573001234567` |
| `300 123 4567`, `(300) 123-4567` | `+573001234567` |
| `573001234567` | `+573001234567` |
| `6012345678` (fijo sin código de país) | rechazado: `400 INVALID_PHONE` |

Un mismo número puede registrarse en varios clientes (por ejemplo, el dueño de dos empresas). No se puede repetir dentro del mismo cliente.

### `POST /api/clients/:id/phones`

**Body:** `{ "phone": "300 123 4567", "label": "Bodega" }`

**Respuesta `201`:** `{ "id": "…", "phone": "+573001234567", "label": "Bodega", "isWhatsapp": true }`

**Errores:** `400 INVALID_PHONE`, `404 NOT_FOUND`, `409 DUPLICATE_PHONE`.

### `DELETE /api/clients/:id/phones/:phoneId`

**Respuesta `204`** · **Errores:** `404 NOT_FOUND`.
