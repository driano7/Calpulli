'use client'

// Bloque de cierre con compartir para PostLayout (guías, mapas, Local Picks y blog).
// Spec: goals/calpulli-commercial-launch/files/cierre-venta-secciones.md (prioridad 3).
// Leyenda acordada + botón degradado de marca: share nativo (navigator.share)
// y fallback a copiar el enlace con confirmación visual.
// El idioma sale del front matter del post (lang: 'es' | 'en'), no del UI,
// para que el HTML prerenderizado ya nazca en el idioma del contenido.
// Pendiente opcional: registrar el clic en la tabla share_events de Turso —
// hoy NO existe endpoint /api/share en el repo, así que el bloque es solo UI.

import { useState } from 'react'
import { Check, Share2 } from 'lucide-react'
import { sharePageOrCopy } from '@/lib/sharePage'

const BRAND_GRADIENT =
  'linear-gradient(135deg, #E4007C 0%, #BE1588 25%, #9F0E7F 50%, #7B2BD9 75%, #6A0568 100%)'

const COPY = {
  es: {
    legend: 'Si recomiendas una sola cosa, que sea este journey inolvidable',
    button: 'Compartir este journey',
    copied: '¡Enlace copiado!',
  },
  en: {
    legend: 'If you recommend just one thing, make it this unforgettable journey',
    button: 'Share this journey',
    copied: 'Link copied!',
  },
}

export default function ShareJourneyBlock({ lang, title }) {
  const copy = COPY[lang === 'en' ? 'en' : 'es']
  const [copied, setCopied] = useState(false)

  const handleShare = async () => {
    const result = await sharePageOrCopy({
      title: document.title,
      text: title ? `${title} — Calpulli CDMX` : copy.legend,
      url: window.location.href,
    })
    if (result === 'copied') {
      setCopied(true)
      window.setTimeout(() => setCopied(false), 2500)
    }
  }

  return (
    <section
      aria-label={copy.button}
      className="mt-2 rounded-2xl border border-fuchsia-500/25 bg-fuchsia-500/5 px-6 py-8 text-center dark:border-fuchsia-400/20 dark:bg-fuchsia-400/5"
    >
      <p className="mx-auto max-w-xl font-serif text-2xl font-bold leading-snug text-zinc-900 dark:text-white">
        {copy.legend}
      </p>
      <button
        type="button"
        onClick={handleShare}
        style={{ background: BRAND_GRADIENT }}
        className="mt-5 inline-flex items-center gap-2 rounded-full px-6 py-3 text-sm font-bold text-white shadow-lg transition-all duration-300 hover:scale-[1.03] hover:shadow-xl focus:outline-none focus-visible:ring-2 focus-visible:ring-fuchsia-500 focus-visible:ring-offset-2"
      >
        {copied ? (
          <Check className="h-4 w-4" aria-hidden />
        ) : (
          <Share2 className="h-4 w-4" aria-hidden />
        )}
        {copied ? copy.copied : copy.button}
      </button>
    </section>
  )
}
