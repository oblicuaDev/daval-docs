---
sidebar_position: 5
title: Reglas de negocio
---

# Reglas de negocio

Estas reglas están implementadas en el servidor y el frontend no las puede saltar.

## Precios

Implementado en `api/src/lib/pricing.js` → `resolvePrices({ productIds, priceListId, clientId })`.

### 1. Se elige la lista de precios

- Si el usuario es `client` (o la integración consulta por `clientId`), se usa `clients.price_list_id`. La lista es **por cliente**, no por empresa: dos clientes de la misma empresa pueden tener listas distintas.
- Si es admin o asesor, se puede pasar `?priceListId=` en `GET /products`.
- Si no hay lista (o está inactiva), se usa la lista con `is_default = TRUE`.
- Las listas válidas son las de Daval (`price_lists` + `product_price_lists.price_list_id`). Las filas que la sincronización de SIIGO guarda solo con `price_list_name` no participan en el cálculo.

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

Implementado en `api/src/lib/cutoff.js` → `computeRouteCutoff(route)`, siempre en zona `America/Bogota`. Es la **única** implementación: la usan la validación de cotizaciones, la consulta del cliente web, la del chatbot y los futuros recordatorios. El frontend no calcula el corte; solo muestra lo que devuelve el servidor.

### Calendario de la ruta

| Columna (`routes`) | Significado |
|---|---|
| `operation_days` | Días en que opera (ISO: 1 = lunes … 7 = domingo). Puede ser más de uno. |
| `frequency` | `weekly` o `biweekly`. |
| `anchor_date` | Quincenales: una fecha de una semana en que la ruta opera. Opera esa semana y cada 2 semanas desde ahí. |
| `cutoff_days_before` | Días antes de la fecha de ruta en que cierra la recepción (0 = mismo día, 1 = día anterior…). |
| `cutoff_time` | Hora de cierre. |

### Ventana de cada fecha de ruta

Para cada fecha de ruta `D`, con `P` = la fecha de ruta anterior:

```text
abre   = P + 1 día, 00:00
cierra = (D − cutoff_days_before días) a la hora cutoff_time
```

En un momento dado, la cotización va a la primera fecha de ruta cuya ventana todavía no cierra:

```text
isOpen = ahora >= abre
```

Si una ventana queda vacía (cierra antes de abrir), esa fecha no recibe cotizaciones y se pasa a la siguiente. Por ejemplo, una ruta que opera lunes **y** martes con cierre el día anterior: la ventana del martes abriría el martes y cerraría el lunes, así que todo va a la ruta del lunes siguiente.

### Ejemplo 1: ruta semanal de jueves, cierre 1 día antes a las 17:00

| Momento | ¿Abierto? | Va a la ruta del |
|---|---|---|
| Lunes 10:00 | Sí | jueves de esta semana |
| Miércoles 16:59 | Sí | jueves de esta semana |
| Miércoles 17:01 | **No** (reabre el viernes) | jueves siguiente |
| Jueves (día de ruta) | **No** | jueves siguiente |
| Viernes 00:00 en adelante | Sí | jueves siguiente |

### Ejemplo 2: ruta de lunes que cierra el viernes a las 17:00

`operation_days = [1]`, `cutoff_days_before = 3`, `cutoff_time = 17:00`. Abierta de martes 00:00 a viernes 17:00; cerrada el fin de semana y el lunes.

### Ejemplo 3: ruta quincenal de miércoles

`operation_days = [3]`, `frequency = biweekly`, `anchor_date = 2026-10-07`, `cutoff_days_before = 2`. Opera el 7 y el 21 de octubre, el 4 de noviembre… La ventana para el 21 abre el 8 de octubre y cierra el lunes 19 a la hora de corte.

### Validación del calendario

`POST/PUT /api/routes` rechazan con `400 INVALID_SCHEDULE` los calendarios inválidos: sin días de operación, quincenal sin `anchor_date` o con una fecha que no es día de operación, o un cierre tan anticipado que ninguna fecha tiene ventana.

