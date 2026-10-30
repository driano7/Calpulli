// MIT License - Copyright (c) 2024-2026 Donovan Riaño / Calpulli CDMX - See LICENSE
// GET /api/bookings/scan?code=XXX
// Devuelve los detalles completos de una reserva para el escáner de admin.
// Incluye todos los participantes y el grupo de reservas vinculadas (ticket padre).

import {
  getTicketByCode,
  findParticipantsByReference,
  findBookingsByCustomerGroup,
} from '@/lib/booking/turso'
import { getSessionOptional } from '@/lib/auth/session'

export const config = { runtime: 'nodejs' }

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET')
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { code } = req.query || {}

    if (!code) {
      return res.status(400).json({ error: 'Código de ticket requerido' })
    }

    const ticket = await getTicketByCode(String(code))

    if (!ticket) {
      return res.status(404).json({ error: 'Reservación no encontrada' })
    }

    // Obtener todos los participantes de este booking_reference
    const participants = await findParticipantsByReference(ticket.bookingReference)

    // Obtener todas las reservas del mismo cliente para la misma fecha (ticket padre / grupo)
    const groupBookings =
      ticket.customerEmail && ticket.customerPhone
        ? await findBookingsByCustomerGroup({
            customerEmail: ticket.customerEmail,
            customerPhone: ticket.customerPhone,
            date: ticket.startDate,
          })
        : [ticket]

    // Calcular totales del grupo
    const totalPeople = groupBookings.reduce((sum, b) => sum + (b.guests || 1), 0)
    const totalAmount = groupBookings.reduce((sum, b) => sum + (b.totalAmount || 0), 0)

    return res.status(200).json({
      ok: true,
      booking: ticket,
      participants,
      groupBookings: groupBookings.length > 1 ? groupBookings : null,
      totalPeople,
      totalAmount,
      currency: ticket.currency,
    })
  } catch (error) {
    console.error('bookings.scan error:', error)
    return res.status(500).json({ error: 'Error al escanear el ticket' })
  }
}
