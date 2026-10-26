'use client'

// MIT License - Copyright (c) 2024-2026 Donovan Riaño / Calpulli CDMX - See LICENSE
import Link from '@/components/Link'
import { PageSEO } from '@/components/SEO'
import { JOURNEYS, pickLocalized } from '@/data/journeysData'
import { journeyVars } from '@/lib/journeyTheme'
import { useLanguage } from '@/lib/hooks/useLanguage'
import { useCartStore } from '@/lib/store/useCartStore'
import { useRouter } from 'next/router'
import { Reveal } from '@/components/journeys/Reveal'
import { ImageReveal } from '@/components/journeys/ImageReveal'
import { Sparkles } from 'lucide-react'

/**
 * Preview de foto de un journey en el indice.
 *
 * Si el journey todavia no tiene una fotografia verificada, se muestra el
 * tratamiento de reserva: nunca una imagen inventada.
 */
function JourneyPreview({ journey, title, isEs }) {
  if (journey.heroImage) {
    return (
      <ImageReveal
        src={journey.heroImage}
        alt={title}
        className="w-full rounded-xl"
        ratio="3 / 2"
        treatment="mask-up"
        contain
        containBackground="rgba(0,0,0,0.04)"
      />
    )
  }

  return (
    <div
      className="flex aspect-[3/2] w-full items-center justify-center rounded-xl bg-[var(--j1-softer)]"
      aria-hidden
    >
      <span className="px-6 text-center text-[11px] uppercase tracking-[0.18em] text-zinc-500 dark:text-zinc-400">
        {isEs ? 'Fotografía en preparación' : 'Photography in progress'}
      </span>
    </div>
  )
}

