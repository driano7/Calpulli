// MIT License - Copyright (c) 2024-2026 Donovan Riaño / Calpulli CDMX - See LICENSE
// /api/tours/experiences — Experiencias desde Turso (sin Supabase)
// avg_rating / review_count se calculan desde la tabla reviews de Turso;
// highlights_* viven como JSON en texto y se parsean aquí.
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
    const { category, featured, limit, locale } = req.query
    const currentLocale = locale || 'en'

    const conditions = ['e."isActive" = 1']
    const args = []

    if (category) {
      conditions.push('c.slug = ?')
      args.push(String(category))
    }

    if (featured === 'true') {
      conditions.push('e."isFeatured" = 1')
    }

    let sql = `SELECT e.id, e.title_en, e.title_es, e.description_en, e.description_es,
                      e.price, e.duration_hours, e.max_guests, e.image_url,
                      e.location_en, e.location_es, e.highlights_en, e.highlights_es,
                      e."isFeatured", e.category_id,
                      c.slug AS cat_slug, c.name_en AS cat_name_en,
                      c.name_es AS cat_name_es, c.icon_name AS cat_icon,
                      COALESCE(r.avg_rating, 0) AS avg_rating,
                      COALESCE(r.review_count, 0) AS review_count
               FROM experiences e
               JOIN tour_categories c ON c.id = e.category_id
               LEFT JOIN (
                 SELECT experience_id, AVG(rating) AS avg_rating, COUNT(*) AS review_count
                 FROM reviews
                 WHERE "isPublished" = 1
                 GROUP BY experience_id
               ) r ON r.experience_id = e.id
               WHERE ${conditions.join(' AND ')}
               ORDER BY e."createdAt" DESC`

    if (limit) {
      sql += ' LIMIT ?'
      args.push(parseInt(limit, 10))
    }

    const { rows } = await turso.execute({ sql, args })

    const experiences = rows.map((exp) => ({
      id: exp.id,
      title: currentLocale === 'es' ? exp.title_es : exp.title_en,
      description: currentLocale === 'es' ? exp.description_es : exp.description_en,
      price: Number(exp.price),
      duration: exp.duration_hours,
      maxGuests: exp.max_guests,
      imageUrl: exp.image_url,
      location: currentLocale === 'es' ? exp.location_es : exp.location_en,
      highlights: parseHighlights(currentLocale === 'es' ? exp.highlights_es : exp.highlights_en),
      isFeatured: Number(exp.isFeatured) === 1,
      avgRating: Number(exp.avg_rating),
      reviewCount: Number(exp.review_count),
      category: exp.cat_slug
        ? {
            slug: exp.cat_slug,
            name: currentLocale === 'es' ? exp.cat_name_es : exp.cat_name_en,
            icon: exp.cat_icon,
          }
        : null,
    }))

    res.setHeader('Cache-Control', 'public, s-maxage=300, stale-while-revalidate=600')
    return res.status(200).json({ experiences })
  } catch (err) {
    console.error('[API] experiences exception:', err)
    return res.status(500).json({ error: 'Internal server error' })
  }
}
