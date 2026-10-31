// MIT License - Copyright (c) 2024-2026 Donovan Riaño / Calpulli CDMX - See LICENSE
// Construcción de reportes con audiencia explícita.
//
// admin/socio  -> métricas completas, incluyendo ingresos y referidos.
// employee     -> solo operación: tours, viajeros, check-in y próximos tours.
//
// No se agregan monedas distintas ni se estiman ingresos faltantes.

import type { ReportPeriod } from './period'
import type {
  AdminReportData,
  CurrencyRevenue,
  EmployeeReportData,
  ExperienceDemand,
  ReferralConversion,
  UpcomingTour,
} from './queries'
import { loadAdminReportData, loadEmployeeReportData } from './queries'

export type ReportAudience = 'admin' | 'employee'

export interface ReportMetric {
  label: string
  value: string
  hint?: string
}

export interface ReportTable {
  title: string
  headers: string[]
  rows: string[][]
  empty: string
}

export interface PartnerReport {
  audience: ReportAudience
  type: ReportPeriod['type']
  period: ReportPeriod
  generatedAt: string
  metrics: ReportMetric[]
  tables: ReportTable[]
  notes: string[]
}

const numberFmt = new Intl.NumberFormat('es-MX', { maximumFractionDigits: 0 })
const decimalFmt = new Intl.NumberFormat('es-MX', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
})

const formatNumber = (value: number) => numberFmt.format(Number(value) || 0)

function formatMoney(amount: number, currency: string): string {
  const code = (currency || 'USD').toUpperCase()
  return `${code} ${decimalFmt.format(Number(amount) || 0)}`
}

function formatMoneyList(rows: CurrencyRevenue[]): string {
  if (!rows.length) return 'Sin ingresos registrados'
  return rows.map((row) => formatMoney(row.amount, row.currency)).join(' · ')
}

function formatShortDay(day: string): string {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(day)) return day || '—'
  const [year, month, date] = day.split('-').map(Number)
  return new Intl.DateTimeFormat('es-MX', {
    timeZone: 'UTC',
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  }).format(new Date(Date.UTC(year, month - 1, date, 12)))
}

function checkinRate(checkedIn: number, tours: number): string {
  if (!tours) return '—'
  return `${Math.round((checkedIn / tours) * 100)}%`
}

function experienceRows(rows: ExperienceDemand[]): string[][] {
  return rows.map((row) => [
    row.experience,
    formatNumber(row.tours),
    formatNumber(row.guests),
    formatNumber(row.checkedIn),
  ])
}

function upcomingRows(rows: UpcomingTour[]): string[][] {
  return rows.map((row) => [
    formatShortDay(row.day),
    row.experience,
    formatNumber(row.tours),
    formatNumber(row.guests),
  ])
}

function referralRows(rows: ReferralConversion[]): string[][] {
  return rows.map((row) => [
    `${row.name}${row.name !== row.code ? ` (${row.code})` : ''}`,
    formatNumber(row.conversions),
    formatMoney(row.amount, row.currency),
  ])
}

function baseNotes(): string[] {
  return [
    'Datos calculados en America/Mexico_City directamente desde Turso. No incluye proyecciones ni cifras estimadas.',
    'Los importes se muestran por moneda; nunca se suman monedas distintas.',
  ]
}

