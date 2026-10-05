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
| `users` | Cuentas de acceso de los tres roles | `email` (único), `password_hash` (bcrypt), `role`, `active`, `company_id`, `branch_id`, `siigo_seller_id`, `token_version` (se incrementa por trigger al cambiar contraseña o desactivar; revoca refresh tokens) |
| `clients` | El cliente: ficha comercial, con o sin usuario de login | `user_id` (opcional, único), `company_id`, `branch_id` (sucursal por defecto), `nit` (único), `email` (opcional), `price_list_id`, `route_id`/`advisor_id` (copias de la sucursal), `siigo_client_id`, `active` |
| `contact_phones` | Teléfonos de WhatsApp de un cliente | `client_id`, `phone_e164` (E.164, ej. `+573001234567`), `label`, `is_whatsapp`; único `(client_id, phone_e164)`. Un mismo número puede estar en varios clientes |
| `api_keys` | Credenciales de integraciones externas | `key_prefix` (único), `key_hash` (bcrypt), `scopes`, `active`, `last_used_at`, `revoked_at`, `expires_at`, `replaced_by` |
| `companies` | Empresas (clientes B2B) | `nit` (único), `siigo_customer_id`, `siigo_sync_status` (`local`/`pending`/`synced`/`error`), `siigo_origin` (`local`/`siigo`/`bidirectional`) |
| `company_branches` | Sucursales de una empresa | `company_id`, `route_id`, `advisor_id`, `latitude`, `longitude` |

:::info[Relación usuario ↔ cliente ↔ sucursal]
El **cliente** es la fila de `clients`, con su propia empresa (`company_id`) y sucursal por defecto (`branch_id`). Puede tener un usuario de login (`clients.user_id` → `users`, relación 1:1; `users.company_id/branch_id` se mantienen sincronizados) o no tenerlo (cliente solo de WhatsApp). La **sucursal** define la ruta y el asesor que se usan al crear una cotización.
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
| `routes` | Rutas comerciales de despacho | `operation_days` (`SMALLINT[]`, ISO 1–7), `frequency` (`weekly`/`biweekly`), `anchor_date` (quincenales), `cutoff_days_before`, `cutoff_time` (`TIME`), `city`, `advisor_id`, `bounds`/`center` (JSONB), `map_zone`, `street_from/to`, `carrera_from/to`, `active`. `day` está deprecado |

### Cotizaciones

| Tabla | Propósito | Columnas clave |
|---|---|---|
| `quotations` | Cabecera de cotización | `code` (`COT-000001`, único, de la secuencia `quotation_code_seq`), `client_id`, `advisor_id`, `company_id`, `branch_id`, `status`, `total`, `notes`, `source` (`web`/`whatsapp`), `route_date`, `api_key_id` + `idempotency_key` (único por key), `siigo_quotation_id`, `siigo_url` |
| `quotation_items` | Líneas | `product_id`, `quantity`, `price_type` (`price_list`/`promotion`), `unit_price` (precio congelado), `subtotal` (columna generada `quantity * unit_price`) |
| `quotation_comments` | Comentarios en la cotización | `author_id`, `text` |

Estados (`quotation_status`): `draft`, `sent`, `pending`, `approved`, `rejected`, `synced`, `sent_to_siigo`. Las cotizaciones creadas desde la web nacen en `sent` y las del chatbot en `pending`; el push exitoso a SIIGO las pasa a `synced`.

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
| `013_api_keys` | `migrations/013_…` | Tabla `api_keys` |
| `014_chatbot_clients` | `migrations/014_…` | `clients.company_id/branch_id`, email opcional, único en `clients.user_id`, tabla `contact_phones` (con backfill desde `clients.phone`), `quotations.source` y `api_key_id` |
| `015_route_schedule` | `migrations/015_…` | Calendario de rutas (`operation_days`, `frequency`, `anchor_date`, `cutoff_days_before`, con backfill desde `day`), `quotations.route_date` e `idempotency_key` |
| `016_credential_security` | `migrations/016_…` | `users.token_version` + trigger de revocación de sesiones; `api_keys.expires_at` y `replaced_by` |
| `seed_001_initial` | `seeds/001_initial.sql` | Datos de desarrollo (solo con `--seed`). Crea usuarios con contraseñas conocidas: `migrate.js` lo rechaza contra una base remota salvo `ALLOW_REMOTE_SEED=1`. **Nunca en producción** |

```bash
npm run migrate        # solo migraciones
npm run migrate:seed   # migraciones + seed
```

:::tip[Agregar una migración]
Crea `database/migrations/0NN_descripcion.sql` (idempotente: `IF NOT EXISTS`) y agrégala al arreglo `STEPS` de `api/migrate.js`. El `name` no se debe cambiar una vez aplicado.
:::
