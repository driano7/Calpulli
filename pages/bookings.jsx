'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import Link from '@/components/Link'
import Image from '@/components/Image'
import { useAuth } from '@/lib/hooks/useAuth'
import { useLanguage } from '@/lib/hooks/useLanguage'
import { VirtualTicket } from '@/components/tickets/VirtualTicket'
import { AnimatedSection } from '@/components/AnimatedSection'
import { formatBookingDate } from '@/lib/booking/types'
import { formatPriceByLocale } from '@/lib/currency'

export default function BookingsPage() {
  const { user, isLoading: authLoading } = useAuth()
  const { t, currentLanguage } = useLanguage()
  const isEs = currentLanguage === 'es'
  const [showTicket, setShowTicket] = useState(null)
  const [bookings, setBookings] = useState([])
  const [isLoadingBookings, setIsLoadingBookings] = useState(true)
  const [error, setError] = useState(null)
  const [showGuestBookings, setShowGuestBookings] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')

  // --- Búsqueda de reservas (invitado y autenticado) ---
  const [activities, setActivities] = useState([])
  const [isLoadingActivities, setIsLoadingActivities] = useState(false)
  const [activityDropdownOpen, setActivityDropdownOpen] = useState(false)
  const [selectedActivity, setSelectedActivity] = useState(null)
  const [searchFilters, setSearchFilters] = useState({
    activityId: '',
    date: '',
    name: '',
    reference: '',
  })
  const [searchResults, setSearchResults] = useState([])
  const [isSearching, setIsSearching] = useState(false)
  const [searchError, setSearchError] = useState(null)
  const [hasSearched, setHasSearched] = useState(false)

  const today = new Date()
  const oneMonthAgo = new Date(today)
  oneMonthAgo.setMonth(today.getMonth() - 1)
  const oneMonthFromNow = new Date(today)
  oneMonthFromNow.setMonth(today.getMonth() + 1)
  const minDate = oneMonthAgo.toISOString().split('T')[0]
  const maxDate = oneMonthFromNow.toISOString().split('T')[0]

  const formatPrice = (price) => formatPriceByLocale(price, 'es')

  const getStatusColor = (status) => {
    switch (status) {
      case 'confirmed':
        return 'bg-emerald-100 text-emerald-800'
      case 'pending':
        return 'bg-amber-100 text-amber-800'
      case 'cancelled':
        return 'bg-red-100 text-red-800'
      case 'completed':
        return 'bg-blue-100 text-blue-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  // Cargar actividades para el dropdown
  useEffect(() => {
    fetchActivities()
  }, [])

  const fetchActivities = async () => {
    setIsLoadingActivities(true)
    try {
      const response = await fetch('/api/activities?locale=' + (isEs ? 'es' : 'en'))
      const data = await response.json()
      if (data.activities) {
        setActivities(data.activities)
      }
    } catch (error) {
      console.error('Error fetching activities:', error)
    } finally {
      setIsLoadingActivities(false)
    }
  }

  // Cargar reservas según el estado de autenticación
  useEffect(() => {
    if (user) {
      fetchBookings()
    } else {
      // Invitado: cargar desde localStorage
      const storedBookings =
        typeof window !== 'undefined' ? localStorage.getItem('calpulli_bookings') : null
      if (storedBookings) {
        try {
          const parsed = JSON.parse(storedBookings || '[]')
          const guestBookings = parsed.filter((b) => b.userId && b.userId.startsWith('guest_'))
          if (guestBookings.length > 0) {
            setBookings(guestBookings)
            setShowGuestBookings(true)
          }
        } catch (e) {
          console.error('Error parsing guest bookings:', e)
        }
      }
      setIsLoadingBookings(false)
    }
  }, [user])

  const fetchBookings = async () => {
    setIsLoadingBookings(true)
    try {
      const response = await fetch('/api/bookings', {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('authToken')}`,
        },
      })
      const data = await response.json()
      if (data.bookings) {
        setBookings(data.bookings)
      }
    } catch (error) {
      console.error('Error fetching bookings:', error)
      setError('Error al cargar reservaciones')
    } finally {
      setIsLoadingBookings(false)
    }
  }

  // Aplicar filtros de búsqueda
  const handleSearch = () => {
    setIsSearching(true)
    setSearchError(null)
    setHasSearched(true)

    if (user) {
      // Usuario autenticado: llamar a la API
      void searchBookingsAPI()
    } else {
      // Invitado: filtrar localmente
      filterGuestBookings()
    }
    setIsSearching(false)
  }

  const searchBookingsAPI = async () => {
    const params = new URLSearchParams()
    if (searchFilters.activityId) params.append('experienceId', searchFilters.activityId)
    if (searchFilters.date) params.append('date', searchFilters.date)
    if (searchFilters.name) params.append('name', searchFilters.name)
    if (searchFilters.reference) params.append('reference', searchFilters.reference)

    try {
      const response = await fetch('/api/bookings/search?' + params.toString(), {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('authToken')}`,
        },
      })
      if (response.status === 400) {
        const err = await response.json()
        setSearchError(err.error || err.es || 'Error en la búsqueda')
        setSearchResults([])
        return
      }
      const data = await response.json()
      setSearchResults(data.bookings || [])
    } catch (error) {
      console.error('Error searching bookings:', error)
      setSearchError('Error al buscar reservaciones')
      setSearchResults([])
    }
  }

  const filterGuestBookings = () => {
    const todayStr = new Date().toISOString().split('T')[0]
    const oneMonthAgoStr = oneMonthAgo.toISOString().split('T')[0]
    const oneMonthFromNowStr = oneMonthFromNow.toISOString().split('T')[0]

    const filtered = bookings.filter((b) => {
      // Regla: ±1 mes desde hoy
      if (b.date && (b.date < oneMonthAgoStr || b.date > oneMonthFromNowStr)) {
        return false
      }
      // Filtro por actividad
      if (searchFilters.activityId && b.experienceId !== searchFilters.activityId) {
        return false
      }
      // Filtro por fecha exacta
      if (searchFilters.date && b.date !== searchFilters.date) {
        return false
      }
      // Filtro por nombre
      if (searchFilters.name) {
        const q = searchFilters.name.toLowerCase().trim()
        const nameMatch =
          b.customerName?.toLowerCase().includes(q) ||
          b.participantNames?.some((pn) => pn.toLowerCase().includes(q)) ||
          b.id?.toLowerCase().includes(q)
        if (!nameMatch) return false
      }
      // Filtro por clave de reserva / código de ticket
      if (searchFilters.reference) {
        const q = searchFilters.reference.toLowerCase().trim()
        const refMatch =
          b.bookingReference?.toLowerCase().includes(q) ||
          b.ticketCode?.toLowerCase().includes(q) ||
          b.id?.toLowerCase().includes(q)
        if (!refMatch) return false
      }
      return true
    })
    setSearchResults(filtered)
  }

  // Lista filtrada para mostrar
  const filteredBookings = bookings.filter((b) => {
    const q = searchQuery.toLowerCase().trim()
    if (!q) return true
    return (
      b.id?.toLowerCase().includes(q) ||
      b.bookingReference?.toLowerCase().includes(q) ||
      b.ticketCode?.toLowerCase().includes(q) ||
      b.experienceTitle?.toLowerCase().includes(q) ||
      (b.date && b.date.toLowerCase().includes(q)) ||
      (b.time && b.time.toLowerCase().includes(q))
    )
  })

  // Para usuarios autenticados: mostrar resultados de búsqueda si se ha buscado
  // Para invitados: mostrar resultados de búsqueda local si se ha buscado
  const displayBookings =
    user || showGuestBookings ? (hasSearched ? searchResults : filteredBookings) : filteredBookings

  if (authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white dark:bg-zinc-950">
        <div className="text-center text-zinc-500 dark:text-gray-400">Cargando...</div>
      </div>
    )
  }

  if (!user && !showGuestBookings) {
    // Sin usuario ni reservas de invitado: mostrar formulario de búsqueda y login
    return (
      <div className="min-h-screen bg-white dark:bg-zinc-950">
        <div className="container mx-auto px-4 py-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="mx-auto max-w-4xl"
          >
            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                {t('bookings.title') || 'Mis Reservaciones'}
              </h2>
              <Link
                href="/journeys"
                className="text-sm font-medium text-orange-500 hover:text-orange-400"
              >
                {t('bookings.bookNew') || 'Reservar nuevo journey'}
              </Link>
            </div>

            {/* Formulario de búsqueda para invitado */}
            <section className="mb-8 rounded-xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-zinc-900/50">
              <h3 className="mb-4 text-lg font-bold text-gray-900 dark:text-white">
                {isEs ? 'Buscar tu reservación' : 'Search your booking'}
              </h3>

              <div className="grid grid-cols-1 items-end gap-4 sm:grid-cols-4">
                {/* Dropdown de actividad */}
                <div className="relative w-full">
                  <label className="mb-2 block text-sm font-medium text-zinc-600 dark:text-zinc-300">
                    {isEs ? 'Tipo de actividad' : 'Activity type'}
                  </label>
                  <button
                    type="button"
                    onClick={() => setActivityDropdownOpen(!activityDropdownOpen)}
                    className="flex w-full items-center gap-3 rounded-lg border border-zinc-200 bg-white px-3 py-2.5 text-sm text-zinc-900 transition-all focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-500/20 dark:border-white/10 dark:bg-zinc-900 dark:text-white"
                  >
                    {selectedActivity ? (
                      <>
                        <img
                          src={selectedActivity.imageUrl}
                          alt={selectedActivity.title}
                          className="h-8 w-8 rounded-md border border-zinc-100 object-cover dark:border-white/10"
                        />
                        <span>{selectedActivity.title}</span>
                      </>
                    ) : (
                      <span className="text-zinc-400">
                        {isEs ? 'Todas las actividades' : 'All activities'}
                      </span>
                    )}
                    <svg
                      className={`ml-auto h-4 w-4 text-zinc-400 transition-transform ${
                        activityDropdownOpen ? 'rotate-180' : ''
                      }`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 9l-7 7-7-7"
                      />
                    </svg>
                  </button>

                  {activityDropdownOpen && (
                    <div className="dropdown-list absolute z-50 mt-1 max-h-60 w-full overflow-y-auto rounded-lg border border-zinc-200 bg-white shadow-lg dark:border-white/10 dark:bg-zinc-900">
                      <button
                        type="button"
                        onClick={() => {
                          setSearchFilters({ ...searchFilters, activityId: '' })
                          setSelectedActivity(null)
                          setActivityDropdownOpen(false)
                        }}
                        className="flex w-full items-center gap-3 px-3 py-2.5 text-sm text-zinc-600 hover:bg-zinc-50 dark:text-zinc-300 dark:hover:bg-zinc-800"
                      >
                        <span className="text-zinc-400">
                          {isEs ? 'Todas las actividades' : 'All activities'}
                        </span>
                      </button>
                      {activities.map((a) => (
                        <button
                          key={a.id}
                          type="button"
                          onClick={() => {
                            setSearchFilters({ ...searchFilters, activityId: a.id })
                            setSelectedActivity(a)
                            setActivityDropdownOpen(false)
                          }}
                          className="flex w-full items-center gap-3 border-b border-zinc-100 px-3 py-2.5 text-sm text-zinc-900 last:border-0 hover:bg-zinc-50 dark:border-white/5 dark:text-white dark:hover:bg-zinc-800"
                        >
                          <img
                            src={a.imageUrl}
                            alt={a.title}
                            className="h-8 w-8 flex-shrink-0 rounded-md border border-zinc-100 object-cover dark:border-white/10"
                          />
                          <span>{a.title}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Fecha */}
                <div>
                  <label className="mb-2 block text-sm font-medium text-zinc-600 dark:text-zinc-300">
                    {isEs ? 'Fecha' : 'Date'}
                  </label>
                  <input
                    type="date"
                    value={searchFilters.date}
                    onChange={(e) => setSearchFilters({ ...searchFilters, date: e.target.value })}
                    min={minDate}
                    max={maxDate}
                    className="w-full rounded-lg border border-zinc-200 bg-white px-3 py-2.5 text-sm text-zinc-900 focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-500/20 dark:border-white/10 dark:bg-zinc-900 dark:text-white"
                  />
                </div>

                {/* Nombre */}
                <div>
                  <label className="mb-2 block text-sm font-medium text-zinc-600 dark:text-zinc-300">
                    {isEs ? 'Nombre' : 'Name'}
                  </label>
                  <input
                    type="text"
                    placeholder={isEs ? 'Tu nombre o de un acompañante' : 'Your name or companion'}
                    value={searchFilters.name}
                    onChange={(e) => setSearchFilters({ ...searchFilters, name: e.target.value })}
                    className="w-full rounded-lg border border-zinc-200 bg-white px-3 py-2.5 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-500/20 dark:border-white/10 dark:bg-zinc-900 dark:text-white dark:placeholder:text-zinc-500"
                  />
                </div>

                {/* Clave de reserva / Código ticket */}
                <div>
                  <label className="mb-2 block text-sm font-medium text-zinc-600 dark:text-zinc-300">
                    {isEs ? 'Clave de reserva' : 'Booking reference'}
                  </label>
                  <input
                    type="text"
                    placeholder={
                      isEs ? 'Código o clave de reserva' : 'Booking reference or ticket code'
                    }
                    value={searchFilters.reference}
                    onChange={(e) =>
                      setSearchFilters({ ...searchFilters, reference: e.target.value })
                    }
                    className="w-full rounded-lg border border-zinc-200 bg-white px-3 py-2.5 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-500/20 dark:border-white/10 dark:bg-zinc-900 dark:text-white dark:placeholder:text-zinc-500"
                  />
                </div>

                {/* Botón buscar */}
                <button
                  onClick={handleSearch}
                  disabled={isSearching}
                  className="w-full rounded-lg bg-orange-500 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-orange-600 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isSearching
                    ? isEs
                      ? 'Buscando...'
                      : 'Searching...'
                    : isEs
                    ? 'Buscar reservación'
                    : 'Search booking'}
                </button>
              </div>

              {/* Mensaje de rango de fechas */}
              <p className="mt-3 text-xs text-zinc-500 dark:text-zinc-400">
                {isEs
                  ? `Solo puedes buscar reservas entre el ${oneMonthAgo.toLocaleDateString(
                      'es-MX',
                      { day: 'numeric', month: 'short' }
                    )} y el ${oneMonthFromNow.toLocaleDateString('es-MX', {
                      day: 'numeric',
                      month: 'short',
                    })} (máximo ±1 mes desde hoy).`
                  : `You can only search bookings between ${oneMonthAgo.toLocaleDateString(
                      'en-US',
                      { day: 'numeric', month: 'short' }
                    )} and ${oneMonthFromNow.toLocaleDateString('en-US', {
                      day: 'numeric',
                      month: 'short',
                    })} (maximum ±1 month from today).`}
              </p>

              {searchError && (
                <div className="mt-3 rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-600 dark:bg-red-500/20 dark:text-red-300">
                  {searchError}
                </div>
              )}

              {hasSearched &&
                searchResults.length === 0 &&
                !searchFilters.activityId &&
                !searchFilters.date &&
                !searchFilters.name &&
                !searchFilters.reference &&
                !isSearching &&
                !searchError && (
                  <div className="mt-3 rounded-lg border border-zinc-200 bg-zinc-50 p-3 text-sm text-zinc-500 dark:border-white/10 dark:bg-zinc-900/50 dark:text-zinc-400">
                    {isEs
                      ? 'Rellena al menos un filtro y presiona Buscar.'
                      : 'Fill in at least one filter and press Search.'}
                  </div>
                )}
            </section>

            <div className="rounded-xl border border-zinc-200 bg-zinc-100/50 py-16 text-center dark:border-white/10 dark:bg-zinc-900/50">
              <svg
                className="mx-auto h-16 w-16 text-zinc-400 dark:text-gray-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 002 2v12a2 2 0 002 2z"
                />
              </svg>
              <h3 className="mt-4 text-xl font-semibold text-gray-900 dark:text-white">
                {hasSearched
                  ? isEs
                    ? 'No se encontraron reservaciones'
                    : 'No bookings found'
                  : isEs
                  ? 'No tienes reservaciones aún'
                  : "You don't have any bookings yet"}
              </h3>
              <p className="mt-2 text-zinc-500 dark:text-gray-400">
                {isEs
                  ? 'Inicia sesión para ver y buscar todas tus reservaciones.'
                  : 'Log in to view and search all your bookings.'}
              </p>
              <Link
                href="/login"
                className="mt-6 inline-flex items-center justify-center rounded-xl bg-orange-500 px-8 py-4 font-semibold text-white transition-colors hover:bg-orange-600"
              >
                {isEs ? 'Iniciar sesión' : 'Log in'}
              </Link>
            </div>
          </motion.div>
        </div>
      </div>
    )
  }

  // Usuario con reservas (invitado con bookings en localStorage o autenticado)
  return (
    <div className="min-h-screen bg-white dark:bg-zinc-950">
      <div className="container mx-auto px-4 py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mx-auto max-w-4xl"
        >
          <div className="mb-6 flex items-center justify-between">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              {t('bookings.title') || 'Mis Reservaciones'}
            </h2>
            <Link
              href="/journeys"
              className="text-sm font-medium text-orange-500 hover:text-orange-400"
            >
              {t('bookings.bookNew') || 'Reservar nuevo journey'}
            </Link>
          </div>

          {/* Formulario de búsqueda (invitado y autenticado) */}
          <section className="mb-8 rounded-xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-zinc-900/50">
            <h3 className="mb-4 text-lg font-bold text-gray-900 dark:text-white">
              {isEs ? 'Buscar tu reservación' : 'Search your booking'}
            </h3>

            <div className="grid grid-cols-1 items-end gap-4 sm:grid-cols-4">
              {/* Dropdown de actividad */}
              <div className="relative w-full">
                <label className="mb-2 block text-sm font-medium text-zinc-600 dark:text-zinc-300">
                  {isEs ? 'Tipo de actividad' : 'Activity type'}
                </label>
                <button
                  type="button"
                  onClick={() => setActivityDropdownOpen(!activityDropdownOpen)}
                  className="flex w-full items-center gap-3 rounded-lg border border-zinc-200 bg-white px-3 py-2.5 text-sm text-zinc-900 transition-all focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-500/20 dark:border-white/10 dark:bg-zinc-900 dark:text-white"
                >
                  {selectedActivity ? (
                    <>
                      <img
                        src={selectedActivity.imageUrl}
                        alt={selectedActivity.title}
                        className="h-8 w-8 rounded-md border border-zinc-100 object-cover dark:border-white/10"
                      />
                      <span>{selectedActivity.title}</span>
                    </>
                  ) : (
                    <span className="text-zinc-400">
                      {isEs ? 'Todas las actividades' : 'All activities'}
                    </span>
                  )}
                  <svg
                    className={`ml-auto h-4 w-4 text-zinc-400 transition-transform ${
                      activityDropdownOpen ? 'rotate-180' : ''
                    }`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                </button>

                {activityDropdownOpen && (
                  <div className="dropdown-list absolute z-50 mt-1 max-h-60 w-full overflow-y-auto rounded-lg border border-zinc-200 bg-white shadow-lg dark:border-white/10 dark:bg-zinc-900">
                    <button
                      type="button"
                      onClick={() => {
                        setSearchFilters({ ...searchFilters, activityId: '' })
                        setSelectedActivity(null)
                        setActivityDropdownOpen(false)
                      }}
                      className="flex w-full items-center gap-3 px-3 py-2.5 text-sm text-zinc-600 hover:bg-zinc-50 dark:text-zinc-300 dark:hover:bg-zinc-800"
                    >
                      <span className="text-zinc-400">
                        {isEs ? 'Todas las actividades' : 'All activities'}
                      </span>
                    </button>
                    {activities.map((a) => (
                      <button
                        key={a.id}
                        type="button"
                        onClick={() => {
                          setSearchFilters({ ...searchFilters, activityId: a.id })
                          setSelectedActivity(a)
                          setActivityDropdownOpen(false)
                        }}
                        className="flex w-full items-center gap-3 border-b border-zinc-100 px-3 py-2.5 text-sm text-zinc-900 last:border-0 hover:bg-zinc-50 dark:border-white/5 dark:text-white dark:hover:bg-zinc-800"
                      >
                        <img
                          src={a.imageUrl}
                          alt={a.title}
                          className="h-8 w-8 flex-shrink-0 rounded-md border border-zinc-100 object-cover dark:border-white/10"
                        />
                        <span>{a.title}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Fecha */}
              <div>
                <label className="mb-2 block text-sm font-medium text-zinc-600 dark:text-zinc-300">
                  {isEs ? 'Fecha' : 'Date'}
                </label>
                <input
                  type="date"
                  value={searchFilters.date}
                  onChange={(e) => setSearchFilters({ ...searchFilters, date: e.target.value })}
                  min={minDate}
                  max={maxDate}
                  className="w-full rounded-lg border border-zinc-200 bg-white px-3 py-2.5 text-sm text-zinc-900 focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-500/20 dark:border-white/10 dark:bg-zinc-900 dark:text-white"
                />
              </div>

              {/* Nombre */}
              <div>
                <label className="mb-2 block text-sm font-medium text-zinc-600 dark:text-zinc-300">
                  {isEs ? 'Nombre' : 'Name'}
                </label>
                <input
                  type="text"
                  placeholder={isEs ? 'Tu nombre o de un acompañante' : 'Your name or companion'}
                  value={searchFilters.name}
                  onChange={(e) => setSearchFilters({ ...searchFilters, name: e.target.value })}
                  className="w-full rounded-lg border border-zinc-200 bg-white px-3 py-2.5 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-500/20 dark:border-white/10 dark:bg-zinc-900 dark:text-white dark:placeholder:text-zinc-500"
                />
              </div>

              {/* Botón buscar */}
              <button
                onClick={handleSearch}
                disabled={isSearching}
                className="w-full rounded-lg bg-orange-500 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-orange-600 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isSearching
                  ? isEs
                    ? 'Buscando...'
                    : 'Searching...'
                  : isEs
                  ? 'Buscar reservación'
                  : 'Search booking'}
              </button>
            </div>

            {/* Mensaje de rango de fechas */}
            <p className="mt-3 text-xs text-zinc-500 dark:text-zinc-400">
              {isEs
                ? `Solo puedes buscar reservas entre el ${oneMonthAgo.toLocaleDateString('es-MX', {
                    day: 'numeric',
                    month: 'short',
                  })} y el ${oneMonthFromNow.toLocaleDateString('es-MX', {
                    day: 'numeric',
                    month: 'short',
                  })} (máximo ±1 mes desde hoy).`
                : `You can only search bookings between ${oneMonthAgo.toLocaleDateString('en-US', {
                    day: 'numeric',
                    month: 'short',
                  })} and ${oneMonthFromNow.toLocaleDateString('en-US', {
                    day: 'numeric',
                    month: 'short',
                  })} (maximum ±1 month from today).`}
            </p>

            {searchError && (
              <div className="mt-3 rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-600 dark:bg-red-500/20 dark:text-red-300">
                {searchError}
              </div>
            )}

            {hasSearched &&
              searchResults.length === 0 &&
              !searchFilters.activityId &&
              !searchFilters.date &&
              !searchFilters.name &&
              !isSearching &&
              !searchError && (
                <div className="mt-3 rounded-lg border border-zinc-200 bg-zinc-50 p-3 text-sm text-zinc-500 dark:border-white/10 dark:bg-zinc-900/50 dark:text-zinc-400">
                  {isEs
                    ? 'Rellena al menos un filtro y presiona Buscar.'
                    : 'Fill in at least one filter and press Search.'}
                </div>
              )}
          </section>

          {error && (
            <div className="mb-6 rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-red-600 dark:bg-red-500/20 dark:text-red-300">
              {error}
            </div>
          )}

          {/* Resultados */}
          {isLoadingBookings && !hasSearched ? (
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="animate-pulse">
                  <div className="h-48 rounded-t-2xl bg-zinc-200 dark:bg-zinc-800" />
                  <div className="space-y-3 p-4">
                    <div className="h-4 w-3/4 rounded bg-zinc-200 dark:bg-zinc-700" />
                    <div className="h-4 w-1/2 rounded bg-zinc-200 dark:bg-zinc-700" />
                  </div>
                </div>
              ))}
            </div>
          ) : isSearching ? (
            <div className="flex items-center justify-center py-10">
              <p className="text-zinc-500 dark:text-zinc-400">
                {isEs ? 'Buscando...' : 'Searching...'}
              </p>
            </div>
          ) : displayBookings.length === 0 ? (
            <div className="rounded-2xl border border-zinc-200 bg-zinc-100/50 py-16 text-center dark:border-white/10 dark:bg-zinc-900/50">
              <svg
                className="mx-auto h-16 w-16 text-zinc-400 dark:text-gray-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 002 2v12a2 2 0 002 2z"
                />
              </svg>
              <h3 className="mt-4 text-xl font-semibold text-gray-900 dark:text-white">
                {hasSearched
                  ? isEs
                    ? 'No se encontraron reservaciones'
                    : 'No bookings found'
                  : isEs
                  ? 'No tienes reservaciones aún'
                  : "You don't have any bookings yet"}
              </h3>
              <p className="mt-2 text-zinc-500 dark:text-gray-400">
                {hasSearched
                  ? isEs
                    ? 'Intenta con otros filtros o amplía el rango de fechas.'
                    : 'Try other filters or broaden the date range.'
                  : isEs
                  ? 'Explora nuestras experiencias y reserva tu próxima aventura.'
                  : 'Explore our experiences and book your next adventure.'}
              </p>
              {!hasSearched && (
                <Link
                  href="/journeys"
                  className="mt-6 inline-flex items-center rounded-xl bg-orange-500 px-6 py-3 font-semibold text-white transition-colors hover:bg-orange-600"
                >
                  {t('bookings.explore') || 'Explorar experiencias'}
                </Link>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
              {displayBookings.map((booking, index) => (
                <AnimatedSection
                  key={booking.id}
                  delay={index * 0.08}
                  direction="up"
                  className="w-full"
                >
                  <div className="group relative flex flex-col overflow-hidden rounded-2xl border border-zinc-200 bg-white transition-all duration-300 hover:border-orange-500/30 hover:shadow-[0_20px_40px_rgba(0,0,0,0.08)] dark:border-white/10 dark:bg-zinc-900/50 dark:hover:bg-zinc-900/70 dark:hover:shadow-[0_20px_40px_rgba(0,0,0,0.3)]">
                    <div className="relative h-40 overflow-hidden">
                      <Image
                        src={booking.experienceImage || '/static/images/jaguarBaja.png'}
                        alt={booking.experienceTitle}
                        fill
                        sizes="(max-width: 768px) 100vw, (max-width: 1280px) 50vw, 33vw"
                        className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                      <div className="absolute top-3 right-3">
                        <span
                          className={`rounded-full px-2 py-1 text-xs font-semibold ${getStatusColor(
                            booking.status
                          )}`}
                        >
                          {booking.status === 'confirmed' && 'Confirmada'}
                          {booking.status === 'pending' && 'Pendiente'}
                          {booking.status === 'cancelled' && 'Cancelada'}
                          {booking.status === 'completed' && 'Completada'}
                        </span>
                      </div>
                    </div>
                    <div className="flex flex-1 flex-col p-4">
                      <h3 className="line-clamp-1 mb-1 text-lg font-bold text-gray-900 dark:text-white">
                        {booking.experienceTitle}
                      </h3>
                      <div className="mb-2 flex items-center gap-2 text-sm text-zinc-500 dark:text-gray-400">
                        <svg
                          className="h-4 w-4"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 002 2v12a2 2 0 002 2z"
                          />
                        </svg>
                        <span>{formatBookingDate(booking.date)}</span>
                      </div>
                      <div className="mb-3 flex items-center gap-2 text-sm text-zinc-500 dark:text-gray-400">
                        <svg
                          className="h-4 w-4"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                          />
                        </svg>
                        <span>{booking.time}</span>
                      </div>
                      <div className="mt-auto flex items-center justify-between border-t border-zinc-200 pt-3 dark:border-white/10">
                        <span className="text-2xl font-bold text-gray-900 dark:text-white">
                          {formatPrice(booking.totalPrice)}
                        </span>
                        <button
                          onClick={() => setShowTicket(booking)}
                          className="rounded-xl bg-orange-500 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-orange-600"
                        >
                          Ver Ticket
                        </button>
                      </div>
                    </div>
                  </div>
                </AnimatedSection>
              ))}
            </div>
          )}
        </motion.div>
      </div>

      {/* Ticket Modal */}
      {showTicket && <VirtualTicket ticket={showTicket} onClose={() => setShowTicket(null)} />}
    </div>
  )
}
