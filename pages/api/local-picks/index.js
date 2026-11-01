// MIT License - Copyright (c) 2024-2026 Donovan Riaño / Calpulli CDMX - See LICENSE
// GET /api/local-picks?month=YYYY-MM&lang=es|en
// Devuelve los local picks de un mes e idioma desde Turso.
import { getLocalPicks } from '@/lib/localPicksTurso'

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { month, lang } = req.query
  const language = lang === 'es' ? 'es' : 'en'

  try {
    const picks = await getLocalPicks(language)

    // Filtrar por mes si se proporciona
    const filtered = month ? picks.filter((p) => p.month === String(month)) : picks

    // Ordenar por pick_index si existe, sino por fecha
    filtered.sort((a, b) => {
      if (a.pick_index !== null && b.pick_index !== null) {
        return a.pick_index - b.pick_index
      }
      return (a.date || '').localeCompare(b.date || '')
    })

    // Tomar solo los 8 primeros (o menos si no hay más)
    const limited = filtered.slice(0, 8)

    return res.status(200).json({
      picks: limited,
      month: month || null,
      lang: language,
      count: limited.length,
    })
  } catch (error) {
    console.error('Error fetching local picks:', error)
    return res.status(500).json({ error: 'No se pudieron cargar los local picks' })
  }
}
