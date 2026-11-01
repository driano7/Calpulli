// MIT License - Copyright (c) 2024-2026 Donovan Riaño / Calpulli CDMX - See LICENSE
// Periodos de reporte calculados en la zona horaria de Ciudad de México.
//
// Los reportes se cierran siempre sobre periodos completos:
//   - diario: el día anterior
//   - semanal: la semana anterior (lunes a domingo)
//   - mensual: el mes anterior
//
// El servidor (Vercel) corre en UTC, así que nunca usamos fechas del sistema
// sin convertir. `startDate`/`endDate` son fechas locales inclusivas; los
// límites UTC son exclusivos al final para evitar dobles conteos.

export const MEXICO_TZ = 'America/Mexico_City'

export type ReportPeriodType = 'daily' | 'weekly' | 'monthly'

export interface ReportPeriod {
  type: ReportPeriodType
  /** Clave estable para deduplicar envíos (2026-10-30, 2026-W44, 2026-10). */
  key: string
  /** Fecha local inclusiva, YYYY-MM-DD. */
  startDate: string
  /** Fecha local inclusiva, YYYY-MM-DD. */
  endDate: string
  /** Inicio UTC (inclusive) del periodo. */
  startUtc: string
  /** Fin UTC (exclusivo) del periodo. */
  endUtc: string
  /** Inicio UTC de la ventana "próximos 7 días" posterior al periodo. */
  upcomingStartUtc: string
  /** Fin UTC (exclusivo) de la ventana "próximos 7 días". */
  upcomingEndUtc: string
  label: string
  typeLabel: string
  days: number
}

const MONTHS_ES = [
  'enero',
  'febrero',
  'marzo',
  'abril',
  'mayo',
  'junio',
  'julio',
  'agosto',
  'septiembre',
  'octubre',
  'noviembre',
  'diciembre',
]

const MONTHS_SHORT_ES = [
  'ene',
  'feb',
  'mar',
  'abr',
  'may',
  'jun',
  'jul',
  'ago',
  'sep',
  'oct',
  'nov',
  'dic',
]

export function isReportPeriodType(value: unknown): value is ReportPeriodType {
  return value === 'daily' || value === 'weekly' || value === 'monthly'
}

export function periodTypeLabel(type: ReportPeriodType): string {
  if (type === 'weekly') return 'semanal'
  if (type === 'monthly') return 'mensual'
  return 'diario'
}

function pad2(value: number): string {
  return String(value).padStart(2, '0')
}

export function parseDateParts(date: string): { year: number; month: number; day: number } {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(date)
  if (!match) throw new Error(`Fecha inválida: ${date}`)
  return { year: Number(match[1]), month: Number(match[2]), day: Number(match[3]) }
}

function dateFromParts(year: number, month: number, day: number): string {
  return `${year}-${pad2(month)}-${pad2(day)}`
}

/** Fecha local (YYYY-MM-DD) en Ciudad de México. */
export function localDateString(date: Date = new Date()): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: MEXICO_TZ,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date)
}

export function addDays(date: string, days: number): string {
  const { year, month, day } = parseDateParts(date)
  const next = new Date(Date.UTC(year, month - 1, day + days))
  return dateFromParts(next.getUTCFullYear(), next.getUTCMonth() + 1, next.getUTCDate())
}

function dayOfWeek(date: string): number {
  const { year, month, day } = parseDateParts(date)
  return new Date(Date.UTC(year, month - 1, day, 12)).getUTCDay()
}

/** Lunes de la semana que contiene `date`. */
function startOfWeek(date: string): string {
  const sundayBased = dayOfWeek(date)
  const mondayBased = (sundayBased + 6) % 7
  return addDays(date, -mondayBased)
}

function isoWeekKey(date: string): string {
  const { year, month, day } = parseDateParts(date)
  const value = new Date(Date.UTC(year, month - 1, day, 12))
  const weekday = (value.getUTCDay() + 6) % 7
  value.setUTCDate(value.getUTCDate() - weekday + 3)
  const firstThursday = new Date(Date.UTC(value.getUTCFullYear(), 0, 4, 12))
  const firstWeekday = (firstThursday.getUTCDay() + 6) % 7
  firstThursday.setUTCDate(firstThursday.getUTCDate() - firstWeekday + 3)
  const week = 1 + Math.round((value.getTime() - firstThursday.getTime()) / (7 * 86400000))
  return `${value.getUTCFullYear()}-W${pad2(week)}`
}

