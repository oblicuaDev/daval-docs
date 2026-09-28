---
sidebar_position: 13
title: API keys de integración
---

# API keys de integración

Archivo: `api/src/routes/apiKeys.js` · Prefijo: `/api/api-keys`

Credenciales para consumidores externos de solo lectura (por ejemplo, un chatbot) que necesitan leer datos de la API **sin ser un usuario de la plataforma**. A diferencia del login (`POST /auth/login`), un API key:

- No expira por tiempo — dura hasta que se revoca a mano.
- No tiene rol ni contraseña: solo un `name` y una lista de `scopes`.
- No identifica a ningún cliente ni asesor: es una credencial de **servicio**, no de una persona.

Ver también [Reglas de negocio](../arquitectura/reglas-de-negocio.md) y la guía de administración en el manual.

## Formato del key

```text
dvl_b7peXfy0D2z8vBpNxxOIsfCbAtrlSdRe
```

Se guarda solo su hash bcrypt (tabla `api_keys`). **El valor completo se muestra una única vez**, en la respuesta de `POST /api/api-keys`; después no se puede volver a consultar, solo revocar y generar uno nuevo.

## Scopes disponibles

| Scope | Habilita |
|---|---|
| `catalog:read` | `GET /api/categories` |

`GET /api/products/catalog` ya es público y no requiere key. Deliberadamente **no** hay scope para `GET /api/promotions` ni `GET /api/price-lists`: esos endpoints devuelven `clientId`s de empresas y no deben quedar expuestos a una integración externa.

---

## `GET /api/api-keys`

Lista los API keys (sin el hash ni el valor completo).

**Acceso:** admin

```json
{
  "items": [
    {
      "id": "…", "name": "Boostify Chatbot", "keyPrefix": "dvl_b7peXfy0",
      "scopes": ["catalog:read"], "active": true,
      "lastUsedAt": "2026-09-28T18:03:48.826Z",
      "createdAt": "2026-09-28T18:03:48.496Z", "revokedAt": null
    }
  ]
}
```

## `POST /api/api-keys`

Genera un API key nuevo.

**Acceso:** admin

**Body**

| Campo | Tipo | Requerido |
|---|---|---|
| `name` | string | Sí |
| `scopes` | string[], valores de la lista de arriba | Sí, mínimo 1 |

```json
{ "name": "Boostify Chatbot", "scopes": ["catalog:read"] }
```

**Respuesta `201`**

```json
{
  "id": "…", "name": "Boostify Chatbot", "scopes": ["catalog:read"],
  "apiKey": "dvl_b7peXfy0D2z8vBpNxxOIsfCbAtrlSdRe",
  "createdAt": "…"
}
```

:::caution[Guarda el `apiKey` de inmediato]
Es la única respuesta que lo incluye completo. Si se pierde, hay que revocar este key y generar uno nuevo.
:::

## `DELETE /api/api-keys/:id`

Revoca el key (`active = false`). No lo borra: conserva el registro para auditoría.

**Acceso:** admin

**Respuesta `204`** · **Errores:** `404 NOT_FOUND` si no existe o ya estaba revocado.

---

## Cómo lo usa la integración

Igual que un usuario, en la cabecera `Authorization`:

```bash
curl https://<dominio>/api/categories \
  -H "Authorization: Bearer dvl_b7peXfy0D2z8vBpNxxOIsfCbAtrlSdRe"
```

`api/src/middleware/apiKey.js` reconoce el prefijo `dvl_` y, si el key es válido y activo, dispensa del login normal para los endpoints que aceptan el scope correspondiente (`requireScopeOrAuth`). Un key con un scope que no cubre un endpoint recibe el mismo tratamiento que una petición sin sesión: cae al `requireAuth` normal y termina en `401 INVALID_TOKEN`, ya que el valor no es un JWT válido.
