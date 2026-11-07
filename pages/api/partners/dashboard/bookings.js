// MIT License - Copyright (c) 2024-2026 Donovan Riaño / Calpulli CDMX
// GET /api/partners/dashboard/bookings?preset=30d&partnerId=...
// Privacy-safe: NO guest name/email/phone, no payment/card, no notes.
import { turso } from '@/lib/turso'
import { getPartnerContext, partnerApiError } from '@/lib/partners/authGuard'
import { ensurePartnerAccountSchema } from '@/lib/partners/accounts'
import { parseRange } from '@/lib/partners/analytics'

export const config = { runtime: 'nodejs' }

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' })
  try {
    await ensurePartnerAccountSchema()
    const ctx = await getPartnerContext(req, {
      requestedPartnerId: typeof req.query.partnerId === 'string' ? req.query.partnerId : null,
      action: 'bookings',
    })
    const range = parseRange(req.query)
    const result = await turso.execute({
      sql: `SELECT b.id AS booking_id, b.booking_reference, b.start_date, b.start_time,
                   b.guests, b.total_amount, b.currency, b.status AS booking_status,
                   b.payment_status,
                   e.title_es, e.title_en, e.location_es, e.location_en,
                   a.status AS commission_status, a.original_amount, a.discount_amount,
                   a.final_amount, a.commission_amount, a.placement, a.campaign,
                   a.payable_at, a.paid_at, a.payout_reference, a.created_at
            FROM booking_attributions a
            JOIN bookings b ON b.id = a.booking_id
            JOIN experiences e ON e.id = b.experience_id
            WHERE a.partner_id = ? AND a.created_at >= ? AND a.created_at < ?
            ORDER BY b.start_date DESC, a.created_at DESC
            LIMIT 100`,
      args: [ctx.partnerId, range.from, range.to],
    })
    const bookings = result.rows.map((r) => ({
      bookingId: r.booking_id,
      bookingReference: r.booking_reference,
      journey: r.title_es || r.title_en || r.experience || 'Journey',
      journeyEn: r.title_en || r.title_es || '',
      startDate: String(r.start_date || '').slice(0, 10),
      startTime: r.start_time || null,
      location: r.location_es || r.location_en || null,
      guests: Number(r.guests) || 0,
      amountPaid: Number(r.final_amount) || 0,
      guestDiscount: Number(r.discount_amount) || 0,
      originalAmount: Number(r.original_amount) || 0,
      commissionAmount: Number(r.commission_amount) || 0,
      bookingStatus: r.booking_status,
      commissionStatus: r.commission_status,
      placement: r.placement || null,
      campaign: r.campaign || null,
      payableAt: r.payable_at || null,
      paidAt: r.paid_at || null,
      payoutReference: r.payout_reference || null,
      currency: r.currency,
    }))
    return res.status(200).json({ bookings, range: { from: range.from, to: range.to } })
  } catch (err) {
    return partnerApiError(res, err)
  }
}
