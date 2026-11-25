// MIT License - Copyright (c) 2024-2026 Donovan Riaño / Calpulli CDMX - See LICENSE
// GET  /api/admin/email-templates — lista plantillas + bitácora de envíos
// POST /api/admin/email-templates — guarda asunto/html/texto de una plantilla
// POST con action=sends_test -> envía una prueba al admin
import { getSessionUser } from '@/lib/auth'
import { turso } from '@/lib/turso'
import { extractVariables, listTemplates, resetTemplate, sendMail } from '@/lib/mail/service'

export default async function handler(req, res) {
  const header = req.headers.authorization
  const token = header?.startsWith('Bearer ') ? header.slice(7) : null
  if (!token) return res.status(401).json({ error: 'Unauthorized' })

  const actor = await getSessionUser(token)
  if (!actor) return res.status(401).json({ error: 'Unauthorized' })
  if (actor.role !== 'admin') return res.status(403).json({ error: 'Solo un admin' })

  try {
    if (req.method === 'GET') {
      const templates = await listTemplates()
      const log = await turso.execute({
        sql: `SELECT id, template_key, to_email, subject, status, error, sent_at, created_at
              FROM email_log ORDER BY created_at DESC LIMIT 50`,
        args: [],
      })
      const stats = await turso.execute({
        sql: `SELECT status, COUNT(*) AS n FROM email_log GROUP BY status`,
        args: [],
      })

      return res.status(200).json({
        templates: templates.map((t) => ({ ...t, usedVariables: extractVariables(t.html) })),
        recent: log.rows,
        stats: Object.fromEntries(stats.rows.map((r) => [r.status, Number(r.n)])),
      })
    }

    if (req.method === 'POST') {
      const { key, action, locale } = req.body ?? {}

      if (action === 'reset') {
        if (!key) return res.status(400).json({ error: 'key requerido' })
        const template = await resetTemplate(String(key), locale === 'en' ? 'en' : 'es', actor.id)
        if (!template) return res.status(404).json({ error: 'Plantilla no encontrada' })
        return res.status(200).json({
          success: true,
          template: { ...template, usedVariables: extractVariables(template.html) },
        })
      }

      if (action === 'send_test') {
        const result = await sendMail(key, {
          to: actor.email,
          userId: actor.id,
          locale: locale === 'en' ? 'en' : 'es',
          vars: {
            firstName: 'Prueba',
            siteUrl: process.env.NEXT_PUBLIC_SITE_URL || 'https://donovan-amx.vercel.app',
            bookingReference: 'CDMX-TEST01',
            experienceTitle: 'Centro Histórico — El futuro se pintó aquí',
            startDate: '15 de septiembre',
            startTime: '10:00',
            guests: 2,
            total: 100,
            currency: 'MXN',
            meetingPoint: 'Palacio de Bellas Artes / Eje Central',
            ticketUrl: `${process.env.NEXT_PUBLIC_SITE_URL || ''}/profile`,
            whatsappUrl: 'https://wa.me/525512291607',
            referralCode: 'CALP-TEST',
            resetUrl: 'https://ejemplo.com/reset',
            expiresMinutes: 30,
          },
        })
        return res.status(200).json(result)
      }

      if (!key) return res.status(400).json({ error: 'key requerido' })

      const { subject, html, text, isActive, label, description } = req.body

      const sets = []
      const args = []
      if (subject !== undefined) {
        sets.push('subject = ?')
        args.push(String(subject).slice(0, 300))
      }
      if (html !== undefined) {
        sets.push('html = ?')
        args.push(String(html))
      }
      if (text !== undefined) {
        sets.push('text = ?')
        args.push(String(text))
      }
      if (label !== undefined) {
        sets.push('label = ?')
        args.push(String(label).slice(0, 120))
      }
      if (description !== undefined) {
        sets.push('description = ?')
        args.push(String(description).slice(0, 300))
      }
      if (isActive !== undefined) {
        sets.push('is_active = ?')
        args.push(isActive ? 1 : 0)
      }
      if (!sets.length) return res.status(400).json({ error: 'Nada que actualizar' })

      sets.push('updated_by = ?')
      args.push(actor.id, key)

      await turso.execute({
        sql: `UPDATE email_templates SET ${sets.join(', ')} WHERE key = ?`,
        args,
      })

      return res.status(200).json({ success: true, key })
    }

    return res.status(405).json({ error: 'Method not allowed' })
  } catch (error) {
    console.error('Email templates error:', error)
    return res.status(500).json({ error: 'Failed to process templates' })
  }
}
