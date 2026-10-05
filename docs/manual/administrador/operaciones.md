---
sidebar_position: 2
title: Rutas, empresas y usuarios
---

# Rutas, empresas y usuarios

## Rutas

Una ruta es el recorrido de entrega. Su calendario determina **qué días** se entrega y **hasta cuándo** pueden pedir los clientes, tanto en la web como por WhatsApp.

1. Pulsa **Nueva Ruta**.
2. Completa:
   - **Nombre de la ruta** (por ejemplo, *Ruta Norte Empresarial*)
   - **Días de operación**: marca uno o varios días en que se entrega.
   - **Frecuencia**: *Semanal*, o *Quincenal (cada 2 semanas)*.
   - **Fecha de referencia** (solo quincenal): cualquier fecha en que la ruta **sí** sale. A partir de ella se repite cada 2 semanas.
   - **Cierre de cotizaciones**: cuántos días antes de la ruta se cierra la recepción (*El mismo día*, *1 día antes*, *2 días antes*…).
   - **Hora de cierre**.
   - **Ciudad**
   - Opcional: **zona**, **calle / carrera inicial y final** y la cobertura en el mapa (**Abrir mapa**, **Centrar en zona**).
3. Guarda.

La tarjeta **Regla de recepción** te describe el calendario mientras lo configuras, por ejemplo: *"La ruta opera Lunes cada dos semanas. Los clientes pueden cotizar hasta 3 días antes de la ruta a las 17:00; la recepción reabre el día siguiente a cada ruta."*

**Ejemplos**

| Necesito… | Configura |
|---|---|
| Entregar los jueves; recibir hasta el miércoles 5 p. m. | Jueves · Semanal · 1 día antes · 17:00 |
| Entregar los lunes; recibir hasta el viernes 5 p. m. | Lunes · Semanal · 3 días antes · 17:00 |
| Entregar un miércoles sí y otro no | Miércoles · Quincenal · fecha de referencia = un miércoles en que sí sale |

:::caution[Calendarios que no se pueden guardar]
Si el cierre es tan anticipado que ninguna entrega tendría tiempo para recibir pedidos (por ejemplo, ruta semanal que cierra 7 días antes), o la fecha de referencia no cae en un día de operación, el sistema muestra el motivo y no guarda.
:::

Al eliminar una ruta, deja de estar disponible pero no se borra su historial.

## Empresas y sucursales

La **empresa** es el cliente (con su NIT). Cada **sucursal** es un punto de entrega y es la que define **ruta** y **asesor**.

**Crear una empresa:** **Nueva Empresa** → nombre, NIT, email, teléfono y dirección principal.

**Agregar una sucursal:** dentro de la empresa, **Agregar sucursal** → nombre, ciudad, dirección, **Ruta relacionada** y **Asesor asignado**.

:::info[Asignar asesor envía correos]
Cuando asignas o cambias el asesor de una sucursal, el asesor recibe *"Nueva empresa asignada"* y la empresa recibe *"Tu asesor comercial"* con los datos de contacto.
:::

:::caution
Una vez asignadas, la ruta y el asesor de una sucursal se pueden **cambiar** por otros, pero no dejar vacíos.
:::

Usa el buscador para encontrar empresas por nombre, NIT, email o sucursal. Las empresas que se registran solas desde la pantalla de inicio de sesión aparecen aquí sin ruta ni asesor: complétalas.

## Clientes

Un cliente puede entrar a la plataforma web o atenderse **solo por WhatsApp**, a través del chatbot.

1. Pulsa **Nuevo Cliente**.
2. Marca **Acceso a la plataforma web** si el cliente va a entrar a la web. Si no lo marcas, el cliente es *Solo WhatsApp* y no necesita email ni contraseña.
3. Elige **Empresa** y **Sucursal**. El cliente hereda la **ruta** y el **asesor** de esa sucursal.
4. Escribe el nombre (usuario o razón social). Con acceso web, también **email** y **contraseña**.
5. Elige su **lista de precios** (o *Lista general*). La lista es de cada cliente: dos clientes de la misma empresa pueden tener listas distintas.
6. Agrega sus **teléfonos WhatsApp** (ver abajo).
7. Guarda.

Si tiene acceso web, comunícale su correo y contraseña. Su asesor recibe el aviso *"Nuevo cliente asignado"*.

Para cambiar la empresa, la sucursal, la lista de precios, los teléfonos o desactivar a un cliente, usa el lápiz de su fila.

### Teléfonos WhatsApp

El chatbot reconoce al cliente **por estos números**. Si el número con el que escribe no está registrado, el chatbot no sabe quién es.

- Escribe el celular de 10 dígitos (`300 123 4567`) o en formato internacional (`+57 300 123 4567`). Se guarda siempre como `+573001234567`.
- Los fijos sin código de país no se aceptan, porque son ambiguos.
- Un cliente puede tener varios números (dueño, bodega…). Usa la **etiqueta** para distinguirlos.
- Un mismo número puede estar en clientes de distintas empresas. En ese caso el chatbot le pregunta al cliente con cuál empresa quiere seguir.

## Asesores

1. Pulsa **Nuevo Asesor** → nombre completo, email y contraseña.
2. En la lista, usa **Asignar vendedor SIIGO** para elegir a qué vendedor de SIIGO corresponde.

:::caution[Vendedor SIIGO]
Sin vendedor SIIGO asignado, las cotizaciones de ese asesor no se pueden enviar a SIIGO. Si la lista de vendedores no carga, revisa la conexión en **Integraciones**.
:::
