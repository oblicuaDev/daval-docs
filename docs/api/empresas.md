---
sidebar_position: 8
title: Empresas y sucursales
---

# Empresas y sucursales

Archivo: `api/src/routes/admin.js` (router `companies`) · Prefijo: `/api/companies`

Una **empresa** es el cliente B2B (identificado por NIT). Una **sucursal** es un punto de entrega de esa empresa y define la ruta y el asesor.

## Objeto `Company`

```json
{
  "id": "…",
  "name": "Ferretería Norte",
  "nit": "900123456-7",
  "email": "contacto@ferreteria-norte.com",
  "phone": "601-234-5678",
  "address": "Cra 7 # 15-30, Bogotá",
  "active": true,
  "branches": [
    {
      "id": "…",
      "name": "Sede Principal",
      "address": "Cra 7 # 15-30",
      "city": "Bogotá",
      "routeId": "…",
      "advisorId": "…",
      "active": true,
      "latitude": 4.6097,
      "longitude": -74.0817
    }
  ]
}
```

---

## `GET /api/companies`

Lista todas las empresas con sus sucursales.

**Acceso:** Autenticado · **Respuesta `200`:** `{ "items": [ Company ] }`

---

## `POST /api/companies`

Crea una empresa. **Es público** para permitir el auto-registro desde la pantalla de login.

**Acceso:** Público

**Body**

| Campo | Tipo | Requerido | Por defecto |
|---|---|---|---|
| `name` | string | Sí | |
| `nit` | string | Sí (único) | |
| `email` | email | No | |
| `phone` | string | No | |
| `address` | string | No | |
| `active` | boolean | No | `true` |

**Respuesta `201`:** `{ "id": "<uuid>" }`

**Efecto secundario:** envía al administrador un correo "Nuevo registro: Empresa" (si `ADMIN_NOTIFICATION_EMAIL` está configurado).

**Errores:** `409 DUPLICATE_NIT` si ya existe una empresa con ese NIT.

---

## `PUT /api/companies/:id`

**Acceso:** admin. Mismos campos, opcionales (`COALESCE`: `null` no borra).

**Respuesta `200`:** `{ "id": "<uuid>" }` · **Errores:** `404 NOT_FOUND`.

## `DELETE /api/companies/:id`

Borra la empresa y, en cascada, sus sucursales. Usuarios y cotizaciones quedan con `company_id = NULL`.

**Acceso:** admin · **Respuesta `204`**

---

## `POST /api/companies/:id/branches`

Crea una sucursal.

**Acceso:** Público (auth opcional)

**Body**

| Campo | Tipo | Requerido | Notas |
|---|---|---|---|
| `name` | string | Sí | |
| `address` | string | No | |
| `city` | string | No | |
| `latitude`, `longitude` | número \| null | No | Coordenadas (Google Maps) |
| `routeId` | uuid \| null | No | **Solo se aplica si quien llama es admin** |
| `advisorId` | uuid \| null | No | **Solo se aplica si quien llama es admin** |
| `active` | boolean | No | Por defecto `true` |

**Respuesta `201`:** `{ "id": "<uuid>" }`

**Efecto secundario:** si un admin crea la sucursal con asesor, se envían dos correos: "Nueva empresa asignada" al asesor y "Tu asesor comercial" al email de la empresa.

---

## `PUT /api/companies/:id/branches/:branchId`

Actualiza la sucursal. Mismos campos, opcionales.

**Acceso:** admin

:::caution[No se puede desasignar con `null`]
La actualización usa `COALESCE`, así que enviar `routeId: null` o `advisorId: null` **no** quita la ruta ni el asesor.
:::

**Efecto secundario:** si `advisorId` cambia a un asesor distinto, se envían los mismos dos correos de asignación.

**Respuesta `200`:** `{ "id": "<uuid>" }` · **Errores:** `404 NOT_FOUND` si la sucursal no pertenece a la empresa.

## `DELETE /api/companies/:id/branches/:branchId`

**Acceso:** admin · **Respuesta `204`**

---

## Sincronización con SIIGO

Las empresas se pueden importar desde SIIGO o exportar hacia SIIGO. Ver [SIIGO → Clientes](./siigo.md#clientes).
