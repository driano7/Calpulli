// MIT License - Copyright (c) 2024-2026 Donovan Riaño / Calpulli CDMX
// Accept invitation — validates token server-side, then signs in via the
// existing auth provider, then shows the Partner Referral Agreement.
'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import { useAuth } from '@/lib/hooks/useAuth'
import { PageSEO } from '@/components/SEO'

export default function AcceptInvitation() {
  const router = useRouter()
  const { user, isLoading } = useAuth()
  const [info, setInfo] = useState(null)
  const [error, setError] = useState(null)
  const [agreed, setAgreed] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const token = typeof router.query.token === 'string' ? router.query.token : ''

  useEffect(() => {
    if (!token) return
    let cancelled = false
    const load = async () => {
      try {
        const res = await fetch(
          `/api/partners/invitations/validate?token=${encodeURIComponent(token)}`
        )
        const json = await res.json().catch(() => null)
        if (cancelled) return
        if (res.ok && json?.valid) setInfo(json)
        else setError('Esta invitación ya no es válida o expiró.')
      } catch {
        if (!cancelled) setError('No pudimos validar la invitación.')
      }
    }
    void load()
    return () => {
      cancelled = true
    }
  }, [token])

  const login = async (e) => {
    e.preventDefault()
    setBusy(true)
    setError(null)
    try {
      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mode: 'login', email: email.trim(), password }),
      })
      const json = await res.json().catch(() => null)
      if (!res.ok) {
        setError('No pudimos iniciar sesión con ese correo.')
        return
      }
      localStorage.setItem('authToken', json.token)
      localStorage.setItem('authUser', JSON.stringify(json.user))
      window.dispatchEvent(new Event('authChange'))
      await accept(json.token)
    } finally {
      setBusy(false)
    }
  }

  const accept = async (authToken) => {
    setBusy(true)
    try {
      const res = await fetch('/api/partners/invitations/accept', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${authToken}` },
        body: JSON.stringify({ token, agreementAccepted: agreed }),
      })
      const json = await res.json().catch(() => null)
      if (!res.ok) {
        setError(json.error || 'No pudimos activar tu acceso.')
        return
      }
      await router.replace('/partners/dashboard')
    } finally {
      setBusy(false)
    }
  }

  return (
    <>
      <PageSEO
        title="Accept invitation — Partner"
        description="Accept your Calpulli CDMX partner invitation."
      />
      <div className="mx-auto max-w-md px-6 py-24">
        <h1 className="text-3xl font-black">Acepta la invitación</h1>
        {error ? (
          <p className="mt-4 rounded-xl bg-red-50 p-3 text-sm text-red-600 dark:bg-red-500/10 dark:text-red-300">
            {error}
          </p>
        ) : null}
        {!error && info ? (
          <p className="mt-3 text-sm text-zinc-600 dark:text-zinc-300">
            Invitado a <strong>{info.partnerName}</strong> como <strong>{info.role}</strong>.
          </p>
        ) : null}
        {info && !user ? (
          <form onSubmit={login} className="mt-6 grid gap-3">
            <p className="text-xs text-zinc-500">Inicia sesión con el correo invitado.</p>
            <input
              type="email"
              required
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="rounded-xl border px-3 py-2.5 text-sm dark:border-white/10 dark:bg-zinc-900"
            />
            <input
              type="password"
              required
              placeholder="Contraseña"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="rounded-xl border px-3 py-2.5 text-sm dark:border-white/10 dark:bg-zinc-900"
            />
            <button
              type="submit"
              disabled={busy}
              className="rounded-xl bg-orange-500 px-6 py-3 font-semibold text-white disabled:opacity-50"
            >
              {busy ? '…' : 'Iniciar sesión'}
            </button>
          </form>
        ) : null}
        {info && user ? (
          <div className="mt-6 rounded-2xl border border-zinc-200 p-4 dark:border-white/10">
            <p className="text-sm font-bold">Partner Referral Agreement</p>
            <p className="mt-2 text-xs text-zinc-600 dark:text-zinc-300">
              Tu enlace dará 10% de descuento a huéspedes elegibles y tu propiedad recibirá comisión
              solo en reservas elegibles completadas. Sin mínimo de ventas. Transportes no incluidos
              salvo indicación expresa.
            </p>
            <label className="mt-3 flex items-start gap-2 text-xs">
              <input
                type="checkbox"
                checked={agreed}
                onChange={(e) => setAgreed(e.target.checked)}
              />
              <span>Acepto el Partner Referral Agreement (v2026-09).</span>
            </label>
            <button
              type="button"
              disabled={!agreed || busy}
              onClick={() => void accept(localStorage.getItem('authToken'))}
              className="mt-3 w-full rounded-xl bg-orange-500 px-6 py-3 font-semibold text-white disabled:opacity-50"
            >
              {busy ? '…' : 'Aceptar y entrar al panel'}
            </button>
          </div>
        ) : null}
        {!info && !error && isLoading ? (
          <p className="mt-6 text-sm text-zinc-500">Validando…</p>
        ) : null}
      </div>
    </>
  )
}
