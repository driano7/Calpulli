-- MIT License - Copyright (c) 2024-2026 Donovan Riaño / Calpulli CDMX - See LICENSE
-- Migración: reportes de socios y equipo.
--
-- Aplica con:
--   turso db shell <db> < turso-reports.sql
--
-- La tabla también se crea de forma perezosa desde lib/reports/store.ts, pero
-- este archivo deja el esquema explícito para producción.

CREATE TABLE IF NOT EXISTS partner_report_log (
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
);

CREATE INDEX IF NOT EXISTS idx_partner_report_period
  ON partner_report_log (period_type, period_key, status);
