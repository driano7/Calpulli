// MIT License - Copyright (c) 2024-2026 Donovan Riaño / Calpulli CDMX
'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import DashboardLayout from '@/components/partners/dashboard/DashboardLayout'
import { formatPriceMXN } from '@/lib/currency'

export default function ReportsPage() {
  const router = useRouter()
  const [overview, setOverview] = useState(null)
  const partnerId = router.query.partnerId || ''

  useEffect(() => {
    let cancelled = false
    const load = async () => {
      try {
        const token = localStorage.getItem('authToken')
        const q = new URLSearchParams({ preset: '30d' })
        if (partnerId) q.set('partnerId', partnerId)
        const res = await fetch(`/api/partners/dashboard/overview?${q}`, {
          headers: { Authorization: token ? `Bearer ${token}` : '' },
        })
        const json = await res.json().catch(() => null)
        if (!cancelled && res.ok) setOverview(json.overview)
      } catch {
        void 0
      }
    }
    void load()
    return () => {
      cancelled = true
    }
  }, [partnerId])

  const downloadCsv = async () => {
    const token = localStorage.getItem('authToken')
    const q = new URLSearchParams({ preset: '30d' })
    if (partnerId) q.set('partnerId', partnerId)
    const res = await fetch(`/api/partners/dashboard/reports?${q}`, {
      headers: { Authorization: token ? `Bearer ${token}` : '' },
    })
    const blob = await res.blob()
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `partner-report-${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <DashboardLayout>
      <section
        className="rounded-2xl border border-zinc-200 bg-white/80 p-5 dark:border-white/10 dark:bg-zinc-900/50 print:border-black"
        id="printable"
      >
        <h2 className="font-bold">Informe mensual de socio</h2>
        {overview ? (
          <dl className="mt-3 grid gap-2 text-sm sm:grid-cols-2">
            <div className="flex justify-between">
              <dt>Periodo</dt>
              <dd>
                {overview.range.from} → {overview.range.to}
              </dd>
            </div>
            <div className="flex justify-between">
              <dt>Visitas</dt>
              <dd>{overview.visits}</dd>
            </div>
            <div className="flex justify-between">
              <dt>Reservas</dt>
              <dd>{overview.confirmedBookings}</dd>
            </div>
            <div className="flex justify-between">
              <dt>Journeys completados</dt>
              <dd>{overview.completedBookings}</dd>
            </div>
            <div className="flex justify-between">
              <dt>Huéspedes</dt>
              <dd>{overview.guestsBooked}</dd>
            </div>
            <div className="flex justify-between">
              <dt>Ingresos generados</dt>
              <dd>{formatPriceMXN(overview.gross, 'es')}</dd>
            </div>
            <div className="flex justify-between">
              <dt>Descuento invitado</dt>
              <dd>{formatPriceMXN(overview.discounts, 'es')}</dd>
            </div>
            <div className="flex justify-between">
              <dt>Comisión socio</dt>
              <dd>{formatPriceMXN(overview.payableCommission + overview.paidCommission, 'es')}</dd>
            </div>
          </dl>
        ) : (
          <p className="mt-2 text-sm text-zinc-500">Cargando…</p>
        )}
        <p className="mt-4 rounded bg-zinc-100 p-2 text-center text-xs font-semibold dark:bg-zinc-800">
          Este informe no es una factura fiscal. / This report is not a tax invoice.
        </p>
      </section>

      <div className="mt-4 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => void downloadCsv()}
          className="rounded-xl bg-orange-500 px-4 py-2 text-sm font-semibold text-white"
        >
          Descargar CSV (UTF-8 Excel)
        </button>
        <button
          type="button"
          onClick={() => window.print()}
          className="rounded-xl border px-4 py-2 text-sm font-semibold"
        >
          Imprimir informe mensual
        </button>
      </div>
    </DashboardLayout>
  )
}
