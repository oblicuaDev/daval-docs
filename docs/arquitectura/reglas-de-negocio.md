---
sidebar_position: 5
title: Reglas de negocio
---

# Reglas de negocio

Estas reglas están implementadas en el servidor y el frontend no las puede saltar.

## Precios

Implementado en `api/src/lib/pricing.js` → `resolvePrices({ productIds, priceListId, clientId })`.

### 1. Se elige la lista de precios

- Si el usuario es `client`, se usa `clients.price_list_id`.
- Si es admin o asesor, se puede pasar `?priceListId=` en `GET /products`.
- Si no hay lista (o está inactiva), se usa la lista con `is_default = TRUE`.

### 2. Se calcula el precio de lista

```text
priceListPrice = product_price_lists.price           (si el producto tiene precio en esa lista)
               = round(base_price × multiplier, 2)    (si no)
```

### 3. Se busca el precio promocional

Una promoción aplica a un SKU si:

- `active = TRUE`
- `NOW() >= starts_at` y (`ends_at IS NULL` o `NOW() <= ends_at`)
- `scope = 'all'`, o `scope = 'specific'` y el cliente está en `promotion_clients`

Si varias promociones aplican, se toma el **menor** precio.

### 4. Precio final

```text
finalPrice = min(promotionPrice, priceListPrice)   si hay promoción
           = priceListPrice                        si no
```

Al crear la cotización, cada ítem guarda `unit_price = finalPrice` y `price_type = 'promotion'` si ganó la promoción, o `'price_list'` si no. El precio queda congelado: cambios posteriores del producto no alteran cotizaciones existentes (el detalle expone `pricesOutdated: true` si algún producto cambió después).

### Ejemplo

| Dato | Valor |
|---|---|
| `base_price` | 10 000 |
| Lista "Mayorista", `multiplier` 0.9, sin precio específico | 9 000 |
| Promoción activa `all` para el SKU | 8 500 |
| **`finalPrice`** | **8 500** (`price_type = promotion`) |

## Ventana de corte de rutas

Implementado en `api/src/lib/cutoff.js` → `computeRouteCutoff(route)`, siempre en zona `America/Bogota`.

Cada ruta tiene un día (`Lunes`…`Domingo`) y una hora de corte (`cutoff_time`). El cliente puede enviar cotizaciones **hasta el día anterior a la ruta a la hora de corte**. La recepción se reabre al día siguiente de la ruta.

```text
routeDate    = próxima ocurrencia del día de la ruta (hoy si hoy es el día)
deadline     = (routeDate − 1 día) a la hora cutoff_time
nextOpenDate = routeDate + 1 día, 00:00
isOpen       = ahora <= deadline  ||  ahora >= nextOpenDate
```

### Ejemplo: ruta de jueves con corte 17:00

| Momento | ¿Abierto? |
|---|---|
| Lunes 10:00 | Sí |
| Miércoles 16:59 | Sí |
| Miércoles 17:01 | **No** |
| Jueves (día de ruta) | **No** |
| Viernes 00:00 en adelante | Sí (ya cuenta para el jueves siguiente) |

### Dónde se aplica

- `GET /api/routes/me/cutoff` devuelve el estado para el cliente autenticado.
- `POST /api/quotations` y `POST /api/quotations/:id/clone` usan la ruta **de la sucursal** y responden `422 ROUTE_CLOSED` con `details.nextOpenDate` si está cerrada.
- Sin ruta asignada: `isOpen: false`, `missingRoute: true`.

## Alcance por rol

| Recurso | `client` | `advisor` | `admin` |
|---|---|---|---|
| `GET /quotations` | Solo las propias (`clients.user_id`) | Solo las asignadas (`advisor_id`) | Todas (filtros `clientId`, `advisorId`) |
| `GET /quotations/:id` | Solo propias, si no `404` | Solo asignadas, si no `404` | Todas |
| `GET /advisor/*` | — | Solo sus clientes y empresas | Todo, o las de `?advisorId=` |
| `GET /stats/advisor` | — | Las suyas | Global o `?advisorId=` |

Fuera de alcance se responde `404` (no `403`) para no revelar que el recurso existe.

## Asignación de asesor y ruta

- La **sucursal** (`company_branches`) define `route_id` y `advisor_id`.
- Al crear un usuario cliente con `branchId`, la ficha `clients` hereda `route_id` y `advisor_id` de esa sucursal.
- Al crear una cotización, `advisor_id` se toma de la sucursal. El cliente nunca lo envía.
- En el auto-registro (sin sesión de admin) **no** se aceptan `routeId` ni `advisorId`: los asigna un administrador después.

## Código de cotización

`COT-` + número de 6 dígitos de la secuencia `quotation_code_seq` (p. ej. `COT-000042`). Se genera dentro de la transacción de creación.

## Auto-registro

Estos endpoints son **públicos** para permitir el registro sin sesión:

1. `POST /api/companies` — crea la empresa (valida NIT duplicado → `409 DUPLICATE_NIT`).
2. `POST /api/companies/:id/branches` — crea la sucursal (sin ruta ni asesor).
3. `POST /api/users` — crea el usuario con rol forzado a `client` y su ficha en `clients`.

El administrador recibe un correo por cada registro si `ADMIN_NOTIFICATION_EMAIL` está configurado.
