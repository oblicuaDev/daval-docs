---
sidebar_position: 6
title: Categorías
---

# Categorías

Archivo: `api/src/routes/admin.js` (router `categories`) · Prefijo: `/api/categories`

En la interfaz de administración las categorías aparecen como **"Centros de costos"** (`/admin/centros-de-costos`).

## `GET /api/categories`

**Acceso:** Autenticado, o un [API key de integración](./api-keys.md) con scope `catalog:read`

:::info[Integraciones externas]
Este es el único endpoint de administración que también acepta un [API key de integración](./api-keys.md) (scope `catalog:read`), pensado para consumidores de solo lectura como un chatbot. El resto de rutas de este archivo siguen exigiendo login de usuario.
:::

**Respuesta `200`** (filas en snake_case)

```json
{
  "items": [
    { "id": "…", "name": "Tornillería", "description": null, "active": true }
  ]
}
```

## `POST /api/categories`

**Acceso:** admin

| Campo | Tipo | Requerido | Por defecto |
|---|---|---|---|
| `name` | string | Sí | |
| `description` | string | No | |
| `active` | boolean | No | `true` |

**Respuesta `201`:** `{ "id": "<uuid>" }`

## `PUT /api/categories/:id`

**Acceso:** admin. Mismos campos, todos opcionales. Usa `COALESCE`: enviar `null` no borra el valor.

**Respuesta `200`:** `{ "id": "<uuid>" }` · **Errores:** `404 NOT_FOUND`.

## `DELETE /api/categories/:id`

Borra la categoría. Los productos asociados quedan con `category_id = NULL`.

**Acceso:** admin · **Respuesta `204`**
