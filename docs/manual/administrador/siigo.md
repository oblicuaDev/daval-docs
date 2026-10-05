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

La plataforma se sincroniza **sola todos los días a las 5:00 a. m.** Trae de SIIGO todos los productos con su código, nombre, unidad, stock y precios, y desactiva los que ya no existen en SIIGO.

Para sincronizar en otro momento, en **Sincronización de productos** pulsa **Sincronizar ahora**. Tarda unos segundos.

- Verás el **Estado** de la última ejecución, la **última sync exitosa** y la **última completa**.
- El **Historial** muestra cada ejecución: modo (*Completa* o *Incremental*), cuántos productos se **procesaron**, **crearon**, **actualizaron** y **desactivaron**, quién la lanzó (*Automática* si fue programada) y si hubo errores.
- No borra lo que completaste en la plataforma (fotos, categoría, calidad, descripción).

:::tip[¿Cuándo sincronizar a mano?]
Cuando crees productos o cambies precios en SIIGO y los necesites antes de la sync de la mañana, y antes de enviar cotizaciones si ves errores de *productos no sincronizados*.
:::

| Si en SIIGO… | En la plataforma… |
|---|---|
| Creas un producto | Aparece en la próxima sincronización, sin categoría ni calidad: complétalas |
| Cambias nombre, precio o stock | Se actualiza en la próxima sincronización |
| Inactivas o eliminas un producto | Deja de aparecer en el catálogo y no se puede cotizar |

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


---

## Integraciones externas (API keys)

Además de SIIGO, otros sistemas externos pueden necesitar leer datos de DAVAL sin ser un usuario de la plataforma — por ejemplo, un **chatbot** que consulta el catálogo. Para eso existen los **API keys de integración**, gestionados con `POST /api/api-keys`, `GET /api/api-keys` y `DELETE /api/api-keys/:id` (por ahora sin pantalla propia; se administran con esas peticiones directas).

- Cada key tiene un nombre y uno o más **alcances** (`scopes`). Hoy el único disponible es `catalog:read`, que solo habilita la consulta de categorías (`GET /api/categories`); el catálogo de productos ya es público y no necesita key.
- El valor completo del key **se muestra una sola vez**, al crearlo. Si se pierde, hay que revocarlo y generar uno nuevo.
- Revocar un key es inmediato y no afecta a nadie más: ni a otros keys ni a los usuarios de la plataforma.
- Un key de integración **nunca** da acceso a datos de clientes, promociones específicas ni listas de precios: solo a lo marcado explícitamente como de solo lectura.