function humanDate(date: string): string {
  const { year, month, day } = parseDateParts(date)
  return new Intl.DateTimeFormat('es-MX', {
    timeZone: 'UTC',
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(new Date(Date.UTC(year, month - 1, day, 12)))
}

function humanRange(start: string, end: string): string {
  const a = parseDateParts(start)
  const b = parseDateParts(end)
  if (a.year === b.year && a.month === b.month) {
    return `${a.day}–${b.day} ${MONTHS_SHORT_ES[a.month - 1]} ${a.year}`
  }
  if (a.year === b.year) {
    return `${a.day} ${MONTHS_SHORT_ES[a.month - 1]} – ${b.day} ${MONTHS_SHORT_ES[b.month - 1]} ${
      a.year
    }`
  }
  return `${a.day} ${MONTHS_SHORT_ES[a.month - 1]} ${a.year} – ${b.day} ${
    MONTHS_SHORT_ES[b.month - 1]
  } ${b.year}`
}

/**
 * Convierte una medianoche local de Ciudad de México a un instante UTC.
 * Se recalcula el offset con Intl para no hardcodear -06:00.
 */
function zonedMidnightUtc(date: string): Date {
  const { year, month, day } = parseDateParts(date)
  const guess = Date.UTC(year, month - 1, day, 0, 0, 0, 0)

  const offsetAt = (timestamp: number): number => {
    const parts = new Intl.DateTimeFormat('en-US', {
      timeZone: MEXICO_TZ,
      hourCycle: 'h23',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    }).formatToParts(new Date(timestamp))
    const get = (type: string) => Number(parts.find((part) => part.type === type)?.value)
    const asUtc = Date.UTC(
      get('year'),
      get('month') - 1,
      get('day'),
      get('hour'),
      get('minute'),
      get('second')
    )
    return asUtc - timestamp
  }

  let utc = guess - offsetAt(guess)
  utc = guess - offsetAt(utc)
  return new Date(utc)
}

function buildPeriod(
  type: ReportPeriodType,
  startDate: string,
  endDate: string,
  key: string
): ReportPeriod {
  const { year: startYear, month: startMonth, day: startDay } = parseDateParts(startDate)
  const endParts = parseDateParts(endDate)
  const endDateAfter = addDays(endDate, 1)
  const upcomingEndDate = addDays(endDate, 8)

  const label =
    type === 'monthly'
      ? `${MONTHS_ES[startMonth - 1]} de ${startYear}`
      : type === 'weekly'
      ? `Semana del ${humanRange(startDate, endDate)}`
      : humanDate(startDate)

  const days =
    Math.round(
      (Date.UTC(endParts.year, endParts.month - 1, endParts.day) -
        Date.UTC(startYear, startMonth - 1, startDay)) /
        86400000
    ) + 1

  return {
    type,
    key,
    startDate,
    endDate,
    startUtc: zonedMidnightUtc(startDate).toISOString(),
    endUtc: zonedMidnightUtc(endDateAfter).toISOString(),
    upcomingStartUtc: zonedMidnightUtc(endDateAfter).toISOString(),
    upcomingEndUtc: zonedMidnightUtc(upcomingEndDate).toISOString(),
    label,
    typeLabel: periodTypeLabel(type),
    days,
  }
}

/** Periodo cerrado inmediatamente anterior a `now`. */
export function resolvePeriod(type: ReportPeriodType, now: Date = new Date()): ReportPeriod {
  const today = localDateString(now)

  if (type === 'daily') {
    const date = addDays(today, -1)
    return buildPeriod(type, date, date, date)
  }

  if (type === 'weekly') {
    const currentMonday = startOfWeek(today)
    const start = addDays(currentMonday, -7)
    const end = addDays(currentMonday, -1)
    return buildPeriod(type, start, end, isoWeekKey(start))
  }

  const { year, month } = parseDateParts(today)

  // Último día del mes: cierra el mes actual (no el anterior).
  const lastDay = new Date(Date.UTC(year, month, 0)).getUTCDate()
  const isMonthEnd = Number(today.slice(8, 10)) === lastDay

  let start: string
  let end: string
  if (isMonthEnd) {
    start = `${year}-${pad2(month)}-01`
    end = today
  } else {
    const previousMonth = new Date(Date.UTC(year, month - 2, 1))
    start = dateFromParts(previousMonth.getUTCFullYear(), previousMonth.getUTCMonth() + 1, 1)
    end = addDays(dateFromParts(year, month, 1), -1)
  }
  return buildPeriod(type, start, end, `${start.slice(0, 7)}`)
}

/** Reconstruye un periodo a partir de su clave (para vistas históricas). */
export function periodFromKey(type: ReportPeriodType, key: string): ReportPeriod {
  const value = String(key || '').trim()

  if (type === 'daily') {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) throw new Error('Periodo diario inválido')
    if (addDays(value, 0) !== value) throw new Error('Periodo diario inválido')
    return buildPeriod(type, value, value, value)
  }

  if (type === 'monthly') {
    if (!/^\d{4}-\d{2}$/.test(value)) throw new Error('Periodo mensual inválido')
    const { year, month } = parseDateParts(`${value}-01`)
    if (month < 1 || month > 12) throw new Error('Periodo mensual inválido')
    const start = `${value}-01`
    const end = addDays(dateFromParts(year, month + 1, 1), -1)
    return buildPeriod(type, start, end, value)
  }

  const match = /^(\d{4})-W(\d{2})$/.exec(value)
  if (!match) throw new Error('Periodo semanal inválido')
  const year = Number(match[1])
  const week = Number(match[2])
  if (week < 1 || week > 53) throw new Error('Periodo semanal inválido')

  const january4 = new Date(Date.UTC(year, 0, 4, 12))
  const january4Weekday = (january4.getUTCDay() + 6) % 7
  const firstMonday = new Date(Date.UTC(year, 0, 4 - january4Weekday, 12))
  const monday = new Date(firstMonday.getTime() + (week - 1) * 7 * 86400000)
  const start = dateFromParts(
    monday.getUTCFullYear(),
    monday.getUTCMonth() + 1,
    monday.getUTCDate()
  )
  const end = addDays(start, 6)
  return buildPeriod(type, start, end, value)
}
