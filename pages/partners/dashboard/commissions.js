// MIT License - Copyright (c) 2024-2026 Donovan Riaño / Calpulli CDMX
'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import DashboardLayout from '@/components/partners/dashboard/DashboardLayout'
import { formatPriceMXN } from '@/lib/currency'

const GROUPS = ['PENDING', 'CONFIRMED', 'PAYABLE', 'PAID', 'REVERSED']

export default function CommissionsPage() {
  const router = useRouter()
  const [rows, setRows] = useState([])
  const [totals, setTotals] = useState(null)
  const partnerId = router.query.partnerId || ''

  useEffect(() => {
    let cancelled = false
    const load = async () => {
      try {
        const token = localStorage.getItem('authToken')
        const q = new URLSearchParams({ preset: '30d' })
        if (partnerId) q.set('partnerId', partnerId)
        const res = await fetch(`/api/partners/dashboard/commissions?${q}`, {
          headers: { Authorization: token ? `Bearer ${token}` : '' },
        })
        const json = await res.json().catch(() => null)
        if (!cancelled && res.ok) {
          setRows(json.commissions || [])
          setTotals(json.totals || null)
        }
      } catch {
        void 0
      }
    }
    void load()
    return () => {
      cancelled = true
    }
  }, [partnerId])

  return (
    <DashboardLayout>
      {totals ? (
        <div className="mb-4 grid gap-3 sm:grid-cols-5">
          {GROUPS.map((g) => (
            <div key={g} className="rounded-xl bg-zinc-100 p-3 text-center dark:bg-zinc-800">
              <p className="text-[11px] font-bold uppercase tracking-widest text-zinc-500">{g}</p>
              <p className="text-sm font-black">{formatPriceMXN(totals[g] || 0, 'es')}</p>
            </div>
          ))}
        </div>
      ) : null}
      {rows.length === 0 ? (
        <p className="rounded-xl bg-zinc-100 p-4 text-sm text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300">
          Aún no hay comisiones pagables. Las comisiones se vuelven pagables después de Journeys
          elegibles completados.
        </p>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-zinc-200 dark:border-white/10">
          <table className="w-full min-w-[760px] text-xs">
            <thead className="bg-zinc-100 text-left text-zinc-500 dark:bg-zinc-800">
              <tr>
                <th className="p-2">Referencia</th>
                <th className="p-2">Fecha Journey</th>
                <th className="p-2">Base</th>
                <th className="p-2">Tasa</th>
                <th className="p-2">Comisión</th>
                <th className="p-2">Estado</th>
                <th className="p-2">Pagable</th>
                <th className="p-2">Pagada</th>
                <th className="p-2">Payout</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr
                  key={r.bookingReference}
                  className="border-t border-zinc-200 dark:border-white/10"
                >
                  <td className="p-2 font-mono">{r.bookingReference}</td>
                  <td className="p-2">{r.journeyDate}</td>
                  <td className="p-2">{formatPriceMXN(r.commissionBase, 'es')}</td>
                  <td className="p-2">{(r.commissionRate * 100).toFixed(0)}%</td>
                  <td className="p-2">{formatPriceMXN(r.commissionAmount, 'es')}</td>
                  <td className="p-2">{r.status}</td>
                  <td className="p-2">{r.payableDate?.slice(0, 10) || '—'}</td>
                  <td className="p-2">{r.paidDate?.slice(0, 10) || '—'}</td>
                  <td className="p-2">{r.payoutReference || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </DashboardLayout>
  )
}
