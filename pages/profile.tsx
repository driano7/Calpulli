'use client'

import React from 'react'
import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import { motion, AnimatePresence, useInView, useScroll, useTransform } from 'framer-motion'
import dynamic from 'next/dynamic'
const QrScannerAdmin = dynamic(() => import('@/components/admin/QrScannerAdmin'), {
  ssr: false,
  loading: () => null,
})
import { buildClientQr } from '@/lib/qr/types'
import Link from 'next/link'
import { useRouter } from 'next/router'
import Image from '@/components/Image'
import { useAuth } from '@/lib/hooks/useAuth'
import { useLanguage } from '@/lib/hooks/useLanguage'
import { AuthLoader } from '@/components/AuthLoader'
import { ErrorBoundary } from '@/components/ErrorBoundary'
import { VirtualTicket } from '@/components/tickets/VirtualTicket'
import { tours } from '@/data/toursData'
import { formatBookingDate } from '@/lib/booking/types'
import { validatePassword } from '@/lib/password'
import {
  getFavorites,
  getCommented,
  getProfileData,
  saveProfileData,
  exportMyData,
  exportEncryptedData,
  deleteMyData,
  toggleFavorite,
  type ProfileData,
} from '@/lib/userData'
import {
  Calendar,
  Heart,
  MessageSquare,
  User,
  Shield,
  Download,
  Gift,
  FileText,
  Trash2,
  Lock,
  Star,
  BarChart2,
  MapPin,
  CreditCard,
  TrendingUp,
  Clock,
  MapPin as MapPinIcon,
  Camera,
  QrCode,
  Search,
} from 'lucide-react'
import { CoffeeBackground } from '@/components/CoffeeBackground'
import { GrecaOjoFelino } from '@/components/moodboard/Icons'
import {
  SequentialBarChart,
  SequentialLineChart,
  SequentialRadialBarChart,
  StatCard,
} from '@/components/charts/AnimatedCharts'
import { buildDemographics } from '@/lib/analytics/ml-metrics'

type Tab =
  | 'profile'
  | 'bookings'
  | 'dashboard'
  | 'favorites'
  | 'commented'
  | 'security'
  | 'referral'

// Real bookings fetched from the server (Turso) — never from the browser
const getRealBookings = async (userId: string) => {
  try {
    const token = localStorage.getItem('authToken')
    const res = await fetch(`/api/admin/bookings?userId=${encodeURIComponent(userId)}`, {
      headers: { Authorization: token ? `Bearer ${token}` : '' },
    })
    if (!res.ok) throw new Error('Failed to fetch bookings')
    const json = await res.json()
    return (json.bookings ?? []).map((b: any) => ({
      id: b.id,
      userId,
      experienceId: b.experienceId,
      experienceTitle: b.experienceTitle,
      experienceImage: b.experienceImage,
      date: b.date,
      time: b.time,
      totalPrice: b.totalPrice,
      status: b.status,
      category: b.category,
      location: b.location,
      meetingPoint: b.meetingPoint,
      createdAt: b.createdAt,
    }))
  } catch (error) {
    console.error('Failed to fetch bookings:', error)
    return []
  }
}

