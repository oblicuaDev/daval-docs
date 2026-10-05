---
sidebar_position: 13
title: API keys de integración
---

# API keys de integración

Archivo: `api/src/routes/apiKeys.js` · Prefijo: `/api/api-keys`

Credenciales para consumidores externos (por ejemplo, el chatbot de WhatsApp) que necesitan usar la API **sin ser un usuario de la plataforma**. A diferencia del login (`POST /auth/login`), un API key:

- No expira por tiempo: dura hasta que se revoca a mano.
- No tiene rol ni contraseña: solo un `name` y una lista de `scopes`.
- No identifica a ningún cliente ni asesor: es una credencial de **servicio**, no de una persona.

Ver también [API para el chatbot](./integraciones-chatbot.md) y [Reglas de negocio](../arquitectura/reglas-de-negocio.md).

## Formato del key

```text
dvl_<32 caracteres aleatorios>
```

Los primeros 12 caracteres (`dvl_` + 8) son el prefijo, que no es secreto y sirve para ubicar el registro. Se guarda solo el hash bcrypt del key completo (tabla `api_keys`). **El valor completo se muestra una única vez**, en la respuesta de `POST /api/api-keys`; después no se puede volver a consultar, solo revocar y generar uno nuevo.

:::danger[Nunca publiques un key]
No pongas un key real en esta documentación, en repositorios, tickets ni chats. Si un key queda expuesto, revócalo de inmediato (`DELETE /api/api-keys/:id`) y genera uno nuevo. Entrégalo al equipo externo por un canal seguro (gestor de secretos o enlace de un solo uso).
:::

## Scopes disponibles

Cada credencial debe tener **solo** los scopes que necesita (mínimo privilegio).

| Scope | Habilita |
|---|---|
| `catalog:read` | `GET /api/categories` |
| `clients:read` | `GET /api/integrations/clients/lookup`: identificar clientes por WhatsApp |
| `prices:read` | `GET /api/integrations/clients/:clientId/prices`: precios por cliente |
| `cutoff:read` | `GET /api/integrations/cutoff`: ventana de corte |
| `quotations:write` | `POST /api/integrations/quotations` y `GET /api/integrations/quotations/:id` (solo las creadas con el mismo key) |

El chatbot de WhatsApp necesita `clients:read`, `prices:read`, `cutoff:read` y `quotations:write`.

`GET /api/products/catalog` ya es público y no requiere key. Deliberadamente **no** hay scope para `GET /api/promotions` ni `GET /api/price-lists`: esos endpoints exponen qué clientes tienen cada promoción o lista. El chatbot obtiene el precio ya calculado por cliente con `prices:read`.

---

## `GET /api/api-keys`

Lista los API keys (sin el hash ni el valor completo).

**Acceso:** admin

```json
{
  "items": [
    {
      "id": "…", "name": "Chatbot WhatsApp", "keyPrefix": "dvl_xxxxxxxx",
      "scopes": ["clients:read", "prices:read", "cutoff:read", "quotations:write"], "active": true,
      "lastUsedAt": "2026-10-05T18:03:48.826Z",
      "createdAt": "2026-10-05T18:03:48.496Z", "revokedAt": null
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
{ "name": "Chatbot WhatsApp", "scopes": ["clients:read", "prices:read", "cutoff:read", "quotations:write"] }
```

**Respuesta `201`**

```json
{
  "id": "…", "name": "Chatbot WhatsApp",
  "scopes": ["clients:read", "prices:read", "cutoff:read", "quotations:write"],
  "apiKey": "dvl_…",
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

En la cabecera `Authorization`, igual que un token de usuario:

```bash
curl https://<dominio>/api/integrations/cutoff?branchId=<uuid> \
  -H "Authorization: Bearer $DAVAL_API_KEY"
```

`api/src/middleware/apiKey.js` reconoce el prefijo `dvl_`. Hay dos tipos de endpoint:

- **Exclusivos de integraciones** (`/api/integrations/*`, `requireApiKeyScope`): solo aceptan API key. Sin key responden `401 API_KEY_REQUIRED`; con un key sin el scope, `403 INSUFFICIENT_SCOPE`. El login de un usuario no sirve aquí.
- **Compartidos** (`GET /api/categories`, `requireScopeOrAuth`): aceptan el login normal **o** un key con el scope. Un key sin el scope cae al login normal y termina en `401 INVALID_TOKEN`.

Un key inválido o revocado responde `401 INVALID_API_KEY`.
