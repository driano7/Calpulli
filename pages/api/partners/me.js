// MIT License - Copyright (c) 2024-2026 Donovan Riaño / Calpulli CDMX
// GET /api/partners/me — list active + pending memberships for the caller.
// Reuses existing auth (Bearer). Returns empty when no membership.
import { turso } from '@/lib/turso'
import { getSessionUser } from '@/lib/auth'
import { ensurePartnerAccountSchema } from '@/lib/partners/accounts'

export const config = { runtime: 'nodejs' }

function bearer(req) {
  const h = req.headers.authorization
  return typeof h === 'string' && h.startsWith('Bearer ') ? h.slice(7).trim() : null
}

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' })
  await ensurePartnerAccountSchema()
  const actor = await getSessionUser(bearer(req))
  if (!actor) return res.status(401).json({ error: 'Unauthorized' })
  const result = await turso.execute({
    sql: `SELECT m.id AS membership_id, m.role, m.status, m.partner_id,
                 p.slug, p.referral_code, p.name, p.status AS partner_status
          FROM partner_memberships m JOIN partners p ON p.id = m.partner_id
          WHERE m.user_id = ?
          ORDER BY m.created_at ASC`,
    args: [actor.id],
  })
  const memberships = result.rows
    .map((r) => ({
      id: r.membership_id,
      partnerId: r.partner_id,
      slug: r.slug,
      referralCode: r.referral_code,
      partnerName: r.name,
      partnerStatus: r.partner_status,
      role: r.role,
      status: r.status,
    }))
    .filter((m) => m.status === 'ACTIVE')
  return res.status(200).json({
    user: { id: actor.id, email: actor.email, role: actor.role },
    memberships,
    primary: memberships[0] || null,
  })
}
