// MIT License - Copyright (c) 2024-2026 Donovan Riaño / Calpulli CDMX
// POST /api/partners/track — deduplicated partner events.
// Body: { ref, eventType, eventKey, path }
// eventKey must be stable per logical event (server uses INSERT OR IGNORE).
// Unknown/inactive partners are ignored (analytics only, never security).
import { resolveActivePartner, recordPartnerEvent } from '@/lib/partners'

export const config = { runtime: 'nodejs' }

const CLIENT_EVENTS = new Set(['LANDING_VIEW', 'JOURNEY_VIEW', 'CHECKOUT_STARTED'])

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })
  const body = req.body || {}
  const ref = typeof body.ref === 'string' ? body.ref : ''
  const eventType = typeof body.eventType === 'string' ? body.eventType : ''
  const eventKey = typeof body.eventKey === 'string' ? body.eventKey : ''
  if (!ref || !CLIENT_EVENTS.has(eventType) || !eventKey) {
    return res.status(400).json({
      error: 'ref, eventType (LANDING_VIEW|JOURNEY_VIEW|CHECKOUT_STARTED) and eventKey required',
    })
  }
  try {
    const partner = await resolveActivePartner(ref)
    if (!partner) return res.status(200).json({ tracked: false })
    const recorded = await recordPartnerEvent({
      partner,
      eventType,
      eventKey,
      path: typeof body.path === 'string' ? body.path.slice(0, 300) : null,
    })
    return res.status(200).json({ tracked: recorded })
  } catch (err) {
    console.error('[partners.track] error:', err)
    return res.status(200).json({ tracked: false })
  }
}
