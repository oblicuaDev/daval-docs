---
sidebar_position: 3
title: Frontend (React)
---

# Frontend

El frontend vive en `src/` en la raíz del repositorio. Es una SPA de React 18 construida con Vite.

## Estructura

```text
src/
├── main.jsx              Monta React, Router y QueryClientProvider
├── App.jsx               Rutas por rol con lazy loading
├── api/
│   ├── client.js         Instancia Axios + interceptores (token, refresh, errores)
│   └── modules/          Un módulo por recurso (auth, products, quotations, …)
├── hooks/                Hooks de React Query que envuelven los módulos de api/
├── context/
│   ├── AuthContext.jsx   Sesión del usuario
│   └── AppContext.jsx    Carrito
├── components/           Componentes compartidos (ProtectedRoute, ConfirmDialog, …)
├── pages/
│   ├── Login.jsx
│   ├── admin/            Pantallas del administrador
│   ├── advisor/          Pantallas del asesor
│   └── client/           Pantallas del cliente
└── utils/                format.js, routeCutoff.js, loadGoogleMaps.js
```

## Rutas por rol

Todas las páginas se cargan con `lazy()` y un único `Suspense`, así cada rol descarga solo su bundle. `ProtectedRoute` valida que el usuario tenga el rol requerido.

### Administrador (`/admin`)

| Ruta | Página | Para qué |
|---|---|---|
| `/admin` | `AdminDashboard` | KPIs, ingresos mensuales, top productos y clientes |
| `/admin/catalogo` | `AdminProducts` | CRUD de productos e imágenes |
| `/admin/centros-de-costos` | `AdminCategories` | Categorías |
| `/admin/listas-precios` | `AdminPriceLists` | Listas de precios y precios por producto |
| `/admin/promociones` | `AdminPromotions` | Promociones |
| `/admin/empresas` | `AdminCompanies` | Empresas y sucursales |
| `/admin/clientes` | `AdminClients` | Usuarios cliente |
| `/admin/asesores` | `AdminUsers` | Usuarios (asesores/admins) |
| `/admin/cotizaciones` | `AdminOrders` | Todas las cotizaciones |
| `/admin/cotizaciones/:orderId` | `AdminOrderDetail` | Detalle, comentarios, envío a SIIGO |
| `/admin/rutas` | `AdminRoutes` | Rutas comerciales |
| `/admin/integraciones` | `AdminIntegrations` | Credenciales y sync de SIIGO |
| `/admin/integraciones/clientes-siigo` | `AdminSiigoCustomers` | Importar/exportar clientes SIIGO |

### Asesor (`/asesor`)

| Ruta | Página |
|---|---|
| `/asesor` | `AdvisorOrders` — cotizaciones asignadas |
| `/asesor/cotizacion/:orderId` | `AdvisorOrderDetail` |
| `/asesor/clientes` | `AdvisorClients` |
| `/asesor/clientes/:clientId/cotizaciones` | `AdvisorClientQuotations` |
| `/asesor/empresas` | `AdvisorCompanies` |

### Cliente (`/cliente`)

| Ruta | Página |
|---|---|
| `/cliente` | `ClientStart` — inicio y estado de la ventana de corte |
| `/cliente/catalogo` | `ClientCatalog` |
| `/cliente/confirmar-cotizacion` | `ClientConfirmOrder` — revisar carrito y enviar |
| `/cliente/cotizaciones` | `ClientOrders` |
| `/cliente/cotizaciones/:orderId` | `ClientOrderDetail` |
| `/cliente/administrar` | `ClientManage` — usuarios y sucursales de su empresa (`/api/my-company`) |

Las rutas antiguas con `pedidos` (`/admin/pedidos`, `/cliente/pedidos`, `/cliente/confirmar-pedido`, etc.) redirigen a sus equivalentes con `cotizaciones`. Cualquier ruta desconocida redirige a `/login`.

## Cliente HTTP (`src/api/client.js`)

- `baseURL` = `VITE_API_URL` (por defecto `http://localhost:3000/api`), timeout de 15 s.
- Tokens en `localStorage` con las claves `daval.token` y `daval.refresh_token`.
- **Interceptor de request:** agrega `Authorization: Bearer <token>`.
- **Interceptor de response ante un 401:**
  1. Sin tokens → rechaza sin cerrar sesión.
  2. Hay access token pero no refresh token → `daval:logout`.
  3. Ya hay un refresh en curso → encola la petición y la reintenta con el token nuevo.
  4. Si no → llama `POST /auth/refresh`, guarda los tokens nuevos, vacía la cola y reintenta. Si el refresh falla → `daval:logout`.
- Todo error se normaliza a `ApiError { status, code, message, details }`, donde `code` es el campo `error` de la API (o `NETWORK_ERROR`).

## Estado

| Tipo de estado | Dónde vive |
|---|---|
| Sesión (usuario actual, login, logout) | `AuthContext`, persistido en `localStorage`, sincronizado entre pestañas con `BroadcastChannel` (con respaldo en el evento `storage`). Escucha `daval:logout`. |
| Carrito | `AppContext`, persistido en `localStorage` bajo `daval_cart`. Guarda `productId`, `productName`, `quantity`, `unitPrice` (solo para mostrar) y `unit`. |
| Datos del servidor | React Query. Un hook por recurso en `src/hooks/` (`useProducts`, `useQuotations`, `useRoutes`, `useSiigo`, …). |

Configuración de React Query (`hooks/queryClient.js`):

- `staleTime`: 30 s
- `refetchOnWindowFocus`: `false`
- Reintentos: solo errores `5xx`, máximo 2. Las mutaciones no se reintentan.

## Ventana de corte en el cliente

`utils/routeCutoff.js` y el hook `useRouteCutoff` replican el cálculo del servidor para mostrar mensajes y cuentas regresivas. **La decisión final la toma la API** (`POST /quotations` responde `422 ROUTE_CLOSED`). Ver [Reglas de negocio](./reglas-de-negocio.md#ventana-de-corte-de-rutas).

## Build

- `vite.config.js` separa `vendor-react` y `vendor-charts` (Recharts) en chunks manuales.
- `npm run build` genera `dist/`, que Vercel sirve como estático.
