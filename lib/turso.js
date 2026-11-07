// MIT License - Copyright (c) 2024-2026 Donovan Riaño / Calpulli CDMX - See LICENSE
// Turso (libSQL) client. Lazy: no crashea al importar si faltan las vars en el entorno.
import { createClient } from '@libsql/client'
import { createHash, randomBytes } from 'crypto'

const config = {
  url: process.env.TURSO_URL || process.env.TURSO_DATABASE_URL,
  authToken: process.env.TURSO_API_KEY || process.env.TURSO_AUTH_TOKEN,
}

let client = null

export function getTurso() {
  if (!config.url) {
    throw new Error('TURSO_URL no está configurado en este entorno')
  }
  if (!client) {
    client = createClient({ url: config.url, authToken: config.authToken })
  }
  return client
}

/**
 * Cliente Turso con inicialización perezosa.
 * Se expone como objeto concreto (no Proxy) para que el interop ESM/CJS de
 * webpack no pierda el binding en los módulos que lo importan.
 */
export const turso = {
  execute: (...args) => getTurso().execute(...args),
  batch: (...args) => getTurso().batch(...args),
  transaction: (...args) => getTurso().transaction(...args),
  executeMultiple: (...args) => getTurso().executeMultiple(...args),
  close: () => getTurso().close(),
}

function generateId(prefix = '') {
  return prefix + randomBytes(16).toString('hex')
}

function sha256Hash(input) {
  return createHash('sha256').update(input).digest('hex')
}

// ============================================================================
// Database Schema Initialization
// ============================================================================

