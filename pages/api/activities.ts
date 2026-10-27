import type { NextApiRequest, NextApiResponse } from 'next'
import { JOURNEYS } from '@/data/journeysData'

/**
 * Endpoint que devuelve las actividades disponibles (journeys)
 * para usarse en un dropdown de búsqueda de reservas.
 *
 * Cada actividad incluye: id, tipo (journey), title_es, title_en,
 * imageUrl (foto principal), price, currency.
 */

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { locale = 'es' } = req.query
  const isEs = locale === 'es'

  const activityJourneys = JOURNEYS.map((j) => ({
    id: j.id,
    type: 'journey',
    title: isEs ? j.title_es : j.title_en,
    imageUrl: j.heroImage || '/static/images/jaguarBaja.png',
    price: j.price,
    currency: 'MXN',
    duration: null,
    maxGuests: null,
  }))

  const activities = activityJourneys

  return res.status(200).json({ activities })
}
