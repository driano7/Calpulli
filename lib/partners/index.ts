// MIT License - Copyright (c) 2024-2026 Donovan Riaño / Calpulli CDMX
// Partner referrals (hotels/hostels) — server-side only. Turso/SQLite.
// Separate from lib/referrals (staff CALP- codes). This system powers
// ?ref=hostal-mx links with guest discount + partner commission.
import { turso } from '../turso'
import { tours } from '../../data/toursData'
import { JOURNEYS } from '../../data/journeysData'
import { MXN_PER_USD } from '../currency'
import {
  normalizeSlug,
  normalizeCode,
  applyDiscount,
  calcCommission,
  commissionAfterPartialRefund,
  isValidWebsiteUrl,
  isValidLogoUrl,
  isPartnerActive,
} from './pricing'

export {
  normalizeSlug,
  normalizeCode,
  isValidWebsiteUrl,
  isValidLogoUrl,
  isPartnerActive,
  applyDiscount,
  calcCommission,
} from './pricing'

export type PartnerStatus = 'ACTIVE' | 'PAUSED' | 'INACTIVE'
export type AttributionStatus = 'PENDING' | 'CONFIRMED' | 'PAYABLE' | 'PAID' | 'REVERSED'
export type AttributionSource = 'PARTNER_LINK' | 'REFERRAL_CODE' | 'MANUAL'
export type PartnerEventType =
  | 'LANDING_VIEW'
  | 'JOURNEY_VIEW'
  | 'CHECKOUT_STARTED'
  | 'BOOKING_CONFIRMED'
  | 'JOURNEY_COMPLETED'
  | 'BOOKING_CANCELLED'
  | 'BOOKING_REFUNDED'

export interface Partner {
  id: string
  slug: string
  referralCode: string
  name: string
  websiteUrl: string | null
  logoUrl: string | null
  status: PartnerStatus
  guestDiscountPct: number
  commissionPct: number
  attributionDays: number
  userId: string | null
}

export interface PublicPartner {
  slug: string
  referralCode: string
  name: string
  websiteUrl: string | null
  logoUrl: string | null
  guestDiscountPct: number
}

// ---------------------------------------------------------------------------
// Schema (idempotent, lazy). Same DDL as turso-partners.sql.
// ---------------------------------------------------------------------------

let schemaReady: Promise<void> | null = null

