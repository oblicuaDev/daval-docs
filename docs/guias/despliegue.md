---
sidebar_position: 3
title: Despliegue
---

# Despliegue

Hay dos formas de desplegar. La configuración actual del repositorio (`vercel.json`) usa la opción A.

:::info[Producción]
DAVAL App se publica en **https://distribucionesdaval.com/pedidos** (ver [Dominio propio](#dominio-propio-distribucionesdavalcompedidos)). El proyecto de Vercel sigue respondiendo en **https://daval-app.vercel.app**, que redirige a `/pedidos/`. Las URL con `<app>.vercel.app` de esta guía son genéricas, para quien despliegue una instancia nueva.
:::

## Opción A: todo en Vercel (recomendada)

Frontend estático y API como función serverless en el mismo dominio. La web vive bajo **`/pedidos`**: Vite construye con `base: '/pedidos/'` en `dist/pedidos/`, el router usa ese `basename` y la API responde también en `/pedidos/api` (además de `/api`, que siguen usando el chatbot, los crons y los webhooks).

```json title="vercel.json (resumido)"
{
  "version": 2,
  "builds": [
    { "src": "package.json", "use": "@vercel/static-build", "config": { "distDir": "dist" } },
    { "src": "api/index.js", "use": "@vercel/node" }
  ],
  "redirects": [
    { "source": "/", "destination": "/pedidos/", "permanent": false },
    { "source": "/:section(login|cambiar-contrasena|admin|asesor|cliente)/:path*", "destination": "/pedidos/:section/:path*", "permanent": false }
  ],
  "rewrites": [
    { "source": "/api/(.*)", "destination": "/api/index.js" },
    { "source": "/pedidos/api/(.*)", "destination": "/api/index.js" },
    { "source": "/pedidos/(.*)", "destination": "/pedidos/index.html" }
  ]
}
```

Los redirects mantienen funcionando los enlaces viejos (`/login`, `/admin/...`, correos ya enviados). Para cambiar la ruta base hay que cambiarla en tres lugares: `BASE_PATH` en `vite.config.js`, `vercel.json` y el prefijo que acepta `api/src/app.js`.

:::warning[Por qué se usa `builds`]
Sin `builds`, Vercel convierte **cada archivo** de `api/` en una función serverless (29 en este proyecto). El plan Hobby permite máximo **12 por deploy**, y el deploy falla con *"No more than 12 Serverless Functions can be added to a Deployment on the Hobby plan"*. Con `builds` explícitos, solo `api/index.js` es función y el resto del código de Express se empaqueta dentro. No agregues `functions` a este archivo: Vercel no permite usarlo junto con `builds`.
:::

:::caution[Repositorio privado en plan Hobby]
Con el repo privado, Vercel solo despliega commits cuyo autor de GitHub esté conectado a la cuenta dueña del proyecto (**Account Settings → Authentication**). Los commits de otras cuentas, o con coautores externos, quedan en *Blocked*.
:::

Pasos:

1. Importa el repositorio en Vercel (detecta Vite).
2. Configura las variables del backend y del frontend en **Settings → Environment Variables** (ver [Variables de entorno](./variables-de-entorno.md)). Como comparten dominio:
   - `VITE_API_URL=/pedidos/api` (relativa: la web llama al API en su mismo dominio, sea `daval-app.vercel.app`, `distribucionesdaval.com` o una preview).
   - `APP_URL=https://distribucionesdaval.com/pedidos` (enlaces de los correos).
   - `CORS_ORIGIN` puede quedar vacío o con el mismo dominio.
   - `NODE_ENV=production` y **no** definas `PORT` (así el pool usa 2 conexiones).
3. Despliega y verifica `https://<app>.vercel.app/api/health` (en producción: `https://daval-app.vercel.app/api/health`).

Limitaciones del modo serverless:

- Cada invocación tiene un tiempo máximo (el que asigne Vercel al plan). La sincronización de productos de SIIGO y los correos que se envían después de responder pueden cortarse.
- No hay disco persistente: las imágenes deben ir a Supabase Storage.

## Dominio propio: distribucionesdaval.com/pedidos

El dominio está en **Cloudflare** (DNS). Hay dos formas de conectarlo; el código funciona igual con ambas.

### Forma 1: todo el dominio a Vercel (recomendada mientras la raíz no tenga otro sitio)

