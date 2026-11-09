// MIT License - Copyright (c) 2024-2026 Donovan Riaño / Calpulli CDMX - See LICENSE
import { createClient } from '@libsql/client'

// Soporta ambos esquemas de nombres de variable:
//   TURSO_URL / TURSO_API_KEY  (usado en .env.local y Vercel)
//   TURSO_DATABASE_URL / TURSO_AUTH_TOKEN (nombres alternativos)
// Lazy: no crashea al importar si faltan vars (404/500 en /api/lucha/events
// si el cliente se creaba en top-level en runtime edge/SSR).
let _client: ReturnType<typeof createClient> | null = null

export function getTurso() {
  if (_client) return _client
  const url = process.env.TURSO_URL || process.env.TURSO_DATABASE_URL
  const authToken = process.env.TURSO_API_KEY || process.env.TURSO_AUTH_TOKEN
  if (!url) {
    throw new Error('TURSO_URL (or TURSO_DATABASE_URL) environment variable is not set')
  }
  _client = createClient({ url, authToken })
  return _client
}

export const turso = {
  execute: (...args: any[]) => (getTurso() as any).execute(...args),
  batch: (...args: any[]) => (getTurso() as any).batch(...args),
  transaction: (...args: any[]) => (getTurso() as any).transaction(...args),
} as unknown as ReturnType<typeof createClient>

export async function executeWithRetry(sql: string, args: any[] = [], retries = 3) {
  let lastError: Error | null = null

  for (let i = 0; i < retries; i++) {
    try {
      return await turso.execute({ sql, args })
    } catch (error) {
      lastError = error as Error
      if (i < retries - 1) {
        await new Promise((resolve) => setTimeout(resolve, 100 * (i + 1)))
      }
    }

    throw lastError
  }
}

export async function transaction(statements: { sql: string; args: any[] }[]) {
  return await turso.transaction(
    statements.map((s) => ({
      sql: s.sql,
      args: s.args,
    }))
  )
}

export default turso
