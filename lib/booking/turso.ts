// MIT License - Copyright (c) 2024-2026 Donovan Riaño / Calpulli CDMX - See LICENSE
// Reservas reales en Turso. El booking_reference es el mismo que viaja en el QR,
// así que el escáner del empleado resuelve contra la misma fila.
import { randomBytes } from 'crypto'
import { turso } from '../turso'
import { COUNTRY_CODES, isValidAgeBand } from '../demographics'
import { normalizeGender as normalizeGenderValue } from '../demographics-shared'

/** Alfabeto sin caracteres ambiguos: O/0, I/1, S/5. */
const ALPHABET = 'ABCDEFGHJKLMNPQRTUVWXYZ23456789'

export interface CreateBookingInput {
  experienceId: string
  userId?: string | null
  date: string
  time?: string | null
  peopleCount: number
  totalAmount: number
  currency?: string
  customerName?: string | null
  customerEmail?: string | null
  /** WhatsApp. Obligatorio para efectivo: es como localizamos al cliente. */
  customerPhone?: string | null
  /** 'cash' deja la reserva pendiente de pago; no se marca como pagada. */
  paymentMethod?: 'card' | 'cash' | 'crypto' | null
  specialRequests?: string | null
  dietaryRestrictions?: string[]
  accessibilityNeeds?: string | null
  stripeSessionId?: string | null
  stripePaymentIntentId?: string | null
  /** Items del carrito (para calcular el total si no se envía totalAmount). */
  items?: Array<{
    experienceId: string
    unitPrice?: number
    peopleCount?: number
    [key: string]: any
  }>
  /** Si el pago ya está confirmado, la reserva nace pagada. */
  paid?: boolean
}

/** Referencia legible y corta: CDMX-7K3QF9 */
export function generateBookingReference(): string {
  const bytes = randomBytes(6)
  let out = ''
  for (let i = 0; i < 6; i++) out += ALPHABET[bytes[i] % ALPHABET.length]
  return `CDMX-${out}`
}

/** Código completo que se imprime en el QR (sin prefijo, solo la referencia). */
export function ticketCodeFor(reference: string): string {
  return String(reference)
    .replace(/^AMX-T-/i, '')
    .toUpperCase()
}

/** Normaliza fecha/hora a ISO. Acepta 'YYYY-MM-DD' y 'YYYY-MM-DDTHH:mm'. */
function normalizeWhen(date: string, time?: string | null): { iso: string; time: string | null } {
  const trimmed = String(date || '').trim()
  if (!trimmed) throw new Error('Falta la fecha de la reserva')

  const hasTime = trimmed.includes('T')
  const iso = hasTime ? trimmed : `${trimmed}T${(time || '09:00').slice(0, 5)}:00`
  const parsed = new Date(iso)
  if (Number.isNaN(parsed.getTime())) throw new Error(`Fecha inválida: ${date}`)

  return {
    iso: parsed.toISOString(),
    time: hasTime ? trimmed.slice(11, 16) : (time || '09:00').slice(0, 5),
  }
}

export interface BookingTicket {
  position: number
  participantName: string
  ticketCode: string
  isResponsible: boolean
}

export interface CreatedBooking {
  id: string
  bookingReference: string
  ticketCode: string
  status: string
  paymentStatus: string
  /** Método de pago: 'cash', 'card', 'crypto'. */
  paymentMethod?: string
  /** Monto del journey independientemente del método de pago. */
  journeyAmount?: number
  /** WhatsApp del responsable (para mostrar en el ticket). */
  customerPhone?: string | null
  startDate: string
  guests: number
  totalAmount: number
  currency: string
  demographics: Demographics
  /** Un ticket por persona, con su codigo y su QR. */
  tickets: BookingTicket[]
  /** Datos de la experiencia, para pintar el ticket sin volver a consultarla. */
  experienceTitle: string
  experienceTitleEn: string
  location: string | null
  imageUrl: string | null
  /** Fecha y hora de la reserva, en el formato que ve el visitante. */
  date: string
  time: string
}

