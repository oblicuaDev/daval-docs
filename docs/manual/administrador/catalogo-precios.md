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

## Productos

La mayoría de productos llegan desde SIIGO con la [sincronización](./siigo.md#sincronizar-productos) (nombre, código, unidad, stock y precio base). Desde **Productos** completas lo que SIIGO no tiene:

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

1. Pulsa **Descargar plantilla** para obtener el formato.
2. Llena el archivo con tres columnas: **SKU**, **Nombre producto**, **Precio** (solo números, sin puntos ni comas).
3. Pulsa **Nueva lista**, escribe el **Nombre de la lista** (por ejemplo, *Lista Ferreterías Mayoristas*).
4. En **Archivo de precios**, pulsa **Buscar archivo** y sube la plantilla en formato **CSV**.
5. Guarda.

Cada lista muestra cuántos **precios cargados** tiene. Para cambiar precios, edita la lista y sube el archivo de nuevo: **reemplaza** todos los precios anteriores.

:::caution[Asignar la lista a los clientes]
La lista se aplica al cliente desde **Usuarios**, en el campo *lista de precios* de cada cliente. Los clientes sin lista usan la lista general. Por ahora la opción *Aplicación de la lista* de esta pantalla no cambia la lista de ningún cliente.
:::

## Promociones

*Crea precios promocionales por archivo con vigencia definida.*

1. Pulsa **Nueva promoción** y escribe el nombre (por ejemplo, *Promoción Abril Ferreterías*).
2. **Tipo de promoción:**
   - **Eventual:** con fecha y hora de inicio y fin.
   - **Permanente:** solo fecha de inicio, sin vencimiento.
3. **Aplicación:** **Todos los clientes** o **Clientes seleccionados** (búscalos y márcalos).
4. Sube el **archivo de precios promocionales** con el mismo formato de la plantilla (SKU, nombre, precio).
5. Guarda.

Cada promoción muestra su estado: **Programada** (aún no empieza), **Activa**, **Permanente** o **Finalizada**. Los clientes ven la etiqueta **Promo** y la pestaña **Promociones** en el catálogo.
