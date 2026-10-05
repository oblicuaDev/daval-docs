---
sidebar_position: 5
title: Ambiente de pruebas
---

# Ambiente de pruebas

Ambiente para que equipos externos (por ejemplo, el chatbot de WhatsApp) validen su integración **sin tocar información real**.

## Ambientes

| | Pruebas | Producción |
|---|---|---|
| URL base de la API | `https://daval-app-git-staging-julian-s-projects14.vercel.app/api` | `https://daval-app.vercel.app/api` |
| API del chatbot | `…/api/integrations/*` | `…/api/integrations/*` |
| Base de datos | Neon (`daval-staging`), solo datos de prueba | Supabase, datos reales |
| API key | Una credencial **de pruebas** | Una credencial **de producción**, distinta |
| Correos | No se envían | Sí |
| SIIGO | No conectado | Conectado |

Las credenciales de un ambiente **no funcionan en el otro**: cada uno tiene su propia base de datos y sus propios secretos.

## Cómo pedir acceso

1. El equipo externo solicita acceso al administrador de DAVAL.
2. DAVAL genera un API key **de pruebas** con los scopes que necesita la integración (para el chatbot: `clients:read`, `prices:read`, `cutoff:read`, `quotations:write` y, si consulta categorías, `catalog:read`).
3. El key se entrega por un canal seguro (ver [Credenciales y seguridad](./credenciales.md#entregar-un-key)).
4. Cuando la integración esté validada en pruebas, se emite un key **de producción** por el mismo procedimiento.

Referencia de los endpoints: [API para el chatbot](../api/integraciones-chatbot.md).

## Datos de prueba

El ambiente se carga con `database/seeds/002_integration_test.sql`. Cada teléfono representa un escenario:

| Teléfono (`phone`) | Cliente | Escenario | Resultado esperado |
|---|---|---|---|
| `+573000000001` | Cliente Pruebas Uno | Empresa con 2 sucursales | `lookup`: 1 coincidencia, `needsDisambiguation: true` (elegir sucursal) |
| `+573000000002` | Cliente Pruebas Dos | Ruta casi siempre cerrada | `cutoff`: `isOpen: false`. Crear cotización: `422 ROUTE_CLOSED` |
| `+573000000003` | Compartido A y B | El mismo número en 2 empresas | `lookup`: 2 coincidencias, preguntar empresa |
| `+573000000004` | Cliente Pruebas Sin Ruta | Sucursal sin ruta | `cutoff`: `missingRoute: true` |
| `+573009999999` | — | Número no registrado | `lookup`: `matchCount: 0` |

### Identificadores

| Dato | ID |
|---|---|
| Cliente Pruebas Uno | `77777777-0002-0000-0000-000000000001` |
| Cliente Pruebas Dos | `77777777-0003-0000-0000-000000000001` |
| Cliente Pruebas Compartido A / B | `77777777-0004-…-000000000001` / `77777777-0005-…-000000000001` |
| Cliente Pruebas Sin Ruta | `77777777-0006-0000-0000-000000000001` |
| Sede Abierta (empresa Uno) | `66666666-0003-0000-0000-000000000001` |
| Sede Quincenal (empresa Uno) | `66666666-0004-0000-0000-000000000001` |
| Sede Cerrada (empresa Dos) | `66666666-0005-0000-0000-000000000001` |
| Sede Sin Ruta | `66666666-0006-0000-0000-000000000001` |

### Rutas

| Ruta | Sucursal | Calendario | Para probar |
|---|---|---|---|
| Siempre abierta | Sede Abierta | Todos los días, cierra el mismo día a las 23:59 | Crear cotizaciones en cualquier momento |
| Quincenal | Sede Quincenal | Miércoles cada 2 semanas, cierra 2 días antes a las 17:00 | Fechas de ruta quincenales, `upcomingRouteDates` |
| Casi cerrada | Sede Cerrada | Viernes, cierra 6 días antes a las 00:01 | `ROUTE_CLOSED` y `nextOpenDate` |

### Productos y precios

| SKU | Producto | Cliente Pruebas Uno (Lista Mayorista) | Otros clientes (Lista General) |
|---|---|---|---|
| `001001` | Martillo Carpintero 16oz | **30 000** (promoción específica para este cliente) | 45 000 |
| `001002` | Destornillador Pala 6" | 10 200 | 12 000 |
| `005001` | Silicona Transparente 280ml | **12 000** (promoción general) | **12 000** (promoción general) |

Hay 12 productos en total (SKUs `001001`–`005002`). Consulta los demás con `GET /integrations/clients/:clientId/prices?search=…`.

## Flujo de prueba sugerido

```bash
API=https://daval-app-git-staging-julian-s-projects14.vercel.app/api/integrations
KEY=<API key de pruebas>

# 1. Identificar
curl "$API/clients/lookup?phone=%2B573000000001" -H "Authorization: Bearer $KEY"

# 2. Ventana de corte
curl "$API/cutoff?clientId=77777777-0002-0000-0000-000000000001&branchId=66666666-0003-0000-0000-000000000001" \
  -H "Authorization: Bearer $KEY"

# 3. Precios
curl "$API/clients/77777777-0002-0000-0000-000000000001/prices?skus=001001,005001" \
  -H "Authorization: Bearer $KEY"

# 4. Crear cotización (repite el comando con la misma Idempotency-Key: devuelve la misma)
curl -X POST "$API/quotations" -H "Authorization: Bearer $KEY" \
  -H "Content-Type: application/json" -H "Idempotency-Key: prueba-001" \
  -d '{"clientId":"77777777-0002-0000-0000-000000000001","branchId":"66666666-0003-0000-0000-000000000001","items":[{"sku":"001001","quantity":2}]}'

# 5. Consultar la cotización creada
curl "$API/quotations/<id>" -H "Authorization: Bearer $KEY"
```

Para probar la actualización de cotizaciones, el equipo de DAVAL puede cambiar el estado de una cotización creada en pruebas (`pending` → `approved` / `rejected`) desde el panel de administración del ambiente de pruebas. El chatbot lo verá con `GET /quotations/:id`.

## Para el equipo de DAVAL

### Cómo está montado

- **Código:** rama `staging` de `daval-app`. Cada push despliega en Vercel como *Preview* en la URL de arriba.
- **Base de datos:** Neon, instalada desde el Marketplace de Vercel con el prefijo `STAGING_`, solo para Preview.
- **Aislamiento:** `api/src/config/environment.js`. Con `VERCEL_ENV=preview` la API usa `STAGING_DATABASE_URL` y los secretos `STAGING_JWT_SECRET` / `STAGING_JWT_REFRESH_SECRET` (definidos solo para la rama `staging`), y deshabilita correos y subida de archivos. Si falta alguna de esas variables, la API no arranca: nunca cae a la base de producción. Un preview de cualquier otra rama no arranca por la misma razón.
- **Usuarios web de pruebas:** los del seed (`admin@daval.com`, `asesor@daval.com`, `cliente@daval.com`) con contraseñas aleatorias, distintas de las del seed, que guarda el administrador.

### Actualizar el ambiente

```bash
git checkout staging && git merge main && git push   # despliega el código nuevo
```

Si el cambio trae migraciones, aplícalas a la base de pruebas antes o justo después del push:

```bash
vercel env pull .env.staging --environment=preview --git-branch=staging
# Usa STAGING_DATABASE_URL de ese archivo como DATABASE_URL:
DATABASE_URL="<STAGING_DATABASE_URL>" ALLOW_REMOTE_SEED=1 node api/migrate.js --seed
rm .env.staging
```

Los seeds son idempotentes: vuelven a crear los datos de prueba que falten, pero no borran lo que se creó durante las pruebas. Si se vuelven a correr, las contraseñas de los usuarios del seed **no** se restablecen a las conocidas, porque el seed no sobrescribe usuarios existentes.
