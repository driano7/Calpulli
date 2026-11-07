// MIT License - Copyright (c) 2024-2026 Donovan Riaño / Calpulli CDMX
// POST /api/partners/invitations/accept { token, agreementAccepted }
// Authenticated via existing Bearer session. Validates token, requires
// agreement acceptance, activates membership. Invitation email must match
// the signed-in email (generic error, no enumeration).
import { turso } from '@/lib/turso'
import { getSessionUser, logAccess } from '@/lib/auth'
import {
  findInvitationByToken,
  ensurePartnerAccountSchema,
  AGREEMENT_VERSION,
} from '@/lib/partners/accounts'

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
  const body = req.body || {}
  const token = String(body.token || '')
  if (!token) return res.status(400).json({ error: 'token required' })
  if (body.agreementAccepted !== true) {
    return res.status(400).json({ error: 'Partner Referral Agreement acceptance required' })
  }
  try {
    const { row, reason } = await findInvitationByToken(token)
    if (!row || reason !== 'ok') {
      return res.status(400).json({ error: 'Invitation is no longer valid' })
    }
    if (String(row.email).toLowerCase() !== String(actor.email).toLowerCase()) {
      return res.status(403).json({ error: 'Invitation is no longer valid' })
    }
    // Upsert membership (multi-property ready).
    const existing = await turso.execute({
      sql: `SELECT id FROM partner_memberships WHERE user_id = ? AND partner_id = ? LIMIT 1`,
      args: [actor.id, row.partner_id],
    })
    if (existing.rows[0]) {
      await turso.execute({
        sql: `UPDATE partner_memberships SET role = ?, status = 'ACTIVE', accepted_at = datetime('now'),
                     last_login_at = datetime('now'), agreement_version = ?, agreement_accepted_at = datetime('now')
              WHERE user_id = ? AND partner_id = ?`,
        args: [row.role, AGREEMENT_VERSION, actor.id, row.partner_id],
      })
    } else {
      await turso.execute({
        sql: `INSERT INTO partner_memberships (user_id, partner_id, role, status, invited_by_user_id, accepted_at, last_login_at, agreement_version, agreement_accepted_at)
              VALUES (?, ?, ?, 'ACTIVE', ?, datetime('now'), datetime('now'), ?, datetime('now'))`,
        args: [actor.id, row.partner_id, row.role, row.invited_by_user_id, AGREEMENT_VERSION],
      })
    }
    await turso.execute({
      sql: `UPDATE partner_invitations SET accepted_at = datetime('now')
            WHERE id = ? AND revoked_at IS NULL`,
      args: [row.id],
    })
    await logAccess({
      actorId: actor.id,
      actorEmail: actor.email,
      actorRole: actor.role,
      action: 'partner_invitation_accept',
      targetEmail: row.email,
      details: { partnerId: row.partner_id, role: row.role, agreement: AGREEMENT_VERSION },
    })
    return res.status(200).json({ ok: true, partnerId: row.partner_id })
  } catch (err) {
    console.error('[partners.invite.accept] error:', err)
    return res.status(500).json({ error: 'Failed to accept invitation' })
  }
}
