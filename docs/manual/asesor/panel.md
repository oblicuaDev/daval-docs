---
sidebar_position: 1
title: Tu panel de cotizaciones
---

# Tu panel de cotizaciones

Como asesor comercial, tu menú lateral tiene cuatro opciones: **Mis Cotizaciones**, **Mis Clientes**, **Mis Empresas** y **Listas de Precios**. Solo ves la información de los clientes y sucursales que DAVAL te asignó.

## Mis Cotizaciones

Es tu pantalla principal (*Cotizaciones Asignadas*). Arriba tienes un resumen:

![Cotizaciones asignadas al asesor](/img/manual/asesor/cotizaciones.png)

- **Total cotizaciones** y **Cotizaciones en Siigo** del periodo.
- **Top 10 Productos:** lo que más venden tus clientes, por ingresos.
- **Histórico de Consumos:** monto total por mes de los últimos 12 meses.

Usa los filtros **Desde** y **Hasta** para ver un periodo específico, y **Limpiar** para quitarlos.

Debajo está la lista de cotizaciones asignadas. Pulsa **Ver detalle** para abrir una.

:::info[¿Cómo me llegan las cotizaciones?]
Cuando un cliente envía una cotización, se asigna automáticamente al asesor de la **sucursal** que la pidió. Si una sucursal no tiene asesor, la cotización llega sin asignar y el administrador debe asignarla.
:::

## El detalle de una cotización

Aquí trabajas cada pedido:

![Detalle de cotización para el asesor](/img/manual/asesor/cotizacion-detalle.png)

| Sección | Qué puedes hacer |
|---|---|
| **Encabezado** | Ver cliente, sucursal, asesor, fecha y estado. |
| **Link para ver cotización en Siigo** | Pegar el enlace del documento en SIIGO si lo tienes, y pulsar **Guardar cambios**. |
| **Asesor asignado** | Reasignar la cotización a otro asesor (por ejemplo, si cubres a un compañero). |
| **Productos de la cotización** | Revisar SKU, cantidades, precios unitarios y subtotales. Los precios son los que el sistema calculó cuando el cliente la envió. |
| **Notas del cliente** | Leer instrucciones especiales (horarios, facturación, etc.). |
| **Comentarios internos** | Escribir comentarios sobre la cotización. Pulsa **Publicar comentario** o `Ctrl + Enter`. |
| **Adjuntos** | Descargar archivos asociados. |

:::caution[Los comentarios los ve el cliente]
Aunque la sección se llama *Comentarios internos*, el cliente ve los comentarios en su detalle de la cotización (*Comentarios de la cotización*). Escribe pensando en que el cliente los leerá.
:::

El envío de la cotización a SIIGO lo hace el administrador. Cuando se envía, el estado pasa a **Sincronizada** y aparece el botón **Ver cotización en Siigo**.

## Mis Clientes

Lista de tus clientes con su empresa y sucursal, lista de precios, ruta, número de cotizaciones y fecha de registro. Busca por **nombre o email**.

![Mis Clientes](/img/manual/asesor/clientes.png)

Pulsa un cliente para ver su **Historial de cotizaciones**: código, fecha, ítems, total y estado de cada una. Útil antes de llamarlo o visitarlo.

## Mis Empresas

Empresas que tienen al menos una sucursal asignada a ti. Busca por **nombre o NIT**. En cada empresa ves **Mis sucursales** (las que te corresponden), cuántos clientes y cotizaciones tiene y el total vendido.

![Mis Empresas](/img/manual/asesor/empresas.png)

## Listas de Precios

Aquí creas y mantienes los precios de tus clientes. La web y el chatbot de WhatsApp cotizan con la lista que tenga asignada cada cliente, así que mantenerla al día evita cotizaciones con precios incorrectos.

Solo ves las listas de las que eres responsable. Cada tarjeta muestra cuántos productos tienen precio, cuántos clientes la usan y cuándo se actualizó.

### Crear una lista

1. Pulsa **Nueva lista** y escribe un nombre (no puede repetirse).
2. En **Productos y precios**, busca por nombre o SKU (mínimo 2 letras) y pulsa **Agregar**. El producto entra con su precio base para que lo ajustes.
3. Escribe el precio de cada producto. Debe ser un número **mayor que cero**; los precios inválidos se marcan en rojo. Con el ícono de la papelera quitas un producto.
4. En **Clientes con esta lista**, marca los clientes que la van a usar. Solo aparecen tus clientes; si alguno ya tiene otra lista, se muestra como *Lista actual*.
5. Pulsa **Crear lista**.

El botón no se activa mientras falte el nombre, no haya productos o algún precio no sea válido: una lista sin productos y precios válidos no se puede guardar.

### Editar una lista

Pulsa el lápiz de la lista. Puedes cambiar el nombre, los precios, agregar o quitar productos y cambiar los clientes. Pulsa **Guardar cambios**: la lista queda exactamente como la ves.

:::info[Al asignar y quitar clientes]
Asignar tu lista a un cliente reemplaza la que tenía. Si desmarcas un cliente, vuelve a la lista general de DAVAL.
:::

El administrador ve todas las listas con su asesor responsable y puede reasignarlas. Borrar una lista solo lo puede hacer el administrador.

## Correos que vas a recibir

- **Nuevo cliente asignado:** cuando un cliente nuevo se registra en una sucursal tuya.
- **Nueva empresa asignada:** cuando el administrador te asigna una sucursal.
