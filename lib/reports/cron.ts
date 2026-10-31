// MIT License - Copyright (c) 2024-2026 Donovan Riaño / Calpulli CDMX - See LICENSE
// Lógica compartida del cron de reportes.
//
// Vercel Hobby limita el número de crons por proyecto, así que el cron diario
// de recordatorios también dispara los reportes. El endpoint dedicado sigue
// existiendo para pruebas manuales y para planes que permitan más crons.

import { isReportPeriodType, localDateString, resolvePeriod, type ReportPeriodType } from './period'
import { resolveReportRecipients } from './recipients'
import { reportsEnabled, sendPartnerReports, summarizeResults } from './send'

export interface PartnerReportRun {
  disabled?: boolean
  types: ReportPeriodType[]
  reports: Record<string, unknown>
}

export function dueReportTypes(now: Date = new Date()): ReportPeriodType[] {
  const today = localDateString(now)
  const weekday = new Date(`${today}T12:00:00Z`).getUTCDay()
  const dayOfMonth = Number(today.slice(8, 10))

  const types: ReportPeriodType[] = ['daily']
  if (weekday === 1) types.push('weekly')
  if (dayOfMonth === 1) types.push('monthly')
  return types
}

export async function runPartnerReports(
  options: { requested?: string; now?: Date } = {}
): Promise<PartnerReportRun> {
  if (!reportsEnabled()) {
    return { disabled: true, types: [], reports: {} }
  }

  const now = options.now ?? new Date()
  const requested = options.requested?.toLowerCase()
  const types: ReportPeriodType[] =
    requested === 'all'
      ? ['daily', 'weekly', 'monthly']
      : isReportPeriodType(requested)
      ? [requested]
      : dueReportTypes(now)

  const recipients = await resolveReportRecipients()
  const reports: Record<string, unknown> = {}

  for (const type of types) {
    const period = resolvePeriod(type, now)
    try {
      const results = await sendPartnerReports({ period, recipients, audience: 'all' })
      reports[type] = {
        period: period.key,
        label: period.label,
        recipients: results.length,
        ...summarizeResults(results),
      }
    } catch (error) {
      console.error(`Partner report ${type} failed:`, error)
      reports[type] = {
        period: period.key,
        error: error instanceof Error ? error.message : String(error),
      }
    }
  }

  return { types, reports }
}
