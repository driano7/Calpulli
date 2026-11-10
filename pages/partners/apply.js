// MIT License - Copyright (c) 2024-2026 Donovan Riaño / Calpulli CDMX
'use client'

import { useState } from 'react'
import { PageSEO } from '@/components/SEO'

export default function PartnersApply() {
  const [form, setForm] = useState({
    businessName: '',
    type: 'HOSTEL',
    contactPerson: '',
    email: '',
    phone: '',
    city: '',
    message: '',
  })
  const [done, setDone] = useState(false)
  const [error, setError] = useState(null)

  const submit = async (e) => {
    e.preventDefault()
    setError(null)
    const res = await fetch('/api/partners/apply', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })
    if (!res.ok) {
      const json = await res.json().catch(() => ({}))
      setError(json.error || 'Error')
      return
    }
    setDone(true)
  }

  return (
    <>
      <PageSEO
        title="Apply — Partner with Calpulli CDMX"
        description="Apply for the Calpulli CDMX partner program."
      />
      <div className="mx-auto max-w-xl px-6 py-24">
        <h1 className="text-3xl font-black">Solicita la alianza</h1>
        <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-300">
          Las cuentas son por invitación. Déjanos tus datos y te contactamos. Sin costo dentro del
          piloto de 60 días.
        </p>
        {done ? (
          <p className="mt-6 rounded-xl bg-emerald-50 p-4 text-sm text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300">
            Recibimos tu solicitud. Te contactaremos para la invitación.
          </p>
        ) : (
          <form onSubmit={submit} className="mt-6 grid gap-3">
            <input
              required
              placeholder="Nombre del negocio"
              value={form.businessName}
              onChange={(e) => setForm({ ...form, businessName: e.target.value })}
              className="rounded-xl border px-3 py-2.5 text-sm dark:border-white/10 dark:bg-zinc-900"
            />
            <input
              required
              type="email"
              placeholder="Email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              className="rounded-xl border px-3 py-2.5 text-sm dark:border-white/10 dark:bg-zinc-900"
            />
            <div className="grid grid-cols-2 gap-3">
              <select
                value={form.type}
                onChange={(e) => setForm({ ...form, type: e.target.value })}
                className="rounded-xl border px-3 py-2.5 text-sm dark:border-white/10 dark:bg-zinc-900"
              >
                <option value="HOTEL">Hotel</option>
                <option value="HOSTEL">Hostal</option>
                <option value="BOUTIQUE">Boutique</option>
                <option value="OTHER">Otro</option>
              </select>
              <input
                placeholder="Ciudad"
                value={form.city}
                onChange={(e) => setForm({ ...form, city: e.target.value })}
                className="rounded-xl border px-3 py-2.5 text-sm dark:border-white/10 dark:bg-zinc-900"
              />
            </div>
            <input
              placeholder="Contacto (nombre)"
              value={form.contactPerson}
              onChange={(e) => setForm({ ...form, contactPerson: e.target.value })}
              className="rounded-xl border px-3 py-2.5 text-sm dark:border-white/10 dark:bg-zinc-900"
            />
            <input
              placeholder="Teléfono / WhatsApp"
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              className="rounded-xl border px-3 py-2.5 text-sm dark:border-white/10 dark:bg-zinc-900"
            />
            <textarea
              placeholder="Mensaje (opcional)"
              value={form.message}
              onChange={(e) => setForm({ ...form, message: e.target.value })}
              className="rounded-xl border px-3 py-2.5 text-sm dark:border-white/10 dark:bg-zinc-900"
              rows={4}
            />
            {error ? <p className="text-xs text-red-500">{error}</p> : null}
            <button
              type="submit"
              className="rounded-xl bg-orange-500 px-6 py-3 font-semibold text-white"
            >
              Enviar solicitud
            </button>
          </form>
        )}
      </div>
    </>
  )
}
