---
sidebar_position: 12.5
title: Mi empresa (cliente)
---

# Mi empresa (autogestión del cliente)

Archivo: `api/src/routes/myCompany.js` · Prefijo: `/api/my-company`

Endpoints para la pantalla **Administrar empresa** del cliente. Todo queda acotado a la empresa del usuario autenticado (`users.company_id`, o la empresa de su sucursal). El cliente nunca envía `companyId`, rol, ruta, asesor ni lista de precios.

**Acceso de todos los endpoints:** client (otros roles reciben `403 FORBIDDEN`)

**Error común:** `404 NO_COMPANY` si el usuario no tiene empresa asignada.

## `GET /api/my-company`

Empresa, sucursales activas y usuarios activos.

```json
{
  "company": {
    "id": "…", "name": "Ferretería Norte", "nit": "900123456-7",
    "email": "…", "phone": "…", "address": "…"
  },
  "branches": [
    {
      "id": "…", "name": "Sede Principal", "city": "Bogotá", "address": "Cra 7 # 15-30",
      "routeId": "…", "routeName": "Ruta Norte", "routeDay": "Lunes"
    }
  ],
  "users": [
    {
      "id": "…", "name": "Juan Cliente", "email": "cliente@empresa.com",
      "branchId": "…", "branchName": "Sede Principal", "isMe": true
    }
  ]
}
```

---

## Usuarios

### `POST /api/my-company/users`

Crea un usuario `client` en la misma empresa.

| Campo | Tipo | Requerido |
|---|---|---|
| `name` | string | Sí |
| `email` | email | Sí (único) |
| `password` | string (mín. 6) | Sí |
| `branchId` | uuid \| null | No. Debe ser una sucursal activa de la empresa |

El nuevo usuario **hereda la lista de precios** de quien lo crea. La ruta y el asesor salen de la sucursal elegida (o de quien lo crea, si no se elige sucursal).

**Respuesta `201`:** `{ "id": "<uuid>" }`

**Errores:** `404 BRANCH_NOT_FOUND`, `409 DUPLICATE_EMAIL`.

### `PUT /api/my-company/users/:id`

Actualiza `name`, `email`, `password` y/o `branchId` de un usuario de la empresa. Si cambia la sucursal, se actualizan la ruta y el asesor de su ficha de cliente.

**Respuesta `200`:** `{ "id": "<uuid>" }`

**Errores:** `400 EMPTY_PATCH`, `404 NOT_FOUND` (el usuario no es de tu empresa), `404 BRANCH_NOT_FOUND`, `409 DUPLICATE_EMAIL`.

### `DELETE /api/my-company/users/:id`

Desactiva el usuario (no puede volver a ingresar; sus cotizaciones se conservan).

**Respuesta `204`**

**Errores**

| HTTP | `error` | Causa |
|---|---|---|
| 422 | `CANNOT_DELETE_SELF` | Intentas desactivar tu propio usuario |
| 422 | `LAST_USER` | Es el último usuario activo de la empresa |
| 404 | `NOT_FOUND` | El usuario no es de tu empresa |

---

## Sucursales

La ruta y el asesor de una sucursal los asigna DAVAL; estos endpoints no los modifican.

### `POST /api/my-company/branches`

| Campo | Tipo | Requerido |
|---|---|---|
| `name` | string | Sí |
| `city` | string | No |
| `address` | string | No |

**Respuesta `201`:** `{ "id": "<uuid>" }`

### `PUT /api/my-company/branches/:id`

Actualiza `name`, `city` y/o `address`.

**Respuesta `200`:** `{ "id": "<uuid>" }` · **Errores:** `404 BRANCH_NOT_FOUND`.

### `DELETE /api/my-company/branches/:id`

Desactiva la sucursal (`active = false`) para conservar el historial de cotizaciones.

**Respuesta `204`** · **Errores:** `422 LAST_BRANCH` si es la última sucursal activa, `404 BRANCH_NOT_FOUND`.
