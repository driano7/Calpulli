// MIT License - Copyright (c) 2024-2026 Donovan Riaño / Calpulli CDMX - See LICENSE
// Turso (libSQL) client. Lazy: no crashea al importar si faltan las vars en el entorno.
import { createClient } from '@libsql/client'
import { createHash, randomBytes } from 'crypto'

const config = {
  url: process.env.TURSO_URL,
  authToken: process.env.TURSO_API_KEY,
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

    // Chatbot questions log (no PII: question, answer, locale, path, filtered)
    `CREATE TABLE IF NOT EXISTS chat_questions (
      id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
      question TEXT NOT NULL,
      answer TEXT,
      locale TEXT NOT NULL DEFAULT 'es',
      path TEXT,
      filtered TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    )`,

    `CREATE INDEX IF NOT EXISTS idx_chat_questions_created_at ON chat_questions(created_at)`,
  ]

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
