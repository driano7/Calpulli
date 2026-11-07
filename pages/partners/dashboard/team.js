// MIT License - Copyright (c) 2024-2026 Donovan Riaño / Calpulli CDMX
'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import DashboardLayout from '@/components/partners/dashboard/DashboardLayout'

export default function TeamPage() {
  const router = useRouter()
  const [members, setMembers] = useState([])
  const [invitations, setInvitations] = useState([])
  const [email, setEmail] = useState('')
  const [role, setRole] = useState('VIEWER')
  const [notice, setNotice] = useState(null)
  const partnerId = router.query.partnerId || ''

  const load = async () => {
    const token = localStorage.getItem('authToken')
    const q = new URLSearchParams()
    if (partnerId) q.set('partnerId', partnerId)
    const res = await fetch(`/api/partners/dashboard/team?${q}`, {
      headers: { Authorization: token ? `Bearer ${token}` : '' },
    })
    const json = await res.json().catch(() => null)
    if (res.ok) {
      setMembers(json.members || [])
      setInvitations(json.invitations || [])
    }
  }

  useEffect(() => {
    void load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [partnerId])

  const post = async (action, extra = {}) => {
    const token = localStorage.getItem('authToken')
    const res = await fetch('/api/partners/dashboard/team', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ action, partnerId: partnerId || undefined, ...extra }),
    })
    const json = await res.json().catch(() => ({}))
    if (!res.ok) return json.error || 'error'
    setNotice(isEs() ? 'Listo.' : 'Done.')
    await load()
    return null
  }

  const isEs = () => false

  const invite = async () => {
    const err = await post('invite', { email, role })
    if (err) setNotice(err)
    else setEmail('')
  }

  return (
    <DashboardLayout>
      <div className="mb-4 rounded-2xl border border-zinc-200 bg-white/80 p-4 dark:border-white/10 dark:bg-zinc-900/50">
        <p className="font-bold">Invitar (OWNER)</p>
        <div className="mt-2 flex flex-wrap gap-2">
          <input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="correo@hotels.com"
            className="min-w-[220px] flex-1 rounded-lg border px-3 py-2 text-sm dark:border-white/10 dark:bg-zinc-950"
          />
          <select
            value={role}
            onChange={(e) => setRole(e.target.value)}
            className="rounded-lg border px-2 py-2 text-sm dark:border-white/10 dark:bg-zinc-950"
          >
            <option>MANAGER</option>
            <option>STAFF</option>
            <option>VIEWER</option>
            <option>OWNER</option>
          </select>
          <button
            type="button"
            onClick={() => void invite()}
            className="rounded-xl bg-orange-500 px-4 py-2 text-sm font-semibold text-white"
          >
            Invitar
          </button>
        </div>
        {notice ? <p className="mt-2 text-xs text-zinc-500">{notice}</p> : null}
      </div>

      <h2 className="mb-2 font-bold">Miembros</h2>
      <div className="space-y-2">
        {members.map((m) => (
          <div
            key={m.id}
            className="flex flex-wrap items-center justify-between gap-2 rounded-xl bg-zinc-100 p-3 text-xs dark:bg-zinc-800"
          >
            <span>
              {m.email || m.userId?.slice(0, 8)} · {m.role} · {m.status}
            </span>
            <span className="flex gap-1">
              {m.role !== 'OWNER' ? (
                <button
                  type="button"
                  onClick={() => {
                    void post('role', { membershipId: m.id, role: 'VIEWER' })
                  }}
                  className="rounded border px-2 py-0.5"
                >
                  VIEWER
                </button>
              ) : null}
              <button
                type="button"
                onClick={() => {
                  void post('suspend', { membershipId: m.id })
                }}
                className="rounded border px-2 py-0.5"
              >
                Suspender
              </button>
              <button
                type="button"
                onClick={() => {
                  void post('remove', { membershipId: m.id })
                }}
                className="rounded border px-2 py-0.5 text-red-600"
              >
                Eliminar
              </button>
            </span>
          </div>
        ))}
      </div>

      <h2 className="mb-2 mt-6 font-bold">Invitaciones</h2>
      <div className="space-y-2">
        {invitations.map((inv) => (
          <div
            key={inv.id}
            className="flex flex-wrap items-center justify-between gap-2 rounded-xl bg-zinc-100 p-3 text-xs dark:bg-zinc-800"
          >
            <span>
              {inv.email} · {inv.role} ·{' '}
              {inv.revokedAt
                ? 'Revocada'
                : inv.acceptedAt
                ? 'Aceptada'
                : `Vence ${String(inv.expiresAt).slice(0, 10)}`}
            </span>
            {!inv.revokedAt && !inv.acceptedAt ? (
              <>
                <button
                  type="button"
                  onClick={() => {
                    void post('resend', { email: inv.email, role: inv.role })
                  }}
                  className="rounded border px-2 py-0.5"
                >
                  Reenviar
                </button>
                <button
                  type="button"
                  onClick={() => {
                    void post('revoke', { invitationId: inv.id })
                  }}
                  className="rounded border px-2 py-0.5 text-red-600"
                >
                  Revocar
                </button>
              </>
            ) : null}
          </div>
        ))}
      </div>
    </DashboardLayout>
  )
}
