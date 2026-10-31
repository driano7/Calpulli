// MIT License - Copyright (c) 2024-2026 Donovan Riaño / Calpulli CDMX - See LICENSE
// Panel de reportes de socios y equipo.
//
// La vista previa siempre sale de /api/admin/reports, que consulta Turso en
// vivo. Este componente no calcula métricas ni inventa cifras: solo pinta lo
// que devuelve el servidor y dispara envíos deduplicados.

import { useCallback, useEffect, useState } from 'react'
import { Activity, AlertCircle, Check, Clock, FileText, Mail, Send, Users } from 'lucide-react'

type PeriodType = 'daily' | 'weekly' | 'monthly'
type Audience = 'admin' | 'employee'

interface ReportMetric {
  label: string
  value: string
  hint?: string
}

interface ReportTable {
  title: string
  headers: string[]
  rows: string[][]
  empty: string
}

interface PartnerReport {
  audience: Audience
  type: PeriodType
  period: { key: string; label: string; typeLabel: string }
  metrics: ReportMetric[]
  tables: ReportTable[]
  notes: string[]
}

interface ReportHistory {
  id: string
  period_type: string
  period_key: string
  recipient_email: string
  role: string
  status: string
  error: string | null
  generated_at: string
  sent_at: string | null
}

interface ApiResponse {
  success: boolean
  report: PartnerReport
  recipients: { total: number; admins: number; employees: number }
  history: ReportHistory[]
  canSend: boolean
}

const STATUS_STYLE: Record<string, string> = {
  sent: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400',
  failed: 'bg-red-500/15 text-red-600 dark:text-red-400',
  skipped: 'bg-amber-500/15 text-amber-600 dark:text-amber-400',
  pending: 'bg-zinc-500/15 text-zinc-500',
}

const PERIOD_LABEL: Record<PeriodType, { es: string; en: string }> = {
  daily: { es: 'Diario', en: 'Daily' },
  weekly: { es: 'Semanal', en: 'Weekly' },
  monthly: { es: 'Mensual', en: 'Monthly' },
}

