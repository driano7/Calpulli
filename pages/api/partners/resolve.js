// MIT License - Copyright (c) 2024-2026 Donovan Riaño / Calpulli CDMX
// GET /api/partners/resolve?ref=hostal-mx
// Public: returns ONLY public fields (never commission).
// Invalid / PAUSED / INACTIVE / expired refs return the same generic
// { active: false } shape so codes cannot be enumerated.
import { resolvePartner, toPublicPartner, isPartnerActive } from '@/lib/partners'

export const config = { runtime: 'nodejs' }

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' })
  const ref = typeof req.query.ref === 'string' ? req.query.ref : ''
  if (!ref || !ref.trim()) {
    return res.status(200).json({ active: false })
  }
  try {
    const partner = await resolvePartner(ref)
    if (!partner || !isPartnerActive(partner)) {
      return res.status(200).json({ active: false })
    }
    return res.status(200).json({
      active: true,
      partner: toPublicPartner(partner),
      attributionDays: partner.attributionDays,
    })
  } catch (err) {
    console.error('[partners.resolve] error:', err)
    return res.status(200).json({ active: false })
  }
}
