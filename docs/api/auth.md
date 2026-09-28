---
sidebar_position: 2
title: Autenticación
---

# Autenticación

Archivo: `api/src/routes/auth.js` · Prefijo: `/api/auth`

## `POST /api/auth/login`

Inicia sesión con email y contraseña.

**Acceso:** Público

**Body**

| Campo | Tipo | Requerido |
|---|---|---|
| `email` | string (email) | Sí |
| `password` | string | Sí |

```json
{ "email": "usuario@empresa.com", "password": "••••••••" }
```

**Respuesta `200`**

```json
{
  "token": "eyJhbGciOi...",
  "refreshToken": "eyJhbGciOi...",
  "user": {
    "id": "22222222-0001-0000-0000-000000000001",
    "name": "Admin Daval",
    "email": "admin@daval.com",
    "role": "admin",
    "companyId": null,
    "branchId": null
  }
}
```

**Errores**

| HTTP | `error` | Causa |
|---|---|---|
| 400 | `VALIDATION_ERROR` | Email mal formado o contraseña vacía |
| 401 | `INVALID_CREDENTIALS` | Usuario inexistente, inactivo o contraseña incorrecta |

---

## `POST /api/auth/refresh`

Emite un access token y un refresh token nuevos (rotación). El frontend lo llama automáticamente cuando recibe un `401`.

**Acceso:** Público (requiere un refresh token válido)

**Body**

```json
{ "refreshToken": "eyJhbGciOi..." }
```

**Respuesta `200`:** misma forma que `/login` (`token`, `refreshToken`, `user`).

**Errores**

| HTTP | `error` | Causa |
|---|---|---|
| 400 | `MISSING_TOKEN` | No se envió `refreshToken` |
| 401 | `INVALID_REFRESH_TOKEN` | Firma inválida o vencido |
| 401 | `USER_INACTIVE` | El usuario ya no existe o fue desactivado |

---

## `GET /api/auth/me`

Devuelve el usuario autenticado. Para clientes incluye su lista de precios.

**Acceso:** Autenticado

**Respuesta `200`**

```json
{
  "user": {
    "id": "22222222-0003-0000-0000-000000000001",
    "name": "Juan Cliente",
    "email": "cliente@daval.com",
    "role": "client",
    "companyId": "…",
    "branchId": "…",
    "priceListId": "…"
  }
}
```

**Errores:** `401` sin token o token inválido; `404 USER_NOT_FOUND`.

---

## Ciclo de vida de los tokens

```text
login ──► token (8h) + refreshToken (30d)
   │
   ├─ petición con token ─► 200
   ├─ petición con token vencido ─► 401
   │     └─ frontend: POST /auth/refresh ─► tokens nuevos ─► reintenta la petición
   └─ refresh vencido o usuario inactivo ─► 401 ─► evento daval:logout ─► /login
```

Las duraciones se configuran con `JWT_EXPIRES_IN` y `JWT_REFRESH_EXPIRES_IN`.
