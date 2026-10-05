---
sidebar_position: 10
title: Usuarios
---

# Usuarios

Archivo: `api/src/routes/admin.js` (router `users`) · Prefijo: `/api/users`

Gestiona las cuentas de acceso de los tres roles. Al crear un usuario `client` también se crea su ficha en la tabla `clients`.

## `GET /api/users`

**Acceso:** admin

**Query:** `role` (`admin` | `advisor` | `client`), opcional.

**Respuesta `200`**

```json
{
  "items": [
    {
      "id": "…",
      "name": "Juan Cliente",
      "email": "cliente@daval.com",
      "role": "client",
      "active": true,
      "companyId": "…", "companyName": "Ferretería Norte",
      "branchId": "…",  "branchName": "Sede Principal",
      "createdAt": "…",
      "siigoSellerId": null,
      "clientId": "…",
      "priceListId": "…", "priceListName": "Mayorista",
      "advisorId": "…",
      "routeId": "…"
    }
  ]
}
```

`clientId`, `priceListId`, `advisorId` y `routeId` vienen de la ficha `clients` (solo para rol `client`).

---

## `POST /api/users`

Crea un usuario.

**Acceso:** Público (auth opcional)

- **Sin token de admin** (auto-registro): el rol se fuerza a `client`. Enviar otro rol → `403 FORBIDDEN`.
- **Con token de admin**: se puede crear cualquier rol.

**Body**

| Campo | Tipo | Requerido | Notas |
|---|---|---|---|
| `name` | string | Sí | |
| `email` | email | Sí | Único |
| `password` | string (mín. 6) | Sí | Se guarda con bcrypt |
| `role` | `admin` \| `advisor` \| `client` | Sí para admin | |
| `companyId` | uuid \| null | No | Debe existir y estar activa |
| `branchId` | uuid \| null | No | Debe existir, estar activa y pertenecer a `companyId` |
| `priceListId` | uuid \| null | No | Solo clientes; debe existir y estar activa |
| `siigoSellerId` | entero > 0 \| null | No | Solo asesores (ID de vendedor en SIIGO) |
| `active` | boolean | No | Por defecto `true` |

**Proceso para rol `client`**

1. Valida empresa, sucursal y lista de precios.
2. En una transacción crea el usuario y la ficha `clients`, con su empresa y sucursal, que hereda **ruta y asesor de la sucursal** y usa el NIT de la empresa (o un placeholder `NIT-xxxxxxxx`).
3. Después de responder, envía "Nuevo cliente asignado" al asesor de la sucursal y "Nuevo registro: Cliente" al administrador.

**Respuesta `201`:** `{ "id": "<users.id>", "clientId": "<clients.id>" }`. `clientId` es `null` si el rol no es `client`.

Para crear un cliente **sin** usuario de login (solo WhatsApp), usa [`POST /api/clients`](./clientes.md).

**Errores**

| HTTP | `error` | Causa |
|---|---|---|
| 400 | `MISSING_PASSWORD` | Falta la contraseña |
| 400 | `BRANCH_COMPANY_MISMATCH` | La sucursal no es de esa empresa |
| 403 | `FORBIDDEN` | Auto-registro con un rol distinto de `client` |
| 404 | `COMPANY_NOT_FOUND` / `BRANCH_NOT_FOUND` / `PRICE_LIST_NOT_FOUND` | Referencia inválida o inactiva |
| 409 | `DUPLICATE_EMAIL` | Email ya registrado |

---

## `PUT /api/users/:id`

Actualiza un usuario.

**Acceso:** admin

**Body (todos opcionales):** `name`, `email`, `role`, `active`, `companyId`, `branchId`, `password` (se vuelve a hashear), `siigoSellerId` (acepta `null` para desasignar).

:::note
Si cambian `companyId` o `branchId` de un usuario cliente, también se actualizan la empresa y la sucursal de su ficha `clients`, junto con la ruta y el asesor de la nueva sucursal. La lista de precios se cambia desde [`PUT /api/clients/:id`](./clientes.md) o desde [listas de precios](./listas-de-precios.md).
:::

**Respuesta `200`:** `{ "id": "<uuid>" }` · **Errores:** `400 EMPTY_PATCH`, `404 NOT_FOUND`.

---

## `DELETE /api/users/:id`

Desactiva el usuario (`active = false`). Un usuario inactivo no puede iniciar sesión ni renovar su token.

**Acceso:** admin · **Respuesta `204`**
