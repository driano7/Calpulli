// MIT License - Copyright (c) 2024-2026 Donovan Riaño / Calpulli CDMX - See LICENSE
/**
 * POST /api/bookings/crypto
 *
 * Confirma un pago cripto y crea la reserva en Turso. El navegador manda el
 * hash (o la factura Lightning) pero aquí se vuelve a verificar contra la red:
 * un hash inventado no genera ticket. Solo cuando el pago está confirmado y
 * llegó a la wallet del negocio se persiste la reserva como pagada.
 *
 * La referencia externa se guarda en `stripe_session_id` con prefijo `crypto:`
 * para que el endpoint sea idempotente (reintentos devuelven las mismas
 * reservas) sin tocar el esquema.
 */
import {
  createBookingInTurso,
  findBookingsByStripeSession,
  countBookingsByExperienceAndIdentity,
} from '@/lib/booking/turso'
import { checkRateLimit, rateLimitHeaders } from '@/lib/booking/rateLimit'
import { verifyPaymentForServer } from '@/lib/crypto/verify'
import { WALLETS } from '@/lib/crypto/addresses'
import { notifyBooking } from '@/lib/mail/bookingNotice'
import { recordConversion } from '@/lib/referrals'
import { getSessionOptional } from '@/lib/auth/session'

export const config = { runtime: 'nodejs' }

const NETWORKS = ['ETHEREUM', 'BASE', 'ARBITRUM', 'OPTIMISM', 'LIGHTNING']

function emailOk(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value || '').trim())
}

export default async function handler(req, res) {
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

  const session = await getSessionOptional(req)
  const {
    reference,
    network,
    items,
    guestEmail,
    customerName,
    customerPhone,
    currency,
    responsiblePosition,
    locale,
  } = req.body || {}

  if (typeof reference !== 'string' || !reference.trim()) {
    return res.status(400).json({ error: 'Falta la referencia del pago' })
  }
  if (!NETWORKS.includes(network)) {
    return res.status(400).json({ error: 'Red no soportada' })
  }
  if (!Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ error: 'No hay reservas por confirmar' })
  }

  const wallet = WALLETS.find((w) => w.network === network)
  if (!wallet) {
    return res.status(400).json({ error: 'Wallet no configurada para esa red' })
  }

  const isGuest = !session?.user?.id
  const email = session?.user?.email || (emailOk(guestEmail) ? String(guestEmail).trim() : null)

  // Límite de reservas por journey, igual que en efectivo.
  const firstExperienceId = items[0]?.experienceId
  if (firstExperienceId) {
    const limit = await countBookingsByExperienceAndIdentity({
      experienceId: firstExperienceId,
      userId: isGuest ? undefined : String(session.user.id),
      customerEmail: isGuest ? String(guestEmail || '') : undefined,
      customerPhone: isGuest ? String(customerPhone || '') : undefined,
    })
    if (limit.atLimit) {
      return res.status(429).json({
        error:
          locale === 'en'
            ? `You have reached the ${limit.limit}-booking limit for this journey.`
            : `Has alcanzado el límite de ${limit.limit} reservas para este journey.`,
        atLimit: true,
      })
    }
  }

  const cleanReference = String(reference).trim()
  const externalRef = `crypto:${network}:${cleanReference}`

  // Idempotencia: si este pago ya generó reservas, se devuelven tal cual.
  const alreadyBooked = await findBookingsByStripeSession(externalRef)
  if (alreadyBooked.length > 0) {
    return res.status(200).json({ ok: true, bookings: alreadyBooked, idempotent: true, isGuest })
  }

  let verification
  try {
    verification = await verifyPaymentForServer({
      network,
      address: network === 'LIGHTNING' ? undefined : wallet.address,
      txHash: network === 'LIGHTNING' ? undefined : cleanReference,
      invoice: network === 'LIGHTNING' ? cleanReference : undefined,
    })
  } catch (error) {
    console.error('[crypto.confirm] verificación falló:', error)
    return res.status(502).json({ error: 'No pudimos verificar el pago en la red' })
  }

  if (!verification.confirmed) {
    return res.status(402).json({
      error:
        locale === 'en'
          ? 'We could not confirm this payment on-chain yet.'
          : 'Todavía no pudimos confirmar este pago en la blockchain.',
      status: verification.status,
      message: verification.message,
    })
  }

  try {
    const created = []
    for (const item of items) {
      const peopleCount = Math.max(1, Number(item.peopleCount) || 1)
      const names = (Array.isArray(item.participantNames) ? item.participantNames : [])
        .map((name) => (typeof name === 'string' ? name.trim() : ''))
        .filter(Boolean)
      const people = names.length
        ? names
        : [item.customerName || customerName || (locale === 'en' ? 'Guest' : 'Invitado')]

      const booking = await createBookingInTurso({
        experienceId: item.experienceId,
        userId: session?.user?.id || null,
        date: item.date,
        time: item.time,
        peopleCount,
        totalAmount: (Number(item.unitPrice) || 0) * peopleCount,
        currency: currency === 'USD' || currency === 'EUR' || currency === 'CAD' ? currency : 'MXN',
        customerName: people[0] || customerName || null,
        // El invitado no queda registrado (mismo criterio de privacidad que
        // en la compra con tarjeta): el ticket se manda al correo de la sesión.
        customerEmail: session?.user?.id ? session.user.email : null,
        customerPhone: customerPhone || null,
        paymentMethod: 'crypto',
        paid: true,
        stripeSessionId: externalRef,
        stripePaymentIntentId: null,
        participants: people.map((name) => ({ name })),
        responsiblePosition: Math.max(1, Number(responsiblePosition) || 1),
      })
      created.push(booking)
    }

    for (const booking of created) {
      await notifyBooking(booking, {
        paymentMethod: 'crypto',
        customerPhone,
        userEmail: email,
        userId: session?.user?.id || null,
        locale: locale === 'en' ? 'en' : 'es',
      })
    }

    if (session?.user?.id) {
      for (const booking of created) {
        try {
          await recordConversion({
            bookingId: booking.id,
            referredUserId: session.user.id,
            stripeSessionId: externalRef,
            amount: booking.totalAmount ?? 0,
            currency: booking.currency,
            status: 'paid',
          })
        } catch (error) {
          console.error('[crypto.confirm] conversión de referido no registrada:', error)
        }
      }
    }

    console.log(`[crypto.confirm] ${created.length} reserva(s) pagadas vía ${network}`)
    return res.status(200).json({ ok: true, bookings: created, isGuest })
  } catch (error) {
    console.error('[crypto.confirm] error:', error)
    return res.status(500).json({ error: 'No pudimos guardar tu reserva' })
  }
}
