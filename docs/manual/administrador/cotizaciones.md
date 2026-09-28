---
sidebar_position: 4
title: Gestionar cotizaciones
---

# Gestionar cotizaciones

En **Cotizaciones** ves todas las cotizaciones del sistema.

## Filtros

- **Buscar** por código o nombre del cliente.
- **Estado:** Enviada, Aprobada, Rechazada, Sincronizada, Borrador.
- **Todas / Pendientes SIIGO / Sincronizadas:** para encontrar rápido las que faltan por pasar a contabilidad.

Pulsa **Gestionar** para abrir una.

## El detalle

Tienes todo lo que ve el asesor (productos, notas del cliente, comentarios, adjuntos, cambio de asesor y link de SIIGO; ver [la guía del asesor](../asesor/panel.md#el-detalle-de-una-cotización)) más el bloque **Integración Siigo**.

## Enviar una cotización a SIIGO

1. Abre la cotización y pulsa **Enviar a SIIGO**.
2. Espera el mensaje de confirmación (*Enviando…*).
3. Si sale bien:
   - El estado pasa a **Sincronizada**.
   - Aparece el número de SIIGO (por ejemplo, `C-1-26329`).
   - Si SIIGO entrega el PDF, se activa **Ver cotización en Siigo**, que también ve el cliente.

Si el número aparece pero no el enlace, pulsa **Obtener link**: la plataforma vuelve a consultar SIIGO. Si SIIGO no genera PDF, el botón desaparece.

### Si falla

El bloque muestra el historial de intentos con el error. Los más comunes:

| Mensaje | Qué hacer |
|---|---|
| Productos no sincronizados con SIIGO | Hay productos creados a mano o nuevos. Ve a **Integraciones** y sincroniza productos. |
| Productos eliminados del catálogo | La cotización tiene un producto que ya no existe. Pide al cliente una nueva cotización. |
| El cliente con NIT … no existe en SIIGO | Exporta la empresa desde **Clientes SIIGO** o créala en SIIGO. |
| El cliente no tiene NIT configurado | Completa el NIT de la empresa en **Empresas**. |
| SIIGO requiere un vendedor | Asigna el **vendedor SIIGO** al asesor en **Asesores**. |
| Ya fue enviada a SIIGO | Ya está registrada; no hace falta enviarla de nuevo. |

Después de corregir, pulsa **Enviar a SIIGO** otra vez. **Reintentar (forzar)** vuelve a enviarla aunque el sistema crea que ya se envió: úsalo solo si confirmaste en SIIGO que **no** quedó creada, para no duplicarla.
