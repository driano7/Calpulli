// MIT License - Copyright (c) 2024-2026 Donovan Riaño / Calpulli CDMX
// GET /api/profile/chat-metrics?range=30d
// Socio (admin/employee): agregados globales de chat_questions (qué busca la gente).
// Cliente: solo su propio resumen (sin preguntas de otros).
// Sin PII: top questions redactadas, sin correos/teléfonos.
import { turso } from '@/lib/turso'
import { getSessionUser } from '@/lib/auth'

export const config = { runtime: 'nodejs' }

function bearer(req) {
  const h = req.headers.authorization
  return typeof h === 'string' && h.startsWith('Bearer ') ? h.slice(7).trim() : null
}

function redact(question) {
  return String(question || '')
    .replace(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi, '[correo]')
    .replace(/\+?\d[\d\s\-()]{7,}\d/g, '[teléfono]')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 140)
}

const LABELS = {
  museos: 'Museos',
  comida: 'Comida',
  bares: 'Bares',
  atracciones: 'Atracciones y barrios',
  luchas: 'Luchas',
  journeys: 'Journeys y guías',
  'reservas-precios': 'Reservas y precios',
  'transporte-seguridad': 'Transporte y seguridad',
  'local-mes': 'Local del mes',
  mapas: 'Mapas',
  'museos-comida-bares': 'Museos / comida / bares / atracciones (flujo)',
  buscar: 'Buscar en el sitio',
  'duda-pagina': 'Duda sobre lo que veo',
  'a-medida': 'Journey a la medida',
  general: 'General',
}

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' })
  const actor = await getSessionUser(bearer(req))
  if (!actor) return res.status(401).json({ error: 'Unauthorized' })

  const isStaff = actor.role === 'admin' || actor.role === 'employee'
  const days = Math.min(90, Math.max(7, Number(req.query.range || 30) || 30))
  const from = new Date(Date.now() - days * 86400000).toISOString()

  // Migración best-effort para BDs viejas
  try {
    await turso.execute({ sql: 'ALTER TABLE chat_questions ADD COLUMN topic TEXT' })
  } catch {
    /* ya existe */
  }
  try {
    await turso.execute({ sql: 'ALTER TABLE chat_questions ADD COLUMN suggestion_key TEXT' })
  } catch {
    /* ya existe */
  }

  const where = isStaff
    ? 'datetime(created_at) >= datetime(?)'
    : 'datetime(created_at) >= datetime(?) AND user_id = ?'
  const args = isStaff ? [from] : [from, actor.id]

  try {
    const totalResult = await turso.execute({
      sql: `SELECT COUNT(*) AS total,
                   COUNT(DISTINCT conversation_id) AS conversations,
                   COALESCE(SUM(CASE WHEN filtered IS NOT NULL AND filtered != '' THEN 1 ELSE 0 END), 0) AS filtered
            FROM chat_questions WHERE ${where}`,
      args,
    })
    const byTopicResult = await turso.execute({
      sql: `SELECT COALESCE(NULLIF(topic, ''), 'general') AS topic, COUNT(*) AS n
            FROM chat_questions WHERE ${where}
            GROUP BY topic ORDER BY n DESC LIMIT 15`,
      args,
    })
    const bySuggestionResult = await turso.execute({
      sql: `SELECT COALESCE(NULLIF(suggestion_key, ''), '') AS suggestion_key, COUNT(*) AS n
            FROM chat_questions WHERE ${where} AND suggestion_key IS NOT NULL AND suggestion_key != ''
            GROUP BY suggestion_key ORDER BY n DESC LIMIT 10`,
      args,
    })
    const topResult = await turso.execute({
      sql: `SELECT question, COALESCE(NULLIF(topic, ''), 'general') AS topic, COUNT(*) AS n
            FROM chat_questions WHERE ${where}
            GROUP BY question, topic ORDER BY n DESC, MAX(created_at) DESC LIMIT 10`,
      args,
    })

    const row = totalResult.rows[0] || {}
    return res.status(200).json({
      scope: isStaff ? 'global' : 'mine',
      days,
      total: Number(row.total) || 0,
      conversations: Number(row.conversations) || 0,
      filtered: Number(row.filtered) || 0,
      byTopic: byTopicResult.rows.map((r) => ({
        topic: String(r.topic || 'general'),
        label: LABELS[String(r.topic || 'general')] || String(r.topic || 'general'),
        questions: Number(r.n) || 0,
      })),
      bySuggestion: bySuggestionResult.rows.map((r) => ({
        suggestionKey: String(r.suggestion_key || ''),
        questions: Number(r.n) || 0,
      })),
      // Top questions solo si es staff y solo para métrica global; para
      // cliente solo su propio top (redactado).
      topQuestions: topResult.rows.map((r) => ({
        question: redact(String(r.question || '')),
        topic: String(r.topic || 'general'),
        count: Number(r.n) || 0,
      })),
    })
  } catch (err) {
    console.error('[profile.chat-metrics] error:', err)
    return res.status(500).json({ error: 'Failed to load chat metrics' })
  }
}
