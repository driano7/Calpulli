// MIT License - Copyright (c) 2024-2026 Donovan Riaño / Calpulli CDMX - See LICENSE
/**
 * Reserva en efectivo.
 *
 * Se paga en el punto de encuentro, pero la reserva existe: se guarda en
 * Turso con los tickets de cada persona y con el WhatsApp para confirmar.
 * Antes esto solo se armaba en el navegador (una reserva que nadie mas ve),
 * asi que aqui ya es una reserva de verdad.
 */
import { createBookingInTurso, countBookingsByExperienceAndIdentity } from '@/lib/booking/turso'
import { checkRateLimit } from '@/lib/booking/rateLimit'
import { trySend } from '@/lib/mail/service'
import { BRAND } from '@/lib/brand'
import { getSessionOptional } from '@/lib/auth/session'

export const config = { runtime: 'nodejs' }

export default async function handler(req, res) {
  // Rate limiting: proteger contra bots/crapping (máx. 50 reservas / 10 min por IP)
  const rl = checkRateLimit(req)
  if (!rl.allowed) {
    return res.status(429).json({
      error: rl.message || 'Demasiadas solicitudes. Intenta de nuevo más tarde.',
      blocked: rl.reason === 'blocked',
      retryAfter: rl.remainingSeconds,
    })
  }

  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST')
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const body = req.body || {}
  const items = Array.isArray(body.items) ? body.items : []
  const locale = body.locale === 'es' ? 'es' : 'en'
  const customerPhone = typeof body.customerPhone === 'string' ? body.customerPhone.trim() : ''
  const customerEmail = typeof body.customerEmail === 'string' ? body.customerEmail.trim() : ''
  const customerName = typeof body.customerName === 'string' ? body.customerName.trim() : ''
  const responsiblePosition = Math.max(1, Number(body.responsiblePosition) || 1)

  if (items.length === 0) {
    return res.status(400).json({ error: 'No hay nada que reservar' })
  }
  // El WhatsApp es obligatorio: sin el, la reserva no se puede confirmar.
  if (customerPhone.replace(/\D/g, '').length < 10) {
    return res.status(400).json({ error: 'Necesitamos un WhatsApp para confirmar' })
  }

  // Límite de 3 reservas por journey por usuario/identidad
  const experienceId = items[0]?.experienceId
  if (experienceId) {
    const session = await getSessionOptional(req)
    const isLoggedIn = Boolean(session?.user?.id)
    const limit = await countBookingsByExperienceAndIdentity({
      experienceId,
      userId: isLoggedIn ? String(session.user.id) : undefined,
      customerEmail: isLoggedIn ? undefined : customerEmail || undefined,
      customerPhone: isLoggedIn ? undefined : customerPhone || undefined,
    })
    if (limit.atLimit) {
      return res.status(429).json({
        error:
          locale === 'es'
            ? `Has alcanzado el límite de ${limit.limit} reservas para este journey.`
            : `You have reached the ${limit.limit}-booking limit for this journey.`,
        atLimit: true,
      })
    }
  }

  try {
    const session = await getSessionOptional(req)
    const bookings = []

    for (const item of items) {
      const names = (Array.isArray(item.participantNames) ? item.participantNames : [])
        .map((name) => (typeof name === 'string' ? name.trim() : ''))
        .filter(Boolean)
      const people = names.length
        ? names
        : [customerName || (locale === 'es' ? 'Invitado' : 'Guest')]

      const booking = await createBookingInTurso({
        experienceId: item.experienceId,
        date: item.date,
        time: item.time,
        peopleCount: Math.max(1, Number(item.peopleCount) || people.length),
        totalAmount:
          (Number(item.unitPrice) || 0) * Math.max(1, Number(item.peopleCount) || people.length),
        currency: 'MXN',
        customerName: people[0] || customerName,
        customerEmail: session?.user?.id ? customerEmail : null,
        customerPhone,
        paymentMethod: 'cash',
        stripeSessionId: null,
        stripePaymentIntentId: null,
        paid: false,
        participants: people.map((name) => ({ name })),
        responsiblePosition,
      })
      bookings.push(booking)
    }

    // Aviso por correo. Si el correo no sale, la reserva sigue existiendo.
    const origin = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/+$/, '') || ''
    const digits = customerPhone.replace(/\D/g, '')
    const whatsappUrl = digits.length >= 10 ? `https://wa.me/${digits}` : BRAND.social.whatsapp

    for (const booking of bookings) {
      const tickets = Array.isArray(booking.tickets) ? booking.tickets : []
      await trySend(
        'booking_cash_reserved',
        session?.user?.email || customerEmail || null,
        session?.user?.id || null,
        {
          firstName: (booking.customerName || '').split(' ')[0] || 'viajera',
          bookingReference: booking.bookingReference,
          experienceTitle: booking.experienceTitle,
          startDate: String(booking.startDate || '').slice(0, 10),
          startTime: booking.time || '10:00',
          guests: booking.guests,
          meetingPoint: 'Te lo confirmamos por WhatsApp',
          whatsappUrl,
          ticketUrl: tickets.length
            ? `${origin}/t/${encodeURIComponent(tickets[0].ticketCode)}`
            : `${origin}/profile`,
        }
      )
    }

    return res.status(200).json({ ok: true, bookings })
  } catch (error) {
    console.error('bookings.cash error:', error)
    return res.status(500).json({ error: 'No pudimos guardar la reserva' })
  }
}
