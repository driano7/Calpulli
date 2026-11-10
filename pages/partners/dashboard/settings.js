// MIT License - Copyright (c) 2024-2026 Donovan Riaño / Calpulli CDMX
'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import DashboardLayout from '@/components/partners/dashboard/DashboardLayout'

export default function SettingsPage() {
  const router = useRouter()
  const [partner, setPartner] = useState(null)
  const [form, setForm] = useState({})
  const [notice, setNotice] = useState(null)
  const partnerId = router.query.partnerId || ''

  useEffect(() => {
    let cancelled = false
    const load = async () => {
      try {
        const token = localStorage.getItem('authToken')
        const q = new URLSearchParams()
        if (partnerId) q.set('partnerId', partnerId)
        const res = await fetch(`/api/partners/dashboard/settings?${q}`, {
          headers: { Authorization: token ? `Bearer ${token}` : '' },
        })
        const json = await res.json().catch(() => null)
        if (!cancelled && res.ok) {
          setPartner(json.partner)
          setForm({
            name: json.partner.name || '',
            websiteUrl: json.partner.websiteUrl || '',
            contactPerson: json.partner.contactPerson || '',
            contactEmail: json.partner.contactEmail || '',
            contactPhone: json.partner.contactPhone || '',
            logoUrl: json.partner.logoUrl || '',
            preferredLanguage: json.partner.preferredLanguage || 'es',
          })
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

  const save = async () => {
    const token = localStorage.getItem('authToken')
    const res = await fetch('/api/partners/dashboard/settings', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ partnerId: partnerId || undefined, ...form }),
    })
    const json = await res.json().catch(() => ({}))
    setNotice(res.ok ? 'Guardado.' : json.error || 'Error')
  }

  if (!partner)
    return (
      <DashboardLayout>
        <p className="text-sm text-zinc-500">Cargando…</p>
      </DashboardLayout>
    )

  return (
    <DashboardLayout>
      <div className="grid gap-3 sm:grid-cols-2">
        {[
          ['name', 'Nombre público'],
          ['websiteUrl', 'Website (http/https)'],
          ['contactPerson', 'Contacto'],
          ['contactEmail', 'Email de contacto'],
          ['contactPhone', 'Teléfono'],
          ['logoUrl', 'Logo (http/https o /ruta)'],
        ].map(([key, label]) => (
          <label key={key} className="text-xs">
            <span className="text-zinc-500">{label}</span>
            <input
              value={form[key] || ''}
              onChange={(e) => setForm({ ...form, [key]: e.target.value })}
              className="mt-1 w-full rounded-lg border px-2.5 py-2 text-sm dark:border-white/10 dark:bg-zinc-950"
            />
          </label>
        ))}
        <label className="text-xs">
          <span className="text-zinc-500">Idioma preferido</span>
          <select
            value={form.preferredLanguage || 'es'}
            onChange={(e) => setForm({ ...form, preferredLanguage: e.target.value })}
            className="mt-1 w-full rounded-lg border px-2.5 py-2 text-sm dark:border-white/10 dark:bg-zinc-950"
          >
            <option value="es">ES</option>
            <option value="en">EN</option>
          </select>
        </label>
      </div>
      <p className="mt-3 text-[11px] text-zinc-400">
        Descuento {(partner.guestDiscountPct * 100).toFixed(0)}% · Comisión{' '}
        {(partner.commissionPct * 100).toFixed(0)}% (fijos de Calpulli CDMX) — no editables aquí.
      </p>
      <button
        type="button"
        onClick={() => void save()}
        className="mt-3 rounded-xl bg-orange-500 px-4 py-2 text-sm font-semibold text-white"
      >
        Guardar
      </button>
      {notice ? <p className="mt-2 text-xs text-zinc-500">{notice}</p> : null}
    </DashboardLayout>
  )
}
