# Reportes de socios y equipo

Reportes automáticos con datos reales de Turso. No hay mocks, proyecciones ni
cifras estimadas: si una consulta no devuelve datos, el reporte muestra cero o
un mensaje vacío.

## Cadencia

| Reporte | Periodo cerrado                  | Se envía                                                   |
| ------- | -------------------------------- | ---------------------------------------------------------- |
| Diario  | El día anterior                  | Todos los días a las 15:00 UTC (09:00 en Ciudad de México) |
| Semanal | Semana anterior, lunes a domingo | Lunes                                                      |
| Mensual | Mes anterior completo            | Día 1 de cada mes                                          |

Vercel Hobby limita el proyecto a 2 crons, así que el cron diario existente
(`/api/cron/booking-reminders`) también dispara los reportes. La lógica de qué
reportes toca enviar vive en `lib/reports/cron.ts` y usa la fecha local de
`America/Mexico_City`. `/api/cron/partner-reports` queda disponible para
pruebas manuales o para planes con más crons; no está programado en
`vercel.json`.

## Destinatarios y permisos

Los destinatarios se resuelven con la misma fuente de verdad que el resto de la
app:

1. `ADMIN_EMAILS` → socios/admin.
2. `EMPLOYEE_EMAILS` → equipo operativo.
3. Tabla `user_roles` (`admin`, `employee`).
4. `users.role IN ('admin', 'guide')` → admin.

Un correo que esté en más de una lista se envía una sola vez y con la versión de
mayor permiso (admin gana sobre employee).

| Sección                                      | Socios/admin                | Equipo/empleados                     |
| -------------------------------------------- | --------------------------- | ------------------------------------ |
| Reservas creadas, viajeros, pagos pendientes | Sí                          | Solo tours/viajeros/pagos pendientes |
| Ingresos por reservas pagadas                | Sí, por moneda              | No                                   |
| Referidos y montos                           | Sí                          | No                                   |
| Demografía, PII, contactos                   | No se incluye en el reporte | No                                   |
| Tours por día, check-in, próximos 7 días     | Sí                          | Sí                                   |

El reporte operativo nunca consulta importes ni datos personales. No se envían
reportes a clientes.

## Qué significan las cifras

- **Reservas creadas**: filas de `bookings` cuyo `created_at` cae en el periodo,
  convertido a hora de Ciudad de México.
- **Viajeros reservados**: suma de `guests` de esas reservas.
- **Reservas pagadas**: reservas con `payment_status = 'paid'` creadas en el
  periodo, excluyendo canceladas, reembolsadas y no-show.
- **Ingresos por reservas pagadas**: suma de `total_amount` agrupada por
  `currency`. **Nunca se suman monedas distintas.** El reporte muestra una línea
  por moneda.
- **Tours del periodo**: reservas activas cuya `start_date` cae en el periodo.
- **Check-in**: tours con `checked_in_at` no nulo sobre el total de tours.
- **Próximos 7 días**: ventana posterior al cierre del periodo, agrupada por día
  y journey.
- **Referidos**: conversiones de `referral_conversions` por `converted_at` en el
  periodo, agrupadas por código y moneda.
- **Nuevos usuarios**: usuarios con `created_at` en el periodo.

### Nota importante sobre `paid_at`

Hoy `lib/booking/turso.ts` llena `paid_at` con la fecha de inicio del tour, no
con el instante del cobro. Por eso los reportes **no** usan `paid_at` como fecha
de pago: usan `created_at` de la reserva y lo documentan en el propio correo. Si
más adelante se separa `paid_at` (fecha real de cobro), se puede cambiar
`lib/reports/queries.ts` sin tocar el resto del sistema.

## Deduplicación

La tabla `partner_report_log` tiene:

```sql
UNIQUE (period_type, period_key, recipient_email)
```

