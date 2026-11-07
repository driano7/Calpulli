// MIT License - Copyright (c) 2024-2026 Donovan Riaño / Calpulli CDMX
import { getStripeClient } from '@/lib/stripe'
import { findBookingsByStripeSession } from '@/lib/booking/turso'
import { transitionAttribution } from '@/lib/partners'

export const config = { runtime: 'nodejs' }

// Webhook de Stripe. Idempotente: las reservas se crean solo en
// /api/stripe/confirm (que ya es idempotente por stripe_session_id).
// Aquí: (1) no duplicamos bookings, (2) reversamos comisiones en reembolsos.
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET
  if (!webhookSecret) {
    return res.status(200).json({ received: true, skipped: 'no webhook secret' })
  }

  const signature = req.headers['stripe-signature']
  if (!signature || Array.isArray(signature)) {
    return res.status(400).json({ error: 'Missing stripe-signature header' })
  }

  const stripe = getStripeClient()

  let event
  try {
    event = stripe.webhooks.constructEvent(req.body, signature, webhookSecret)
  } catch (err) {
    console.error('stripe.webhook signature error:', err)
    return res.status(400).json({ error: 'Invalid signature' })
  }

  if (event.type === 'checkout.session.completed') {
    const checkout = event.data.object
    if (checkout.payment_status !== 'paid') {
      return res.status(200).json({ received: true })
    }
    console.log('stripe.webhook checkout.session.completed', checkout.id)
    return res.status(200).json({ received: true, confirmed: true })
  }

  // Reembolsos: reversal proporcional (full -> REVERSED con motivo).
  if (event.type === 'charge.refunded' || event.type === 'charge.refund.updated') {
    try {
      const charge = event.data.object
      const paymentIntentId =
        typeof charge.payment_intent === 'string'
          ? charge.payment_intent
          : charge.payment_intent?.id || null
      const refundedCents = Number(charge.amount_refunded || 0) // centavos MXN
      if (paymentIntentId && refundedCents > 0) {
        // Localizar bookings por payment_intent via stripe_session lookup:
        // la session id no viaja en el charge; buscamos por intent en Turso.
        const { turso } = await import('@/lib/turso')
        const found = await turso.execute({
          sql: `SELECT id, total_amount, currency FROM bookings WHERE stripe_payment_intent_id = ?`,
          args: [paymentIntentId],
        })
        for (const row of found.rows) {
          const refundedAmount = refundedCents / 100
          await transitionAttribution({
            bookingId: row.id,
            toStatus: 'REVERSED',
            reason: `Stripe refund ${charge.id}`,
            refundedAmount,
            eventType: 'BOOKING_REFUNDED',
          })
        }
      }
    } catch (err) {
      console.error('[stripe.webhook refund] error:', err)
    }
    return res.status(200).json({ received: true })
  }

  return res.status(200).json({ received: true })
}
