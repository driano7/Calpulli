// MIT License - Copyright (c) 2024-2026 Donovan Riaño / Calpulli CDMX
// Server-side partner authorization. Reuses existing auth (getSessionUser).
// Every dashboard API MUST call getPartnerContext() — never trust UI.
import { turso } from '../turso'
import { getSessionUser } from '../auth'
import { ensurePartnerAccountSchema } from './accounts'

export type PartnerRole = 'OWNER' | 'MANAGER' | 'STAFF' | 'VIEWER'
export type PartnerAction =
  | 'analytics'
  | 'bookings'
  | 'links'
  | 'qr'
  | 'materials'
  | 'reports'
  | 'commissions'
  | 'team:list'
  | 'team:manage'
  | 'settings:read'
  | 'settings:write'

const PERMISSIONS: Record<PartnerAction, PartnerRole[]> = {
  analytics: ['OWNER', 'MANAGER', 'STAFF', 'VIEWER'],
  bookings: ['OWNER', 'MANAGER'],
  links: ['OWNER', 'MANAGER', 'STAFF'],
  qr: ['OWNER', 'MANAGER', 'STAFF'],
  materials: ['OWNER', 'MANAGER', 'STAFF'],
  reports: ['OWNER', 'MANAGER', 'VIEWER'],
  commissions: ['OWNER', 'MANAGER'],
  'team:list': ['OWNER', 'MANAGER'],
  'team:manage': ['OWNER'],
  'settings:read': ['OWNER', 'MANAGER', 'STAFF', 'VIEWER'],
  'settings:write': ['OWNER', 'MANAGER'],
}

export function canDo(role: string | null | undefined, action: PartnerAction): boolean {
  if (!role) return false
  return (PERMISSIONS[action] || []).includes(role as PartnerRole)
}

export interface PartnerContext {
  actor: { id: string; email: string; role: string; firstName: string; lastName: string }
  partnerId: string
  partner: {
    id: string
    slug: string
    referralCode: string
    name: string
    websiteUrl: string | null
    logoUrl: string | null
    status: string
    guestDiscountPct: number
    commissionPct: number
    attributionDays: number
    type: string | null
    contactPerson: string | null
    contactEmail: string | null
    contactPhone: string | null
    preferredLanguage: string | null
    notificationPrefs: Record<string, unknown> | null
  }
  membership: { id: string; role: PartnerRole; status: string }
  memberships: Array<{
    id: string
    partnerId: string
    role: PartnerRole
    status: string
    partnerName: string
  }>
}

export function bearerToken(req: any): string | null {
  const h = req?.headers?.authorization
  return typeof h === 'string' && h.startsWith('Bearer ') ? h.slice(7).trim() || null : null
}

function mapPartner(row: any) {
  let prefs: Record<string, unknown> | null = null
  try {
    prefs = row.notification_prefs ? JSON.parse(row.notification_prefs) : null
  } catch {
    prefs = null
  }
  return {
    id: row.id,
    slug: row.slug,
    referralCode: row.referral_code,
    name: row.name,
    websiteUrl: row.website_url ?? null,
    logoUrl: row.logo_url ?? null,
    status: String(row.status || 'ACTIVE').toUpperCase(),
    guestDiscountPct: Number(row.guest_discount_pct ?? 0.1),
    commissionPct: Number(row.commission_pct ?? 0.1),
    attributionDays: Number(row.attribution_days ?? 30),
    type: row.type ?? null,
    contactPerson: row.contact_person ?? null,
    contactEmail: row.contact_email ?? null,
    contactPhone: row.contact_phone ?? null,
    preferredLanguage: row.preferred_language ?? null,
    notificationPrefs: prefs,
  }
}

/**
 * Resolve the active membership for the caller.
 * - `requestedPartnerId`: optional query/body partnerId. If given, it MUST
 *   match one of the caller's ACTIVE memberships (IDOR guard).
 * - Without it, defaults to the first ACTIVE membership (most recent).
 */
export async function getPartnerContext(
  req: any,
  opts: { requestedPartnerId?: string | null; action?: PartnerAction } = {}
): Promise<PartnerContext> {
  await ensurePartnerAccountSchema()
  const actor = await getSessionUser(bearerToken(req))
  if (!actor) {
    const err: any = new Error('Unauthorized')
    err.status = 401
    throw err
  }

  // Amaxing admins do NOT auto-get partner data — membership required.
  const result = await turso.execute({
    sql: `SELECT m.id AS membership_id, m.role, m.status, m.partner_id,
                 p.slug, p.referral_code, p.name, p.website_url, p.logo_url, p.status AS partner_status,
                 p.guest_discount_pct, p.commission_pct, p.attribution_days, p.type,
                 p.contact_person, p.contact_email, p.contact_phone, p.preferred_language, p.notification_prefs
          FROM partner_memberships m
          JOIN partners p ON p.id = m.partner_id
          WHERE m.user_id = ? AND m.status = 'ACTIVE'
          ORDER BY m.created_at ASC`,
    args: [actor.id],
  })

  const rows = result.rows as any[]
  const memberships = rows.map((r) => ({
    id: r.membership_id,
    partnerId: r.partner_id,
    role: r.role as PartnerRole,
    status: r.status,
    partnerName: r.name,
  }))

  if (memberships.length === 0) {
    const err: any = new Error('No active partner membership')
    err.status = 403
    throw err
  }

  let chosen = rows[0] as any
  if (opts.requestedPartnerId) {
    const found = rows.find((r) => r.partner_id === opts.requestedPartnerId)
    if (!found) {
      const err: any = new Error('Forbidden: no access to this partner')
      err.status = 403
      throw err
    }
    chosen = found
  }
  // If multiple memberships and none requested, use first (client must
  // request explicitly for others). This avoids accidental cross-partner reads.

  if (String(chosen.partner_status).toUpperCase() === 'INACTIVE') {
    const err: any = new Error('Partner is inactive')
    err.status = 403
    throw err
  }

  if (opts.action && !canDo(chosen.role, opts.action)) {
    const err: any = new Error('Forbidden: insufficient role')
    err.status = 403
    throw err
  }

  await turso.execute({
    sql: `UPDATE partner_memberships SET last_login_at = datetime('now') WHERE id = ?`,
    args: [chosen.membership_id],
  })

  return {
    actor: {
      id: actor.id,
      email: actor.email,
      role: actor.role,
      firstName: actor.firstName,
      lastName: actor.lastName,
    },
    partnerId: chosen.partner_id,
    partner: mapPartner(chosen),
    membership: {
      id: chosen.membership_id,
      role: chosen.role as PartnerRole,
      status: chosen.status,
    },
    memberships,
  }
}

export function partnerApiError(res: any, err: any) {
  if (err?.status) return res.status(err.status).json({ error: err.message })
  console.error('[partners.auth] error:', err)
  return res.status(500).json({ error: 'Failed to process partner request' })
}
