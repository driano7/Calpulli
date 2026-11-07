-- MIT License - Copyright (c) 2024-2026 Donovan Riaño / Calpulli CDMX
-- Partner referral system — hotels/hostels. Adapted to Turso/SQLite.
--
-- Existing staff referral system (referral_codes / referral_visits /
-- referral_attributions / referral_conversions) is UNTOUCHED.
-- This file adds a SEPARATE partner system:
--
--   partners               hotels/hostels with ?ref=slug (e.g. hostal-mx)
--   partner_referral_events deduplicated analytics events (LANDING_VIEW, etc.)
--   booking_attributions   immutable financial snapshot per booking (UNIQUE booking_id)
--   bookings.partner_id    denormalized FK for quick lookup (ON DELETE SET NULL)
--   bookings.partner_discount_amount / partner_original_amount (snapshots)
--
-- Apply on Turso:
--   set -a; source .env.local; set +a
--   node scripts/apply-sql.mjs turso-partners.sql
--
-- The same DDL is also applied lazily at runtime by lib/partners/* and
-- lib/turso.js::initializeDatabase, so a fresh deploy works without manual SQL.

-- ---------------------------------------------------------------------------
-- Partners (hotels/hostels)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS partners (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  slug TEXT NOT NULL UNIQUE,
  referral_code TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  website_url TEXT,
  logo_url TEXT,
  status TEXT NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'PAUSED', 'INACTIVE')),
  guest_discount_pct REAL NOT NULL DEFAULT 0.10 CHECK (guest_discount_pct >= 0 AND guest_discount_pct <= 0.90),
  commission_pct REAL NOT NULL DEFAULT 0.10 CHECK (commission_pct >= 0 AND commission_pct <= 0.90),
  attribution_days INTEGER NOT NULL DEFAULT 30 CHECK (attribution_days > 0 AND attribution_days <= 365),
  user_id TEXT REFERENCES users(id) ON DELETE SET NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_partners_slug ON partners(slug);
CREATE INDEX IF NOT EXISTS idx_partners_code ON partners(referral_code);
CREATE INDEX IF NOT EXISTS idx_partners_status ON partners(status);

CREATE TRIGGER IF NOT EXISTS trg_partners_updated_at
AFTER UPDATE ON partners
FOR EACH ROW WHEN NEW.updated_at = OLD.updated_at
BEGIN
  UPDATE partners SET updated_at = datetime('now') WHERE id = NEW.id;
END;

-- ---------------------------------------------------------------------------
-- Referral events (deduplicated by event_key)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS partner_referral_events (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  partner_id TEXT NOT NULL REFERENCES partners(id) ON DELETE CASCADE,
  referral_code TEXT NOT NULL,
  event_type TEXT NOT NULL CHECK (event_type IN ('LANDING_VIEW','JOURNEY_VIEW','CHECKOUT_STARTED','BOOKING_CONFIRMED','JOURNEY_COMPLETED','BOOKING_CANCELLED','BOOKING_REFUNDED')),
  event_key TEXT NOT NULL UNIQUE,
  path TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_partner_events_partner ON partner_referral_events(partner_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_partner_events_type ON partner_referral_events(event_type);

-- ---------------------------------------------------------------------------
-- Booking attributions (immutable financial snapshot)
-- status: PENDING -> CONFIRMED -> PAYABLE -> PAID; any -> REVERSED
-- source: PARTNER_LINK | REFERRAL_CODE | MANUAL
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS booking_attributions (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  booking_id TEXT NOT NULL UNIQUE REFERENCES bookings(id) ON DELETE CASCADE,
  partner_id TEXT NOT NULL REFERENCES partners(id) ON DELETE CASCADE,
  source TEXT NOT NULL DEFAULT 'PARTNER_LINK' CHECK (source IN ('PARTNER_LINK','REFERRAL_CODE','MANUAL')),
  status TEXT NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING','CONFIRMED','PAYABLE','PAID','REVERSED')),
  original_amount REAL NOT NULL CHECK (original_amount >= 0),
  discount_pct REAL NOT NULL DEFAULT 0 CHECK (discount_pct >= 0 AND discount_pct <= 0.90),
  discount_amount REAL NOT NULL DEFAULT 0 CHECK (discount_amount >= 0),
  final_amount REAL NOT NULL CHECK (final_amount >= 0),
  commission_pct REAL NOT NULL DEFAULT 0 CHECK (commission_pct >= 0 AND commission_pct <= 0.90),
  commission_amount REAL NOT NULL DEFAULT 0 CHECK (commission_amount >= 0),
  currency TEXT NOT NULL DEFAULT 'MXN',
  reversed_reason TEXT,
  refunded_amount REAL NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_booking_attr_partner ON booking_attributions(partner_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_booking_attr_status ON booking_attributions(status);

CREATE TRIGGER IF NOT EXISTS trg_booking_attributions_updated_at
AFTER UPDATE ON booking_attributions
FOR EACH ROW WHEN NEW.updated_at = OLD.updated_at
BEGIN
  UPDATE booking_attributions SET updated_at = datetime('now') WHERE id = NEW.id;
END;

-- ---------------------------------------------------------------------------
-- bookings: denormalized partner columns (snapshots for reservation UI)
-- SQLite has no ADD COLUMN IF NOT EXISTS; these are best-effort at runtime.
-- ---------------------------------------------------------------------------
-- ALTER TABLE bookings ADD COLUMN partner_id TEXT REFERENCES partners(id) ON DELETE SET NULL;
-- ALTER TABLE bookings ADD COLUMN partner_original_amount REAL;
-- ALTER TABLE bookings ADD COLUMN partner_discount_amount REAL NOT NULL DEFAULT 0;
-- ALTER TABLE bookings ADD COLUMN partner_discount_pct REAL NOT NULL DEFAULT 0;
-- ALTER TABLE bookings ADD COLUMN partner_referral_code TEXT;
--
-- NOTE: lib/partners/ensurePartnerSchema() applies these with try/catch.

CREATE INDEX IF NOT EXISTS idx_bookings_partner ON bookings(partner_id);
