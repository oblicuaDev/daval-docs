---
sidebar_position: 5
title: Integración con SIIGO
---

# Integración con SIIGO

## Conectar SIIGO

En **Integraciones → Configuración**:

1. Escribe el **Username** y el **Access key** de la API de SIIGO (se obtienen en el portal de SIIGO). **Partner ID** y **Base URL** normalmente no se cambian.
2. Guarda y prueba la conexión.

Si todo está bien verás **Conectado como** tu usuario y cuándo expira el token. El access key se muestra oculto por seguridad.

## Sincronizar productos

En **Sincronización de productos** pulsa el botón para sincronizar. La plataforma trae de SIIGO todos los productos con su código, nombre, unidad, stock y precios.

- Corre en segundo plano: puedes seguir trabajando. Verás el **Estado** de la última ejecución, cuántos productos se **procesaron**, **crearon** y **actualizaron**.
- El **Historial** muestra cada ejecución, quién la lanzó y si hubo errores.
- No borra lo que completaste en la plataforma (fotos, categoría, calidad, descripción).

:::tip[¿Cada cuánto?]
Sincroniza cuando agregues productos o cambies precios en SIIGO, y antes de enviar cotizaciones si ves errores de *productos no sincronizados*.
:::

## Clientes SIIGO

*Sincronización bidireccional de empresas.*

### Traer empresas desde SIIGO

1. Busca por **nombre** o **NIT** y pulsa **Buscar**.
2. Cada resultado indica si ya está **Importado** o **No importado**.
3. Selecciona las que quieras y pulsa **Importar desde SIIGO** (hasta 100 a la vez).

El **Resultado de importación masiva** te muestra cuáles se crearon, cuáles se actualizaron y cuáles fallaron. Las empresas nuevas se crean con una sucursal *Principal*; después asígnales ruta y asesor en **Empresas**.

Reimportar una empresa existente actualiza nombre y datos de contacto, pero **no** cambia su ruta, asesor ni lista de precios.

### Enviar empresas a SIIGO

En la lista de empresas locales, filtra por **Estado sincronización** (*Solo locales*, *Con error*, etc.) y usa la acción de exportar. La empresa debe tener un **NIT real**.

| Estado | Significa |
|---|---|
| **Sincronizado** | Vinculada con SIIGO |
| **Solo local** | Existe solo en la plataforma |
| **Error** | El último intento falló; revisa el mensaje |
| **Bidireccional** (origen) | Se creó en la plataforma y luego se vinculó con SIIGO |
