// MIT License - Copyright (c) 2024-2026 Donovan Riaño / Calpulli CDMX
'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import DashboardLayout from '@/components/partners/dashboard/DashboardLayout'
import { formatPriceMXN } from '@/lib/currency'

export default function BookingsPage() {
  const router = useRouter()
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)
  const partnerId = router.query.partnerId || ''

  useEffect(() => {
    let cancelled = false
    const load = async () => {
      try {
        const token = localStorage.getItem('authToken')
        const q = new URLSearchParams({ preset: '30d' })
        if (partnerId) q.set('partnerId', partnerId)
        const res = await fetch(`/api/partners/dashboard/bookings?${q}`, {
          headers: { Authorization: token ? `Bearer ${token}` : '' },
        })
        const json = await res.json().catch(() => null)
        if (!cancelled && res.ok) setRows(json.bookings || [])
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    void load()
    return () => {
      cancelled = true
    }
  }, [partnerId])

  return (
    <DashboardLayout>
      {loading ? <p className="text-sm text-zinc-500">Cargando…</p> : null}
      {!loading && rows.length === 0 ? (
        <p className="rounded-xl bg-zinc-100 p-4 text-sm text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300">
          Aún no hay reservas. Prueba colocar tu QR donde los huéspedes planifican sus actividades.
        </p>
      ) : null}
      <div className="overflow-x-auto rounded-2xl border border-zinc-200 dark:border-white/10">
        <table className="w-full min-w-[800px] text-xs">
          <thead className="bg-zinc-100 text-left text-zinc-500 dark:bg-zinc-800">
            <tr>
              <th className="p-2">Referencia</th>
              <th className="p-2">Journey</th>
              <th className="p-2">Fecha</th>
              <th className="p-2">Invitados</th>
              <th className="p-2">Pagado</th>
              <th className="p-2">Descuento</th>
              <th className="p-2">Comisión</th>
              <th className="p-2">Estado</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((b) => (
              <tr key={b.bookingId} className="border-t border-zinc-200 dark:border-white/10">
                <td className="p-2 font-mono">{b.bookingReference}</td>
                <td className="p-2">{b.journey}</td>
                <td className="p-2">{b.startDate}</td>
                <td className="p-2">{b.guests}</td>
                <td className="p-2">{formatPriceMXN(b.amountPaid, 'es')}</td>
                <td className="p-2">{formatPriceMXN(b.guestDiscount, 'es')}</td>
                <td className="p-2">{formatPriceMXN(b.commissionAmount, 'es')}</td>
                <td className="p-2">
                  {b.bookingStatus} / {b.commissionStatus}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </DashboardLayout>
  )
}
