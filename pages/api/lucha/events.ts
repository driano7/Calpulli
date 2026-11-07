// MIT License - Copyright (c) 2024-2026 Donovan Riaño / Calpulli CDMX - See LICENSE
import type { NextApiRequest, NextApiResponse } from 'next'
import {
  getLuchaEvents,
  getLuchaEventsByWeek,
  initLuchaEventsTable,
  upsertLuchaEvent,
} from '@/lib/db/schema'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    await initLuchaEventsTable()
    const { arena, byWeek, from, to } = req.query

    let events = await getLuchaEvents(
      arena as 'mexico' | 'coliseo' | undefined,
      from as string | undefined,
      to as string | undefined
    )

    // Tabla vacía (deploy nuevo o Turso recién creado): semilla estática
    // CMLL para que el checkout de Luchas tenga fechas sin esperar al cron.
    if (events.length === 0) {
      try {
        const { getStaticEvents } = await import('@/scripts/scrapers/lucha-scraper')
        const seed = getStaticEvents()
        for (const event of seed) {
          try {
            await upsertLuchaEvent(event as any)
          } catch {
            /* una fila mala no tumba la semilla */
          }
        }
        events = await getLuchaEvents(
          arena as 'mexico' | 'coliseo' | undefined,
          from as string | undefined,
          to as string | undefined
        )
      } catch (seedError) {
        console.error('Lucha seed fallback failed:', seedError)
      }
    }

    if (byWeek === 'true') {
      const weeks = await getLuchaEventsByWeek()
      return res.status(200).json({ weeks })
    }

    return res.status(200).json({ events })
  } catch (error) {
    console.error('Error fetching lucha events:', error)
    // Nunca 404 por "no such table": tabla migrada en init; si falla Turso
    // devolvemos [] para que el checkout no bloquee (fallback fecha libre).
    if ((error as Error)?.message?.includes('TURSO_URL')) {
      return res.status(200).json({ events: [], weeks: { mexico: [], coliseo: [] } })
    }
    return res.status(200).json({ events: [], weeks: { mexico: [], coliseo: [] } })
  }
}