function buildAdminReport(period: ReportPeriod, data: AdminReportData): PartnerReport {
  const { created, tours } = data
  const revenueHint =
    data.revenue.length > 1
      ? 'Desglose por moneda; no se suman monedas distintas'
      : 'Reservas marcadas como pagadas y creadas en el periodo'

  const metrics: ReportMetric[] = [
    {
      label: 'Reservas creadas',
      value: formatNumber(created.bookings),
      hint: created.cancelled ? `${formatNumber(created.cancelled)} canceladas` : undefined,
    },
    { label: 'Viajeros reservados', value: formatNumber(created.guests) },
    {
      label: 'Reservas pagadas',
      value: formatNumber(created.paid),
      hint: created.pendingPayment
        ? `${formatNumber(created.pendingPayment)} con pago pendiente`
        : 'Sin pagos pendientes',
    },
    {
      label: 'Ingresos por reservas pagadas',
      value: formatMoneyList(data.revenue),
      hint: revenueHint,
    },
    {
      label: 'Tours del periodo',
      value: formatNumber(tours.tours),
      hint: `${formatNumber(tours.guests)} viajeros`,
    },
    {
      label: 'Check-in',
      value: checkinRate(tours.checkedIn, tours.tours),
      hint: `${formatNumber(tours.checkedIn)} de ${formatNumber(tours.tours)} tours`,
    },
    { label: 'Nuevos usuarios', value: formatNumber(data.newUsers) },
    {
      label: 'Próximos 7 días',
      value: formatNumber(data.upcoming.reduce((sum, row) => sum + row.tours, 0)),
      hint: `${formatNumber(
        data.upcoming.reduce((sum, row) => sum + row.guests, 0)
      )} viajeros ya reservados`,
    },
  ]

  const tables: ReportTable[] = [
    {
      title: 'Ingresos por moneda',
      headers: ['Moneda', 'Reservas pagadas', 'Monto'],
      rows: data.revenue.map((row) => [
        row.currency,
        formatNumber(row.bookings),
        formatMoney(row.amount, row.currency),
      ]),
      empty: 'No hay reservas pagadas creadas en este periodo.',
    },
    {
      title: 'Demanda por journey',
      headers: ['Journey', 'Tours', 'Viajeros', 'Check-ins'],
      rows: experienceRows(data.byExperience),
      empty: 'No hay tours programados en este periodo.',
    },
    {
      title: 'Referidos',
      headers: ['Código', 'Conversiones', 'Monto'],
      rows: referralRows(data.referrals),
      empty: 'No hubo conversiones de referidos en este periodo.',
    },
    {
      title: 'Próximos 7 días',
      headers: ['Fecha', 'Journey', 'Tours', 'Viajeros'],
      rows: upcomingRows(data.upcoming),
      empty: 'No hay reservas para los próximos 7 días.',
    },
  ]

  const notes = [
    ...baseNotes(),
    '“Ingresos por reservas pagadas” usa la fecha de creación de la reserva. La columna paid_at no se interpreta como fecha de cobro porque el sistema la llena con la fecha del tour.',
  ]

  if (tours.pendingPayment) {
    notes.push(
      `${formatNumber(
        tours.pendingPayment
      )} tour(s) del periodo tienen pago pendiente o parcial registrado.`
    )
  }

  return {
    audience: 'admin',
    type: period.type,
    period,
    generatedAt: new Date().toISOString(),
    metrics,
    tables,
    notes,
  }
}

function buildEmployeeReport(period: ReportPeriod, data: EmployeeReportData): PartnerReport {
  const { tours } = data
  const upcomingTours = data.upcoming.reduce((sum, row) => sum + row.tours, 0)
  const upcomingGuests = data.upcoming.reduce((sum, row) => sum + row.guests, 0)

  const metrics: ReportMetric[] = [
    {
      label: 'Tours del periodo',
      value: formatNumber(tours.tours),
      hint: `${formatNumber(tours.guests)} viajeros`,
    },
    {
      label: 'Check-in',
      value: checkinRate(tours.checkedIn, tours.tours),
      hint: `${formatNumber(tours.checkedIn)} de ${formatNumber(tours.tours)} tours`,
    },
    {
      label: 'Pagos pendientes',
      value: formatNumber(tours.pendingPayment),
      hint: 'Tours con pago pendiente o parcial',
    },
    {
      label: 'Próximos 7 días',
      value: formatNumber(upcomingTours),
      hint: `${formatNumber(upcomingGuests)} viajeros ya reservados`,
    },
  ]

  const tables: ReportTable[] = [
    {
      title: 'Tours por día',
      headers: ['Fecha', 'Tours', 'Viajeros', 'Check-ins'],
      rows: data.byDay.map((row) => [
        formatShortDay(row.day),
        formatNumber(row.tours),
        formatNumber(row.guests),
        formatNumber(row.checkedIn),
      ]),
      empty: 'No hay tours programados en este periodo.',
    },
    {
      title: 'Demanda por journey',
      headers: ['Journey', 'Tours', 'Viajeros', 'Check-ins'],
      rows: experienceRows(data.byExperience),
      empty: 'No hay tours programados en este periodo.',
    },
    {
      title: 'Próximos 7 días',
      headers: ['Fecha', 'Journey', 'Tours', 'Viajeros'],
      rows: upcomingRows(data.upcoming),
      empty: 'No hay reservas para los próximos 7 días.',
    },
  ]

  const notes = [
    ...baseNotes(),
    'Versión operativa: no incluye ingresos, datos de contacto ni información personal de los clientes.',
  ]

  return {
    audience: 'employee',
    type: period.type,
    period,
    generatedAt: new Date().toISOString(),
    metrics,
    tables,
    notes,
  }
}

export async function buildPartnerReport(
  audience: ReportAudience,
  period: ReportPeriod
): Promise<PartnerReport> {
  if (audience === 'employee') {
    return buildEmployeeReport(period, await loadEmployeeReportData(period))
  }
  return buildAdminReport(period, await loadAdminReportData(period))
}
