'use client'

// MIT License - Copyright (c) 2024-2026 Donovan Riaño / Calpulli CDMX - See LICENSE
// Boton flotante de WhatsApp. Sustituye al antiguo asistente: no hay chatbot,
// solo abre la conversacion con el numero oficial y un mensaje contextual.

import { useRouter } from 'next/router'
import { motion, useReducedMotion } from 'framer-motion'
import { useLanguage } from '@/lib/hooks/useLanguage'
import WhatsAppIcon from '@/components/social-icons/whatsapp.svg'
import { buildWhatsAppUrl, getWhatsAppMessage } from '@/lib/whatsapp'

export default function WhatsAppButton() {
  const router = useRouter()
  const { currentLanguage } = useLanguage()
  const reduced = useReducedMotion()
  const isEs = currentLanguage !== 'en'

  // asPath trae la ruta real; pathname devuelve el patron en rutas dinamicas
  // (/journeys/[slug]) y el mensaje perderia el journey concreto.
  const path = (router.asPath || router.pathname || '/').split('?')[0]
  const href = buildWhatsAppUrl(getWhatsAppMessage(path, isEs))
  const label = isEs ? 'Escríbenos por WhatsApp' : 'Message us on WhatsApp'

  return (
    <motion.a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={label}
      title={label}
      initial={reduced ? false : { scale: 0.6, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      whileHover={reduced ? undefined : { scale: 1.08 }}
      whileTap={reduced ? undefined : { scale: 0.94 }}
      transition={{ type: 'spring', stiffness: 260, damping: 18 }}
      className="fixed bottom-[calc(4rem+env(safe-area-inset-bottom))] right-4 z-[100] flex h-14 w-14 items-center justify-center rounded-full bg-[#25D366] text-white shadow-[0_8px_32px_rgba(37,211,102,0.45)] transition-shadow hover:shadow-[0_10px_40px_rgba(37,211,102,0.65)] sm:right-6 sm:bottom-4"
    >
      {!reduced && (
        <motion.span
          aria-hidden
          className="pointer-events-none absolute inset-0 rounded-full border-2 border-[#25D366]"
          animate={{ scale: [1, 1.28], opacity: [0.55, 0] }}
          transition={{ duration: 2.2, repeat: Infinity, ease: 'easeOut' }}
        />
      )}
      <WhatsAppIcon className="relative h-7 w-7 fill-current" aria-hidden />
    </motion.a>
  )
}
