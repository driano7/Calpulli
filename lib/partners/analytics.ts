// MIT License - Copyright (c) 2024-2026 Donovan Riaño / Calpulli CDMX
// Partner dashboard analytics. Source of truth: booking_attributions +
// bookings. partner_referral_events are supporting analytics only.
import { turso } from '../turso'
import { ensurePartnerAccountSchema } from './accounts'

export type DatePreset = '7d' | '30d' | 'this-month' | 'prev-month' | 'custom'

export interface DateRange {
  from: string // ISO date yyyy-mm-dd
  to: string // exclusive ISO date
  preset: string
}

export function parseRange(query: any, now = new Date()): DateRange {
  const preset = String(query?.preset || '30d')
  const yyyyMmDd = (d: Date) => d.toISOString().slice(0, 10)
  const nextDay = (d: Date) => new Date(d.getTime() + 86400_000)

  if (preset === 'custom') {
    let from = /^\d{4}-\d{2}-\d{2}$/.test(String(query?.from || ''))
      ? String(query.from)
      : yyyyMmDd(new Date(now.getTime() - 30 * 86400_000))
    let to = /^\d{4}-\d{2}-\d{2}$/.test(String(query?.to || '')) ? String(query.to) : yyyyMmDd(now)
    if (from > to) [from, to] = [to, from]
    return { from, to: yyyyMmDd(nextDay(new Date(`${to}T00:00:00.000Z`))), preset }
  }
  if (preset === '7d') {
    return {
      from: yyyyMmDd(new Date(now.getTime() - 7 * 86400_000)),
      to: yyyyMmDd(nextDay(now)),
      preset,
    }
  }
  if (preset === 'this-month') {
    const from = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1))
    return { from: yyyyMmDd(from), to: yyyyMmDd(nextDay(now)), preset }
  }
  if (preset === 'prev-month') {
    const from = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 1, 1))
    const to = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1))
    return { from: yyyyMmDd(from), to: yyyyMmDd(to), preset }
  }
  return {
    from: yyyyMmDd(new Date(now.getTime() - 30 * 86400_000)),
    to: yyyyMmDd(nextDay(now)),
    preset: '30d',
  }
}

function inRange(dt: string, range: DateRange): boolean {
  return dt >= range.from && dt < range.to
}

export async function getOverview(partnerId: string, range: DateRange) {
  await ensurePartnerAccountSchema()
  const [events, money, guests] = await Promise.all([
    turso.execute({
      sql: `SELECT event_type, COUNT(*) AS n FROM partner_referral_events
            WHERE partner_id = ? AND created_at >= ? AND created_at < ?
            GROUP BY event_type`,
      args: [partnerId, range.from, range.to],
    }),
    turso.execute({
      sql: `SELECT a.status,
                   COUNT(*) AS n,
                   COALESCE(SUM(a.original_amount),0) AS gross,
                   COALESCE(SUM(a.discount_amount),0) AS discounts,
                   COALESCE(SUM(a.final_amount),0) AS net,
                   COALESCE(SUM(a.commission_amount),0) AS commission
            FROM booking_attributions a
            WHERE a.partner_id = ? AND a.created_at >= ? AND a.created_at < ?
            GROUP BY a.status`,
      args: [partnerId, range.from, range.to],
    }),
    turso.execute({
      sql: `SELECT COALESCE(SUM(b.guests),0) AS guests
            FROM booking_attributions a JOIN bookings b ON b.id = a.booking_id
            WHERE a.partner_id = ? AND a.created_at >= ? AND a.created_at < ?
              AND a.status != 'REVERSED'`,
      args: [partnerId, range.from, range.to],
    }),
  ])

  const byType: Record<string, number> = {}
  for (const r of events.rows as any[]) byType[r.event_type] = Number(r.n) || 0

  const sessionsResult = await turso.execute({
    sql: `SELECT COUNT(DISTINCT session_id) AS n FROM partner_referral_events
          WHERE partner_id = ? AND session_id IS NOT NULL AND session_id != ''
            AND created_at >= ? AND created_at < ?`,
    args: [partnerId, range.from, range.to],
  })
  const uniqueSessions = Number((sessionsResult.rows[0] as any)?.n) || 0

  const byStatus = (money.rows as any[]).map((r) => ({
    status: r.status,
    count: Number(r.n) || 0,
    gross: Number(r.gross) || 0,
    discounts: Number(r.discounts) || 0,
    net: Number(r.net) || 0,
    commission: Number(r.commission) || 0,
  }))
  const sumBy = (fn: (s: (typeof byStatus)[number]) => number) =>
    byStatus.reduce((a, s) => a + fn(s), 0)

  const confirmed = sumBy((s) =>
    ['CONFIRMED', 'PAYABLE', 'PAID'].includes(s.status) ? s.count : 0
  )
  const completed = sumBy((s) => (['PAYABLE', 'PAID'].includes(s.status) ? s.count : 0))
  const reversed = sumBy((s) => (s.status === 'REVERSED' ? s.count : 0))
  const commissionFor = (status: string) =>
    byStatus.filter((s) => s.status === status).reduce((a, s) => a + s.commission, 0)

  const visits = (byType.LANDING_VIEW || 0) + (byType.JOURNEY_VIEW || 0)
  const conversionRate = uniqueSessions > 0 ? confirmed / uniqueSessions : 0

  return {
    range: { from: range.from, to: range.to },
    visits,
    uniqueSessions,
    journeyViews: byType.JOURNEY_VIEW || 0,
    landingViews: byType.LANDING_VIEW || 0,
    checkoutStarts: byType.CHECKOUT_STARTED || 0,
    confirmedBookings: confirmed,
    completedBookings: completed,
    cancelledRefunded: reversed,
    guestsBooked: Number((guests.rows[0] as any)?.guests) || 0,
    gross: sumBy((s) => s.gross),
    discounts: sumBy((s) => s.discounts),
    net: sumBy((s) => s.net),
    pendingCommission: commissionFor('PENDING') + commissionFor('CONFIRMED'),
    payableCommission: commissionFor('PAYABLE'),
    paidCommission: commissionFor('PAID'),
    reversedCommission: commissionFor('REVERSED'),
    conversionRate,
    currency: 'MXN',
    timezone: 'America/Mexico_City',
    byStatus,
  }
}

