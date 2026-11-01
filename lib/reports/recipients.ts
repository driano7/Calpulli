// MIT License - Copyright (c) 2024-2026 Donovan Riaño / Calpulli CDMX - See LICENSE
// Destinatarios de los reportes. Se derivan de la misma fuente de verdad que
// el resto de roles: ADMIN_EMAILS / EMPLOYEE_EMAILS y la tabla user_roles.
//
// Un admin siempre gana sobre employee. Nunca se envían reportes a clientes.

import { turso } from '@/lib/turso'
import { getAdminEmails, getEmployeeEmails } from '@/lib/roles'

export interface ReportRecipient {
  email: string
  role: 'admin' | 'employee'
  userId: string | null
  name: string | null
}

const normalize = (email: unknown) =>
  String(email || '')
    .trim()
    .toLowerCase()

export async function resolveReportRecipients(): Promise<ReportRecipient[]> {
  const byEmail = new Map<string, ReportRecipient>()

  const add = (
    email: unknown,
    role: 'admin' | 'employee',
    userId: string | null = null,
    name: string | null = null
  ) => {
    const normalized = normalize(email)
    if (!normalized || !normalized.includes('@')) return

    const existing = byEmail.get(normalized)
    if (existing) {
      if (role === 'admin') existing.role = 'admin'
      if (!existing.userId && userId) existing.userId = userId
      if (!existing.name && name) existing.name = name
      return
    }

    byEmail.set(normalized, { email: normalized, role, userId, name })
  }

  for (const email of getAdminEmails()) add(email, 'admin')
  for (const email of getEmployeeEmails()) add(email, 'employee')

  // Roles persistentes. La tabla puede no existir en instalaciones viejas:
  // se degrada a las listas de entorno sin romper el cron.
  try {
    const result = await turso.execute({
      sql: `SELECT ur.email AS role_email,
                   ur.role AS role,
                   ur."userId" AS user_id,
                   u.email AS user_email,
                   u.first_name,
                   u.last_name
            FROM user_roles ur
            LEFT JOIN users u ON u.id = ur."userId"
            WHERE ur.role IN ('admin', 'employee')`,
      args: [],
    })

    for (const raw of result.rows) {
      const row: any = raw
      const email = row.user_email || row.role_email
      const name = [row.first_name, row.last_name].filter(Boolean).join(' ').trim() || null
      add(email, row.role === 'admin' ? 'admin' : 'employee', row.user_id || null, name)
    }
  } catch (error) {
    console.error('[reports] no se pudo leer user_roles:', error)
  }

  // Compatibilidad con usuarios marcados como admin/guide en users.role.
  try {
    const result = await turso.execute({
      sql: `SELECT id, email, first_name, last_name
            FROM users
            WHERE role IN ('admin', 'guide')`,
      args: [],
    })

    for (const raw of result.rows) {
      const row: any = raw
      const name = [row.first_name, row.last_name].filter(Boolean).join(' ').trim() || null
      add(row.email, 'admin', row.id || null, name)
    }
  } catch (error) {
    console.error('[reports] no se pudo leer users.role:', error)
  }

  // Lista de distribución adicional gestionada desde /profile (solo admin).
  try {
    const result = await turso.execute({
      sql: `SELECT email, role, is_active
            FROM report_distribution_list
            WHERE is_active = 1`,
      args: [],
    })

    for (const raw of result.rows) {
      const row: any = raw
      const email = row.email
      if (!email || !email.includes('@')) continue
      add(email, row.role === 'admin' ? 'admin' : 'employee', null, null)
    }
  } catch (error) {
    console.error('[reports] no se pudo leer report_distribution_list:', error)
  }

  return [...byEmail.values()].sort((a, b) => {
    if (a.role !== b.role) return a.role === 'admin' ? -1 : 1
    return a.email.localeCompare(b.email)
  })
}