export default function Profile() {
  const { user, isLoading, updateUser, logout } = useAuth()
  const { t, currentLanguage } = useLanguage()
  const router = useRouter()
  const isEs = currentLanguage === 'es'
  const [tab, setTab] = useState<Tab>((router.query.tab as Tab) || 'profile')
  const [showTicket, setShowTicket] = useState<any>(null)
  const [bookings, setBookings] = useState<any[]>([])
  const [favorites, setFavorites] = useState<string[]>([])
  const [commented, setCommented] = useState<string[]>([])
  const [isLoadingBookings, setIsLoadingBookings] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [profileLoaded, setProfileLoaded] = useState(false)

  // Lector de QR para administradores: lee el QR de un ticket y abre su reserva
  const [showScanner, setShowScanner] = useState(false)
  const [scanResult, setScanResult] = useState<string | null>(null)
  const [isScanning, setIsScanning] = useState(false)
  const [ticketSearch, setTicketSearch] = useState('')

  /** Filtra bookings por nombre, código de ticket, clave de reserva o ID. */
  const filteredBookings = useMemo(() => {
    const q = ticketSearch.toLowerCase().trim()
    if (!q) return bookings
    return bookings.filter((b: any) => {
      const haystack = [
        b.customerName,
        b.ticketCode,
        b.bookingReference,
        b.id,
        b.experienceTitle,
        ...(Array.isArray(b.participantNames) ? b.participantNames : []),
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()
      return haystack.includes(q)
    })
  }, [bookings, ticketSearch])

  /** Cuando el admin escanea un QR, busca la reserva por código/clave y la abre. */
  const handleScanResult = useCallback(
    (code: string) => {
      setIsScanning(false)
      setShowScanner(false)
      const q = code.trim().toUpperCase()
      const found = bookings.find(
        (b: any) =>
          (b.ticketCode || '').toUpperCase() === q ||
          (b.bookingReference || '').toUpperCase() === q ||
          (b.id || '').toUpperCase() === q ||
          Array.isArray(b.tickets) &&
            b.tickets.some((t: any) => (t.ticketCode || '').toUpperCase() === q)
      )
      if (found) {
        setShowTicket(found)
        setScanResult(null)
      } else {
        setScanResult(code)
        setError(`No se encontró reserva con el código "${code}".`)
      }
    },
    [bookings]
  )

  const [role, setRole] = useState<'admin' | 'employee' | 'client' | null>(null)
  const [form, setForm] = useState<ProfileData>({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    country: '',
    marketingEmail: false,
    marketingPush: false,
    summary: '',
  })
  const [savedMsg, setSavedMsg] = useState('')
  const [pwMsg, setPwMsg] = useState<{ type: 'success' | 'error'; message: string } | null>(null)
  const [gdprMsg, setGdprMsg] = useState('')

  useEffect(() => {
    if (!user?.email) return
    const token = typeof window !== 'undefined' ? localStorage.getItem('authToken') : null
    fetch('/api/admin/me', {
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        'x-demo-email': user.email,
      },
    })
      .then((r) => r.json())
      .then((d) => {
        if (d?.success && d?.data?.role) setRole(d.data.role)
        else setRole('client')
      })
      .catch(() => setRole('client'))
  }, [user?.email])

  const fetchBookings = useCallback(async () => {
    setIsLoadingBookings(true)
    try {
      const raw = localStorage.getItem('calpulli_bookings')
      const loaded = raw ? JSON.parse(raw) : []
      const mine = Array.isArray(loaded)
        ? loaded
            .filter((b) => b.userId === (user as any)?.id)
            .sort(
              (a, b) =>
                new Date(b?.createdAt || 0).getTime() - new Date(a?.createdAt || 0).getTime()
            )
        : []
      if (mine.length > 0) {
        setBookings(mine)
        return
      }
      const response = await fetch('/api/bookings', {
        headers: { Authorization: `Bearer ${localStorage.getItem('authToken')}` },
      })
      const data = await response.json()
      if (data.bookings) setBookings(data.bookings)
    } catch (err) {
      console.error('Error fetching bookings:', err)
      setError('Error al cargar reservaciones')
    } finally {
      setIsLoadingBookings(false)
    }
  }, [user])

  const loadProfileData = useCallback(async () => {
    if (user) {
      // Fetch real bookings from Turso
      const realBookings = await getRealBookings(user.id)
      setBookings(realBookings.length > 0 ? realBookings : [])
      setIsLoadingBookings(false)
      // Real favorites/commented from localStorage
      const realFavs = getFavorites()
      const realCommented = getCommented()
      setFavorites(realFavs.length > 0 ? realFavs : [])
      setCommented(realCommented.length > 0 ? realCommented : [])
      const profileData = await getProfileData(user)
      setForm({
        ...profileData,
        firstName: profileData.firstName || user.firstName || '',
        lastName: profileData.lastName || 'Riaño',
        email: profileData.email || user.email,
        phone: profileData.phone || '+52 55 5122 9160',
        country: profileData.country || 'México',
        summary: profileData.summary || 'Explorador de experiencias auténticas en México.',
      })
      setProfileLoaded(true)
    }
  }, [user])

  useEffect(() => {
    loadProfileData()
  }, [loadProfileData])

  useEffect(() => {
    const queryTab = router.query.tab as Tab | undefined
    if (queryTab && queryTab !== tab) {
      setTab(queryTab)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router.query.tab])

  const favTours = tours.filter((tr) => favorites.includes(tr.id))
  const commentedTours = tours.filter((tr) => commented.includes(tr.id))

  const totalSpent = bookings.reduce((sum, b) => sum + (b.totalPrice || 0), 0)
  const completedBookings = bookings.filter((b) => b.status === 'completed').length
  const upcomingBookings = bookings.filter(
    (b) => b.status === 'confirmed' || b.status === 'pending'
  ).length
  const topCategory = getTopCategory(bookings)

  const handleSaveProfile = async (e: { preventDefault: () => void }) => {
    e.preventDefault()
    await saveProfileData(form)
    if (user) {
      const updated = {
        ...user,
        firstName: form.firstName,
        lastName: form.lastName,
        email: form.email,
      }
      updateUser(updated)
      localStorage.setItem('authUser', JSON.stringify(updated))
    }
    setSavedMsg(isEs ? 'Datos guardados' : 'Data saved')
    setTimeout(() => setSavedMsg(''), 2500)
  }

  const handleChangePassword = (e: {
    currentTarget: HTMLFormElement
    preventDefault: () => void
  }) => {
    e.preventDefault()
    const current = (e.currentTarget as HTMLFormElement).elements['currentPassword'].value
    const next = (e.currentTarget as HTMLFormElement).elements['newPassword'].value
    const confirm = (e.currentTarget as HTMLFormElement).elements['confirmPassword'].value
    if (!current || !next) {
      setPwMsg({
        type: 'error',
        message: isEs ? 'Completa todos los campos' : 'Fill in all fields',
      })
      return
    }
    const pwError = validatePassword(next)
    if (pwError) {
      setPwMsg({ type: 'error', message: pwError })
      return
    }
    if (next !== confirm) {
      setPwMsg({
        type: 'error',
        message: isEs ? 'Las contraseñas no coinciden' : 'Passwords do not match',
      })
      return
    }
    try {
      localStorage.setItem('calpulli_password', next)
    } catch {
      /* ignore */
    }
    ;(e.currentTarget as HTMLFormElement).reset()
    setPwMsg({ type: 'success', message: isEs ? 'Contraseña actualizada' : 'Password updated' })
    setTimeout(() => setPwMsg(null), 2500)
  }

  // Exportación real: lo que aloja el servidor (RGPD art. 15), no el localStorage.
  const handleExport = async () => {
    const token = localStorage.getItem('authToken')
    try {
      const res = await fetch('/api/gdpr/export', {
        headers: { Authorization: token ? `Bearer ${token}` : '' },
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.error || 'export failed')
      }
      const payload = await res.json()

      const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `calpulli-datos-${new Date().toISOString().split('T')[0]}.json`
      a.click()
      URL.revokeObjectURL(url)

      const c = payload.counts ?? {}
      setGdprMsg(
        isEs
          ? `Descarga lista: ${c.bookings ?? 0} reservas, ${c.reviews ?? 0} reseñas, ${
              c.sessions ?? 0
            } sesiones`
          : `Ready: ${c.bookings ?? 0} bookings, ${c.reviews ?? 0} reviews, ${
              c.sessions ?? 0
            } sessions`
      )
    } catch (error) {
      console.error(error)
      setGdprMsg(isEs ? 'No se pudo exportar' : 'Export failed')
    }
    setTimeout(() => setGdprMsg(''), 5000)
  }

  const handleExportCsv = async () => {
    const token = localStorage.getItem('authToken')
    try {
      const res = await fetch('/api/gdpr/export', {
        headers: { Authorization: token ? `Bearer ${token}` : '' },
      })
      const payload = await res.json()

      const rows: string[][] = []
      const add = (key: string, value: unknown) => {
        rows.push([
          key,
          value === null || value === undefined
            ? ''
            : typeof value === 'object'
            ? JSON.stringify(value)
            : String(value),
        ])
      }
      Object.entries(payload.account ?? {}).forEach(([k, v]) => add(`cuenta.${k}`, v))
      ;(payload.bookings ?? []).forEach((b: any) => add(`reserva.${b.booking_reference}`, b))
      ;(payload.reviews ?? []).forEach((r: any) => add(`reseña.${r.id}`, r))

      const csv = rows
        .map((r) => r.map((f) => `"${String(f).replace(/"/g, '""')}"`).join(','))
        .join('\n')
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `calpulli-datos-${new Date().toISOString().split('T')[0]}.csv`
      a.click()
      URL.revokeObjectURL(url)

      setGdprMsg(isEs ? 'CSV descargado' : 'CSV downloaded')
    } catch (error) {
      console.error(error)
      setGdprMsg(isEs ? 'No se pudo exportar' : 'Export failed')
    }
    setTimeout(() => setGdprMsg(''), 5000)
  }

  const handleExportEncrypted = handleExport

  const handleDelete = async () => {
    const password = window.prompt(
      isEs ? 'Escribe tu contraseña para confirmar' : 'Type your password to confirm'
    )
    if (!password) return

    const confirmText = window.prompt(
      isEs ? 'Escribe ELIMINAR en mayúsculas para confirmar' : 'Type DELETE in caps to confirm'
    )
    if (confirmText !== 'ELIMINAR') {
      setGdprMsg(isEs ? 'Cancelado: escribiste ELIMINAR' : 'Cancelled: you did not type it')
      setTimeout(() => setGdprMsg(''), 3000)
      return
    }

    const token = localStorage.getItem('authToken')
    try {
      const res = await fetch('/api/gdpr/account', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          Authorization: token ? `Bearer ${token}` : '',
        },
        body: JSON.stringify({ password, confirm: confirmText }),
      })
      const json = await res.json().catch(() => ({}))
      if (!res.ok) {
        setGdprMsg(json.error || (isEs ? 'No se pudo eliminar' : 'Could not delete'))
        setTimeout(() => setGdprMsg(''), 4000)
        return
      }
      localStorage.clear()
      await logout()
    } catch (error) {
      console.error(error)
      setGdprMsg(isEs ? 'No se pudo eliminar' : 'Could not delete')
      setTimeout(() => setGdprMsg(''), 4000)
    }
  }

  const isPrivileged = role === 'admin' || role === 'employee'
  const [canBeReferrer, setCanBeReferrer] = useState(false)
  const [referral, setReferral] = useState<{ code: string; shareUrl: string | null } | null>(null)
  const [referralStats, setReferralStats] = useState<{
    visits: number
    attributedUsers: number
    conversions: number
  } | null>(null)

  // El permiso de referido vive en la matriz de roles (role_permissions).
  useEffect(() => {
    let cancelled = false
    const load = async () => {
      const token = localStorage.getItem('authToken')
      if (!token) return
      try {
        const res = await fetch('/api/referrals/me', {
          headers: { Authorization: `Bearer ${token}` },
        })
        if (!res.ok) {
          if (!cancelled) setCanBeReferrer(false)
          return
        }
        const json = await res.json()
        if (cancelled) return
        setCanBeReferrer(true)
        setReferral({ code: json.referralCode, shareUrl: json.shareUrl })

        const statsRes = await fetch('/api/admin/referrals', {
          headers: { Authorization: `Bearer ${token}` },
        })
        if (statsRes.ok) {
          const statsJson = await statsRes.json()
          if (!cancelled && statsJson.stats) setReferralStats(statsJson.stats)
        }
      } catch {
        if (!cancelled) setCanBeReferrer(false)
      }
    }
    void load()
    return () => {
      cancelled = true
    }
  }, [])
  const tabs: { id: Tab; label: string; icon: any }[] = useMemo(() => {
    const base = [
      { id: 'profile' as Tab, label: isEs ? 'Mi perfil' : 'My profile', icon: User },
      { id: 'dashboard' as Tab, label: isEs ? 'Dashboard' : 'Dashboard', icon: BarChart2 },
    ]
    // Solo quienes pueden tener referido (employee y admin) ven el botón.
    if (canBeReferrer) {
      base.push({ id: 'referral' as Tab, label: isEs ? 'Mi referido' : 'My referral', icon: Gift })
    }
    if (isPrivileged) return base
    return [
      ...base.slice(0, 1),
      { id: 'bookings' as Tab, label: isEs ? 'Mis reservas' : 'My bookings', icon: Calendar },
      base[1],
      { id: 'favorites' as Tab, label: isEs ? 'Favoritos' : 'Favorites', icon: Heart },
      { id: 'commented' as Tab, label: isEs ? 'Comentados' : 'Commented', icon: MessageSquare },
      {
        id: 'security' as Tab,
        label: isEs ? 'Seguridad y datos' : 'Security & data',
        icon: Shield,
      },
    ]
  }, [isEs, isPrivileged])

  if (isLoading) {
    return <AuthLoader label={isEs ? 'Cargando tu perfil...' : 'Loading your profile...'} />
  }

  if (!user) {
    return (
      <CoffeeBackground className="flex min-h-screen flex-col items-center justify-center px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="max-w-md text-center"
        >
          <h1 className="mb-4 text-3xl font-bold text-zinc-900 dark:text-white">
            {isEs ? 'Inicia sesión' : 'Sign in'}
          </h1>
          <p className="mb-6 text-zinc-500 dark:text-gray-400">
            {isEs
              ? 'Inicia sesión para ver tus reservaciones y perfil'
              : 'Sign in to see your bookings and profile'}
          </p>
          <Link
            href="/login"
            className="inline-flex items-center justify-center rounded-xl bg-orange-500 px-8 py-4 font-semibold text-white transition-colors hover:bg-orange-600"
          >
            {isEs ? 'Iniciar sesión' : 'Sign in'}
          </Link>
        </motion.div>
      </CoffeeBackground>
    )
  }

  return (
    <CoffeeBackground className="min-h-screen py-12">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mx-auto max-w-6xl"
        >
          {/* Profile Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="mb-8 flex flex-col items-center gap-6 rounded-2xl border border-zinc-200 bg-white/80 p-6 shadow-xl dark:border-white/10 dark:bg-zinc-900/50 md:flex-row md:items-start"
          >
            <div className="relative flex h-24 w-24 items-center justify-center overflow-hidden rounded-full border-2 border-orange-500/50 bg-zinc-100 dark:bg-zinc-800 md:h-28 md:w-28">
              {user.avatar ? (
                <Image
                  src={user.avatar}
                  alt={user.firstName || user.email}
                  width={96}
                  height={96}
                  className="object-cover"
                />
              ) : (
                <User className="h-12 w-12 text-zinc-400" />
              )}
            </div>
            <div className="flex-1 text-center md:text-left">
              <h1 className="text-3xl font-bold text-zinc-900 dark:text-white">
                {user.firstName || user.email}
              </h1>
              <p className="mt-1 text-zinc-500 dark:text-gray-400">{user.email}</p>
              <div className="mt-3 flex flex-wrap justify-center gap-3 md:justify-start">
                <span className="rounded-full bg-orange-500/20 px-3 py-1 text-sm font-medium text-orange-500">
                  {isEs ? 'Miembro desde ' : 'Member since '}
                  {new Date().toLocaleDateString(isEs ? 'es-MX' : 'en-US', {
                    year: 'numeric',
                    month: 'long',
                  })}
                </span>
                <span className="rounded-full bg-emerald-500/20 px-3 py-1 text-sm font-medium text-emerald-600 dark:text-emerald-400">
                  {bookings.length}{' '}
                  {bookings.length === 1
                    ? isEs
                      ? 'reserva'
                      : 'booking'
                    : isEs
                    ? 'reservas'
                    : 'bookings'}
                </span>
                <span className="rounded-full bg-blue-500/20 px-3 py-1 text-sm font-medium text-blue-600 dark:text-blue-400">
                  {favorites.length} {isEs ? 'favoritos' : 'favorites'}
                </span>
              </div>
            </div>
          </motion.div>

          {/* Dashboard Summary Cards */}
          {tab === 'dashboard' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="mb-8 grid gap-4 md:grid-cols-2 xl:grid-cols-4"
            >
              <SummaryCard
                icon={Calendar}
                iconColor="bg-orange-500/10 text-orange-500"
                label={isEs ? 'Próximos viajes' : 'Upcoming trips'}
                value={upcomingBookings}
                subtitle={isEs ? 'Reservas confirmadas' : 'Confirmed bookings'}
              />
              <SummaryCard
                icon={Star}
                iconColor="bg-emerald-500/10 text-emerald-500"
                label={isEs ? 'Experiencias completadas' : 'Completed experiences'}
                value={completedBookings}
                subtitle={isEs ? 'Tours realizados' : 'Tours done'}
              />
              <SummaryCard
                icon={CreditCard}
                iconColor="bg-blue-500/10 text-blue-500"
                label={isEs ? 'Total invertido' : 'Total spent'}
                value={`$${totalSpent.toLocaleString()}`}
                subtitle={isEs ? 'En experiencias' : 'On experiences'}
              />
              <SummaryCard
                icon={MapPin}
                iconColor="bg-purple-500/10 text-purple-500"
                label={isEs ? 'Categoría favorita' : 'Favorite category'}
                value={topCategory}
                subtitle={isEs ? 'Más reservada' : 'Most booked'}
              />
            </motion.div>
          )}

          {/* Tabs */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.3 }}
            className="mb-8 flex flex-wrap gap-2"
          >
            {tabs.map((tb) => {
              const Icon = tb.icon
              const activeTab = tab === tb.id
              return (
                <button
                  key={tb.id}
                  type="button"
                  onClick={() => setTab(tb.id)}
                  className={`flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition-colors ${
                    activeTab
                      ? 'bg-orange-500 text-white shadow-lg'
                      : 'bg-white text-zinc-600 hover:bg-orange-500/10 hover:text-orange-500 dark:bg-zinc-900 dark:text-gray-300'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {tb.label}
                </button>
              )
            })}
          </motion.div>

          {isPrivileged && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-6 rounded-2xl border border-orange-200 bg-orange-50 p-4 dark:border-orange-900/50 dark:bg-orange-950/30"
            >
              <p className="text-sm font-semibold text-orange-700 dark:text-orange-300">
                {role === 'admin'
                  ? isEs
                    ? 'Perfil socio/admin — gestionas todo el sistema.'
                    : 'Admin/socio profile — you manage the whole system.'
                  : isEs
                  ? 'Perfil empleado — operas tours del día.'
                  : 'Employee profile — you operate daily tours.'}
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                {role === 'admin' && (
                  <Link
                    href="/admin"
                    className="rounded-full bg-orange-500 px-4 py-1.5 text-sm font-semibold text-white hover:bg-orange-600"
                  >
                    <span>{isEs ? 'Ir a panel admin →' : 'Go to admin panel →'}</span>
                  </Link>
                )}
                <Link
                  href="/empleados"
                  className="rounded-full border border-orange-500 bg-white px-4 py-1.5 text-sm font-semibold text-orange-500 hover:bg-orange-50 dark:bg-zinc-900"
                >
                  <span>{isEs ? 'Ir a panel empleado →' : 'Go to employee panel →'}</span>
                </Link>
              </div>
            </motion.div>
          )}

          {/* Content */}
          <AnimatePresence mode="wait">
            <motion.div
              key={tab}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.25 }}
            >
              {tab === 'dashboard' && (
                <ErrorBoundary>
                  <DashboardContent
                    bookings={bookings}
                    favTours={favTours}
                    commentedTours={commentedTours}
                    isEs={isEs}
                    isLoadingBookings={isLoadingBookings}
                    error={error}
                    t={t}
                    onViewBooking={(booking) => setShowTicket(booking)}
                    formatBookingDate={formatBookingDate}
                  />
                </ErrorBoundary>
              )}

              {tab === 'bookings' && (
                <ErrorBoundary>
                  <BookingsContent
                    bookings={bookings}
                    isEs={isEs}
                    isLoadingBookings={isLoadingBookings}
                    error={error}
                    t={t}
                    onViewBooking={(booking) => setShowTicket(booking)}
                    formatBookingDate={formatBookingDate}
                  />
                </ErrorBoundary>
              )}

              {tab === 'favorites' && (
                <ErrorBoundary>
                  <TourGrid
                    tours={favTours}
                    isEs={isEs}
                    emptyLabel={
                      isEs
                        ? 'Aún no tienes tours favoritos. Toca el corazón en un tour.'
                        : 'No favorite tours yet. Tap the heart on a tour.'
                    }
                    onToggle={(id) => {
                      toggleFavorite(id)
                      setFavorites(getFavorites())
                    }}
                    isFavorite={(id) => favorites.includes(id)}
                  />
                </ErrorBoundary>
              )}

              {tab === 'commented' && (
                <ErrorBoundary>
                  <TourGrid
                    tours={commentedTours}
                    isEs={isEs}
                    emptyLabel={
                      isEs
                        ? 'Todavía no has comentado ningún tour.'
                        : "You haven't commented on any tour yet."
                    }
                  />
                </ErrorBoundary>
              )}

              {tab === 'profile' && (
                <ErrorBoundary>
                  <ProfileForm
                    form={form}
                    setForm={setForm}
                    savedMsg={savedMsg}
                    setSavedMsg={setSavedMsg}
                    isEs={isEs}
                    onSubmit={handleSaveProfile}
                    profileLoaded={profileLoaded}
                    user={user}
                  />
                </ErrorBoundary>
              )}

              {tab === 'referral' && referral && (
                <ErrorBoundary>
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="rounded-2xl border border-zinc-200 bg-white/80 p-6 shadow-lg dark:border-white/10 dark:bg-zinc-900/50"
                  >
                    <h3 className="flex items-center gap-2 text-xl font-bold text-zinc-900 dark:text-white">
                      <Gift className="h-5 w-5 text-orange-500" />
                      {isEs ? 'Mi código de referido' : 'My referral code'}
                    </h3>
                    <p className="mt-1 text-sm text-zinc-600 dark:text-gray-400">
                      {isEs
                        ? 'Comparte este enlace. Si alguien se registra y reserva por él, la reserva queda atribuida a ti.'
                        : 'Share this link. If someone signs up and books through it, the booking is attributed to you.'}
                    </p>

                    <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center">
                      <code className="select-all rounded-xl border border-orange-500/30 bg-orange-500/10 px-4 py-3 font-mono text-lg font-bold tracking-wider text-orange-600 dark:text-orange-400">
                        {referral.code}
                      </code>
                      <button
                        type="button"
                        onClick={() => {
                          void navigator.clipboard?.writeText(referral.code)
                          setGdprMsg(isEs ? 'Código copiado' : 'Code copied')
                          setTimeout(() => setGdprMsg(''), 2500)
                        }}
                        className="rounded-xl bg-zinc-100 px-4 py-3 text-sm font-semibold text-zinc-700 transition-colors hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-200"
                      >
                        {isEs ? 'Copiar código' : 'Copy code'}
                      </button>
                      {referral.shareUrl && (
                        <button
                          type="button"
                          onClick={() => {
                            void navigator.clipboard?.writeText(referral.shareUrl)
                            setGdprMsg(isEs ? 'Enlace copiado' : 'Link copied')
                            setTimeout(() => setGdprMsg(''), 2500)
                          }}
                          className="rounded-xl bg-orange-500 px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-orange-600"
                        >
                          {isEs ? 'Copiar enlace' : 'Copy link'}
                        </button>
                      )}
                    </div>

                    <dl className="mt-6 grid gap-4 sm:grid-cols-3">
                      {[
                        {
                          label: isEs ? 'Visitas' : 'Visits',
                          value: referralStats?.visits ?? 0,
                        },
                        {
                          label: isEs ? 'Clientes atribuidos' : 'Attributed clients',
                          value: referralStats?.attributedUsers ?? 0,
                        },
                        {
                          label: isEs ? 'Reservas' : 'Bookings',
                          value: referralStats?.conversions ?? 0,
                        },
                      ].map((stat) => (
                        <div
                          key={stat.label}
                          className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-white/10 dark:bg-zinc-800/50"
                        >
                          <dt className="text-xs uppercase tracking-wider text-zinc-500">
                            {stat.label}
                          </dt>
                          <dd className="mt-1 text-2xl font-black text-zinc-900 dark:text-white">
                            {stat.value}
                          </dd>
                        </div>
                      ))}
                    </dl>
                  </motion.div>
                </ErrorBoundary>
              )}

              {tab === 'security' && (
                <ErrorBoundary>
                  <SecuritySection
                    pwMsg={pwMsg}
                    setPwMsg={setPwMsg}
                    gdprMsg={gdprMsg}
                    setGdprMsg={setGdprMsg}
                    isEs={isEs}
                    onChangePassword={handleChangePassword}
                    onExport={handleExport}
                    onExportCsv={handleExportCsv}
                    onDelete={handleDelete}
                  />
                </ErrorBoundary>
              )}
            </motion.div>
          </AnimatePresence>
        </motion.div>
      </div>

      {showTicket && <VirtualTicket ticket={showTicket} onClose={() => setShowTicket(null)} />}

      {/* Escáner de QR para administradores */}
      {showScanner && (
        <QrScannerAdmin
          open={showScanner}
          onClose={() => setShowScanner(false)}
          onScan={handleScanResult}
        />
      )}
    </CoffeeBackground>
  )
}

function SummaryCard({
  icon: Icon,
  iconColor,
  label,
  value,
  subtitle,
}: {
  icon: React.ComponentType<{ className?: string }>
  iconColor: string
  label: string
  value: string | number
  subtitle: string
}) {
  return (
    <div className="rounded-2xl border border-zinc-200 bg-white/80 p-5 shadow-sm dark:border-white/10 dark:bg-zinc-900/50">
      <div className="flex items-center gap-4">
        <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${iconColor}`}>
          <Icon className="h-6 w-6" />
        </div>
        <div>
          <p className="text-xs uppercase tracking-wider text-zinc-500 dark:text-gray-400">
            {label}
          </p>
          <p className="mt-1 text-2xl font-bold text-zinc-900 dark:text-white">{value}</p>
          <p className="text-xs text-zinc-500 dark:text-gray-400">{subtitle}</p>
        </div>
      </div>
    </div>
  )
}

function getTopCategory(bookings: any[]): string {
  const categoryCount: Record<string, number> = {}
  bookings.forEach((b) => {
    if (b.category) categoryCount[b.category] = (categoryCount[b.category] || 0) + 1
  })
  const top = Object.entries(categoryCount).sort((a, b) => b[1] - a[1])[0]
  const labels: Record<string, { es: string; en: string }> = {
    gastronomy: { es: 'Gastronomía', en: 'Gastronomy' },
    history: { es: 'Historia', en: 'History' },
    neighborhoods: { es: 'Barrios', en: 'Neighborhoods' },
    museums: { es: 'Museos', en: 'Museums' },
  }
  if (top) {
    const cat = labels[top[0]]
    return cat ? cat.es : top[0]
  }
  return '—'
}

function DashboardContent({
  bookings,
  favTours,
  commentedTours,
  isEs,
  isLoadingBookings,
  error,
  t,
  onViewBooking,
  formatBookingDate,
}: any) {
  // Compute metrics from bookings
  const totalSpent = bookings.reduce((sum: number, b: any) => sum + (b.totalPrice || 0), 0)
  const completedBookings = bookings.filter((b: any) => b.status === 'completed').length
  const upcomingBookings = bookings.filter(
    (b: any) => b.status === 'confirmed' || b.status === 'pending'
  ).length
  const totalBookings = bookings.length

  // Category distribution
  const categoryCount: Record<string, number> = {}
  bookings.forEach((b: any) => {
    if (b.category) categoryCount[b.category] = (categoryCount[b.category] || 0) + 1
  })
  const categoryData = Object.entries(categoryCount).map(([category, count]) => ({
    label: category,
    value: count,
  }))

  // Monthly bookings (last 6 months)
  const monthlyCount: Record<string, number> = {}
  const now = new Date()
  for (let i = 5; i >= 0; i--) {
    const date = new Date(now.getFullYear(), now.getMonth() - i, 1)
    const key = date.toLocaleDateString('es-MX', { month: 'short', year: '2-digit' })
    monthlyCount[key] = 0
  }

  bookings.forEach((b: any) => {
    if (b.date) {
      const date = new Date(b.date)
      const key = date.toLocaleDateString('es-MX', { month: 'short', year: '2-digit' })
      if (monthlyCount[key] !== undefined) {
        monthlyCount[key]++
      }
    }
  })

  const monthlyData = Object.entries(monthlyCount).map(([month, count]) => ({
    label: month,
    value: count,
  }))

  // Status distribution
  const statusCount: Record<string, number> = {}
  bookings.forEach((b: any) => {
    const status = b.status || 'unknown'
    statusCount[status] = (statusCount[status] || 0) + 1
  })
  const statusData = Object.entries(statusCount).map(([status, count]) => ({
    label: status,
    value: count,
  }))

  // Spending trend (last 6 bookings)
  const recentBookings = [...bookings]
    .sort((a: any, b: any) => new Date(a.date || 0).getTime() - new Date(b.date || 0).getTime())
    .slice(-6)

  const spendingData = recentBookings.map((b: any, i: number) => ({
    label: i.toString(),
    value: b.totalPrice || 0,
    date: b.date ? formatBookingDate(b.date, isEs ? 'es' : 'en') : '',
  }))

  const demographics = buildDemographics(bookings)

  return (
    <motion.div
      className="space-y-8"
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      viewport={{ once: true, margin: '-100px' }}
      transition={{ duration: 0.5 }}
    >
      {/* Summary Stats */}
      <motion.div
        className="grid gap-4 md:grid-cols-2 xl:grid-cols-4"
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5, delay: 0.1 }}
      >
        <StatCard
          label={isEs ? 'Próximos viajes' : 'Upcoming trips'}
          value={upcomingBookings}
          color="#f97316"
        />
        <StatCard
          label={isEs ? 'Experiencias completadas' : 'Completed experiences'}
          value={completedBookings}
          color="#22c55e"
        />
        <StatCard
          label={isEs ? 'Total invertido' : 'Total spent'}
          value={`$${totalSpent.toLocaleString()}`}
          color="#3b82f6"
        />
        <StatCard
          label={isEs ? 'Total reservaciones' : 'Total bookings'}
          value={totalBookings}
          color="#a855f7"
        />
      </motion.div>

      {/* Charts Row 1: Category & Monthly */}
      <motion.div
        className="grid gap-6 lg:grid-cols-2"
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5, delay: 0.2 }}
      >
        <SequentialBarChart
          data={categoryData.length ? categoryData : [{ label: '—', value: 0 }]}
          title={isEs ? 'Reservaciones por categoría' : 'Bookings by category'}
          description={
            isEs
              ? 'Distribución de tus tours por tipo de experiencia'
              : 'Distribution of your tours by experience type'
          }
          dataKey="value"
          nameKey="label"
          color="#f97316"
          layout="horizontal"
          pngFilename="bookings-by-category"
          stepMs={80}
        />
        <SequentialBarChart
          data={monthlyData}
          title={isEs ? 'Reservaciones por mes' : 'Bookings by month'}
          description={
            isEs ? 'Tus reservas en los últimos 6 meses' : 'Your bookings in the last 6 months'
          }
          dataKey="value"
          nameKey="label"
          color="#fb923c"
          pngFilename="bookings-by-month"
          stepMs={85}
        />
      </motion.div>

      {/* Charts Row 2: Status & Spending Trend */}
      <motion.div
        className="grid gap-6 lg:grid-cols-2"
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5, delay: 0.3 }}
      >
        <SequentialBarChart
          data={statusData.length ? statusData : [{ label: '—', value: 0 }]}
          title={isEs ? 'Estado de reservaciones' : 'Booking status'}
          description={
            isEs
              ? 'Confirmadas, pendientes, completadas, canceladas'
              : 'Confirmed, pending, completed, cancelled'
          }
          dataKey="value"
          nameKey="label"
          color="#22c55e"
          pngFilename="bookings-by-status"
          stepMs={75}
        />
        <SequentialLineChart
          data={spendingData.length ? spendingData : [{ label: '1', value: 0 }]}
          title={isEs ? 'Tendencia de gasto' : 'Spending trend'}
          description={
            isEs ? 'Gasto en tus últimas 6 reservaciones' : 'Spending on your last 6 bookings'
          }
          lines={[{ dataKey: 'value', name: isEs ? 'Gasto ($)' : 'Spent ($)', color: '#f97316' }]}
          xKey="label"
          pngFilename="spending-trend"
          stepMs={90}
          yDomain={[0, 'auto']}
        />
      </motion.div>

      {/* Periodicity / Completion Rate */}
      <motion.div
        className="grid gap-6 md:grid-cols-3"
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5, delay: 0.4 }}
      >
        <SequentialRadialBarChart
          percent={totalBookings > 0 ? (completedBookings / totalBookings) * 100 : 0}
          title={isEs ? 'Tasa de finalización' : 'Completion rate'}
          description={isEs ? 'Porcentaje de tours completados' : 'Percentage of completed tours'}
          color="#22c55e"
          size={100}
          periodLabel={
            isEs
              ? `${completedBookings} de ${totalBookings} completados`
              : `${completedBookings} of ${totalBookings} completed`
          }
          coveredDays={completedBookings}
          expectedDays={totalBookings}
        />
        <motion.article
          className="rounded-lg border border-zinc-200/50 bg-white/80 p-4 dark:border-white/10 dark:bg-zinc-900/50"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.45 }}
        >
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500">
            {isEs ? 'Próximo tour' : 'Next tour'}
          </p>
          {upcomingBookings > 0 ? (
            <>
              <p className="mt-2 text-lg font-bold text-zinc-900 dark:text-white">
                {bookings.find((b: any) => b.status === 'confirmed' || b.status === 'pending')
                  ?.experienceTitle || '—'}
              </p>
              <p className="mt-1 text-sm text-zinc-500">
                {bookings.find((b: any) => b.status === 'confirmed' || b.status === 'pending')?.date
                  ? formatBookingDate(
                      bookings.find((b: any) => b.status === 'confirmed' || b.status === 'pending')
                        ?.date,
                      isEs ? 'es' : 'en'
                    )
                  : '—'}
              </p>
            </>
          ) : (
            <p className="mt-2 text-zinc-500">
              {isEs ? 'Sin tours programados' : 'No upcoming tours'}
            </p>
          )}
        </motion.article>
        <motion.article
          className="rounded-lg border border-zinc-200/50 bg-white/80 p-4 dark:border-white/10 dark:bg-zinc-900/50"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.5 }}
        >
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500">
            {isEs ? 'Categoría favorita' : 'Favorite category'}
          </p>
          <p className="mt-2 text-lg font-bold text-zinc-900 dark:text-white">
            {categoryData.length > 0
              ? [...categoryData].sort((a, b) => b.value - a.value)[0].label
              : '—'}
          </p>
          <p className="mt-1 text-sm text-zinc-500">
            {categoryData.length > 0
              ? `${[...categoryData].sort((a, b) => b.value - a.value)[0].value} ${
                  isEs ? 'tours' : 'tours'
                }`
              : isEs
              ? 'Aún no tienes tours'
              : 'No tours yet'}
          </p>
        </motion.article>
      </motion.div>

      {/* Demographics — edades, sexo, nacionalidades/estados */}
      <motion.div
        className="grid gap-6 lg:grid-cols-2"
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5, delay: 0.52 }}
      >
        <SequentialBarChart
          data={demographics.ages.length ? demographics.ages : [{ label: '—', value: 0 }]}
          title={isEs ? 'Distribución por edad' : 'Age distribution'}
          description={isEs ? 'Rangos de edad de tus clientes' : 'Age ranges of your clients'}
          dataKey="value"
          nameKey="label"
          color="#f97316"
          pngFilename="clientes-por-edad"
          stepMs={70}
        />
        <SequentialBarChart
          data={demographics.sexes.length ? demographics.sexes : [{ label: '—', value: 0 }]}
          title={isEs ? 'Distribución por sexo' : 'Sex distribution'}
          description={isEs ? 'Proporción de clientes por sexo' : 'Client proportion by sex'}
          dataKey="value"
          nameKey="label"
          color="#a855f7"
          pngFilename="clientes-por-sexo"
          stepMs={70}
        />
      </motion.div>
      <motion.div
        className="grid gap-6 lg:grid-cols-2"
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5, delay: 0.54 }}
      >
        <SequentialBarChart
          data={
            demographics.nationalities.length
              ? demographics.nationalities
              : [{ label: '—', value: 0 }]
          }
          title={isEs ? 'Nacionalidades' : 'Nationalities'}
          description={
            isEs ? 'Países de origen de tus clientes' : 'Countries of origin of your clients'
          }
          dataKey="value"
          nameKey="label"
          color="#22c55e"
          pngFilename="clientes-por-nacionalidad"
          stepMs={70}
        />
        <SequentialBarChart
          data={demographics.states.length ? demographics.states : [{ label: '—', value: 0 }]}
          title={isEs ? 'Estados / Regiones' : 'States / Regions'}
          description={
            isEs ? 'Estados de México y regiones de origen' : 'Mexican states and regions of origin'
          }
          dataKey="value"
          nameKey="label"
          color="#3b82f6"
          pngFilename="clientes-por-estado"
          stepMs={70}
        />
      </motion.div>

      {/* Quick Links to Favorites & Commented */}
      <motion.div
        className="grid w-full min-w-0 gap-6 overflow-hidden md:grid-cols-2"
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5, delay: 0.55 }}
      >
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="min-w-0 overflow-hidden"
        >
          <h3 className="mb-3 flex items-center gap-2 text-lg font-bold text-zinc-900 dark:text-white">
            <GrecaOjoFelino size={24} />
            <Heart className="h-5 w-5 text-rose-500" />
            {isEs ? 'Tours favoritos' : 'Favorite tours'}
          </h3>
          {favTours.length === 0 ? (
            <div className="rounded-2xl border border-zinc-200 bg-white/80 py-8 text-center dark:border-white/10 dark:bg-zinc-900/50">
              <Heart className="mx-auto h-10 w-10 text-zinc-400" />
              <p className="mt-2 text-sm text-zinc-500 dark:text-gray-400">
                {isEs
                  ? 'Agrega tours a favoritos desde su página'
                  : 'Add tours to favorites from their page'}
              </p>
            </div>
          ) : (
            <div className="w-full min-w-0 space-y-2 overflow-hidden">
              {favTours.slice(0, 3).map((tour: any) => (
                <MiniTourCard key={tour.id} tour={tour} isEs={isEs} />
              ))}
            </div>
          )}
        </motion.section>

        <motion.section
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="min-w-0 overflow-hidden"
        >
          <h3 className="mb-3 flex items-center gap-2 text-lg font-bold text-zinc-900 dark:text-white">
            <GrecaOjoFelino size={24} />
            <MessageSquare className="h-5 w-5 text-blue-500" />
            {isEs ? 'Tours comentados' : 'Commented tours'}
          </h3>
          {commentedTours.length === 0 ? (
            <div className="rounded-2xl border border-zinc-200 bg-white/80 py-8 text-center dark:border-white/10 dark:bg-zinc-900/50">
              <MessageSquare className="mx-auto h-10 w-10 text-zinc-400" />
              <p className="mt-2 text-sm text-zinc-500 dark:text-gray-400">
                {isEs ? 'Deja tu opinión en un tour' : 'Leave a review on a tour'}
              </p>
            </div>
          ) : (
            <div className="w-full min-w-0 space-y-2 overflow-hidden">
              {commentedTours.slice(0, 3).map((tour: any) => (
                <MiniTourCard key={tour.id} tour={tour} isEs={isEs} />
              ))}
            </div>
          )}
        </motion.section>
      </motion.div>
    </motion.div>
  )
}

