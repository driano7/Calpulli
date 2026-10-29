import { getStripeClient } from '@/lib/stripe'
import { createBookingInTurso, findBookingsByStripeSession, countBookingsByExperienceAndIdentity } from '@/lib/booking/turso'
import { checkRateLimit } from '@/lib/booking/rateLimit'
import { recordConversion } from '@/lib/referrals'
import { trySend } from '@/lib/mail/service'
import { BRAND } from '@/lib/brand'
import { getSessionUser } from '@/lib/auth'
import { getSessionOptional } from '@/lib/auth/session'

function bearerToken(req) {
  const header = req.headers.authorization
  if (typeof header === 'string' && header.startsWith('Bearer ')) {
    return header.slice(7).trim() || null
  }
  return null
}

/** WhatsApp: al menos 10 dígitos (MX local o con lada). */
function normalizePhone(value) {
  const digits = String(value || '').replace(/\D/g, '')
  return digits.length >= 10 ? digits : null
}

/** Escapa lo que va dentro del correo (nombres de personas). */
function escapeHtml(value) {
  return String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

/** Avisa al cliente segun como pago. Si falla el correo, la reserva sigue. */
async function notifyBooking(booking, { paymentMethod, customerPhone, userEmail, userId }) {
  const origin = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/+$/, '') || ''
  const digits = (customerPhone || '').replace(/\D/g, '')
  const whatsappUrl = digits.length >= 10 ? `https://wa.me/${digits}` : BRAND.social.whatsapp

  // Los tickets de cada persona, cada uno con su enlace. Al invitado (sin
  // cuenta) el enlace va a la pagina publica del ticket, no a su perfil.
  const tickets = Array.isArray(booking.tickets) ? booking.tickets : []
  const ticketUrlFor = (ticket) => `${origin}/t/${encodeURIComponent(ticket.ticketCode)}`
  const ticketsList = tickets.length
    ? `<ul style="margin:16px 0 0;padding:0;list-style:none">${tickets
        .map(
          (ticket) =>
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

  const vars = {
    firstName: (booking.customerName || '').split(' ')[0] || 'viajera',
    bookingReference: booking.bookingReference,
    experienceTitle: booking.experienceTitle || 'Tu tour',
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
    paymentMethod === 'cash' ? 'booking_cash_reserved' : 'booking_confirmed',
    userEmail,
    userId,
    vars
  )
}
/**
 * Crea las reservas en Turso (fuente de verdad) y devuelve los tickets con QR.
 * Idempotente: si la sesión de Stripe ya generó reservas, las devuelve tal cual.
 */
async function persistBookings({
  items,
  userId,
  customerName,
  customerEmail,
  customerPhone,
  currency,
  paymentMethod,
  stripe,
  responsiblePosition = 1,
}) {
  const created = []
  for (const item of items) {
    const booking = await createBookingInTurso({
      experienceId: item.experienceId,
      userId,
      date: item.date,
      time: item.time,
      peopleCount: Math.max(1, Number(item.peopleCount) || 1),
      totalAmount: Number(item.unitPrice || 0) * Math.max(1, Number(item.peopleCount) || 1),
      currency,
      customerName: item.customerName || customerName,
      // Un ticket por persona: cada quien con su codigo y su QR.
      participants: (Array.isArray(item.participantNames) && item.participantNames.length
        ? item.participantNames
        : [item.customerName || customerName]
      )
        .map((name) => (typeof name === 'string' ? name.trim() : ''))
        .filter(Boolean)
        .map((name) => ({ name })),
      responsiblePosition,
      customerEmail: userId ? customerEmail : null,
      customerPhone: customerPhone || null,
      paymentMethod: paymentMethod || 'card',
      specialRequests: item.specialRequests || null,
      stripeSessionId: stripe?.sessionId || null,
      stripePaymentIntentId: stripe?.paymentIntentId || null,
      paid: paymentMethod !== 'cash',
    })
    created.push(booking)
  }
  return created
}

export const config = { runtime: 'nodejs' }

// ─── MOCK MODE ────────────────────────────────────────────────────────────────
// Si la session_id empieza con "mock_cs_", no consultamos Stripe: simulamos que
// el pago fue exitoso y creamos los bookings directamente (tickets con QR).
const isMockSession = (sessionId) =>
  typeof sessionId === 'string' && sessionId.startsWith('mock_cs_')

const createMockBookings = (sessionId, user) => {
  // En el mock, los items se pasan en el query/body porque no hay sesión real de Stripe.
  // El checkout mock redirige a /checkout?status=success&session_id=... y el cliente
  // re-envía los items del carrito en el body de confirm.
  return { mock: true }
}
// ───────────────────────────────────────────────────────────────────────────────

/** Atribuye las conversiones a los referidos que trajeron al cliente. */
async function registerReferralConversions(
  bookings,
  { userId, sessionId, paymentIntentId, currency }
) {
  for (const booking of bookings) {
    try {
      await recordConversion({
        bookingId: booking.id,
        referredUserId: userId,
        stripeSessionId: sessionId,
        paymentIntentId,
        amount: booking.totalAmount ?? 0,
        currency,
        status: booking.status,
      })
    } catch (error) {
      console.error('[referrals] conversión no registrada:', error)
    }
  }
}

// Convierte la sesión de Stripe en bookings persistidos (tickets con QR).
// Soporta dos paths:
//  - Autenticado: Authorization Bearer + session.user.id -> userId real
//  - Invitado: sin token, con guestEmail/guestName + participantNames -> guest_<random> (no guarda PII más allá del ticket temporal, pero sí genera métricas)
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
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const session = await getSessionOptional(req)
  const {
    sessionId,
    items,
    guestEmail,
    guestName,
    participantNamesMap,
    currency,
    acquisitionChannel,
    paymentMethod,
    customerPhone,
    guestPhone,
    responsiblePosition,
  } = req.body || {}

  if (typeof sessionId !== 'string' || !sessionId) {
    return res.status(400).json({ error: 'Falta session_id' })
  }

  // Límite de 3 reservas por journey por usuario/identidad
  const experienceId = Array.isArray(items) && items[0] ? items[0].experienceId : null
  if (experienceId) {
    const isLoggedIn = Boolean(session?.user?.id)
    const limit = await countBookingsByExperienceAndIdentity({
      experienceId,
      userId: isLoggedIn ? String(session.user.id) : undefined,
      customerEmail: isLoggedIn ? undefined : String(guestEmail || ''),
      customerPhone: isLoggedIn ? undefined : String(customerPhone || guestPhone || ''),
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
    // ─── MOCK MODE: sin Stripe ───
    if (isMockSession(sessionId)) {
      const mockItems = Array.isArray(items) ? items : []
      if (mockItems.length === 0) {
        return res.status(400).json({ error: 'No hay items en la sesión' })
      }

      const isGuest = !session?.user?.id
      if (isGuest) {
        const email = typeof guestEmail === 'string' ? guestEmail.trim() : ''
        const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
        if (!emailOk) {
          return res.status(400).json({ error: 'Email de invitado requerido' })
        }
      }

      const customerEmail =
        session?.user?.email || (typeof guestEmail === 'string' ? guestEmail.trim() : '')
      const customerName = session?.user?.firstName
        ? `${session.user.firstName} ${session.user.lastName || ''}`.trim()
        : typeof guestName === 'string' && guestName.trim()
        ? guestName.trim()
        : Array.isArray(mockItems[0]?.participantNames) && mockItems[0].participantNames[0]
        ? mockItems[0].participantNames[0]
        : 'Invitado'

      const mockBookings = await persistBookings({
        items: mockItems.map((item) => ({
          experienceId: item.experienceId,
          date: item.date,
          time: item.time,
          peopleCount: Math.max(1, Number(item.peopleCount) || 1),
          unitPrice: Number(item.unitPrice) || 0,
          customerName:
            (Array.isArray(item.participantNames) && item.participantNames[0]) || customerName,
        })),
        userId: session?.user?.id || null,
        customerName,
        customerEmail: session?.user?.id ? customerEmail : '',
        customerPhone: customerPhone || guestPhone || null,
        paymentMethod: paymentMethod || 'card',
        currency: typeof currency === 'string' ? currency : 'USD',
        stripe: { sessionId },
        responsiblePosition: Number(responsiblePosition) || 1,
      })

      await registerReferralConversions(mockBookings, {
        userId: session?.user?.id || null,
        sessionId,
        paymentIntentId: null,
        currency: typeof currency === 'string' ? currency : 'USD',
      })

      console.log('[stripe.mock] Reservas creadas en Turso:', mockBookings.length)

      for (const booking of mockBookings) {
        await notifyBooking(booking, {
          paymentMethod,
          customerPhone,
          userEmail: session?.user?.email || guestEmail || null,
          userId: session?.user?.id || null,
        })
      }
      return res.status(200).json({ ok: true, bookings: mockBookings, mock: true, isGuest })
    }

    // ─── MODO REAL: Stripe ───
    const stripe = getStripeClient()
    const checkout = await stripe.checkout.sessions.retrieve(sessionId, {
      expand: ['payment_intent'],
    })

    if (checkout.payment_status !== 'paid') {
      return res.status(402).json({ error: 'El pago no está confirmado todavía' })
    }

    const parsedItems = Array.isArray(items) ? items : []
    if (parsedItems.length === 0) {
      return res.status(400).json({ error: 'No hay items en la sesión' })
    }

    const customerEmail =
      session?.user?.email ||
      checkout.customer_details?.email ||
      checkout.customer_email ||
      guestEmail ||
      ''
    const customerName = session?.user?.firstName
      ? `${session.user.firstName} ${session.user.lastName || ''}`.trim()
      : checkout.metadata?.customer_name || guestName || ''

    // Idempotencia: si ya se crearon reservas para esta sesión, no duplicamos.
    const alreadyBooked = await findBookingsByStripeSession(sessionId)
    if (alreadyBooked.length > 0) {
      return res.status(200).json({ ok: true, bookings: alreadyBooked, idempotent: true })
    }

    await persistBookings({
      responsiblePosition: Number(checkout.metadata?.responsible_position) || 1,
      items: parsedItems.map((item) => ({
        experienceId: item.experienceId,
        date: item.date,
        time: item.time,
        peopleCount: Math.max(1, Number(item.peopleCount) || 1),
        unitPrice: Number(item.unitPrice) || 0,
        customerName: customerName,
        participantNames: Array.isArray(item.participantNames) ? item.participantNames : [],
        specialRequests: item.specialRequests,
      })),
      userId: session?.user?.id || null,
      customerName,
      customerEmail,
      customerPhone: customerPhone || guestPhone || null,
      paymentMethod: paymentMethod || 'card',
      currency: typeof currency === 'string' ? currency : 'USD',
      stripe: {
        sessionId,
        paymentIntentId:
          typeof checkout.payment_intent === 'string'
            ? checkout.payment_intent
            : checkout.payment_intent?.id || null,
      },
    })

    const bookings = await findBookingsByStripeSession(sessionId)

    for (const booking of bookings) {
      await notifyBooking(booking, {
        paymentMethod,
        customerPhone,
        userEmail: session?.user?.email || customerEmail || null,
        userId: session?.user?.id || null,
      })
    }

    await registerReferralConversions(bookings, {
      userId: session?.user?.id || null,
      sessionId,
      paymentIntentId:
        typeof checkout.payment_intent === 'string'
          ? checkout.payment_intent
          : checkout.payment_intent?.id || null,
      currency: typeof currency === 'string' ? currency : 'USD',
    })

    return res.status(200).json({ ok: true, bookings })
  } catch (error) {
    console.error('stripe.confirm error:', error)
    return res.status(500).json({ error: 'No pudimos confirmar tu pago' })
  }
}
