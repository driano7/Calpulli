// MIT License - Copyright (c) 2024-2026 Donovan Riaño / Calpulli CDMX - See LICENSE
// POST /api/admin/qr — Resuelve un QR (reserva o cliente) contra Turso
import { getSessionUser, logAccess } from '@/lib/auth'
import { checkIn, getTicketByCode } from '@/lib/booking/turso'
import { trySend } from '@/lib/mail/service'

/** Escapa lo que viaja dentro del correo (nombres de personas). */
function escapeHtml(value: unknown): string {
  return String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const header = req.headers.authorization
  const token = header?.startsWith('Bearer ') ? header.slice(7) : null
  if (!token) return res.status(401).json({ error: 'Unauthorized' })

  const actor = await getSessionUser(token)
  if (!actor) return res.status(401).json({ error: 'Unauthorized' })
  if (actor.role === 'client') return res.status(403).json({ error: 'Forbidden' })

  const raw = typeof req.body?.code === 'string' ? req.body.code.trim() : ''
  if (!raw) return res.status(400).json({ error: 'code requerido' })

  const code = raw.toUpperCase()

  const wantsCheckIn = req.body?.checkIn === true

  try {
    const ticket = await getTicketByCode(code)

    if (!ticket) {
      return res.status(404).json({ error: 'Código QR no encontrado' })
    }

    if (wantsCheckIn) {
      // El correo de check-in se manda solo la primera vez: si el empleado
      // vuelve a escanear el mismo QR no queremos repetirle el aviso.
      const wasCheckedIn = Boolean(ticket.checkedInAt)
      const updated = await checkIn(ticket.bookingReference, actor.id)
      await logAccess({
        actorId: actor.id,
        actorEmail: actor.email,
        actorRole: actor.role,
        action: 'check_in',
        targetEmail: ticket.customerEmail,
        details: { bookingReference: ticket.bookingReference, guests: ticket.guests },
        ip: (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() ?? null,
      })

      if (!wasCheckedIn && ticket.customerEmail) {
        await trySend('check_in_done', ticket.customerEmail, null, {
          firstName: escapeHtml((ticket.customerName || '').split(' ')[0] || 'viajera'),
          experienceTitle: escapeHtml(ticket.experienceTitle || 'Tu tour'),
          bookingReference: escapeHtml(ticket.bookingReference),
        })
      }

      return res.status(200).json({ resolved: toResolved(updated ?? ticket), checkedIn: true })
    }

    await logAccess({
      actorId: actor.id,
      actorEmail: actor.email,
      actorRole: actor.role,
      action: 'scan_qr',
      targetEmail: ticket.customerEmail,
      details: { bookingReference: ticket.bookingReference },
      ip: (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() ?? null,
    })

    return res.status(200).json({ resolved: toResolved(ticket), checkedIn: false })
  } catch (error) {
    console.error('QR resolve error:', error)
    return res.status(500).json({ error: 'No se pudo resolver el código' })
  }
}

function toResolved(ticket: any) {
  return {
    type: 'booking',
    ticketCode: ticket.ticketCode,
    bookingReference: ticket.bookingReference,
    experienceTitle: ticket.experienceTitle,
    date: ticket.startDate,
    endDate: ticket.startDate,
    time: ticket.startTime,
    peopleCount: ticket.guests,
    totalPrice: ticket.totalAmount,
    currency: ticket.currency,
    customerName: ticket.customerName || '—',
    customerEmail: ticket.customerEmail,
    status: ticket.checkedInAt ? 'checked-in' : ticket.status,
    paymentStatus: ticket.paymentStatus,
    paidAt: ticket.paidAt,
    meetingPoint: ticket.location,
    specialRequests: ticket.specialRequests,
    accessibilityNeeds: ticket.accessibilityNeeds,
    isGuest: ticket.isGuest,
    checkedInAt: ticket.checkedInAt,
  }
}
