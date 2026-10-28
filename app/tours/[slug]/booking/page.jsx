'use client'

import { useState, useEffect, useMemo, useCallback, useId } from 'react'
import { useParams } from 'next/navigation'
import { motion } from 'framer-motion'
import Image from '@/components/Image'
import Link from '@/components/Link'
import { Calendar, Clock, Users, MapPin, Star, Check, ChevronRight } from 'lucide-react'
import { useAuth } from '@/lib/hooks/useAuth'
import { useTranslation } from '@/lib/hooks/useTranslationClient'
import { PageSEO } from '@/components/SEO'
import { useCartStore } from '@/lib/store/useCartStore'
import { Navbar } from '@/components/Navbar'
import Footer from '@/components/Footer'
import { DayPicker } from 'react-day-picker'
import { es, enUS } from 'date-fns/locale'
import '@/css/react-day-picker.css'

const experienceMap = {
  1: {
    id: '1',
    title: 'Culinary Secrets of Oaxaca',
    description: 'Hands-on cooking class with local grandmothers, market tour, and mezcal tasting.',
    price: 450,
    duration: 5,
    maxGuests: 8,
    imageUrl: '/static/images/og/oaxaca-culinary.jpg',
    rating: 4.9,
    reviewCount: 127,
    location: 'Oaxaca City, Mexico',
    highlights: ['Exclusive after-hours access', 'Expert local guide', 'Luxury transportation'],
    isFeatured: true,
    category: 'gastronomy',
  },
  2: {
    id: '2',
    title: 'Mezcal & Agave Journey',
    description:
      'Visit ancestral mezcal palenques, learn the production process, and taste rare vintages.',
    price: 380,
    duration: 6,
    maxGuests: 10,
    imageUrl: '/static/images/og/mezcal-journey.jpg',
    rating: 4.8,
    reviewCount: 89,
    location: 'Oaxaca Valley, Mexico',
    highlights: ['Expert local guide', 'Cultural immersion', 'Luxury transportation'],
    category: 'gastronomy',
  },
  3: {
    id: '3',
    title: 'Aztec Empire Uncovered',
    description:
      'Private archaeologist-led tour of Templo Mayor and the hidden ruins beneath CDMX.',
    price: 520,
    duration: 4,
    maxGuests: 6,
    imageUrl: '/static/images/og/aztec-empire.jpg',
    rating: 4.9,
    reviewCount: 203,
    location: 'Mexico City, Mexico',
    highlights: ['Exclusive after-hours access', 'Expert local guide', 'Astronomical precision'],
    isFeatured: true,
    category: 'history',
  },
  4: {
    id: '4',
    title: 'Revolutionary Routes',
    description:
      'Follow the footsteps of Zapata and Villa through historic Mexico City neighborhoods.',
    price: 350,
    duration: 5,
    maxGuests: 12,
    imageUrl: '/static/images/og/revolutionary-routes.jpg',
    rating: 4.7,
    reviewCount: 67,
    location: 'Mexico City, Mexico',
    highlights: ['Expert local guide', 'Cultural immersion', 'Intimate access'],
    category: 'history',
  },
  5: {
    id: '5',
    title: 'Roma & Condesa Nights',
    description:
      'Art deco architecture, hidden speakeasies, and contemporary art galleries after dark.',
    price: 280,
    duration: 4,
    maxGuests: 8,
    imageUrl: '/static/images/og/roma-condesa.jpg',
    rating: 4.8,
    reviewCount: 145,
    location: 'Mexico City, Mexico',
    highlights: ['Expert local guide', 'Intimate access', 'Hidden waterfalls'],
    category: 'neighborhoods',
  },
  6: {
    id: '6',
    title: 'Coyoacán Art Walk',
    description: "Frida Kahlo's Blue House, Trotsky's refuge, and the bohemian soul of CDMX.",
    price: 320,
    duration: 5,
    maxGuests: 10,
    imageUrl: '/static/images/og/coyoacan.jpg',
    rating: 4.9,
    reviewCount: 189,
    location: 'Mexico City, Mexico',
    highlights: ['Exclusive after-hours access', 'Expert local guide', 'Cultural immersion'],
    isFeatured: true,
    category: 'neighborhoods',
  },
  7: {
    id: '7',
    title: 'Frida & Diego Private Tour',
    description: 'After-hours access to Casa Azul and Anahuacalli with a personal art historian.',
    price: 650,
    duration: 4,
    maxGuests: 4,
    imageUrl: '/static/images/og/frida-diego.jpg',
    rating: 5.0,
    reviewCount: 234,
    location: 'Mexico City, Mexico',
    highlights: ['Exclusive after-hours access', 'Expert local guide', 'Intimate access'],
    isFeatured: true,
    category: 'museums',
  },
  8: {
    id: '8',
    title: 'Contemporary Gallery Circuit',
    description: "Curated walk through Roma's cutting-edge galleries with artist studio visits.",
    price: 420,
    duration: 3,
    maxGuests: 8,
    imageUrl: '/static/images/og/gallery-circuit.jpg',
    rating: 4.7,
    reviewCount: 56,
    location: 'Mexico City, Mexico',
    highlights: ['Expert local guide', 'Cultural immersion', 'Intimate access'],
    category: 'museums',
  },
}