function BookingCard({ booking, isEs, onView, formatBookingDate }: any) {
  return (
    <div
      onClick={onView}
      className="group relative flex cursor-pointer flex-col overflow-hidden rounded-2xl border border-zinc-200 bg-white/80 p-4 transition-all duration-300 hover:border-orange-500/30 dark:border-white/10 dark:bg-zinc-900/50"
    >
      <div className="flex items-start gap-4">
        <div className="relative h-20 w-28 flex-shrink-0 overflow-hidden rounded-xl">
          <Image
            src={booking.experienceImage || '/static/images/jaguarBaja.png'}
            alt={booking.experienceTitle}
            fill
            className="object-cover transition-transform duration-300 group-hover:scale-105"
          />
        </div>
        <div className="min-w-0 flex-1">
          <h4 className="truncate font-semibold text-zinc-900 dark:text-white">
            {booking.experienceTitle}
          </h4>
          <p className="mt-1 text-sm text-zinc-500 dark:text-gray-400">
            {formatBookingDate(booking.date, isEs ? 'es' : 'en')} · {booking.time}
          </p>
          <span className="mt-2 inline-block rounded-full bg-emerald-500/10 px-2 py-0.5 text-xs font-medium text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300">
            {booking.status === 'confirmed' && (isEs ? 'Confirmada' : 'Confirmed')}
            {booking.status === 'pending' && (isEs ? 'Pendiente' : 'Pending')}
            {booking.status === 'completed' && (isEs ? 'Completada' : 'Completed')}
          </span>
        </div>
        <span className="text-xl font-bold text-zinc-900 dark:text-white">
          ${booking.totalPrice}
        </span>
      </div>
    </div>
  )
}

