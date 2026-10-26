import { Booking } from './types'
import { generateBookingCode } from './types'
import { tours } from '@/data/toursData'

const BOOKINGS_KEY = 'calpulli_bookings'

function getStoredBookings(): Booking[] {
  if (typeof window === 'undefined') return []
  const data = localStorage.getItem(BOOKINGS_KEY)
  return data ? JSON.parse(data) : []
}

function saveBookings(bookings: Booking[]) {
  if (typeof window === 'undefined') return
  localStorage.setItem(BOOKINGS_KEY, JSON.stringify(bookings))
}

export function isGuestId(userId: string): boolean {
  return typeof userId === 'string' && userId.startsWith('guest_')
}

export function getBookingsByUser(userId: string): Booking[] {
  const bookings = getStoredBookings()
  return bookings
    .filter((b) => b.userId === userId)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
}

export function getBookingsByExperienceAndDate(experienceId: string, date: string): Booking[] {
  const bookings = getStoredBookings()
  return bookings.filter((b) => b.experienceId === experienceId && b.date === date)
}

export function getBookingByIdFromStorage(bookingId: string): Booking | null {
  const bookings = getStoredBookings()
  return bookings.find((b) => b.id === bookingId) || null
}

// Datos reales desde data/toursData.js (precios, títulos, ubicación y punto de
// recogida) para que los tickets reflejen el tour correcto.
export function getTourMeta(experienceId: string) {
  const tour = tours.find((t) => t.id === String(experienceId))
  if (!tour) return null
  return tour
}

export function buildQrPayload(booking: Booking): Record<string, unknown> {
  return {
    ticketCode: booking.ticketCode,
    experienceId: booking.experienceId,
    experienceTitle: booking.experienceTitle,
    date: booking.date,
    time: booking.time,
    peopleCount: booking.peopleCount,
    totalPrice: booking.totalPrice,
    currency: booking.currency || 'USD',
    customerName: booking.customerName || null,
    // Para guest no persistimos email en el QR payload — solo nombre
    customerEmail: isGuestId(booking.userId) ? null : booking.customerEmail || null,
    participantNames: booking.participantNames || null,
    status: booking.status,
    meetingPoint: booking.meetingPoint || null,
    location: booking.location || null,
  }
}

export function createBookingInStorage(input: {
  userId: string
  experienceId: string
  date: string
  time: string
  peopleCount: number
  customerName?: string
  customerEmail?: string
  currency?: string
  // Para invitado: lista de nombres por participante (1 por ticket); si viene,
  // el primer nombre es el comprador y el resto acompañantes — se usa para QR
  participantNames?: string[]
  acquisitionChannel?: string
}): Booking {
  const bookings = getStoredBookings()

  const now = new Date().toISOString()
  const bookingCode = generateBookingCode()
  const meta = getTourMeta(input.experienceId)

  const isGuest = isGuestId(input.userId)
  const participantNames =
    Array.isArray(input.participantNames) && input.participantNames.length > 0
      ? input.participantNames.slice(0, input.peopleCount)
      : undefined

  const base: Booking = {
    id: `booking_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    userId: input.userId,
    experienceId: input.experienceId,
    experienceTitle: meta?.title || 'Experiencia',
    experienceImage: meta?.imageUrl || '/static/images/jaguarBaja.png',
    location: meta?.location || 'Mexico',
    meetingPoint: meta?.meetingPoint || null,
    date: input.date,
    time: input.time,
    peopleCount: input.peopleCount,
    totalPrice: (meta?.price || 300) * input.peopleCount,
    status: 'confirmed',
    createdAt: now,
    updatedAt: now,
    ticketCode: bookingCode,
    customerName: input.customerName,
    // Para guest no persistimos email en storage (métricas siguen con userId guest_*)
    customerEmail: isGuest ? undefined : input.customerEmail,
    currency: input.currency || 'USD',
    participantNames,
    isGuest,
    acquisitionChannel: input.acquisitionChannel,
  }

  const booking: Booking = {
    ...base,
    qrCodeData: JSON.stringify(buildQrPayload(base)),
  }

  bookings.push(booking)
  saveBookings(bookings)

  return booking
}

export function createBookingsInStorage(
  inputs: Array<{
    userId: string
    experienceId: string
    date: string
    time: string
    peopleCount: number
    customerName?: string
    customerEmail?: string
    currency?: string
    participantNames?: string[]
    acquisitionChannel?: string
  }>
): Booking[] {
  const bookings = getStoredBookings()
  const created: Booking[] = []

  for (const input of inputs) {
    const now = new Date().toISOString()
    const bookingCode = generateBookingCode()
    const meta = getTourMeta(input.experienceId)

    const isGuest = isGuestId(input.userId)
    const participantNames =
      Array.isArray(input.participantNames) && input.participantNames.length > 0
        ? input.participantNames.slice(0, input.peopleCount)
        : undefined

    const base: Booking = {
      id: `booking_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      userId: input.userId,
      experienceId: input.experienceId,
      experienceTitle: meta?.title || 'Experiencia',
      experienceImage: meta?.imageUrl || '/static/images/jaguarBaja.png',
      location: meta?.location || 'Mexico',
      meetingPoint: meta?.meetingPoint || null,
      date: input.date,
      time: input.time,
      peopleCount: input.peopleCount,
      totalPrice: (meta?.price || 300) * input.peopleCount,
      status: 'confirmed',
      createdAt: now,
      updatedAt: now,
      ticketCode: bookingCode,
      customerName: input.customerName,
      customerEmail: isGuest ? undefined : input.customerEmail,
      currency: input.currency || 'USD',
      participantNames,
      isGuest,
      acquisitionChannel: input.acquisitionChannel,
    }

    const booking: Booking = {
      ...base,
      qrCodeData: JSON.stringify(buildQrPayload(base)),
    }

    created.push(booking)
    bookings.push(booking)
  }

  saveBookings(bookings)
  return created
}

export function updateBookingInStorage(
  bookingId: string,
  updates: Partial<{
    status?: Booking['status']
    ticketCode?: string
    qrCodeData?: string
  }>
): Booking | null {
  const bookings = getStoredBookings()
  const index = bookings.findIndex((b) => b.id === bookingId)
  if (index === -1) return null

  bookings[index] = {
    ...bookings[index],
    ...updates,
    updatedAt: new Date().toISOString(),
  }
  saveBookings(bookings)
  return bookings[index]
}

export function cancelBookingInStorage(bookingId: string): Booking | null {
  return updateBookingInStorage(bookingId, { status: 'cancelled' })
}
