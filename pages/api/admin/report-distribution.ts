// MIT License - Copyright (c) 2024-2026 Donovan Riaño / Calpulli CDMX - See LICENSE
// Gestión de la lista de distribución de reportes de socios/equipo.
// GET  /api/admin/report-distribution — lista emails activos
// POST /api/admin/report-distribution — agrega un email
// DELETE /api/admin/report-distribution — elimina un email (body: { email })
// Solo admin puede gestionar la lista.
import type { NextApiRequest, NextApiResponse } from 'next'
import { getSessionUser } from '@/lib/auth'
import { turso } from '@/lib/turso'

function normalizeEmail(email: string): string {
  return String(email || '')
    .trim()
    .toLowerCase()
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const header = req.headers.authorization
  const token = header?.startsWith('Bearer ') ? header.slice(7) : null
  if (!token) return res.status(401).json({ error: 'Unauthorized' })

  const actor = await getSessionUser(token)
  if (!actor) return res.status(401).json({ error: 'Unauthorized' })
  if (actor.role !== 'admin') return res.status(403).json({ error: 'Solo un admin' })

  try {
    if (req.method === 'GET') {
      const result = await turso.execute({
        sql: `SELECT id, email, role, is_active, added_by, created_at, updated_at
              FROM report_distribution_list
              ORDER BY created_at DESC`,
        args: [],
      })
      return res.status(200).json({
        success: true,
        distribution: result.rows.map((row: any) => ({
          id: row.id,
          email: row.email,
          role: row.role,
          isActive: Number(row.is_active) === 1,
          addedBy: row.added_by,
          createdAt: row.created_at,
          updatedAt: row.updated_at,
        })),
      })
    }

    if (req.method === 'POST') {
      const { email, role } = req.body ?? {}
      const normalized = normalizeEmail(email)
      if (!normalized || !normalized.includes('@')) {
        return res.status(400).json({ error: 'Email inválido' })
      }
      if (role !== 'admin' && role !== 'employee') {
        return res.status(400).json({ error: 'Rol inválido' })
      }

      const id = require('crypto').randomBytes(16).toString('hex')
      await turso.execute({
        sql: `INSERT INTO report_distribution_list (id, email, role, added_by)
              VALUES (?, ?, ?, ?)
              ON CONFLICT(email) DO UPDATE SET role = excluded.role, is_active = 1, updated_at = datetime('now')`,
        args: [id, normalized, role, actor.id],
      })
      return res.status(200).json({ success: true, email: normalized, role })
    }

    if (req.method === 'DELETE') {
      const { email } = req.body ?? {}
      const normalized = normalizeEmail(email)
      if (!normalized) {
        return res.status(400).json({ error: 'Email requerido' })
      }

      await turso.execute({
        sql: `UPDATE report_distribution_list SET is_active = 0, updated_at = datetime('now') WHERE email = ?`,
        args: [normalized],
      })
      return res.status(200).json({ success: true, email: normalized })
    }

    return res.status(405).json({ error: 'Method not allowed' })
  } catch (error) {
    console.error('Report distribution error:', error)
    return res.status(500).json({ error: 'No se pudo procesar la solicitud' })
  }
}