Antes de enviar se hace un `INSERT ... ON CONFLICT DO NOTHING`. Solo el proceso
que inserta la fila puede enviar. Si el cron se reintenta o alguien pulsa
"Enviar" varias veces, el segundo intento se omite.

Estados:

- `pending`: reservado, en proceso.
- `sent`: enviado y registrado.
- `failed`: falló el proveedor. Se puede reintentar desde el panel o con
  `retry: true`.
- `skipped`: no se envió (por ejemplo `MAIL_ENABLED != true` o proveedor sin
  configurar). También se puede reintentar.

## Activación

Variables de entorno:

```bash
REPORTS_ENABLED=true
MAIL_ENABLED=true
BREVO_API_KEY=...
BREVO_SENDER_EMAIL=...
BREVO_SENDER_NAME=Calpulli CDMX
CRON_SECRET=...        # opcional, recomendado
```

Sin `MAIL_ENABLED=true` y una configuración válida de Brevo/SMTP, el servicio
funciona en modo `skip`: no manda correos, pero registra el intento en
`email_log` y `partner_report_log`.

La tabla se crea de forma perezosa desde `lib/reports/store.ts`, pero conviene
aplicar la migración explícita:

```bash
turso db shell <db> < turso-reports.sql
```

## API

### `GET /api/admin/reports`

Vista previa con datos reales.

Parámetros:

- `type`: `daily` | `weekly` | `monthly` (default `daily`).
- `period`: clave del periodo (`2026-10-30`, `2026-W44`, `2026-10`). Si se
  omite, se usa el periodo cerrado anterior.
- `audience`: `admin` | `employee`. Un empleado siempre recibe `employee`.

Requiere `Authorization: Bearer <token>`.

### `POST /api/admin/reports`

Solo admin. Envía el reporte con deduplicación.

```json
{
  "type": "daily",
  "period": "2026-10-30",
  "mode": "all",
  "audience": "all",
  "retry": false
}
```

- `mode: "all"` → todos los destinatarios con rol.
- `mode: "self"` → solo el admin autenticado.
- `audience`: `admin` | `employee` | `all` (solo aplica con `mode: "all"`).
- `retry: true` → reintenta filas `failed`/`skipped` del mismo periodo.

### `GET|POST /api/cron/partner-reports`

Endpoint dedicado de reportes. En Hobby no está programado; el cron real es
`/api/cron/booking-reminders`. Si `CRON_SECRET` está definido, exige
`Authorization: Bearer $CRON_SECRET`. Para probar manualmente:

```bash
curl -H "Authorization: Bearer $CRON_SECRET" \
  "https://donovan-amx.vercel.app/api/cron/partner-reports?type=all"
```

`?type=daily|weekly|monthly|all` fuerza los reportes a generar.

## Panel

En `/admin`, dentro de la sección exclusiva de socios, aparece **Reportes de
socios y equipo**. Permite:

- alternar diario/semanal/mensual;
- previsualizar la versión de socios o de equipo;
- enviar a todo el equipo, enviarse copia o reintentar fallidos;
- ver los últimos envíos y su estado.

## Archivos

- `lib/reports/period.ts`: periodos y límites UTC en `America/Mexico_City`.
- `lib/reports/queries.ts`: consultas reales a Turso.
- `lib/reports/build.ts`: métricas y tablas por audiencia.
- `lib/reports/render.ts`: HTML/texto del correo.
- `lib/reports/recipients.ts`: resolución de destinatarios por rol.
- `lib/reports/store.ts`: tabla y deduplicación.
- `lib/reports/send.ts`: envío y resumen.
- `pages/api/admin/reports.ts`: API del panel.
- `lib/reports/cron.ts`: lógica compartida de reportes debidos.
- `pages/api/cron/partner-reports.ts`: endpoint dedicado (manual o planes con más crons).
- `pages/api/cron/booking-reminders.ts`: cron diario que también dispara los reportes.
- `components/admin/PartnerReportsPanel.tsx`: UI.
- `turso-reports.sql`: migración.
