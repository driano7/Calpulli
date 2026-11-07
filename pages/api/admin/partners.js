// MIT License - Copyright (c) 2024-2026 Donovan Riaño / Calpulli CDMX
// Admin-only partner management. Partner users NEVER have access here:
// only role=admin (via getSessionUser) can list/mutate financial data.
import { turso } from '@/lib/turso'
import { getSessionUser, logAccess } from '@/lib/auth'
import {
  ensurePartnerSchema,
  listPartners,
  getPartnerStats,
  resolvePartner,
  createAttribution,
  transitionAttribution,
  getAttributionByBooking,
  isValidWebsiteUrl,
  isValidLogoUrl,
} from '@/lib/partners'
import { normalizeSlug } from '@/lib/partners/pricing'

export const config = { runtime: 'nodejs' }

function bearer(req) {
  const h = req.headers.authorization
  return typeof h === 'string' && h.startsWith('Bearer ') ? h.slice(7).trim() : null
}

async function requireAdmin(req, res) {
  const actor = await getSessionUser(bearer(req))
  if (!actor) {
    res.status(401).json({ error: 'Unauthorized' })
    return null
  }
  if (actor.role !== 'admin') {
    res.status(403).json({ error: 'Forbidden: admin only' })
    return null
  }
  return actor
}

function pct(value, fallback) {
  const n = Number(value)
  if (!Number.isFinite(n)) return fallback
  if (n < 0 || n > 0.9) return null
  return n
}

async function partnerAttributions(partnerId) {
  const result = await turso.execute({
    sql: `SELECT a.*, b.booking_reference
          FROM booking_attributions a
          LEFT JOIN bookings b ON b.id = a.booking_id
          WHERE a.partner_id = ?
          ORDER BY a.created_at DESC
          LIMIT 50`,
    args: [partnerId],
  })
  return result.rows.map((r) => ({
    bookingId: r.booking_id,
    bookingReference: r.booking_reference,
    status: r.status,
    originalAmount: Number(r.original_amount) || 0,
    discountAmount: Number(r.discount_amount) || 0,
    finalAmount: Number(r.final_amount) || 0,
    commissionAmount: Number(r.commission_amount) || 0,
    currency: r.currency,
    source: r.source,
    createdAt: r.created_at,
  }))
}

