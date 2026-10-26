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

  // --- Búsqueda de reservas para usuarios autenticados ---
  const [activities, setActivities] = useState([])
  const [isLoadingActivities, setIsLoadingActivities] = useState(false)
  const [activityDropdownOpen, setActivityDropdownOpen] = useState(false)
  const [selectedActivity, setSelectedActivity] = useState(null)
  const [searchFilters, setSearchFilters] = useState({
    activityId: '',
    date: '',
    name: '',
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

  useEffect(() => {
    if (user) {
      fetchBookings()
      fetchActivities()
    } else {
      // Check for guest bookings in localStorage when no user is logged in
      const storedBookings =
        typeof window !== 'undefined' ? localStorage.getItem('calpulli_bookings') : null
      if (storedBookings) {
        const parsed = JSON.parse(storedBookings || '[]')
        // Filter for guest bookings (userId starts with 'guest_')
        const guestBookings = parsed.filter((b) => b.userId && b.userId.startsWith('guest_'))
        if (guestBookings.length > 0) {
          setBookings(guestBookings)
          setShowGuestBookings(true)
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

  const handleSearch = async () => {
    setIsSearching(true)
    setSearchError(null)
    setHasSearched(true)

    const params = new URLSearchParams()
    if (searchFilters.activityId) params.append('experienceId', searchFilters.activityId)
    if (searchFilters.date) params.append('date', searchFilters.date)
    if (searchFilters.name) params.append('name', searchFilters.name)

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
    } finally {
      setIsSearching(false)
    }
  }

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

  const filteredBookings = bookings.filter((b) => {
    const q = searchQuery.toLowerCase().trim()
    if (!q) return true
    return (
      b.id?.toLowerCase().includes(q) ||
      b.experienceTitle?.toLowerCase().includes(q) ||
      b.ticketCode?.toLowerCase().includes(q) ||
      (b.date && b.date.toLowerCase().includes(q)) ||
      (b.time && b.time.toLowerCase().includes(q))
    )
  })

  // Para usuarios autenticados: mostrar resultados de búsqueda si se ha buscado,
  // de lo contrario mostrar todos los bookings
  const displayBookings = user && hasSearched ? searchResults : filteredBookings

  if (authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white dark:bg-zinc-950">
        <div className="text-center text-zinc-500 dark:text-gray-400">Cargando...</div>
      </div>
    )
  }

  if (!user) {
    // If we have guest bookings stored, display them
    if (showGuestBookings && bookings.length > 0) {
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
                <div className="relative">
                  <input
                    type="text"
                    placeholder={isEs ? 'Buscar reserva...' : 'Search reservation...'}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-48 rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-500/20 dark:border-white/10 dark:bg-zinc-900 dark:text-white dark:placeholder:text-zinc-500 sm:w-64"
                  />
                </div>
              </div>

              {filteredBookings.length === 0 && bookings.length > 0 && (
                <div className="mb-6 rounded-xl border border-zinc-200 bg-zinc-50 py-8 text-center dark:border-white/10 dark:bg-zinc-900/50">
                  <p className="text-zinc-500 dark:text-zinc-400">
                    {isEs
                      ? 'No se encontraron reservaciones con ese criterio.'
                      : 'No reservations found matching that criteria.'}
                  </p>
                  <button
                    onClick={() => setSearchQuery('')}
                    className="mt-3 text-xs font-medium text-orange-500 hover:underline"
                  >
                    {isEs ? 'Limpiar búsqueda' : 'Clear search'}
                  </button>
                </div>
              )}

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {filteredBookings.map((booking) => (
                  <AnimatedSection
                    key={booking.id}
                    experienceTitle={booking.experienceTitle}
                    experienceImage={booking.experienceImage}
                    date={booking.date}
                    time={booking.time}
                    totalPrice={booking.totalPrice}
                    formatPrice={formatPrice}
                    formatBookingDate={formatBookingDate}
                    participantNames={booking.participantNames}
                  />
                ))}
              </div>
            </motion.div>
          </div>
        </div>
      )
    }

    // Otherwise show login prompt for guest reservations
    return (
      <div className="flex min-h-screen items-center justify-center bg-white px-4 dark:bg-zinc-950">
        <div className="max-w-md text-center">
          <h1 className="mb-4 text-3xl font-bold text-gray-900 dark:text-white">Inicia sesión</h1>
          <p className="mb-6 text-zinc-500 dark:text-gray-400">
            Inicia sesión para ver tus reservaciones
          </p>
          <Link
            href="/login"
            className="inline-flex items-center justify-center rounded-xl bg-orange-500 px-8 py-4 font-semibold text-white transition-colors hover:bg-orange-600"
          >
            Iniciar sesión
          </Link>
        </div>
      </div>
    )
  }

  // --- Usuario autenticado: formulario de búsqueda + resultados ---
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
              href="/tours"
              className="text-sm font-medium text-orange-500 hover:text-orange-400"
            >
              {t('bookings.bookNew') || 'Reservar nueva experiencia'}
            </Link>
          </div>

          {/* Formulario de búsqueda */}
          <section className="mb-8 rounded-xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-zinc-900/50">
            <h3 className="mb-4 text-lg font-bold text-gray-900 dark:text-white">
              {isEs ? 'Buscar tu reservación' : 'Search your booking'}
            </h3>

            <div className="grid grid-cols-1 items-end gap-4 sm:grid-cols-4">
              {/* Dropdown de actividad con foto + título */}
              <div
                className="relative w-full"
                onClick={(e) => {
                  if (!e.target.closest('.dropdown-list')) {
                    setActivityDropdownOpen(!activityDropdownOpen)
                  }
                }}
              >
                <label className="mb-2 block text-sm font-medium text-zinc-600 dark:text-zinc-300">
                  {isEs ? 'Tipo de actividad' : 'Activity type'}
                </label>
                <button
                  type="button"
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
                  href="/tours"
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
