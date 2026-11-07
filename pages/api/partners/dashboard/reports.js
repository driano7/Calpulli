// MIT License - Copyright (c) 2024-2026 Donovan Riaño / Calpulli CDMX
// GET /api/partners/dashboard/reports?preset=30d&partnerId=...&format=csv
// Server-generated CSV (UTF-8 BOM, injection-safe, no PII).
import { turso } from '@/lib/turso'
import { getPartnerContext, partnerApiError } from '@/lib/partners/authGuard'
import { ensurePartnerAccountSchema } from '@/lib/partners/accounts'
import { parseRange } from '@/lib/partners/analytics'
import { toCsv } from '@/lib/partners/csv'

export const config = { runtime: 'nodejs' }

const HEADERS = [
  'Date',
  'Booking reference',
  'Journey',
  'Guests',
  'Booking amount',
  'Guest discount',
  'Net amount paid',
  'Commission rate',
  'Commission amount',
  'Booking status',
  'Commission status',
  'Placement',
  'Campaign',
]

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' })
  try {
    await ensurePartnerAccountSchema()
    const ctx = await getPartnerContext(req, {
      requestedPartnerId: typeof req.query.partnerId === 'string' ? req.query.partnerId : null,
      action: 'reports',
    })
    const range = parseRange(req.query)
    const result = await turso.execute({
      sql: `SELECT b.start_date, b.booking_reference, b.guests, b.status AS booking_status,
                   a.original_amount, a.discount_amount, a.final_amount,
                   a.commission_pct, a.commission_amount, a.status AS commission_status,
                   a.placement, a.campaign,
                   COALESCE(e.title_es, e.title_en, b.experience_id) AS journey
            FROM booking_attributions a
            JOIN bookings b ON b.id = a.booking_id
            JOIN experiences e ON e.id = b.experience_id
            WHERE a.partner_id = ? AND a.created_at >= ? AND a.created_at < ?
            ORDER BY b.start_date ASC`,
      args: [ctx.partnerId, range.from, range.to],
    })
    const rows = result.rows.map((r) => ({
      Date: String(r.start_date || '').slice(0, 10),
      'Booking reference': r.booking_reference,
      Journey: r.journey,
      Guests: Number(r.guests) || 0,
      'Booking amount': Number(r.original_amount) || 0,
      'Guest discount': Number(r.discount_amount) || 0,
      'Net amount paid': Number(r.final_amount) || 0,
      'Commission rate': Number(r.commission_pct) || 0,
      'Commission amount': Number(r.commission_amount) || 0,
      'Booking status': r.booking_status,
      'Commission status': r.commission_status,
      Placement: r.placement || '',
      Campaign: r.campaign || '',
    }))
    const csv = toCsv(HEADERS, rows)
    res.setHeader('Content-Type', 'text/csv; charset=utf-8')
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="partner-report-${ctx.partner.slug}-${range.from}.csv"`
    )
    return res.status(200).send(csv)
  } catch (err) {
    return partnerApiError(res, err)
  }
}
