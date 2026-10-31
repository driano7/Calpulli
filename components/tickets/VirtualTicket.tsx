'use client'

import React, { useRef, useEffect, useState, useCallback } from 'react'
import { motion } from 'framer-motion'
import { Share } from 'lucide-react'
import { useLanguage } from '@/lib/hooks/useLanguage'
import { formatPriceMXN } from '@/lib/currency'

interface VirtualTicketProps {
  ticket: {
    id: string
    code?: string
    ticketCode?: string
    qrCodeData?: string
    experienceTitle: string
    experienceImage?: string
    date: string
    time: string
    peopleCount: number
    totalPrice: number
    /** Monto del journey independientemente del método de pago (para mostrarlo
     *  incluso cuando se paga en efectivo y el total es 0). */
    journeyAmount?: number
    status: string
    /** Método de pago: 'cash', 'card', 'crypto', etc. */
    paymentMethod?: string
    /** 'paid' | 'unpaid' | ... — define la etiqueta del ticket. */
    paymentStatus?: string
    customerName?: string
    customerEmail?: string
    currency?: string
    location?: string
    /** Nombres de todos los participantes (uno por persona). */
    participantNames?: string[]
    /** WhatsApp del responsable (para mostrar en el ticket). */
    customerPhone?: string | null
  }
  onClose: () => void
  onDownloadPNG?: () => void
  onDownloadPDF?: () => void
  /** Esta persona responde por la reserva. */
  responsible?: boolean
  /** Texto del total, ya formateado (el ticket no sabe la moneda de la vista). */
  totalLabel?: string
  /** Función para compartir el ticket (Web Share API). */
  onShare?: () => void | Promise<void>
}

