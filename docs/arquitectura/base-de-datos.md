---
sidebar_position: 4
title: Base de datos
---

# Base de datos

PostgreSQL con extensiones `uuid-ossp` (claves `UUID`) y `pg_trgm` (búsquedas `ILIKE` indexadas). En producción corre en Supabase con RLS deshabilitado: la API controla el acceso con JWT.

## Modelo de datos

```text
                   ┌──────────────┐
                   │    users     │ role: admin | advisor | client
                   │ company_id ──┼──────────┐
                   │ branch_id  ──┼───────┐  │
                   └──────┬───────┘       │  │
             user_id      │ advisor_id    │  │
        ┌─────────────────┤               │  │
        ▼                 ▼               ▼  ▼
 ┌─────────────┐   ┌────────────┐   ┌──────────────────┐     ┌────────────┐
 │   clients   │   │   routes   │◄──┤ company_branches │────►│ companies  │
 │ price_list ─┼─┐ │ day,       │   │ route_id         │     │ nit        │
 │ route_id  ──┼─┼►│ cutoff_time│   │ advisor_id       │     │ siigo_*    │
 │ advisor_id  │ │ └────────────┘   └──────────────────┘     └────────────┘
 └──────┬──────┘ │
        │        ▼
        │  ┌─────────────┐    ┌─────────────────────┐    ┌──────────┐
        │  │ price_lists │◄───┤ product_price_lists ├───►│ products │◄── categories
        │  └─────────────┘    └─────────────────────┘    └────┬─────┘
        │                                                      │ sku
        ▼                                                      ▼
 ┌─────────────┐   ┌─────────────────┐              ┌──────────────────┐
 │ quotations  │──►│ quotation_items │              │ promotion_prices │──► promotions
 │ code COT-…  │   └─────────────────┘              └──────────────────┘       │
 │ status      │──► quotation_comments                promotion_clients ◄──────┘
 │ siigo_*     │──► siigo_quote_integrations
 └─────────────┘
```

## Tablas

### Usuarios y clientes

| Tabla | Propósito | Columnas clave |
|---|---|---|
| `users` | Cuentas de acceso de los tres roles | `email` (único), `password_hash` (bcrypt), `role`, `active`, `company_id`, `branch_id`, `siigo_seller_id` |
| `clients` | Ficha comercial de un usuario cliente | `user_id`, `nit` (único), `price_list_id`, `route_id`, `advisor_id`, `siigo_client_id` |
| `companies` | Empresas (clientes B2B) | `nit` (único), `siigo_customer_id`, `siigo_sync_status` (`local`/`pending`/`synced`/`error`), `siigo_origin` (`local`/`siigo`/`bidirectional`) |
| `company_branches` | Sucursales de una empresa | `company_id`, `route_id`, `advisor_id`, `latitude`, `longitude` |

:::info[Relación usuario ↔ cliente ↔ sucursal]
Un usuario con rol `client` tiene una fila en `clients` (vinculada por `user_id`) y apunta a su empresa y sucursal con `users.company_id` y `users.branch_id`. La **sucursal** define la ruta y el asesor que se usan al crear una cotización.
:::

### Catálogo y precios

| Tabla | Propósito | Columnas clave |
|---|---|---|
| `categories` | Categorías de producto (en la UI: "centros de costos") | `name`, `active` |
| `products` | Catálogo | `sku` (único), `siigo_id` (único), `base_price`, `stock`, `unit`, `quality`, `image_url`, `description`, `last_sync_at` |
| `price_lists` | Listas de precios | `name` (único), `multiplier`, `is_default` (solo una puede ser `TRUE`), `active` |
| `product_price_lists` | Precio específico de un producto en una lista | `product_id`, `price_list_id`, `price_list_name`, `price`, `currency`; único `(product_id, price_list_name)` |
| `promotions` | Promociones | `kind` (`permanent`/`eventual`), `scope` (`all`/`specific`), `starts_at`, `ends_at` (nulo si es permanente), `active` |
| `promotion_prices` | Precio promocional por SKU | `(promotion_id, sku)`, `price` |
| `promotion_clients` | Clientes de una promoción `specific` | `(promotion_id, client_id)` |
| `complementary_products` | Relación N:M de venta cruzada | `(product_id, complementary_product_id)` |

