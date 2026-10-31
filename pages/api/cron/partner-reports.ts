// MIT License - Copyright (c) 2024-2026 Donovan Riaño / Calpulli CDMX - See LICENSE
// GET|POST /api/cron/partner-reports
//
// Endpoint dedicado para pruebas manuales o para planes de Vercel con más
// crons. En Hobby el cron diario real es /api/cron/booking-reminders, que
// también dispara los reportes para no exceder el límite de crons.
import type { NextApiRequest, NextApiResponse } from 'next'
import { runPartnerReports } from '@/lib/reports/cron'

function first(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value
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

  try {
    const run = await runPartnerReports({ requested: first(req.query.type) })
    return res.status(200).json({ success: true, ...run })
  } catch (error) {
    console.error('Partner reports cron failed:', error)
    return res.status(500).json({ error: 'No se pudieron generar los reportes' })
  }
}
