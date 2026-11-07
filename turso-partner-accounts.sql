-- MIT License - Copyright (c) 2024-2026 Donovan Riaño / Calpulli CDMX
-- Partner accounts & dashboard — extends turso-partners.sql (referrals).
-- Reuses existing auth (users/sessions, lib/auth getSessionUser).
-- No second auth system.

-- ---------------------------------------------------------------------------
-- Partner profile extensions (settings partners may edit)
-- ---------------------------------------------------------------------------
-- partners adds: type, contact_person, contact_email, contact_phone,
-- preferred_language, notification_prefs
-- Applied best-effort at runtime via ensurePartnerAccountSchema().

-- ---------------------------------------------------------------------------
-- PartnerMembership: user <-> partner (many-to-many, multi-property ready)
-- roles OWNER > MANAGER > STAFF > VIEWER
-- statuses INVITED > ACTIVE, plus SUSPENDED / REMOVED
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS partner_memberships (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  user_id TEXT REFERENCES users(id) ON DELETE CASCADE,
  partner_id TEXT NOT NULL REFERENCES partners(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'VIEWER' CHECK (role IN ('OWNER','MANAGER','STAFF','VIEWER')),
  status TEXT NOT NULL DEFAULT 'INVITED' CHECK (status IN ('INVITED','ACTIVE','SUSPENDED','REMOVED')),
  invited_by_user_id TEXT REFERENCES users(id) ON DELETE SET NULL,
  invited_at TEXT NOT NULL DEFAULT (datetime('now')),
  accepted_at TEXT,
  last_login_at TEXT,
  agreement_version TEXT,
  agreement_accepted_at TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_memberships_user ON partner_memberships(user_id);
CREATE INDEX IF NOT EXISTS idx_memberships_partner ON partner_memberships(partner_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_memberships_user_partner ON partner_memberships(user_id, partner_id);

-- ---------------------------------------------------------------------------
-- PartnerInvitations: invitee email + partner + role.
-- Only sha256(token) stored. Raw token shown once / emailed.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS partner_invitations (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  email TEXT NOT NULL,
  partner_id TEXT NOT NULL REFERENCES partners(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'VIEWER' CHECK (role IN ('OWNER','MANAGER','STAFF','VIEWER')),
  token_hash TEXT NOT NULL UNIQUE,
  invited_by_user_id TEXT REFERENCES users(id) ON DELETE SET NULL,
  expires_at TEXT NOT NULL,
  revoked_at TEXT,
  accepted_at TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_invitations_email ON partner_invitations(email);
CREATE INDEX IF NOT EXISTS idx_invitations_partner ON partner_invitations(partner_id);
CREATE INDEX IF NOT EXISTS idx_invitations_hash ON partner_invitations(token_hash);

-- ---------------------------------------------------------------------------
-- Partner applications (public /partners/apply)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS partner_applications (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  business_name TEXT NOT NULL,
  type TEXT,
  contact_person TEXT,
  email TEXT NOT NULL,
  phone TEXT,
  city TEXT,
  message TEXT,
  status TEXT NOT NULL DEFAULT 'NEW' CHECK (status IN ('NEW','REVIEWED','CONTACTED','REJECTED')),
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_applications_status ON partner_applications(status);

-- ---------------------------------------------------------------------------
-- Event & attribution enrichment (placement/campaign/session isolation)
-- ---------------------------------------------------------------------------
-- partner_referral_events adds: session_id, placement, campaign, utm_content
-- booking_attributions adds: placement, campaign, payable_at, paid_at, payout_reference
-- These are best-effort ALTERs also applied lazily at runtime.
