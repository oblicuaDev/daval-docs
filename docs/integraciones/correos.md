---
sidebar_position: 2
title: Correos
---

# Correos transaccionales

`api/src/lib/mailer.js` envía correos HTML con Nodemailer por SMTP.

## Configuración

| Variable | Descripción |
|---|---|
| `SMTP_HOST` | Servidor SMTP (p. ej. `smtp.gmail.com`) |
| `SMTP_PORT` | Puerto (por defecto `587`) |
| `SMTP_SECURE` | `true` para TLS directo (puerto 465) |
| `SMTP_USER`, `SMTP_PASS` | Credenciales. En Gmail, usa una contraseña de aplicación |
| `SMTP_FROM` | Remitente (por defecto `SMTP_USER`) |
| `ADMIN_NOTIFICATION_EMAIL` | Destinatario de los avisos de registro. Si falta, esos avisos se omiten |
| `APP_URL` | URL pública del frontend, para los enlaces de los correos |

Si faltan `SMTP_HOST`, `SMTP_USER` o `SMTP_PASS`, el sistema funciona igual y solo registra una advertencia.

## Correos que se envían

| Función | Asunto | Destinatario | Cuándo |
|---|---|---|---|
| `sendAdminNewRegistrationEmail` | `Nuevo registro: Empresa — <nombre>` | `ADMIN_NOTIFICATION_EMAIL` | `POST /companies` |
| `sendAdminNewRegistrationEmail` | `Nuevo registro: Cliente — <nombre>` | `ADMIN_NOTIFICATION_EMAIL` | `POST /users` con rol `client` |
| `sendAdvisorNewClientEmail` | `Nuevo cliente asignado: <cliente>` | Asesor de la sucursal | `POST /users` con rol `client` y sucursal con asesor |
| `sendAdvisorCompanyAssignedEmail` | `Nueva empresa asignada: <empresa>` | Asesor | Un admin crea una sucursal con asesor o cambia su asesor |
| `sendClientAdvisorAssignedEmail` | `Tu asesor comercial: <asesor>` | Email de la empresa | Igual que el anterior, si la empresa tiene email |

## Comportamiento

- Los correos se envían **después** de responder la petición (*fire-and-forget*): un error de SMTP nunca hace fallar la operación, solo se registra en consola.
- Las fechas se formatean en `es-CO` con zona `America/Bogota`.
- En serverless, un correo enviado después de responder puede no completarse si la invocación termina antes.