export async function initializeDatabase() {
  const statements = [
    // OAuth Clients table
    `CREATE TABLE IF NOT EXISTS oauth_clients (
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
    )`,

    `CREATE INDEX IF NOT EXISTS idx_oauth_clients_client_id ON oauth_clients(client_id)`,

    // OAuth Authorization Codes table
    `CREATE TABLE IF NOT EXISTS oauth_authorization_codes (
      id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
      code TEXT UNIQUE NOT NULL,
      client_id TEXT NOT NULL REFERENCES oauth_clients(id) ON DELETE CASCADE,
      redirect_uri TEXT NOT NULL,
      scope TEXT NOT NULL,
      user_id TEXT NOT NULL,
      code_challenge TEXT,
      code_challenge_method TEXT CHECK (code_challenge_method IN ('S256', 'plain')),
      expires_at TEXT NOT NULL,
      consumed_at TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    )`,

    `CREATE INDEX IF NOT EXISTS idx_oauth_auth_codes_code ON oauth_authorization_codes(code)`,
    `CREATE INDEX IF NOT EXISTS idx_oauth_auth_codes_client_id ON oauth_authorization_codes(client_id)`,
    `CREATE INDEX IF NOT EXISTS idx_oauth_auth_codes_expires_at ON oauth_authorization_codes(expires_at)`,

    // OAuth Tokens table (access + refresh)
    `CREATE TABLE IF NOT EXISTS oauth_tokens (
      id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
      token_hash TEXT UNIQUE NOT NULL,
      token_type TEXT NOT NULL CHECK (token_type IN ('access', 'refresh')),
      client_id TEXT NOT NULL,
      user_id TEXT NOT NULL,
      scope TEXT NOT NULL,
      expires_at TEXT,
      revoked_at TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    )`,

    `CREATE INDEX IF NOT EXISTS idx_oauth_tokens_hash ON oauth_tokens(token_hash)`,
    `CREATE INDEX IF NOT EXISTS idx_oauth_tokens_client_id ON oauth_tokens(client_id)`,
    `CREATE INDEX IF NOT EXISTS idx_oauth_tokens_user_id ON oauth_tokens(user_id)`,
    `CREATE INDEX IF NOT EXISTS idx_oauth_tokens_expires_at ON oauth_tokens(expires_at)`,

    // OAuth Client Metadata Documents (for ChatGPT CIMD)
    `CREATE TABLE IF NOT EXISTS oauth_client_metadata (
      id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
      client_id TEXT UNIQUE NOT NULL,
      metadata TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    )`,

    // Trigger for updated_at
    `CREATE TRIGGER IF NOT EXISTS update_oauth_clients_updated_at
      AFTER UPDATE ON oauth_clients
      BEGIN
        UPDATE oauth_clients SET updated_at = datetime('now') WHERE id = NEW.id;
      END`,

    `CREATE TRIGGER IF NOT EXISTS update_oauth_client_metadata_updated_at
      AFTER UPDATE ON oauth_client_metadata
      BEGIN
        UPDATE oauth_client_metadata SET updated_at = datetime('now') WHERE id = NEW.id;
      END`,

    // Chatbot questions log: analysis + per-user history (/profile).
    // user_id NULL = guest. conversation_id groups one user-conversation.
    `CREATE TABLE IF NOT EXISTS chat_questions (
      id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
      user_id TEXT REFERENCES users(id) ON DELETE SET NULL,
      conversation_id TEXT,
      question TEXT NOT NULL,
      answer TEXT,
      locale TEXT NOT NULL DEFAULT 'es',
      path TEXT,
      filtered TEXT,
      topic TEXT,
      suggestion_key TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    )`,

    `CREATE INDEX IF NOT EXISTS idx_chat_questions_created_at ON chat_questions(created_at)`,
    `CREATE INDEX IF NOT EXISTS idx_chat_questions_user_created ON chat_questions(user_id, created_at DESC)`,
    `CREATE INDEX IF NOT EXISTS idx_chat_questions_conv ON chat_questions(conversation_id, created_at)`,
    `CREATE INDEX IF NOT EXISTS idx_chat_questions_topic_created ON chat_questions(topic, created_at DESC)`,

    // Partner referrals (hotels/hostels). Ver turso-partners.sql y lib/partners.
    `CREATE TABLE IF NOT EXISTS partners (
      id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
      slug TEXT NOT NULL UNIQUE,
      referral_code TEXT NOT NULL UNIQUE,
      name TEXT NOT NULL,
      website_url TEXT,
      logo_url TEXT,
      status TEXT NOT NULL DEFAULT 'ACTIVE',
      guest_discount_pct REAL NOT NULL DEFAULT 0.10,
      commission_pct REAL NOT NULL DEFAULT 0.10,
      attribution_days INTEGER NOT NULL DEFAULT 30,
      user_id TEXT REFERENCES users(id) ON DELETE SET NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    )`,
    `CREATE INDEX IF NOT EXISTS idx_partners_slug ON partners(slug)`,
    `CREATE INDEX IF NOT EXISTS idx_partners_code ON partners(referral_code)`,
    `CREATE INDEX IF NOT EXISTS idx_partners_status ON partners(status)`,
    `CREATE TABLE IF NOT EXISTS partner_referral_events (
      id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
      partner_id TEXT NOT NULL REFERENCES partners(id) ON DELETE CASCADE,
      referral_code TEXT NOT NULL,
      event_type TEXT NOT NULL,
      event_key TEXT NOT NULL UNIQUE,
      path TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    )`,
    `CREATE INDEX IF NOT EXISTS idx_partner_events_partner ON partner_referral_events(partner_id, created_at DESC)`,
    `CREATE TABLE IF NOT EXISTS booking_attributions (
      id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
      booking_id TEXT NOT NULL UNIQUE REFERENCES bookings(id) ON DELETE CASCADE,
      partner_id TEXT NOT NULL REFERENCES partners(id) ON DELETE CASCADE,
      source TEXT NOT NULL DEFAULT 'PARTNER_LINK',
      status TEXT NOT NULL DEFAULT 'PENDING',
      original_amount REAL NOT NULL,
      discount_pct REAL NOT NULL DEFAULT 0,
      discount_amount REAL NOT NULL DEFAULT 0,
      final_amount REAL NOT NULL,
      commission_pct REAL NOT NULL DEFAULT 0,
      commission_amount REAL NOT NULL DEFAULT 0,
      currency TEXT NOT NULL DEFAULT 'MXN',
      reversed_reason TEXT,
      refunded_amount REAL NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    )`,
    `CREATE INDEX IF NOT EXISTS idx_booking_attr_partner ON booking_attributions(partner_id, created_at DESC)`,
    `CREATE INDEX IF NOT EXISTS idx_booking_attr_status ON booking_attributions(status)`,

    // Partner accounts (memberships + invitations). Ver turso-partner-accounts.sql.
    `CREATE TABLE IF NOT EXISTS partner_memberships (
      id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
      user_id TEXT REFERENCES users(id) ON DELETE CASCADE,
      partner_id TEXT NOT NULL REFERENCES partners(id) ON DELETE CASCADE,
      role TEXT NOT NULL DEFAULT 'VIEWER',
      status TEXT NOT NULL DEFAULT 'INVITED',
      invited_by_user_id TEXT REFERENCES users(id) ON DELETE SET NULL,
      invited_at TEXT NOT NULL DEFAULT (datetime('now')),
      accepted_at TEXT, last_login_at TEXT,
      agreement_version TEXT, agreement_accepted_at TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    )`,
    `CREATE INDEX IF NOT EXISTS idx_memberships_user ON partner_memberships(user_id)`,
    `CREATE INDEX IF NOT EXISTS idx_memberships_partner ON partner_memberships(partner_id)`,
    `CREATE TABLE IF NOT EXISTS partner_invitations (
      id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
      email TEXT NOT NULL,
      partner_id TEXT NOT NULL REFERENCES partners(id) ON DELETE CASCADE,
      role TEXT NOT NULL DEFAULT 'VIEWER',
      token_hash TEXT NOT NULL UNIQUE,
      invited_by_user_id TEXT REFERENCES users(id) ON DELETE SET NULL,
      expires_at TEXT NOT NULL, revoked_at TEXT, accepted_at TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    )`,
    `CREATE TABLE IF NOT EXISTS partner_applications (
      id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
      business_name TEXT NOT NULL, type TEXT, contact_person TEXT,
      email TEXT NOT NULL, phone TEXT, city TEXT, message TEXT,
      status TEXT NOT NULL DEFAULT 'NEW',
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    )`,
  ]

  // Migración para BDs ya creadas: SQLite no tiene ADD COLUMN IF NOT EXISTS.
  const extraCols = [
    `ALTER TABLE chat_questions ADD COLUMN user_id TEXT REFERENCES users(id) ON DELETE SET NULL`,
    `ALTER TABLE chat_questions ADD COLUMN conversation_id TEXT`,
    `ALTER TABLE chat_questions ADD COLUMN topic TEXT`,
    `ALTER TABLE chat_questions ADD COLUMN suggestion_key TEXT`,
    `ALTER TABLE bookings ADD COLUMN partner_id TEXT REFERENCES partners(id) ON DELETE SET NULL`,
    `ALTER TABLE bookings ADD COLUMN partner_original_amount REAL`,
    `ALTER TABLE bookings ADD COLUMN partner_discount_amount REAL NOT NULL DEFAULT 0`,
    `ALTER TABLE bookings ADD COLUMN partner_discount_pct REAL NOT NULL DEFAULT 0`,
    `ALTER TABLE bookings ADD COLUMN partner_referral_code TEXT`,
    `ALTER TABLE partners ADD COLUMN type TEXT`,
    `ALTER TABLE partners ADD COLUMN contact_person TEXT`,
    `ALTER TABLE partners ADD COLUMN contact_email TEXT`,
    `ALTER TABLE partners ADD COLUMN contact_phone TEXT`,
    `ALTER TABLE partners ADD COLUMN preferred_language TEXT`,
    `ALTER TABLE partners ADD COLUMN notification_prefs TEXT`,
    `ALTER TABLE partner_referral_events ADD COLUMN session_id TEXT`,
    `ALTER TABLE partner_referral_events ADD COLUMN placement TEXT`,
    `ALTER TABLE partner_referral_events ADD COLUMN campaign TEXT`,
    `ALTER TABLE partner_referral_events ADD COLUMN utm_content TEXT`,
    `ALTER TABLE booking_attributions ADD COLUMN placement TEXT`,
    `ALTER TABLE booking_attributions ADD COLUMN campaign TEXT`,
    `ALTER TABLE booking_attributions ADD COLUMN payable_at TEXT`,
    `ALTER TABLE booking_attributions ADD COLUMN paid_at TEXT`,
    `ALTER TABLE booking_attributions ADD COLUMN payout_reference TEXT`,
  ]
  for (const sql of extraCols) {
    try {
      await turso.execute({ sql })
    } catch {
      // duplicate column: ya existe
    }
  }

  for (const sql of statements) {
    await turso.execute(sql)
  }

  console.log('Database schema initialized')
}

