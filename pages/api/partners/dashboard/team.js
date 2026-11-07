// MIT License - Copyright (c) 2024-2026 Donovan Riaño / Calpulli CDMX
// Partner team management — OWNER only writes. GET: members + invitations.
// POST {action}: invite | resend | revoke | suspend | remove | role
import { turso } from '@/lib/turso'
import { getPartnerContext, partnerApiError } from '@/lib/partners/authGuard'
import {
  ensurePartnerAccountSchema,
  createInvitation,
  listMemberships,
  listInvitations,
} from '@/lib/partners/accounts'
import { logAccess } from '@/lib/auth'

export const config = { runtime: 'nodejs' }

const ROLES = ['OWNER', 'MANAGER', 'STAFF', 'VIEWER']

export default async function handler(req, res) {
  try {
    await ensurePartnerAccountSchema()
    if (req.method === 'GET') {
      const ctx = await getPartnerContext(req, {
        requestedPartnerId: typeof req.query.partnerId === 'string' ? req.query.partnerId : null,
        action: 'team:list',
      })
      const [members, invitations] = await Promise.all([
        listMemberships(ctx.partnerId),
        listInvitations(ctx.partnerId),
      ])
      return res.status(200).json({ members, invitations })
    }

    if (req.method === 'POST') {
      const body = req.body || {}
      const action = String(body.action || '')
      const ctx = await getPartnerContext(req, {
        requestedPartnerId: body.partnerId || null,
        action: 'team:manage',
      })
      const pid = ctx.partnerId
      const actor = ctx.actor

      if (action === 'invite' || action === 'resend') {
        const email = String(body.email || '')
          .trim()
          .toLowerCase()
        const role = String(body.role || 'VIEWER').toUpperCase()
        if (!email.includes('@')) return res.status(400).json({ error: 'valid email required' })
        if (!ROLES.includes(role)) return res.status(400).json({ error: 'invalid role' })
        const { invitationId, expiresAt } = await createInvitation({
          email,
          partnerId: pid,
          role,
          invitedByUserId: actor.id,
        })
        // Raw token returned once (email delivery is done by admin tooling;
        // never logged). Fallback: token is not stored in clear.
        await logAccess({
          actorId: actor.id,
          actorEmail: actor.email,
          actorRole: actor.role,
          action: `partner_team_${action}`,
          targetEmail: email,
          details: { partnerId: pid, role, invitationId, expiresAt },
        })
        return res.status(201).json({ invitationId, expiresAt, ok: true })
      }

      if (action === 'revoke') {
        const id = String(body.invitationId || '')
        if (!id) return res.status(400).json({ error: 'invitationId required' })
        const result = await turso.execute({
          sql: `UPDATE partner_invitations SET revoked_at = datetime('now')
                WHERE id = ? AND partner_id = ? AND revoked_at IS NULL AND accepted_at IS NULL`,
          args: [id, pid],
        })
        if (!result.rowsAffected) return res.status(404).json({ error: 'Invitation not found' })
        await logAccess({
          actorId: actor.id,
          actorEmail: actor.email,
          actorRole: actor.role,
          action: 'partner_invitation_revoke',
          targetEmail: id,
          details: { partnerId: pid },
        })
        return res.status(200).json({ ok: true })
      }

      if (action === 'role' || action === 'suspend' || action === 'remove') {
        const membershipId = String(body.membershipId || '')
        const targetRole = action === 'role' ? String(body.role || '').toUpperCase() : null
        if (!membershipId) return res.status(400).json({ error: 'membershipId required' })
        if (action === 'role' && !ROLES.includes(targetRole)) {
          return res.status(400).json({ error: 'invalid role' })
        }
        const row = await turso.execute({
          sql: `SELECT * FROM partner_memberships WHERE id = ? AND partner_id = ? LIMIT 1`,
          args: [membershipId, pid],
        })
        const m = row.rows[0]
        if (!m) return res.status(404).json({ error: 'Membership not found' })
        // Last OWNER protection.
        if (m.role === 'OWNER' && m.status === 'ACTIVE') {
          const owners = await turso.execute({
            sql: `SELECT COUNT(*) AS n FROM partner_memberships
                  WHERE partner_id = ? AND role = 'OWNER' AND status = 'ACTIVE'`,
            args: [pid],
          })
          const n = Number(owners.rows[0]?.n) || 0
          const demoting =
            action === 'remove' ||
            action === 'suspend' ||
            (action === 'role' && targetRole !== 'OWNER')
          if (demoting && n <= 1) {
            return res.status(409).json({
              error: 'Cannot remove or demote the last active OWNER. Transfer ownership first.',
            })
          }
        }
        if (action === 'role') {
          await turso.execute({
            sql: `UPDATE partner_memberships SET role = ? WHERE id = ?`,
            args: [targetRole, membershipId],
          })
          await logAccess({
            actorId: actor.id,
            actorEmail: actor.email,
            actorRole: actor.role,
            action: 'partner_team_role',
            targetEmail: m.user_id || membershipId,
            details: { partnerId: pid, membershipId, role: targetRole },
          })
          return res.status(200).json({ ok: true })
        }
        const nextStatus = action === 'suspend' ? 'SUSPENDED' : 'REMOVED'
        await turso.execute({
          sql: `UPDATE partner_memberships SET status = ? WHERE id = ?`,
          args: [nextStatus, membershipId],
        })
        await logAccess({
          actorId: actor.id,
          actorEmail: actor.email,
          actorRole: actor.role,
          action: `partner_team_${nextStatus.toLowerCase()}`,
          targetEmail: m.user_id || membershipId,
          details: { partnerId: pid, membershipId },
        })
        return res.status(200).json({ ok: true })
      }

      return res.status(400).json({ error: 'unknown action' })
    }

    return res.status(405).json({ error: 'Method not allowed' })
  } catch (err) {
    return partnerApiError(res, err)
  }
}