/**
 * Crea la reserva en Turso. Lanza si la experiencia no existe o si ya
 * existe una reserva con la misma referencia (colisión, muy improbable).
 */
export async function createBookingInTurso(input: CreateBookingInput): Promise<CreatedBooking> {
  const { iso, time } = normalizeWhen(input.date, input.time)
  // Efectivo: la reserva existe pero NO está pagada. El cobro ocurre en el
  // punto de encuentro, así que marcarla 'paid' sería mentir en la contabilidad.
  const isCash = input.paymentMethod === 'cash'
  const paid = isCash ? false : input.paid ?? false
  const reference = generateBookingReference()

  const experience = await turso.execute({
    sql: 'SELECT id, title_es, title_en, location_es, location_en, image_url FROM experiences WHERE id = ?',
    args: [String(input.experienceId)],
  })
  if (!experience.rows[0]) {
    throw new Error(`La experiencia ${input.experienceId} no existe`)
  }

  if (input.userId) {
    const user = await turso.execute({
      sql: 'SELECT id FROM users WHERE id = ?',
      args: [input.userId],
    })
    if (!user.rows[0]) {
      throw new Error('El usuario de la reserva no existe')
    }
  }

  const demographics: Demographics = input.userId
    ? await demographicsForUser(input.userId)
    : { country: null, ageBand: null, gender: null }

  const guests = Math.max(1, Math.min(10, Number(input.peopleCount) || 1))
  const total =
    Number(input.totalAmount) ||
    (Array.isArray(input.items)
      ? input.items.reduce(
          (sum, item) =>
            sum +
            (Number(item.unitPrice || 0) * Math.max(1, Number(item.peopleCount) || 1)),
          0
        )
      : 0)
  const status = paid ? 'paid' : 'confirmed'
  const paymentStatus = paid ? 'paid' : 'unpaid'

  // libSQL serializa `undefined` como el literal "None" y rompe el SQL:
  // cualquier argumento opcional se normaliza a null.
  const args = [
    String(input.experienceId),
    input.userId || null,
    input.userId ? 0 : 1,
    reference,
    iso.slice(0, 10),
    iso,
    iso,
    time,
    guests,
    status,
    paymentStatus,
    paid ? iso : null,
    total,
    paid ? total : 0,
    input.currency || 'USD',
    input.stripeSessionId || null,
    input.stripePaymentIntentId || null,
    input.customerName || null,
    input.customerEmail || null,
    input.customerPhone || null,
    input.specialRequests || null,
    JSON.stringify(input.dietaryRestrictions || []),
    input.accessibilityNeeds || null,
    // Demografía congelada: sobrevive al borrado del cliente.
    demographics.country,
    demographics.ageBand,
    demographics.gender,
    new Date().toISOString(),
  ].map((value) => (value === undefined ? null : value))

  await turso.execute({
    sql: `INSERT INTO bookings (
            experience_id, user_id, is_guest, booking_reference,
            booking_date, start_date, end_date, start_time,
            guests, status, payment_status, paid_at,
            total_amount, payed_amount, currency,
            stripe_session_id, stripe_payment_intent_id,
            customer_name, customer_email, customer_phone, special_requests,
            dietary_restrictions, accessibility_needs,
            anon_country, anon_age_band, anon_gender, anon_at
          )
          VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
    args,
  })

  // `RETURNING` no está soportado de forma fiable en Turso HTTP: se recupera
  // por la booking_reference, que es única.
  const inserted = await turso.execute({
    sql: 'SELECT id FROM bookings WHERE booking_reference = ?',
    args: [reference],
  })

  const id = (inserted.rows[0] as any)?.id
  if (!id) throw new Error('No se pudo crear la reserva')

  const experienceRow: any = experience.rows[0]

  // Un ticket por persona. Cada ticket guarda un código único en la base de
  // datos (con sufijo de posición cuando hay varias personas) para evitar
  // colisiones, pero la reserva y el ticket mostrado usan el código base
  // sin sufijo: CDMX-XXXXXX.
  const baseCode = ticketCodeFor(reference)
  const people =
    Array.isArray(input.participants) && input.participants.length
      ? input.participants
      : [{ name: input.customerName || 'Invitado', email: null }]
  const responsiblePosition = Math.min(
    Math.max(1, Number(input.responsiblePosition) || 1),
    people.length
  )

  const tickets: BookingTicket[] = []
  for (let index = 0; index < people.length; index += 1) {
    const position = index + 1
    const name = (people[index]?.name || '').trim() || `Invitado ${position}`
    // Código único por ticket para la base de datos y el QR.
    const ticketCode = position > 1 ? `${baseCode}-${position}` : baseCode
    const isResponsible = position === responsiblePosition
    await turso.execute({
      sql: `INSERT INTO booking_participants
              (booking_id, booking_reference, position, participant_name, ticket_code, is_responsible)
            VALUES (?, ?, ?, ?, ?, ?)`,
      args: [id, reference, position, name, ticketCode, isResponsible ? 1 : 0],
    })
    tickets.push({ position, participantName: name, ticketCode, isResponsible })
  }

  return {
    id,
    bookingReference: reference,
    ticketCode: baseCode,
    status,
    paymentStatus,
    paymentMethod: input.paymentMethod,
    customerPhone: input.customerPhone || null,
    journeyAmount: total,
    startDate: iso,
    guests,
    totalAmount: total,
    currency: input.currency || 'USD',
    demographics,
    tickets,
    experienceTitle: experienceRow?.title_es || experienceRow?.title_en || 'Experiencia',
    experienceTitleEn: experienceRow?.title_en || experienceRow?.title_es || 'Experience',
    location: experienceRow?.location_es || experienceRow?.location_en || null,
    imageUrl: experienceRow?.image_url || null,
    date: iso.slice(0, 10),
    time: time || '10:00',
  }
}

/**
 * Cuenta cuántas reservas no canceladas tiene un usuario para un journey.
 *
 * Identidad:
 *  - Usuario logueado: se busca por user_id.
 *  - Invitado: se busca por customer_email + customer_phone (ambos deben coincidir).
 *
 * Solo se cuentan reservas con status distinto de 'cancelled'.
 * Devuelve { count, limit, remaining, atLimit, warning } donde:
 *  - limit = 3 (máximo de reservas por journey)
 *  - warning = true cuando remaining <= 1 (cerca de agotarse)
 */
export interface JourneyLimit {
  count: number
  limit: number
  remaining: number
  atLimit: boolean
  warning: boolean
}

const JOURNEY_LIMIT_PER_USER = 3

export async function countBookingsByExperienceAndIdentity({
  experienceId,
  userId,
  customerEmail,
  customerPhone,
}: {
  experienceId: string
  userId?: string | null
  customerEmail?: string | null
  customerPhone?: string | null
}): Promise<JourneyLimit> {
  let count = 0

  if (userId) {
    // Usuario logueado: contar por user_id
    const result = await turso.execute({
      sql: `SELECT COUNT(*) AS c FROM bookings
            WHERE experience_id = ? AND user_id = ? AND status != 'cancelled'`,
      args: [experienceId, userId],
    })
    count = Number((result.rows[0] as any)?.c) || 0
  } else if (customerEmail && customerPhone) {
    // Invitado: contar por email + teléfono
    const result = await turso.execute({
      sql: `SELECT COUNT(*) AS c FROM bookings
            WHERE experience_id = ? AND is_guest = 1
              AND customer_email = ? COLLATE NOCASE
              AND customer_phone = ?
              AND status != 'cancelled'`,
      args: [experienceId, customerEmail.trim(), customerPhone.trim()],
    })
    count = Number((result.rows[0] as any)?.c) || 0
  }

  const limit = JOURNEY_LIMIT_PER_USER
  const remaining = Math.max(0, limit - count)
  const atLimit = count >= limit
  const warning = remaining <= 1 && !atLimit

  return { count, limit, remaining, atLimit, warning }
}

/**
 * Busca un ticket de persona por su codigo. El codigo es el secreto: como el
 * de un pase de abordar, quien lo tiene puede ver el ticket.
 */
export async function findBookingTicketByCode(code: string) {
  const normalized = String(code || '')
    .trim()
    .toUpperCase()
  if (!normalized) return null
  const result = await turso.execute({
    sql: `SELECT p.id, p.booking_id, p.booking_reference, p.position,
                 p.participant_name, p.ticket_code, p.is_responsible,
                 b.start_date, b.start_time, b.guests, b.total_amount,
                 b.currency, b.status, b.is_guest,
                 e.title_es, e.title_en, e.location_es, e.location_en, e.image_url
          FROM booking_participants p
          JOIN bookings b ON b.id = p.booking_id
          JOIN experiences e ON e.id = b.experience_id
          WHERE p.ticket_code = ?`,
    args: [normalized],
  })
  const row: any = result.rows[0]
  if (!row) return null
  return {
    id: row.id,
    bookingId: row.booking_id,
    bookingReference: row.booking_reference,
    position: Number(row.position) || 1,
    participantName: row.participant_name || '',
    ticketCode: row.ticket_code,
    isResponsible: Number(row.is_responsible) === 1,
    startDate: String(row.start_date || ''),
    date: String(row.start_date || '').slice(0, 10),
    time: row.start_time || '10:00',
    guests: Number(row.guests) || 1,
    totalAmount: Number(row.total_amount) || 0,
    currency: row.currency || 'MXN',
    status: row.status || 'confirmed',
    isGuest: Number(row.is_guest) === 1,
    experienceTitle: row.title_es || row.title_en || 'Experiencia',
    experienceTitleEn: row.title_en || row.title_es || 'Experience',
    location: row.location_es || row.location_en || null,
    imageUrl: row.image_url || null,
  }
}

export interface TicketLookup {
  bookingId: string
  bookingReference: string
  ticketCode: string
  experienceTitle: string
  location: string | null
  startDate: string
  startTime: string | null
  guests: number
  status: string
  paymentStatus: string
  totalAmount: number
  currency: string
  paidAt: string | null
  customerName: string | null
  customerEmail: string | null
  isGuest: boolean
  specialRequests: string | null
  dietaryRestrictions: string[]
  accessibilityNeeds: string | null
  checkedInAt: string | null
  stripeSessionId: string | null
}

const TICKET_SELECT = `
  SELECT b.id, b.booking_reference, b.start_date, b.end_date, b.start_time,
         b.guests, b.status, b.payment_status, b.total_amount, b.currency,
         b.paid_at, b.customer_name, b.customer_email, b.is_guest,
         b.special_requests, b.dietary_restrictions, b.accessibility_needs,
         b.checked_in_at, b.stripe_session_id,
         COALESCE(e.title_es, e.title_en) AS title, e.location_es, e.location_en
  FROM bookings b
  JOIN experiences e ON e.id = b.experience_id`

function mapTicket(row: any): TicketLookup {
  return {
    bookingId: row.id,
    bookingReference: row.booking_reference,
    ticketCode: ticketCodeFor(row.booking_reference),
    experienceTitle: row.title,
    location: row.location_es || row.location_en || null,
    startDate: row.start_date,
    startTime: row.start_time,
    guests: row.guests,
    status: row.status,
    paymentStatus: row.payment_status,
    totalAmount: row.total_amount,
    currency: row.currency,
    paidAt: row.paid_at,
    customerName: row.customer_name,
    customerEmail: row.customer_email,
    isGuest: Number(row.is_guest) === 1,
    specialRequests: row.special_requests,
    dietaryRestrictions: safeJson(row.dietary_restrictions),
    accessibilityNeeds: row.accessibility_needs,
    checkedInAt: row.checked_in_at,
    stripeSessionId: row.stripe_session_id,
  }
}

function safeJson(value: unknown): string[] {
  if (!value) return []
  try {
    const parsed = typeof value === 'string' ? JSON.parse(value) : value
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

/** Busca el ticket por su código de QR (AMX-T-XXXX o solo la referencia). */
export async function getTicketByCode(code: string): Promise<TicketLookup | null> {
  const reference = String(code || '')
    .trim()
    .replace(/^AMX-T-/i, '')
    .toUpperCase()

  if (!reference) return null

  const result = await turso.execute({
    sql: `${TICKET_SELECT} WHERE b.booking_reference = ? COLLATE NOCASE LIMIT 1`,
    args: [reference],
  })

  const row: any = result.rows[0]
  return row ? mapTicket(row) : null
}

/** Marca el check-in. Devuelve el ticket actualizado o null si no existe. */
export async function checkIn(
  bookingReference: string,
  employeeId: string | null
): Promise<TicketLookup | null> {
  const reference = String(bookingReference || '')
    .trim()
    .replace(/^AMX-T-/i, '')
    .toUpperCase()

  const result = await turso.execute({
    sql: `UPDATE bookings
          SET checked_in_at = datetime('now'), checked_in_by = ?,
              status = CASE WHEN status = 'paid' THEN 'in_progress' ELSE status END
          WHERE booking_reference = ? COLLATE NOCASE`,
    args: [employeeId, reference],
  })

  if (!result.rowsAffected) return null
  return getTicketByCode(reference)
}

/** Idempotencia: si ya hay reservas para esta sesión de Stripe, las devuelve. */
export async function findBookingsByStripeSession(sessionId: string): Promise<TicketLookup[]> {
  const result = await turso.execute({
    sql: `${TICKET_SELECT} WHERE b.stripe_session_id = ? ORDER BY b.start_date`,
    args: [sessionId],
  })
  return result.rows.map(mapTicket)
}

// ---------------------------------------------------------------------------
// Demografía anonimizada
// ---------------------------------------------------------------------------

/**
 * Se toma ANTES de cualquier borrado y se congela en la reserva.
 * Cuando el cliente exercise su derecho de supresión, estas tres columnas
 * sobreviven: no identifican a nadie, pero permiten seguir midiendo.
 */
export interface Demographics {
  country: string | null
  ageBand: string | null
  gender: string | null
}

/** Bandas de edad:足够 agregadas para medir sin ser un dato sensible. */
export function ageBandFrom(dateOfBirth?: string | null, today = new Date()): string | null {
  if (!dateOfBirth) return null
  const dob = new Date(dateOfBirth)
  if (Number.isNaN(dob.getTime())) return null

  let age = today.getFullYear() - dob.getFullYear()
  const monthDiff = today.getMonth() - dob.getMonth()
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dob.getDate())) age--

  if (age < 18) return 'menor_de_18'
  if (age < 25) return '18_24'
  if (age < 35) return '25_34'
  if (age < 45) return '35_44'
  if (age < 55) return '45_54'
  if (age < 65) return '55_64'
  return '65_mas'
}

export function normalizeGender(value?: string | null): string | null {
  return normalizeGenderValue(value)
}

const COUNTRIES = new Set<string>(COUNTRY_CODES)

export function normalizeCountry(value?: string | null): string | null {
  if (!value) return null
  const v = String(value).trim().toUpperCase()
  return COUNTRIES.has(v) ? v : null
}

/** Lee la demografía del usuario. Preferimos age_band del registro; DOB es fallback. */
export async function demographicsForUser(userId: string): Promise<Demographics> {
  const result = await turso.execute({
    sql: 'SELECT gender, country, date_of_birth, age_band FROM users WHERE id = ?',
    args: [userId],
  })
  const row: any = result.rows[0]
  if (!row) return { country: null, ageBand: null, gender: null }

  const fromBand = isValidAgeBand(row.age_band) ? row.age_band : null

  return {
    country: normalizeCountry(row.country),
    ageBand: fromBand || ageBandFrom(row.date_of_birth),
    gender: normalizeGender(row.gender),
  }
}
