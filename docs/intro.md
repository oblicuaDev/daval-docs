---
sidebar_position: 1
slug: /intro
title: Introducción
---

# DAVAL App

**DAVAL App** es el sistema comercial B2B de **Distribuciones DAVAL**, un distribuidor de ferretería. Permite que los clientes (ferreterías) armen y envíen cotizaciones desde un catálogo con sus precios, que los asesores comerciales las gestionen, y que el administrador controle catálogo, precios, promociones, rutas y la integración con el ERP **SIIGO**.

## Qué resuelve

| Necesidad | Cómo la resuelve la app |
|---|---|
| El cliente quiere pedir sin llamar al asesor | Catálogo web con carrito y envío de cotizaciones |
| Cada cliente tiene precios distintos | Listas de precios por cliente + promociones, resueltas **en el servidor** |
| Los pedidos se despachan por rutas semanales | Cada sucursal tiene una ruta con día y hora de corte; fuera de la ventana no se reciben cotizaciones |
| La contabilidad vive en SIIGO | Sincronización de productos y clientes, y envío de cotizaciones a SIIGO |
| El asesor necesita ver su cartera | Módulo de asesor: sus clientes, empresas y cotizaciones |

## Roles

La aplicación tiene tres roles (`user_role` en la base de datos):

| Rol | Ruta en el frontend | Qué puede hacer |
|---|---|---|
| `admin` | `/admin` | Todo: catálogo, categorías, listas de precios, promociones, empresas, clientes, usuarios, rutas, cotizaciones, integración SIIGO y estadísticas |
| `advisor` | `/asesor` | Ver y gestionar las cotizaciones asignadas, sus clientes y empresas, comentar y cambiar estados |
| `client` | `/cliente` | Ver catálogo con sus precios, armar carrito, enviar y repetir cotizaciones, ver su historial |

## Stack

| Capa | Tecnología | Despliegue |
|---|---|---|
| Frontend | React 18, Vite 5, React Router 6, TanStack Query 5, Tailwind CSS, Axios, Recharts | Vercel |
| Backend | Node.js (ESM), Express 4, Zod, `pg`, JWT, Luxon, Multer, Nodemailer | Vercel (serverless) o Railway/Render |
| Base de datos | PostgreSQL (Supabase en producción, Postgres local en desarrollo) | Supabase |
| Archivos | Supabase Storage vía protocolo S3 | Supabase |
| ERP | SIIGO API (`https://api.siigo.com`) | — |

## Estructura del repositorio

```text
daval-app/
├── src/                  Frontend React (páginas por rol, hooks, contextos, cliente API)
├── api/
│   ├── index.js          Entrada serverless para Vercel (re-exporta src/app.js)
│   ├── migrate.js        Runner de migraciones + seed
│   ├── scripts/          Scripts utilitarios (p. ej. export de productos a Excel)
│   └── src/
│       ├── app.js        App Express: middlewares y montaje de rutas
│       ├── index.js      Servidor local (app.listen)
│       ├── config/db.js  Pool de PostgreSQL
│       ├── middleware/   auth, errores, uploads
│       ├── routes/       Routers HTTP
│       ├── lib/          Reglas de negocio (precios, corte de ruta, correo, storage, mappers SIIGO)
│       └── services/     Orquestación de SIIGO (productos, clientes, cotizaciones)
├── database/
│   ├── schema.sql        Esquema base
│   ├── migrations/       Migraciones 001–012
│   └── seeds/            Datos de desarrollo
├── daval-docs/           Esta documentación (Docusaurus)
├── vercel.json           Build + rewrites de Vercel
├── railway.toml          Config de Railway
└── render.yaml           Config de Render
```

## Por dónde empezar

- **Entender cómo funciona:** [Visión general de la arquitectura](./arquitectura/vision-general.md) y [Reglas de negocio](./arquitectura/reglas-de-negocio.md).
- **Levantar el proyecto:** [Instalación local](./guias/instalacion-local.md).
- **Consumir la API:** [Convenciones de la API](./api/introduccion.md).
- **Trabajar con SIIGO:** [Integración SIIGO](./integraciones/siigo.md).
