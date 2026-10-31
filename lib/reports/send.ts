// MIT License - Copyright (c) 2024-2026 Donovan Riaño / Calpulli CDMX - See LICENSE
// Envío de reportes con deduplicación persistente por periodo y destinatario.

import { sendMail } from '@/lib/mail/service'
import type { PartnerReport, ReportAudience } from './build'
import { buildPartnerReport } from './build'
import type { ReportPeriod } from './period'
import { renderReportHtml, renderReportText } from './render'
import { resolveReportRecipients, type ReportRecipient } from './recipients'
import { claimReportSend, finishReportSend } from './store'

export interface ReportSendResult {
  email: string
  role: 'admin' | 'employee'
  status: 'sent' | 'skipped' | 'failed'
  reason?: string
}

export interface SendPartnerReportOptions {
  period: ReportPeriod
  recipients?: ReportRecipient[]
  audience?: ReportAudience | 'all'
  retry?: boolean
}

export function reportsEnabled(): boolean {
  return process.env.REPORTS_ENABLED !== 'false'
}

function escapeHtml(value: unknown): string {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

function recipientName(recipient: ReportRecipient): string {
  if (recipient.name) return recipient.name
  const localPart = recipient.email.split('@')[0] || 'equipo'
  return localPart.replace(/[._-]+/g, ' ')
}

function siteUrl(): string {
  return (process.env.NEXT_PUBLIC_SITE_URL || 'https://donovan-amx.vercel.app').replace(/\/$/, '')
}

function varsFor(report: PartnerReport, recipient: ReportRecipient) {
  const name = escapeHtml(recipientName(recipient))
  return {
    recipientName: name,
    audienceLabel: report.audience === 'admin' ? 'Socios y administración' : 'Equipo operativo',
    periodLabel: escapeHtml(report.period.label),
    periodTypeLabel: escapeHtml(report.period.typeLabel),
    sections: renderReportHtml(report),
    sectionsText: renderReportText(report),
    dashboardUrl: `${siteUrl()}/admin`,
  }
}

export async function sendPartnerReports(
  options: SendPartnerReportOptions
): Promise<ReportSendResult[]> {
  const recipients = (options.recipients ?? (await resolveReportRecipients())).filter(
    (recipient) =>
      options.audience === undefined ||
      options.audience === 'all' ||
      recipient.role === options.audience
  )

  if (!recipients.length) return []

  if (!reportsEnabled()) {
    return recipients.map((recipient) => ({
      email: recipient.email,
      role: recipient.role,
      status: 'skipped',
      reason: 'REPORTS_ENABLED=false',
    }))
  }

  const reports = new Map<ReportAudience, PartnerReport>()
  for (const recipient of recipients) {
    const audience: ReportAudience = recipient.role === 'admin' ? 'admin' : 'employee'
    if (reports.has(audience)) continue
    reports.set(audience, await buildPartnerReport(audience, options.period))
  }

  const results: ReportSendResult[] = []

  for (const recipient of recipients) {
    const audience: ReportAudience = recipient.role === 'admin' ? 'admin' : 'employee'
    const report = reports.get(audience)
    if (!report) continue

    const claimed = await claimReportSend(
      {
        periodType: options.period.type,
        periodKey: options.period.key,
        recipientEmail: recipient.email,
        role: recipient.role,
      },
      options.retry === true
    )

    if (!claimed) {
      results.push({
        email: recipient.email,
        role: recipient.role,
        status: 'skipped',
        reason: 'ya registrado para este periodo',
      })
      continue
    }

    const subject = `Reporte ${options.period.typeLabel} · ${options.period.label}`

    try {
      const sent = await sendMail('partner_report', {
        to: recipient.email,
        userId: recipient.userId,
        vars: varsFor(report, recipient),
        locale: 'es',
      })

      if (sent.status === 'sent') {
        await finishReportSend({
          periodType: options.period.type,
          periodKey: options.period.key,
          recipientEmail: recipient.email,
          status: 'sent',
          subject,
          providerId: sent.providerId ?? null,
        })
        results.push({ email: recipient.email, role: recipient.role, status: 'sent' })
      } else if (sent.status === 'failed') {
        await finishReportSend({
          periodType: options.period.type,
          periodKey: options.period.key,
          recipientEmail: recipient.email,
          status: 'failed',
          subject,
          error: sent.reason ?? 'envío fallido',
        })
        results.push({
          email: recipient.email,
          role: recipient.role,
          status: 'failed',
          reason: sent.reason,
        })
      } else {
        await finishReportSend({
          periodType: options.period.type,
          periodKey: options.period.key,
          recipientEmail: recipient.email,
          status: 'skipped',
          subject,
          error: sent.reason ?? 'omitido',
        })
        results.push({
          email: recipient.email,
          role: recipient.role,
          status: 'skipped',
          reason: sent.reason,
        })
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)
      console.error(`[reports] fallo enviando a ${recipient.email}:`, error)
      await finishReportSend({
        periodType: options.period.type,
        periodKey: options.period.key,
        recipientEmail: recipient.email,
        status: 'failed',
        subject,
        error: message,
      })
      results.push({
        email: recipient.email,
        role: recipient.role,
        status: 'failed',
        reason: message,
      })
    }
  }

  return results
}

export function summarizeResults(results: ReportSendResult[]) {
  return {
    sent: results.filter((result) => result.status === 'sent').length,
    failed: results.filter((result) => result.status === 'failed').length,
    skipped: results.filter((result) => result.status === 'skipped').length,
  }
}
