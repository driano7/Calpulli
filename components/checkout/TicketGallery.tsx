'use client'

// MIT License - Copyright (c) 2024-2026 Donovan Riaño / Calpulli CDMX - See LICENSE
import { useEffect, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { ChevronLeft, ChevronRight, Star, Ticket as TicketIcon } from 'lucide-react'

interface ParticipantTicket {
  position: number
  participantName: string
  ticketCode: string
  isResponsible: boolean
}

interface BookingWithTickets {
  id: string
  bookingReference?: string
  ticketCode?: string
  /** Método de pago: 'cash', 'card', 'crypto'. */
  paymentMethod?: string
  /** Monto del journey independientemente del método de pago. */
  journeyAmount?: number
  customerName?: string
  experienceTitle?: string
  date?: string
  time?: string
  guests?: number
  totalAmount?: number
  currency?: string
  status?: string
  tickets?: ParticipantTicket[]
}

/**
 * Los tickets de una reserva, uno por persona.
 *
 * Antes era una lista de reservas con un boton "ver ticket": con varias
 * personas habia un solo QR por reserva, compartido entre todas. Ahora cada
 * persona tiene su ticket con su codigo, y se recorren con flechas.
 */
export function TicketGallery({
  bookings,
  locale,
  onOpen,
}: {
  bookings: BookingWithTickets[]
  locale: string
  onOpen: (payload: { booking: BookingWithTickets; ticket: ParticipantTicket }) => void
}) {
  const isEs = locale === 'es'
  const [index, setIndex] = useState(0)

  const entries = useMemo(() => {
    const list: { booking: BookingWithTickets; ticket: ParticipantTicket }[] = []
    for (const booking of bookings) {
      const tickets =
        Array.isArray(booking.tickets) && booking.tickets.length
          ? booking.tickets
          : [
              {
                position: 1,
                participantName: booking.customerName || 'Invitado',
                ticketCode: booking.ticketCode || booking.bookingReference || '',
                isResponsible: true,
              },
            ]
      for (const ticket of tickets) list.push({ booking, ticket })
    }
    return list
  }, [bookings])

  useEffect(() => {
    if (index > entries.length - 1) setIndex(Math.max(0, entries.length - 1))
  }, [entries.length, index])

  if (entries.length === 0) return null
  const current = entries[index]
  const total = entries.length

  return (
    <div className="mt-8">
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-base font-bold text-gray-900 dark:text-white">
          {isEs ? 'Tus tickets' : 'Your tickets'}
        </h2>
        <span className="text-xs text-zinc-500 dark:text-zinc-400">
          {index + 1} / {total}
        </span>
      </div>

      <p className="mt-1 text-xs text-zinc-600 dark:text-zinc-400">
        {isEs
          ? 'Cada persona tiene su propio ticket con su código QR. Guárdalos o descárgalos: se muestran también en el correo.'
          : 'Each person has their own ticket with its own QR code. Save or download them: they are also in the email.'}
      </p>

      <div className="mt-4 flex items-stretch gap-3">
        <button
          type="button"
          onClick={() => setIndex((value) => Math.max(0, value - 1))}
          disabled={index === 0}
          aria-label={isEs ? 'Anterior' : 'Previous'}
          className="flex w-10 flex-shrink-0 items-center justify-center rounded-2xl border border-zinc-200 bg-white text-zinc-600 transition-colors hover:border-orange-400 hover:text-orange-600 disabled:cursor-not-allowed disabled:opacity-30 dark:border-white/10 dark:bg-zinc-900 dark:text-zinc-300"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>

        <motion.div
          className="flex-1 rounded-2xl border border-zinc-200 bg-white p-4 text-left dark:border-white/10 dark:bg-zinc-900/50"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        >
          <div className="flex items-center gap-3">
            <TicketIcon className="h-5 w-5 shrink-0 text-orange-500" />
            <div className="min-w-0 flex-1">
              <p className="truncate font-semibold text-gray-900 dark:text-white">
                {current.ticket.participantName}
              </p>
              <p className="truncate text-sm text-zinc-500 dark:text-zinc-400">
                {current.booking.experienceTitle}
                {current.booking.date ? ` — ${current.booking.date}` : ''}
                {current.booking.time ? ` · ${current.booking.time}` : ''}
              </p>
              <p className="mt-1 font-mono text-xs text-zinc-400 dark:text-zinc-500">
                {current.ticket.ticketCode}
              </p>
            </div>
            {current.ticket.isResponsible && (
              <span className="flex shrink-0 items-center gap-1 rounded-full bg-orange-500/10 px-2 py-1 text-[11px] font-semibold text-orange-600 dark:text-orange-300">
                <Star className="h-3 w-3" />
                {isEs ? 'Responsable' : 'Responsible'}
              </span>
            )}
          </div>

          <button
            type="button"
            onClick={() => onOpen(current)}
            className="mt-3 w-full rounded-xl bg-orange-500 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-orange-600"
          >
            {isEs ? 'Ver ticket y descargarlo' : 'View and download ticket'}
          </button>
        </motion.div>

        <button
          type="button"
          onClick={() => setIndex((value) => Math.min(total - 1, value + 1))}
          disabled={index >= total - 1}
          aria-label={isEs ? 'Siguiente' : 'Next'}
          className="flex w-10 flex-shrink-0 items-center justify-center rounded-2xl border border-zinc-200 bg-white text-zinc-600 transition-colors hover:border-orange-400 hover:text-orange-600 disabled:cursor-not-allowed disabled:opacity-30 dark:border-white/10 dark:bg-zinc-900 dark:text-zinc-300"
        >
          <ChevronRight className="h-5 w-5" />
        </button>
      </div>
    </div>
  )
}
