-- ============================================================================
--  Calpulli CDMX — Esquema de Turso (SQLite / libSQL)
--  Copyright (c) 2024-2026 Donovan Riaño
--
--  GENERADO AUTOMÁTICAMENTE desde la base real:
--    node scripts/schema-dump.mjs
--
--  No editar a mano: la fuente de verdad es la base. Regenerar tras cualquier
--  cambio. Verifica que no haya deriva con:
--    node scripts/schema-drift.mjs
--
--  Aplicar sobre una base vacía:
--    set -a; source .env.local; set +a
--    node scripts/apply-sql.mjs turso-schema.sql
--
--  Datos que NO son esquema (se siembran aparte):
--    experiences -> node scripts/seed-experiences.mjs
--    Cifrado PII -> node scripts/backfill-gdpr.mjs
-- ============================================================================


-- ============================================================================
--  IDENTIDAD
-- ============================================================================

CREATE TABLE IF NOT EXISTS "users" (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  nationality TEXT,
  phone TEXT,
  date_of_birth TEXT,
  is_email_verified INTEGER NOT NULL DEFAULT 0,
  is_active INTEGER NOT NULL DEFAULT 1,
  last_login_at TEXT,
  failed_login_attempts INTEGER DEFAULT 0,
  account_locked_until TEXT,
  role TEXT NOT NULL DEFAULT 'customer' CHECK (role IN ('admin', 'customer', 'guide')),
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  first_nameEncrypted TEXT,
  first_nameIv TEXT,
  first_nameTag TEXT,
  first_nameSalt TEXT,
  last_nameEncrypted TEXT,
  last_nameIv TEXT,
  last_nameTag TEXT,
  last_nameSalt TEXT,
  phoneEncrypted TEXT,
  phoneIv TEXT,
  phoneTag TEXT,
  phoneSalt TEXT,
  date_of_birthEncrypted TEXT,
  date_of_birthIv TEXT,
  date_of_birthTag TEXT,
  date_of_birthSalt TEXT,
  pii_encrypted_at TEXT, gender TEXT, country TEXT, state TEXT, age_band TEXT,
  CHECK (email LIKE '%@%.%'),
  CHECK (LENGTH(password_hash) >= 60)
);

CREATE TABLE IF NOT EXISTS role_permissions (
  role TEXT PRIMARY KEY CHECK (role IN ('client', 'employee', 'admin')),
  label TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  rank INTEGER NOT NULL DEFAULT 1,

    can_view_profile INTEGER NOT NULL DEFAULT 1,
  can_operate_tours INTEGER NOT NULL DEFAULT 0,
  can_view_admin INTEGER NOT NULL DEFAULT 0,

    can_manage_users INTEGER NOT NULL DEFAULT 0,
  can_view_client_pii INTEGER NOT NULL DEFAULT 0,
  can_decrypt_sensitive_fields INTEGER NOT NULL DEFAULT 0,
  can_manage_admins INTEGER NOT NULL DEFAULT 0,

    can_view_bookings_own INTEGER NOT NULL DEFAULT 1,
  can_view_bookings_all INTEGER NOT NULL DEFAULT 0,
  can_manage_bookings INTEGER NOT NULL DEFAULT 0,
  can_view_payments INTEGER NOT NULL DEFAULT 0,

    can_view_basic_metrics INTEGER NOT NULL DEFAULT 0,
  can_view_passive_analytics INTEGER NOT NULL DEFAULT 0,
  can_view_advanced_metrics INTEGER NOT NULL DEFAULT 0,
  can_export_gdpr INTEGER NOT NULL DEFAULT 0,

    panels TEXT NOT NULL DEFAULT '[]',
  is_active INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
, can_be_referrer INTEGER NOT NULL DEFAULT 0, can_view_referral_stats INTEGER NOT NULL DEFAULT 0, can_export_own_data INTEGER NOT NULL DEFAULT 1);

CREATE TABLE IF NOT EXISTS "user_roles" (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  "userId" TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('client', 'employee', 'admin')),
  granted_by TEXT REFERENCES users(id) ON DELETE SET NULL,
  note TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE("userId", role)
);

