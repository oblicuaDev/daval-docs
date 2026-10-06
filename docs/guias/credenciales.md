---
sidebar_position: 4
title: Credenciales y seguridad
---

# Credenciales y seguridad

Cómo se generan, entregan, renuevan y revocan las credenciales de la plataforma, en especial las de integraciones externas como el chatbot de WhatsApp.

:::danger[Esta documentación es pública]
Nunca pongas aquí, ni en ningún repositorio, ticket o chat, el valor de un API key, una contraseña, un `JWT_SECRET` o una cadena de conexión. Usa siempre marcadores como `dvl_…` o `<secreto>`.
:::

## Inventario

| Credencial | Dónde vive | Quién la usa | Cómo se renueva |
|---|---|---|---|
| API keys de integración (`dvl_…`) | Hash bcrypt en `api_keys` | Chatbot y otros servicios externos | `POST /api/api-keys/:id/rotate` |
| `JWT_SECRET`, `JWT_REFRESH_SECRET` | Variables de entorno en Vercel | API (firma de sesiones) | Cambiarlas en Vercel y redesplegar. Cierra todas las sesiones |
| Contraseñas de usuarios | Hash bcrypt en `users` | Personas | `PUT /api/users/:id` con `password`. Revoca sus refresh tokens |
| Secretos de firma de webhooks (`whsec_…`) | `webhook_endpoints.secret` (se necesita en claro para firmar; solo el admin puede crear/rotar, nunca se listan) | Servicio externo que recibe los eventos | `POST /api/webhooks/:id/rotate-secret` con periodo de gracia |
| `CRON_SECRET` | Variables de entorno en Vercel (Production) | Vercel Cron y programadores externos de la sync | Cambiarla en Vercel (y en el programador externo, si hay) |
| `DATABASE_URL` | Variables de entorno en Vercel | API | Restablecer la contraseña en Supabase y actualizar Vercel |
| Credenciales SIIGO | `siigo_settings` (solo backend) | API | Integraciones → SIIGO en el admin |

## API keys de integración

### Principio de mínimo privilegio

Cada consumidor tiene **su propio key** con **solo** los scopes que usa. Ver la [lista de scopes](../api/api-keys.md#scopes-disponibles).

| Consumidor | Scopes |
|---|---|
| Chatbot de WhatsApp | `clients:read`, `prices:read`, `cutoff:read`, `quotations:write` (y `catalog:read` solo si consulta categorías) |

- Un key por ambiente: el de pruebas nunca sirve en producción y viceversa, porque cada ambiente tiene su propia base de datos. Ver [Ambiente de pruebas](./ambiente-de-pruebas.md).
- Los secretos JWT también son distintos por ambiente: en Preview la API usa `STAGING_JWT_SECRET` y `STAGING_JWT_REFRESH_SECRET` (`api/src/config/environment.js`). Con el mismo secreto, un token de admin de pruebas valdría en producción.
- Si un consumidor deja de necesitar un scope, quítaselo con `PATCH /api/api-keys/:id`; no hace falta cambiar el key.

### Entregar un key

1. Un admin lo genera (`POST /api/api-keys` o `rotate`). El valor completo aparece **una sola vez** en la respuesta.
2. Se entrega por un canal seguro: un gestor de secretos compartido (1Password, Bitwarden) o un enlace de un solo uso que caduque. **Nunca** por correo, WhatsApp, Slack ni dentro de documentación.
3. El consumidor lo guarda como variable de entorno o en su gestor de secretos, nunca en su código.
4. Verifica con `GET /api/api-keys` que `lastUsedAt` del key nuevo empieza a actualizarse.

### Renovar un key (rotación planeada)

1. `POST /api/api-keys/:id/rotate` con `{ "graceHours": 48 }`. Se emite un key nuevo y el anterior sigue funcionando 48 h.
2. Se entrega el key nuevo al consumidor (paso 2 de arriba).
3. Cuando `lastUsedAt` del key nuevo se actualice, el anterior puede revocarse antes de tiempo con `DELETE /api/api-keys/:id`. Si no, vence solo (`401 API_KEY_EXPIRED`).

Se recomienda rotar los keys de integración al menos una vez al año, y siempre que cambie el equipo que los maneja.

### Secretos de webhooks

Cada endpoint de [webhooks](../api/webhooks.md) tiene su propio secreto de firma, distinto por ambiente. Se entrega igual que un API key (canal seguro, una sola vez). Para renovarlo sin perder eventos: `POST /api/webhooks/:id/rotate-secret` con `graceHours: 24`, el receptor cambia de secreto durante la gracia (los envíos llevan las dos firmas) y listo. Si se expuso: `graceHours: 0`.

### Si un key queda expuesto

1. **Revócalo de inmediato:** `DELETE /api/api-keys/:id`, o `rotate` con `{ "graceHours": 0 }` si quieres el reemplazo en el mismo paso.
2. Entrega el nuevo por un canal seguro.
3. Revisa qué hizo el key (`lastUsedAt`, cotizaciones con ese `api_key_id`).
4. Bórralo de donde se publicó. Si estaba en un repositorio, lo que importa es revocarlo: aunque se borre, sigue en el historial de git.

## Sesiones de usuario

- **Cambiar la contraseña o desactivar a un usuario revoca sus refresh tokens** (trigger sobre `users.token_version`). El access token ya emitido sigue vivo hasta vencer (8 h por defecto). Ver [revocación de sesiones](../api/auth.md#revocación-de-sesiones).
- Para cerrar **todas** las sesiones de inmediato, rota `JWT_SECRET` y `JWT_REFRESH_SECRET` en Vercel.
- `JWT_SECRET` y `JWT_REFRESH_SECRET` deben ser valores aleatorios largos, distintos entre sí y distintos por ambiente. Nunca el valor de `.env.example`. Para generar uno:

  ```bash
  node -e "console.log(require('crypto').randomBytes(48).toString('base64url'))"
  ```

## Datos de desarrollo

`npm run migrate:seed` crea usuarios con contraseñas conocidas (están en `database/seeds/001_initial.sql`). Solo deben existir en bases locales o de pruebas:

- `api/migrate.js` rechaza `--seed` contra una base remota, salvo `ALLOW_REMOTE_SEED=1`.
- En producción no debe haber ninguna cuenta con esas contraseñas.
