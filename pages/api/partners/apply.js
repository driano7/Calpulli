// MIT License - Copyright (c) 2024-2026 Donovan Riaño / Calpulli CDMX
// POST /api/partners/apply — public partnership application (no account).
// Rate-limited by Turbo's standard checks in caller; validation here.
import { turso } from '@/lib/turso'
import { ensurePartnerAccountSchema } from '@/lib/partners/accounts'

export const config = { runtime: 'nodejs' }

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })
  await ensurePartnerAccountSchema()
  const body = req.body || {}
  const business = String(body.businessName || '')
    .trim()
    .slice(0, 120)
  const email = String(body.email || '')
    .trim()
    .toLowerCase()
    .slice(0, 120)
  if (!business || !email.includes('@')) {
    return res.status(400).json({ error: 'businessName and valid email required' })
  }
  try {
    await turso.execute({
      sql: `INSERT INTO partner_applications (business_name, type, contact_person, email, phone, city, message)
            VALUES (?, ?, ?, ?, ?, ?, ?)`,
      args: [
        business,
        body.type ? String(body.type).trim().toUpperCase().slice(0, 40) : null,
        body.contactPerson ? String(body.contactPerson).trim().slice(0, 120) : null,
        email,
        body.phone ? String(body.phone).trim().slice(0, 40) : null,
        body.city ? String(body.city).trim().slice(0, 80) : null,
        body.message ? String(body.message).trim().slice(0, 1000) : null,
      ],
    })
    return res.status(201).json({ ok: true })
  } catch (err) {
    console.error('[partners.apply] error:', err)
    return res.status(500).json({ error: 'Failed to submit application' })
  }
}
