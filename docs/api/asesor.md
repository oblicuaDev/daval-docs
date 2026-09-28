---
sidebar_position: 12
title: Módulo asesor
---

# Módulo asesor

Archivo: `api/src/routes/advisor.js` · Prefijo: `/api/advisor`

Vistas de cartera para el asesor comercial. Un asesor solo ve lo que tiene asignado; un admin ve todo o filtra con `?advisorId=`.

**Acceso de todos los endpoints:** admin, advisor

## `GET /api/advisor/clients`

Clientes asignados al asesor (`clients.advisor_id`), paginados, con empresa, sucursal, ruta, lista de precios y conteo de cotizaciones.

**Query**

| Parámetro | Tipo | Por defecto | Descripción |
|---|---|---|---|
| `search` | string | — | Nombre o email del cliente o del usuario |
| `page` | entero | 1 | |
| `limit` | entero | 20 | Máximo 100 |
| `advisorId` | uuid | — | Solo admin |

**Respuesta `200`**

```json
{
  "items": [
    {
      "id": "…", "name": "Juan Cliente", "nit": "900123456-7",
      "email": "cliente@daval.com", "phone": "311-000-0001",
      "active": true, "createdAt": "…",
      "priceListId": "…", "priceListName": "Mayorista",
      "userId": "…", "userEmail": "cliente@daval.com", "userActive": true,
      "companyId": "…", "companyName": "Ferretería Norte", "companyNit": "900123456-7",
      "branchId": "…", "branchName": "Sede Principal", "branchCity": "Bogotá",
      "routeId": "…", "routeName": "Ruta Norte", "routeDay": "Jueves",
      "quotationCount": 12,
      "lastQuotationAt": "…"
    }
  ],
  "total": 34,
  "page": 1,
  "limit": 20,
  "totalPages": 2
}
```

---

## `GET /api/advisor/clients/:clientId/quotations`

Ficha de un cliente y sus últimas 100 cotizaciones. Si quien llama es asesor, se verifica que el cliente le esté asignado.

**Respuesta `200`**

```json
{
  "client": {
    "id": "…", "name": "Juan Cliente", "email": "…", "phone": "…", "active": true,
    "companyName": "Ferretería Norte", "companyNit": "…",
    "branchName": "Sede Principal", "branchCity": "Bogotá",
    "routeName": "Ruta Norte", "routeDay": "Jueves"
  },
  "quotations": [
    { "id": "…", "code": "COT-000042", "status": "sent", "total": 170000, "itemCount": 2, "createdAt": "…", "updatedAt": "…" }
  ]
}
```

**Errores:** `404 NOT_FOUND` si el cliente no existe o no está asignado al asesor.

---

## `GET /api/advisor/companies`

Empresas que tienen al menos una sucursal activa asignada al asesor.

**Query:** `search` (nombre o NIT), `advisorId` (solo admin).

**Respuesta `200`**

```json
{
  "items": [
    {
      "id": "…", "name": "Ferretería Norte", "nit": "…",
      "email": "…", "phone": "…", "address": "…", "active": true, "createdAt": "…",
      "myBranches": [
        { "id": "…", "name": "Sede Principal", "city": "Bogotá", "routeId": "…", "advisorId": "…", "active": true }
      ],
      "clientCount": 3,
      "quotationCount": 25,
      "totalRevenue": 4200000
    }
  ]
}
```

`myBranches` incluye solo las sucursales del asesor. `totalRevenue` excluye cotizaciones rechazadas.
