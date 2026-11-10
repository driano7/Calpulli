// MIT License - Copyright (c) 2024-2026 Donovan Riaño / Calpulli CDMX - See LICENSE
// Consultas reales de Turso para los reportes de socios y equipo.
//
// Reglas:
//   - Nada de datos inventados ni proyecciones.
//   - Los importes se agrupan por moneda; nunca se suman monedas distintas.
//   - Los reportes operativos (employee) no consultan dinero ni PII.
//   - Las fechas se comparan en UTC contra los límites del periodo, que ya
//     vienen calculados en America/Mexico_City.
import { turso } from '@/lib/turso'
import { getOverview } from '@/lib/partners/analytics'
import type { ReportPeriod } from './period'

const num = (value: unknown) => Number(value) || 0

export interface CreatedBookingsSummary {
  bookings: number
  guests: number
  cancelled: number
  paid: number
  pendingPayment: number
}

export interface CurrencyRevenue {
  currency: string
  bookings: number
  amount: number
}

export interface ToursSummary {
  tours: number
  guests: number
  checkedIn: number
  pendingPayment: number
}

export interface ExperienceDemand {
  experience: string
  tours: number
  guests: number
  checkedIn: number
}

export interface ReferralConversion {
  code: string
  name: string
  currency: string
  conversions: number
  amount: number
}

export interface UpcomingTour {
  day: string
  experience: string
  tours: number
  guests: number
}

export interface DayTours {
  day: string
  tours: number
  guests: number
  checkedIn: number
}

export interface PartnerFunnelRow {
  partnerId: string
  name: string
  visits: number
  uniqueSessions: number
  checkoutStarts: number
  confirmedBookings: number
  conversionRate: number
  commission: number
}

export interface PaymentMethodRow {
  method: string
  currency: string
  bookings: number
  paid: number
  revenue: number
}

export interface AdminReportData {
  created: CreatedBookingsSummary
  revenue: CurrencyRevenue[]
  tours: ToursSummary
  byExperience: ExperienceDemand[]
  referrals: ReferralConversion[]
  partnerFunnels: PartnerFunnelRow[]
  paymentMethods: PaymentMethodRow[]
  upcoming: UpcomingTour[]
  newUsers: number
  chat: ChatSummary
}

export interface EmployeeReportData {
  tours: ToursSummary
  byDay: DayTours[]
  byExperience: ExperienceDemand[]
  upcoming: UpcomingTour[]
  chat?: ChatSummary
}

export interface ChatTopicCount {
  topic: string
  label: string
  questions: number
}

export interface ChatSuggestionCount {
  suggestionKey: string
  questions: number
}

export interface ChatTopQuestion {
  question: string
  count: number
  topic: string
}

export interface ChatPathCount {
  path: string
  questions: number
}

export interface ChatSummary {
  total: number
  conversations: number
  uniqueUsers: number
  filtered: number
  es: number
  en: number
  byTopic: ChatTopicCount[]
  bySuggestion: ChatSuggestionCount[]
  byPath: ChatPathCount[]
  topQuestions: ChatTopQuestion[]
}

export const CHAT_TOPIC_LABELS: Record<string, string> = {
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

export function redactChatQuestion(question: string): string {
  return String(question || '')
    .replace(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi, '[correo]')
    .replace(/\+?\d[\d\s\-()]{7,}\d/g, '[teléfono]')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 140)
}

const createdAtRange = `datetime(b.created_at) >= datetime(?)
  AND datetime(b.created_at) < datetime(?)`

const startDateRange = `datetime(b.start_date) >= datetime(?)
  AND datetime(b.start_date) < datetime(?)`

const activeBookingStatus = `b.status NOT IN ('cancelled', 'refunded', 'no_show')`

const MEXICO_SQL_SHIFT = '-6 hours'

async function query(sql: string, args: unknown[]) {
  return turso.execute({ sql, args: args as any[] })
}

async function loadTours(period: ReportPeriod): Promise<ToursSummary> {
  const result = await query(
    `SELECT COUNT(*) AS tours,
            COALESCE(SUM(b.guests), 0) AS guests,
            COALESCE(SUM(CASE WHEN b.checked_in_at IS NOT NULL THEN 1 ELSE 0 END), 0) AS checked_in,
            COALESCE(SUM(CASE WHEN b.payment_status IN ('unpaid', 'partial') THEN 1 ELSE 0 END), 0) AS pending_payment
     FROM bookings b
     WHERE ${startDateRange}
       AND ${activeBookingStatus}`,
    [period.startUtc, period.endUtc]
  )
  const row: any = result.rows[0]
  return {
    tours: num(row?.tours),
    guests: num(row?.guests),
    checkedIn: num(row?.checked_in),
    pendingPayment: num(row?.pending_payment),
  }
}

