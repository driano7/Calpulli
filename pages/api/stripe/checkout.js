import { getStripeClient } from '@/lib/stripe'
import { tours } from '@/data/toursData'
import { JOURNEYS } from '@/data/journeysData'
import { MXN_PER_USD } from '@/lib/currency'
import { resolvePartnerForRequest, recordPartnerEvent } from '@/lib/partners'
import { applyDiscount } from '@/lib/partners/pricing'
import { isLuchaDateValid } from '@/lib/db/schema'

export const config = { runtime: 'nodejs' }

const getBaseUrl = (req) => {
  const origin = req.headers.origin
  if (origin) return origin
  return process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'
}

// Precios servidor-side a partir de data/toursData.js (USD). El cliente puede
// mandar su propio price, pero el cobro se calcula contra esta fuente de verdad.
/**
 * Precio en pesos, siempre. El de los tours viene de data/toursData.js (que
 * los guarda en dolares) y se convierte con la tasa del sitio; el de los
 * journeys ya esta en pesos. El precio de verdad se calcula aqui, en el
 * servidor: el cliente no puede mandarlo.
 */
const priceFor = (experienceId) => {
  const tour = tours.find((t) => t.id === String(experienceId))
  if (tour) return Math.round(tour.price * MXN_PER_USD)
  const journey = JOURNEYS.find((j) => j.experience === String(experienceId))
  return journey?.price ?? 0
}

const tourTitleFor = (experienceId, fallback) => {
  const tour = tours.find((t) => t.id === String(experienceId))
  if (tour) return tour.title
  const journey = JOURNEYS.find((j) => j.experience === String(experienceId))
  if (journey) return journey.title_es || journey.title_en || fallback
  return fallback || `Experience ${experienceId}`
}

/**
 * Un journey y un tour no se pueden cobrar en la misma sesion: Stripe usa
 * una sola moneda por sesion y los tours van en USD mientras que los journeys
 * van en MXN. Si se mezclan, se avisa en vez de cobrar una cantidad
 * equivocada.
 */
const isJourneyItem = (experienceId) => JOURNEYS.some((j) => j.experience === String(experienceId))

// ─── MOCK MODE ────────────────────────────────────────────────────────────────
// Si no hay STRIPE_SECRET_KEY configurada, usamos un "mock checkout" que simula
// el flujo completo de Stripe con datos de prueba (tarjeta 4242 4242 4242 4242).
// El mock genera una URL local /checkout/mock?session_id=... que al confirmarse
// crea los bookings con tickets y QR, igual que el flujo real.
const isMockMode = () => {
  const key = process.env.STRIPE_SECRET_KEY || process.env.STRIPE_PRIVATE
  return !key || !key.startsWith('sk_test_')
}

