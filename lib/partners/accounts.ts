// MIT License - Copyright (c) 2024-2026 Donovan Riaño / Calpulli CDMX
// Partner memberships + invitations. Server-only. Reuses Turso.
import { createHash, randomBytes } from 'crypto'
import { turso } from '../turso'
import { ensurePartnerSchema } from './index'

export const AGREEMENT_VERSION = '2026-09-v1'
export const INVITATION_TTL_DAYS = 7

let accountSchemaReady: Promise<void> | null = null

export function ensurePartnerAccountSchema(): Promise<void> {
  if (accountSchemaReady) return accountSchemaReady
  accountSchemaReady = (async () => {
    await ensurePartnerSchema()
    const stmts = [
      `CREATE TABLE IF NOT EXISTS partner_memberships (
        id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
        user_id TEXT REFERENCES users(id) ON DELETE CASCADE,
        partner_id TEXT NOT NULL REFERENCES partners(id) ON DELETE CASCADE,
        role TEXT NOT NULL DEFAULT 'VIEWER',
        status TEXT NOT NULL DEFAULT 'INVITED',
        invited_by_user_id TEXT REFERENCES users(id) ON DELETE SET NULL,
        invited_at TEXT NOT NULL DEFAULT (datetime('now')),
        accepted_at TEXT,
        last_login_at TEXT,
        agreement_version TEXT,
        agreement_accepted_at TEXT,
        created_at TEXT NOT NULL DEFAULT (datetime('now')),
        updated_at TEXT NOT NULL DEFAULT (datetime('now'))
      )`,
      `CREATE INDEX IF NOT EXISTS idx_memberships_user ON partner_memberships(user_id)`,
      `CREATE INDEX IF NOT EXISTS idx_memberships_partner ON partner_memberships(partner_id)`,
      `CREATE UNIQUE INDEX IF NOT EXISTS idx_memberships_user_partner ON partner_memberships(user_id, partner_id)`,
      `CREATE TABLE IF NOT EXISTS partner_invitations (
        id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
        email TEXT NOT NULL,
        partner_id TEXT NOT NULL REFERENCES partners(id) ON DELETE CASCADE,
        role TEXT NOT NULL DEFAULT 'VIEWER',
        token_hash TEXT NOT NULL UNIQUE,
        invited_by_user_id TEXT REFERENCES users(id) ON DELETE SET NULL,
        expires_at TEXT NOT NULL,
        revoked_at TEXT,
        accepted_at TEXT,
        created_at TEXT NOT NULL DEFAULT (datetime('now')),
        updated_at TEXT NOT NULL DEFAULT (datetime('now'))
      )`,
      `CREATE INDEX IF NOT EXISTS idx_invitations_email ON partner_invitations(email)`,
      `CREATE INDEX IF NOT EXISTS idx_invitations_partner ON partner_invitations(partner_id)`,
      `CREATE INDEX IF NOT EXISTS idx_invitations_hash ON partner_invitations(token_hash)`,
      `CREATE TABLE IF NOT EXISTS partner_applications (
        id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
        business_name TEXT NOT NULL,
        type TEXT,
        contact_person TEXT,
        email TEXT NOT NULL,
        phone TEXT,
        city TEXT,
        message TEXT,
        status TEXT NOT NULL DEFAULT 'NEW',
        created_at TEXT NOT NULL DEFAULT (datetime('now')),
        updated_at TEXT NOT NULL DEFAULT (datetime('now'))
      )`,
    ]
    for (const sql of stmts) {
      try {
        await turso.execute({ sql })
      } catch {
        // best effort
      }
    }
    const alters = [
      `ALTER TABLE partners ADD COLUMN type TEXT`,
      `ALTER TABLE partners ADD COLUMN contact_person TEXT`,
      `ALTER TABLE partners ADD COLUMN contact_email TEXT`,
      `ALTER TABLE partners ADD COLUMN contact_phone TEXT`,
      `ALTER TABLE partners ADD COLUMN preferred_language TEXT`,
      `ALTER TABLE partners ADD COLUMN notification_prefs TEXT`,
      `ALTER TABLE partner_referral_events ADD COLUMN session_id TEXT`,
      `ALTER TABLE partner_referral_events ADD COLUMN placement TEXT`,
      `ALTER TABLE partner_referral_events ADD COLUMN campaign TEXT`,
      `ALTER TABLE partner_referral_events ADD COLUMN utm_content TEXT`,
      `ALTER TABLE booking_attributions ADD COLUMN placement TEXT`,
      `ALTER TABLE booking_attributions ADD COLUMN campaign TEXT`,
      `ALTER TABLE booking_attributions ADD COLUMN payable_at TEXT`,
      `ALTER TABLE booking_attributions ADD COLUMN paid_at TEXT`,
      `ALTER TABLE booking_attributions ADD COLUMN payout_reference TEXT`,
    ]
    for (const sql of alters) {
      try {
        await turso.execute({ sql })
      } catch {
        // duplicate column
      }
    }
    for (const sql of [
      `CREATE INDEX IF NOT EXISTS idx_events_session ON partner_referral_events(partner_id, session_id, created_at)`,
      `CREATE INDEX IF NOT EXISTS idx_events_placement ON partner_referral_events(partner_id, placement)`,
      `CREATE INDEX IF NOT EXISTS idx_attr_placement ON booking_attributions(partner_id, placement)`,
    ]) {
      try {
        await turso.execute({ sql })
      } catch {
        void 0
      }
    }
  })().catch(() => undefined) as Promise<void>
  return accountSchemaReady
}