export default function JourneysIndex() {
  const { currentLanguage, t } = useLanguage()
  const isEs = currentLanguage === 'es'
  const { addItem, clearCart } = useCartStore()
  const router = useRouter()

  const handleReserve = (journey) => {
    // Limpiar carrito primero: solo quieres este journey, nada más
    clearCart()
    const title = pickLocalized(journey.title_es, journey.title_en, isEs)
    addItem({
      experienceId: journey.id,
      title,
      imageUrl: journey.heroImage,
      price: journey.price,
      currency: 'MXN',
      location: 'Ciudad de México',
      date: null,
      time: null,
      peopleCount: 1,
      maxGuests: 10,
    })
    router.push('/checkout')
  }

  return (
    <>
      <PageSEO
        title="Journeys — Calpulli CDMX"
        description={
          isEs
            ? 'Seis journeys editoriales por la Ciudad de México: Luchas, Chapultepec, Jamaica, Centro, Roma-Condesa y Antropología.'
            : 'Six editorial journeys through Mexico City: Luchas, Chapultepec, Jamaica, Centro, Roma-Condesa and Antropología.'
        }
      />

      {/* Hero editorial del índice */}
      <header className="mx-auto max-w-5xl px-6 pb-12 pt-24 sm:pt-32">
        <Reveal once={false}>
          <p className="mb-4 text-sm font-semibold uppercase tracking-[0.2em] text-[#C1440E]">
            Journeys
          </p>
          <h1 className="max-w-3xl text-4xl font-black leading-[1.05] tracking-tight text-zinc-900 dark:text-zinc-50 sm:text-5xl lg:text-6xl">
            {isEs ? 'Seis formas de caminar la Ciudad de México' : 'Six ways to walk Mexico City'}
          </h1>
          <p className="mt-5 max-w-2xl text-lg leading-relaxed text-zinc-600 dark:text-zinc-300">
            {isEs
              ? 'Un archivo editorial y cultural: cada Journey se lee, se observa y se recorre despacio.'
              : 'An editorial and cultural archive: each Journey is read, observed and walked slowly.'}
          </p>
        </Reveal>
      </header>

      {/* ---------------------------------------------------------------
          BANNER. El bloque con degradado y desenfoque que abria las
          experiencias: misma presencia, texto del mundo de los journeys.
      ---------------------------------------------------------------- */}
      <section className="mx-auto max-w-5xl px-6 pb-16">
        <Reveal once={false}>
          <div
            className="relative overflow-hidden rounded-3xl px-6 py-7 text-white shadow-xl sm:px-8 sm:py-8"
            style={{
              background:
                'linear-gradient(135deg, #DE1D8D 0%, #BE1588 25%, #9F0E7F 50%, #7B2BD9 75%, #6A0568 100%)',
            }}
          >
            <div className="relative mx-auto flex w-full max-w-3xl flex-col items-center gap-3 text-center">
              <span className="flex h-12 w-12 items-center justify-center rounded-full bg-white/15 backdrop-blur-sm">
                <Sparkles className="h-6 w-6 text-white" aria-hidden />
              </span>
              <h2 className="text-2xl font-black tracking-tight text-white sm:text-3xl">
                {isEs ? '¿Quieres tu propio Journey?' : 'Want your own Journey?'}
              </h2>
              <p className="max-w-2xl text-sm font-medium leading-relaxed text-white/90 sm:text-base">
                {isEs
                  ? 'Estos seis journeys son el archivo editorial. Si buscas algo distinto, te armamos un recorrido a la medida: barrio, ritmo, duración y a qué hora quieres que la ciudad te cuente lo que sabe.'
                  : 'These six journeys are the editorial archive. If you are looking for something else, we build a route to measure: neighborhood, pace, duration and the hour you want the city to tell you what it knows.'}
              </p>
              <a
                href="https://wa.me/525512291607?text=Hola%20Calpulli%20CDMX%2C%20quiero%20un%20Journey%20a%20la%20medida"
                target="_blank"
                rel="noopener noreferrer"
                className="mt-1 inline-flex items-center gap-2 rounded-full bg-white px-6 py-3 text-sm font-bold text-[#9F0E7F] shadow-lg transition hover:bg-white/90"
              >
                {isEs ? 'Pedir un Journey a la medida' : 'Request a custom Journey'}
              </a>
              <p className="text-xs text-white/70">
                {isEs
                  ? 'Te respondemos con propuesta, duración y precio.'
                  : 'We reply with a proposal, duration and price.'}
              </p>
            </div>
          </div>
        </Reveal>
      </section>

      {/* Lista editorial: numero, texto, foto a la derecha y precio */}
      <section className="mx-auto max-w-5xl px-6 pb-28">
        <div className="border-t border-zinc-200/70 dark:border-white/10">
          {JOURNEYS.map((journey, index) => {
            const title = pickLocalized(journey.title_es, journey.title_en, isEs)
            const subtitle =
              pickLocalized(journey.subtitle_es, journey.subtitle_en, isEs) ||
              pickLocalized(journey.intro_es, journey.intro_en, isEs)
            const price = journey.price

            return (
              <Reveal key={journey.id} delay={0.04} className="w-full" once={false}>
                <Link
                  href={`/journeys/${journey.slug}`}
                  style={journeyVars(journey.accents)}
                  className="group grid grid-cols-1 items-center gap-6 border-b border-zinc-200/70 py-10 transition-colors hover:bg-[var(--j1-softer)] dark:border-white/10 sm:grid-cols-[auto_1fr_200px] sm:gap-8 lg:grid-cols-[auto_1fr_280px] lg:gap-10"
                >
                  <span
                    className="hidden text-3xl font-black leading-none text-[var(--j1)] sm:block sm:text-4xl"
                    aria-hidden
                  >
                    {String(index + 1).padStart(2, '0')}
                  </span>

                  {/* Titulo y breve resumen */}
                  <span className="min-w-0">
                    <span className="mb-1 block text-xs font-semibold uppercase tracking-[0.18em] text-[var(--j1)] sm:hidden">
                      {String(index + 1).padStart(2, '0')}
                    </span>
                    <span className="block text-2xl font-bold leading-tight text-zinc-900 transition-transform duration-300 group-hover:translate-x-1 dark:text-zinc-50 sm:text-3xl">
                      {title}
                    </span>
                    <span className="mt-2 block max-w-xl text-sm leading-relaxed text-zinc-500 dark:text-zinc-400">
                      {subtitle ??
                        (isEs
                          ? 'El contenido editorial de este journey se publica proximamente.'
                          : 'The editorial content of this journey is published progressively.')}
                    </span>
                    {price ? (
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          handleReserve(journey)
                        }}
                        className="mt-3 inline-flex items-center justify-center rounded-full border border-[#C1440E]/30 bg-[#C1440E] px-4 py-2 text-xs font-semibold tabular-nums text-white shadow-sm transition-all hover:bg-[#9A3207] hover:shadow-md"
                      >
                        {isEs ? `Reservar por $${price} mxn` : `Reserve for $${price} mxn`}
                      </button>
                    ) : null}
                  </span>

                  {/* Preview de la foto, a la derecha */}
                  <span className="order-last block overflow-hidden rounded-xl">
                    <JourneyPreview journey={journey} title={title} isEs={isEs} />
                  </span>
                </Link>
              </Reveal>
            )
          })}
        </div>

        <Reveal delay={0.1} className="mt-14" once={false}>
          <p className="text-sm italic text-zinc-500 dark:text-zinc-400">
            {isEs
              ? 'Cada Journey abre con su propia entrada editorial. El contenido narrativo, las fotografías y la paleta de cada uno se publican progresivamente. El precio es de referencia.'
              : 'Each Journey opens with its own editorial entry. Narrative content, photography and each palette are published progressively. The price is for reference only.'}
          </p>
        </Reveal>
      </section>
    </>
  )
}
