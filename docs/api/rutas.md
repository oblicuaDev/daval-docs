---
sidebar_position: 5
title: Rutas comerciales
---

# Rutas comerciales

Archivo: `api/src/routes/routes.js` · Prefijo: `/api/routes`

Una ruta es un recorrido de despacho con un calendario: los días en que opera, su frecuencia (semanal o quincenal) y el momento en que cierra la recepción de cotizaciones. Las sucursales se asignan a una ruta. Ver [Ventana de corte](../arquitectura/reglas-de-negocio.md#ventana-de-corte-de-rutas).

## Objeto `Route`

```json
{
  "id": "…",
  "name": "Ruta Norte",
  "description": "Usaquén y Suba",
  "operationDays": [1, 4],
  "frequency": "biweekly",
  "anchorDate": "2026-10-05",
  "cutoffDaysBefore": 1,
  "cutoffTime": "17:00",
  "scheduleLabel": "Lunes y Jueves · quincenal · cierra 1 día antes a las 17:00",
  "day": "Lunes",
  "city": "Bogotá",
  "quadrantId": "N1",
  "quadrantName": "Norte 1",
  "bounds": { "north": 4.8, "south": 4.7, "east": -74.0, "west": -74.1 },
  "center": { "lat": 4.75, "lng": -74.05 },
  "mapZone": "Norte",
  "streetFrom": "Calle 100", "streetTo": "Calle 170",
  "carreraFrom": "Carrera 7", "carreraTo": "Carrera 60",
  "advisorId": "…",
  "active": true
}
```

| Campo | Descripción |
|---|---|
| `operationDays` | Días en que opera la ruta, en formato ISO: `1` = lunes … `7` = domingo. Al menos uno. |
| `frequency` | `weekly` (todas las semanas) o `biweekly` (cada dos semanas). |
| `anchorDate` | Solo para quincenales: una fecha (`YYYY-MM-DD`) de una semana en que la ruta **sí** opera. Debe caer en uno de los `operationDays`. La ruta opera esa semana y cada dos semanas desde ahí. `null` en las semanales. |
| `cutoffDaysBefore` | Cuántos días antes de la fecha de ruta cierra la recepción: `0` = el mismo día, `1` = el día anterior, etc. (0–13). |
| `cutoffTime` | Hora de cierre, `HH:MM` (zona `America/Bogota`). |
| `scheduleLabel` | Texto legible del calendario, generado por el servidor. Solo lectura. |
| `day` | **Deprecado.** Nombre del primer día de operación, solo por compatibilidad. Usa `operationDays`. |

`bounds` y `center` son JSON libre (JSONB).

---

## `GET /api/routes`

Lista las rutas activas ordenadas por nombre.

**Acceso:** Autenticado

**Respuesta `200`:** `{ "items": [ Route ] }`

---

## `GET /api/routes/me/cutoff`

Estado de la ventana de corte para el cliente autenticado, calculado en el servidor (zona `America/Bogota`). Usa la ruta de la **sucursal** del cliente; es el mismo cálculo que valida la creación de cotizaciones.

**Acceso:** client (otros roles reciben `403 FORBIDDEN`)

**Query (opcional):** `branchId`, otra sucursal de la empresa del cliente. Sin él se usa la sucursal asignada al cliente. Una sucursal de otra empresa responde `404 BRANCH_NOT_FOUND`.

**Respuesta `200`, ventana abierta**

```json
{
  "route": { "id": "…", "name": "Ruta Norte" },
  "branch": { "id": "…", "name": "Sede Principal" },
  "isOpen": true,
  "routeDate": "2026-10-08T00:00:00.000-05:00",
  "deadline": "2026-10-07T17:00:00.000-05:00",
  "windowOpensAt": "2026-10-06T00:00:00.000-05:00",
  "nextOpenDate": "2026-10-09T00:00:00.000-05:00",
  "upcomingRouteDates": ["2026-10-08", "2026-10-12", "2026-10-15", "2026-10-19"],
  "schedule": {
    "operationDays": [1, 4],
    "frequency": "weekly",
    "anchorDate": null,
    "cutoffDaysBefore": 1,
    "cutoffTime": "17:00",
    "label": "Lunes y Jueves · cierra 1 día antes a las 17:00"
  },
  "message": "Puedes solicitar cotizaciones para la ruta del jueves 8 de octubre hasta el miércoles 7 de octubre a las 17:00."
}
```

| Campo | Descripción |
|---|---|
| `isOpen` | Si se puede cotizar en este momento. |
| `routeDate` | Fecha de ruta a la que iría una cotización hecha ahora (si está cerrada, la próxima fecha con ventana). |
| `deadline` | Cierre de esa ventana. |
| `windowOpensAt` | Apertura de esa ventana. Si está cerrada, es cuándo reabre. |
| `nextOpenDate` | Próxima apertura: si está cerrada, igual a `windowOpensAt`; si está abierta, la apertura siguiente a esta ruta. |
| `upcomingRouteDates` | Próximas fechas de ruta (hasta 4), útil para recordatorios. |

**Respuesta `200`, sin ruta asignada**

```json
{
  "route": null,
  "branch": null,
  "isOpen": false,
  "missingRoute": true,
  "deadline": null,
  "routeDate": null,
  "windowOpensAt": null,
  "nextOpenDate": null,
  "upcomingRouteDates": [],
  "message": "No tienes una ruta asignada. Contacta a tu asesor."
}
```

---

## `POST /api/routes`

Crea una ruta.

**Acceso:** admin

**Body**

| Campo | Tipo | Requerido |
|---|---|---|
| `name` | string | Sí |
| `operationDays` | number[] (1–7) | Sí |
| `cutoffTime` | string `HH:MM` | Sí |
| `frequency` | `weekly` \| `biweekly` | No (por defecto `weekly`) |
| `anchorDate` | string `YYYY-MM-DD` \| null | Sí si `frequency = biweekly` |
| `cutoffDaysBefore` | number 0–13 | No (por defecto `1`) |
| `description`, `city`, `mapZone`, `quadrantId`, `quadrantName`, `streetFrom`, `streetTo`, `carreraFrom`, `carreraTo` | string | No |
| `bounds`, `center` | cualquier JSON | No |
| `advisorId` | uuid \| null | No |
| `active` | boolean | No (por defecto `true`) |

El servidor valida que el calendario sea usable y responde `400 INVALID_SCHEDULE` si:

- la ruta quincenal no tiene `anchorDate`, o esa fecha no es un día de operación;
- con ese `cutoffDaysBefore` ninguna fecha de ruta tiene ventana para cotizar (por ejemplo, ruta semanal que cierra 7 días antes).

**Respuesta `201`:** `{ "id": "<uuid>" }`

---

## `PUT /api/routes/:id`

Actualiza cualquier subconjunto de campos. Si cambia alguna parte del calendario, se valida el calendario resultante completo (mismas reglas que en `POST`). Al pasar a `weekly`, `anchorDate` se limpia.

**Acceso:** admin · **Respuesta `200`:** `{ "id": "<uuid>" }` · **Errores:** `400 EMPTY_PATCH`, `400 INVALID_SCHEDULE`, `404 NOT_FOUND`.

---

## `DELETE /api/routes/:id`

Desactiva la ruta (`active = false`). No la borra físicamente.

**Acceso:** admin · **Respuesta `204`**