### Dónde se aplica

- **Criterio único: la ruta de la sucursal** (`company_branches.route_id`), nunca `clients.route_id`.
- `GET /api/routes/me/cutoff` (cliente web) y `GET /api/integrations/cutoff` (chatbot) devuelven el estado.
- `POST /api/quotations`, `POST /api/quotations/:id/clone` y `POST /api/integrations/quotations` responden `422 ROUTE_CLOSED` con `details.nextOpenDate` y `details.routeDate` si está cerrada.
- Cada cotización guarda la fecha de ruta a la que va en `quotations.route_date`.
- Sin ruta asignada: `isOpen: false`, `missingRoute: true`.

## Alcance por rol

| Recurso | `client` | `advisor` | `admin` |
|---|---|---|---|
| `GET /quotations` | Solo las propias (`clients.user_id`) | Solo las asignadas (`advisor_id`) | Todas (filtros `clientId`, `advisorId`) |
| `GET /quotations/:id` | Solo propias, si no `404` | Solo asignadas, si no `404` | Todas |
| `GET /advisor/*` | — | Solo sus clientes y empresas | Todo, o las de `?advisorId=` |
| `GET /stats/advisor` | — | Las suyas | Global o `?advisorId=` |

Fuera de alcance se responde `404` (no `403`) para no revelar que el recurso existe.

## Clientes

- El **cliente** es la fila de `clients`. Tiene su propia empresa (`company_id`), su sucursal por defecto (`branch_id`) y su lista de precios.
- Un cliente puede tener **usuario de login** (`clients.user_id`, relación 1:1) o no tenerlo. Los clientes sin login se atienden solo por WhatsApp y se administran desde `/api/clients`.
- Los teléfonos de WhatsApp están en `contact_phones`, normalizados a E.164. Ver [Identificación por WhatsApp](../api/integraciones-chatbot.md#identificar-un-cliente-por-whatsapp).
- `quotations.client_id`, `promotion_clients.client_id` y la asignación de listas de precios usan siempre `clients.id`, nunca `users.id`.

## Asignación de asesor y ruta

- La **sucursal** (`company_branches`) define `route_id` y `advisor_id`. Es el único criterio para el corte y para el asesor de una cotización.
- La sucursal debe pertenecer a la empresa del cliente. Si no, se responde `404 BRANCH_NOT_FOUND`.
- `clients.route_id` y `clients.advisor_id` son copias de la sucursal que se mantienen por compatibilidad (las usa el listado del asesor). No se usan para el corte.
- Al crear una cotización, `advisor_id` se toma de la sucursal. Ni el cliente ni el chatbot lo envían.
- En el auto-registro (sin sesión de admin) **no** se aceptan `routeId` ni `advisorId`: los asigna un administrador después.

## Estado y origen de la cotización

- Desde la web, la cotización se crea en estado `sent`. Desde el chatbot, en `pending` para revisión humana.
- `quotations.source` registra el canal: `web` o `whatsapp`. Para el chatbot lo fija el servidor según la credencial; el body no lo acepta.
- Solo se pueden cotizar productos activos (`404 PRODUCT_NOT_FOUND` si no).

## Código de cotización

`COT-` + número de 6 dígitos de la secuencia `quotation_code_seq` (p. ej. `COT-000042`). Se genera dentro de la transacción de creación.

## Auto-registro

Estos endpoints son **públicos** para permitir el registro sin sesión:

1. `POST /api/companies` — crea la empresa (valida NIT duplicado → `409 DUPLICATE_NIT`).
2. `POST /api/companies/:id/branches` — crea la sucursal (sin ruta ni asesor).
3. `POST /api/users` — crea el usuario con rol forzado a `client` y su ficha en `clients`.

El administrador recibe un correo por cada registro si `ADMIN_NOTIFICATION_EMAIL` está configurado.
