'use client'

// Botón flotante de compartir para las páginas de detalle de journey.
// Se monta UNA sola vez en pages/journeys/[slug].js (la plantilla que
// comparten todos los journeys), nunca dentro de cada componente artesanal.
//
// Posición (solo por viewport, jamás por user-agent ni táctil). UNA sola
// regla: columna derecha, apilado encima del último elemento de esa columna.
//   · ≥640 px (tabletas 768–1180 incluidas, sin MobileDock): encima del
//     flotante de WhatsApp de _app (bottom 6rem + 3.5rem de alto = techo
//     9.5rem) → bottom 10.5rem, misma columna (right 1.5rem).
//   · <640 px: encima del MobileDock (su techo ≈ 3.75rem incl. safe-area)
//     con ~1rem de margen → bottom 4.75rem + safe-area, right alineado al
//     borde del dock (1rem). Excepción por colisión real: en los journeys
//     artesanales el botón "Capítulos" (ChapterNav) ya ocupa esa esquina
//     (bottom 5.5rem, techo ~8rem); ahí el compartir se apila encima de
//     Capítulos → bottom 8.75rem + safe-area (prop aboveChapters).
// z-[45]: si el panel de capítulos (z-50) se abre, cubre este botón en vez
// de que el botón flote sobre el panel.
// Estilo cristal (sin degradado de marca: ese es solo del CTA de venta).
// Compartir se decide por capacidad (navigator.share / canShare) con
// fallback a copiar el enlace — ver lib/sharePage.js.

import { useState } from 'react'
import { Check, Share2 } from 'lucide-react'
import { sharePageOrCopy } from '@/lib/sharePage'

const COPY = {
  es: { label: 'Compartir este journey', copied: 'Enlace copiado' },
  en: { label: 'Share this journey', copied: 'Link copied' },
}

export default function ShareJourneyButton({ lang, title, path, aboveChapters = false }) {
  const copy = COPY[lang === 'en' ? 'en' : 'es']
  const [copied, setCopied] = useState(false)
  const bottomClass = aboveChapters
    ? 'bottom-[calc(8.75rem+env(safe-area-inset-bottom))] sm:bottom-[10.5rem]'
    : 'bottom-[calc(4.75rem+env(safe-area-inset-bottom))] sm:bottom-[10.5rem]'

  const handleShare = async () => {
    const url = path ? `${window.location.origin}${path}` : window.location.href
    const result = await sharePageOrCopy({
      title: title ? `${title} — Calpulli CDMX` : document.title,
      text: title ? `${title} — Calpulli CDMX` : copy.label,
      url,
    })
    if (result === 'copied') {
      setCopied(true)
      window.setTimeout(() => setCopied(false), 2500)
    }
  }

  return (
    <div className={`fixed right-4 z-[45] flex items-center sm:right-6 ${bottomClass}`}>
      {copied && (
        <span className="mr-3 whitespace-nowrap rounded-full bg-zinc-900 px-3 py-1.5 text-xs font-semibold text-white shadow-lg dark:bg-white dark:text-zinc-900">
          {copy.copied}
        </span>
      )}
      <button
        type="button"
        onClick={handleShare}
        aria-label={copy.label}
        title={copy.label}
        className="flex h-12 w-12 items-center justify-center rounded-full border border-black/5 bg-white/85 text-zinc-800 shadow-[0_8px_32px_rgba(0,0,0,0.18)] backdrop-blur-md transition-transform duration-200 hover:scale-105 focus:outline-none focus-visible:ring-2 focus-visible:ring-fuchsia-500 focus-visible:ring-offset-2 dark:border-white/10 dark:bg-zinc-900/75 dark:text-white sm:h-14 sm:w-14"
      >
        {copied ? (
          <Check className="h-5 w-5 text-emerald-500" aria-hidden />
        ) : (
          <Share2 className="h-5 w-5" aria-hidden />
        )}
      </button>
    </div>
  )
}