async function loadByExperience(period: ReportPeriod): Promise<ExperienceDemand[]> {
  const result = await query(
    `SELECT COALESCE(e.title_es, e.title_en) AS experience,
            COUNT(*) AS tours,
            COALESCE(SUM(b.guests), 0) AS guests,
            COALESCE(SUM(CASE WHEN b.checked_in_at IS NOT NULL THEN 1 ELSE 0 END), 0) AS checked_in
     FROM bookings b
     JOIN experiences e ON e.id = b.experience_id
     WHERE ${startDateRange}
       AND ${activeBookingStatus}
     GROUP BY b.experience_id
     ORDER BY guests DESC, tours DESC
     LIMIT 12`,
    [period.startUtc, period.endUtc]
  )

  return result.rows.map((raw: any) => ({
    experience: String(raw.experience || 'Sin nombre'),
    tours: num(raw.tours),
    guests: num(raw.guests),
    checkedIn: num(raw.checked_in),
  }))
}

async function loadUpcoming(period: ReportPeriod): Promise<UpcomingTour[]> {
  const result = await query(
    `SELECT date(datetime(b.start_date, ?)) AS day,
            COALESCE(e.title_es, e.title_en) AS experience,
            COUNT(*) AS tours,
            COALESCE(SUM(b.guests), 0) AS guests
     FROM bookings b
     JOIN experiences e ON e.id = b.experience_id
     WHERE datetime(b.start_date) >= datetime(?)
       AND datetime(b.start_date) < datetime(?)
       AND ${activeBookingStatus}
     GROUP BY day, b.experience_id
     ORDER BY day ASC, guests DESC
     LIMIT 30`,
    [MEXICO_SQL_SHIFT, period.upcomingStartUtc, period.upcomingEndUtc]
  )

  return result.rows.map((raw: any) => ({
    day: String(raw.day || ''),
    experience: String(raw.experience || 'Sin nombre'),
    tours: num(raw.tours),
    guests: num(raw.guests),
  }))
}

async function loadByDay(period: ReportPeriod): Promise<DayTours[]> {
  const result = await query(
    `SELECT date(datetime(b.start_date, ?)) AS day,
            COUNT(*) AS tours,
            COALESCE(SUM(b.guests), 0) AS guests,
            COALESCE(SUM(CASE WHEN b.checked_in_at IS NOT NULL THEN 1 ELSE 0 END), 0) AS checked_in
     FROM bookings b
     WHERE ${startDateRange}
       AND ${activeBookingStatus}
     GROUP BY day
     ORDER BY day ASC`,
    [MEXICO_SQL_SHIFT, period.startUtc, period.endUtc]
  )

  return result.rows.map((raw: any) => ({
    day: String(raw.day || ''),
    tours: num(raw.tours),
    guests: num(raw.guests),
    checkedIn: num(raw.checked_in),
  }))
}

/**
 * Qué busca la gente en el chatbot, desde Turso chat_questions.
 * Sin PII: top questions se redactan (correo/teléfono) y se truncan.
 */
