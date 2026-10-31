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

export interface AdminReportData {
  created: CreatedBookingsSummary
  revenue: CurrencyRevenue[]
  tours: ToursSummary
  byExperience: ExperienceDemand[]
  referrals: ReferralConversion[]
  upcoming: UpcomingTour[]
  newUsers: number
}

export interface EmployeeReportData {
  tours: ToursSummary
  byDay: DayTours[]
  byExperience: ExperienceDemand[]
  upcoming: UpcomingTour[]
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

export async function loadEmployeeReportData(period: ReportPeriod): Promise<EmployeeReportData> {
  const [tours, byDay, byExperience, upcoming] = await Promise.all([
    loadTours(period),
    loadByDay(period),
    loadByExperience(period),
    loadUpcoming(period),
  ])

  return { tours, byDay, byExperience, upcoming }
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
  }
}
