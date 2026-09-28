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
npm run dev         # Frontend en http://localhost:5173
```

Comprueba la API:

```bash
curl http://localhost:3000/api/health
# {"ok":true,"ts":"…","db":"connected"}
```

## Usuarios de prueba

El seed `database/seeds/001_initial.sql` crea un usuario por rol (admin, asesor y cliente). Las credenciales están en el encabezado de ese archivo.

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
