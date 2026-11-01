-- MIT License - Copyright (c) 2024-2026 Donovan Riaño / Calpulli CDMX - See LICENSE
-- Migración: lista de distribución de reportes de socios/equipo.
--
-- Aplica con:
--   turso db shell <db> < turso-distribution.sql
--
-- Tabla para emails adicionales que reciben los reportes, más allá de
-- ADMIN_EMAILS / EMPLOYEE_EMAILS y user_roles. Gestionada desde /profile
-- (solo admin).

CREATE TABLE IF NOT EXISTS report_distribution_list (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  email TEXT NOT NULL UNIQUE,
  role TEXT NOT NULL CHECK (role IN ('admin', 'employee')),
  is_active INTEGER NOT NULL DEFAULT 1,
  added_by TEXT REFERENCES users(id) ON DELETE SET NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_report_distribution_email
  ON report_distribution_list (email, is_active);
