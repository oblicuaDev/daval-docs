---
sidebar_position: 3
title: Productos
---

# Productos

Archivo: `api/src/routes/products.js` · Prefijo: `/api/products`

Los precios de los productos **siempre los calcula el servidor**. Ver [Reglas de negocio → Precios](../arquitectura/reglas-de-negocio.md#precios).

## `GET /api/products`

Lista productos con precios resueltos para el usuario que llama (máximo 500, ordenados por nombre).

**Acceso:** Autenticado

**Query**

| Parámetro | Tipo | Descripción |
|---|---|---|
| `active` | `true` \| `false` | Filtra por estado |
| `categoryId` | uuid | Filtra por categoría |
| `search` | string | Busca en nombre o SKU (`ILIKE`) |
| `priceListId` | uuid | Solo admin/asesor: calcula precios con esa lista. Para clientes se ignora y se usa su lista asignada |

**Respuesta `200`**

```json
{
  "items": [
    {
      "id": "…",
      "sku": "TOR-001",
      "name": "Tornillo drywall 6x1",
      "description": null,
      "categoryId": "…",
      "categoryName": "Tornillería",
      "unit": "caja",
      "stock": 120,
      "quality": "alta",
      "imageUrl": "https://…/product-images/abc.webp",
      "active": true,
      "basePrice": 10000,
      "priceListPrice": 9000,
      "promotionPrice": 8500,
      "finalPrice": 8500,
      "priceListId": "…"
    }
  ],
  "total": 1
}
```

---

## `GET /api/products/catalog`

Catálogo público paginado, solo productos activos, con precios de la lista por defecto y promociones de alcance `all`.

**Acceso:** Público

**Query**

| Parámetro | Tipo | Por defecto | Descripción |
|---|---|---|---|
| `search` | string | — | Nombre o SKU |
| `categoryId` | uuid | — | Categoría |
| `page` | entero | 1 | Página (desde 1) |
| `limit` | entero | 40 | Tamaño de página (máx. 200) |

**Respuesta `200`**

```json
{
  "items": [
    {
      "id": "…", "sku": "TOR-001", "name": "Tornillo drywall 6x1",
      "categoryId": "…", "categoryName": "Tornillería",
      "unit": "caja", "stock": 120, "quality": "alta",
      "imageUrl": null, "basePrice": 10000, "finalPrice": 9500
    }
  ],
  "total": 350,
  "page": 1,
  "pages": 9
}
```

---

## `POST /api/products`

Crea un producto.

**Acceso:** admin

**Body**

| Campo | Tipo | Requerido | Por defecto |
|---|---|---|---|
| `name` | string | Sí | |
| `sku` | string | Sí | Debe ser único |
| `categoryId` | uuid \| número \| null | No | |
| `unit` | string | No | |
| `stock` | número ≥ 0 | No | 0 |
| `quality` | string | No | p. ej. `estandar`, `alta`, `premium` |
| `imageUrl` | string | No | |
| `basePrice` | número ≥ 0 | No | 0 |
| `active` | boolean | No | `true` |
| `description` | string | No | |

**Respuesta `201`:** `{ "id": "<uuid>" }`

---

## `PUT /api/products/:id`

Actualiza cualquier subconjunto de los campos de `POST`. Para limpiar un campo se puede enviar la cadena `"null"` (se convierte a `NULL`).

**Acceso:** admin

**Respuesta `200`:** `{ "id": "<uuid>" }`

**Errores:** `400 EMPTY_PATCH`, `404 NOT_FOUND`.

---

## `POST /api/products/:id/image`

Sube o reemplaza la imagen del producto en Supabase Storage. La imagen anterior se borra en segundo plano.

**Acceso:** admin

**Body:** `multipart/form-data` con el campo `image` (JPEG, PNG, WebP o GIF, máximo 5 MB).

```bash
curl -X POST "$API/products/$ID/image" \
  -H "Authorization: Bearer $TOKEN" \
  -F "image=@foto.webp"
```

**Respuesta `200`:** `{ "imageUrl": "https://<proyecto>.supabase.co/storage/v1/object/public/product-images/<archivo>" }`

**Errores**

| HTTP | `error` | Causa |
|---|---|---|
| 400 | `NO_FILE` | No se envió archivo |
| 400 | `FILE_TOO_LARGE` | Más de 5 MB |
| 400 | `INVALID_MIME` | Tipo no permitido |
| 400 | `UNEXPECTED_FILE` | Campo distinto de `image` |
| 404 | `NOT_FOUND` | Producto inexistente |

:::note[Productos desde SIIGO]
La mayoría de productos se crean y actualizan con la [sincronización de SIIGO](./siigo.md#sincronización-de-productos), que hace *upsert* por `siigo_id`. Los campos locales (`category_id`, `quality`, `description`) no se sobrescriben en la sincronización.
:::