export async function getSeries(partnerId: string, range: DateRange) {
  await ensurePartnerAccountSchema()
  const [visits, money] = await Promise.all([
    turso.execute({
      sql: `SELECT substr(created_at,1,10) AS day, event_type, COUNT(*) AS n
            FROM partner_referral_events
            WHERE partner_id = ? AND created_at >= ? AND created_at < ?
              AND event_type IN ('LANDING_VIEW','JOURNEY_VIEW')
            GROUP BY day, event_type ORDER BY day`,
      args: [partnerId, range.from, range.to],
    }),
    turso.execute({
      sql: `SELECT substr(a.created_at,1,10) AS day,
                   COALESCE(SUM(a.final_amount),0) AS revenue,
                   COALESCE(SUM(a.discount_amount),0) AS discounts,
                   COALESCE(SUM(a.commission_amount),0) AS commission,
                   COUNT(*) AS bookings
            FROM booking_attributions a
            WHERE a.partner_id = ? AND a.created_at >= ? AND a.created_at < ?
            GROUP BY day ORDER BY day`,
      args: [partnerId, range.from, range.to],
    }),
  ])
  const days: Record<
    string,
    {
      day: string
      visits: number
      revenue: number
      discounts: number
      commission: number
      bookings: number
    }
  > = {}
  const ensure = (day: string) =>
    (days[day] ||= { day, visits: 0, revenue: 0, discounts: 0, commission: 0, bookings: 0 })
  for (const r of visits.rows as any[]) ensure(r.day).visits += Number(r.n) || 0
  for (const r of money.rows as any[]) {
    const row = ensure(r.day)
    row.revenue += Number(r.revenue) || 0
    row.discounts += Number(r.discounts) || 0
    row.commission += Number(r.commission) || 0
    row.bookings += Number(r.bookings) || 0
  }
  return Object.values(days).sort((a, b) => (a.day < b.day ? -1 : 1))
}

export async function getBreakdowns(partnerId: string, range: DateRange) {
  await ensurePartnerAccountSchema()
  const [byJourney, byPlacement, byCampaign] = await Promise.all([
    turso.execute({
      sql: `SELECT COALESCE(e.title_es, e.title_en, b.experience_id) AS label,
                   COUNT(*) AS bookings, COALESCE(SUM(a.final_amount),0) AS revenue,
                   COALESCE(SUM(a.commission_amount),0) AS commission
            FROM booking_attributions a
            JOIN bookings b ON b.id = a.booking_id
            JOIN experiences e ON e.id = b.experience_id
            WHERE a.partner_id = ? AND a.created_at >= ? AND a.created_at < ?
            GROUP BY label ORDER BY revenue DESC LIMIT 20`,
      args: [partnerId, range.from, range.to],
    }),
    turso.execute({
      sql: `SELECT COALESCE(NULLIF(a.placement,''), '(no placement)') AS label,
                   COUNT(*) AS bookings, COALESCE(SUM(a.final_amount),0) AS revenue
            FROM booking_attributions a
            WHERE a.partner_id = ? AND a.created_at >= ? AND a.created_at < ?
            GROUP BY label ORDER BY revenue DESC LIMIT 20`,
      args: [partnerId, range.from, range.to],
    }),
    turso.execute({
      sql: `SELECT COALESCE(NULLIF(a.campaign,''), '(no campaign)') AS label,
                   COUNT(*) AS bookings, COALESCE(SUM(a.final_amount),0) AS revenue
            FROM booking_attributions a
            WHERE a.partner_id = ? AND a.created_at >= ? AND a.created_at < ?
            GROUP BY label ORDER BY revenue DESC LIMIT 20`,
      args: [partnerId, range.from, range.to],
    }),
  ])
  const map = (rows: any[]) =>
    rows.map((r) => ({
      label: String(r.label || '(unknown)'),
      bookings: Number(r.bookings) || 0,
      revenue: Number(r.revenue) || 0,
      commission: Number(r.commission) || 0,
    }))
  return {
    byJourney: map(byJourney.rows),
    byPlacement: map(byPlacement.rows),
    byCampaign: map(byCampaign.rows),
  }
}

export function rangeContainsDay(range: DateRange, day: string): boolean {
  return inRange(day, range)
}
