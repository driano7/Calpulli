// MIT License - Copyright (c) 2024-2026 Donovan Riaño / Calpulli CDMX
// GET /api/partners/dashboard/commissions?preset=30d&partnerId=...
// Read-only grouped view. Partners cannot modify commissions.
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
      action: 'commissions',
    })
    const range = parseRange(req.query)
    const result = await turso.execute({
      sql: `SELECT b.booking_reference, b.start_date, b.guests,
                   a.original_amount, a.discount_amount, a.final_amount,
                   a.commission_pct, a.commission_amount, a.status,
                   a.payable_at, a.paid_at, a.payout_reference, a.reversed_reason,
                   a.currency, a.created_at
            FROM booking_attributions a
            JOIN bookings b ON b.id = a.booking_id
            WHERE a.partner_id = ? AND a.created_at >= ? AND a.created_at < ?
            ORDER BY a.created_at DESC
            LIMIT 200`,
      args: [ctx.partnerId, range.from, range.to],
    })
    const rows = result.rows.map((r) => ({
      bookingReference: r.booking_reference,
      journeyDate: String(r.start_date || '').slice(0, 10),
      guests: Number(r.guests) || 0,
      commissionBase: Number(r.final_amount) || 0,
      commissionRate: Number(r.commission_pct) || 0,
      commissionAmount: Number(r.commission_amount) || 0,
      status: r.status,
      payableDate: r.payable_at || null,
      paidDate: r.paid_at || null,
      payoutReference: r.payout_reference || null,
      reversedReason: r.reversed_reason || null,
      currency: r.currency,
    }))
    const totals = {
      PENDING: 0,
      CONFIRMED: 0,
      PAYABLE: 0,
      PAID: 0,
      REVERSED: 0,
    }
    for (const r of rows) totals[r.status] = (totals[r.status] || 0) + r.commissionAmount
    return res
      .status(200)
      .json({ commissions: rows, totals, range: { from: range.from, to: range.to } })
  } catch (err) {
    return partnerApiError(res, err)
  }
}