export function VirtualTicket({
  ticket,
  onClose,
  onDownloadPNG,
  onDownloadPDF,
  responsible = false,
  totalLabel,
}: VirtualTicketProps) {
  const { currentLanguage } = useLanguage()
  const isEs = currentLanguage === 'es'
  const ticketRef = useRef<HTMLDivElement>(null)
  const [isGenerating, setIsGenerating] = useState<'png' | 'pdf' | null>(null)
  const [isSharing, setIsSharing] = useState(false)

  // Etiqueta del ticket: un pago confirmado se muestra como "Journey pagado";
  // efectivo o cripto aún sin verificar, como pendiente.
  const isPaid = ticket.paymentStatus
    ? ticket.paymentStatus === 'paid'
    : ticket.paymentMethod
    ? ticket.paymentMethod !== 'cash'
    : Number(ticket.totalPrice) > 0

  // Detectar si es móvil (Android o iOS) para habilitar share nativo
  const [isMobileDevice, setIsMobileDevice] = useState(false)
  const ua = typeof navigator !== 'undefined' ? navigator.userAgent : ''
  const isAndroid = /android/i.test(ua)
  const isIOS =
    /iphone|ipod|ipad/i.test(ua) ||
    (/macintosh/i.test(ua) &&
      typeof navigator.maxTouchPoints === 'number' &&
      navigator.maxTouchPoints > 1)
  const canShareNative =
    typeof navigator !== 'undefined' &&
    typeof navigator.share === 'function' &&
    (isAndroid || isIOS)

  useEffect(() => {
    setIsMobileDevice(isAndroid || isIOS)
  }, [])

  const [qrValue, setQrValue] = useState<string>(() => {
    const ticketCode = ticket.ticketCode || ticket.code || ticket.id
    if (ticketCode) {
      return String(ticketCode)
        .replace(/^AMX-T-/i, '')
        .toUpperCase()
    }
    // Fallback for legacy data
    if (ticket.qrCodeData) {
      try {
        const parsed = JSON.parse(ticket.qrCodeData)
        if (parsed?.ticketCode) {
          return String(parsed.ticketCode)
            .replace(/^AMX-T-/i, '')
            .toUpperCase()
        }
      } catch {
        // not JSON
      }
    }
    return 'UNKNOWN'
  })

  /** Código de reserva sin prefijo ni sufijo de persona, para mostrar. */
  const cleanTicketCode = String(ticket.ticketCode || ticket.code || ticket.id || '')
    .replace(/^AMX-T-/i, '')
    .toUpperCase()

  /** Participantes ordenados: el responsable primero con (Responsable). */
  const orderedParticipants = (() => {
    const names = Array.isArray(ticket.participantNames) ? [...ticket.participantNames] : []
    if (names.length === 0) return []
    const responsibleIdx = names.findIndex((n) => n === ticket.customerName)
    const ordered = [...names]
    if (responsibleIdx > 0) {
      const [responsibleName] = ordered.splice(responsibleIdx, 1)
      ordered.unshift(responsibleName)
    }
    return ordered.map((name, idx) => ({
      name,
      isResponsible: idx === 0 && responsibleIdx >= 0,
      label: idx === 0 && responsibleIdx >= 0 ? `${name} (Responsable)` : name,
    }))
  })()

  const formatDate = (dateStr: string) => {
    if (!dateStr) return ''
    const date = new Date(dateStr)
    return date.toLocaleDateString('es-MX', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  }

  const formatPrice = (price: number) => formatPriceMXN(price, 'es')

  const ticketCode = ticket.ticketCode || ticket.code || ticket.id

  const generateTicketImage = useCallback(async () => {
    if (!ticketRef.current) return
    setIsGenerating('png')
    try {
      const html2canvas = (await import('html2canvas')).default
      const canvas = await html2canvas(ticketRef.current, {
        scale: 2,
        backgroundColor: '#ffffff',
        useCORS: true,
        logging: false,
      })

      const dataUrl = canvas.toDataURL('image/png', 1.0)
      const link = document.createElement('a')
      link.href = dataUrl
      link.download = `ticket-${cleanTicketCode}.png`
      link.click()

      if (onDownloadPNG) onDownloadPNG()
    } catch (error) {
      console.error('Error generating ticket image:', error)
    } finally {
      setIsGenerating(null)
    }
  }, [onDownloadPNG, ticketCode])

  const generatePDF = useCallback(async () => {
    if (!ticketRef.current) return
    setIsGenerating('pdf')
    try {
      const { jsPDF } = await import('jspdf')
      const html2canvas = (await import('html2canvas')).default

      const canvas = await html2canvas(ticketRef.current, {
        scale: 2,
        backgroundColor: '#ffffff',
        useCORS: true,
      })

      const imgData = canvas.toDataURL('image/png', 1.0)
      const imgWidth = 210 // A4 width in mm
      const imgHeight = (canvas.height * imgWidth) / canvas.width

      const pdf = new jsPDF('p', 'mm', 'a4')
      pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight)

      pdf.save(`ticket-${cleanTicketCode}.pdf`)

      if (onDownloadPDF) onDownloadPDF()
    } catch (error) {
      console.error('Error generating PDF:', error)
    } finally {
      setIsGenerating(null)
    }
  }, [onDownloadPDF, ticketCode])

  const shareTicket = useCallback(async () => {
    if (!ticketRef.current) return
    setIsSharing(true)
    try {
      const html2canvas = (await import('html2canvas')).default
      const canvas = await html2canvas(ticketRef.current, {
        scale: 2,
        backgroundColor: '#ffffff',
        useCORS: true,
        logging: false,
      })
      const dataUrl = canvas.toDataURL('image/png', 1.0)
      const blob = await (await fetch(dataUrl)).blob()
      const file = new File([blob], `ticket-${cleanTicketCode}.png`, { type: 'image/png' })

      const isEs = currentLanguage === 'es'
      const shareData = {
        files: [file],
        title: isEs ? 'Mi ticket Calpulli CDMX' : 'My Calpulli CDMX ticket',
        text: isEs
          ? `Mi ticket para "${ticket.experienceTitle}" — ${ticket.date} ${ticket.time}. Código: ${cleanTicketCode}`
          : `My ticket for "${ticket.experienceTitle}" — ${ticket.date} ${ticket.time}. Code: ${cleanTicketCode}`,
      }

      if (typeof navigator !== 'undefined' && typeof navigator.share === 'function') {
        try {
          await navigator.share(shareData)
          return
        } catch (shareError) {
          if (
            shareError instanceof DOMException &&
            (shareError.name === 'AbortError' || shareError.name === 'NotAllowedError')
          ) {
            throw shareError
          }
          // Fall through to download
        }
      }
      // Fallback: descargar imagen si Web Share no está disponible
      const link = document.createElement('a')
      link.href = dataUrl
      link.download = `ticket-${cleanTicketCode}.png`
      link.click()
    } catch (error) {
      console.error('Error sharing ticket:', error)
    } finally {
      setIsSharing(false)
    }
  }, [ticket.experienceTitle, ticket.date, ticket.time, cleanTicketCode, currentLanguage])

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative max-h-[90vh] w-full max-w-md overflow-y-auto rounded-2xl bg-white shadow-2xl dark:bg-zinc-900"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="relative h-32 bg-gradient-to-r from-orange-500 to-orange-600">
          <div className="absolute inset-0 bg-black/20" />
          <div className="absolute top-4 right-4">
            <button
              onClick={onClose}
              className="rounded-full bg-white/20 p-2 text-white transition-colors hover:bg-white/30"
              aria-label={isEs ? 'Cerrar' : 'Close'}
            >
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-center">
            <div className="font-serif text-2xl font-bold text-white">Calpulli CDMX</div>
            <p className="text-xs text-white/80">Exclusive Mexico Experiences</p>
          </div>
        </div>

        <div ref={ticketRef} className="space-y-4 bg-white p-6 dark:bg-zinc-900">
          {/* QR Code */}
          <div className="flex justify-center">
            <div className="relative rounded-xl bg-gray-50 p-4 dark:bg-zinc-800/50 dark:bg-zinc-800/50">
              <div className="flex justify-center">
                <div className="relative rounded-lg bg-white p-3 shadow-sm">
                  {/* Lazy-import QR to avoid SSR issues */}
                  <span className="mb-2 block text-center text-[0.6rem] uppercase tracking-widest text-gray-400">
                    {isEs ? 'Escanea para verificar' : 'Scan to verify'}
                  </span>
                  <TicketQR value={qrValue} />
                </div>
              </div>
              <p className="mt-3 text-center font-mono text-sm font-semibold tracking-wider text-gray-600 dark:text-zinc-300">
                {cleanTicketCode}
              </p>
            </div>
          </div>

          {/* Estado del pago */}
          <div
            className={`rounded-xl border p-3 text-center text-sm font-semibold ${
              isPaid
                ? 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-300'
                : 'border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-300'
            }`}
          >
            {isPaid
              ? isEs
                ? 'Journey pagado'
                : 'Journey paid'
              : isEs
              ? 'Pago pendiente'
              : 'Payment pending'}
          </div>

          {/* Ticket Info */}
          <div className="space-y-3">
            <div className="flex items-center justify-between rounded-xl bg-orange-50 p-4 dark:bg-orange-500/10">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-orange-100 dark:bg-orange-500/20">
                  <svg
                    className="h-6 w-6 text-orange-600"
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
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    {isEs ? 'Fecha' : 'Date'}
                  </p>
                  <p className="text-sm text-gray-500 dark:text-zinc-400">
                    {formatDate(ticket.date)}
                  </p>
                </div>
              </div>
              <span className="text-sm text-gray-500 dark:text-zinc-400">{ticket.time}</span>
            </div>

            <div className="flex items-center justify-between rounded-xl bg-gray-50 p-4 dark:bg-zinc-800/50 dark:bg-zinc-800/50">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-500/20">
                  <svg
                    className="h-6 w-6 text-blue-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                    />
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    {isEs ? 'Personas' : 'People'}
                  </p>
                  <p className="text-sm text-gray-500 dark:text-zinc-400">
                    {ticket.peopleCount}{' '}
                    {ticket.peopleCount === 1
                      ? isEs
                        ? 'persona'
                        : 'person'
                      : isEs
                      ? 'personas'
                      : 'people'}
                  </p>
                </div>
              </div>

              {/* Lista de participantes: nombre - actividad - fecha/hora - clave ticket */}
              {orderedParticipants.length > 0 && (
                <div className="space-y-2">
                  <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                    {isEs ? 'Participantes' : 'Participants'}
                  </p>
                  {orderedParticipants.map((p, idx) => (
                    <div key={idx} className="flex items-start gap-3 text-sm">
                      <span className="text-zinc-500 dark:text-zinc-400">{idx + 1}.</span>
                      <span className="font-medium text-gray-900 dark:text-white">{p.label}</span>
                      <span className="ml-2 text-zinc-500 dark:text-zinc-400">—</span>
                      <span className="text-gray-900 dark:text-white">
                        {ticket.experienceTitle}
                      </span>
                      <span className="ml-2 text-zinc-500 dark:text-zinc-400">—</span>
                      <span className="text-zinc-500 dark:text-zinc-400">
                        {ticket.date} {ticket.time ? '· ' + ticket.time : ''}
                      </span>
                      <span className="ml-2 text-zinc-500 dark:text-zinc-400">—</span>
                      <span className="font-mono text-xs text-orange-600 dark:text-orange-400">
                        {ticket.ticketCode}
                      </span>
                    </div>
                  ))}
                </div>
              )}

              {/* WhatsApp del responsable */}
              {ticket.customerPhone && (
                <div className="rounded-xl border border-orange-200 bg-orange-50 p-4 dark:border-orange-500/30 dark:bg-orange-500/10">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-orange-100 dark:bg-orange-500/20">
                      <svg
                        className="h-5 w-5 text-orange-600"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M3 8l7.89 5.26a2 2 0 002.22-.28L14.39 7.12a1 1 0 011.43-.05l3.56 1.49a1 1 0 001.43-.04l2.22-.74a2 2 0 00.44-1.58L16.54 1.47c-.16-.53-.66-1.06-1.27-1.27L6.94.43a2 2 0 00-1.58.44L.44 8.77a2 2 0 00-.15 1.58l2.22 7.41a2 2 0 001.572 1.172l5.262 2.631a1 1 0 01.116.177l.74.25a1 1 0 001.1-.25l3.56-1.49a1 1 0 01.43-.05l1.49-3.56c.18-.44.25-.91.05-1.38z"
                        />
                      </svg>
                    </div>
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                        {isEs ? 'WhatsApp del responsable' : "Responsible's WhatsApp"}
                      </p>
                      <p className="text-sm text-gray-900 dark:text-white">
                        {ticket.customerPhone}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              <span className="text-sm font-semibold text-gray-700 dark:text-zinc-200">
                {totalLabel ||
                  (ticket.paymentMethod === 'cash'
                    ? isEs
                      ? `Pagar en efectivo — Journey ${formatPrice(
                          ticket.journeyAmount || ticket.totalPrice || 0
                        )}`
                      : `Pay on pickup — Journey ${formatPrice(
                          ticket.journeyAmount || ticket.totalPrice || 0
                        )}`
                    : ticket.totalPrice === 0
                    ? isEs
                      ? 'Pagar en efectivo'
                      : 'Pay on pickup'
                    : formatPrice(ticket.totalPrice))}
              </span>
            </div>

            <div className="rounded-xl border border-orange-200 bg-orange-50 p-4 dark:border-orange-500/30 dark:bg-orange-500/10 dark:bg-orange-500/10">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <svg className="h-5 w-5 text-orange-600" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-6a.75.75 0 01.75.75v4.5a.75.75 0 01-1.5 0v-4.5A.75.75 0 0110 4z"
                      clipRule="evenodd"
                    />
                    <path
                      fillRule="evenodd"
                      d="M10 4a.75.75 0 01.75-.75h.5a.75.75 0 010 1.5h-.5A.75.75 0 0110 4z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <p className="font-medium text-gray-900 dark:text-white">
                    {isEs ? 'Código de reserva' : 'Booking code'}
                  </p>
                </div>
                <span className="font-mono text-lg font-bold tracking-widest text-orange-600">
                  {cleanTicketCode}
                </span>
              </div>
            </div>
          </div>

          {/* Experience Info */}
          <div className="space-y-2 border-t border-gray-200 pt-4 dark:border-white/10">
            <p className="text-sm text-gray-500 dark:text-zinc-400">
              {isEs ? 'Experiencia' : 'Experience'}
            </p>
            <div className="flex items-center gap-3 rounded-lg bg-gray-50 p-3 dark:bg-zinc-800/50">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={ticket.experienceImage || '/static/images/jaguarBaja.png'}
                alt={ticket.experienceTitle}
                className="h-16 w-16 rounded-lg object-cover"
              />
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium text-gray-900 dark:text-white">
                  {ticket.experienceTitle}
                </p>
                {ticket.location && (
                  <p className="text-sm text-gray-500 dark:text-zinc-400">{ticket.location}</p>
                )}
              </div>
            </div>
            {responsible && (
              <div className="flex items-center gap-1.5 rounded-full bg-orange-500/10 px-3 py-1.5 text-xs font-semibold text-orange-600 dark:text-orange-300">
                <span aria-hidden>★</span>
                {isEs ? 'Responsable de la reserva' : 'Responsible for the booking'}
              </div>
            )}
            {ticket.customerName && (
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-500 dark:text-zinc-400">
                  {isEs ? 'Cliente' : 'Client'}
                </span>
                <span className="font-medium text-gray-800 dark:text-zinc-100">
                  {ticket.customerName}
                </span>
              </div>
            )}
            {ticket.customerEmail && (
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-500 dark:text-zinc-400">Email</span>
                <span className="font-medium text-gray-800 dark:text-zinc-100">
                  {ticket.customerEmail}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="space-y-3 border-t border-gray-200 bg-white p-4 dark:border-white/10 dark:bg-zinc-900">
          <button
            onClick={generateTicketImage}
            disabled={isGenerating !== null}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-orange-500 py-3 px-4 font-semibold text-white transition-colors hover:bg-orange-600 disabled:opacity-50"
          >
            {isGenerating === 'png' ? (
              <svg className="h-5 w-5 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                />
              </svg>
            ) : (
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"
                />
              </svg>
            )}
            {isGenerating === 'png'
              ? isEs
                ? 'Generando...'
                : 'Generating...'
              : isEs
              ? 'Descargar PNG'
              : 'Download PNG'}
          </button>

          <button
            onClick={generatePDF}
            disabled={isGenerating !== null}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-gray-100 py-3 px-4 font-semibold text-gray-900 transition-colors hover:bg-gray-200 disabled:opacity-50 dark:bg-white/10 dark:text-white dark:hover:bg-white/20"
          >
            {isGenerating === 'pdf' ? (
              <svg className="h-5 w-5 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                />
              </svg>
            ) : (
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v13a2 2 0 002 2z"
                />
              </svg>
            )}
            {isGenerating === 'pdf'
              ? isEs
                ? 'Generando...'
                : 'Generating...'
              : isEs
              ? 'Descargar PDF'
              : 'Download PDF'}
          </button>

          {isMobileDevice && (
            <button
              onClick={shareTicket}
              disabled={isSharing}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-gray-100 py-3 px-4 font-semibold text-gray-900 transition-colors hover:bg-gray-200 disabled:opacity-50 dark:bg-white/10 dark:text-white dark:hover:bg-white/20"
            >
              {isSharing ? (
                <svg className="h-5 w-5 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                  />
                </svg>
              ) : (
                <Share className="h-5 w-5" />
              )}
              {isSharing
                ? isEs
                  ? 'Compartiendo...'
                  : 'Sharing...'
                : isEs
                ? 'Compartir ticket'
                : 'Share ticket'}
            </button>
          )}

          <button
            onClick={onClose}
            className="w-full rounded-xl border border-gray-300 py-3 px-4 font-semibold text-gray-700 transition-colors hover:bg-gray-50 dark:border-white/20 dark:text-zinc-200 dark:hover:bg-white/5"
          >
            {isEs ? 'Cerrar' : 'Close'}
          </button>
        </div>
      </motion.div>
    </motion.div>
  )
}

// Client-only QR component to avoid SSR issues with qrcode.react
function TicketQR({ value }: { value: string }) {
  const [QRCode, setQRCode] = useState<React.ComponentType<{
    value: string
    size: number
    level: string
    includeMargin: boolean
    bgColor: string
    fgColor: string
  }> | null>(null)

  useEffect(() => {
    let active = true
    import('qrcode.react').then((mod) => {
      if (active) {
        setQRCode(() => mod.QRCodeSVG || mod.default)
      }
    })
    return () => {
      active = false
    }
  }, [])

  if (!QRCode) {
    return (
      <div className="h-[160px] w-[160px] animate-pulse rounded-lg bg-gray-200 dark:bg-zinc-700" />
    )
  }

  return (
    <QRCode
      value={value}
      size={160}
      level="H"
      includeMargin={true}
      bgColor="#ffffff"
      fgColor="#0f172a"
    />
  )
}
