// MIT License - Copyright (c) 2024-2026 Donovan Riaño / Calpulli CDMX
// Partner public profile — whitelist only. Discount/commission/window/status
// are NEVER updatable here (admin-only). Partial updates allowed.
import { turso } from '@/lib/turso'
import { getPartnerContext, partnerApiError } from '@/lib/partners/authGuard'
import { ensurePartnerAccountSchema } from '@/lib/partners/accounts'
import { isValidWebsiteUrl, isValidLogoUrl } from '@/lib/partners/pricing'

export const config = { runtime: 'nodejs' }

export default async function handler(req, res) {
  try {
    await ensurePartnerAccountSchema()
    if (req.method === 'GET') {
      const ctx = await getPartnerContext(req, {
        requestedPartnerId: typeof req.query.partnerId === 'string' ? req.query.partnerId : null,
        action: 'settings:read',
      })
      return res.status(200).json({ partner: ctx.partner, membership: ctx.membership })
    }
    if (req.method === 'PATCH') {
      const ctx = await getPartnerContext(req, {
        requestedPartnerId: req.body?.partnerId || null,
        action: 'settings:write',
      })
      const body = req.body || {}
      const sets = []
      const args = []
      const push = (col, val) => {
        sets.push(`${col} = ?`)
        args.push(val)
      }
      if (body.name !== undefined) {
        const name = String(body.name).trim().slice(0, 120)
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
      if (body.type !== undefined) {
        const v = String(body.type).trim().toUpperCase().slice(0, 40) || null
        if (v && !['HOTEL', 'HOSTEL', 'HOSTEL', 'BOUTIQUE', 'OTHER'].includes(v)) {
          return res.status(400).json({ error: 'invalid type' })
        }
        push('type', v)
      }
      if (body.contactPerson !== undefined)
        push(
          'contact_person',
          String(body.contactPerson || '')
            .trim()
            .slice(0, 120) || null
        )
      if (body.contactEmail !== undefined) {
        const v = String(body.contactEmail || '')
          .trim()
          .slice(0, 120)
        if (v && !v.includes('@')) return res.status(400).json({ error: 'invalid contactEmail' })
        push('contact_email', v || null)
      }
      if (body.contactPhone !== undefined)
        push(
          'contact_phone',
          String(body.contactPhone || '')
            .trim()
            .slice(0, 40) || null
        )
      if (body.preferredLanguage !== undefined) {
        const v = String(body.preferredLanguage || '')
        if (v && v !== 'es' && v !== 'en')
          return res.status(400).json({ error: 'preferredLanguage must be es|en' })
        push('preferred_language', v || null)
      }
      if (body.notificationPrefs !== undefined) {
        if (typeof body.notificationPrefs !== 'object' || body.notificationPrefs === null) {
          return res.status(400).json({ error: 'notificationPrefs must be an object' })
        }
        push('notification_prefs', JSON.stringify(body.notificationPrefs).slice(0, 2000))
      }
      if (sets.length === 0) return res.status(400).json({ error: 'no fields to update' })
      args.push(ctx.partnerId)
      await turso.execute({ sql: `UPDATE partners SET ${sets.join(', ')} WHERE id = ?`, args })
      return res.status(200).json({ ok: true })
    }
    return res.status(405).json({ error: 'Method not allowed' })
  } catch (err) {
    return partnerApiError(res, err)
  }
}
