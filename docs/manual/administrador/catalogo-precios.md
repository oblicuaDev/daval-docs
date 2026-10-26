---
sidebar_position: 3
title: Catálogo, precios y promociones
---

# Catálogo, precios y promociones

## Cómo se calcula el precio que ve el cliente

```text
Precio de su lista de precios
   (o precio base, si el producto no está en su lista)
        │
        ▼
¿Hay una promoción vigente para ese producto y ese cliente?
   ├─ Sí → se cobra el MENOR entre la promoción y su lista
   └─ No → se cobra el precio de su lista
```

El cliente siempre ve el precio final; no tiene que hacer cuentas.

## Categorías

**Nueva Categoría** → nombre, descripción y si está activa. Los clientes filtran el catálogo por categoría.

La sincronización con SIIGO crea una categoría por cada **grupo de inventario** de SIIGO (Cacharrería, Sanitario, Eléctrico…) y se la asigna a los productos que no tengan categoría. Si cambias la categoría de un producto aquí, la sincronización la respeta.

![Categorías](/img/manual/admin/categorias.png)

## Productos

La mayoría de productos llegan desde SIIGO con la [sincronización](./siigo.md#sincronizar-productos) (nombre, código, unidad, stock y precio base). Desde **Productos** completas lo que SIIGO no tiene:

![Productos](/img/manual/admin/productos.png)

- **Imagen del producto** (JPG, PNG, WebP o GIF, máximo 5 MB)
- **Categoría** y **Calidad de producto** (estándar, alta o premium)
- **Descripción**
- Productos relacionados (*cross-selling*)
- **Producto activo:** desactívalo para ocultarlo del catálogo sin borrarlo

Filtra por categoría, calidad o busca por nombre o SKU. **Nuevo Producto** crea uno manual (útil para productos que no están en SIIGO, aunque no podrán enviarse en cotizaciones a SIIGO).

:::note
El botón **Importar Excel** es una demostración y todavía no procesa archivos.
:::

## Listas de precios

*Crea listas por archivo y asigna su cobertura comercial.*

![Listas de precios](/img/manual/admin/listas-precios.png)

1. Pulsa **Descargar plantilla** para obtener el formato.
2. Llena el archivo con tres columnas: **SKU**, **Nombre producto**, **Precio**. El precio puede ir como número de Excel o como texto (`12500`, `12.500` o `$ 12.500,50`).
3. Pulsa **Nueva lista** y escribe el **Nombre de la lista** (por ejemplo, *Lista Ferreterías Mayoristas*).
4. En **Aplicación de la lista** elige:
   - **Todos los clientes:** se vuelve la **lista general**, la que usan los clientes que no tienen una lista propia. Solo puede haber una lista general.
   - **Clientes seleccionados:** busca y marca los clientes que usarán esta lista.
5. En **Archivo de precios**, pulsa **Buscar archivo** y sube el archivo en **Excel (.xlsx)** o **CSV**. Se lee la primera hoja con datos; las columnas se reconocen por su encabezado (*SKU*/*Código*, *Precio*/*Valor*). La pantalla te dice cuántos precios encontró antes de guardar.
6. Guarda.

Cada lista muestra a quién aplica, cuántos **clientes asignados** y **precios cargados** tiene, y la fecha de su **última actualización**.

### Listas que vienen de SIIGO

Las listas de precios de SIIGO (**CONTADO**, **DISTRIBUIDORES** y **CREDITO Y FACT ELECTR**) aparecen solas, con la etiqueta **SIIGO**. La sincronización con SIIGO las crea y actualiza sus precios todos los días.

- Para que un cliente compre a precio de distribuidor o de crédito, pulsa el lápiz de esa lista y márcalo en **Clientes seleccionados**.
- Sus precios no se cargan por archivo: si un precio está mal, corrígelo en SIIGO y espera la próxima sincronización (o lánzala desde **Integraciones**).
- Si un producto no tiene precio en esa lista en SIIGO, el cliente ve el precio base (el de contado).

### Ver los precios de una lista

Pulsa **Ver precios** en la tarjeta de la lista. Verás cada producto con su SKU, el **precio base** (el de SIIGO), el **precio de la lista** y la diferencia en porcentaje (verde si la lista es más barata). Puedes buscar por SKU o nombre y pulsar **Descargar lista** para bajar todos sus precios en el mismo formato de la plantilla.

Los precios quedan guardados: no hace falta volver a cargar el archivo al entrar de nuevo.

:::caution[Una lista sin productos no se puede asignar]
Si el archivo no trae ningún SKU del catálogo, la lista no se crea. Si algunos SKU no existen, se guardan los demás y la pantalla te muestra cuáles se omitieron. Una lista que aparece como **Sin productos** no se puede asignar a clientes ni volver lista general hasta que le cargues precios.
:::

Para editar una lista pulsa el lápiz. Puedes cambiar el nombre o los clientes sin volver a subir el archivo: los precios se conservan. Para cambiar precios, pulsa **Descargar precios actuales**, edita el archivo y súbelo. Luego elige cómo aplicarlo:

- **Actualizar y agregar** (recomendado): cambia los precios de los productos que vienen en el archivo y agrega los nuevos. Los demás precios de la lista se conservan, así que puedes subir un archivo solo con los productos que cambiaron.
- **Reemplazar toda la lista:** la lista queda solo con los productos del archivo; los demás precios se eliminan.

:::tip[Quitar un cliente de una lista]
Desmárcalo en *Clientes seleccionados* y guarda. Ese cliente pasa a usar la lista general. También puedes cambiar la lista de un cliente desde **Usuarios**.
:::

## Promociones

*Crea precios promocionales por archivo con vigencia definida.*

![Promociones](/img/manual/admin/promociones.png)

1. Pulsa **Nueva promoción** y escribe el nombre (por ejemplo, *Promoción Abril Ferreterías*).
2. **Tipo de promoción:**
   - **Eventual:** con fecha y hora de inicio y fin.
   - **Permanente:** solo fecha de inicio, sin vencimiento.
3. **Aplicación:** **Todos los clientes** o **Clientes seleccionados** (búscalos y márcalos).
4. Sube el **archivo de precios promocionales** con el mismo formato de la plantilla (SKU, nombre, precio).
5. Guarda.

Cada promoción muestra su estado: **Programada** (aún no empieza), **Activa**, **Permanente** o **Finalizada**. Los clientes ven la etiqueta **Promo** y la pestaña **Promociones** en el catálogo.
