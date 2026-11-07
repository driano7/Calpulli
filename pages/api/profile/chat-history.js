// MIT License - Copyright (c) 2024-2026 Donovan Riaño / Calpulli CDMX
// GET /api/profile/chat-history — per-user chatbot history.
// Auth: Bearer <authToken> (getSessionUser). Returns conversations grouped
// by conversation_id, newest first. Guest rows (user_id NULL) are never returned.
import { turso } from '@/lib/turso'
import { getSessionUser } from '@/lib/auth'

export const config = { runtime: 'nodejs' }

function bearer(req) {
  const h = req.headers.authorization
  return typeof h === 'string' && h.startsWith('Bearer ') ? h.slice(7).trim() : null
}

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' })
  const actor = await getSessionUser(bearer(req))
  if (!actor) return res.status(401).json({ error: 'Unauthorized' })

  // Ensure table exists on old DBs (same DDL as lib/turso.js).
  try {
    await turso.execute({
      sql: `CREATE TABLE IF NOT EXISTS chat_questions (
        id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
        user_id TEXT REFERENCES users(id) ON DELETE SET NULL,
        conversation_id TEXT,
        question TEXT NOT NULL,
        answer TEXT,
        locale TEXT NOT NULL DEFAULT 'es',
        path TEXT,
        filtered TEXT,
        created_at TEXT NOT NULL DEFAULT (datetime('now'))
      )`,
    })
  } catch {
    // ignore
  }

  const limit = Math.min(200, Math.max(1, Number(req.query.limit || 100) || 100))
  try {
    const result = await turso.execute({
      sql: `SELECT id, conversation_id, question, answer, locale, path, filtered, created_at
            FROM chat_questions
            WHERE user_id = ?
            ORDER BY created_at DESC
            LIMIT ?`,
      args: [actor.id, limit],
    })
    const rows = result.rows
      .slice()
      .reverse()
      .map((r) => ({
        id: r.id,
        conversationId: r.conversation_id || null,
        question: r.question,
        answer: r.answer,
        locale: r.locale,
        path: r.path,
        filtered: r.filtered || null,
        createdAt: r.created_at,
      }))
    const conversations = new Map()
    for (const row of rows) {
      const key = row.conversationId || 'sin-conversacion'
      if (!conversations.has(key)) conversations.set(key, [])
      conversations.get(key).push(row)
    }
    return res.status(200).json({
      conversations: [...conversations.entries()].map(([id, messages]) => ({
        id,
        messages,
        updatedAt: messages[messages.length - 1]?.createdAt || null,
      })),
      total: rows.length,
    })
  } catch (err) {
    console.error('[profile.chat-history] error:', err)
    return res.status(500).json({ error: 'Failed to load chat history' })
  }
}