export async function loadChatSummary(period: ReportPeriod): Promise<ChatSummary> {
  const from = period.startUtc
  const to = period.endUtc
  const empty: ChatSummary = {
    total: 0,
    conversations: 0,
    uniqueUsers: 0,
    filtered: 0,
    es: 0,
    en: 0,
    byTopic: [],
    bySuggestion: [],
    byPath: [],
    topQuestions: [],
  }
  try {
    const totalResult = await query(
      `SELECT COUNT(*) AS total,
              COUNT(DISTINCT conversation_id) AS conversations,
              COUNT(DISTINCT user_id) AS unique_users,
              COALESCE(SUM(CASE WHEN filtered IS NOT NULL AND filtered != '' THEN 1 ELSE 0 END), 0) AS filtered,
              COALESCE(SUM(CASE WHEN locale = 'en' THEN 1 ELSE 0 END), 0) AS en,
              COALESCE(SUM(CASE WHEN locale != 'en' THEN 1 ELSE 0 END), 0) AS es
       FROM chat_questions
       WHERE datetime(created_at) >= datetime(?) AND datetime(created_at) < datetime(?)`,
      [from, to]
    )
    const row: any = totalResult.rows[0]
    const byTopicResult = await query(
      `SELECT COALESCE(NULLIF(topic, ''), 'general') AS topic, COUNT(*) AS n
       FROM chat_questions
       WHERE datetime(created_at) >= datetime(?) AND datetime(created_at) < datetime(?)
       GROUP BY topic ORDER BY n DESC LIMIT 15`,
      [from, to]
    )
    const bySuggestionResult = await query(
      `SELECT COALESCE(NULLIF(suggestion_key, ''), '') AS suggestion_key, COUNT(*) AS n
       FROM chat_questions
       WHERE datetime(created_at) >= datetime(?) AND datetime(created_at) < datetime(?)
         AND suggestion_key IS NOT NULL AND suggestion_key != ''
       GROUP BY suggestion_key ORDER BY n DESC LIMIT 10`,
      [from, to]
    )
    const byPathResult = await query(
      `SELECT COALESCE(NULLIF(path, ''), '/') AS path, COUNT(*) AS n
       FROM chat_questions
       WHERE datetime(created_at) >= datetime(?) AND datetime(created_at) < datetime(?)
       GROUP BY path ORDER BY n DESC LIMIT 10`,
      [from, to]
    )
    const topResult = await query(
      `SELECT question, COALESCE(NULLIF(topic, ''), 'general') AS topic, COUNT(*) AS n
       FROM chat_questions
       WHERE datetime(created_at) >= datetime(?) AND datetime(created_at) < datetime(?)
       GROUP BY question, topic ORDER BY n DESC, MAX(created_at) DESC LIMIT 10`,
      [from, to]
    )
    return {
      total: num(row?.total),
      conversations: num(row?.conversations),
      uniqueUsers: num(row?.unique_users),
      filtered: num(row?.filtered),
      en: num(row?.en),
      es: num(row?.es),
      byTopic: byTopicResult.rows.map((r: any) => ({
        topic: String(r.topic || 'general'),
        label: CHAT_TOPIC_LABELS[String(r.topic || 'general')] || String(r.topic || 'general'),
        questions: num(r.n),
      })),
      bySuggestion: bySuggestionResult.rows.map((r: any) => ({
        suggestionKey: String(r.suggestion_key || ''),
        questions: num(r.n),
      })),
      byPath: byPathResult.rows.map((r: any) => ({
        path: String(r.path || '/'),
        questions: num(r.n),
      })),
      // No se expone texto crudo con PII: redactado y truncado.
      topQuestions: topResult.rows.map((r: any) => ({
        question: redactChatQuestion(String(r.question || '')),
        count: num(r.n),
        topic: String(r.topic || 'general'),
      })),
    }
  } catch {
    return empty
  }
}

export async function loadEmployeeReportData(period: ReportPeriod): Promise<EmployeeReportData> {
  const [tours, byDay, byExperience, upcoming, chat] = await Promise.all([
    loadTours(period),
    loadByDay(period),
    loadByExperience(period),
    loadUpcoming(period),
    loadChatSummary(period),
  ])

  return { tours, byDay, byExperience, upcoming, chat }
}

/**
 * Embudo por socio (hostales): visitas → reservas → conversión → comisión
 * del periodo, reutilizando la misma agregación del dashboard del socio.
 * Si algo falla, la sección simplemente no sale (nunca tumba el reporte).
 */
export async function loadPartnerFunnels(period: ReportPeriod): Promise<PartnerFunnelRow[]> {
  try {
    const partnersResult = await query(
      `SELECT id, name FROM partners WHERE status = 'ACTIVE' ORDER BY name LIMIT 20`,
      []
    )
    const range = {
      from: period.startUtc.slice(0, 10),
      to: period.endUtc.slice(0, 10),
      preset: 'custom',
    }
    const rows: PartnerFunnelRow[] = []
    for (const raw of partnersResult.rows as any[]) {
      const partnerId = String(raw.id || '')
      if (!partnerId) continue
      const o = await getOverview(partnerId, range)
      rows.push({
        partnerId,
        name: String(raw.name || partnerId),
        visits: o.visits,
        uniqueSessions: o.uniqueSessions,
        checkoutStarts: o.checkoutStarts,
        confirmedBookings: o.confirmedBookings,
        conversionRate: o.conversionRate,
        commission: o.pendingCommission + o.payableCommission + o.paidCommission,
      })
    }
    return rows.sort((a, b) => b.visits - a.visits)
  } catch {
    return []
  }
}

