// MIT License - Copyright (c) 2024-2026 Donovan Riaño / Calpulli CDMX
// Partner dashboard insights: qué pregunta la gente al asistente (agregado
// global, sin PII: las preguntas se redactan igual que en los reportes) y
// qué demanda NO está capturando este socio con su link/QR.
import { turso } from '../turso'
import { CHAT_TOPIC_LABELS, redactChatQuestion } from '../reports/queries'
import type { DateRange } from './analytics'

export interface ChatTopicCount {
  key: string
  label: string
  count: number
}

export interface ChatTopQuestion {
  question: string
  topic: string
  count: number
}

export interface MissedDemand {
  slug: string
  name: string
  /** Preguntas al asistente hechas desde la página de este journey. */
  questions: number
  /** Veces que el tráfico de ESTE socio vio la página del journey. */
  partnerViews: number
  action: string
}

export interface PartnerInsights {
  range: { from: string; to: string }
  chat: {
    totalQuestions: number
    byTopic: ChatTopicCount[]
    topQuestions: ChatTopQuestion[]
  }
  missedDemand: MissedDemand[]
}

/** Catálogo vendible hoy (los 6 journeys reales, no el mock). */
const JOURNEYS: { slug: string; name: string }[] = [
  { slug: 'centro', name: 'Centro Histórico' },
  { slug: 'roma', name: 'Roma–Condesa' },
  { slug: 'luchas', name: 'Lucha Libre' },
  { slug: 'chapultepec', name: 'Chapultepec' },
  { slug: 'jamaica', name: 'Mercado de Jamaica' },
  { slug: 'antropologia', name: 'Museo de Antropología' },
]

/** Demanda mínima para considerar que un journey "se está buscando". */
const MIN_QUESTIONS = 3

function slugFromJourneyPath(path: string): string | null {
  const m = String(path || '').match(/\/journeys\/([a-z0-9-]+)/i)
  return m ? m[1].toLowerCase() : null
}

export async function getInsights(partnerId: string, range: DateRange): Promise<PartnerInsights> {
  const [totalRes, byTopicRes, topRes, byPathRes, partnerViewsRes] = await Promise.all([
    turso.execute({
      sql: `SELECT COUNT(*) AS n FROM chat_questions
            WHERE created_at >= ? AND created_at < ?`,
      args: [range.from, range.to],
    }),
    turso.execute({
      sql: `SELECT COALESCE(NULLIF(topic,''),'general') AS topic, COUNT(*) AS n
            FROM chat_questions
            WHERE created_at >= ? AND created_at < ?
            GROUP BY topic ORDER BY n DESC LIMIT 8`,
      args: [range.from, range.to],
    }),
    turso.execute({
      sql: `SELECT question, COALESCE(NULLIF(topic,''),'general') AS topic, COUNT(*) AS n
            FROM chat_questions
            WHERE created_at >= ? AND created_at < ?
            GROUP BY question ORDER BY n DESC, MAX(created_at) DESC LIMIT 10`,
      args: [range.from, range.to],
    }),
    turso.execute({
      sql: `SELECT path, COUNT(*) AS n FROM chat_questions
            WHERE created_at >= ? AND created_at < ? AND path LIKE '/journeys/%'
            GROUP BY path`,
      args: [range.from, range.to],
    }),
    turso.execute({
      sql: `SELECT path, COUNT(*) AS n FROM partner_referral_events
            WHERE partner_id = ? AND event_type = 'JOURNEY_VIEW'
              AND created_at >= ? AND created_at < ? AND path IS NOT NULL
            GROUP BY path`,
      args: [partnerId, range.from, range.to],
    }),
  ])

  const byTopic: ChatTopicCount[] = (byTopicRes.rows as any[]).map((r) => {
    const key = String(r.topic || 'general')
    return { key, label: CHAT_TOPIC_LABELS[key] || key, count: Number(r.n) || 0 }
  })

  const topQuestions: ChatTopQuestion[] = (topRes.rows as any[]).map((r) => ({
    question: redactChatQuestion(String(r.question || '')),
    topic: String(r.topic || 'general'),
    count: Number(r.n) || 0,
  }))

  const demandBySlug = new Map<string, number>()
  for (const r of byPathRes.rows as any[]) {
    const slug = slugFromJourneyPath(String(r.path || ''))
    if (slug) demandBySlug.set(slug, (demandBySlug.get(slug) || 0) + (Number(r.n) || 0))
  }

  const viewsBySlug = new Map<string, number>()
  for (const r of partnerViewsRes.rows as any[]) {
    const slug = slugFromJourneyPath(String(r.path || ''))
    if (slug) viewsBySlug.set(slug, (viewsBySlug.get(slug) || 0) + (Number(r.n) || 0))
  }

  const missedDemand: MissedDemand[] = JOURNEYS.map((j) => {
    const questions = demandBySlug.get(j.slug) || 0
    const partnerViews = viewsBySlug.get(j.slug) || 0
    return { slug: j.slug, name: j.name, questions, partnerViews, action: '' }
  })
    .filter((d) => d.questions >= MIN_QUESTIONS && d.partnerViews === 0)
    .sort((a, b) => b.questions - a.questions)
    .slice(0, 3)
    .map((d) => ({
      ...d,
      action:
        `La gente preguntó ${d.questions} veces al asistente desde la página de ${d.name} ` +
        `y por tu link no ha llegado nadie a verla. Pon el QR de ${d.name} en recepción ` +
        `o en las habitaciones: se genera en Materiales.`,
    }))

  return {
    range: { from: range.from, to: range.to },
    chat: {
      totalQuestions: Number((totalRes.rows[0] as any)?.n) || 0,
      byTopic,
      topQuestions,
    },
    missedDemand,
  }
}
