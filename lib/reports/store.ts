// MIT License - Copyright (c) 2024-2026 Donovan Riaño / Calpulli CDMX - See LICENSE
// Bitácora persistente de reportes enviados.
//
// La unicidad (period_type, period_key, recipient_email) es la garantía de
// que un reporte no se manda dos veces al mismo destinatario, aunque el cron
// se reintente o alguien pulse "enviar" varias veces.
import { randomBytes } from 'crypto'
import { turso } from '@/lib/turso'

export type ReportSendStatus = 'pending' | 'sent' | 'failed' | 'skipped'

export interface ReportLogEntry {
  id: string
  period_type: string
  period_key: string
  recipient_email: string
  role: string
  status: ReportSendStatus
  subject: string | null
  error: string | null
  provider_id: string | null
  generated_at: string
  sent_at: string | null
}

let ensured = false

export async function ensureReportLogTable(): Promise<void> {
  if (ensured) return
  await turso.execute({
    sql: `CREATE TABLE IF NOT EXISTS partner_report_log (
            id TEXT PRIMARY KEY,
            period_type TEXT NOT NULL CHECK (period_type IN ('daily', 'weekly', 'monthly')),
            period_key TEXT NOT NULL,
            recipient_email TEXT NOT NULL,
            role TEXT NOT NULL CHECK (role IN ('admin', 'employee')),
            status TEXT NOT NULL DEFAULT 'pending'
              CHECK (status IN ('pending', 'sent', 'failed', 'skipped')),
            subject TEXT,
            error TEXT,
            provider_id TEXT,
            generated_at TEXT NOT NULL DEFAULT (datetime('now')),
            sent_at TEXT,
            UNIQUE (period_type, period_key, recipient_email)
          )`,
    args: [],
  })
  await turso.execute({
    sql: `CREATE INDEX IF NOT EXISTS idx_partner_report_period
          ON partner_report_log (period_type, period_key, status)`,
    args: [],
  })
  ensured = true
}

interface ClaimInput {
  periodType: string
  periodKey: string
  recipientEmail: string
  role: 'admin' | 'employee'
}

/**
 * Reserva atómicamente el envío. Devuelve true solo si este proceso puede
 * enviar. Con `retry` se permite reintentar filas fallidas/omitidas.
 */
export async function claimReportSend(input: ClaimInput, retry = false): Promise<boolean> {
  await ensureReportLogTable()
  const email = input.recipientEmail.trim().toLowerCase()

  const inserted = await turso.execute({
    sql: `INSERT INTO partner_report_log
            (id, period_type, period_key, recipient_email, role, status)
          VALUES (?, ?, ?, ?, ?, 'pending')
          ON CONFLICT (period_type, period_key, recipient_email) DO NOTHING`,
    args: [randomBytes(16).toString('hex'), input.periodType, input.periodKey, email, input.role],
  })

  if (Number(inserted.rowsAffected) > 0) return true
  if (!retry) return false

  const updated = await turso.execute({
    sql: `UPDATE partner_report_log
          SET status = 'pending', error = NULL, provider_id = NULL, generated_at = datetime('now')
          WHERE period_type = ?
            AND period_key = ?
            AND recipient_email = ?
            AND status IN ('failed', 'skipped')`,
    args: [input.periodType, input.periodKey, email],
  })

  return Number(updated.rowsAffected) > 0
}

export async function finishReportSend(input: {
  periodType: string
  periodKey: string
  recipientEmail: string
  status: Exclude<ReportSendStatus, 'pending'>
  subject?: string | null
  error?: string | null
  providerId?: string | null
}): Promise<void> {
  await ensureReportLogTable()
  await turso.execute({
    sql: `UPDATE partner_report_log
          SET status = ?,
              subject = ?,
              error = ?,
              provider_id = ?,
              sent_at = CASE WHEN ? = 'sent' THEN datetime('now') ELSE sent_at END
          WHERE period_type = ?
            AND period_key = ?
            AND recipient_email = ?`,
    args: [
      input.status,
      input.subject ?? null,
      input.error ? String(input.error).slice(0, 500) : null,
      input.providerId ?? null,
      input.status,
      input.periodType,
      input.periodKey,
      input.recipientEmail.trim().toLowerCase(),
    ],
  })
}

export async function listReportHistory(limit = 20): Promise<ReportLogEntry[]> {
  await ensureReportLogTable()
  const result = await turso.execute({
    sql: `SELECT id, period_type, period_key, recipient_email, role, status,
                 subject, error, provider_id, generated_at, sent_at
          FROM partner_report_log
          ORDER BY generated_at DESC
          LIMIT ?`,
    args: [Math.max(1, Math.min(100, Number(limit) || 20))],
  })
  return result.rows as unknown as ReportLogEntry[]
}