export function ensurePartnerSchema(): Promise<void> {
  if (schemaReady) return schemaReady
  schemaReady = (async () => {
    const stmts = [
      `CREATE TABLE IF NOT EXISTS partners (
        id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
        slug TEXT NOT NULL UNIQUE,
        referral_code TEXT NOT NULL UNIQUE,
        name TEXT NOT NULL,
        website_url TEXT,
        logo_url TEXT,
        status TEXT NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'PAUSED', 'INACTIVE')),
        guest_discount_pct REAL NOT NULL DEFAULT 0.10,
        commission_pct REAL NOT NULL DEFAULT 0.10,
        attribution_days INTEGER NOT NULL DEFAULT 30,
        user_id TEXT REFERENCES users(id) ON DELETE SET NULL,
        created_at TEXT NOT NULL DEFAULT (datetime('now')),
        updated_at TEXT NOT NULL DEFAULT (datetime('now'))
      )`,
      `CREATE INDEX IF NOT EXISTS idx_partners_slug ON partners(slug)`,
      `CREATE INDEX IF NOT EXISTS idx_partners_code ON partners(referral_code)`,
      `CREATE INDEX IF NOT EXISTS idx_partners_status ON partners(status)`,
      `CREATE TABLE IF NOT EXISTS partner_referral_events (
        id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
        partner_id TEXT NOT NULL REFERENCES partners(id) ON DELETE CASCADE,
        referral_code TEXT NOT NULL,
        event_type TEXT NOT NULL,
        event_key TEXT NOT NULL UNIQUE,
        path TEXT,
        created_at TEXT NOT NULL DEFAULT (datetime('now'))
      )`,
      `CREATE INDEX IF NOT EXISTS idx_partner_events_partner ON partner_referral_events(partner_id, created_at DESC)`,
      `CREATE TABLE IF NOT EXISTS booking_attributions (
        id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
        booking_id TEXT NOT NULL UNIQUE REFERENCES bookings(id) ON DELETE CASCADE,
        partner_id TEXT NOT NULL REFERENCES partners(id) ON DELETE CASCADE,
        source TEXT NOT NULL DEFAULT 'PARTNER_LINK',
        status TEXT NOT NULL DEFAULT 'PENDING',
        original_amount REAL NOT NULL,
        discount_pct REAL NOT NULL DEFAULT 0,
        discount_amount REAL NOT NULL DEFAULT 0,
        final_amount REAL NOT NULL,
        commission_pct REAL NOT NULL DEFAULT 0,
        commission_amount REAL NOT NULL DEFAULT 0,
        currency TEXT NOT NULL DEFAULT 'MXN',
        reversed_reason TEXT,
        refunded_amount REAL NOT NULL DEFAULT 0,
        created_at TEXT NOT NULL DEFAULT (datetime('now')),
        updated_at TEXT NOT NULL DEFAULT (datetime('now'))
      )`,
      `CREATE INDEX IF NOT EXISTS idx_booking_attr_partner ON booking_attributions(partner_id, created_at DESC)`,
      `CREATE INDEX IF NOT EXISTS idx_booking_attr_status ON booking_attributions(status)`,
      `CREATE INDEX IF NOT EXISTS idx_bookings_partner ON bookings(partner_id)`,
    ]
    for (const sql of stmts) {
      try {
        await turso.execute({ sql })
      } catch {
        // best effort; table may already exist with slight variance
      }
    }
    // bookings denormalized columns (SQLite: no ADD COLUMN IF NOT EXISTS)
    const alters = [
      `ALTER TABLE bookings ADD COLUMN partner_id TEXT REFERENCES partners(id) ON DELETE SET NULL`,
      `ALTER TABLE bookings ADD COLUMN partner_original_amount REAL`,
      `ALTER TABLE bookings ADD COLUMN partner_discount_amount REAL NOT NULL DEFAULT 0`,
      `ALTER TABLE bookings ADD COLUMN partner_discount_pct REAL NOT NULL DEFAULT 0`,
      `ALTER TABLE bookings ADD COLUMN partner_referral_code TEXT`,
    ]
    for (const sql of alters) {
      try {
        await turso.execute({ sql })
      } catch {
        // duplicate column: already exists
      }
    }
  })().catch(() => undefined) as Promise<void>
  return schemaReady
}

// ---------------------------------------------------------------------------
// Price source of truth (mirrors pages/api/stripe/checkout.js priceFor)
// ---------------------------------------------------------------------------

export function priceForExperience(experienceId: unknown): number {
  const id = String(experienceId ?? '')
  const tour = (tours as any[]).find((t) => t.id === id)
  if (tour) return Math.round(Number(tour.price || 0) * MXN_PER_USD)
  const journey = (JOURNEYS as any[]).find((j) => String(j.experience) === id || j.id === id)
  return Number(journey?.price ?? 0) || 0
}

// ---------------------------------------------------------------------------
// Resolve
// ---------------------------------------------------------------------------

function mapPartner(row: any): Partner | null {
  if (!row) return null
  return {
    id: row.id,
    slug: row.slug,
    referralCode: row.referral_code,
    name: row.name,
    websiteUrl: row.website_url ?? null,
    logoUrl: row.logo_url ?? null,
    status: String(row.status || 'ACTIVE').toUpperCase() as PartnerStatus,
    guestDiscountPct: Number(row.guest_discount_pct ?? 0.1),
    commissionPct: Number(row.commission_pct ?? 0.1),
    attributionDays: Number(row.attribution_days ?? 30),
    userId: row.user_id ?? null,
  }
}

export function toPublicPartner(partner: Partner): PublicPartner {
  return {
    slug: partner.slug,
    referralCode: partner.referralCode,
    name: partner.name,
    websiteUrl: partner.websiteUrl,
    logoUrl: partner.logoUrl,
    guestDiscountPct: partner.guestDiscountPct,
  }
}

/**
 * Resolve a ?ref= value to a partner row (any status).
 * Lookup is case-insensitive on slug OR referral_code.
 * Returns null if unknown.
 */
