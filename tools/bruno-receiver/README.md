# Receptor de Bruno (Piso 2) — Cloudflare Worker

La app de Calpulli avisa cuando pasa algo importante (hoy: nace una
reserva) con un webhook firmado. Este Worker recibe el aviso, verifica
la firma y lo agrega como una línea en `events.jsonl` del repo privado
**driano7/calpulli-events**. Bruno lee ese archivo y le reporta a
Donovan en el chat. Sin correos de por medio y sin darle a Bruno
credenciales de la base de datos.

```
Calpulli (Vercel)                Cloudflare Worker            GitHub privado
lib/bruno-events.js  ──POST──▶   tools/bruno-receiver/  ──API──▶  calpulli-events/events.jsonl
firma HMAC-SHA256                verifica la firma                una línea por evento
```

**Regla de privacidad (no negociable):** los payloads NO llevan datos
personales del huésped — nada de nombres, correos ni teléfonos. Solo la
referencia de la reserva (`booking_ref`) y los datos del journey. El
detalle vive en el panel de Calpulli, no en este archivo.

## Puesta en marcha

### 1. Crear el repo de eventos

- Repo **privado** nuevo: `driano7/calpulli-events`.
- Crear dentro un archivo `events.jsonl` **vacío** (puede ir sin ninguna
  línea; el Worker agrega a partir de ahí).

### 2. Crear el token de GitHub para el Worker

- Token **fine-grained** (Settings → Developer settings → Fine-grained
  tokens), con acceso a **un solo repo**: `calpulli-events`.
- Único permiso: **Contents — Read and write**.
- Ese token es `GH_TOKEN` en el Worker. No reutilizarlo en nada más.

### 3. Desplegar el Worker

- Cloudflare → Workers & Pages → Create Worker.
- Pegar el contenido de `worker.js` (este directorio) y desplegar.
- Secrets del Worker (Settings → Variables and Secrets):
  - `BRUNO_WEBHOOK_SECRET` — inventa un secreto largo (p. ej. `openssl
    rand -hex 32`). Debe ser **exactamente el mismo** que en la app.
  - `GH_TOKEN` — el token del paso 2.
- Anotar la URL del Worker (algo como
  `https://bruno-receiver.<tu-subdominio>.workers.dev`).

### 4. Configurar la app de Calpulli (Vercel)

En el proyecto de Calpulli en Vercel → Settings → Environment Variables:

- `BRUNO_WEBHOOK_URL` — la URL del Worker del paso 3.
- `BRUNO_WEBHOOK_SECRET` — el mismo secreto del paso 3.

Y **redesplegar** la app para que tome las variables. Sin estas dos
variables, `fireBrunoEvent` no hace nada (la app funciona igual, solo
que Bruno no se entera). También están documentadas en `.env.example`.

### 5. Prueba

- Hacer una reserva de prueba (efectivo sirve).
- Revisar `calpulli-events/events.jsonl`: debe aparecer una línea
  `{"event":"booking.created", ...}` y un commit `event: booking.created`.
- Si no aparece: revisar que las variables coincidan **al caracter**
  (un secreto distinto = firma inválida = el Worker responde 401 y la
  app lo ignora en silencio, por diseño).

## Estado de la conexión (noviembre 2026)

- **`booking.created` — CONECTADO.** Se dispara dentro de
  `createBookingInTurso` (`lib/booking/turso.ts`), justo después de
  persistir la reserva y sus tickets. Ese es el único embudo por el que
  pasan los tres canales de venta (efectivo en `pages/api/bookings/cash.js`,
  cripto en `pages/api/bookings/crypto.js` y tarjeta en
  `pages/api/stripe/confirm.js`), así que una sola llamada cubre todo.
  Payload: `booking_ref`, `journey`, `date`, `guests`, `amount` +
  `currency` en la moneda de la reserva, `amount_mxn` solo cuando la
  moneda es MXN, `payment_method` y `status`.
  - Sin `partner_ref` ni canal de adquisición: en esa capa del código
    la atribución de socio todavía no existe (la crean los endpoints
    después, vía `createAttribution`). Si se quiere, se emite un segundo
    evento desde el endpoint cuando la atribución nazca.
- **Pendientes de conectar** (el helper ya los soporta; falta el call
  site, no el diseño): `booking.cancelled` y `booking.completed` en los
  flujos de cancelación/cierre, y `partner.commission_payable` /
  `partner.commission_paid` donde `booking_attributions` cambia de
  estado a PAYABLE/PAID.
