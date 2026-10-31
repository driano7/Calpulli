// MIT License - Copyright (c) 2024-2026 Donovan Riaño / Calpulli CDMX - See LICENSE
// GET  /api/admin/reports — vista previa de un reporte real (socios o equipo)
// POST /api/admin/reports — envía el reporte con deduplicación persistente
//
// Los empleados solo pueden previsualizar su versión operativa. Solo un admin
// puede enviar reportes y ver la bitácora.

import type { NextApiRequest, NextApiResponse } from 'next'
import { getSessionUser } from '@/lib/auth'
import { buildPartnerReport } from '@/lib/reports/build'
import {
  isReportPeriodType,
  periodFromKey,
  resolvePeriod,
  type ReportPeriodType,
} from '@/lib/reports/period'
import { resolveReportRecipients } from '@/lib/reports/recipients'
import { listReportHistory } from '@/lib/reports/store'
import { sendPartnerReports, summarizeResults } from '@/lib/reports/send'

function first(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value
}

function parseType(value: unknown): ReportPeriodType {
  return isReportPeriodType(value) ? value : 'daily'
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET' && req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const header = req.headers.authorization
  const token = header?.startsWith('Bearer ') ? header.slice(7) : null
  if (!token) return res.status(401).json({ error: 'Unauthorized' })

  const actor = await getSessionUser(token)
  if (!actor) return res.status(401).json({ error: 'Unauthorized' })
  if (actor.role === 'client') return res.status(403).json({ error: 'Sin permisos' })

  const isAdmin = actor.role === 'admin'

  try {
    if (req.method === 'GET') {
      const type = parseType(first(req.query.type))
      const periodKey = first(req.query.period)
      const requestedAudience = first(req.query.audience)

      let period
      try {
        period = periodKey ? periodFromKey(type, periodKey) : resolvePeriod(type)
      } catch (error) {
        return res
          .status(400)
          .json({ error: error instanceof Error ? error.message : 'Periodo inválido' })
      }

      const audience =
        isAdmin && requestedAudience === 'employee' ? 'employee' : isAdmin ? 'admin' : 'employee'

      const report = await buildPartnerReport(audience, period)

      let recipients = { total: 0, admins: 0, employees: 0 }
      let history: Awaited<ReturnType<typeof listReportHistory>> = []

      if (isAdmin) {
        const resolved = await resolveReportRecipients()
        recipients = {
          total: resolved.length,
          admins: resolved.filter((item) => item.role === 'admin').length,
          employees: resolved.filter((item) => item.role === 'employee').length,
        }
        history = await listReportHistory(12)
      }

      return res.status(200).json({
        success: true,
        report,
        recipients,
        history,
        canSend: isAdmin,
      })
    }

    if (!isAdmin) {
      return res.status(403).json({ error: 'Solo un admin puede enviar reportes' })
    }

    const body = req.body ?? {}
    const type = parseType(body.type)
    let period
    try {
      period = body.period ? periodFromKey(type, String(body.period)) : resolvePeriod(type)
    } catch (error) {
      return res
        .status(400)
        .json({ error: error instanceof Error ? error.message : 'Periodo inválido' })
    }

    const mode = body.mode === 'all' ? 'all' : 'self'
    const audience =
      body.audience === 'admin' || body.audience === 'employee' ? body.audience : 'all'

    const recipients =
      mode === 'self'
        ? [
            {
              email: actor.email,
              role: actor.role === 'admin' ? ('admin' as const) : ('employee' as const),
              userId: actor.id,
              name: [actor.firstName, actor.lastName].filter(Boolean).join(' ').trim() || null,
            },
          ]
        : await resolveReportRecipients()

    const results = await sendPartnerReports({
      period,
      recipients,
      audience: mode === 'self' ? undefined : audience,
      retry: body.retry === true,
    })

    return res.status(200).json({
      success: true,
      period: {
        type: period.type,
        key: period.key,
        label: period.label,
      },
      mode,
      summary: summarizeResults(results),
      results: results.map((result) => ({
        email: result.email,
        role: result.role,
        status: result.status,
        reason: result.reason,
      })),
    })
  } catch (error) {
    console.error('Partner reports error:', error)
    return res.status(500).json({ error: 'No se pudo procesar el reporte' })
  }
}
