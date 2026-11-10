// MIT License - Copyright (c) 2024-2026 Donovan Riaño / Calpulli CDMX
// Partner login — reuses existing Amaxing auth provider (/api/auth).
// No second auth system. After login, partner membership gates the dashboard.
'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import Link from '@/components/Link'
import { useAuth } from '@/lib/hooks/useAuth'
import { PageSEO } from '@/components/SEO'

export default function PartnersLogin() {
  const router = useRouter()
  const { user, isLoading } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  // If already signed in with a partner membership → dashboard.
  useEffect(() => {
    if (!isLoading && user) {
      void router.replace('/partners/dashboard')
    }
  }, [isLoading, user, router])

  const submit = async (e) => {
    e.preventDefault()
    setError('')
    setBusy(true)
    try {
      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mode: 'login', email: email.trim(), password }),
      })
      const json = await res.json().catch(() => ({}))
      if (!res.ok) {
        setError(json.message || 'Credenciales inválidas')
        return
      }
      localStorage.setItem('authToken', json.token)
      localStorage.setItem('authUser', JSON.stringify(json.user))
      window.dispatchEvent(new Event('authChange'))
      // Membership gate lives in /api/partners/me + dashboard APIs.
      await router.replace('/partners/dashboard')
    } catch {
      setError('Error de red')
    } finally {
      setBusy(false)
    }
  }

  return (
    <>
      <PageSEO
        title="Partner login — Calpulli CDMX"
        description="Access your Calpulli CDMX partner dashboard."
      />
      <div className="mx-auto max-w-md px-6 py-24">
        <h1 className="text-3xl font-black">Partner login</h1>
        <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-300">
          Usa tu cuenta de Calpulli CDMX. Solo verás tu propiedad.
        </p>
        <form onSubmit={submit} className="mt-6 grid gap-3">
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
          {error ? <p className="text-xs text-red-500">{error}</p> : null}
          <button
            type="submit"
            disabled={busy}
            className="rounded-xl bg-orange-500 px-6 py-3 font-semibold text-white disabled:opacity-50"
          >
            {busy ? 'Entrando…' : 'Entrar al panel de socio'}
          </button>
        </form>
        <p className="mt-4 text-xs text-zinc-500">
          ¿No tienes invitación? Habla con tu equipo de Calpulli CDMX o solicita desde{' '}
          <Link href="/partners/apply" className="underline">
            /partners/apply
          </Link>
          .
        </p>
      </div>
    </>
  )
}