CREATE TABLE IF NOT EXISTS access_audit_logs (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  actor_id TEXT,
  actor_email TEXT,
  actor_role TEXT NOT NULL,
  action TEXT NOT NULL,
  target_email TEXT,
  details TEXT NOT NULL DEFAULT '{}',
  ip TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS sessions (
  id TEXT PRIMARY KEY,
  "userId" TEXT REFERENCES users(id) ON DELETE SET NULL,
  token TEXT NOT NULL UNIQUE,
  "expiresAt" TEXT NOT NULL,
  "createdAt" TEXT NOT NULL DEFAULT (datetime('now')),
  "ipAddress" TEXT,
  "userAgent" TEXT,
  "deviceType" TEXT,
  browser TEXT,
  os TEXT,
  country TEXT,
  city TEXT,
  "sessionDuration" INTEGER NOT NULL DEFAULT 0,
  "pageViews" INTEGER NOT NULL DEFAULT 0,
  "lastActivityAt" TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS password_reset_tokens (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash TEXT NOT NULL UNIQUE,
  expires_at TEXT NOT NULL,
  is_used INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS email_verification_tokens (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash TEXT NOT NULL UNIQUE,
  expires_at TEXT NOT NULL,
  is_used INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS login_attempts (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  user_id TEXT REFERENCES users(id) ON DELETE SET NULL,
  ip_address TEXT,
  user_agent TEXT,
  attempt_result TEXT CHECK (attempt_result IN ('success', 'failed', 'locked_out')),
  failure_reason TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS tour_categories (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  slug TEXT NOT NULL UNIQUE,
  name_en TEXT NOT NULL,
  name_es TEXT NOT NULL,
  icon_name TEXT NOT NULL,
  "displayOrder" INTEGER NOT NULL DEFAULT 0,
  "isActive" INTEGER NOT NULL DEFAULT 1,
  "createdAt" TEXT NOT NULL DEFAULT (datetime('now')),
  "updatedAt" TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS experiences (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  title_en TEXT NOT NULL,
  title_es TEXT NOT NULL,
  description_en TEXT,
  description_es TEXT,
  price REAL NOT NULL,
  duration_hours INTEGER NOT NULL,
  max_guests INTEGER NOT NULL DEFAULT 8,
  image_url TEXT,
  location_en TEXT,
  location_es TEXT,
  highlights_en TEXT NOT NULL DEFAULT '[]',
  highlights_es TEXT NOT NULL DEFAULT '[]',
  "isFeatured" INTEGER NOT NULL DEFAULT 0,
  "isActive" INTEGER NOT NULL DEFAULT 1,
  "createdAt" TEXT NOT NULL DEFAULT (datetime('now')),
  "updatedAt" TEXT NOT NULL DEFAULT (datetime('now')),
  category_id TEXT REFERENCES tour_categories(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS reviews (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  experience_id TEXT NOT NULL REFERENCES experiences(id) ON DELETE CASCADE,
  user_id TEXT REFERENCES users(id) ON DELETE SET NULL,
  reviewer_name TEXT NOT NULL,
  origin_country TEXT,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment_text TEXT NOT NULL,
  "isVerified" INTEGER NOT NULL DEFAULT 0,
  "isPublished" INTEGER NOT NULL DEFAULT 1,
  "helpfulVotes" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TEXT NOT NULL DEFAULT (datetime('now')),
  "updatedAt" TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS news_notes (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  slug TEXT NOT NULL,
  locale TEXT NOT NULL DEFAULT 'en',
  title TEXT NOT NULL,
  date TEXT NOT NULL DEFAULT (datetime('now')),
  published INTEGER NOT NULL DEFAULT 1,
  summary TEXT,
  tags TEXT NOT NULL DEFAULT '[]',
  image TEXT,
  images TEXT NOT NULL DEFAULT '[]',
  category TEXT,
  source_url TEXT,
  body TEXT,
  "createdAt" TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE (slug, locale)
);

CREATE TABLE IF NOT EXISTS "bookings" (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  experience_id TEXT NOT NULL REFERENCES experiences(id) ON DELETE CASCADE,
  user_id TEXT REFERENCES users(id) ON DELETE SET NULL,
  is_guest INTEGER NOT NULL DEFAULT 0,
  booking_reference TEXT NOT NULL UNIQUE,
  booking_date TEXT NOT NULL,
  start_date TEXT NOT NULL,
  end_date TEXT NOT NULL,
  start_time TEXT,
  guests INTEGER NOT NULL CHECK (guests BETWEEN 1 AND 20),
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending','confirmed','paid','in_progress','completed','cancelled','no_show','refunded')),
  payment_status TEXT NOT NULL DEFAULT 'unpaid'
    CHECK (payment_status IN ('unpaid','partial','paid','refunded')),
  paid_at TEXT,
  total_amount REAL NOT NULL CHECK (total_amount >= 0),
  discount_amount REAL NOT NULL DEFAULT 0,
  taxes_amount REAL NOT NULL DEFAULT 0,
  payed_amount REAL NOT NULL DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'USD' CHECK (currency IN ('USD','EUR','MXN','CAD')),
  stripe_session_id TEXT,
  stripe_payment_intent_id TEXT,
  customer_name TEXT,
  customer_email TEXT,
  special_requests TEXT,
  dietary_restrictions TEXT NOT NULL DEFAULT '[]',
  accessibility_needs TEXT,
  agent_fee REAL NOT NULL DEFAULT 0,
  commission_rate REAL NOT NULL DEFAULT 0,
  checked_in_at TEXT,
  checked_in_by TEXT REFERENCES users(id) ON DELETE SET NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
, anon_country TEXT, anon_age_band TEXT, anon_gender TEXT, anon_at TEXT, customer_phone TEXT);

CREATE TABLE IF NOT EXISTS payments (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  booking_id TEXT NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  payment_method TEXT NOT NULL CHECK (payment_method IN ('credit_card', 'debit_card', 'bank_transfer', 'paypal', 'cash', 'stripe', 'razorpay')),
  payment_provider TEXT,
  payment_token TEXT,
  amount REAL NOT NULL,
  currency TEXT DEFAULT 'USD',
  status TEXT NOT NULL CHECK (status IN ('pending', 'completed', 'failed', 'refunded', 'partially_refunded')),
  gateway_response TEXT NOT NULL DEFAULT '{}',
  processed_at TEXT,
  refund_id TEXT,
  refund_amount REAL,
  refund_reason TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS referral_codes (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  referral_code TEXT NOT NULL UNIQUE,
  display_name TEXT,
  commission_rate REAL NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'paused')),
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE (user_id)
);

CREATE TABLE IF NOT EXISTS referral_visits (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  referral_code_id TEXT NOT NULL REFERENCES referral_codes(id) ON DELETE CASCADE,
  referral_code TEXT NOT NULL,
  visit_url TEXT,
  referrer_url TEXT,
  ip TEXT,
  user_agent TEXT,
  visited_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS referral_attributions (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  referral_code_id TEXT NOT NULL REFERENCES referral_codes(id) ON DELETE CASCADE,
  referred_user_id TEXT REFERENCES users(id) ON DELETE SET NULL,
  referral_code TEXT NOT NULL,
  campaign TEXT,
  source TEXT NOT NULL DEFAULT 'link',
  metadata TEXT NOT NULL DEFAULT '{}',
  attributed_at TEXT NOT NULL DEFAULT (datetime('now')),
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE (referred_user_id)
);

CREATE TABLE IF NOT EXISTS referral_conversions (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  referral_code_id TEXT NOT NULL REFERENCES referral_codes(id) ON DELETE CASCADE,
  referred_user_id TEXT REFERENCES users(id) ON DELETE SET NULL,
  booking_id TEXT REFERENCES bookings(id) ON DELETE SET NULL,
  referral_code TEXT NOT NULL,
  stripe_session_id TEXT,
  payment_intent_id TEXT,
  amount REAL NOT NULL DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'USD',
  status TEXT,
  metadata TEXT NOT NULL DEFAULT '{}',
  converted_at TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE (booking_id)
);

CREATE TABLE IF NOT EXISTS page_analytics (
  id TEXT PRIMARY KEY,
  "userId" TEXT REFERENCES users(id) ON DELETE SET NULL,
  "sessionId" TEXT REFERENCES sessions(id) ON DELETE SET NULL,
  "pagePath" TEXT NOT NULL,
  "pageTitle" TEXT,
  "pageCategory" TEXT,
  "timeOnPage" INTEGER NOT NULL DEFAULT 0,
  "scrollDepth" INTEGER NOT NULL DEFAULT 0,
  bounce INTEGER NOT NULL DEFAULT 0,
  "exitPage" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TEXT NOT NULL DEFAULT (datetime('now')),
  "ipAddress" TEXT,
  "userAgent" TEXT,
  "referrerUrl" TEXT,
  "conversionEvent" TEXT,
  "conversionValue" REAL
);

CREATE TABLE IF NOT EXISTS conversion_events (
  id TEXT PRIMARY KEY,
  "userId" TEXT REFERENCES users(id) ON DELETE SET NULL,
  "sessionId" TEXT REFERENCES sessions(id) ON DELETE SET NULL,
  "eventType" TEXT NOT NULL,
  "eventCategory" TEXT,
  "eventValue" REAL,
  "createdAt" TEXT NOT NULL DEFAULT (datetime('now')),
  "ipAddress" TEXT,
  "userAgent" TEXT,
  "pagePath" TEXT
, "eventData" TEXT);

CREATE TABLE IF NOT EXISTS chatbot_prefs (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  chat_id TEXT NOT NULL UNIQUE,
  prefs TEXT NOT NULL DEFAULT '[]',
  locale TEXT NOT NULL DEFAULT 'en',
  "createdAt" TEXT NOT NULL DEFAULT (datetime('now')),
  "updatedAt" TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS oauth_clients (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    client_id TEXT UNIQUE NOT NULL,
    client_secret_hash TEXT,
    client_name TEXT,
    redirect_uris TEXT NOT NULL DEFAULT '[]',
    grant_types TEXT NOT NULL DEFAULT '["authorization_code","refresh_token"]',
    response_types TEXT NOT NULL DEFAULT '["code"]',
    scope TEXT NOT NULL DEFAULT 'mcp:read',
    token_endpoint_auth_method TEXT NOT NULL DEFAULT 'client_secret_post',
    client_uri TEXT,
    logo_uri TEXT,
    contacts TEXT,
    tos_uri TEXT,
    policy_uri TEXT,
    jwks_uri TEXT,
    jwks TEXT,
    software_id TEXT,
    software_version TEXT,
    is_public INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS oauth_client_metadata (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    client_id TEXT UNIQUE NOT NULL,
    metadata TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS oauth_authorization_codes (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    code TEXT UNIQUE NOT NULL,
    client_id TEXT NOT NULL,
    redirect_uri TEXT NOT NULL,
    scope TEXT NOT NULL,
    user_id TEXT NOT NULL,
    code_challenge TEXT,
    code_challenge_method TEXT CHECK (code_challenge_method IN ('S256', 'plain')),
    expires_at TEXT NOT NULL,
    consumed_at TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
, resource TEXT);

CREATE TABLE IF NOT EXISTS oauth_tokens (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    token_hash TEXT UNIQUE NOT NULL,
    token_type TEXT NOT NULL CHECK (token_type IN ('access', 'refresh')),
    client_id TEXT NOT NULL,
    user_id TEXT NOT NULL,
    scope TEXT NOT NULL,
    expires_at TEXT,
    revoked_at TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
, resource TEXT);

CREATE TABLE IF NOT EXISTS api_keys (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  key_prefix TEXT NOT NULL,
  key_hash TEXT NOT NULL,
  permissions TEXT NOT NULL DEFAULT '[]',
  expires_at TEXT,
  is_active INTEGER NOT NULL DEFAULT 1,
  last_used_at TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS booking_participants (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  booking_id TEXT NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  booking_reference TEXT NOT NULL,
  position INTEGER NOT NULL,
  participant_name TEXT,
  ticket_code TEXT NOT NULL UNIQUE,
  is_responsible INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS email_log (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  template_key TEXT NOT NULL,
  to_email TEXT NOT NULL,
  user_id TEXT REFERENCES users(id) ON DELETE SET NULL,
  subject TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','sent','failed','skipped')),
  error TEXT,
  provider_id TEXT,
  sent_at TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS email_templates (
  key TEXT PRIMARY KEY,
  subject TEXT NOT NULL,
  html TEXT NOT NULL,
  text TEXT NOT NULL,
  label TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  variables TEXT NOT NULL DEFAULT '[]',
  is_active INTEGER NOT NULL DEFAULT 1,
  updated_by TEXT REFERENCES users(id) ON DELETE SET NULL,
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Bitácora de reportes de socios/equipo. La unicidad por periodo y
-- destinatario es la garantía de no enviar dos veces el mismo reporte.
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

-- Lista de distribución de reportes de socios/equipo.
-- Emails adicionales que reciben los reportes, más allá de ADMIN_EMAILS /
-- EMPLOYEE_EMAILS y user_roles. Gestionada desde /profile (solo admin).
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

CREATE TABLE IF NOT EXISTS local_picks (
  id            TEXT PRIMARY KEY,
  slug          TEXT NOT NULL,
  lang          TEXT NOT NULL CHECK (lang IN ('es', 'en')),
  title         TEXT NOT NULL,
  festivity     TEXT,
  pinned        INTEGER NOT NULL DEFAULT 0,
  pinned_order  INTEGER,
  date          TEXT,
  tags          TEXT NOT NULL DEFAULT '[]',
  draft         INTEGER NOT NULL DEFAULT 0,
  summary       TEXT,
  images        TEXT NOT NULL DEFAULT '[]',
  neighborhood TEXT,
  budget        TEXT,
  category      TEXT,
  month         TEXT,
  pick_index    INTEGER,
  total_picks   INTEGER,
  body          TEXT NOT NULL DEFAULT '',
  created_at    TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at    TEXT NOT NULL DEFAULT (datetime('now'))
, is_monthly_guide INTEGER NOT NULL DEFAULT 0);

CREATE TABLE IF NOT EXISTS profiles (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  user_id TEXT UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  bio TEXT,
  preferences TEXT NOT NULL DEFAULT '{}',
  emergency_contact_name TEXT,
  emergency_contact_phone TEXT,
  medical_conditions TEXT,
  dietary_restrictions TEXT NOT NULL DEFAULT '[]',
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS social_auth_accounts (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  provider TEXT NOT NULL CHECK (provider IN ('google', 'facebook', 'apple', 'microsoft')),
  provider_user_id TEXT NOT NULL,
  access_token TEXT,
  refresh_token TEXT,
  token_expires_at TEXT,
  profile_data TEXT NOT NULL DEFAULT '{}',
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE (provider, provider_user_id)
);

CREATE TABLE IF NOT EXISTS user_activity_logs (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  action TEXT NOT NULL,
  resource TEXT,
  resource_id TEXT,
  metadata TEXT NOT NULL DEFAULT '{}',
  ip_address TEXT,
  user_agent TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- ============================================================================
--  ÍNDICES
-- ============================================================================

CREATE INDEX IF NOT EXISTS chatbot_prefs_chat_id_idx ON chatbot_prefs (chat_id);
CREATE INDEX IF NOT EXISTS chatbot_prefs_created_at_idx ON chatbot_prefs ("createdAt" DESC);
CREATE INDEX IF NOT EXISTS experiences_active_idx ON experiences ("isActive");
CREATE INDEX IF NOT EXISTS experiences_category_id_idx ON experiences (category_id);
CREATE INDEX IF NOT EXISTS experiences_featured_idx ON experiences ("isFeatured");
CREATE INDEX IF NOT EXISTS idx_api_keys_is_active ON api_keys(is_active) WHERE is_active = 1;
CREATE INDEX IF NOT EXISTS idx_api_keys_user_id ON api_keys(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_actor ON access_audit_logs(actor_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_role_created ON access_audit_logs(actor_role, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_target ON access_audit_logs(target_email);
CREATE INDEX IF NOT EXISTS idx_booking_participants_booking ON booking_participants (booking_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_booking_participants_code ON booking_participants (ticket_code);
CREATE INDEX IF NOT EXISTS idx_bookings_experience_id ON bookings(experience_id);
CREATE INDEX IF NOT EXISTS idx_bookings_reference ON bookings(booking_reference);
CREATE INDEX IF NOT EXISTS idx_bookings_start_date ON bookings(start_date);
CREATE INDEX IF NOT EXISTS idx_bookings_status ON bookings(status);
CREATE INDEX IF NOT EXISTS idx_bookings_upcoming ON bookings(start_date) WHERE status IN ('confirmed','paid');
CREATE INDEX IF NOT EXISTS idx_bookings_user_id ON bookings(user_id);
CREATE INDEX IF NOT EXISTS idx_conversion_events_created_at ON conversion_events("createdAt");
CREATE INDEX IF NOT EXISTS idx_conversion_events_type ON conversion_events ("eventType");
CREATE INDEX IF NOT EXISTS idx_email_log_key ON email_log(template_key, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_email_log_to ON email_log(to_email);
CREATE INDEX IF NOT EXISTS idx_email_log_user ON email_log(user_id);
CREATE INDEX IF NOT EXISTS idx_email_verification_tokens_expires_at ON email_verification_tokens(expires_at);
CREATE INDEX IF NOT EXISTS idx_email_verification_tokens_is_used ON email_verification_tokens(is_used);
CREATE INDEX IF NOT EXISTS idx_email_verification_tokens_user_id ON email_verification_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_local_picks_lang_date
  ON local_picks (lang, date DESC);
CREATE INDEX IF NOT EXISTS idx_local_picks_pinned
  ON local_picks (lang, pinned, pinned_order);
CREATE UNIQUE INDEX IF NOT EXISTS idx_local_picks_slug_lang
  ON local_picks (slug, lang);
CREATE INDEX IF NOT EXISTS idx_login_attempts_created_at ON login_attempts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_login_attempts_user_id ON login_attempts(user_id);
CREATE INDEX IF NOT EXISTS idx_oauth_auth_codes_client_id ON oauth_authorization_codes(client_id);
CREATE INDEX IF NOT EXISTS idx_oauth_auth_codes_code ON oauth_authorization_codes(code);
CREATE INDEX IF NOT EXISTS idx_oauth_auth_codes_expires_at ON oauth_authorization_codes(expires_at);
CREATE INDEX IF NOT EXISTS idx_oauth_clients_client_id ON oauth_clients(client_id);
CREATE INDEX IF NOT EXISTS idx_oauth_tokens_client_id ON oauth_tokens(client_id);
CREATE INDEX IF NOT EXISTS idx_oauth_tokens_expires_at ON oauth_tokens(expires_at);
CREATE INDEX IF NOT EXISTS idx_oauth_tokens_hash ON oauth_tokens(token_hash);
CREATE INDEX IF NOT EXISTS idx_oauth_tokens_user_id ON oauth_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_page_analytics_created_at ON page_analytics ("createdAt");
CREATE INDEX IF NOT EXISTS idx_page_analytics_page_category ON page_analytics ("pageCategory");
CREATE INDEX IF NOT EXISTS idx_page_analytics_session_id ON page_analytics("sessionId");
CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_expires_at ON password_reset_tokens(expires_at);
CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_is_used ON password_reset_tokens(is_used);
CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_user_id ON password_reset_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_payments_booking_id ON payments(booking_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status);
CREATE INDEX IF NOT EXISTS idx_profiles_user_id ON profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_referral_attributions_code
  ON referral_attributions(referral_code_id, attributed_at DESC);
CREATE INDEX IF NOT EXISTS idx_referral_codes_code ON referral_codes(referral_code);
CREATE INDEX IF NOT EXISTS idx_referral_codes_status ON referral_codes(status);
CREATE INDEX IF NOT EXISTS idx_referral_codes_user ON referral_codes(user_id);
CREATE INDEX IF NOT EXISTS idx_referral_conversions_code
  ON referral_conversions(referral_code_id, converted_at DESC);
CREATE INDEX IF NOT EXISTS idx_referral_conversions_stripe
  ON referral_conversions(stripe_session_id);
CREATE INDEX IF NOT EXISTS idx_referral_visits_code ON referral_visits(referral_code_id, visited_at DESC);
CREATE INDEX IF NOT EXISTS idx_sessions_expires_at ON sessions("expiresAt");
CREATE INDEX IF NOT EXISTS idx_sessions_token ON sessions (token);
CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions("userId");
CREATE INDEX IF NOT EXISTS idx_social_auth_accounts_provider ON social_auth_accounts(provider, provider_user_id);
CREATE INDEX IF NOT EXISTS idx_social_auth_accounts_user_id ON social_auth_accounts(user_id);
CREATE INDEX IF NOT EXISTS idx_user_activity_logs_created_at ON user_activity_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_user_activity_logs_user_id ON user_activity_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_email ON user_roles(email COLLATE NOCASE);
CREATE INDEX IF NOT EXISTS idx_user_roles_user ON user_roles("userId");
CREATE INDEX IF NOT EXISTS idx_users_email_notify ON users(email, is_active);
CREATE INDEX IF NOT EXISTS idx_users_is_active ON users(is_active) WHERE is_active = 1;
CREATE INDEX IF NOT EXISTS idx_users_pii_encrypted ON users(pii_encrypted_at);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS news_notes_date_idx ON news_notes (date DESC);
CREATE INDEX IF NOT EXISTS news_notes_locale_idx ON news_notes (locale);
CREATE INDEX IF NOT EXISTS reviews_created_at_idx ON reviews ("createdAt" DESC);
CREATE INDEX IF NOT EXISTS reviews_experience_id_idx ON reviews (experience_id);
CREATE INDEX IF NOT EXISTS reviews_published_idx ON reviews ("isPublished");
CREATE INDEX IF NOT EXISTS reviews_user_id_idx ON reviews (user_id);
CREATE INDEX IF NOT EXISTS tour_categories_active_idx ON tour_categories ("isActive");
CREATE INDEX IF NOT EXISTS tour_categories_slug_idx ON tour_categories (slug);

-- ============================================================================
--  TRIGGERS  (updated_at automático)
-- ============================================================================

CREATE TRIGGER IF NOT EXISTS trg_api_keys_updated_at
AFTER UPDATE ON api_keys
FOR EACH ROW WHEN NEW.updated_at = OLD.updated_at
BEGIN
  UPDATE api_keys SET updated_at = datetime('now') WHERE id = NEW.id;
END;
CREATE TRIGGER IF NOT EXISTS trg_bookings_updated_at
AFTER UPDATE ON bookings
FOR EACH ROW WHEN NEW.updated_at = OLD.updated_at
BEGIN
  UPDATE bookings SET updated_at = datetime('now') WHERE id = NEW.id;
END;
CREATE TRIGGER IF NOT EXISTS trg_chatbot_prefs_updated_at
AFTER UPDATE ON chatbot_prefs
FOR EACH ROW WHEN NEW."updatedAt" = OLD."updatedAt"
BEGIN
  UPDATE chatbot_prefs SET "updatedAt" = datetime('now') WHERE id = NEW.id;
END;
CREATE TRIGGER IF NOT EXISTS trg_email_templates_updated_at
AFTER UPDATE ON email_templates
FOR EACH ROW WHEN NEW.updated_at = OLD.updated_at
BEGIN
  UPDATE email_templates SET updated_at = datetime('now') WHERE key = NEW.key;
END;
CREATE TRIGGER IF NOT EXISTS trg_experiences_updated_at
AFTER UPDATE ON experiences
FOR EACH ROW WHEN NEW."updatedAt" = OLD."updatedAt"
BEGIN
  UPDATE experiences SET "updatedAt" = datetime('now') WHERE id = NEW.id;
END;
CREATE TRIGGER IF NOT EXISTS trg_oauth_client_metadata_updated_at
AFTER UPDATE ON oauth_client_metadata
FOR EACH ROW WHEN NEW.updated_at = OLD.updated_at
BEGIN
  UPDATE oauth_client_metadata SET updated_at = datetime('now') WHERE id = NEW.id;
END;
CREATE TRIGGER IF NOT EXISTS trg_oauth_clients_updated_at
AFTER UPDATE ON oauth_clients
FOR EACH ROW WHEN NEW.updated_at = OLD.updated_at
BEGIN
  UPDATE oauth_clients SET updated_at = datetime('now') WHERE id = NEW.id;
END;
CREATE TRIGGER IF NOT EXISTS trg_payments_updated_at
AFTER UPDATE ON payments
FOR EACH ROW WHEN NEW.updated_at = OLD.updated_at
BEGIN
  UPDATE payments SET updated_at = datetime('now') WHERE id = NEW.id;
END;
CREATE TRIGGER IF NOT EXISTS trg_profiles_updated_at
AFTER UPDATE ON profiles
FOR EACH ROW WHEN NEW.updated_at = OLD.updated_at
BEGIN
  UPDATE profiles SET updated_at = datetime('now') WHERE id = NEW.id;
END;
CREATE TRIGGER IF NOT EXISTS trg_referral_attributions_updated_at
AFTER UPDATE ON referral_attributions
FOR EACH ROW WHEN NEW.updated_at = OLD.updated_at
BEGIN
  UPDATE referral_attributions SET updated_at = datetime('now') WHERE id = NEW.id;
END;
CREATE TRIGGER IF NOT EXISTS trg_referral_codes_updated_at
AFTER UPDATE ON referral_codes
FOR EACH ROW WHEN NEW.updated_at = OLD.updated_at
BEGIN
  UPDATE referral_codes SET updated_at = datetime('now') WHERE id = NEW.id;
END;
CREATE TRIGGER IF NOT EXISTS trg_reviews_updated_at
AFTER UPDATE ON reviews
FOR EACH ROW WHEN NEW."updatedAt" = OLD."updatedAt"
BEGIN
  UPDATE reviews SET "updatedAt" = datetime('now') WHERE id = NEW.id;
END;
CREATE TRIGGER IF NOT EXISTS trg_role_permissions_updated_at
AFTER UPDATE ON role_permissions
FOR EACH ROW WHEN NEW.updated_at = OLD.updated_at
BEGIN
  UPDATE role_permissions SET updated_at = datetime('now') WHERE role = NEW.role;
END;
CREATE TRIGGER IF NOT EXISTS trg_social_auth_accounts_updated_at
AFTER UPDATE ON social_auth_accounts
FOR EACH ROW WHEN NEW.updated_at = OLD.updated_at
BEGIN
  UPDATE social_auth_accounts SET updated_at = datetime('now') WHERE id = NEW.id;
END;
CREATE TRIGGER IF NOT EXISTS trg_tour_categories_updated_at
AFTER UPDATE ON tour_categories
FOR EACH ROW WHEN NEW."updatedAt" = OLD."updatedAt"
BEGIN
  UPDATE tour_categories SET "updatedAt" = datetime('now') WHERE id = NEW.id;
END;
CREATE TRIGGER IF NOT EXISTS trg_user_roles_updated_at
AFTER UPDATE ON user_roles
FOR EACH ROW WHEN NEW.updated_at = OLD.updated_at
BEGIN
  UPDATE user_roles SET updated_at = datetime('now') WHERE id = NEW.id;
END;
CREATE TRIGGER IF NOT EXISTS trg_users_updated_at
AFTER UPDATE ON users
FOR EACH ROW WHEN NEW.updated_at = OLD.updated_at
BEGIN
  UPDATE users SET updated_at = datetime('now') WHERE id = NEW.id;
END;
CREATE TRIGGER IF NOT EXISTS update_oauth_client_metadata_updated_at
AFTER UPDATE ON oauth_client_metadata
BEGIN
    UPDATE oauth_client_metadata SET updated_at = datetime('now') WHERE id = NEW.id;
END;
CREATE TRIGGER IF NOT EXISTS update_oauth_clients_updated_at
AFTER UPDATE ON oauth_clients
BEGIN
    UPDATE oauth_clients SET updated_at = datetime('now') WHERE id = NEW.id;
END;
CREATE TRIGGER IF NOT EXISTS update_payments_updated_at
AFTER UPDATE ON payments
BEGIN
    UPDATE payments SET updated_at = datetime('now') WHERE id = NEW.id;
END;
CREATE TRIGGER IF NOT EXISTS update_profiles_updated_at
AFTER UPDATE ON profiles
BEGIN
    UPDATE profiles SET updated_at = datetime('now') WHERE id = NEW.id;
END;

-- ============================================================================
--  DATOS SEMILLA
-- ============================================================================

-- Matriz de roles: configuración, no datos de usuario.
-- Es lo único que debe existir en una base recién creada.
INSERT OR REPLACE INTO role_permissions ("role", "label", "description", "rank", "can_view_profile", "can_operate_tours", "can_view_admin", "can_manage_users", "can_view_client_pii", "can_decrypt_sensitive_fields", "can_manage_admins", "can_view_bookings_own", "can_view_bookings_all", "can_manage_bookings", "can_view_payments", "can_view_basic_metrics", "can_view_passive_analytics", "can_view_advanced_metrics", "can_export_gdpr", "panels", "is_active", "created_at", "updated_at", "can_be_referrer", "can_view_referral_stats", "can_export_own_data") VALUES
  ('client', 'Cliente', 'Compra y gestiona sus propias reservas y datos.', 1, 1, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, '["/profile"]', 1, '2026-10-13 00:55:06', '2026-10-13 00:55:06', 0, 0, 1),
  ('employee', 'Empleado', 'Opera tours del día. Ve lo mínimo necesario del cliente.', 2, 1, 1, 0, 0, 1, 0, 0, 1, 1, 1, 0, 1, 1, 0, 0, '["/profile", "/empleados"]', 1, '2026-10-13 00:55:06', '2026-10-13 01:40:02', 1, 0, 1),
  ('admin', 'Admin', 'Control total: usuarios, datos sensibles, métricas y GDPR.', 3, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, '["/profile", "/empleados", "/admin"]', 1, '2026-10-13 00:55:06', '2026-10-13 01:40:02', 1, 1, 1);


-- ============================================================================
--  RESUMEN
--    33 tablas · 76 índices · 21 triggers
--
--  Privacidad (ver lib/gdpr-crypto.ts):
--    users.*Encrypted/Iv/Tag/Salt  -> AES-256-GCM, llave = PBKDF2(email + GDPR_PEPPER).
--    bookings.anon_*               -> snapshot demográfico; sobrevive al borrado
--                                     del cliente y no identifica a nadie.
-- ============================================================================