function MiniTourCard({ tour, isEs }: any) {
  const title = isEs ? tour.titleEs || tour.title : tour.title
  return (
    <Link href={`/tours/${tour.id}`}>
      <a className="flex w-full min-w-0 items-center gap-3 overflow-hidden rounded-xl border border-zinc-200 bg-white/80 p-2 transition-colors hover:border-orange-500/30 dark:border-white/10 dark:bg-zinc-900/50">
        <Image
          src={tour.imageUrl}
          alt={title}
          width={56}
          height={56}
          className="h-14 w-14 shrink-0 rounded-lg object-cover"
        />
        <div className="min-w-0 flex-1 overflow-hidden">
          <p className="truncate font-medium text-zinc-900 dark:text-white">{title}</p>
          <p className="truncate text-sm text-zinc-500 dark:text-gray-400">${tour.price}</p>
        </div>
      </a>
    </Link>
  )
}

function BookingsContent({
  bookings,
  isEs,
  isLoadingBookings,
  error,
  t,
  onViewBooking,
  formatBookingDate,
}: any) {
  return (
    <motion.div
      className="space-y-6"
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      viewport={{ once: true, margin: '-100px' }}
      transition={{ duration: 0.5 }}
    >
      {error && (
        <motion.div
          className="rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-red-600 dark:bg-red-500/20 dark:text-red-300"
          initial={{ opacity: 0, y: -10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          {error}
        </motion.div>
      )}
      {isLoadingBookings ? (
        <motion.div
          className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
        >
          {[1, 2, 3].map((i) => (
            <motion.div
              key={i}
              className="animate-pulse"
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
            >
              <div className="h-48 rounded-t-2xl bg-zinc-200 dark:bg-zinc-800" />
              <div className="space-y-3 p-4">
                <div className="h-4 w-3/4 rounded bg-zinc-200 dark:bg-zinc-700" />
                <div className="h-4 w-1/2 rounded bg-zinc-200 dark:bg-zinc-700" />
              </div>
            </motion.div>
          ))}
        </motion.div>
      ) : bookings.length === 0 ? (
        <motion.div
          className="rounded-2xl border border-zinc-200 bg-white/80 py-16 text-center dark:border-white/10 dark:bg-zinc-900/50"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          <Calendar className="mx-auto h-16 w-16 text-zinc-400" />
          <h3 className="mt-4 text-xl font-semibold text-zinc-900 dark:text-white">
            {t('bookings.emptyTitle') || 'No tienes reservaciones aún'}
          </h3>
          <p className="mt-2 text-zinc-500 dark:text-gray-400">
            {t('profile.emptySubtitle') ||
              'Explora nuestras experiencias y reserva tu próxima aventura'}
          </p>
          <Link
            href="/journeys"
            className="mt-6 inline-flex items-center rounded-xl bg-orange-500 px-6 py-3 font-semibold text-white transition-colors hover:bg-orange-600"
          >
            {t('profile.explore') || 'Explorar experiencias'}
          </Link>
        </motion.div>
      ) : (
        <motion.div
          className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
        >
          {/* Buscador de reservas por nombre o código/ticket */}
          <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end">
            <div className="min-w-0 flex-1">
              <label className="mb-1 block text-xs font-medium text-zinc-500 dark:text-zinc-400">
                {isEs ? 'Buscar reserva por nombre o código' : 'Search booking by name or code'}
              </label>
              <input
                type="text"
                value={ticketSearch}
                onChange={(e) => setTicketSearch(e.target.value)}
                placeholder={
                  isEs ? 'Nombre, código o clave de reserva' : 'Name, code or booking reference'
                }
                className="w-full rounded-lg border border-zinc-200 bg-white px-3 py-2.5 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-500/20 dark:border-white/10 dark:bg-zinc-900 dark:text-white"
              />
            </div>
            <button
              type="button"
              onClick={() => setShowScanner(true)}
              className="rounded-lg bg-orange-500 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-orange-600"
            >
              <QrCode className="mr-2 h-4 w-4" />
              {isEs ? 'Escanear QR' : 'Scan QR'}
            </button>
          </div>

          {filteredBookings.map((booking: any, index: number) => (
            <motion.div
              key={booking.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: index * 0.08 }}
              className="group relative flex flex-col overflow-hidden rounded-2xl border border-zinc-200 bg-white/80 transition-all duration-300 hover:border-orange-500/30 dark:border-white/10 dark:bg-zinc-900/50"
            >
              <div className="relative h-40 overflow-hidden">
                <Image
                  src={booking.experienceImage || '/static/images/jaguarBaja.png'}
                  alt={booking.experienceTitle}
                  fill
                  sizes="(max-width: 768px) 100vw, (max-width: 1280px) 50vw, 33vw"
                  className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                <span className="absolute right-3 top-3 rounded-full bg-emerald-500 px-2 py-1 text-xs font-semibold text-white">
                  {booking.status === 'confirmed' && (isEs ? 'Confirmada' : 'Confirmed')}
                  {booking.status === 'pending' && (isEs ? 'Pendiente' : 'Pending')}
                  {booking.status === 'cancelled' && (isEs ? 'Cancelada' : 'Cancelled')}
                  {booking.status === 'completed' && (isEs ? 'Completada' : 'Completed')}
                </span>
              </div>
              <div className="flex flex-1 flex-col p-4">
                <h3 className="line-clamp-1 mb-1 text-lg font-bold text-zinc-900 dark:text-white">
                  {booking.experienceTitle}
                </h3>
                <p className="mb-1 text-sm text-zinc-500 dark:text-gray-400">
                  {formatBookingDate(booking.date, isEs ? 'es' : 'en')} · {booking.time}
                </p>
                <div className="mt-auto flex items-center justify-between border-t border-zinc-200 pt-3 dark:border-white/10">
                  <span className="text-2xl font-bold text-zinc-900 dark:text-white">
                    ${booking.totalPrice}
                  </span>
                  <button
                    onClick={() => onViewBooking(booking)}
                    className="rounded-xl bg-orange-500 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-orange-600"
                  >
                    {isEs ? 'Ver Ticket' : 'View Ticket'}
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>
      )}
    </motion.div>
  )
}

function ProfileForm({
  form,
  setForm,
  savedMsg,
  setSavedMsg,
  isEs,
  onSubmit,
  profileLoaded,
  user,
}: any) {
  if (!profileLoaded) {
    return (
      <motion.div
        className="flex h-64 items-center justify-center"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-orange-500 border-t-transparent" />
      </motion.div>
    )
  }

  return (
    <>
      <motion.form
        onSubmit={onSubmit}
        className="space-y-5 rounded-2xl border border-zinc-200 bg-white/80 p-6 dark:border-white/10 dark:bg-zinc-900/50"
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5 }}
      >
        <motion.h2
          className="flex items-center gap-2 text-xl font-bold text-zinc-900 dark:text-white"
          initial={{ opacity: 0, y: -10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <GrecaOjoFelino size={24} />
          {isEs ? 'Editar mi información' : 'Edit my information'}
        </motion.h2>
        {savedMsg && (
          <motion.div
            className="rounded-xl border border-emerald-300/60 bg-emerald-50 px-4 py-3 text-sm text-emerald-700 dark:border-emerald-400/40 dark:bg-emerald-900/20 dark:text-emerald-200"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
          >
            ✓ {savedMsg}
          </motion.div>
        )}
        <motion.div
          className="grid gap-4 md:grid-cols-2"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <Field
            label={isEs ? 'Nombre' : 'First name'}
            value={form.firstName}
            onChange={(v) => setForm({ ...form, firstName: v })}
          />
          <Field
            label={isEs ? 'Apellido' : 'Last name'}
            value={form.lastName}
            onChange={(v) => setForm({ ...form, lastName: v })}
          />
          <Field
            label={isEs ? 'Correo electrónico' : 'Email'}
            value={form.email}
            onChange={(v) => setForm({ ...form, email: v })}
          />
          <Field
            label={isEs ? 'Teléfono' : 'Phone'}
            value={form.phone}
            onChange={(v) => setForm({ ...form, phone: v })}
          />
          <Field
            label={isEs ? 'País' : 'Country'}
            value={form.country}
            onChange={(v) => setForm({ ...form, country: v })}
          />
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <label className="mb-1 block text-sm font-medium text-zinc-700 dark:text-gray-300">
            {isEs ? 'Acerca de ti' : 'About you'}
          </label>
          <textarea
            rows={3}
            value={form.summary}
            onChange={(e) => setForm({ ...form, summary: e.target.value })}
            className="w-full rounded-xl border border-zinc-300 bg-white px-4 py-3 text-sm text-zinc-900 placeholder-zinc-400 focus:border-orange-500 focus:outline-none dark:border-white/10 dark:bg-zinc-900 dark:text-white"
          />
        </motion.div>
        <motion.button
          type="submit"
          className="rounded-xl bg-orange-500 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-orange-600"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.3 }}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          {isEs ? 'Guardar cambios' : 'Save changes'}
        </motion.button>
      </motion.form>

      <ClientQrSection isEs={isEs} user={null} />
    </>
  )
}

function ClientQrSection({ isEs, user }: { isEs: boolean; user: any }) {
  const [QRCodeComponent, setQRCodeComponent] = useState<any>(null)

  useEffect(() => {
    import('qrcode.react').then((mod) => setQRCodeComponent(() => mod.QRCodeSVG))
  }, [])

  const clientCode = user?.id ? String(user.id).slice(0, 8).toUpperCase() : 'DEMO'
  const qrValue = buildClientQr(clientCode)

  return (
    <motion.div
      className="mt-6 rounded-2xl border border-zinc-200 bg-white/80 p-6 dark:border-white/10 dark:bg-zinc-900/50"
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5 }}
    >
      <p className="text-xs font-bold uppercase tracking-[0.2em] text-orange-500">
        {isEs ? 'Tu código QR' : 'Your QR code'}
      </p>
      <p className="mt-1 text-sm text-zinc-600 dark:text-gray-400">
        {isEs
          ? 'Muestra este código para que tus guías o el equipo te identifiquen al check-in.'
          : 'Show this code so your guides or team can identify you at check-in.'}
      </p>

      <div className="mt-4 flex flex-col items-center gap-4 sm:flex-row">
        <div className="flex shrink-0 items-center justify-center rounded-2xl border border-zinc-200 bg-white p-4 dark:border-white/10 dark:bg-zinc-900">
          {QRCodeComponent ? (
            <QRCodeComponent
              value={qrValue}
              size={140}
              level="M"
              bgColor="#ffffff"
              fgColor="#0f172a"
            />
          ) : (
            <div className="flex h-[140px] w-[140px] items-center justify-center">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-orange-500 border-t-transparent" />
            </div>
          )}
        </div>

        <div className="text-center sm:text-left">
          <p className="rounded-lg bg-zinc-100 px-3 py-1.5 font-mono text-lg font-bold text-zinc-900 dark:bg-white/10 dark:text-white">
            {qrValue}
          </p>
          <p className="mt-2 text-xs text-zinc-500">
            {isEs ? 'Nombre' : 'Name'}: {user?.firstName || '—'} {user?.lastName || ''}
          </p>
          <p className="text-xs text-zinc-500">
            {isEs ? 'Correo' : 'Email'}: {user?.email || '—'}
          </p>
        </div>
      </div>
    </motion.div>
  )
}