const MAX_ACTIVE_RESERVATIONS = 3

const getTimeWindowForDate = (date) => {
  const day = date?.getDay?.()
  if (day === 0) return { start: 9, end: 15 }
  if (day === 6) return { start: 9, end: 17 }
  return { start: 9, end: 18 }
}

const formatSlot = (hours, minutes) =>
  `${String(hours).padStart(2, '0')}:${minutes === 0 ? '00' : '30'}`

const getTimeSlotsForDate = (date) => {
  const { start, end } = getTimeWindowForDate(date)
  const slots = []
  for (let hour = start; hour < end; hour += 1) {
    slots.push(formatSlot(hour, 0))
    slots.push(formatSlot(hour, 30))
  }
  return slots
}

export default function BookingPage() {
  const params = useParams()
  const { user, token, isLoading: authLoading } = useAuth()
  const { t, locale } = useTranslation()
  const { addItem, clearCart } = useCartStore()
  const [selectedDate, setSelectedDate] = useState(null)
  const [selectedTime, setSelectedTime] = useState(null)
  const [peopleCount, setPeopleCount] = useState(2)
  const [message, setMessage] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(null)
  const [bookedSlots, setBookedSlots] = useState([])
  const [isLoadingSlots, setIsLoadingSlots] = useState(false)
  const [availabilityError, setAvailabilityError] = useState(null)
  const [displayMonth, setDisplayMonth] = useState(new Date())
  const [reservations, setReservations] = useState([])
  const [isLoadingReservations, setIsLoadingReservations] = useState(false)
  const [currentTime, setCurrentTime] = useState(new Date())
  const [showReservationForm, setShowReservationForm] = useState(true)
  const [isMobileDevice, setIsMobileDevice] = useState(false)

  const experience = experienceMap[params?.slug || params?.id]
  const maxPeople = experience?.maxGuests || 8
  const isAuthenticated = Boolean(token && user)

  const today = useMemo(() => {
    const d = new Date()
    d.setHours(0, 0, 0, 0)
    return d
  }, [])

  const maxReservationDate = useMemo(() => {
    const limit = new Date(today)
    limit.setMonth(limit.getMonth() + 1)
    return limit
  }, [today])

  const minMonth = useMemo(() => new Date(today.getFullYear(), today.getMonth(), 1), [today])
  const maxMonth = useMemo(
    () => new Date(maxReservationDate.getFullYear(), maxReservationDate.getMonth(), 1),
    [maxReservationDate]
  )

  const canGoPrev =
    displayMonth.getFullYear() > minMonth.getFullYear() ||
    displayMonth.getMonth() > minMonth.getMonth()
  const canGoNext =
    displayMonth.getFullYear() < maxMonth.getFullYear() ||
    displayMonth.getMonth() < maxMonth.getMonth()

  const formatPrice = (price) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price)
  }

  const formatDateForInput = (date) => {
    if (!date) return ''
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
  }

  const parseDateFromInput = (value) => {
    const [year, month, day] = value.split('-').map(Number)
    if ([year, month, day].some((segment) => Number.isNaN(segment))) {
      return null
    }
    const parsed = new Date(year, (month || 1) - 1, day || 1)
    parsed.setHours(0, 0, 0, 0)
    return Number.isNaN(parsed.getTime()) ? null : parsed
  }

  const availableTimeSlots = useMemo(() => {
    if (!selectedDate) return []
    const baseSlots = getTimeSlotsForDate(selectedDate).filter(
      (slot) => !bookedSlots.includes(slot)
    )
    const isSameDay = selectedDate.toDateString() === currentTime.toDateString()
    if (!isSameDay) return baseSlots
    return baseSlots.filter((slot) => {
      const [hours, minutes] = slot.split(':').map(Number)
      const slotDate = new Date(selectedDate)
      slotDate.setHours(hours || 0, minutes || 0, 0, 0)
      return slotDate.getTime() > currentTime.getTime()
    })
  }, [selectedDate, bookedSlots, currentTime])

  const timeSelectPlaceholder = useMemo(() => {
    if (!selectedDate) return 'Selecciona una fecha primero'
    if (isLoadingSlots) return 'Cargando horarios...'
    if (availableTimeSlots.length === 0) return 'No hay horarios disponibles'
    return 'Selecciona una hora disponible'
  }, [selectedDate, isLoadingSlots, availableTimeSlots.length])

  useEffect(() => {
    setSelectedTime(null)
  }, [selectedDate])

  useEffect(() => {
    if (!selectedDate) {
      setBookedSlots([])
      setAvailabilityError(null)
      setIsLoadingSlots(false)
      return
    }

    let ignore = false
    const controller = new AbortController()

    const fetchAvailability = async () => {
      setIsLoadingSlots(true)
      setAvailabilityError(null)
      try {
        const dateParam = formatDateForInput(selectedDate)
        const response = await fetch(
          `/api/bookings/availability?date=${dateParam}&experienceId=${encodeURIComponent(
            experience?.id || ''
          )}`,
          { signal: controller.signal }
        )
        const payload = await response.json()
        if (!response.ok || !payload.success) {
          throw new Error(payload.message || 'No pudimos obtener la disponibilidad.')
        }
        if (!ignore) {
          setBookedSlots(payload.slots || [])
        }
      } catch (error) {
        if (error instanceof Error && error.name === 'AbortError') return
        console.error('Error consultando disponibilidad:', error)
        if (!ignore) {
          const message =
            error instanceof Error ? error.message : 'No pudimos cargar los horarios disponibles.'
          setBookedSlots([])
          setAvailabilityError(message)
        }
      } finally {
        if (!ignore) {
          setIsLoadingSlots(false)
        }
      }
    }

    fetchAvailability()
    return () => {
      ignore = true
      controller.abort()
    }
  }, [selectedDate, experience?.id])

  useEffect(() => {
    if (selectedTime && !availableTimeSlots.includes(selectedTime)) {
      setSelectedTime(null)
    }
  }, [availableTimeSlots, selectedTime])

  useEffect(() => {
    const interval = setInterval(() => setCurrentTime(new Date()), 60 * 1000)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    const detectDevice = () => {
      if (typeof window === 'undefined') return
      const userAgent = typeof navigator !== 'undefined' ? navigator.userAgent : ''
      const isTouchDevice = typeof navigator !== 'undefined' && navigator.maxTouchPoints > 1
      const matchesViewport = window.matchMedia('(max-width: 768px)').matches
      const isMobileMatch =
        /android|iphone|ipad|ipod|windows phone/i.test(userAgent || '') ||
        isTouchDevice ||
        matchesViewport
      setIsMobileDevice(isMobileMatch)
    }
    detectDevice()
    window.addEventListener('resize', detectDevice)
    return () => window.removeEventListener('resize', detectDevice)
  }, [])

  const loadReservations = useCallback(async () => {
    if (!token) {
      setReservations([])
      return
    }
    setIsLoadingReservations(true)
    try {
      const response = await fetch('/api/bookings', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      const data = await response.json()
      if (data.bookings) {
        setReservations(Array.isArray(data.bookings) ? data.bookings : [])
      }
    } catch (error) {
      console.error('Error cargando reservaciones:', error)
    } finally {
      setIsLoadingReservations(false)
    }
  }, [token])

  useEffect(() => {
    if (!token) {
      setReservations([])
      return
    }
    loadReservations()
  }, [token, loadReservations])

  const hasReachedReservationLimit =
    isAuthenticated && reservations.length >= MAX_ACTIVE_RESERVATIONS

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(null)
    setSuccess(null)

    if (!selectedDate || !selectedTime) {
      setError('Por favor selecciona una fecha y hora válidas')
      return
    }

    if (hasReachedReservationLimit) {
      setError('Solo puedes tener 3 reservas activas. Cancela una o espera a que termine.')
      return
    }

    const authToken = localStorage.getItem('authToken')
    if (!authToken) {
      setError('Necesitas iniciar sesión para crear una reserva')
      return
    }

    try {
      setIsSubmitting(true)
      const response = await fetch('/api/bookings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          experienceId: params?.slug || params?.id,
          date: formatDateForInput(selectedDate),
          time: selectedTime,
          peopleCount,
          customerName: user?.firstName
            ? `${user.firstName} ${user.lastName || ''}`.trim()
            : undefined,
          customerEmail: user?.email,
          currency: 'USD',
        }),
      })

      const data = await response.json()
      if (!response.ok) {
        throw new Error(data.error || 'No pudimos confirmar tu reserva')
      }

      setSuccess(`¡Reserva confirmada! Tu código es: ${data.booking?.ticketCode}`)
      setSelectedTime(null)
      await loadReservations()
      setTimeout(() => {
        window.location.href = '/profile'
      }, 2000)
    } catch (err) {
      setError(err.message || 'Error creando tu reserva. Intenta de nuevo.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleAddToCart = () => {
    // Reemplaza el carrito: al elegir esta experiencia se descarta lo anterior.
    clearCart()
    addItem({
      experienceId: experience.id,
      title: experience.title,
      imageUrl: experience.imageUrl,
      price: experience.price,
      currency: 'USD',
      location: experience.location,
      maxGuests: experience.maxGuests,
      highlights: experience.highlights,
    })
    window.location.href = '/cart'
  }

  if (!experience) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-950">
        <div className="text-center text-gray-400">Experiencia no encontrada</div>
      </div>
    )
  }

  if (authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-950">
        <div className="text-center text-gray-400">Cargando...</div>
      </div>
    )
  }

  return (
    <>
      <PageSEO title={`${experience.title} | Amaxing`} description={experience.description} />
      <div className="relative flex min-h-screen flex-col justify-between">
        <Navbar />
        <main className="mb-auto pt-20">
          <div className="min-h-screen bg-zinc-950">
            {/* Hero */}
            <section className="relative h-[60vh] min-h-[400px]">
              <Image
                src={experience.imageUrl}
                alt={experience.title}
                fill
                priority
                sizes="100vw"
                className="object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-zinc-950/90 via-zinc-950/20 to-transparent" />
              <div className="absolute inset-0 flex items-end">
                <div className="container mx-auto px-6 pb-12">
                  <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, ease: [0.4, 0, 0.2, 1] }}
                    className="max-w-3xl"
                  >
                    <h1 className="mb-6 text-4xl font-bold leading-tight tracking-tight text-white md:text-5xl lg:text-6xl">
                      {experience.title}
                    </h1>
                    <div className="flex flex-wrap items-center gap-6 text-gray-300">
                      <div className="flex items-center gap-2">
                        <Clock className="h-5 w-5 text-orange-500" />
                        <span>
                          {experience.duration} {experience.duration === 1 ? 'hora' : 'horas'}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Users className="h-5 w-5 text-orange-500" />
                        <span>Hasta {experience.maxGuests} personas</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <MapPin className="h-5 w-5 text-orange-500" />
                        <span>{experience.location}</span>
                      </div>
                    </div>
                  </motion.div>
                </div>
              </div>
            </section>

            {/* Booking Form */}
            <section className="py-16 px-6 lg:py-24">
              <div className="container mx-auto max-w-4xl">
                <div className="grid gap-8 lg:grid-cols-3 lg:gap-12">
                  {/* Booking Form */}
                  <div className="lg:col-span-2">
                    <div className="rounded-2xl border border-white/10 bg-zinc-900/50 p-6 lg:p-8">
                      <h2 className="mb-6 text-2xl font-bold text-white">Reservar experiencia</h2>

                      {error && (
                        <div className="mb-6 rounded-xl border border-red-500/30 bg-red-500/20 p-4 text-red-300">
                          {error}
                        </div>
                      )}

                      {success && (
                        <div className="mb-6 rounded-xl border border-emerald-500/30 bg-emerald-500/20 p-4 text-emerald-300">
                          {success}
                        </div>
                      )}

                      {!isAuthenticated && (
                        <div className="mb-6 rounded-xl border border-orange-500/30 bg-orange-500/10 p-4 text-orange-300">
                          <p className="mb-2 text-sm font-semibold">Inicia sesión para reservar</p>
                          <p className="text-xs text-orange-200">
                            Necesitas una cuenta para confirmar reservas y ver tus tickets.
                          </p>
                        </div>
                      )}

                      <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="grid gap-6 md:grid-cols-2">
                          <div>
                            <label className="mb-2 block text-sm font-medium text-gray-300">
                              Fecha
                            </label>
                            {isMobileDevice ? (
                              <input
                                type="date"
                                value={selectedDate ? formatDateForInput(selectedDate) : ''}
                                min={formatDateForInput(today)}
                                max={formatDateForInput(maxReservationDate)}
                                onChange={(e) => {
                                  const parsed = parseDateFromInput(e.target.value)
                                  if (parsed) {
                                    const normalized = new Date(
                                      Math.max(parsed.getTime(), today.getTime()),
                                      parsed.getMonth(),
                                      parsed.getDate()
                                    )
                                    if (normalized > maxReservationDate) {
                                      setSelectedDate(maxReservationDate)
                                    } else {
                                      setSelectedDate(normalized)
                                    }
                                    setDisplayMonth(
                                      new Date(normalized.getFullYear(), normalized.getMonth(), 1)
                                    )
                                  } else {
                                    setSelectedDate(null)
                                  }
                                }}
                                className="w-full rounded-xl border border-white/10 bg-zinc-900 px-4 py-3 text-white placeholder-gray-500 transition-all focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-500/30"
                              />
                            ) : (
                              <div className="rounded-2xl border border-white/10 bg-zinc-900 p-4">
                                <div className="mb-3 flex items-center justify-between">
                                  <button
                                    type="button"
                                    onClick={() => {
                                      if (!canGoPrev) return
                                      const prev = new Date(
                                        displayMonth.getFullYear(),
                                        displayMonth.getMonth() - 1,
                                        1
                                      )
                                      setDisplayMonth(prev < minMonth ? minMonth : prev)
                                    }}
                                    disabled={!canGoPrev}
                                    className="rounded-full border border-white/10 px-3 py-1 text-xs font-semibold text-gray-300 disabled:opacity-40"
                                  >
                                    ←
                                  </button>
                                  <p className="text-sm font-semibold text-white">
                                    {displayMonth.toLocaleDateString('es-MX', {
                                      month: 'long',
                                      year: 'numeric',
                                    })}
                                  </p>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      if (!canGoNext) return
                                      const next = new Date(
                                        displayMonth.getFullYear(),
                                        displayMonth.getMonth() + 1,
                                        1
                                      )
                                      setDisplayMonth(next > maxMonth ? maxMonth : next)
                                    }}
                                    disabled={!canGoNext}
                                    className="rounded-full border border-white/10 px-3 py-1 text-xs font-semibold text-gray-300 disabled:opacity-40"
                                  >
                                    →
                                  </button>
                                </div>
                                <DayPicker
                                  mode="single"
                                  selected={selectedDate}
                                  onSelect={setSelectedDate}
                                  month={displayMonth}
                                  onMonthChange={(month) => {
                                    const normalized = new Date(
                                      month.getFullYear(),
                                      month.getMonth(),
                                      1
                                    )
                                    if (normalized < minMonth) {
                                      setDisplayMonth(minMonth)
                                      return
                                    }
                                    if (normalized > maxMonth) {
                                      setDisplayMonth(maxMonth)
                                      return
                                    }
                                    setDisplayMonth(normalized)
                                  }}
                                  disabled={{ before: today, after: maxReservationDate }}
                                  weekStartsOn={1}
                                  fromDate={today}
                                  toDate={maxReservationDate}
                                  fromMonth={minMonth}
                                  toMonth={maxMonth}
                                  showOutsideDays={false}
                                  locale={locale === 'es' ? es : enUS}
                                  modifiersClassNames={{
                                    selected: 'bg-orange-500 text-white hover:bg-orange-600',
                                    today: 'text-orange-500 font-semibold',
                                  }}
                                  styles={{
                                    caption: { color: '#fff' },
                                    root: { width: '100%' },
                                    table: { width: '100%' },
                                    head_cell: { width: '14.285%', textTransform: 'uppercase' },
                                    cell: { width: '14.285%' },
                                  }}
                                />
                              </div>
                            )}
                            <p className="mt-2 text-xs text-gray-400">
                              Disponible hasta el{' '}
                              {maxReservationDate.toLocaleDateString('es-MX', {
                                day: 'numeric',
                                month: 'long',
                                year: 'numeric',
                              })}
                            </p>
                          </div>
                          <div>
                            <label className="mb-2 block text-sm font-medium text-gray-300">
                              Hora
                            </label>
                            <select
                              value={selectedTime || ''}
                              onChange={(e) => setSelectedTime(e.target.value || null)}
                              disabled={!selectedDate || isLoadingSlots}
                              required
                              className="w-full rounded-xl border border-white/10 bg-zinc-900 px-4 py-3 text-white transition-all focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-500/30"
                            >
                              <option value="">{timeSelectPlaceholder}</option>
                              {availableTimeSlots.map((slot) => (
                                <option key={slot} value={slot}>
                                  {slot}
                                </option>
                              ))}
                            </select>
                            {availabilityError && (
                              <p className="mt-2 text-xs text-red-400">{availabilityError}</p>
                            )}
                            {!availabilityError &&
                              selectedDate &&
                              !isLoadingSlots &&
                              availableTimeSlots.length === 0 && (
                                <p className="mt-2 text-xs text-gray-400">
                                  Todos los horarios ya están reservados para esta fecha. Intenta
                                  con otro día.
                                </p>
                              )}
                          </div>
                        </div>

                        <div>
                          <label className="mb-2 block text-sm font-medium text-gray-300">
                            Número de personas
                          </label>
                          <select
                            value={peopleCount}
                            onChange={(e) => setPeopleCount(Number(e.target.value))}
                            className="w-full rounded-xl border border-white/10 bg-zinc-900 px-4 py-3 text-white transition-all focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-500/30"
                          >
                            {Array.from({ length: maxPeople }, (_, i) => i + 1).map((num) => (
                              <option key={num} value={num}>
                                {num} {num === 1 ? 'persona' : 'personas'}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <label className="mb-2 block text-sm font-medium text-gray-300">
                            Mensaje especial (opcional)
                          </label>
                          <textarea
                            value={message}
                            onChange={(e) => setMessage(e.target.value)}
                            rows={3}
                            className="w-full rounded-xl border border-white/10 bg-zinc-900 px-4 py-3 text-white placeholder-gray-500 transition-all focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-500/30"
                            placeholder="Algo que quisiéramos saber..."
                          />
                        </div>

                        <div className="border-t border-white/10 pt-4">
                          <div className="mb-4 flex items-center justify-between">
                            <div>
                              <div className="mb-1 text-xs text-gray-400">Total</div>
                              <div className="text-3xl font-bold text-white">
                                {formatPrice(experience.price * peopleCount)}
                              </div>
                              <div className="text-sm text-gray-400">
                                Incluye impuestos y tarifas
                              </div>
                            </div>
                          </div>
                          <div className="flex gap-3">
                            <button
                              type="button"
                              onClick={handleAddToCart}
                              className="flex-1 rounded-xl border border-orange-500/30 bg-orange-500/10 py-4 font-semibold text-orange-500 transition-colors hover:bg-orange-500/20"
                            >
                              Agregar al carrito
                            </button>
                            <motion.button
                              type="submit"
                              disabled={isSubmitting || !isAuthenticated}
                              whileHover={{ scale: 1.02 }}
                              whileTap={{ scale: 0.98 }}
                              className="flex-1 rounded-xl bg-orange-500 py-4 font-semibold text-white transition-colors hover:bg-orange-600 disabled:opacity-50"
                            >
                              {isSubmitting ? 'Reservando...' : 'Reservar ahora'}
                            </motion.button>
                          </div>
                          {!isAuthenticated && (
                            <p className="mt-2 text-center text-xs text-gray-400">
                              Inicia sesión para confirmar tu reserva
                            </p>
                          )}
                        </div>
                      </form>
                    </div>
                  </div>

                  {/* Experience Details */}
                  <div className="lg:col-span-1">
                    <div className="sticky top-24 rounded-2xl border border-white/10 bg-zinc-900/50 p-6">
                      <div className="relative mb-6 h-48 overflow-hidden rounded-xl">
                        <Image
                          src={experience.imageUrl}
                          alt={experience.title}
                          fill
                          sizes="100vw"
                          className="object-cover"
                        />
                      </div>

                      <h3 className="mb-2 text-xl font-bold text-white">{experience.title}</h3>
                      <p className="mb-4 text-gray-300">{experience.description}</p>

                      <div className="mb-6 space-y-3">
                        <div className="flex items-center gap-2">
                          <Clock className="h-5 w-5 text-orange-500" />
                          <span className="text-gray-300">
                            {experience.duration} {experience.duration === 1 ? 'hora' : 'horas'}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Users className="h-5 w-5 text-orange-500" />
                          <span className="text-gray-300">
                            Máx. {experience.maxGuests} personas
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <MapPin className="h-5 w-5 text-orange-500" />
                          <span className="text-gray-300">{experience.location}</span>
                        </div>
                      </div>

                      <div className="mb-4 border-t border-white/10 pt-4">
                        <h4 className="mb-3 font-semibold text-white">Qué incluye</h4>
                        <ul className="space-y-2">
                          {experience.highlights.map((highlight, i) => (
                            <li key={i} className="flex items-center gap-2 text-gray-300">
                              <Check className="h-5 w-5 flex-shrink-0 text-orange-500" />
                              <span>{highlight}</span>
                            </li>
                          ))}
                        </ul>
                      </div>

                      <div className="rounded-xl border border-orange-500/20 bg-orange-500/10 p-4">
                        <p className="mb-2 text-sm text-orange-300">Política de cancelación</p>
                        <p className="text-sm text-orange-200">
                          Cancela hasta 48 horas antes para reembolso completo. Consulta términos
                          completos al reservar.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </section>
          </div>
        </main>
        <Footer />
      </div>
    </>
  )
}
