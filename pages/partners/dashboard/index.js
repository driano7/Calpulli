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

const PRESETS = [
  ['7d', 'Últimos 7 días'],
  ['30d', 'Últimos 30 días'],
  ['this-month', 'Este mes'],
  ['prev-month', 'Mes anterior'],
  ['custom', 'Personalizado'],
]

export default function OverviewPage() {
  const router = useRouter()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [preset, setPreset] = useState('30d')
  const partnerId = router.query.partnerId || ''

  useEffect(() => {
    let cancelled = false
    const load = async () => {
      setLoading(true)
      try {
        const token = localStorage.getItem('authToken')
        const q = new URLSearchParams({ preset })
        if (partnerId) q.set('partnerId', partnerId)
        const res = await fetch(`/api/partners/dashboard/overview?${q}`, {
          headers: { Authorization: token ? `Bearer ${token}` : '' },
        })
        const json = await res.json().catch(() => null)
        if (!cancelled && res.ok) setData(json)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    void load()
    return () => {
      cancelled = true
    }
  }, [preset, partnerId])

  const o = data?.overview

  return (
    <DashboardLayout>
      <div className="mb-4 flex flex-wrap gap-2">
        {PRESETS.map(([value, label]) => (
          <button
            key={value}
            type="button"
            onClick={() => setPreset(value)}
            className={`rounded-full px-3 py-1 text-xs font-semibold ${
              preset === value ? 'bg-orange-500 text-white' : 'bg-zinc-100 dark:bg-zinc-800'
            }`}
          >
            {label}
          </button>
        ))}
        <span className="ml-auto text-[11px] text-zinc-400">
          {o ? `${o.range.from} → ${o.range.to}` : ''} · MXN · America/Mexico_City
        </span>
      </div>

      {loading ? <p className="text-sm text-zinc-500">Cargando…</p> : null}
      {!loading && o && o.visits === 0 && o.confirmedBookings === 0 ? (
        <div className="mb-4 rounded-xl bg-amber-50 p-4 text-sm text-amber-800 dark:bg-amber-500/10 dark:text-amber-200">
          Tu enlace de referido está listo. Compartirlo o descarga un QR para empezar a recibir
          visitas.
        </div>
      ) : null}
      {!loading && o && o.confirmedBookings === 0 && o.visits > 0 ? (
        <div className="mb-4 rounded-xl bg-amber-50 p-4 text-sm text-amber-800 dark:bg-amber-500/10 dark:text-amber-200">
          Aún no hay reservas. Prueba colocar tu QR donde los huéspedes planifican sus actividades.
        </div>
      ) : null}

      {o ? (
        <>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard label="Visitas" value={o.visits} />
            <StatCard label="Sesiones únicas" value={o.uniqueSessions} />
            <StatCard label="Vistas Journey" value={o.journeyViews} />
            <StatCard label="Checkout starts" value={o.checkoutStarts} />
            <StatCard label="Reservas confirmadas" value={o.confirmedBookings} />
            <StatCard label="Completadas" value={o.completedBookings} />
            <StatCard label="Canceladas/Reembolsadas" value={o.cancelledRefunded} />
            <StatCard label="Huéspedes" value={o.guestsBooked} />
            <StatCard label="Bruto" value={formatPriceMXN(o.gross, 'es')} />
            <StatCard label="Descuentos" value={formatPriceMXN(o.discounts, 'es')} />
            <StatCard label="Neto pagado" value={formatPriceMXN(o.net, 'es')} />
            <StatCard label="Conversión" value={`${(o.conversionRate * 100).toFixed(1)}%`} />
            <StatCard
              label="Comisión pendiente"
              value={formatPriceMXN(o.pendingCommission, 'es')}
            />
            <StatCard label="Comisión pagable" value={formatPriceMXN(o.payableCommission, 'es')} />
            <StatCard label="Comisión pagada" value={formatPriceMXN(o.paidCommission, 'es')} />
          </div>
          <div className="mt-4 grid gap-4 lg:grid-cols-2">
            <SequentialBarChart
              data={(data.series || []).map((s) => ({ label: s.day.slice(5), visits: s.visits }))}
              title="Visitas por día"
              dataKey="visits"
              nameKey="label"
              pngFilename="partner-visits"
            />
            <SequentialLineChart
              data={(data.series || []).map((s) => ({
                day: s.day.slice(5),
                revenue: s.revenue,
                commission: s.commission,
              }))}
              title="Ingresos y comisión"
              lines={[
                { dataKey: 'revenue', name: 'Neto MXN', color: '#f97316' },
                { dataKey: 'commission', name: 'Comisión MXN', color: '#22c55e' },
              ]}
              xKey="day"
              pngFilename="partner-revenue"
            />
          </div>
        </>
      ) : null}
    </DashboardLayout>
  )
}