function SecuritySection({
  pwMsg,
  setPwMsg,
  gdprMsg,
  setGdprMsg,
  isEs,
  onChangePassword,
  onExport,
  onExportCsv,
  onDelete,
}: any) {
  return (
    <motion.div
      className="space-y-6"
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      viewport={{ once: true, margin: '-100px' }}
      transition={{ duration: 0.5 }}
    >
      <motion.form
        onSubmit={onChangePassword}
        className="space-y-4 rounded-2xl border border-zinc-200 bg-white/80 p-6 dark:border-white/10 dark:bg-zinc-900/50"
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5, delay: 0.1 }}
      >
        <motion.h2
          className="flex items-center gap-2 text-xl font-bold text-zinc-900 dark:text-white"
          initial={{ opacity: 0, x: -20 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
        >
          <GrecaOjoFelino size={24} />
          <Lock className="h-5 w-5 text-orange-500" />
          {isEs ? 'Cambiar contraseña' : 'Change password'}
        </motion.h2>
        {pwMsg && (
          <motion.div
            className={`rounded-xl border px-4 py-3 text-sm ${
              pwMsg.type === 'success'
                ? 'border-emerald-300/60 bg-emerald-50 text-emerald-700 dark:border-emerald-400/40 dark:bg-emerald-900/20 dark:text-emerald-200'
                : 'border-red-500/30 bg-red-500/10 text-red-600 dark:bg-red-500/20 dark:text-red-300'
            }`}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
          >
            {pwMsg.message}
          </motion.div>
        )}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.4, delay: 0.1 }}
        >
          <PasswordField
            name="currentPassword"
            label={isEs ? 'Contraseña actual' : 'Current password'}
          />
          <PasswordField name="newPassword" label={isEs ? 'Nueva contraseña' : 'New password'} />
          <PasswordField
            name="confirmPassword"
            label={isEs ? 'Confirmar contraseña' : 'Confirm password'}
          />
        </motion.div>
        <motion.button
          type="submit"
          className="rounded-xl bg-orange-500 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-orange-600"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.4, delay: 0.2 }}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          {isEs ? 'Actualizar contraseña' : 'Update password'}
        </motion.button>
        <motion.p
          className="text-xs text-zinc-500 dark:text-gray-400"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.4, delay: 0.3 }}
        >
          {isEs
            ? 'Usa una contraseña segura con mayúsculas, minúsculas y caracteres especiales.'
            : 'Use a strong password with upper, lower and special characters.'}
        </motion.p>
      </motion.form>

      <motion.div
        className="space-y-4 rounded-2xl border border-zinc-200 bg-white/80 p-6 dark:border-white/10 dark:bg-zinc-900/50"
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5, delay: 0.15 }}
      >
        <motion.h2
          className="flex items-center gap-2 text-xl font-bold text-zinc-900 dark:text-white"
          initial={{ opacity: 0, x: -20 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
        >
          <GrecaOjoFelino size={24} />
          {isEs ? 'Gestión de datos (GDPR)' : 'Data management (GDPR)'}
        </motion.h2>
        {gdprMsg && (
          <motion.div
            className="rounded-xl border border-emerald-300/60 bg-emerald-50 px-4 py-3 text-sm text-emerald-700 dark:border-emerald-400/40 dark:bg-emerald-900/20 dark:text-emerald-200"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
          >
            ✓ {gdprMsg}
          </motion.div>
        )}
        <motion.p
          className="text-sm text-zinc-500 dark:text-gray-400"
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.4, delay: 0.1 }}
        >
          {isEs
            ? 'Todo lo que alojamos de ti: cuenta, reservas, reseñas, sesiones y actividad. Tus campos personales se descifran porque son tuyos.'
            : 'Everything we host about you: account, bookings, reviews, sessions and activity. Your personal fields are decrypted because they are yours.'}
        </motion.p>
        <motion.div
          className="flex flex-wrap gap-3"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.4, delay: 0.2 }}
        >
          <motion.button
            onClick={onExport}
            className="inline-flex items-center gap-2 rounded-md bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <Download className="h-4 w-4" />
            {isEs ? 'Exportar datos (JSON)' : 'Export data (JSON)'}
          </motion.button>
          <motion.button
            onClick={onExportCsv}
            className="inline-flex items-center gap-2 rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <FileText className="h-4 w-4" />
            {isEs ? 'Exportar CSV' : 'Export CSV'}
          </motion.button>
        </motion.div>
        <motion.p
          className="text-xs text-zinc-500 dark:text-gray-400"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.4, delay: 0.3 }}
        >
          {isEs
            ? 'Cifrados en tránsito (TLS) y en reposo (AES-256-GCM). Al eliminar tu cuenta se borran sesiones, actividad y reseñas; las reservas se conservan de forma anónima por obligación contable.'
            : 'Encrypted in transit (TLS) and at rest (AES-256-GCM). Deleting your account removes sessions, activity and reviews; bookings are kept anonymously for accounting.'}
        </motion.p>
      </motion.div>

      <motion.div
        className="rounded-2xl border border-red-200/60 bg-red-50/50 p-6 dark:border-red-500/30 dark:bg-red-900/20"
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5, delay: 0.3 }}
      >
        <motion.h4
          className="text-sm font-semibold text-red-800 dark:text-red-200"
          initial={{ opacity: 0, x: -20 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
        >
          {isEs ? 'Eliminar cuenta' : 'Delete account'}
        </motion.h4>
        <motion.div
          className="mt-2 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.4, delay: 0.1 }}
        >
          <motion.p
            className="text-xs text-red-600/80 dark:text-red-300/80"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
          >
            {isEs
              ? 'Esta acción eliminará permanentemente tu cuenta y todos tus datos. No se puede deshacer.'
              : 'This will permanently delete your account and all your data. This cannot be undone.'}
          </motion.p>
          <motion.button
            onClick={onDelete}
            className="inline-flex shrink-0 items-center gap-2 rounded-lg bg-red-600/10 px-4 py-2 text-sm font-medium text-red-700 hover:bg-red-600/20 dark:bg-red-900/40 dark:text-red-200 dark:hover:bg-red-900/60"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <Trash2 className="h-4 w-4" />
            {isEs ? 'Eliminar cuenta' : 'Delete account'}
          </motion.button>
        </motion.div>
      </motion.div>
    </motion.div>
  )
}

