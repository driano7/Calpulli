// MIT License - Copyright (c) 2024-2026 Donovan Riaño / Calpulli CDMX
'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import DashboardLayout from '@/components/partners/dashboard/DashboardLayout'
import {
  StatCard,
  SequentialBarChart,
  SequentialLineChart,
} from '@/components/charts/AnimatedCharts'
import { formatPriceMXN } from '@/lib/currency'

export default function AnalyticsPage() {
  const router = useRouter()
  const [data, setData] = useState(null)
  const [insights, setInsights] = useState(null)
  const partnerId = router.query.partnerId || ''

  useEffect(() => {
    let cancelled = false
    const load = async () => {
      try {
        const token = localStorage.getItem('authToken')
        const q = new URLSearchParams({ preset: '30d' })
        if (partnerId) q.set('partnerId', partnerId)
        const res = await fetch(`/api/partners/dashboard/analytics?${q}`, {
          headers: { Authorization: token ? `Bearer ${token}` : '' },
        })
        const json = await res.json().catch(() => null)
        if (!cancelled && res.ok) setData(json)
      } catch {
        void 0
      }
    }
    void load()
    return () => {
      cancelled = true
    }
  }, [partnerId])

  useEffect(() => {
    let cancelled = false
    const load = async () => {
      try {
        const token = localStorage.getItem('authToken')
        const q = new URLSearchParams({ preset: '30d' })
        if (partnerId) q.set('partnerId', partnerId)
        const res = await fetch(`/api/partners/dashboard/insights?${q}`, {
          headers: { Authorization: token ? `Bearer ${token}` : '' },
        })
        const json = await res.json().catch(() => null)
        if (!cancelled && res.ok) setInsights(json.insights)
      } catch {
        void 0
      }
    }
    void load()
    return () => {
      cancelled = true
    }
  }, [partnerId])

  const series = data?.series || []
  const bd = data?.breakdowns || { byJourney: [], byPlacement: [], byCampaign: [] }
  const o = data?.overview
  const commissionTotal = o
    ? (o.pendingCommission || 0) + (o.payableCommission || 0) + (o.paidCommission || 0)
    : 0
  const missed = insights?.missedDemand || []
  const chat = insights?.chat
  const topTopicCount = chat?.byTopic?.[0]?.count || 0
  const materialsHref = `/partners/dashboard/materials${partnerId ? `?partnerId=${partnerId}` : ''}`

  return (
    <DashboardLayout>
      {o ? (
        <section className="mb-4 rounded-2xl border border-black/10 bg-white p-5 dark:border-white/10 dark:bg-zinc-900">
          <h2 className="text-base font-semibold">Tu embudo — últimos 30 días</h2>
          <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
            Tu link trajo {o.visits} visitas y {o.confirmedBookings} reservas: conversión de{' '}
            {(o.conversionRate * 100).toFixed(1)}% y {formatPriceMXN(commissionTotal, 'es')} de
            comisión generada.
          </p>
          <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
            <StatCard label="Visitas" value={o.visits} />
            <StatCard label="Sesiones únicas" value={o.uniqueSessions} />
            <StatCard label="Checkouts iniciados" value={o.checkoutStarts} />
            <StatCard label="Reservas" value={o.confirmedBookings} />
            <StatCard label="Conversión" value={`${(o.conversionRate * 100).toFixed(1)}%`} />
            <StatCard label="Comisión generada" value={formatPriceMXN(commissionTotal, 'es')} />
          </div>
        </section>
      ) : null}
      <div className="grid gap-4 lg:grid-cols-2">
        <SequentialBarChart
          data={series.map((s) => ({ label: s.day.slice(5), bookings: s.bookings }))}
          title="Reservas por día"
          dataKey="bookings"
          nameKey="label"
          pngFilename="partner-bookings"
        />
        <SequentialLineChart
          data={series.map((s) => ({
            day: s.day.slice(5),
            discounts: s.discounts,
            commission: s.commission,
          }))}
          title="Descuentos y comisiones"
          lines={[
            { dataKey: 'discounts', name: 'Descuentos', color: '#a855f7' },
            { dataKey: 'commission', name: 'Comisión', color: '#22c55e' },
          ]}
          xKey="day"
          pngFilename="partner-discounts"
        />
        <SequentialBarChart
          data={bd.byJourney.map((r) => ({
            label: String(r.label).slice(0, 18),
            revenue: r.revenue,
          }))}
          title="Por Journey (revenue)"
          dataKey="revenue"
          nameKey="label"
          layout="horizontal"
          pngFilename="partner-by-journey"
        />
        <SequentialBarChart
          data={bd.byPlacement.map((r) => ({
            label: String(r.label).slice(0, 18),
            revenue: r.revenue,
          }))}
          title="Por placement"
          dataKey="revenue"
          nameKey="label"
          layout="horizontal"
          pngFilename="partner-by-placement"
        />
        <SequentialBarChart
          data={bd.byCampaign.map((r) => ({
            label: String(r.label).slice(0, 18),
            revenue: r.revenue,
          }))}
          title="Por campaña"
          dataKey="revenue"
          nameKey="label"
          layout="horizontal"
          pngFilename="partner-by-campaign"
        />
        <SequentialBarChart
          data={[
            { label: 'Completadas', value: data?.overview?.completedBookings || 0 },
            { label: 'Canceladas', value: data?.overview?.cancelledRefunded || 0 },
          ]}
          title="Completadas vs canceladas"
          dataKey="value"
          nameKey="label"
          pngFilename="partner-completed-vs-cancelled"
        />
      </div>
      {missed.length > 0 ? (
        <section className="mt-4 rounded-2xl border border-amber-300/60 bg-amber-50 p-5 dark:border-amber-400/20 dark:bg-amber-950/30">
          <h2 className="text-base font-semibold">Demanda que se te escapa</h2>
          <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
            Esto está buscando la gente y por tu link todavía no llega.
          </p>
          <div className="mt-3 grid gap-3 md:grid-cols-3">
            {missed.map((m) => (
              <article
                key={m.slug}
                className="rounded-xl bg-white p-4 shadow-sm dark:bg-zinc-900"
              >
                <h3 className="font-semibold">{m.name}</h3>
                <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">{m.action}</p>
                <a
                  href={materialsHref}
                  className="mt-2 inline-block text-sm font-medium text-orange-600 hover:underline"
                >
                  Generar el QR en Materiales →
                </a>
              </article>
            ))}
          </div>
        </section>
      ) : null}
      {chat && chat.totalQuestions > 0 ? (
        <section className="mt-4 rounded-2xl border border-black/10 bg-white p-5 dark:border-white/10 dark:bg-zinc-900">
          <h2 className="text-base font-semibold">Lo que más preguntan al asistente</h2>
          <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
            {chat.totalQuestions} preguntas en los últimos 30 días, en todo Calpulli. Sin datos
            personales: las preguntas se muestran redactadas.
          </p>
          <div className="mt-4 grid gap-6 md:grid-cols-2">
            <div>
              <h3 className="text-sm font-semibold">Por tema</h3>
              <ul className="mt-2 space-y-2">
                {chat.byTopic.map((t) => (
                  <li key={t.key} className="text-sm">
                    <div className="flex items-baseline justify-between gap-2">
                      <span>{t.label}</span>
                      <span className="font-medium">{t.count}</span>
                    </div>
                    <div className="mt-1 h-1.5 overflow-hidden rounded bg-zinc-200 dark:bg-zinc-800">
                      <div
                        className="h-full rounded bg-orange-500"
                        style={{
                          width: `${topTopicCount ? Math.round((t.count / topTopicCount) * 100) : 0}%`,
                        }}
                      />
                    </div>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h3 className="text-sm font-semibold">Preguntas más repetidas</h3>
              <ul className="mt-2 space-y-2">
                {chat.topQuestions.map((q, i) => (
                  <li key={i} className="flex items-baseline justify-between gap-3 text-sm">
                    <span className="text-zinc-700 dark:text-zinc-300">{q.question}</span>
                    <span className="shrink-0 font-medium">×{q.count}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>
      ) : null}
    </DashboardLayout>
  )
}
