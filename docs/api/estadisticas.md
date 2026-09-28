---
sidebar_position: 11
title: Estadísticas
---

# Estadísticas

Archivo: `api/src/routes/admin.js` (router `stats`) · Prefijo: `/api/stats`

Alimentan los dashboards. Las cotizaciones `rejected` no cuentan en ingresos.

## `GET /api/stats/admin`

**Acceso:** admin

**Query**

| Parámetro | Tipo | Descripción |
|---|---|---|
| `dateFrom` | fecha ISO | Desde (sobre `created_at`) |
| `dateTo` | fecha ISO | Hasta |

**Respuesta `200`**

```json
{
  "totalRevenue": 45890000,
  "ordersCount": 312,
  "syncedSiigoCount": 250,
  "pendingSiigoCount": 62,
  "totalActiveProducts": 1840,
  "totalActiveClients": 97,
  "totalActiveUsers": 110,
  "topProducts": [ { "id": "…", "name": "Tornillo drywall 6x1", "qty": 4200, "total": 35700000 } ],
  "topClients":  [ { "id": "…", "name": "Ferretería Norte", "orderCount": 40, "total": 8900000 } ],
  "recentOrders": [
    { "id": "…", "code": "COT-000312", "total": 170000, "status": "sent",
      "created_at": "…", "siigo_url": null, "client_name": "Juan Cliente" }
  ],
  "monthlyRevenue": [ { "month": "2026-09", "total": 5120000 } ]
}
```

| Campo | Filtrado por fechas |
|---|---|
| `totalRevenue`, `ordersCount`, `syncedSiigoCount`, `pendingSiigoCount`, `topProducts`, `topClients`, `recentOrders` | Sí |
| `monthlyRevenue` | Sí, y además limitado a los últimos 12 meses |
| `totalActiveProducts`, `totalActiveClients`, `totalActiveUsers` | No (totales globales) |

`recentOrders` viene en snake_case.

---

## `GET /api/stats/advisor`

**Acceso:** admin, advisor. El asesor ve sus propias cifras; el admin ve las globales o las de `?advisorId=`.

**Respuesta `200`**

```json
{
  "totalRevenue": 8900000,
  "ordersCount": 40,
  "topProducts": [ { "id": "…", "name": "…", "qty": 300, "total": 2550000 } ],
  "recentOrders": [ { "id": "…", "code": "COT-000301", "total": 90000, "status": "approved", "created_at": "…", "client_name": "…" } ],
  "monthlyRevenue": [ { "month": "2026-09", "total": 1200000 } ]
}
```