export async function resolvePartner(ref: unknown): Promise<Partner | null> {
  await ensurePartnerSchema()
  const slug = normalizeSlug(ref)
  const code = normalizeCode(ref)
  if (!slug && !code) return null
  const result = await turso.execute({
    sql: `SELECT * FROM partners WHERE LOWER(slug) = ? OR LOWER(referral_code) = ? LIMIT 1`,
    args: [slug || code, code || slug],
  })
  return mapPartner(result.rows[0])
}

/** Resolve and only return if ACTIVE (generates benefits). */
export async function resolveActivePartner(ref: unknown): Promise<Partner | null> {
  const partner = await resolvePartner(ref)
  return isPartnerActive(partner) ? partner : null
}

// ---------------------------------------------------------------------------
// Events (idempotent by event_key)
// ---------------------------------------------------------------------------

const ALLOWED_EVENTS: PartnerEventType[] = [
  'LANDING_VIEW',
  'JOURNEY_VIEW',
  'CHECKOUT_STARTED',
  'BOOKING_CONFIRMED',
  'JOURNEY_COMPLETED',
  'BOOKING_CANCELLED',
  'BOOKING_REFUNDED',
]

export async function recordPartnerEvent(params: {
  partner: Partner
  eventType: PartnerEventType
  eventKey: string
  path?: string | null
}): Promise<boolean> {
  await ensurePartnerSchema()
  if (!ALLOWED_EVENTS.includes(params.eventType)) return false
  if (!params.eventKey) return false
  try {
    const result = await turso.execute({
      sql: `INSERT OR IGNORE INTO partner_referral_events (partner_id, referral_code, event_type, event_key, path)
            VALUES (?, ?, ?, ?, ?)`,
      args: [
        params.partner.id,
        params.partner.referralCode,
        params.eventType,
        String(params.eventKey).slice(0, 200),
        params.path ? String(params.path).slice(0, 300) : null,
      ],
    })
    return Boolean((result as any).rowsAffected)
  } catch (err) {
    console.error('[partners] event not recorded:', err)
    return false
  }
}

// ---------------------------------------------------------------------------
// Attributions (one per booking, immutable amounts)
// ---------------------------------------------------------------------------

export interface Attribution {
  id: string
  bookingId: string
  partnerId: string
  source: AttributionSource
  status: AttributionStatus
  originalAmount: number
  discountPct: number
  discountAmount: number
  finalAmount: number
  commissionPct: number
  commissionAmount: number
  currency: string
  refundedAmount: number
}

function mapAttribution(row: any): Attribution | null {
  if (!row) return null
  return {
    id: row.id,
    bookingId: row.booking_id,
    partnerId: row.partner_id,
    source: row.source as AttributionSource,
    status: row.status as AttributionStatus,
    originalAmount: Number(row.original_amount) || 0,
    discountPct: Number(row.discount_pct) || 0,
    discountAmount: Number(row.discount_amount) || 0,
    finalAmount: Number(row.final_amount) || 0,
    commissionPct: Number(row.commission_pct) || 0,
    commissionAmount: Number(row.commission_amount) || 0,
    currency: row.currency || 'MXN',
    refundedAmount: Number(row.refunded_amount) || 0,
  }
}

export async function getAttributionByBooking(bookingId: string): Promise<Attribution | null> {
  await ensurePartnerSchema()
  const result = await turso.execute({
    sql: 'SELECT * FROM booking_attributions WHERE booking_id = ? LIMIT 1',
    args: [bookingId],
  })
  return mapAttribution(result.rows[0])
}

/**
 * Create the immutable financial snapshot for a booking.
 * UNIQUE(booking_id) + INSERT OR IGNORE makes retries idempotent:
 * a duplicate webhook/confirm never creates a second commission row.
 */
