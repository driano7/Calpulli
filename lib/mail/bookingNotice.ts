// MIT License - Copyright (c) 2024-2026 Donovan Riaño / Calpulli CDMX - See LICENSE
// Aviso de reserva (tarjeta, cripto o efectivo). Se comparte entre los
// endpoints de confirmación para que todos manden el mismo correo.
import { trySend } from './service'
import { BRAND } from '../brand'

/** Escapa lo que va dentro del correo (nombres de personas). */
function escapeHtml(value: unknown): string {
  return String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

export interface NotifyBookingOptions {
  paymentMethod?: string | null
  customerPhone?: string | null
  userEmail?: string | null
  userId?: string | null
  locale?: string
}

/** Avisa al cliente según cómo pagó. Si falla el correo, la reserva sigue. */
export async function notifyBooking(booking: any, options: NotifyBookingOptions): Promise<void> {
  const origin = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/+$/, '') || ''
  const digits = (options.customerPhone || '').replace(/\D/g, '')
  const whatsappUrl = digits.length >= 10 ? `https://wa.me/${digits}` : BRAND.social.whatsapp

  // Los tickets de cada persona, cada uno con su enlace. Al invitado (sin
  // cuenta) el enlace va a la pagina publica del ticket, no a su perfil.
  const tickets = Array.isArray(booking.tickets) ? booking.tickets : []
  const ticketUrlFor = (ticket: any) => `${origin}/t/${encodeURIComponent(ticket.ticketCode)}`
  const ticketsList = tickets.length
    ? `<ul style="margin:16px 0 0;padding:0;list-style:none">${tickets
        .map(
          (ticket: any) =>
            `<li style="padding:6px 0;border-bottom:1px solid #e7e5e4;font-size:14px">
              <strong>${escapeHtml(ticket.participantName)}</strong>
              ${
                ticket.isResponsible
                  ? '<span style="font-size:12px;color:#c1440e">(responsable)</span>'
                  : ''
              }
              <br><a href="${ticketUrlFor(
                ticket
              )}" style="color:#c1440e;font-size:13px">${escapeHtml(ticket.ticketCode)}</a>
            </li>`
        )
        .join('')}</ul>`
    : ''

  const isCash = options.paymentMethod === 'cash'
  const vars = {
    firstName: escapeHtml(String(booking.customerName || '').split(' ')[0] || 'viajera'),
    bookingReference: escapeHtml(booking.bookingReference),
    experienceTitle: escapeHtml(booking.experienceTitle || 'Tu tour'),
    startDate: String(booking.startDate || '').slice(0, 10),
    startTime: booking.time || '10:00',
    guests: booking.guests,
    total: booking.totalAmount,
    currency: booking.currency,
    meetingPoint: 'Te lo confirmamos por WhatsApp',
    ticketUrl: tickets.length ? ticketUrlFor(tickets[0]) : `${origin}/profile`,
    ticketsList,
    whatsappUrl,
  }

  await trySend(
    isCash ? 'booking_cash_reserved' : 'booking_confirmed',
    options.userEmail,
    options.userId,
    vars,
    options.locale || 'es'
  )
}
