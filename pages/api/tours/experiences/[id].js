// MIT License - Copyright (c) 2024-2026 Donovan Riaño / Calpulli CDMX - See LICENSE
// /api/tours/experiences/[id] — Detalle de experiencia desde Turso (sin Supabase)
// La distribución de ratings reemplaza al RPC get_experience_rating de
// Supabase con un GROUP BY sobre la tabla reviews de Turso.
import { turso } from '@/lib/turso'

function parseHighlights(value) {
  if (Array.isArray(value)) return value
  if (typeof value === 'string' && value.trim()) {
    try {
      const parsed = JSON.parse(value)
      return Array.isArray(parsed) ? parsed : [value]
    } catch {
      return [value]
    }
  }
  return []
}

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { id } = req.query
    const locale = req.query.locale || 'en'

    if (!id) {
      return res.status(400).json({ error: 'Experience ID required' })
    }

    const { rows } = await turso.execute({
      sql: `SELECT e.id, e.title_en, e.title_es, e.description_en, e.description_es,
                   e.price, e.duration_hours, e.max_guests, e.image_url,
                   e.location_en, e.location_es, e.highlights_en, e.highlights_es,
                   e."isFeatured", e.category_id, e."createdAt",
                   c.id AS cat_id, c.slug AS cat_slug, c.name_en AS cat_name_en,
                   c.name_es AS cat_name_es, c.icon_name AS cat_icon
            FROM experiences e
            JOIN tour_categories c ON c.id = e.category_id
            WHERE e.id = ? AND e."isActive" = 1`,
      args: [String(id)],
    })

    const data = rows[0]
    if (!data) {
      return res.status(404).json({ error: 'Experience not found' })
    }

    // Distribución de ratings + promedio + conteo desde reviews publicadas
    const { rows: ratingRows } = await turso.execute({
      sql: `SELECT rating, COUNT(*) AS n
            FROM reviews
            WHERE experience_id = ? AND "isPublished" = 1
            GROUP BY rating`,
      args: [String(id)],
    })

    const ratingDistribution = {}
    let reviewCount = 0
    let ratingSum = 0
    for (const row of ratingRows) {
      const n = Number(row.n) || 0
      ratingDistribution[String(row.rating)] = n
      reviewCount += n
      ratingSum += Number(row.rating) * n
    }
    const avgRating = reviewCount > 0 ? ratingSum / reviewCount : 0

    const experience = {
      id: data.id,
      title: locale === 'es' ? data.title_es : data.title_en,
      description: locale === 'es' ? data.description_es : data.description_en,
      price: Number(data.price),
      duration: data.duration_hours,
      maxGuests: data.max_guests,
      imageUrl: data.image_url,
      location: locale === 'es' ? data.location_es : data.location_en,
      highlights: parseHighlights(locale === 'es' ? data.highlights_es : data.highlights_en),
      isFeatured: Number(data.isFeatured) === 1,
      avgRating,
      reviewCount,
      ratingDistribution,
      category: data.cat_slug
        ? {
            id: data.cat_id,
            slug: data.cat_slug,
            name: locale === 'es' ? data.cat_name_es : data.cat_name_en,
            icon: data.cat_icon,
          }
        : null,
      createdAt: data.createdAt,
    }

    res.setHeader('Cache-Control', 'public, s-maxage=300, stale-while-revalidate=600')
    return res.status(200).json({ experience })
  } catch (err) {
    console.error('[API] experience detail exception:', err)
    return res.status(500).json({ error: 'Internal server error' })
  }
}
