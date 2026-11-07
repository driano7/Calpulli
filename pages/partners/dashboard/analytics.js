// MIT License - Copyright (c) 2024-2026 Donovan Riaño / Calpulli CDMX
'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import DashboardLayout from '@/components/partners/dashboard/DashboardLayout'
import { SequentialBarChart, SequentialLineChart } from '@/components/charts/AnimatedCharts'

export default function AnalyticsPage() {
  const router = useRouter()
  const [data, setData] = useState(null)
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

  const series = data?.series || []
  const bd = data?.breakdowns || { byJourney: [], byPlacement: [], byCampaign: [] }

  return (
    <DashboardLayout>
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
    </DashboardLayout>
  )
}