export default async function handler(req, res) {
  await ensurePartnerSchema()
  const actor = await requireAdmin(req, res)
  if (!actor) return

  try {
    if (req.method === 'GET') {
      const partners = await listPartners()
      const withStats = []
      for (const p of partners) {
        const stats = await getPartnerStats(p.id)
        const attributions = await partnerAttributions(p.id)
        withStats.push({ ...p, stats, attributions })
      }
      return res.status(200).json({ partners: withStats })
    }

    if (req.method === 'POST') {
      const body = req.body || {}

      // Manual attribution: attach a booking to a partner (admin only).
      if (body.action === 'attribute') {
        const bookingId = typeof body.bookingId === 'string' ? body.bookingId.trim() : ''
        const ref = body.partnerRef || body.referralCode || body.slug
        if (!bookingId || !ref) {
          return res.status(400).json({ error: 'bookingId and partnerRef required' })
        }
        const partner = await resolvePartner(ref)
        if (!partner) return res.status(404).json({ error: 'Partner not found' })
        const existing = await getAttributionByBooking(bookingId)
        if (existing) return res.status(409).json({ error: 'Booking already attributed' })
        const booking = await turso.execute({
          sql: 'SELECT * FROM bookings WHERE id = ? LIMIT 1',
          args: [bookingId],
        })
        const b = booking.rows[0]
        if (!b) return res.status(404).json({ error: 'Booking not found' })
        const original = Number(b.total_amount) || 0
        const attribution = await createAttribution({
          bookingId,
          partner,
          source: 'MANUAL',
          originalAmount: original,
          currency: b.currency || 'MXN',
          status: b.payment_status === 'paid' ? 'CONFIRMED' : 'PENDING',
        })
        await logAccess({
          actorId: actor.id,
          actorEmail: actor.email,
          actorRole: actor.role,
          action: 'partner_manual_attribute',
          targetEmail: partner.referralCode,
          details: { bookingId },
        })
        return res.status(201).json({ attribution })
      }

      // Lifecycle transition: confirm / payable / pay / reverse
      if (body.action === 'transition') {
        const bookingId = typeof body.bookingId === 'string' ? body.bookingId.trim() : ''
        const toStatus = typeof body.toStatus === 'string' ? body.toStatus.toUpperCase() : ''
        const reason = typeof body.reason === 'string' ? body.reason.slice(0, 500) : null
        const refundedAmount =
          body.refundedAmount !== undefined ? Number(body.refundedAmount) : undefined
        if (!bookingId || !['CONFIRMED', 'PAYABLE', 'PAID', 'REVERSED'].includes(toStatus)) {
          return res
            .status(400)
            .json({ error: 'bookingId and toStatus (CONFIRMED|PAYABLE|PAID|REVERSED) required' })
        }
        const eventType =
          toStatus === 'PAYABLE'
            ? 'JOURNEY_COMPLETED'
            : toStatus === 'REVERSED'
            ? refundedAmount && refundedAmount > 0
              ? 'BOOKING_REFUNDED'
              : 'BOOKING_CANCELLED'
            : toStatus === 'CONFIRMED'
            ? 'BOOKING_CONFIRMED'
            : undefined
        const attribution = await transitionAttribution({
          bookingId,
          toStatus,
          reason,
          refundedAmount,
          eventType,
        })
        if (!attribution) return res.status(404).json({ error: 'No attribution for booking' })
        await logAccess({
          actorId: actor.id,
          actorEmail: actor.email,
          actorRole: actor.role,
          action: 'partner_attribution_transition',
          targetEmail: bookingId,
          details: { toStatus, reason, refundedAmount },
        })
        return res.status(200).json({ attribution })
      }

      // Create partner
      const slug = normalizeSlug(body.slug)
      const name = typeof body.name === 'string' ? body.name.trim() : ''
      if (!slug || !name) return res.status(400).json({ error: 'slug and name required' })
      const referralCode = normalizeSlug(body.referralCode || slug)
      const websiteUrl = body.websiteUrl ? String(body.websiteUrl).trim() : null
      const logoUrl = body.logoUrl ? String(body.logoUrl).trim() : null
      if (websiteUrl && !isValidWebsiteUrl(websiteUrl)) {
        return res.status(400).json({ error: 'websiteUrl must be http(s)' })
      }
      if (logoUrl && !isValidLogoUrl(logoUrl)) {
        return res.status(400).json({ error: 'logoUrl must be http(s) or site-relative' })
      }
      const guestDiscountPct =
        body.guestDiscountPct !== undefined ? pct(body.guestDiscountPct, 0.1) : 0.1
      const commissionPct = body.commissionPct !== undefined ? pct(body.commissionPct, 0.1) : 0.1
      if (guestDiscountPct === null || commissionPct === null) {
        return res
          .status(400)
          .json({ error: 'discount/commission must be 0–0.9 (e.g. 0.10 = 10%)' })
      }
      const attributionDays = body.attributionDays !== undefined ? Number(body.attributionDays) : 30
      if (!Number.isInteger(attributionDays) || attributionDays < 1 || attributionDays > 365) {
        return res.status(400).json({ error: 'attributionDays must be 1–365' })
      }
      const status = String(body.status || 'ACTIVE').toUpperCase()
      if (!['ACTIVE', 'PAUSED', 'INACTIVE'].includes(status)) {
        return res.status(400).json({ error: 'status must be ACTIVE|PAUSED|INACTIVE' })
      }
      try {
        await turso.execute({
          sql: `INSERT INTO partners (slug, referral_code, name, website_url, logo_url, status, guest_discount_pct, commission_pct, attribution_days)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          args: [
            slug,
            referralCode,
            name,
            websiteUrl,
            logoUrl,
            status,
            guestDiscountPct,
            commissionPct,
            attributionDays,
          ],
        })
      } catch (err) {
        const msg = String(err?.message || '')
        if (msg.toUpperCase().includes('UNIQUE')) {
          return res.status(409).json({ error: 'slug or referralCode already exists' })
        }
        throw err
      }
      await logAccess({
        actorId: actor.id,
        actorEmail: actor.email,
        actorRole: actor.role,
        action: 'partner_create',
        targetEmail: referralCode,
        details: { slug, name },
      })
      const created = await resolvePartner(slug)
      return res.status(201).json({ partner: created })
    }

    if (req.method === 'PATCH') {
      const body = req.body || {}
      const ref = body.slug || body.referralCode || body.id
      if (!ref) return res.status(400).json({ error: 'slug/referralCode/id required' })
      const existing = await resolvePartner(ref).then(async (p) => {
        if (p) return p
        const byId = await turso.execute({
          sql: 'SELECT * FROM partners WHERE id = ? LIMIT 1',
          args: [String(ref)],
        })
        const r = byId.rows[0]
        return r
          ? {
              id: r.id,
              slug: r.slug,
              referralCode: r.referral_code,
              name: r.name,
              websiteUrl: r.website_url,
              logoUrl: r.logo_url,
              status: r.status,
              guestDiscountPct: r.guest_discount_pct,
              commissionPct: r.commission_pct,
              attributionDays: r.attribution_days,
            }
          : null
      })
      if (!existing) return res.status(404).json({ error: 'Partner not found' })

      const sets = []
      const args = []
      const push = (col, val) => {
        sets.push(`${col} = ?`)
        args.push(val)
      }
      if (body.name !== undefined) {
        const name = String(body.name).trim()
        if (!name) return res.status(400).json({ error: 'name cannot be empty' })
        push('name', name)
      }
      if (body.websiteUrl !== undefined) {
        const v = body.websiteUrl ? String(body.websiteUrl).trim() : null
        if (v && !isValidWebsiteUrl(v))
          return res.status(400).json({ error: 'websiteUrl must be http(s)' })
        push('website_url', v || null)
      }
      if (body.logoUrl !== undefined) {
        const v = body.logoUrl ? String(body.logoUrl).trim() : null
        if (v && !isValidLogoUrl(v))
          return res.status(400).json({ error: 'logoUrl must be http(s) or site-relative' })
        push('logo_url', v || null)
      }
      if (body.status !== undefined) {
        const s = String(body.status).toUpperCase()
        if (!['ACTIVE', 'PAUSED', 'INACTIVE'].includes(s))
          return res.status(400).json({ error: 'invalid status' })
        push('status', s)
      }
      if (body.guestDiscountPct !== undefined) {
        const v = pct(body.guestDiscountPct, null)
        if (v === null) return res.status(400).json({ error: 'guestDiscountPct must be 0–0.9' })
        push('guest_discount_pct', v)
      }
      if (body.commissionPct !== undefined) {
        const v = pct(body.commissionPct, null)
        if (v === null) return res.status(400).json({ error: 'commissionPct must be 0–0.9' })
        push('commission_pct', v)
      }
      if (body.attributionDays !== undefined) {
        const v = Number(body.attributionDays)
        if (!Number.isInteger(v) || v < 1 || v > 365)
          return res.status(400).json({ error: 'attributionDays must be 1–365' })
        push('attribution_days', v)
      }
      if (sets.length === 0) return res.status(400).json({ error: 'no fields to update' })
      args.push(existing.id)
      await turso.execute({ sql: `UPDATE partners SET ${sets.join(', ')} WHERE id = ?`, args })
      await logAccess({
        actorId: actor.id,
        actorEmail: actor.email,
        actorRole: actor.role,
        action: 'partner_update',
        targetEmail: existing.referralCode,
        details: { fields: Object.keys(body) },
      })
      return res.status(200).json({ partner: await resolvePartner(existing.slug) })
    }

    return res.status(405).json({ error: 'Method not allowed' })
  } catch (err) {
    console.error('[admin.partners] error:', err)
    return res.status(500).json({ error: 'Failed to process partners' })
  }
}