export async function createAttribution(params: {
  bookingId: string
  partner: Partner
  source?: AttributionSource
  originalAmount: number
  currency?: string
  status?: AttributionStatus
}): Promise<Attribution | null> {
  await ensurePartnerSchema()
  const discounted = applyDiscount(params.originalAmount, params.partner.guestDiscountPct)
  const commission = calcCommission(discounted.finalAmount, params.partner.commissionPct)
  // Use DB default id; we only need the UNIQUE(booking_id) guarantee.
  try {
    await turso.execute({
      sql: `INSERT OR IGNORE INTO booking_attributions
              (booking_id, partner_id, source, status, original_amount, discount_pct,
               discount_amount, final_amount, commission_pct, commission_amount, currency)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      args: [
        params.bookingId,
        params.partner.id,
        params.source ?? 'PARTNER_LINK',
        params.status ?? 'CONFIRMED',
        discounted.originalAmount,
        discounted.discountPct,
        discounted.discountAmount,
        discounted.finalAmount,
        Number(params.partner.commissionPct) || 0,
        commission,
        params.currency || 'MXN',
      ],
    })
  } catch (err) {
    console.error('[partners] attribution not created:', err)
  }
  // Denormalize onto the booking row for reservation UI (no amounts overwritten).
  try {
    await turso.execute({
      sql: `UPDATE bookings SET partner_id = ?, partner_original_amount = ?,
                 partner_discount_amount = ?, partner_discount_pct = ?, partner_referral_code = ?
            WHERE id = ?`,
      args: [
        params.partner.id,
        discounted.originalAmount,
        discounted.discountAmount,
        discounted.discountPct,
        params.partner.referralCode,
        params.bookingId,
      ],
    })
  } catch {
    // columns may not exist on very old DBs; attribution row still holds truth
  }
  return getAttributionByBooking(params.bookingId)
}

const TRANSITIONS: Record<AttributionStatus, AttributionStatus[]> = {
  PENDING: ['CONFIRMED', 'REVERSED'],
  CONFIRMED: ['PAYABLE', 'REVERSED'],
  PAYABLE: ['PAID', 'REVERSED'],
  PAID: ['REVERSED'],
  REVERSED: [],
}

/**
 * Advance commission lifecycle.
 *  CONFIRMED -> PAYABLE (journey completed)
 *  PAYABLE -> PAID (partner paid)
 *  any -> REVERSED (cancelled/refunded, with reason)
 * Partial refunds: pass refundedAmount while keeping status; commission is
 * adjusted proportionally (amounts snapshot stays immutable except this).
 */
export async function transitionAttribution(params: {
  bookingId: string
  toStatus?: AttributionStatus
  reason?: string | null
  refundedAmount?: number
  eventType?: PartnerEventType
}): Promise<Attribution | null> {
  await ensurePartnerSchema()
  const current = await getAttributionByBooking(params.bookingId)
  if (!current) return null

  let nextStatus = current.status
  if (params.toStatus) {
    const allowed = TRANSITIONS[current.status] || []
    if (!allowed.includes(params.toStatus)) {
      // Invalid transition: keep current, never corrupt history.
      return current
    }
    nextStatus = params.toStatus
  }

  const refunded =
    params.refundedAmount !== undefined
      ? Math.max(0, Number(params.refundedAmount) || 0)
      : current.refundedAmount
  let commission = current.commissionAmount
  if (params.refundedAmount !== undefined && params.refundedAmount > 0) {
    commission = commissionAfterPartialRefund({
      commissionAmount: current.commissionAmount,
      finalAmount: current.finalAmount,
      refundedAmount: refunded,
    })
    // Full refund behaves like a reversal if the trip is void.
    if (refunded >= current.finalAmount && current.finalAmount > 0 && nextStatus !== 'REVERSED') {
      nextStatus = 'REVERSED'
    }
  }

  await turso.execute({
    sql: `UPDATE booking_attributions
          SET status = ?, commission_amount = ?, refunded_amount = ?, reversed_reason = COALESCE(?, reversed_reason)
          WHERE booking_id = ?`,
    args: [nextStatus, commission, refunded, params.reason ?? null, params.bookingId],
  })

  // Server-side lifecycle event (idempotent per booking+type).
  if (params.eventType) {
    try {
      const partner = await turso.execute({
        sql: 'SELECT * FROM partners WHERE id = ? LIMIT 1',
        args: [current.partnerId],
      })
      const p = mapPartner(partner.rows[0])
      if (p) {
        await recordPartnerEvent({
          partner: p,
          eventType: params.eventType,
          eventKey: `${params.bookingId}:${params.eventType}`,
        })
      }
    } catch {
      // non-fatal
    }
  }

  return getAttributionByBooking(params.bookingId)
}

// ---------------------------------------------------------------------------
// Request helper: resolve referrer from body / cookie / header (no PII)
// ---------------------------------------------------------------------------

export function parseCookies(header?: string): Record<string, string> {
  const out: Record<string, string> = {}
  for (const part of (header || '').split(';')) {
    const idx = part.indexOf('=')
    if (idx === -1) continue
    try {
      out[part.slice(0, idx).trim()] = decodeURIComponent(part.slice(idx + 1).trim())
    } catch {
      out[part.slice(0, idx).trim()] = part.slice(idx + 1).trim()
    }
  }
  return out
}

export function referralFromRequest(
  req: any,
  body: any
): { ref: string | null; expiresAt: string | null } {
  const fromBody =
    (typeof body?.referralCode === 'string' && body.referralCode) ||
    (typeof body?.partnerRef === 'string' && body.partnerRef) ||
    (typeof body?.ref === 'string' && body.ref) ||
    null
  const cookies = parseCookies(req?.headers?.cookie as string | undefined)
  const fromCookie = cookies.amaxing_ref || null
  const fromHeader =
    (typeof req?.headers?.['x-partner-ref'] === 'string' && req.headers['x-partner-ref']) || null
  const fromQuery = typeof req?.query?.ref === 'string' ? (req.query.ref as string) : null
  return {
    ref: fromBody || fromQuery || fromHeader || fromCookie,
    expiresAt:
      (typeof body?.referralExpiresAt === 'string' && body.referralExpiresAt) ||
      (typeof body?.expiresAt === 'string' && body.expiresAt) ||
      null,
  }
}

/**
 * Full server-side validation for checkout/booking creation.
 * - Unknown / PAUSED / INACTIVE partners return null (no discount, no error).
 * - Expired referrals (client-supplied expiresAt in the past) return null.
 * - Amounts are never trusted from the client: caller recalculates via
 *   priceForExperience + applyDiscount.
 */
export async function resolvePartnerForRequest(req: any, body: any): Promise<Partner | null> {
  const { ref, expiresAt } = referralFromRequest(req, body)
  if (!ref) return null
  if (expiresAt) {
    const t = new Date(expiresAt).getTime()
    if (Number.isFinite(t) && t < Date.now()) return null
  }
  return resolveActivePartner(ref)
}

// ---------------------------------------------------------------------------
// Admin helpers
// ---------------------------------------------------------------------------

export async function listPartners(): Promise<Partner[]> {
  await ensurePartnerSchema()
  const result = await turso.execute({
    sql: 'SELECT * FROM partners ORDER BY created_at DESC',
    args: [],
  })
  return result.rows.map((r: any) => mapPartner(r)!).filter(Boolean)
}

export async function getPartnerStats(partnerId: string) {
  await ensurePartnerSchema()
  const [events, conversions, commission] = await Promise.all([
    turso.execute({
      sql: 'SELECT event_type, COUNT(*) AS n FROM partner_referral_events WHERE partner_id = ? GROUP BY event_type',
      args: [partnerId],
    }),
    turso.execute({
      sql: 'SELECT COUNT(*) AS n FROM booking_attributions WHERE partner_id = ?',
      args: [partnerId],
    }),
    turso.execute({
      sql: `SELECT status, COUNT(*) AS n, COALESCE(SUM(commission_amount), 0) AS total
            FROM booking_attributions WHERE partner_id = ? GROUP BY status`,
      args: [partnerId],
    }),
  ])
  const byType: Record<string, number> = {}
  for (const row of events.rows as any[]) byType[row.event_type] = Number(row.n) || 0
  const byStatus = (commission.rows as any[]).map((r) => ({
    status: r.status,
    count: Number(r.n) || 0,
    total: Number(r.total) || 0,
  }))
  return {
    events: byType,
    attributedBookings: Number((conversions.rows[0] as any)?.n) || 0,
    byStatus,
    payableTotal: byStatus.filter((s) => s.status === 'PAYABLE').reduce((a, s) => a + s.total, 0),
    paidTotal: byStatus.filter((s) => s.status === 'PAID').reduce((a, s) => a + s.total, 0),
  }
}