export async function loadAdminReportData(period: ReportPeriod): Promise<AdminReportData> {
  const [
    createdResult,
    revenueResult,
    tours,
    byExperience,
    referralsResult,
    upcoming,
    newUsersResult,
    chat,
    partnerFunnels,
    paymentMethodsResult,
  ] = await Promise.all([
    query(
      `SELECT COUNT(*) AS bookings,
              COALESCE(SUM(CASE WHEN b.status NOT IN ('cancelled', 'refunded', 'no_show') THEN b.guests ELSE 0 END), 0) AS guests,
              COALESCE(SUM(CASE WHEN b.status IN ('cancelled', 'refunded', 'no_show') THEN 1 ELSE 0 END), 0) AS cancelled,
              COALESCE(SUM(CASE WHEN b.payment_status = 'paid' AND ${activeBookingStatus} THEN 1 ELSE 0 END), 0) AS paid,
              COALESCE(SUM(CASE WHEN b.payment_status IN ('unpaid', 'partial') AND ${activeBookingStatus} THEN 1 ELSE 0 END), 0) AS pending_payment
       FROM bookings b
       WHERE ${createdAtRange}`,
      [period.startUtc, period.endUtc]
    ),
    query(
      `SELECT b.currency AS currency,
              COUNT(*) AS bookings,
              COALESCE(SUM(b.total_amount), 0) AS amount
       FROM bookings b
       WHERE ${createdAtRange}
         AND b.payment_status = 'paid'
         AND ${activeBookingStatus}
       GROUP BY b.currency
       ORDER BY amount DESC`,
      [period.startUtc, period.endUtc]
    ),
    loadTours(period),
    loadByExperience(period),
    query(
      `SELECT rc.referral_code AS code,
              COALESCE(NULLIF(rc.display_name, ''), rc.referral_code) AS name,
              c.currency AS currency,
              COUNT(*) AS conversions,
              COALESCE(SUM(c.amount), 0) AS amount
       FROM referral_conversions c
       JOIN referral_codes rc ON rc.id = c.referral_code_id
       WHERE datetime(c.converted_at) >= datetime(?)
         AND datetime(c.converted_at) < datetime(?)
       GROUP BY rc.id, c.currency
       ORDER BY conversions DESC, amount DESC
       LIMIT 20`,
      [period.startUtc, period.endUtc]
    ),
    loadUpcoming(period),
    query(
      `SELECT COUNT(*) AS total
       FROM users
       WHERE datetime(created_at) >= datetime(?)
         AND datetime(created_at) < datetime(?)`,
      [period.startUtc, period.endUtc]
    ),
    loadChatSummary(period),
    loadPartnerFunnels(period),
    query(
      `SELECT COALESCE(NULLIF(b.payment_method, ''), 'sin método') AS method,
              b.currency AS currency,
              COUNT(*) AS bookings,
              COALESCE(SUM(CASE WHEN b.payment_status = 'paid' AND ${activeBookingStatus} THEN 1 ELSE 0 END), 0) AS paid,
              COALESCE(SUM(CASE WHEN b.payment_status = 'paid' AND ${activeBookingStatus} THEN b.total_amount ELSE 0 END), 0) AS revenue
       FROM bookings b
       WHERE ${createdAtRange}
       GROUP BY method, b.currency
       ORDER BY revenue DESC`,
      [period.startUtc, period.endUtc]
    ),
  ])

  const createdRow: any = createdResult.rows[0]
  const newUsersRow: any = newUsersResult.rows[0]

  return {
    created: {
      bookings: num(createdRow?.bookings),
      guests: num(createdRow?.guests),
      cancelled: num(createdRow?.cancelled),
      paid: num(createdRow?.paid),
      pendingPayment: num(createdRow?.pending_payment),
    },
    revenue: revenueResult.rows.map((raw: any) => ({
      currency: String(raw.currency || 'USD'),
      bookings: num(raw.bookings),
      amount: num(raw.amount),
    })),
    tours,
    byExperience,
    referrals: referralsResult.rows.map((raw: any) => ({
      code: String(raw.code || ''),
      name: String(raw.name || raw.code || ''),
      currency: String(raw.currency || 'USD'),
      conversions: num(raw.conversions),
      amount: num(raw.amount),
    })),
    upcoming,
    newUsers: num(newUsersRow?.total),
    chat,
    partnerFunnels,
    paymentMethods: (paymentMethodsResult.rows as any[]).map((raw) => ({
      method: String(raw.method || 'sin método'),
      currency: String(raw.currency || 'MXN'),
      bookings: num(raw.bookings),
      paid: num(raw.paid),
      revenue: num(raw.revenue),
    })),
  }
}
