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

  useEffect(() => {
    if (user) {
      fetchBookings()
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
            <div className="flex items-center gap-3">
              <input
                type="text"
                placeholder={isEs ? 'Buscar reserva...' : 'Search reservation...'}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-48 rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-500/20 dark:border-white/10 dark:bg-zinc-900 dark:text-white dark:placeholder:text-zinc-500 sm:w-64"
              />
              <Link
                href="/tours"
                className="text-sm font-medium text-orange-500 hover:text-orange-400"
              >
                {t('bookings.bookNew') || 'Reservar nueva experiencia'}
              </Link>
            </div>
          </div>

          {error && (
            <div className="mb-6 rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-red-600 dark:bg-red-500/20 dark:text-red-300">
              {error}
            </div>
          )}

          {isLoadingBookings ? (
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
          ) : filteredBookings.length === 0 ? (
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
                  d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
              <h3 className="mt-4 text-xl font-semibold text-gray-900 dark:text-white">
                {t('bookings.emptyTitle') || 'No tienes reservaciones aún'}
              </h3>
              <p className="mt-2 text-zinc-500 dark:text-gray-400">
                {t('bookings.emptySubtitle') ||
                  'Explora nuestras experiencias y reserva tu próxima aventura'}
              </p>
              <Link
                href="/tours"
                className="mt-6 inline-flex items-center rounded-xl bg-orange-500 px-6 py-3 font-semibold text-white transition-colors hover:bg-orange-600"
              >
                {t('bookings.explore') || 'Explorar experiencias'}
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
              {filteredBookings.map((booking, index) => (
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
                            d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
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
