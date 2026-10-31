'use client'

// MIT License - Copyright (c) 2024-2026 Donovan Riaño / Calpulli CDMX - See LICENSE
// Ticket Padre (Master Ticket): agrupa todas las reservas de una misma compra
// bajo un solo código (el del responsable) para descarga y comparto unificado.

import React, { useRef, useEffect, useState, useCallback } from 'react'
import { motion } from 'framer-motion'
import { Share, Download, FileText, Users, Clock, MapPin, Link as LinkIcon } from 'lucide-react'
import { useLanguage } from '@/lib/hooks/useLanguage'
import { formatPriceMXN } from '@/lib/currency'

interface MasterTicketProps {
  /** Todos los bookings de la compra (uno por experiencia/actividad). */
  bookings: Array<{
    id: string
    bookingReference: string
    ticketCode: string
    customerName?: string | null
    customerEmail?: string | null
    customerPhone?: string | null
    experienceTitle: string
    experienceImage?: string | null
    date: string
    time: string
    peopleCount: number
    totalAmount: number
    currency: string
    status: string
    paymentMethod?: string
    paymentStatus?: string
    journeyAmount?: number
    location?: string | null
  }>
  onClose: () => void
}

export function MasterTicket({ bookings, onClose }: MasterTicketProps) {
  const { currentLanguage } = useLanguage()
  const isEs = currentLanguage === 'es'
  const ticketRef = useRef<HTMLDivElement>(null)
  const [isGenerating, setIsGenerating] = useState<'png' | 'pdf' | null>(null)
  const [isSharing, setIsSharing] = useState(false)

  // Detectar móvil para share nativo
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

  // El responsable es el primer booking (posición 1) o el que tiene isResponsible
  const responsibleBooking = bookings.find((b) => (b as any).isResponsible === true) || bookings[0]
  const parentCode = responsibleBooking?.ticketCode || ''
  const responsibleName = responsibleBooking?.customerName || ''
  const responsiblePhone = responsibleBooking?.customerPhone || ''
  const responsibleEmail = responsibleBooking?.customerEmail || ''

  /** Todos los participantes aplanados de todos los bookings. */
  const allParticipants = bookings.flatMap((b) => {
    const count = Math.max(1, Number(b.peopleCount || 1))
    return Array.from({ length: count }, (_, i) => ({
      name: (b as any).participantNames?.[i] || `Persona ${i + 1}`,
      experienceTitle: b.experienceTitle,
      date: b.date,
      time: b.time,
      ticketCode: b.ticketCode,
      isResponsible: i === 0 && b === responsibleBooking,
    }))
  })

  const totalAmount = bookings.reduce((sum, b) => sum + Number(b.totalAmount || 0), 0)

  // Si alguna reserva de la compra no está pagada, el ticket padre lo dice.
  const isPaid =
    bookings.length > 0 &&
    bookings.every((b) =>
      b.paymentStatus
        ? b.paymentStatus === 'paid'
        : b.paymentMethod
        ? b.paymentMethod !== 'cash'
        : true
    )

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

  const [qrValue, setQrValue] = useState<string>(parentCode)

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
      link.download = `ticket-padre-${parentCode}.png`
      link.click()
    } catch (error) {
      console.error('Error generating ticket image:', error)
    } finally {
      setIsGenerating(null)
    }
  }, [parentCode])

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
      const imgWidth = 210
      const imgHeight = (canvas.height * imgWidth) / canvas.width
      const pdf = new jsPDF('p', 'mm', 'a4')
      pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight)
      pdf.save(`ticket-padre-${parentCode}.pdf`)
    } catch (error) {
      console.error('Error generating PDF:', error)
    } finally {
      setIsGenerating(null)
    }
  }, [parentCode])

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
      const file = new File([blob], `ticket-padre-${parentCode}.png`, { type: 'image/png' })

      const shareData = {
        files: [file],
        title: isEs ? 'Mi Ticket Padre — Calpulli CDMX' : 'My Parent Ticket — Calpulli CDMX',
        text: isEs
          ? `Mis reservas de Calpulli CDMX — ${responsibleName}. Código: ${parentCode}`
          : `My Calpulli CDMX bookings — ${responsibleName}. Code: ${parentCode}`,
      }

      if (canShareNative) {
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
        }
      }
      const link = document.createElement('a')
      link.href = dataUrl
      link.download = `ticket-padre-${parentCode}.png`
      link.click()
    } catch (error) {
      console.error('Error sharing ticket:', error)
    } finally {
      setIsSharing(false)
    }
  }, [parentCode, responsibleName, isEs, canShareNative])

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
        className="relative max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white shadow-2xl dark:bg-zinc-900"
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
          {/* QR Code con código padre */}
          <div className="flex justify-center">
            <div className="relative rounded-xl bg-gray-50 p-4 dark:bg-zinc-800/50">
              <div className="flex justify-center">
                <div className="relative rounded-lg bg-white p-3 shadow-sm">
                  <span className="mb-2 block text-center text-[0.6rem] uppercase tracking-widest text-gray-400">
                    {isEs ? 'Código Padre (Responsable)' : 'Parent Code (Responsible)'}
                  </span>
                  <div className="relative">
                    {/* QR placeholder */}
                    <div className="h-16 w-16 border-4 border-orange-600 bg-white p-1">
                      <svg
                        className="h-full w-full"
                        viewBox="0 0 256 256"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <rect width="256" height="256" fill="white" />
                        <rect x="32" y="32" width="64" height="64" fill="black" />
                        <rect x="160" y="32" width="64" height="64" fill="black" />
                        <rect x="32" y="160" width="64" height="64" fill="black" />
                        <rect x="80" y="80" width="96" height="96" fill="black" />
                        <rect x="104" y="104" width="48" height="48" fill="white" />
                      </svg>
                    </div>
                  </div>
                  <p className="mt-2 text-center font-mono text-sm font-bold tracking-widest text-orange-600">
                    {parentCode}
                  </p>
                </div>
              </div>
              <p className="mt-3 text-center text-xs text-zinc-500 dark:text-zinc-400">
                {isEs
                  ? 'Escanea para verificar todas las reservas de esta compra'
                  : 'Scan to verify all bookings of this purchase'}
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

          {/* Responsable */}
          <div className="rounded-xl border border-orange-200 bg-orange-50 p-4 dark:border-orange-500/30 dark:bg-orange-500/10">
            <div className="flex items-center gap-3">
              <Users className="h-5 w-5 text-orange-600" />
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                  {isEs ? 'Responsable de la reserva' : 'Reservation Responsible'}
                </p>
                <p className="text-sm font-medium text-gray-900 dark:text-white">
                  {responsibleName}
                </p>
                {responsiblePhone && (
                  <p className="text-xs text-zinc-500 dark:text-zinc-400">{responsiblePhone}</p>
                )}
                {responsibleEmail && (
                  <p className="text-xs text-zinc-500 dark:text-zinc-400">{responsibleEmail}</p>
                )}
              </div>
            </div>
          </div>

          {/* Tabla de participantes */}
          <div className="space-y-2">
            <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
              {isEs ? 'Participantes y Reservas' : 'Participants and Bookings'}
            </p>
            <div className="overflow-x-auto rounded-xl border border-zinc-200 bg-white p-4 dark:border-white/10 dark:bg-zinc-900/50">
              <table className="w-full border-collapse text-sm">
                <thead>
                  <tr className="border-b border-zinc-200 text-zinc-500 dark:border-white/10 dark:text-zinc-400">
                    <th className="py-2 px-3 text-left">{isEs ? 'Nombre' : 'Name'}</th>
                    <th className="py-2 px-3 text-left">{isEs ? 'Actividad' : 'Activity'}</th>
                    <th className="py-2 px-3 text-left">{isEs ? 'Fecha / Hora' : 'Date / Time'}</th>
                    <th className="py-2 px-3 text-left">
                      {isEs ? 'Código Ticket' : 'Ticket Code'}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {allParticipants.map((p, idx) => (
                    <tr
                      key={idx}
                      className="border-b border-zinc-100 hover:bg-zinc-50/50 dark:border-white/5 dark:hover:bg-zinc-900/20"
                    >
                      <td className="py-2 px-3 text-gray-900 dark:text-white">
                        {p.name}
                        {p.isResponsible ? ' ⭐' : ''}
                      </td>
                      <td className="py-2 px-3 text-gray-900 dark:text-white">
                        {p.experienceTitle}
                      </td>
                      <td className="py-2 px-3 text-gray-900 dark:text-white">
                        {formatDate(p.date)} {p.time ? '· ' + p.time : ''}
                      </td>
                      <td className="py-2 px-3 font-mono text-xs text-gray-900 dark:text-white">
                        {p.ticketCode}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Total */}
          <div className="mt-4 flex items-center justify-between rounded-xl bg-gray-50 p-4 dark:bg-zinc-800/50">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                {isEs ? 'Total de la compra' : 'Purchase Total'}
              </p>
              <p className="text-sm font-bold text-gray-900 dark:text-white">
                {formatPrice(totalAmount)}
              </p>
            </div>
            <span className="text-xs text-zinc-500 dark:text-zinc-400">
              {allParticipants.length} {isEs ? 'personas' : 'people'}
            </span>
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
              <Download className="h-5 w-5" />
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
              <FileText className="h-5 w-5" />
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
                ? 'Compartir todo'
                : 'Share All'}
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
