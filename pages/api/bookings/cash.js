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
import { checkRateLimit, rateLimitHeaders } from '@/lib/booking/rateLimit'
import { trySend } from '@/lib/mail/service'
import { BRAND } from '@/lib/brand'
import { getSessionOptional } from '@/lib/auth/session'
import { isLuchaDateValid } from '@/lib/db/schema'
import {
  resolvePartnerForRequest,
  priceForExperience,
  createAttribution,
  attributionMetaFromRequest,
} from '@/lib/partners'
import { applyDiscount } from '@/lib/partners/pricing'

export const config = { runtime: 'nodejs' }

export default async function handler(req, res) {
  // Rate limiting: proteger contra bots/crapping (máx. 50 reservas / 10 min por IP)
  const rl = await checkRateLimit(req)
  if (!rl.allowed) {
    return res.status(429).json({
      error: rl.message || 'Demasiadas solicitudes. Intenta de nuevo más tarde.',
      blocked: rl.reason === 'blocked',
      retryAfter: rl.remainingSeconds,
      ...rateLimitHeaders(rl),
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

  // Límite de fecha Lucha (server-side): si hay funciones sembradas, la
  // fecha debe ser una función CMLL válida.
  for (const item of items) {
    if (item.experienceId === 'luchas' && item.date) {
      const ok = await isLuchaDateValid(String(item.date).slice(0, 10))
      if (!ok) {
        return res.status(400).json({
          error:
            locale === 'es'
              ? 'Selecciona una fecha de función válida para Lucha Libre'
              : 'Select a valid Lucha Libre show date',
        })
      }
    }
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
    const partner = await resolvePartnerForRequest(req, body)
    const partnerSource = body.referralCode ? 'REFERRAL_CODE' : 'PARTNER_LINK'

    for (const item of items) {
      const names = (Array.isArray(item.participantNames) ? item.participantNames : [])
        .map((name) => (typeof name === 'string' ? name.trim() : ''))
        .filter(Boolean)
      const people = names.length
        ? names
        : [customerName || (locale === 'es' ? 'Invitado' : 'Guest')]
      const peopleCount = Math.max(1, Number(item.peopleCount) || people.length)
      const originalUnit = priceForExperience(item.experienceId)
      const discountedUnit = partner
        ? applyDiscount(originalUnit, partner.guestDiscountPct).finalAmount
        : originalUnit

      const booking = await createBookingInTurso({
        experienceId: item.experienceId,
        date: item.date,
        time: item.time,
        peopleCount,
        totalAmount: discountedUnit * peopleCount,
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
      if (partner) {
        try {
          await createAttribution({
            bookingId: booking.id,
            partner,
            source: partnerSource,
            originalAmount: originalUnit * peopleCount,
            currency: 'MXN',
            status: 'PENDING', // cash: unpaid, commission only after payment+completion
            ...attributionMetaFromRequest(req, body),
          })
        } catch (err) {
          console.error('[partners] cash attribution failed:', err)
        }
      }
      bookings.push(booking)
    }

    // Aviso por correo. Si el correo no sale, la reserva sigue existiendo.
    const origin = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/+$/, '') || ''
    const digits = customerPhone.replace(/\D/g, '')
    const whatsappUrl = digits.length >= 10 ? `https://wa.me/${digits}` : BRAND.social.whatsapp

    const buyerEmail = session?.user?.email || customerEmail || null
    const participantContacts = Array.isArray(body.participantEmails)
      ? body.participantEmails
          .map((p) => {
            if (typeof p === 'string') return { email: p }
            if (p && typeof p === 'object') return { name: p.name || '', email: p.email || '' }
            return null
          })
          .filter(Boolean)
      : []

    for (const booking of bookings) {
      const tickets = Array.isArray(booking.tickets) ? booking.tickets : []
      await trySend('booking_cash_reserved', buyerEmail, session?.user?.id || null, {
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
      })

      // Ticket individual por participante (deduplicado contra comprador).
      const seen = new Set()
      for (const [index, contact] of participantContacts.entries()) {
        const email = String(contact.email || '').trim()
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) continue
        const key = email.toLowerCase()
        if (key === String(buyerEmail || '').toLowerCase() || seen.has(key)) continue
        seen.add(key)
        const ticket =
          tickets[index] ||
          tickets.find(
            (t) =>
              String(t.participantName || '').toLowerCase() ===
              String(contact.name || '').toLowerCase()
          ) ||
          tickets[0]
        if (!ticket) continue
        await trySend('ticket_participant', email, null, {
          firstName:
            String(contact.name || ticket.participantName || '').split(' ')[0] || 'viajera',
          bookingReference: booking.bookingReference,
          experienceTitle: booking.experienceTitle || 'Tu tour',
          startDate: String(booking.startDate || '').slice(0, 10),
          startTime: booking.time || '10:00',
          meetingPoint: 'Te lo confirmamos por WhatsApp',
          ticketUrl: `${origin}/t/${encodeURIComponent(ticket.ticketCode)}`,
          ticketCode: ticket.ticketCode,
        })
      }
    }

    return res.status(200).json({ ok: true, bookings })
  } catch (error) {
    console.error('bookings.cash error:', error)
    return res.status(500).json({ error: 'No pudimos guardar la reserva' })
  }
}
