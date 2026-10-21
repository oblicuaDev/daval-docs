---
sidebar_position: 1
title: Instalación local
---

# Instalación local

## Requisitos

- Node.js 20 o superior
- PostgreSQL 14 o superior (local) o una base de datos en Supabase
- Opcional: credenciales de SIIGO, SMTP y Supabase Storage

## 1. Instalar dependencias

```bash
npm install                 # frontend (raíz)
npm --prefix api install    # backend
```

## 2. Crear la base de datos local

```sql
CREATE USER daval_dev WITH PASSWORD 'daval_dev_pass';
CREATE DATABASE daval_db_dev OWNER daval_dev;
```

El runner de migraciones crea las extensiones `uuid-ossp` y `pg_trgm`. Si el usuario no tiene permisos para crearlas, créalas una vez como superusuario:

```sql
\c daval_db_dev
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";
```

## 3. Variables de entorno

```bash
cp api/.env.example api/.env
cp .env.example .env
```

Para Postgres local, **deja comentada `DATABASE_URL`** en `api/.env` y usa las variables `DB_*`:

```bash
# DATABASE_URL=...
DB_HOST=localhost
DB_PORT=5432
DB_NAME=daval_db_dev
DB_USER=daval_dev
DB_PASSWORD=daval_dev_pass
JWT_SECRET=un-secreto-local
JWT_REFRESH_SECRET=otro-secreto-local
CORS_ORIGIN=http://localhost:5173
TZ=America/Bogota
```

En `.env` (frontend):

```bash
VITE_API_URL=http://localhost:3000/api
```

Referencia completa en [Variables de entorno](./variables-de-entorno.md).

## 4. Migraciones y datos de prueba

```bash
npm run migrate:seed
```

## 5. Levantar el proyecto

```bash
npm run dev:all     # libera el puerto 3000 y levanta API + frontend
```

O por separado:

```bash
npm run dev:api     # API en http://localhost:3000 (node --watch)
npm run dev         # Frontend en http://localhost:5173/pedidos/
```

Comprueba la API:

```bash
curl http://localhost:3000/api/health
# {"ok":true,"ts":"…","db":"connected"}
```

## Usuarios de prueba

El seed `database/seeds/001_initial.sql` crea un usuario por rol (admin, asesor y cliente). Las credenciales están en el encabezado de ese archivo.

### Datos de QA (solo base local)

`database/seeds/003_qa_demo.sql` carga datos realistas para recorrer toda la plataforma y probar cada pantalla:

- 3 asesores, 3 clientes con acceso web y 4 clientes solo WhatsApp, con sus teléfonos.
- Rutas semanales de uno y dos días, quincenal y de sábado.
- Una empresa con dos sucursales y una empresa auto-registrada cuya sucursal no tiene ruta ni asesor.
- Un cliente sin NIT real y sin ruta, que sale con los avisos en amarillo de **Clientes**.
- Cotizaciones en todos los estados, web y WhatsApp, con notas y comentarios, repartidas en los últimos ~75 días para que el Dashboard tenga gráficas.
- Una promoción vigente para todos, una permanente para clientes específicos y una ya terminada.
- Categoría y calidad para los productos que no las tengan.

Las cotizaciones toman productos del catálogo que haya en la base, así que primero sincroniza SIIGO. `migrate.js` aplica este seed **solo** contra `localhost` (ni siquiera con `ALLOW_REMOTE_SEED=1`), porque sus usuarios tienen contraseñas conocidas. Los usuarios y sus contraseñas están en el encabezado del archivo.

## Capturas del manual

Las imágenes del manual (`daval-docs/static/img/manual/`) se generan con Playwright sobre la app local, con los datos de QA:

```bash
npm run dev:all                 # en daval-app, con el seed de QA aplicado
cd daval-docs
npx playwright install chromium # solo la primera vez
npm run capturas                # todas; o: npm run capturas -- admin/clientes cliente/inicio
```

El recorrido está en `daval-docs/scripts/capturas/plan.mjs`. Como la documentación es pública, el script quita de las respuestas de la API los datos de prueba del chatbot (*Pruebas…*), reemplaza las credenciales de SIIGO por valores de ejemplo y difumina los clientes reales que trae SIIGO. **Revisa** `admin/integraciones.png` y `admin/clientes-siigo.png` antes de publicar.

## Comandos útiles

| Comando | Qué hace |
|---|---|
| `npm run dev:kill` | Libera el puerto 3000 (Windows/PowerShell) |
| `npm run migrate` | Aplica migraciones pendientes |
| `npm run build` | Build del frontend en `dist/` |
| `npm run preview` | Sirve el build localmente |
| `node api/scripts/export-products.mjs [salida.xlsx]` | Exporta productos con sus listas de precios a Excel |

## Probar la API con curl

```bash
API=http://localhost:3000/api
TOKEN=$(curl -s -X POST $API/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"<email>","password":"<contraseña>"}' | jq -r .token)

curl -s $API/products -H "Authorization: Bearer $TOKEN" | jq '.items[0]'
```

## Esta documentación

```bash
cd daval-docs
npm install
npm start        # http://localhost:3000 (usa otro puerto si la API está corriendo: npm start -- --port 3001)
npm run build    # genera daval-docs/build
```
