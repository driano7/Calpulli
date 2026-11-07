// MIT License - Copyright (c) 2024-2026 Donovan Riaño / Calpulli CDMX
// Admin-only: invite a partner user. POST { email, partnerId|slug, role }
// Returns raw token ONCE + accept link (never stored in clear).
import { turso } from '@/lib/turso'
import { getSessionUser, logAccess } from '@/lib/auth'
import { ensurePartnerAccountSchema, createInvitation } from '@/lib/partners/accounts'

export const config = { runtime: 'nodejs' }

function bearer(req) {
  const h = req.headers.authorization
  return typeof h === 'string' && h.startsWith('Bearer ') ? h.slice(7).trim() : null
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })
  await ensurePartnerAccountSchema()
  const actor = await getSessionUser(bearer(req))
  if (!actor) return res.status(401).json({ error: 'Unauthorized' })
  if (actor.role !== 'admin') return res.status(403).json({ error: 'Forbidden: admin only' })
  const body = req.body || {}
  const email = String(body.email || '')
    .trim()
    .toLowerCase()
  const role = String(body.role || 'VIEWER').toUpperCase()
  if (!email.includes('@')) return res.status(400).json({ error: 'valid email required' })
  if (!['OWNER', 'MANAGER', 'STAFF', 'VIEWER'].includes(role)) {
    return res.status(400).json({ error: 'invalid role' })
  }
  let partnerId = body.partnerId
  const ref = body.slug || body.partnerRef
  if (!partnerId && ref) {
    const found = await turso.execute({
      sql: `SELECT id FROM partners WHERE LOWER(slug) = LOWER(?) OR LOWER(referral_code) = LOWER(?) LIMIT 1`,
      args: [String(ref).trim(), String(ref).trim()],
    })
    partnerId = found.rows[0]?.id
  }
  if (!partnerId) return res.status(400).json({ error: 'partnerId (or slug) required' })
  try {
    const { token, invitationId, expiresAt } = await createInvitation({
      email,
      partnerId,
      role,
      invitedByUserId: actor.id,
    })
    const base =
      (req.headers.origin && String(req.headers.origin)) ||
      process.env.NEXT_PUBLIC_SITE_URL ||
      'http://localhost:3000'
    const acceptUrl = `${base.replace(/\/+$/, '')}/partners/accept-invitation?token=${token}`
    await logAccess({
      actorId: actor.id,
      actorEmail: actor.email,
      actorRole: actor.role,
      action: 'partner_admin_invite',
      targetEmail: email,
      details: { partnerId, role, invitationId, expiresAt },
    })
    return res.status(201).json({ invitationId, expiresAt, token, acceptUrl })
  } catch (err) {
    console.error('[admin.partners.invite] error:', err)
    return res.status(500).json({ error: 'Failed to create invitation' })
  }
}