export function hashInvitationToken(token: string): string {
  return createHash('sha256').update(String(token)).digest('hex')
}

export function generateInvitationToken(): string {
  return randomBytes(32).toString('hex')
}

export function invitationsEqual(a: string, b: string): boolean {
  const ba = Buffer.from(a)
  const bb = Buffer.from(b)
  return ba.length === bb.length && ba.equals(bb)
}

export interface InvitationRow {
  id: string
  email: string
  partnerId: string
  partnerName: string
  role: string
  expiresAt: string
  revokedAt: string | null
  acceptedAt: string | null
  createdAt: string
}

/**
 * Create a pending invitation. Returns raw token (show once).
 * Revokes prior open invitations for same email+partner (idempotent resend).
 */
export async function createInvitation(params: {
  email: string
  partnerId: string
  role: string
  invitedByUserId: string | null
}): Promise<{ token: string; invitationId: string; expiresAt: string }> {
  await ensurePartnerAccountSchema()
  const email = String(params.email || '')
    .trim()
    .toLowerCase()
  const token = generateInvitationToken()
  const tokenHash = hashInvitationToken(token)
  const expiresAt = new Date(Date.now() + INVITATION_TTL_DAYS * 86400_000).toISOString()
  await turso.execute({
    sql: `UPDATE partner_invitations SET revoked_at = datetime('now')
          WHERE email = ? COLLATE NOCASE AND partner_id = ? AND revoked_at IS NULL AND accepted_at IS NULL`,
    args: [email, params.partnerId],
  })
  const inserted = await turso.execute({
    sql: `INSERT INTO partner_invitations (email, partner_id, role, token_hash, invited_by_user_id, expires_at)
          VALUES (?, ?, ?, ?, ?, ?) RETURNING id`,
    args: [email, params.partnerId, params.role, tokenHash, params.invitedByUserId, expiresAt],
  })
  const id = (inserted.rows[0] as any)?.id
  return { token, invitationId: id, expiresAt }
}

/** Validate raw token without leaking email-account existence. */
export async function findInvitationByToken(
  rawToken: string
): Promise<{ row: any | null; reason: 'ok' | 'invalid' | 'expired' | 'revoked' | 'accepted' }> {
  await ensurePartnerAccountSchema()
  const tokenHash = hashInvitationToken(String(rawToken || ''))
  const result = await turso.execute({
    sql: `SELECT i.*, p.name AS partner_name FROM partner_invitations i
          JOIN partners p ON p.id = i.partner_id WHERE i.token_hash = ? LIMIT 1`,
    args: [tokenHash],
  })
  const row: any = result.rows[0]
  if (!row) return { row: null, reason: 'invalid' }
  if (row.revoked_at) return { row, reason: 'revoked' }
  if (row.accepted_at) return { row, reason: 'accepted' }
  if (new Date(row.expires_at).getTime() < Date.now()) return { row, reason: 'expired' }
  return { row, reason: 'ok' }
}

export async function listMemberships(partnerId: string) {
  await ensurePartnerAccountSchema()
  const result = await turso.execute({
    sql: `SELECT m.id, m.user_id, m.role, m.status, m.invited_at, m.accepted_at, m.last_login_at,
                 u.email
          FROM partner_memberships m
          LEFT JOIN users u ON u.id = m.user_id
          WHERE m.partner_id = ?
          ORDER BY m.created_at ASC`,
    args: [partnerId],
  })
  return result.rows.map((r: any) => ({
    id: r.id,
    userId: r.user_id,
    email: r.email,
    role: r.role,
    status: r.status,
    invitedAt: r.invited_at,
    acceptedAt: r.accepted_at,
    lastLoginAt: r.last_login_at,
  }))
}

export async function listInvitations(partnerId: string): Promise<InvitationRow[]> {
  await ensurePartnerAccountSchema()
  const result = await turso.execute({
    sql: `SELECT i.id, i.email, i.partner_id, p.name AS partner_name, i.role,
                 i.expires_at, i.revoked_at, i.accepted_at, i.created_at
          FROM partner_invitations i JOIN partners p ON p.id = i.partner_id
          WHERE i.partner_id = ?
          ORDER BY i.created_at DESC LIMIT 50`,
    args: [partnerId],
  })
  return result.rows.map((r: any) => ({
    id: r.id,
    email: r.email,
    partnerId: r.partner_id,
    partnerName: r.partner_name,
    role: r.role,
    expiresAt: r.expires_at,
    revokedAt: r.revoked_at || null,
    acceptedAt: r.accepted_at || null,
    createdAt: r.created_at,
  }))
}

export async function countActiveOwners(partnerId: string): Promise<number> {
  const result = await turso.execute({
    sql: `SELECT COUNT(*) AS n FROM partner_memberships
          WHERE partner_id = ? AND role = 'OWNER' AND status = 'ACTIVE'`,
    args: [partnerId],
  })
  return Number((result.rows[0] as any)?.n) || 0
}