export function PartnerReportsPanel({ isEs }: { isEs: boolean }) {
  const [type, setType] = useState<PeriodType>('daily')
  const [audience, setAudience] = useState<Audience>('admin')
  const [data, setData] = useState<ApiResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [notice, setNotice] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const labels = {
    title: isEs ? 'Reportes de socios y equipo' : 'Partner and team reports',
    subtitle: isEs
      ? 'Cifras reales de Turso, cerradas en America/Mexico_City. Los socios ven ingresos; el equipo solo operación.'
      : 'Real Turso figures closed in America/Mexico_City. Partners see revenue; the team sees operations only.',
    partners: isEs ? 'Socios' : 'Partners',
    team: isEs ? 'Equipo' : 'Team',
    sendAll: isEs ? 'Enviar a todo el equipo' : 'Send to the whole team',
    sendMe: isEs ? 'Enviarme copia' : 'Email me a copy',
    retry: isEs ? 'Reintentar fallidos' : 'Retry failed',
    recipients: isEs ? 'Destinatarios' : 'Recipients',
    history: isEs ? 'Últimos envíos' : 'Recent sends',
    notes: isEs ? 'Notas' : 'Notes',
    loading: isEs ? 'Cargando reporte…' : 'Loading report…',
    confirmAll: isEs
      ? '¿Enviar este reporte a todos los socios y al equipo? Los envíos ya realizados para este periodo se omiten.'
      : 'Send this report to every partner and team member? Sends already made for this period are skipped.',
  }

  const load = useCallback(async () => {
    const token = localStorage.getItem('authToken')
    if (!token) return
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/admin/reports?type=${type}&audience=${audience}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      const json = await res.json()
      if (!res.ok) {
        setError(json.error || (isEs ? 'No se pudo cargar el reporte' : 'Could not load report'))
        setData(null)
        return
      }
      setData(json)
    } catch {
      setError(isEs ? 'No se pudo cargar el reporte' : 'Could not load report')
      setData(null)
    } finally {
      setLoading(false)
    }
  }, [audience, isEs, type])

  useEffect(() => {
    void load()
  }, [load])

  const send = async (mode: 'all' | 'self', retry = false) => {
    if (mode === 'all' && !window.confirm(labels.confirmAll)) return
    const token = localStorage.getItem('authToken')
    if (!token) return

    setSending(true)
    setNotice(null)
    setError(null)
    try {
      const res = await fetch('/api/admin/reports', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          type,
          mode,
          audience: mode === 'all' ? 'all' : audience,
          retry,
        }),
      })
      const json = await res.json()
      if (!res.ok) {
        setError(json.error || (isEs ? 'No se pudo enviar' : 'Could not send'))
        return
      }
      const summary = json.summary ?? {}
      setNotice(
        isEs
          ? `Enviados: ${summary.sent ?? 0} · Omitidos: ${summary.skipped ?? 0} · Fallidos: ${
              summary.failed ?? 0
            }`
          : `Sent: ${summary.sent ?? 0} · Skipped: ${summary.skipped ?? 0} · Failed: ${
              summary.failed ?? 0
            }`
      )
      await load()
    } catch {
      setError(isEs ? 'No se pudo enviar' : 'Could not send')
    } finally {
      setSending(false)
    }
  }

  const report = data?.report

  return (
    <section className="mb-8 rounded-2xl border border-zinc-200 bg-white/80 p-6 shadow-lg dark:border-white/10 dark:bg-zinc-900/50">
      <div className="mb-5 flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div>
          <h2 className="flex items-center gap-2 text-xl font-bold text-zinc-900 dark:text-white">
            <FileText className="h-5 w-5 text-orange-500" />
            {labels.title}
          </h2>
          <p className="mt-1 max-w-2xl text-xs text-zinc-500 dark:text-gray-400">
            {labels.subtitle}
          </p>
        </div>
        <span className="inline-flex items-center gap-1.5 rounded-full bg-orange-500/15 px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-orange-600 dark:text-orange-400">
          <Mail className="h-3.5 w-3.5" />
          Turso live
        </span>
      </div>

      <div className="mb-4 flex flex-wrap gap-2">
        {(Object.keys(PERIOD_LABEL) as PeriodType[]).map((option) => (
          <button
            key={option}
            type="button"
            onClick={() => setType(option)}
            className={`rounded-xl px-4 py-2 text-sm font-semibold transition-colors ${
              type === option
                ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/30'
                : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700'
            }`}
          >
            {isEs ? PERIOD_LABEL[option].es : PERIOD_LABEL[option].en}
          </button>
        ))}
        <span className="mx-1 hidden h-8 w-px bg-zinc-200 dark:bg-white/10 sm:block" />
        {(['admin', 'employee'] as Audience[]).map((option) => (
          <button
            key={option}
            type="button"
            onClick={() => setAudience(option)}
            className={`rounded-xl px-4 py-2 text-sm font-semibold transition-colors ${
              audience === option
                ? 'bg-zinc-900 text-white dark:bg-white dark:text-zinc-900'
                : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700'
            }`}
          >
            {option === 'admin' ? labels.partners : labels.team}
          </button>
        ))}
      </div>

      {notice && (
        <div className="mb-4 flex items-start gap-2 rounded-xl border border-emerald-400/40 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-700 dark:text-emerald-300">
          <Check className="mt-0.5 h-4 w-4 shrink-0" />
          {notice}
        </div>
      )}

      {error && (
        <div className="mb-4 flex items-start gap-2 rounded-xl border border-red-400/40 bg-red-500/10 px-4 py-3 text-sm text-red-700 dark:text-red-300">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex items-center gap-2 py-10 text-sm text-zinc-500 dark:text-gray-400">
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-orange-500 border-t-transparent" />
          {labels.loading}
        </div>
      ) : report ? (
        <>
          <div className="mb-4 flex flex-wrap items-center gap-3 text-xs text-zinc-500 dark:text-gray-400">
            <span className="rounded-full bg-zinc-100 px-3 py-1 font-semibold text-zinc-700 dark:bg-zinc-800 dark:text-zinc-200">
              {report.period.label}
            </span>
            <span className="inline-flex items-center gap-1">
              <Users className="h-3.5 w-3.5" />
              {labels.recipients}: {data?.recipients.total ?? 0} ({data?.recipients.admins ?? 0}{' '}
              {labels.partners.toLowerCase()} · {data?.recipients.employees ?? 0}{' '}
              {labels.team.toLowerCase()})
            </span>
          </div>

          <div className="mb-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {report.metrics.map((metric) => (
              <div
                key={metric.label}
                className="rounded-xl border border-zinc-200 bg-zinc-50 p-4 dark:border-white/10 dark:bg-zinc-800/60"
              >
                <p className="text-[11px] uppercase tracking-wider text-zinc-500 dark:text-gray-400">
                  {metric.label}
                </p>
                <p className="mt-1 break-words text-lg font-black text-zinc-900 dark:text-white">
                  {metric.value}
                </p>
                {metric.hint && (
                  <p className="mt-1 text-[11px] text-zinc-500 dark:text-gray-400">{metric.hint}</p>
                )}
              </div>
            ))}
          </div>

          <div className="space-y-5">
            {report.tables.map((table) => (
              <div key={table.title}>
                <h3 className="mb-2 flex items-center gap-2 text-sm font-bold text-zinc-900 dark:text-white">
                  <Activity className="h-4 w-4 text-orange-500" />
                  {table.title}
                </h3>
                <div className="overflow-x-auto rounded-xl border border-zinc-200 dark:border-white/10">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-zinc-100 text-[10px] uppercase tracking-wider text-zinc-500 dark:bg-zinc-800 dark:text-gray-400">
                      <tr>
                        {table.headers.map((header) => (
                          <th key={header} className="px-3 py-2 font-semibold">
                            {header}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {table.rows.length ? (
                        table.rows.map((row, index) => (
                          <tr
                            key={`${table.title}-${index}`}
                            className="border-t border-zinc-100 dark:border-white/5"
                          >
                            {row.map((value, cellIndex) => (
                              <td
                                key={`${table.title}-${index}-${cellIndex}`}
                                className={`px-3 py-2 ${
                                  cellIndex === 0
                                    ? 'font-semibold text-zinc-800 dark:text-zinc-100'
                                    : 'text-zinc-600 dark:text-zinc-300'
                                }`}
                              >
                                {value}
                              </td>
                            ))}
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td
                            colSpan={table.headers.length}
                            className="px-3 py-4 text-zinc-500 dark:text-gray-400"
                          >
                            {table.empty}
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            ))}
          </div>

          {report.notes.length > 0 && (
            <div className="mt-5 rounded-xl bg-zinc-50 p-4 dark:bg-zinc-800/50">
              <p className="mb-2 text-[11px] font-bold uppercase tracking-wider text-zinc-500 dark:text-gray-400">
                {labels.notes}
              </p>
              <ul className="space-y-1 text-xs text-zinc-500 dark:text-gray-400">
                {report.notes.map((note) => (
                  <li key={note}>• {note}</li>
                ))}
              </ul>
            </div>
          )}

          <div className="mt-5 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => void send('all')}
              disabled={sending || !data?.canSend}
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-orange-500 to-orange-600 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-orange-500/30 transition-all disabled:opacity-60"
            >
              <Send className="h-4 w-4" />
              {labels.sendAll}
            </button>
            <button
              type="button"
              onClick={() => void send('self')}
              disabled={sending || !data?.canSend}
              className="inline-flex items-center gap-2 rounded-xl border border-zinc-200 bg-white px-4 py-2.5 text-sm font-semibold text-zinc-700 transition-colors hover:bg-zinc-50 disabled:opacity-60 dark:border-white/10 dark:bg-zinc-800 dark:text-zinc-200 dark:hover:bg-zinc-700"
            >
              <Mail className="h-4 w-4" />
              {labels.sendMe}
            </button>
            <button
              type="button"
              onClick={() => void send('all', true)}
              disabled={sending || !data?.canSend}
              className="inline-flex items-center gap-2 rounded-xl border border-zinc-200 bg-white px-4 py-2.5 text-sm font-semibold text-zinc-700 transition-colors hover:bg-zinc-50 disabled:opacity-60 dark:border-white/10 dark:bg-zinc-800 dark:text-zinc-200 dark:hover:bg-zinc-700"
            >
              <Clock className="h-4 w-4" />
              {labels.retry}
            </button>
          </div>
        </>
      ) : null}

      {data?.history?.length ? (
        <div className="mt-6 border-t border-zinc-200 pt-4 dark:border-white/10">
          <p className="mb-3 text-[11px] font-bold uppercase tracking-wider text-zinc-500 dark:text-gray-400">
            {labels.history}
          </p>
          <div className="space-y-2">
            {data.history.map((entry) => (
              <div
                key={entry.id}
                className="flex flex-col gap-1 rounded-lg bg-zinc-50 px-3 py-2 text-xs dark:bg-zinc-800/50 sm:flex-row sm:items-center sm:justify-between"
              >
                <span className="font-semibold text-zinc-700 dark:text-zinc-200">
                  {entry.period_type} · {entry.period_key} · {entry.recipient_email}
                </span>
                <span className="flex items-center gap-2 text-zinc-500 dark:text-gray-400">
                  <span
                    className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${
                      STATUS_STYLE[entry.status] ?? STATUS_STYLE.pending
                    }`}
                  >
                    {entry.status}
                  </span>
                  {entry.generated_at}
                </span>
              </div>
            ))}
          </div>
        </div>
      ) : null}
    </section>
  )
}