// ============================================================================
// Client Operations
// ============================================================================

export async function getClientByClientId(clientId) {
  const result = await turso.execute({
    sql: 'SELECT * FROM oauth_clients WHERE client_id = ?',
    args: [clientId],
  })
  return result.rows[0] || null
}

export async function getClientById(id) {
  const result = await turso.execute({
    sql: 'SELECT * FROM oauth_clients WHERE id = ?',
    args: [id],
  })
  return result.rows[0] || null
}

export async function validateClient(clientId, clientSecret) {
  const client = await getClientByClientId(clientId)
  if (!client) return null
  if (client.client_secret_hash) {
    const hash = createHash('sha256').update(clientSecret).digest('hex')
    if (client.client_secret_hash !== hash) return null
  } else if (clientSecret) {
    return null
  }
  return client
}

export async function registerClient({
  redirect_uris,
  name,
  grant_types = ['authorization_code', 'refresh_token'],
  response_types = ['code'],
  scope = 'mcp:read',
  token_endpoint_auth_method = 'client_secret_post',
  client_id: providedClientId,
  client_secret: providedClientSecret,
  software_id,
  software_version,
  client_uri,
  logo_uri,
  contacts,
  tos_uri,
  policy_uri,
  jwks_uri,
  jwks,
  is_public = false,
}) {
  const { generateId } = await import('../lib/mcp/oauth.js')
  const clientId = providedClientId || generateId('mcp_')
  const clientSecret = providedClientSecret || (is_public ? null : generateId('sec_'))

  const clientData = {
    client_id: clientId,
    client_secret_hash: clientSecret
      ? createHash('sha256').update(clientSecret).digest('hex')
      : null,
    client_name: name,
    redirect_uris: JSON.stringify(redirect_uris),
    grant_types: JSON.stringify(grant_types),
    response_types: JSON.stringify(response_types),
    scope,
    token_endpoint_auth_method,

    client_uri,
    logo_uri,
    contacts: contacts ? JSON.stringify(contacts) : null,
    tos_uri,
    policy_uri,
    jwks_uri,
    jwks,
    software_id,
    software_version,
  }

  await turso.execute({
    sql: `INSERT INTO oauth_clients (
      client_id, client_secret_hash, client_name, redirect_uris, grant_types,
      response_types, scope, token_endpoint_auth_method, is_public,
      client_uri, logo_uri, contacts, tos_uri, policy_uri, jwks_uri, jwks,
      software_id, software_version
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    args: [
      clientData.client_id,
      clientData.client_secret_hash,
      clientData.client_name,
      clientData.redirect_uris,
      clientData.grant_types,
      clientData.response_types,
      clientData.scope,
      clientData.token_endpoint_auth_method,
      clientData.is_public,
      clientData.client_uri,
      clientData.logo_uri,
      clientData.contacts,
      clientData.tos_uri,
      clientData.policy_uri,
      clientData.jwks_uri,
      clientData.jwks,
    ],
  })

  return { ...clientData, client_secret: clientSecret }
}
