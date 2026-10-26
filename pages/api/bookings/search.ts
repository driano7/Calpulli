import type { NextApiRequest, NextApiResponse } from 'next'
import { getBookingsByUser } from '@/lib/booking/server'
import { getSession } from '@/lib/auth/session'

/**
 * Endpoint de búsqueda de reservas para usuarios autenticados.
 *
 * Query params:
 *   - experienceId (opcional): filtrar por actividad
 *   - date (opcional): filtrar por fecha YYYY-MM-DD
 *   - name (opcional): filtrar por nombre del cliente o participantes
 *   - from / to (opcional): rango de fechas
 *
 * Reglas de negocio:
 *   - Solo se pueden consultar reservas dentro de un rango de ±1 mes desde hoy.
 *   - Si se pide fuera de ese rango, se devuelve error 400 con mensaje.
 */

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const session = await getSession(req)
  const userId = session?.user?.id

  if (!userId || String(userId).startsWith('guest_')) {
    return res.status(401).json({ error: 'No autorizado' })
  }

  const { experienceId, date, name, from, to } = req.query

  // --- Regla: rango máximo de ±1 mes desde hoy -------------------------------
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const oneMonthAgo = new Date(today)
  oneMonthAgo.setMonth(today.getMonth() - 1)

  const oneMonthFromNow = new Date(today)
  oneMonthFromNow.setMonth(today.getMonth() + 1)

  const requestedFrom = from ? new Date(String(from)) : null
  const requestedTo = to ? new Date(String(to)) : null

  // Si se especifica un rango, validar que esté dentro de ±1 mes
  if (requestedFrom && requestedFrom < oneMonthAgo) {
    return res.status(400).json({
      error: 'No se pueden consultar reservas con más de un mes de antelación hacia atrás.',
      es: 'No se pueden consultar reservas con más de un mes de antelación hacia atrás.',
      en: 'You cannot query bookings more than one month in the past.',
      maxRange: '±1 mes desde hoy',
    })
  }

  if (requestedTo && requestedTo > oneMonthFromNow) {
    return res.status(400).json({
      error: 'No se pueden consultar reservas con más de un mes de antelación hacia adelante.',
      es: 'No se pueden consultar reservas con más de un mes de antelación hacia adelante.',
      en: 'You cannot query bookings more than one month in the future.',
      maxRange: '±1 mes desde hoy',
    })
  }

  // Si se especifica una fecha única, validar que esté dentro de ±1 mes
  if (date) {
    const d = new Date(String(date))
    d.setHours(0, 0, 0, 0)
    if (d < oneMonthAgo || d > oneMonthFromNow) {
      return res.status(400).json({
        error: 'La fecha debe estar dentro de los próximos 30 días o los últimos 30 días.',
        es: 'La fecha debe estar dentro de los próximos 30 días o los últimos 30 días.',
        en: 'The date must be within the next 30 days or the last 30 days.',
        maxRange: '±1 mes desde hoy',
      })
    }
  }

  try {
    const bookings = await getBookingsByUser(userId)

    // Filtrar en memoria (el storage actual no soporta filtros complejos)
    let filtered = bookings

    if (experienceId) {
      filtered = filtered.filter((b) => String(b.experienceId) === String(experienceId))
    }

    if (date) {
      filtered = filtered.filter((b) => b.date === String(date))
    }

    if (from) {
      filtered = filtered.filter((b) => b.date >= String(from))
    }

    if (to) {
      filtered = filtered.filter((b) => b.date <= String(to))
    }

    if (name) {
      const q = String(name).toLowerCase().trim()
      filtered = filtered.filter(
        (b) =>
          b.customerName?.toLowerCase().includes(q) ||
          b.participantNames?.some((pn: string) => pn.toLowerCase().includes(q)) ||
          b.id?.toLowerCase().includes(q)
      )
    }

    return res.status(200).json({ bookings: filtered })
  } catch (error) {
    console.error('Error searching bookings:', error)
    return res.status(500).json({ error: 'Error al buscar reservaciones' })
  }
}
