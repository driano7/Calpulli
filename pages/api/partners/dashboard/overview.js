// MIT License - Copyright (c) 2024-2026 Donovan Riaño / Calpulli CDMX
// GET /api/partners/dashboard/overview?preset=30d&partnerId=...
// Money = attributions; events = supporting analytics.
import { getPartnerContext, partnerApiError } from '@/lib/partners/authGuard'
import { parseRange, getOverview, getSeries, getBreakdowns } from '@/lib/partners/analytics'

export const config = { runtime: 'nodejs' }

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' })
  try {
    const ctx = await getPartnerContext(req, {
      requestedPartnerId: typeof req.query.partnerId === 'string' ? req.query.partnerId : null,
      action: 'analytics',
    })
    const range = parseRange(req.query)
    const [overview, series, breakdowns] = await Promise.all([
      getOverview(ctx.partnerId, range),
      getSeries(ctx.partnerId, range),
      getBreakdowns(ctx.partnerId, range),
    ])
    return res.status(200).json({
      partner: ctx.partner,
      membership: ctx.membership,
      memberships: ctx.memberships,
      overview,
      series,
      breakdowns,
    })
  } catch (err) {
    return partnerApiError(res, err)
  }
}
