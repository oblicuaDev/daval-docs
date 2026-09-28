---
sidebar_position: 2
title: Rutas, empresas y usuarios
---

# Rutas, empresas y usuarios

## Rutas

Una ruta es el recorrido semanal de entrega. Determina **hasta cuándo** pueden pedir los clientes.

1. Pulsa **Nueva Ruta**.
2. Completa:
   - **Nombre de la ruta** (por ejemplo, *Ruta Norte Empresarial*)
   - **Día de la semana** en que se entrega
   - **Hora máxima para cotizaciones** (hora de corte)
   - **Ciudad**
   - Opcional: **zona**, **calle / carrera inicial y final** y la cobertura en el mapa (**Abrir mapa**, **Centrar en zona**).
3. Guarda.

La tarjeta **Regla de recepción** te confirma la regla: *"Los clientes de esta ruta podrán montar cotizaciones hasta el día anterior a la ruta a las HH:MM."*

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

## Usuarios (clientes)

Cuentas con las que los clientes entran a la plataforma.

1. Pulsa **Nuevo Cliente**.
2. Elige **Empresa** y **Sucursal**. El cliente hereda la **ruta** y el **asesor** de esa sucursal.
3. Escribe el nombre (usuario o razón social), **email** y **contraseña**.
4. Elige su **lista de precios** (o *Sin lista asignada* para usar la lista general).
5. Guarda.

Comunícale al cliente su correo y contraseña. Su asesor recibe el aviso *"Nuevo cliente asignado"*.

## Asesores

1. Pulsa **Nuevo Asesor** → nombre completo, email y contraseña.
2. En la lista, usa **Asignar vendedor SIIGO** para elegir a qué vendedor de SIIGO corresponde.

:::caution[Vendedor SIIGO]
Sin vendedor SIIGO asignado, las cotizaciones de ese asesor no se pueden enviar a SIIGO. Si la lista de vendedores no carga, revisa la conexión en **Integraciones**.
:::
