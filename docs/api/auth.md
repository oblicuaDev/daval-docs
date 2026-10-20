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
    "branchId": null,
    "mustChangePassword": false
  }
}
```

Si `mustChangePassword` es `true`, el usuario entró con una contraseña temporal: ver [Cambio de contraseña obligatorio](#cambio-de-contraseña-obligatorio).

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
| 401 | `INVALID_REFRESH_TOKEN` | Firma inválida, vencido, o la sesión fue revocada (contraseña cambiada o usuario desactivado después de emitirlo) |
| 401 | `USER_INACTIVE` | El usuario ya no existe o fue desactivado |

---

## `POST /api/auth/change-password`

El usuario autenticado cambia su propia contraseña. Acepta tokens con cambio de contraseña pendiente.

**Acceso:** Autenticado

**Body**

| Campo | Tipo | Requerido |
|---|---|---|
| `currentPassword` | string | Sí |
| `newPassword` | string (mín. 8, distinta de la actual) | Sí |

**Respuesta `200`:** misma forma que `/login`, con tokens nuevos y `mustChangePassword: false`. Al cambiar la contraseña se revocan los refresh tokens anteriores ([Revocación de sesiones](#revocación-de-sesiones)).

**Errores**

| HTTP | `error` | Causa |
|---|---|---|
| 400 | `VALIDATION_ERROR` | Nueva contraseña de menos de 8 caracteres |
| 400 | `SAME_PASSWORD` | La nueva es igual a la actual |
| 400 | `INVALID_CURRENT_PASSWORD` | La contraseña actual no es correcta |
| 401 | `USER_INACTIVE` | El usuario ya no existe o fue desactivado |

---

## `GET /api/auth/me`

Devuelve el usuario autenticado. Para clientes incluye su lista de precios. Acepta tokens con cambio de contraseña pendiente.

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
   └─ refresh vencido, revocado o usuario inactivo ─► 401 ─► evento daval:logout ─► /login
```

Las duraciones se configuran con `JWT_EXPIRES_IN` y `JWT_REFRESH_EXPIRES_IN`.

### Cambio de contraseña obligatorio

Cuando un admin crea un usuario con una contraseña temporal (`mustChangePassword: true` en [`POST /api/users`](./usuarios.md#post-apiusers)), `users.must_change_password` queda en `true`:

1. `/login` y `/refresh` devuelven `user.mustChangePassword: true` y el access token lleva el claim `pwc`.
2. Con ese token, todo el API responde `403 PASSWORD_CHANGE_REQUIRED`, salvo `GET /auth/me` y `POST /auth/change-password`. Las rutas con autenticación opcional (auto-registro) lo tratan como anónimo.
3. El frontend lleva al usuario a `/cambiar-contrasena` hasta que la cambie.
4. `POST /auth/change-password` limpia la marca y devuelve tokens nuevos sin `pwc`.

### Revocación de sesiones

El refresh token lleva `tv`, la `users.token_version` del momento en que se emitió. Un trigger en la base incrementa `token_version` cuando cambia la contraseña (`password_hash`) o el usuario se desactiva, aunque el cambio se haga directo por SQL. Desde ese momento `POST /auth/refresh` rechaza los refresh tokens anteriores.

El access token ya emitido sigue siendo válido hasta que vence (`JWT_EXPIRES_IN`, 8 h por defecto). Para cortar **todas** las sesiones de inmediato, rota `JWT_SECRET` y `JWT_REFRESH_SECRET`. Ver [Credenciales y seguridad](../guias/credenciales.md).
