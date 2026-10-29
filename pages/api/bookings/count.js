// MIT License - Copyright (c) 2024-2026 Donovan Riaño / Calpulli CDMX - See LICENSE
// GET /api/bookings/count?experienceId=XXX&email=XXX&phone=XXX&userId=XXX
// Devuelve cuántas reservas tiene un usuario para un journey (máximo 3).
// Se usa para mostrar warning cuando se acerca al límite y bloquear al llegar.

import { countBookingsByExperienceAndIdentity } from '@/lib/booking/turso'
import { getSessionOptional } from '@/lib/auth/session'

export const config = { runtime: 'nodejs' }

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET')
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { experienceId, email, phone, userId } = req.query || {}

    if (!experienceId) {
      return res.status(400).json({ error: 'Falta experienceId' })
    }

    const session = await getSessionOptional(req)
    const isLoggedIn = Boolean(session?.user?.id)

    const result = await countBookingsByExperienceAndIdentity({
      experienceId: String(experienceId),
      userId: isLoggedIn ? String(session.user.id) : undefined,
      customerEmail: isLoggedIn ? undefined : String(email || ''),
      customerPhone: isLoggedIn ? undefined : String(phone || ''),
    })

    return res.status(200).json({
      ok: true,
      ...result,
      isLoggedIn,
      message:
        result.atLimit
          ? `Has alcanzado el límite de ${result.limit} reservas para este journey.`
          : result.warning
          ? `Te queda ${result.remaining} reserva para este journey.`
          : null,
    })
  } catch (error) {
    console.error('bookings.count error:', error)
    return res.status(500).json({ error: 'No se pudo consultar el límite de reservas' })
  }
}
