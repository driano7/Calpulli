// MIT License - Copyright (c) 2024-2026 Donovan Riaño / Calpulli CDMX - See LICENSE
/**
 * Recordatorio de tours.
 *
 * Corre una vez al día y avisa a quien tiene un tour mañana. La fecha se
 * calcula en horario de Ciudad de México (America/Mexico_City), no en UTC:
 * un tour del 2 de noviembre a las 19:30 debe recordarse el 1 de noviembre,
 * sin importar la hora del servidor.
 *
 * Es idempotente por el control de duplicados del servicio de correo: si el
 * cron se reintenta dentro de la ventana, no se vuelve a enviar el aviso.
 */
import type { NextApiRequest, NextApiResponse } from 'next'
import { turso } from '@/lib/turso'
import { trySend } from '@/lib/mail/service'

const MEXICO_TZ = 'America/Mexico_City'

/** Fecha de hoy (o de mañana) en Ciudad de México, como YYYY-MM-DD. */
function mexicoDate(offsetDays = 0): string {
  const today = new Intl.DateTimeFormat('en-CA', {
    timeZone: MEXICO_TZ,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date())

  const [year, month, day] = today.split('-').map(Number)
  const date = new Date(Date.UTC(year, month - 1, day + offsetDays))
  return date.toISOString().slice(0, 10)
}

/** "martes 3 de noviembre", para que el correo no muestre un ISO crudo. */
function humanDate(isoDate: string): string {
  try {
    return new Intl.DateTimeFormat('es-MX', {
      timeZone: MEXICO_TZ,
      weekday: 'long',
      day: 'numeric',
      month: 'long',
    }).format(new Date(`${isoDate}T12:00:00-06:00`))
  } catch {
    return isoDate
  }
}

function escapeHtml(value: unknown): string {
  return String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const authHeader = req.headers.authorization
  const cronSecret = process.env.CRON_SECRET
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return res.status(401).json({ error: 'Unauthorized' })
  }

  if (req.method !== 'POST' && req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const tomorrow = mexicoDate(1)

  try {
    const result = await turso.execute({
      sql: `SELECT b.booking_reference, b.customer_name, b.customer_email,
                   b.start_date, b.start_time, b.user_id,
                   u.email AS user_email,
                   COALESCE(e.title_es, e.title_en) AS title,
                   COALESCE(e.location_es, e.location_en) AS location
            FROM bookings b
            JOIN experiences e ON e.id = b.experience_id
            LEFT JOIN users u ON u.id = b.user_id
            WHERE substr(b.start_date, 1, 10) = ?
              AND b.status NOT IN ('cancelled', 'completed', 'no_show')
              AND b.checked_in_at IS NULL
            ORDER BY b.start_time ASC`,
      args: [tomorrow],
    })

    let sent = 0
    let skipped = 0

    for (const raw of result.rows) {
      const row: any = raw
      const email = row.user_email || row.customer_email
      if (!email) {
        skipped++
        continue
      }

      const startDate = String(row.start_date || tomorrow).slice(0, 10)
      await trySend('booking_reminder', email, row.user_id || null, {
        firstName: escapeHtml(String(row.customer_name || '').split(' ')[0] || 'viajera'),
        experienceTitle: escapeHtml(row.title || 'Tu tour'),
        startDate: humanDate(startDate),
        startTime: row.start_time || '10:00',
        meetingPoint: escapeHtml(row.location || 'Te lo confirmamos por WhatsApp'),
      })
      sent++
    }

    console.log(`⏰ Recordatorios ${tomorrow}: ${sent} enviados, ${skipped} sin correo`)
    return res.status(200).json({ success: true, date: tomorrow, sent, skipped })
  } catch (error) {
    console.error('Booking reminders cron failed:', error)
    return res.status(500).json({ error: 'No se pudieron enviar los recordatorios' })
  }
}
