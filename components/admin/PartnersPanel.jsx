'use client'

// Admin-only partner referrals (hotels/hostels). Partner users never see this:
// /api/admin/partners requires role=admin.
import { useCallback, useEffect, useState } from 'react'
import { Building2, Plus, Pause, Play, Ban, RefreshCw } from 'lucide-react'

const emptyForm = {
  slug: '',
  referralCode: '',
  name: '',
  websiteUrl: '',
  logoUrl: '',
  guestDiscountPct: '0.1',
  commissionPct: '0.1',
  attributionDays: '30',
  status: 'ACTIVE',
}

export default function PartnersPanel({ isEs }) {
  const [partners, setPartners] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [notice, setNotice] = useState(null)
  const [form, setForm] = useState(emptyForm)
  const [manual, setManual] = useState({}) // partnerId -> {bookingId}
  const [reverseReason, setReverseReason] = useState({}) // bookingId -> reason

  const fetchPartners = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const token = localStorage.getItem('authToken')
      const res = await fetch('/api/admin/partners', {
        headers: { Authorization: token ? `Bearer ${token}` : '' },
      })
      if (!res.ok) throw new Error('no-ok')
      const data = await res.json()
      setPartners(data.partners || [])
    } catch {
      setError(isEs ? 'No pudimos cargar socios.' : 'Could not load partners.')
    } finally {
      setLoading(false)
    }
  }, [isEs])

  useEffect(() => {
    void fetchPartners()
  }, [fetchPartners])

  const flash = (msg) => {
    setNotice(msg)
    setTimeout(() => setNotice(null), 3000)
  }

  const create = async () => {
    if (!form.slug.trim() || !form.name.trim()) {
      setError(isEs ? 'Slug y nombre son obligatorios.' : 'Slug and name are required.')
      return
    }
    setLoading(true)
    setError(null)
    try {
      const token = localStorage.getItem('authToken')
      const res = await fetch('/api/admin/partners', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          slug: form.slug.trim(),
          referralCode: form.referralCode.trim() || undefined,
          name: form.name.trim(),
          websiteUrl: form.websiteUrl.trim() || null,
          logoUrl: form.logoUrl.trim() || null,
          guestDiscountPct: Number(form.guestDiscountPct),
          commissionPct: Number(form.commissionPct),
          attributionDays: Number(form.attributionDays),
          status: form.status,
        }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.error || 'create failed')
      flash(isEs ? 'Socio creado.' : 'Partner created.')
      setForm(emptyForm)
      await fetchPartners()
    } catch (e) {
      setError(e.message || 'create failed')
    } finally {
      setLoading(false)
    }
  }

  const patch = async (partner, fields) => {
    setLoading(true)
    setError(null)
    try {
      const token = localStorage.getItem('authToken')
      const res = await fetch('/api/admin/partners', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ slug: partner.slug, ...fields }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.error || 'update failed')
      flash(isEs ? 'Actualizado.' : 'Updated.')
      await fetchPartners()
    } catch (e) {
      setError(e.message || 'update failed')
    } finally {
      setLoading(false)
    }
  }

  const attribute = async (partner) => {
    const bookingId = (manual[partner.id]?.bookingId || '').trim()
    if (!bookingId) return
    setLoading(true)
    setError(null)
    try {
      const token = localStorage.getItem('authToken')
      const res = await fetch('/api/admin/partners', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ action: 'attribute', bookingId, partnerRef: partner.slug }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.error || 'attribute failed')
      flash(isEs ? 'Reserva atribuida.' : 'Booking attributed.')
      await fetchPartners()
    } catch (e) {
      setError(e.message || 'attribute failed')
    } finally {
      setLoading(false)
    }
  }

  const transition = async (bookingId, toStatus, extra = {}) => {
    setLoading(true)
    setError(null)
    try {
      const token = localStorage.getItem('authToken')
      const res = await fetch('/api/admin/partners', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ action: 'transition', bookingId, toStatus, ...extra }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.error || 'transition failed')
      flash(isEs ? 'Estado actualizado.' : 'Status updated.')
      await fetchPartners()
    } catch (e) {
      setError(e.message || 'transition failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <section className="mb-8 rounded-2xl border border-zinc-200 bg-white/80 p-6 shadow-lg dark:border-white/10 dark:bg-zinc-900/50">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h2 className="flex items-center gap-2 text-xl font-bold text-zinc-900 dark:text-white">
          <Building2 className="h-5 w-5 text-orange-500" />
          {isEs ? 'Socios (hoteles/hostales)' : 'Partners (hotels/hostels)'}
          <span className="rounded-full bg-orange-500/15 px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest text-orange-600 dark:text-orange-400">
            Solo admin
          </span>
        </h2>
        <button
          type="button"
          onClick={() => void fetchPartners()}
          disabled={loading}
          className="inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-semibold text-zinc-600 hover:bg-zinc-50 dark:text-zinc-300 dark:hover:bg-zinc-800"
        >
          <RefreshCw className="h-3.5 w-3.5" />
          {isEs ? 'Actualizar' : 'Refresh'}
        </button>
      </div>

      {notice ? (
        <p className="mb-3 rounded-lg border border-emerald-300 bg-emerald-50 px-3 py-2 text-xs text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-300">
          {notice}
        </p>
      ) : null}
      {error ? (
        <p className="mb-3 rounded-lg border border-red-300 bg-red-50 px-3 py-2 text-xs text-red-600 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-300">
          {error}
        </p>
      ) : null}

      {/* Crear */}
      <div className="mb-6 rounded-xl border border-zinc-200 bg-zinc-50 p-4 dark:border-white/10 dark:bg-zinc-800/50">
        <p className="mb-3 flex items-center gap-1.5 text-sm font-bold text-zinc-800 dark:text-zinc-100">
          <Plus className="h-4 w-4 text-orange-500" />
          {isEs ? 'Crear socio' : 'Create partner'}
        </p>
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
          {[
            ['slug', isEs ? 'Slug (?ref=hostal-mx)' : 'Slug (?ref=hostal-mx)'],
            ['referralCode', 'ReferralCode (opcional)'],
            ['name', isEs ? 'Nombre público' : 'Public name'],
            ['websiteUrl', 'Website (http/https)'],
            ['logoUrl', 'Logo (http/https o /ruta)'],
            ['guestDiscountPct', 'Descuento invitado (0.10 = 10%)'],
            ['commissionPct', 'Comisión (0.10 = 10%)'],
            ['attributionDays', 'Ventana días (30)'],
          ].map(([key, label]) => (
            <label key={key} className="text-xs">
              <span className="text-zinc-500 dark:text-zinc-400">{label}</span>
              <input
                value={form[key]}
                onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
                className="mt-1 w-full rounded-lg border border-zinc-300 bg-white px-2.5 py-2 text-sm dark:border-white/10 dark:bg-zinc-950"
              />
            </label>
          ))}
          <label className="text-xs">
            <span className="text-zinc-500 dark:text-zinc-400">Status</span>
            <select
              value={form.status}
              onChange={(e) => setForm((f) => ({ ...f, status: e.target.value }))}
              className="mt-1 w-full rounded-lg border border-zinc-300 bg-white px-2.5 py-2 text-sm dark:border-white/10 dark:bg-zinc-950"
            >
              <option>ACTIVE</option>
              <option>PAUSED</option>
              <option>INACTIVE</option>
            </select>
          </label>
        </div>
        <button
          type="button"
          onClick={() => void create()}
          disabled={loading}
          className="mt-3 rounded-xl bg-orange-500 px-4 py-2 text-sm font-semibold text-white hover:bg-orange-600 disabled:opacity-50"
        >
          {isEs ? 'Crear' : 'Create'}
        </button>
      </div>

      <div className="space-y-4">
        {partners.map((p) => (
          <article
            key={p.id}
            className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-white/10 dark:bg-zinc-900"
          >
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="font-bold text-zinc-900 dark:text-white">
                  {p.name} <span className="font-mono text-xs text-zinc-400">?ref={p.slug}</span>
                </p>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">
                  {p.status} · {(Number(p.guestDiscountPct) * 100).toFixed(0)}% DTO ·{' '}
                  {(Number(p.commissionPct) * 100).toFixed(0)}% comisión · {p.attributionDays}d
                  {p.websiteUrl ? ` · ${p.websiteUrl}` : ''}
                </p>
                <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
                  {isEs ? 'Tráfico' : 'Traffic'}: LANDING {p.stats?.events?.LANDING_VIEW || 0} ·
                  JOURNEY {p.stats?.events?.JOURNEY_VIEW || 0} · CHECKOUT{' '}
                  {p.stats?.events?.CHECKOUT_STARTED || 0} · {isEs ? 'Reservas' : 'Bookings'}{' '}
                  {p.stats?.attributedBookings || 0} · {isEs ? 'Por pagar' : 'Payable'} $
                  {(p.stats?.payableTotal || 0).toFixed(2)} ·{isEs ? 'Pagado' : 'Paid'} $
                  {(p.stats?.paidTotal || 0).toFixed(2)}
                </p>
              </div>
              <div className="flex flex-wrap gap-1.5">
                <button
                  type="button"
                  disabled={loading || p.status === 'ACTIVE'}
                  onClick={() => void patch(p, { status: 'ACTIVE' })}
                  className="inline-flex items-center gap-1 rounded-lg border px-2 py-1 text-xs font-semibold disabled:opacity-40"
                >
                  <Play className="h-3 w-3" /> Active
                </button>
                <button
                  type="button"
                  disabled={loading || p.status === 'PAUSED'}
                  onClick={() => void patch(p, { status: 'PAUSED' })}
                  className="inline-flex items-center gap-1 rounded-lg border px-2 py-1 text-xs font-semibold disabled:opacity-40"
                >
                  <Pause className="h-3 w-3" /> Pause
                </button>
                <button
                  type="button"
                  disabled={loading || p.status === 'INACTIVE'}
                  onClick={() => void patch(p, { status: 'INACTIVE' })}
                  className="inline-flex items-center gap-1 rounded-lg border px-2 py-1 text-xs font-semibold disabled:opacity-40"
                >
                  <Ban className="h-3 w-3" /> Inactive
                </button>
              </div>
            </div>

            <div className="mt-3 flex flex-wrap gap-2">
              <input
                placeholder={
                  isEs ? 'ID reserva para atribuir manual' : 'Booking ID for manual attribution'
                }
                value={manual[p.id]?.bookingId || ''}
                onChange={(e) =>
                  setManual((m) => ({ ...m, [p.id]: { bookingId: e.target.value } }))
                }
                className="min-w-[220px] flex-1 rounded-lg border border-zinc-300 bg-white px-2.5 py-1.5 text-xs dark:border-white/10 dark:bg-zinc-950"
              />
              <button
                type="button"
                disabled={loading}
                onClick={() => void attribute(p)}
                className="rounded-lg bg-zinc-900 px-3 py-1.5 text-xs font-semibold text-white dark:bg-zinc-100 dark:text-zinc-900"
              >
                {isEs ? 'Atribuir' : 'Attribute'}
              </button>
            </div>

            <div className="mt-2 flex flex-wrap gap-2">
              <input
                placeholder="Invite email (admin)"
                value={manual[p.id]?.email || ''}
                onChange={(e) =>
                  setManual((m) => ({
                    ...m,
                    [p.id]: { ...(m[p.id] || {}), email: e.target.value },
                  }))
                }
                className="min-w-[180px] flex-1 rounded-lg border border-zinc-300 bg-white px-2.5 py-1.5 text-xs dark:border-white/10 dark:bg-zinc-950"
              />
              <select
                value={manual[p.id]?.role || 'VIEWER'}
                onChange={(e) =>
                  setManual((m) => ({ ...m, [p.id]: { ...(m[p.id] || {}), role: e.target.value } }))
                }
                className="rounded-lg border px-2 py-1.5 text-xs dark:border-white/10 dark:bg-zinc-950"
              >
                <option>VIEWER</option>
                <option>STAFF</option>
                <option>MANAGER</option>
                <option>OWNER</option>
              </select>
              <button
                type="button"
                disabled={loading}
                onClick={async () => {
                  const token = localStorage.getItem('authToken')
                  const email = manual[p.id]?.email || ''
                  const role = manual[p.id]?.role || 'VIEWER'
                  const res = await fetch('/api/admin/partners/invite', {
                    method: 'POST',
                    headers: {
                      'Content-Type': 'application/json',
                      Authorization: `Bearer ${token}`,
                    },
                    body: JSON.stringify({ email, partnerId: p.id, role }),
                  })
                  const json = await res.json().catch(() => ({}))
                  if (!res.ok) setError(json.error || 'invite failed')
                  else {
                    setNotice(`${email} — enlace (una sola vez): ${json.acceptUrl}`)
                    setManual((m) => ({ ...m, [p.id]: { ...(m[p.id] || {}), email: '' } }))
                  }
                }}
                className="rounded-lg bg-orange-500 px-3 py-1.5 text-xs font-semibold text-white"
              >
                {isEs ? 'Invitar socio' : 'Invite partner'}
              </button>
            </div>

            {p.attributions?.length ? (
              <div className="mt-3 space-y-2">
                {p.attributions.slice(0, 8).map((a) => (
                  <div
                    key={a.bookingId}
                    className="flex flex-wrap items-center justify-between gap-2 rounded-lg bg-zinc-50 px-3 py-2 text-xs dark:bg-zinc-800/50"
                  >
                    <span className="font-mono">
                      {a.bookingReference || a.bookingId.slice(0, 8)} · {a.status} · $
                      {Number(a.finalAmount).toFixed(0)} / comisión $
                      {Number(a.commissionAmount).toFixed(2)}
                    </span>
                    <span className="flex flex-wrap gap-1">
                      {a.status === 'PENDING' ? (
                        <button
                          type="button"
                          onClick={() => void transition(a.bookingId, 'CONFIRMED')}
                          className="rounded border px-1.5 py-0.5 font-semibold"
                        >
                          Confirm
                        </button>
                      ) : null}
                      {a.status === 'CONFIRMED' ? (
                        <button
                          type="button"
                          onClick={() =>
                            void transition(a.bookingId, 'PAYABLE', {
                              eventType: 'JOURNEY_COMPLETED',
                            })
                          }
                          className="rounded border px-1.5 py-0.5 font-semibold"
                        >
                          Payable
                        </button>
                      ) : null}
                      {a.status === 'PAYABLE' ? (
                        <button
                          type="button"
                          onClick={() => void transition(a.bookingId, 'PAID')}
                          className="rounded border px-1.5 py-0.5 font-semibold"
                        >
                          Paid
                        </button>
                      ) : null}
                      {a.status !== 'REVERSED' ? (
                        <>
                          <input
                            placeholder={isEs ? 'Motivo reversión' : 'Reversal reason'}
                            value={reverseReason[a.bookingId] || ''}
                            onChange={(e) =>
                              setReverseReason((r) => ({ ...r, [a.bookingId]: e.target.value }))
                            }
                            className="w-36 rounded border px-1.5 py-0.5"
                          />
                          <button
                            type="button"
                            onClick={() =>
                              void transition(a.bookingId, 'REVERSED', {
                                reason: reverseReason[a.bookingId] || 'Admin reversal',
                              })
                            }
                            className="rounded border px-1.5 py-0.5 font-semibold text-red-600"
                          >
                            Reverse
                          </button>
                        </>
                      ) : null}
                    </span>
                  </div>
                ))}
              </div>
            ) : null}
          </article>
        ))}
        {partners.length === 0 && !loading ? (
          <p className="text-sm text-zinc-400">
            {isEs
              ? 'Aún no hay socios. Crea el primero.'
              : 'No partners yet. Create the first one.'}
          </p>
        ) : null}
      </div>
    </section>
  )
}