### Rutas

| Tabla | Propósito | Columnas clave |
|---|---|---|
| `routes` | Rutas comerciales de despacho | `day` (`Lunes`…`Domingo`), `cutoff_time` (`TIME`), `city`, `advisor_id`, `bounds`/`center` (JSONB), `map_zone`, `street_from/to`, `carrera_from/to`, `active` |

### Cotizaciones

| Tabla | Propósito | Columnas clave |
|---|---|---|
| `quotations` | Cabecera de cotización | `code` (`COT-000001`, único, de la secuencia `quotation_code_seq`), `client_id`, `advisor_id`, `company_id`, `branch_id`, `status`, `total`, `notes`, `siigo_quotation_id`, `siigo_url` |
| `quotation_items` | Líneas | `product_id`, `quantity`, `price_type` (`price_list`/`promotion`), `unit_price` (precio congelado), `subtotal` (columna generada `quantity * unit_price`) |
| `quotation_comments` | Comentarios en la cotización | `author_id`, `text` |

Estados (`quotation_status`): `draft`, `sent`, `pending`, `approved`, `rejected`, `synced`, `sent_to_siigo`. Las cotizaciones creadas por clientes nacen en `sent`; el push exitoso a SIIGO las pasa a `synced`.

### SIIGO

| Tabla | Propósito |
|---|---|
| `siigo_settings` | Fila única (`id = 1`): credenciales, `base_url`, token cacheado y estado de la última sincronización de productos |
| `siigo_sync_logs` | Historial de sincronizaciones de productos |
| `siigo_quote_integrations` | Auditoría de cada intento de envío de cotización. Índice único parcial: **solo un `success` por cotización** |
| `siigo_customer_integrations` | Auditoría de importaciones/exportaciones de clientes (`operation`, `status`, `duration_ms`) |

## Migraciones

`api/migrate.js` aplica los archivos en orden y registra cada uno en la tabla `_migrations`, así que es seguro correrlo varias veces.

| Nombre | Archivo | Qué hace |
|---|---|---|
| `000_schema` | `schema.sql` | Esquema base (se omite si `users` ya existe) |
| `001_phase1` | `migrations/001_phase1.sql` | Listas de precios, empresas, sucursales, promociones, comentarios, código de cotización |
| `002_siigo_module` | `migrations/002_siigo_module.sql` | `siigo_settings` y `siigo_sync_logs` |
| `003_perf_indexes` | `migrations/003_perf_indexes.sql` | Índices faltantes y trigramas para búsqueda por SKU |
| `004_geo_and_cleanup` | `migrations/004_geo_and_cleanup.sql` | Coordenadas en sucursales, `products.description`, estados `pending` y `sent_to_siigo` |
| `005_routes_geocols` | `migrations/005_routes_geocols.sql` | Zona y calles/carreras en rutas |
| `006_uq_product_price_list` | `alter.pgsql` | Índice único en precios por lista |
| `007_siigo_quote_integrations` | `migrations/007_…` | Auditoría de envío de cotizaciones |
| `008_siigo_seller_id` | `migrations/008_…` | `users.siigo_seller_id` |
| `009_permanent_promotions` | `migrations/009_…` | `promotions.kind`, `ends_at` opcional |
| `010_catalog_sync_fix` | `migrations/010_…` | Único `(product_id, price_list_name)` para el upsert de sync; `subtotal` en ítems |
| `011_siigo_customer_sync` | `migrations/011_…` | Campos SIIGO en `companies` y `siigo_customer_integrations` |
| `012_fix_siigo_customer_names` | `migrations/012_…` | Corrige nombres importados como arreglo |
| `seed_001_initial` | `seeds/001_initial.sql` | Datos de desarrollo (solo con `--seed`) |

```bash
npm run migrate        # solo migraciones
npm run migrate:seed   # migraciones + seed
```

:::tip[Agregar una migración]
Crea `database/migrations/0NN_descripcion.sql` (idempotente: `IF NOT EXISTS`) y agrégala al arreglo `STEPS` de `api/migrate.js`. El `name` no se debe cambiar una vez aplicado.
:::
