// MIT License - Copyright (c) 2024-2026 Donovan Riaño / Calpulli CDMX - See LICENSE
// /api/tours/categories — Categorías de tours desde Turso (sin Supabase)
import { turso } from '@/lib/turso'

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { rows } = await turso.execute({
      sql: `SELECT id, slug, name_en, name_es, icon_name
            FROM tour_categories
            WHERE "isActive" = 1
            ORDER BY "displayOrder" ASC`,
      args: [],
    })

    const locale = req.query.locale || 'en'
    const categories = rows.map((cat) => ({
      id: cat.id,
      slug: cat.slug,
      name: locale === 'es' ? cat.name_es : cat.name_en,
      icon: cat.icon_name,
    }))

    res.setHeader('Cache-Control', 'public, s-maxage=3600, stale-while-revalidate=86400')
    return res.status(200).json({ categories })
  } catch (err) {
    console.error('[API] tour_categories exception:', err)
    return res.status(500).json({ error: 'Internal server error' })
  }
}
