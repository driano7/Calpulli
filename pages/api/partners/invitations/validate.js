// MIT License - Copyright (c) 2024-2026 Donovan Riaño / Calpulli CDMX
// GET /api/partners/invitations/validate?token=...
// Never reveals whether the email has an Amaxing account.
import { findInvitationByToken, ensurePartnerAccountSchema } from '@/lib/partners/accounts'

export const config = { runtime: 'nodejs' }

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' })
  await ensurePartnerAccountSchema()
  const token = typeof req.query.token === 'string' ? req.query.token : ''
  if (!token) return res.status(400).json({ valid: false, reason: 'invalid' })
  try {
    const { row, reason } = await findInvitationByToken(token)
    if (!row || reason !== 'ok') {
      return res.status(200).json({ valid: false, reason })
    }
    return res.status(200).json({
      valid: true,
      partnerName: row.partner_name,
      role: row.role,
      expiresAt: row.expires_at,
    })
  } catch (err) {
    console.error('[partners.invite.validate] error:', err)
    return res.status(500).json({ error: 'Failed to validate invitation' })
  }
}
