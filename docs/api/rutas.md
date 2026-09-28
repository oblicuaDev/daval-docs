---
sidebar_position: 5
title: Rutas comerciales
---

# Rutas comerciales

Archivo: `api/src/routes/routes.js` · Prefijo: `/api/routes`

Una ruta es un recorrido de despacho semanal con un día y una hora de corte. Las sucursales se asignan a una ruta. Ver [Ventana de corte](../arquitectura/reglas-de-negocio.md#ventana-de-corte-de-rutas).

## Objeto `Route`

```json
{
  "id": "…",
  "name": "Ruta Norte",
  "description": "Usaquén y Suba",
  "day": "Jueves",
  "cutoffTime": "17:00:00",
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

`day` es el nombre del día en español: `Lunes`, `Martes`, `Miércoles`, `Jueves`, `Viernes`, `Sábado`, `Domingo` (también se aceptan sin tilde). `bounds` y `center` son JSON libre (JSONB).

---

## `GET /api/routes`

Lista las rutas activas ordenadas por nombre.

**Acceso:** Autenticado

**Respuesta `200`:** `{ "items": [ Route ] }`

---

## `GET /api/routes/me/cutoff`

Estado de la ventana de corte para el cliente autenticado, calculado en el servidor con la zona `America/Bogota`. Usa la ruta de `clients.route_id`.

**Acceso:** client (otros roles reciben `403 FORBIDDEN`)

**Respuesta `200`, ventana abierta**

```json
{
  "route": { "id": "…", "name": "Ruta Norte", "day": "Jueves", "cutoff_time": "17:00:00" },
  "isOpen": true,
  "deadline": "2026-09-30T17:00:00.000-05:00",
  "routeDate": "2026-10-01T00:00:00.000-05:00",
  "nextOpenDate": "2026-10-02T00:00:00.000-05:00",
  "previousDayName": "Miércoles",
  "message": "Puedes solicitar cotizaciones hasta el Miércoles a las 17:00:00."
}
```

**Respuesta `200`, sin ruta asignada**

```json
{
  "route": null,
  "isOpen": false,
  "missingRoute": true,
  "deadline": null,
  "routeDate": null,
  "nextOpenDate": null,
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
| `description`, `day`, `cutoffTime`, `city`, `mapZone`, `quadrantId`, `quadrantName`, `streetFrom`, `streetTo`, `carreraFrom`, `carreraTo` | string | No |
| `bounds`, `center` | cualquier JSON | No |
| `advisorId` | uuid \| null | No |
| `active` | boolean | No (por defecto `true`) |

`cutoffTime` en formato `HH:MM` o `HH:MM:SS`.

**Respuesta `201`:** `{ "id": "<uuid>" }`

---

## `PUT /api/routes/:id`

Actualiza cualquier subconjunto de campos.

**Acceso:** admin · **Respuesta `200`:** `{ "id": "<uuid>" }` · **Errores:** `400 EMPTY_PATCH`, `404 NOT_FOUND`.

---

## `DELETE /api/routes/:id`

Desactiva la ruta (`active = false`). No la borra físicamente.

**Acceso:** admin · **Respuesta `204`**
