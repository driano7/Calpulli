/**
 * Calpulli CDMX — lib/news-generators/tursoNewsStore.js (CommonJS)
 * Persistencia de notas generadas en Turso (tabla news_notes, ver
 * turso-schema.sql). Reemplaza al antiguo store de Supabase.
 * Usado por el cron de Vercel (/api/news/sync) y por el script local,
 * que en serverless no pueden escribir en data/notes (filesystem read-only).
 */
const { createClient } = require('@libsql/client')

function getTursoUrl() {
  return process.env.TURSO_URL || process.env.TURSO_DATABASE_URL || ''
}

function getTursoToken() {
  return process.env.TURSO_API_KEY || process.env.TURSO_AUTH_TOKEN || ''
}

let cachedClient = null

function client() {
  if (cachedClient) return cachedClient
  cachedClient = createClient({ url: getTursoUrl(), authToken: getTursoToken() || undefined })
  return cachedClient
}

function isConfigured() {
  const url = getTursoUrl()
  return typeof url === 'string' && url.length > 0 && !url.includes('your_')
}

function parseJsonList(value) {
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

/**
 * Upsert de una nota (una por locale) en la tabla news_notes.
 * @param {{ slug: string, locale: string, title: string, date: string,
 *           summary: string, tags: string[], image: string, category: string,
 *           sourceUrl: string, body: string }} note
 */
async function upsertNote(note) {
  if (!isConfigured()) return { ok: false, error: 'turso not configured' }

  try {
    await client().execute({
      sql: `INSERT INTO news_notes
              (slug, locale, title, date, published, summary, tags, image, images, category, source_url, body)
            VALUES (?, ?, ?, ?, 1, ?, ?, ?, ?, ?, ?, ?)
            ON CONFLICT(slug, locale) DO UPDATE SET
              title = excluded.title,
              date = excluded.date,
              published = 1,
              summary = excluded.summary,
              tags = excluded.tags,
              image = excluded.image,
              images = excluded.images,
              category = excluded.category,
              source_url = excluded.source_url,
              body = excluded.body`,
      args: [
        note.slug,
        note.locale,
        note.title,
        note.date,
        note.summary || '',
        JSON.stringify(note.tags || []),
        note.image || '',
        JSON.stringify([note.image].filter(Boolean)),
        note.category || 'Tourism',
        note.sourceUrl || '',
        note.body || '',
      ],
    })

    const { rows } = await client().execute({
      sql: 'SELECT id FROM news_notes WHERE slug = ? AND locale = ?',
      args: [note.slug, note.locale],
    })

    return { ok: true, id: rows[0]?.id }
  } catch (e) {
    return { ok: false, error: e.message }
  }
}

/**
 * Lee las notas guardadas en Turso para un locale.
 * @returns {Promise<Array<object>>} notas con frontmatter, ordenadas por fecha desc.
 */
async function getNotes(locale = 'en') {
  if (!isConfigured()) return []

  try {
    const { rows } = await client().execute({
      sql: `SELECT * FROM news_notes
            WHERE locale = ? AND published = 1
            ORDER BY date DESC`,
      args: [locale],
    })

    return rows.map((row) => ({
      slug: row.slug,
      title: row.title,
      date: row.date,
      summary: row.summary,
      tags: parseJsonList(row.tags),
      image: row.image,
      images: parseJsonList(row.images).length
        ? parseJsonList(row.images)
        : row.image
          ? [row.image]
          : [],
      category: row.category,
      sourceUrl: row.source_url,
      lang: row.locale,
    }))
  } catch {
    return []
  }
}

/** Lee el contenido (body) de una nota por slug + locale. */
async function getNoteBySlug(slug, locale = 'en') {
  if (!isConfigured()) return null

  try {
    const { rows } = await client().execute({
      sql: 'SELECT * FROM news_notes WHERE slug = ? AND locale = ? LIMIT 1',
      args: [slug, locale],
    })

    const data = rows[0]
    if (!data) return null

    const images = parseJsonList(data.images)

    return {
      frontMatter: {
        slug: data.slug,
        title: data.title,
        date: data.date,
        summary: data.summary,
        tags: parseJsonList(data.tags),
        image: data.image,
        images: images.length ? images : data.image ? [data.image] : [],
        category: data.category,
        sourceUrl: data.source_url,
        lang: data.locale,
        published: Number(data.published) === 1,
      },
      content: data.body || '',
    }
  } catch {
    return null
  }
}

module.exports = { upsertNote, getNotes, getNoteBySlug, isConfigured }
