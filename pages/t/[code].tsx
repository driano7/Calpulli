// MIT License - Copyright (c) 2024-2026 Donovan Riaño / Calpulli CDMX - See LICENSE
/**
 * Ticket publico: /t/<codigo>
 *
 * El enlace que llega por correo. Muestra el ticket con su QR y deja
 * descargarlo en PNG o PDF. No necesita cuenta.
 */
import { useEffect, useState } from 'react'
import Head from 'next/head'
import { useRouter } from 'next/router'
import { useLanguage } from '@/lib/hooks/useLanguage'
import { VirtualTicket } from '@/components/tickets/VirtualTicket'
import { formatPriceMXN } from '@/lib/currency'

export default function PublicTicketPage() {
  const router = useRouter()
  const { currentLanguage } = useLanguage()
  const isEs = currentLanguage === 'es'
  const code = typeof router.query?.code === 'string' ? router.query.code : ''

  const [ticket, setTicket] = useState(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!code) return undefined
    let cancelled = false
    fetch(`/api/ticket/${encodeURIComponent(code)}`)
      .then(async (response) => {
        const data = await response.json().catch(() => ({}))
        if (cancelled) return
        if (!response.ok) {
          setError(data?.error || (isEs ? 'No encontramos ese ticket' : 'Ticket not found'))
          return
        }
        setTicket(data.ticket)
      })
      .catch(() => {
        if (!cancelled) setError(isEs ? 'No pudimos leer el ticket' : 'Could not read the ticket')
      })
    return () => {
      cancelled = true
    }
  }, [code, isEs])

  return (
    <div className="min-h-screen bg-zinc-50 px-4 py-10 dark:bg-zinc-950">
      <Head>
        <title>{isEs ? 'Tu ticket — Calpulli CDMX' : 'Your ticket — Calpulli CDMX'}</title>
        <meta name="robots" content="noindex" />
      </Head>

      <div className="mx-auto max-w-lg">
        <h1 className="mb-1 text-center font-serif text-2xl font-bold text-zinc-900 dark:text-white">
          {isEs ? 'Tu ticket' : 'Your ticket'}
        </h1>
        <p className="mb-8 text-center text-sm text-zinc-500 dark:text-zinc-400">
          {isEs
            ? 'Muéstralo al llegar. Puedes descargarlo en PNG o PDF.'
            : 'Show it when you arrive. You can download it as PNG or PDF.'}
        </p>

        {error && (
          <p className="rounded-2xl border border-red-500/30 bg-red-500/10 p-6 text-center text-sm text-red-600 dark:text-red-300">
            {error}
          </p>
        )}

        {!error && !ticket && (
          <p className="rounded-2xl border border-zinc-200 bg-white p-6 text-center text-sm text-zinc-500 dark:border-white/10 dark:bg-zinc-900 dark:text-zinc-400">
            {isEs ? 'Cargando…' : 'Loading…'}
          </p>
        )}

        {ticket && (
          <VirtualTicket
            ticket={{
              id: ticket.id,
              ticketCode: ticket.ticketCode,
              experienceTitle: ticket.experienceTitle,
              experienceImage: ticket.imageUrl,
              date: ticket.date,
              time: ticket.time,
              peopleCount: 1,
              totalPrice: ticket.totalAmount,
              status: ticket.status,
              paymentStatus: ticket.paymentStatus,
              customerName: ticket.participantName,
              currency: ticket.currency || 'MXN',
              location: ticket.location,
            }}
            onClose={() => router.push('/')}
            responsible={ticket.isResponsible}
            totalLabel={formatPriceMXN(ticket.totalAmount, isEs ? 'es' : 'en')}
          />
        )}
      </div>
    </div>
  )
}
