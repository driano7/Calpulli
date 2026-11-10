// MIT License - Copyright (c) 2024-2026 Donovan Riaño / Calpulli CDMX
// GET /api/partners/dashboard/insights?preset=30d&partnerId=...
// Qué pregunta la gente al asistente (global, sin PII) + demanda que el
// socio no está capturando con su link/QR.
import { getPartnerContext, partnerApiError } from '@/lib/partners/authGuard'
import { parseRange } from '@/lib/partners/analytics'
import { getInsights } from '@/lib/partners/insights'

export const config = { runtime: 'nodejs' }

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' })
  try {
    const ctx = await getPartnerContext(req, {
      requestedPartnerId: typeof req.query.partnerId === 'string' ? req.query.partnerId : null,
      action: 'analytics',
    })
    const range = parseRange(req.query)
    const insights = await getInsights(ctx.partnerId, range)
    return res.status(200).json({
      partner: ctx.partner,
      membership: ctx.membership,
      insights,
    })
  } catch (err) {
    return partnerApiError(res, err)
  }
}
