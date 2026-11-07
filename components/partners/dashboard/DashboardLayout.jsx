'use client'

// Shared layout for /partners/dashboard/* — client navigation + partner switcher.
// Security is server-side (every API verifies membership); this is UX only.
import { useEffect, useState } from 'react'
import Link from '@/components/Link'
import { useRouter } from 'next/router'
import { useLanguage } from '@/lib/hooks/useLanguage'
import { useAuth } from '@/lib/hooks/useAuth'
import {
  LayoutDashboard,
  Calendar,
  BarChart3,
  Link2,
  Image as ImageIcon,
  Wallet,
  FileText,
  Users,
  Settings,
} from 'lucide-react'

const NAV = [
  { href: '/partners/dashboard', icon: LayoutDashboard, key: 'overview' },
  { href: '/partners/dashboard/bookings', icon: Calendar, key: 'bookings' },
  { href: '/partners/dashboard/analytics', icon: BarChart3, key: 'analytics' },
  { href: '/partners/dashboard/links', icon: Link2, key: 'links' },
  { href: '/partners/dashboard/materials', icon: ImageIcon, key: 'materials' },
  { href: '/partners/dashboard/commissions', icon: Wallet, key: 'commissions' },
  { href: '/partners/dashboard/reports', icon: FileText, key: 'reports' },
  { href: '/partners/dashboard/team', icon: Users, key: 'team' },
  { href: '/partners/dashboard/settings', icon: Settings, key: 'settings' },
]

const LABELS = {
  overview: { es: 'Resumen', en: 'Overview' },
  bookings: { es: 'Reservas', en: 'Bookings' },
  analytics: { es: 'Analítica', en: 'Analytics' },
  links: { es: 'Enlaces y QR', en: 'Links & QR' },
  materials: { es: 'Materiales', en: 'Materials' },
  commissions: { es: 'Comisiones', en: 'Commissions' },
  reports: { es: 'Reportes', en: 'Reports' },
  team: { es: 'Equipo', en: 'Team' },
  settings: { es: 'Ajustes', en: 'Settings' },
}

export function usePartnerMe() {
  const { token } = useAuth()
  const [me, setMe] = useState(null)
  const [loading, setLoading] = useState(true)
  useEffect(() => {
    let cancelled = false
    const load = async () => {
      if (!token) {
        setMe(null)
        setLoading(false)
        return
      }
      try {
        const res = await fetch('/api/partners/me', {
          headers: { Authorization: `Bearer ${token}` },
        })
        const data = await res.json().catch(() => null)
        if (!cancelled) setMe(res.ok ? data : null)
      } catch {
        if (!cancelled) setMe(null)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    void load()
    return () => {
      cancelled = true
    }
  }, [token])
  return { me, loading }
}

export default function DashboardLayout({ children, demo = false }) {
  const router = useRouter()
  const { currentLanguage } = useLanguage()
  const isEs = currentLanguage === 'es'
  const { me, loading } = usePartnerMe()
  const [partnerId, setPartnerId] = useState(null)

  useEffect(() => {
    if (me?.primary) setPartnerId((cur) => cur || me.primary.partnerId)
  }, [me])

  useEffect(() => {
    if (!loading && !demo && me && me.memberships.length === 0) {
      void router.replace('/partners/login')
    }
  }, [loading, me, demo, router])

  if (!demo && loading) {
    return (
      <div className="flex min-h-screen items-center justify-center text-sm text-zinc-500">
        Cargando…
      </div>
    )
  }

  const activeKey = NAV.find(
    (n) => router.pathname === n.href || router.asPath.startsWith(n.href)
  )?.key

  const withPartner = (href) =>
    partnerId ? `${href}?partnerId=${encodeURIComponent(partnerId)}` : href

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-black text-zinc-900 dark:text-white">
            {isEs ? 'Panel del socio' : 'Partner Dashboard'}
          </h1>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            {demo
              ? 'DEMONSTRATION DATA — Not actual partner performance (illustrative numbers only).'
              : isEs
              ? 'Solo ves los datos de tu propiedad. Moneda MXN · Zona America/Mexico_City.'
              : 'You only see your own property data. Currency MXN · Timezone America/Mexico_City.'}
          </p>
        </div>
        {!demo && me?.memberships?.length > 1 ? (
          <label className="text-xs">
            <span className="text-zinc-500">{isEs ? 'Propiedad' : 'Property'}</span>
            <select
              value={partnerId || ''}
              onChange={(e) => setPartnerId(e.target.value)}
              className="ml-2 rounded-lg border px-2 py-1.5 dark:border-white/10 dark:bg-zinc-900"
            >
              {me.memberships.map((m) => (
                <option key={m.partnerId} value={m.partnerId}>
                  {m.partnerName} ({m.role})
                </option>
              ))}
            </select>
          </label>
        ) : null}
      </div>

      <div className="grid gap-6 lg:grid-cols-[220px_1fr]">
        <nav className="flex gap-2 overflow-x-auto lg:flex-col">
          {NAV.map((item) => {
            const Icon = item.icon
            const active = activeKey === item.key
            return (
              <Link
                key={item.key}
                href={demo ? withPartner(item.href) : withPartner(item.href)}
                className={`inline-flex shrink-0 items-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold ${
                  active
                    ? 'bg-orange-500 text-white'
                    : 'bg-zinc-100 text-zinc-700 hover:bg-orange-500/10 dark:bg-zinc-800 dark:text-zinc-300'
                }`}
              >
                <Icon className="h-4 w-4" />
                {LABELS[item.key][isEs ? 'es' : 'en']}
              </Link>
            )
          })}
        </nav>
        <div className="min-w-0">
          {partnerId || demo ? children : null}
          {!partnerId && !demo ? (
            <p className="text-sm text-zinc-500">
              {isEs
                ? 'No tienes acceso a ningún socio. Habla con tu equipo.'
                : 'No partner access. Contact your team.'}
            </p>
          ) : null}
        </div>
      </div>
    </div>
  )
}

export function partnerQuery(partnerId) {
  return partnerId ? `partnerId=${encodeURIComponent(partnerId)}` : ''
}