const createMockSession = (
  items,
  customerEmail,
  customerName,
  locale,
  baseUrl,
  guestEmails = [],
  partner = null,
  participantEmails = []
) => {
  const sessionId = `mock_cs_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`
  const metadata = {
    source: 'calpulli-tours-checkout',
    locale,
    ...(customerEmail ? { customer_email: customerEmail } : {}),
    ...(customerName ? { customer_name: customerName } : {}),
    ...(guestEmails.length ? { guest_emails: JSON.stringify(guestEmails) } : {}),
    ...(participantEmails.length ? { participant_emails: JSON.stringify(participantEmails) } : {}),
    ...(partner
      ? {
          partner_ref: partner.referralCode,
          partner_id: partner.id,
          partner_discount_pct: String(partner.guestDiscountPct),
        }
      : {}),
    items: JSON.stringify(
      items.map((item) => ({
        experienceId: String(item.experienceId),
        date: item.date || '',
        time: item.time || '',
        peopleCount: Math.max(1, Number(item.peopleCount) || 1),
      }))
    ),
  }

  // Simula la URL de Stripe Checkout: una página local que muestra la tarjeta de prueba
  const mockUrl = `${baseUrl}/checkout/mock?session_id=${sessionId}`

  return {
    id: sessionId,
    url: mockUrl,
    metadata,
    payment_status: 'unpaid',
    customer_email: customerEmail || null,
    customer_details: customerEmail ? { email: customerEmail } : null,
  }
}
// ───────────────────────────────────────────────────────────────────────────────

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const body = req.body || {}
    const items = Array.isArray(body.items) ? body.items : []
    const customerEmail = typeof body.customerEmail === 'string' ? body.customerEmail.trim() : ''
    const customerName = typeof body.customerName === 'string' ? body.customerName.trim() : ''
    // Emails de los guests adicionales. Viajan en la sesion (para poder
    // mandarles su ticket) pero no se guardan en nuestra base.
    const responsiblePosition = Math.max(0, Number(body.responsiblePosition) || 0)
    const guestEmails = Array.isArray(body.guestEmails)
      ? body.guestEmails
          .filter((value) => typeof value === 'string')
          .map((value) => value.trim().toLowerCase())
          .filter((value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value))
          .slice(0, 19)
      : []
    const locale = body.locale === 'es' ? 'es' : 'en'
    // Participant emails (name+email) for individual ticket mail at confirm.
    // Stored in Stripe metadata (transitorio), never in Turso.
    const participantEmails = Array.isArray(body.participantEmails)
      ? body.participantEmails
          .map((p) => {
            if (typeof p === 'string') return { email: p.trim().toLowerCase() }
            if (p && typeof p === 'object')
              return {
                name: String(p.name || ''),
                email: String(p.email || '')
                  .trim()
                  .toLowerCase(),
              }
            return null
          })
          .filter((p) => p && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(p.email))
          .slice(0, 20)
      : []

    if (items.length === 0) {
      return res.status(400).json({ error: 'Tu carrito está vacío' })
    }

    // Límite de fecha Lucha (server-side, antes de crear sesión)
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

    // Validar que todos los items tengan precio conocido
    for (const item of items) {
      const unit = priceFor(item.experienceId)
      if (unit <= 0) {
        return res
          .status(400)
          .json({ error: `Precio no encontrado para la experiencia ${item.experienceId}` })
      }
    }

    // Todo se cobra en pesos mexicanos: lo que se ve es lo que se paga.
    const currency = 'mxn'

    // Partner referral: server-side resolve only. Client discount is never
    // trusted — amounts below are recalculated from priceFor + applyDiscount.
    const partner = await resolvePartnerForRequest(req, body)
    const discountedUnitFor = (experienceId) => {
      const original = priceFor(experienceId)
      return partner ? applyDiscount(original, partner.guestDiscountPct).finalAmount : original
    }

    const baseUrl = getBaseUrl(req)

    // ─── MOCK MODE: sin clave de Stripe ───
    if (isMockMode()) {
      const mockSession = createMockSession(
        items,
        customerEmail,
        customerName,
        locale,
        baseUrl,
        guestEmails,
        partner,
        participantEmails
      )
      if (partner) {
        await recordPartnerEvent({
          partner,
          eventType: 'CHECKOUT_STARTED',
          eventKey: `${mockSession.id}:CHECKOUT_STARTED:${partner.id}`,
          path: '/checkout',
        })
      }
      console.log('[stripe.mock] Checkout session creada (mock):', mockSession.id)
      return res.status(200).json({
        url: mockSession.url,
        sessionId: mockSession.id,
        mock: true,
        partner: partner
          ? { name: partner.name, guestDiscountPct: partner.guestDiscountPct }
          : null,
      })
    }

    // ─── MODO REAL: Stripe Checkout ───
    const lineItems = items.map((item) => {
      const unitMxn = discountedUnitFor(item.experienceId)
      const qty = Math.max(1, Number(item.peopleCount) || 1)
      return {
        quantity: qty,
        price_data: {
          currency,
          unit_amount: Math.round(unitMxn * 100),
          product_data: {
            name: tourTitleFor(item.experienceId, item.title),
            metadata: { experienceId: String(item.experienceId) },
          },
        },
      }
    })

    const stripe = getStripeClient()

    const metadata = {
      source: 'calpulli-tours-checkout',
      locale,
      ...(customerEmail ? { customer_email: customerEmail } : {}),
      ...(customerName ? { customer_name: customerName } : {}),
      ...(guestEmails.length ? { guest_emails: JSON.stringify(guestEmails) } : {}),
      ...(participantEmails.length
        ? { participant_emails: JSON.stringify(participantEmails) }
        : {}),
      ...(partner
        ? {
            partner_ref: partner.referralCode,
            partner_id: partner.id,
            partner_discount_pct: String(partner.guestDiscountPct),
          }
        : {}),
      items: JSON.stringify(
        items.map((item) => ({
          experienceId: String(item.experienceId),
          date: item.date || '',
          time: item.time || '',
          peopleCount: Math.max(1, Number(item.peopleCount) || 1),
          // Los nombres de cada persona viajan en la sesion para que al
          // confirmar se cree un ticket por persona (con su QR).
          participantNames: Array.isArray(item.participantNames) ? item.participantNames : [],
        }))
      ),
      ...(Number(body.responsiblePosition) > 0
        ? { responsible_position: String(Number(body.responsiblePosition)) }
        : {}),
    }

    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      payment_method_types: ['card', 'link'],
      line_items: lineItems,
      ...(customerEmail ? { customer_email: customerEmail } : {}),
      locale: locale === 'es' ? 'es-419' : 'auto',
      metadata,
      success_url: `${baseUrl}/checkout?status=success&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${baseUrl}/checkout?status=cancel`,
    })

    if (!session.url) {
      return res.status(500).json({ error: 'No checkout URL returned by Stripe' })
    }

    if (partner) {
      await recordPartnerEvent({
        partner,
        eventType: 'CHECKOUT_STARTED',
        eventKey: `${session.id}:CHECKOUT_STARTED:${partner.id}`,
        path: '/checkout',
      })
    }

    return res.status(200).json({
      url: session.url,
      sessionId: session.id,
      partner: partner ? { name: partner.name, guestDiscountPct: partner.guestDiscountPct } : null,
    })
  } catch (error) {
    console.error('stripe.checkout error:', error)
    return res.status(500).json({
      error: error instanceof Error ? error.message : 'Unable to create checkout session',
    })
  }
}