function Field({
  label,
  value,
  onChange,
}: {
  label: string
  value: string
  onChange: (v: string) => void
}) {
  return (
    <div>
      <label className="mb-1 block text-sm font-medium text-zinc-700 dark:text-gray-300">
        {label}
      </label>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-xl border border-zinc-300 bg-white px-4 py-3 text-sm text-zinc-900 placeholder-zinc-400 focus:border-orange-500 focus:outline-none dark:border-white/10 dark:bg-zinc-900 dark:text-white"
      />
    </div>
  )
}

function PasswordField({ name, label }: { name: string; label: string }) {
  return (
    <div>
      <label className="mb-1 block text-sm font-medium text-zinc-700 dark:text-gray-300">
        {label}
      </label>
      <input
        name={name}
        type="password"
        className="w-full rounded-xl border border-zinc-300 bg-white px-4 py-3 text-sm text-zinc-900 placeholder-zinc-400 focus:border-orange-500 focus:outline-none dark:border-white/10 dark:bg-zinc-900 dark:text-white"
      />
    </div>
  )
}

function TourGrid({
  tours: list,
  isEs,
  emptyLabel,
  onToggle,
  isFavorite,
}: {
  tours: any[]
  isEs: boolean
  emptyLabel: string
  onToggle?: (id: string) => void
  isFavorite?: (id: string) => boolean
}) {
  if (list.length === 0) {
    return (
      <div className="rounded-2xl border border-zinc-200 bg-white/80 py-16 text-center dark:border-white/10 dark:bg-zinc-900/50">
        <Heart className="mx-auto h-16 w-16 text-zinc-400" />
        <p className="mt-4 text-zinc-500 dark:text-gray-400">{emptyLabel}</p>
      </div>
    )
  }
  return (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
      {list.map((tour) => {
        const title = isEs ? tour.titleEs || tour.title : tour.title
        const fav = isFavorite ? isFavorite(tour.id) : false
        return (
          <div
            key={tour.id}
            className="group relative flex flex-col overflow-hidden rounded-2xl border border-zinc-200 bg-white/80 transition-all duration-300 hover:border-orange-500/30 dark:border-white/10 dark:bg-zinc-900/50"
          >
            <Link href={`/tours/${tour.id}`} className="block">
              <div className="relative h-40 w-full overflow-hidden">
                <Image
                  src={tour.imageUrl}
                  alt={title}
                  fill
                  sizes="100vw"
                  className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
              </div>
            </Link>
            <div className="flex flex-1 flex-col p-4">
              <Link
                href={`/tours/${tour.id}`}
                className="text-lg font-bold text-zinc-900 hover:text-orange-500 dark:text-white"
              >
                {title}
              </Link>
              <p className="line-clamp-2 mt-1 text-sm text-zinc-500 dark:text-gray-400">
                {isEs ? tour.taglineEs || tour.tagline : tour.tagline}
              </p>
              <div className="mt-auto flex items-center justify-between pt-3">
                <span className="text-xl font-bold text-zinc-900 dark:text-white">
                  ${tour.price}
                </span>
                {onToggle && (
                  <button
                    type="button"
                    onClick={() => onToggle(tour.id)}
                    aria-label={isEs ? 'Quitar de favoritos' : 'Remove from favorites'}
                    className={`flex h-10 w-10 items-center justify-center rounded-full transition-colors ${
                      fav ? 'bg-rose-500/10 text-rose-500' : 'text-zinc-400 hover:text-rose-500'
                    }`}
                  >
                    <Heart className={`h-5 w-5 ${fav ? 'fill-current' : ''}`} />
                  </button>
                )}
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
