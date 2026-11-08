// MIT License - Copyright (c) 2024-2026 Donovan Riaño / Calpulli CDMX - See LICENSE
/**
 * Piso 2 — eventos de la app hacia Bruno.
 *
 * Cada vez que pasa algo importante (una reserva, una cancelación, una
 * comisión de socio), la app avisa con un webhook firmado a un receptor
 * mínimo (tools/bruno-receiver/) que guarda el evento como una línea en
 * events.jsonl del repo privado driano7/calpulli-events. Bruno lee ese
 * archivo y le reporta a Donovan en el chat. Sin correos de por medio y
 * sin darle a Bruno acceso a la base de datos.
 *
 * Uso:
 *   import { fireBrunoEvent } from '@/lib/bruno-events' // o ruta relativa
 *   fireBrunoEvent('booking.created', { booking_ref, journey, date, guests })
 *
 * Eventos v1:
 *   booking.created             Se crea una reserva (checkout o WhatsApp)
 *   booking.cancelled           Se cancela o reembolsa una reserva
 *   booking.completed           El journey ya se realizó
 *   partner.commission_payable  Una atribución de socio pasa a PAYABLE
 *   partner.commission_paid     Se liquida la comisión al socio
 *
 * Reglas de la casa:
 *   - SIN datos personales del huésped en el payload: nada de nombres,
 *     correos ni teléfonos. Solo la referencia de la reserva
 *     (booking_ref) y los datos del journey.
 *   - Fire-and-forget: la llamada NO se espera (sin await) y cualquier
 *     error se traga en silencio. El reporte nunca puede bloquear ni
 *     tumbar una venta.
 *   - Si falta BRUNO_WEBHOOK_URL o BRUNO_WEBHOOK_SECRET, no hace nada.
 */
import { createHmac } from 'crypto'

/**
 * Hora actual en Ciudad de México como ISO 8601 con offset -06:00.
 * CDMX es UTC-06:00 fijo desde 2022 (ya no hay horario de verano), así
 * que se desplaza el instante UTC y se etiqueta con el offset.
 *
 * @returns {string} p. ej. "2026-11-07T22:15:00.000-06:00"
 */
function nowInMexicoCity() {
  const shifted = new Date(Date.now() - 6 * 60 * 60 * 1000)
  return shifted.toISOString().replace('Z', '-06:00')
}

/**
 * Dispara un evento hacia el receptor de Bruno. Nunca lanza, nunca
 * bloquea: pensada para llamarse sin await desde el flujo de venta.
 *
 * @param {string} event Nombre del evento (ver la lista arriba).
 * @param {Record<string, unknown>} [data] Campos del payload, sin PII.
 * @returns {void}
 */
export function fireBrunoEvent(event, data = {}) {
  try {
    const url = process.env.BRUNO_WEBHOOK_URL
    const secret = process.env.BRUNO_WEBHOOK_SECRET
    if (!url || !secret) return

    const body = JSON.stringify({ event, at: nowInMexicoCity(), ...data })
    const signature = createHmac('sha256', secret).update(body).digest('hex')

    fetch(url, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-bruno-signature': signature,
      },
      body,
    }).catch(() => {})
  } catch {
    // Silencio a propósito: un fallo del aviso jamás afecta la operación.
  }
}

export default fireBrunoEvent