1. En Vercel: **Project → Settings → Domains → Add** `distribucionesdaval.com` (y `www.distribucionesdaval.com` como redirect al dominio principal).
2. En Cloudflare → **DNS**: crea los registros que muestre Vercel para cada dominio (registro `A`/`CNAME` del apex y `CNAME` de `www`), en modo **DNS only** (nube gris) y borra los registros anteriores del apex. Así Vercel emite el certificado SSL. Si se prefiere dejar el proxy de Cloudflare (nube naranja), el modo **SSL/TLS** debe ser **Full (strict)**; con *Flexible* hay bucles de redirección y con un origen sin certificado Cloudflare responde **525**.
3. Espera a que Vercel marque el dominio como *Valid Configuration* y prueba `https://distribucionesdaval.com/pedidos/api/health`. La raíz `https://distribucionesdaval.com/` redirige a `/pedidos/`.

### Forma 2: solo `/pedidos` a Vercel (si la raíz aloja otro sitio)

El apex apunta al otro sitio (con proxy de Cloudflare) y un **Cloudflare Worker** con la ruta `distribucionesdaval.com/pedidos*` reenvía esas peticiones a Vercel conservando la ruta:

```js title="Worker: daval-pedidos"
export default {
  async fetch(request) {
    const url = new URL(request.url);
    url.hostname = 'daval-app.vercel.app';
    return fetch(new Request(url, request), { redirect: 'manual' });
  },
};
```

En **Workers Routes** asigna `distribucionesdaval.com/pedidos*` a este Worker. No hace falta agregar el dominio en Vercel.

### Después de conectar el dominio

- [ ] `VITE_API_URL=/pedidos/api` y `APP_URL=https://distribucionesdaval.com/pedidos` en Production, y **redeploy** (las `VITE_*` se fijan al construir).
- [ ] Restringir la clave de Google Maps también a `distribucionesdaval.com/*`.
- [ ] Probar login de los tres roles en `https://distribucionesdaval.com/pedidos/login`.
- [ ] El chatbot puede seguir usando `https://daval-app.vercel.app/api` o pasar a `https://distribucionesdaval.com/pedidos/api`; ambas funcionan.

## Opción B: frontend en Vercel + API en Railway o Render

La API corre como proceso Node persistente (`node api/src/index.js`). Recomendado si la sincronización de SIIGO tarda más de 30 s.

| Plataforma | Archivo | Notas |
|---|---|---|
| Railway | `railway.toml` | Build `npm install --prefix api`, start `node api/src/index.js` |
| Render | `render.yaml` | `rootDir: api`, start `node src/index.js`, `NODE_ENV=production`, `TZ=America/Bogota` |

:::warning[Ruta de healthcheck]
`railway.toml` y `render.yaml` apuntan a `/health`, pero la API expone el endpoint en **`/api/health`**. Actualiza `healthcheckPath` / `healthCheckPath` a `/api/health` o el healthcheck fallará.
:::

En el frontend configura `VITE_API_URL=https://<api>/api` y en la API `CORS_ORIGIN=https://<app>.vercel.app`.

## Base de datos (Supabase)

1. Crea el proyecto y copia la cadena de conexión en modo **Session / directa (puerto 5432)**.
2. Define `DATABASE_URL` y corre `npm run migrate` desde tu máquina (lee `api/.env`).
3. Deja RLS deshabilitado: la API controla el acceso.
4. Crea el bucket `product-images` como **público** y genera las claves S3 (Storage → S3 Connection).

## Checklist

- [ ] `NODE_ENV=production`
- [ ] `JWT_SECRET` y `JWT_REFRESH_SECRET` robustos y distintos
- [ ] `DATABASE_URL` válida y migraciones aplicadas
- [ ] Claves S3 de Supabase y bucket público
- [ ] `VITE_API_URL` apunta al API correcto (`/pedidos/api` si comparten dominio)
- [ ] `CORS_ORIGIN` incluye el dominio del frontend (si están en dominios distintos)
- [ ] SMTP y `ADMIN_NOTIFICATION_EMAIL` si se quieren correos
- [ ] Credenciales SIIGO cargadas desde `/admin/integraciones` y `test-connection` OK
- [ ] `siigo_seller_id` en los asesores o `SIIGO_DEFAULT_SELLER_ID`
- [ ] `GET /api/health` responde `db: connected`
