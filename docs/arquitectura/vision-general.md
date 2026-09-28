---
sidebar_position: 1
title: Visión general
---

# Visión general de la arquitectura

DAVAL App es una SPA de React que consume una API REST en Express. Toda regla de negocio que afecte dinero o permisos (precio final, ventana de corte, alcance por rol) se decide en el servidor; el frontend solo muestra.

## Diagrama de componentes

```text
                ┌──────────────────────────────────────────┐
                │               Navegador                   │
                │  React SPA (Vite)                         │
                │  ├─ AuthContext  (sesión, tokens)         │
                │  ├─ AppContext   (carrito)                │
                │  └─ React Query  (datos del servidor)     │
                └──────────────┬───────────────────────────┘
                               │ HTTPS  /api/*   Bearer JWT
                               ▼
                ┌──────────────────────────────────────────┐
                │           API Express (Node)              │
                │  middleware: cors → json → auth → zod     │
                │  routes/  → lib/ (reglas) → services/     │
                └───┬──────────────┬──────────────┬────────┘
                    │ pg.Pool      │ S3 API       │ HTTPS
                    ▼              ▼              ▼
             ┌────────────┐ ┌──────────────┐ ┌──────────────┐
             │ PostgreSQL │ │  Supabase    │ │  SIIGO API   │
             │ (Supabase) │ │  Storage     │ │  (ERP)       │
             └────────────┘ └──────────────┘ └──────────────┘
                                                   ▲
                                      SMTP ────────┘ (Nodemailer, correos)
```

## Despliegue en producción

En producción el frontend y la API comparten dominio en **Vercel**:

- `vercel.json` construye el frontend (`npm run build` → `dist/`).
- Toda petición a `/api/*` se reescribe a la función serverless `api/index.js`, que re-exporta la app Express de `api/src/app.js`.
- Cualquier otra ruta se reescribe a `index.html` (routing del lado del cliente).

Como alternativa, la API puede correr como proceso Node en Railway o Render (`node api/src/index.js`). Ver [Despliegue](../guias/despliegue.md).

## Flujo principal: un cliente envía una cotización

```text
Cliente                 Frontend                         API                          DB
  │  abre /cliente         │                              │                            │
  │ ─────────────────────► │ GET /api/routes/me/cutoff    │                            │
  │                        │ ───────────────────────────► │ computeRouteCutoff()       │
  │                        │ ◄─ { isOpen, deadline… } ─── │                            │
  │  navega catálogo       │ GET /api/products            │                            │
  │                        │ ───────────────────────────► │ resolvePrices() ─────────► │
  │                        │ ◄─ items con finalPrice ──── │                            │
  │  agrega al carrito     │ (AppContext + localStorage)  │                            │
  │  confirma              │ POST /api/quotations         │                            │
  │                        │ { branchId, items[] }        │ 1. valida corte (422)      │
  │                        │ ───────────────────────────► │ 2. recalcula precios       │
  │                        │                              │ 3. TX: quotation + items ► │
  │                        │ ◄─ 201 cotización completa ─ │                            │
```

El frontend **nunca envía precios**: solo `productId` y `quantity`. El servidor recalcula todo.

## Flujo: la cotización llega a SIIGO

```text
Admin ── POST /api/integrations/siigo/quotes/:id ──► API
                                                     ├─ valida ítems, NIT, productos sincronizados
                                                     ├─ valida cliente en SIIGO (por NIT)
                                                     ├─ resuelve vendedor (siigo_seller_id del asesor)
                                                     ├─ registra intento en siigo_quote_integrations
                                                     ├─ POST /v1/quotations en SIIGO (reintentos 429/5xx)
                                                     └─ TX: integración = success, cotización = synced
```

Detalle completo en [Integración SIIGO](../integraciones/siigo.md).

## Principios de diseño

1. **El servidor es la autoridad.** Precio final (`min(promoción, lista)`), ventana de corte y alcance por rol se calculan en la API. El frontend replica el cálculo del corte solo para mostrar mensajes.
2. **Validación con Zod en cada entrada.** Un `ZodError` se convierte automáticamente en `400 VALIDATION_ERROR`.
3. **Errores con forma única.** `{ error, message, details? }` en todas las respuestas de error.
4. **Transacciones para escrituras compuestas.** Cotización + ítems, listas de precios, promociones y creación de usuario-cliente usan `BEGIN/COMMIT`.
5. **Efectos secundarios no bloqueantes.** Correos y borrado de imágenes viejas se disparan *fire-and-forget* después de responder.
6. **Compatibilidad serverless.** Sin disco persistente (uploads a memoria → Supabase Storage), pool de conexiones reducido y reseteo de sincronizaciones colgadas en la primera petición.
