# Correo transaccional con Brevo

Este documento describe cómo está armado el correo de Calpulli CDMX, cómo
configurarlo y cómo probarlo sin mandar correos reales por accidente.

## Arquitectura

- **Proveedor:** Brevo (API transaccional `POST /v3/smtp/email`).
- **Servicio central:** `lib/mail/service.ts` (`sendMail`, `trySend`).
- **Cliente Brevo:** `lib/mail/brevo.ts` — solo se ejecuta en el backend; la
  API key nunca llega al navegador.
- **Plantillas:** `lib/mail/templates.ts` (valores por defecto) y la tabla
  `email_templates` (lo que se edita desde el panel). La base de datos manda;
  el código es el respaldo.
- **Bitácora:** cada intento se registra en `email_log` con estado
  `pending | sent | failed | skipped`, plantilla, destinatario, asunto,
  proveedor y error.
- **Separación:** los correos transaccionales (reserva, verificación de
  cuenta, recuperación de contraseña, recordatorio, check-in, referidos) salen
  del servicio central. Las campañas comerciales y el boletín viven en sus
  propios endpoints y nunca se mezclan con esta cola.
- **Fallback:** si `MAIL_PROVIDER=smtp` o `mailgun`, el servicio usa
  nodemailer como antes.

## Variables de entorno

```env
# Proveedor transaccional
MAIL_PROVIDER=brevo
BREVO_API_KEY=xkeysib-...
BREVO_SENDER_EMAIL=no-reply@calpulli-cdmx.com
BREVO_SENDER_NAME=Calpulli CDMX

# Interruptor maestro: sin esto no sale ningún correo real.
MAIL_ENABLED=true

# Opcionales
MAIL_FROM_EMAIL=no-reply@calpulli-cdmx.com
MAIL_FROM_NAME=Calpulli CDMX
MAIL_REPLY_TO=hola@calpulli-cdmx.com
```

`BREVO_SENDER_EMAIL` debe ser un remitente verificado en Brevo (Settings →
Senders & IP). Si no coincide, Brevo rechaza el envío.

## Configuración en Brevo

1. Crear cuenta y verificar el dominio en **Settings → Senders, Domains &
   Dedicated IPs → Domains**.
2. Agregar los registros DNS que Brevo indique. Como mínimo:
   - **SPF**: un `TXT` en el dominio con `include:spf.brevo.com` (no crear dos
     SPF; si ya existe uno, fusionar los `include`).
   - **DKIM**: los registros `TXT`/`CNAME` que Brevo genera para el dominio.
   - **DMARC**: un `TXT` en `_dmarc` con política de monitoreo:
     `v=DMARC1; p=none; rua=mailto:dmarc@calpulli-cdmx.com`
     Cuando el tráfico esté limpio, subir a `p=quarantine` y luego
     `p=reject`.
3. Verificar el dominio (puede tardar hasta 48 h).
4. Crear una API key en **Settings → SMTP & API → API Keys** con permiso de
   envío transaccional. Copiarla solo al backend (Vercel → Environment
   Variables). Nunca a `NEXT_PUBLIC_*`.
5. Opcional: configurar el webhook de eventos de Brevo si se quiere alimentar
   analítica de entregas. El estado operativo se consulta en `email_log`.

## Plantillas

Las plantillas viven en el repositorio con layout, encabezado, pie, botones y
tablas. No se usan plantillas alojadas en Brevo.

Plantillas actuales:

| Clave                   | Uso                                                      |
| ----------------------- | -------------------------------------------------------- |
| `welcome`               | Bienvenida al crear cuenta                               |
| `email_verification`    | Verificación de correo (token con hash, un solo uso)     |
| `password_reset`        | Recuperación de contraseña (token con hash, un solo uso) |
| `booking_confirmed`     | Reserva pagada (tarjeta o cripto confirmado)             |
| `booking_cash_reserved` | Reserva en efectivo, pago pendiente                      |
| `booking_reminder`      | Recordatorio del tour de mañana                          |
| `check_in_done`         | Check-in registrado en el punto de encuentro             |
| `referral_converted`    | Un referido reservó con tu código                        |

### Agregar una plantilla

1. Añadir la clave y sus variables en `TEMPLATE_META` (`lib/mail/templates.ts`).
2. Añadir el HTML/texto por defecto en `DEFAULT_TEMPLATES`.
3. Ejecutar el seed: la primera llamada a `getTemplate`/`listTemplates`
   inserta las plantillas faltantes en `email_templates`.
4. Enviarla con:

   ```ts
   await trySend('mi_plantilla', email, userId, { firstName: 'Ana' }, 'es')
   ```

   `trySend` nunca lanza: si el correo falla, la reserva o el registro siguen.

Los valores interpolados deben escaparse con `escapeHtml` cuando vienen de
nombres o texto libre.

## Idiomas

`subject`, `html` y `text` pueden ser un string (español) o un objeto
`{ es, en }`. `getTemplate(key, locale)` resuelve el idioma; `trySend` acepta
`locale` como quinto argumento. Las plantillas guardadas en la base de datos se
guardan en español y se editan desde el panel.

## Duplicados y reintentos

- Ventana anti-duplicados: **10 minutos** por plantilla + destinatario. Un
  doble clic o un reintento del cron no reenvía.
- Los crons son idempotentes: si Vercel los reintenta dentro de la ventana, el
  servicio registra `skipped` y no manda dos veces.
- No hay reintentos automáticos agresivos: el fallo se registra en
  `email_log` y la operación principal continúa. Para reprocesar, se puede
  volver a llamar al endpoint después de la ventana.

## Crons

`vercel.json`:

- `/api/cron/lucha-scraper` — cada 3 días (`0 6 */3 * *`).
- `/api/cron/booking-reminders` — diario (`0 15 * * *`), calcula “mañana” en
  `America/Mexico_City`.

Ambos aceptan `GET`/`POST` y, si existe `CRON_SECRET`, exigen
`Authorization: Bearer <CRON_SECRET>`.

## Probar sin mandar correos reales

- Dejar `MAIL_ENABLED` distinto de `true`: el servicio funciona en modo skip y
  escribe en `email_log` con el motivo.
- Sin `BREVO_API_KEY`/`BREVO_SENDER_EMAIL` también queda en skip.
- Para probar Brevo de verdad, usar un remitente y destinatario de prueba
  autorizados. No usar direcciones de clientes reales.
- Revisar la tabla `email_log`:

  ```sql
  SELECT template_key, to_email, status, error, created_at
  FROM email_log
  ORDER BY created_at DESC
  LIMIT 50;
  ```

## Seguridad

- La API key solo existe en el servidor.
- Los tokens de verificación y recuperación se guardan con hash, expiran y se
  invalidan al usarse.
- Nunca se revela si un correo existe o no en los flujos de autenticación.
- Los enlaces de ticket usan el código del ticket (secreto tipo pase de
  abordar); no exponen email, teléfono ni datos de la cuenta.
