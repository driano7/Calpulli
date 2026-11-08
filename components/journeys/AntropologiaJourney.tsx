'use client'

// MIT License - Copyright (c) 2024-2026 Donovan Riaño / Calpulli CDMX - See LICENSE
import { useEffect, useMemo, useState, type CSSProperties } from 'react'
import {} from 'framer-motion'
import { usePrefersReducedMotion } from '@/lib/hooks/usePrefersReducedMotion'
import Link from '@/components/Link'
import { ANTROPOLOGIA_JOURNEY } from '@/data/journeys/antropologia'
import { ANTROPOLOGIA_DISCOVERY_KINDS } from '@/data/journeys/antropologia'
import { journeyVars } from '@/lib/journeyTheme'
import { ChapterNav } from './ChapterNav'
import { CollapsibleSection } from './CollapsibleSection'
import { JourneyRouteGallery } from './JourneyRouteGallery'
import { JourneyRoute } from './JourneyRoute'
import { onAllJourneyDetails } from './journeyDetailBus'
import { areAllMomentsShown, showAllMoments } from './momentsVisibility'
import { JourneyDetailProvider } from './JourneyDetailContext'
import { DetailToggle } from './DetailToggle'
import { JourneyRating } from './JourneyRating'
import { useLanguage } from '@/lib/hooks/useLanguage'
import { EditorialHero } from './EditorialHero'
import { EditorialMoment } from './EditorialMoment'
import { ChapterDivider } from './ChapterDivider'
import { DiscoveryCards } from './DiscoveryCards'
import { Reveal } from './Reveal'
import { MOMENT_TREATMENTS } from './motionConfig'

const TALAVERA = '#0E8C7A'
const CEMPASUCHIL = '#F2A03D'

/**
 * Experiencia editorial del Journey "Museo Nacional de Antropología".
 *
 * La presentacion vive aqui; el contenido, en data/journeys/antropologia.js.
 *
 * El movimiento se coreografia por momento: cada bloque declara su
 * composicion y su tratamiento en components/journeys/motionConfig.ts,indexado
 * por id. Nada se decide por el titulo de la pieza.
 */
export function AntropologiaJourney() {
  const reduced = usePrefersReducedMotion()
  const { currentLanguage } = useLanguage()
  const isEs = currentLanguage === 'es'
  const journey = ANTROPOLOGIA_JOURNEY

  const chapters = useMemo(
    () =>
      journey.moments.map((moment) => ({
        id: moment.id,
        // El indice lateral de capitulos tambien va en el idioma de la pagina.
        title: (isEs ? moment.title : moment.title_en) || moment.title,
        number: moment.number,
      })),
    [journey.moments, isEs]
  )

  // Capitulos: los momentos que abren un grupo llevan un separador antes.
  const chapterStarts = useMemo(
    () => new Set(['mna-patio', 'mna-calendario', 'mna-juego-pelota', 'mna-xolo']),
    []
  )

  const detailIds = journey.moments.map((m) => m.id)
  const hiddenCount = journey.moments.filter((m) => m.featured !== true).length
  // Cuando el visitante despliega TODO, la ruta deja de ser galeria y se
  // lee como el resto: una lista vertical que aparece al hacer scroll.
  const [everythingOpen, setEverythingOpen] = useState(false)
  // Los momentos vienen condensados: solo los 3 clave, con un boton para
  // ver el resto. Una vez pulsado, no se vuelve a plegar hasta recargar.
  const [showAll, setShowAll] = useState(areAllMomentsShown())
  useEffect(() => onAllJourneyDetails(setEverythingOpen), [])

  return (
    <JourneyDetailProvider ids={detailIds}>
      <div style={journeyVars(journey.accents) as CSSProperties}>
        <ChapterNav
          chapters={chapters}
          accent={TALAVERA}
          title={journey.title_es}
          header={<DetailToggle accent={TALAVERA} variant="inline" isEs={isEs} />}
        />

        <EditorialHero
          title={journey.title_es}
          titleLines={journey.heroTitleLines}
          subtitle={journey.subtitle_es}
          eyebrow={journey.eyebrow_es}
          meta={journey.meta}
          image={journey.heroImage}
          imageAlt="Exterior del Museo Nacional de Antropología en 1974."
          chapters={chapters.length}
          accent={TALAVERA}
          emphasisAccent={CEMPASUCHIL}
        />

        {/* ---------------------------------------------------------------
          INTRODUCCION
      ---------------------------------------------------------------- */}
        <section className="mx-auto max-w-5xl px-6 py-16 sm:py-24">
          <Reveal>
            <p className="mx-auto max-w-3xl text-center font-serif text-xl leading-relaxed text-zinc-800 dark:text-zinc-100 sm:text-2xl">
              {journey.intro_es}
            </p>
          </Reveal>

          <Reveal delay={0.08} className="mt-12">
            <ul className="mx-auto grid max-w-3xl gap-3 sm:grid-cols-1">
              {journey.notes.map((note) => (
                <li
                  key={note}
                  className="flex gap-3 rounded-xl border border-zinc-200/70 bg-zinc-50/70 px-4 py-3 text-sm leading-relaxed text-zinc-700 dark:border-white/10 dark:bg-zinc-900/30 dark:text-zinc-300"
                >
                  <span
                    className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full"
                    style={{ backgroundColor: CEMPASUCHIL }}
                    aria-hidden
                  />
                  {note}
                </li>
              ))}
            </ul>
          </Reveal>
        </section>

        {/* ---------------------------------------------------------------
          LOS DIEZ MOMENTOS, con separador entre capitulos
      ---------------------------------------------------------------- */}
        <div className="mx-auto max-w-6xl px-6">
          {journey.moments
            .filter((moment) => showAll || moment.featured === true || journey.moments.length <= 3)
            .map((moment) => (
              <div key={moment.id}>
                {chapterStarts.has(moment.id) && (
                  <ChapterDivider
                    chapter={moment.number}
                    accent={TALAVERA}
                    emphasisAccent={CEMPASUCHIL}
                  />
                )}

                <EditorialMoment
                  moment={moment}
                  photos={journey.photos}
                  accent={TALAVERA}
                  timelineTitle="El Castillo a través del tiempo"
                  movement={MOMENT_TREATMENTS[moment.id]}
                  collapsible
                  emphasisAccent={CEMPASUCHIL}
                  isEs={isEs}
                />
              </div>
            ))}
        </div>

        {!showAll && hiddenCount > 0 && (
          <div className="mt-10 flex flex-col items-center gap-3">
            <button
              type="button"
              onClick={() => {
                showAllMoments()
                setShowAll(true)
              }}
              className="inline-flex items-center gap-2 rounded-full border border-[var(--j1-soft)] bg-white/70 px-6 py-3 text-sm font-semibold text-[var(--j1)] transition-colors hover:bg-[var(--j1-softer)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
              style={{ ['--tw-ring-color' as string]: '#0E8C7A' }}
            >
              {isEs
                ? `Ver los ${hiddenCount} momentos mas`
                : `See the other ${hiddenCount} moments`}
              <svg
                viewBox="0 0 24 24"
                className="h-4 w-4"
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
                aria-hidden
              >
                <path d="M5 12h14M13 6l6 6-6 6" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
            <p className="text-xs text-zinc-400">
              {isEs
                ? 'Al verlos, ya no se pueden volver a plegar sin recargar la pagina.'
                : 'Once shown, they cannot be folded back without reloading the page.'}
            </p>
          </div>
        )}

        {/* ---------------------------------------------------------------
          HALLAZGOS
      ---------------------------------------------------------------- */}
        <section className="mx-auto max-w-5xl px-6 py-16 sm:py-24">
          <Reveal>
            <DiscoveryCards
              entries={journey.discoveries}
              labels={ANTROPOLOGIA_DISCOVERY_KINDS}
              accent={TALAVERA}
              title="Lo que se observa, lo que se documenta y lo que falta"
            />
          </Reveal>
        </section>

        {/* ---------------------------------------------------------------
          FUENTES
      ---------------------------------------------------------------- */}
        <section className="mx-auto max-w-5xl px-6 pb-24">
          <Reveal>
            <div className="grid grid-cols-1 gap-10 sm:grid-cols-2">
              <div>
                <h2 className="mb-1 text-sm font-semibold uppercase tracking-[0.18em] text-zinc-500 dark:text-zinc-400">
                  Fuentes
                </h2>
                <p className="mb-4 text-sm text-zinc-600 dark:text-zinc-300">
                  Cada bloque separa lo que se observa de frente, lo que documentan las fuentes y la
                  interpretación. Lo que no está verificado aparece marcado como pendiente, no
                  rellenado.
                </p>
                <ul className="space-y-2">
                  {journey.sources.map((source) => (
                    <li key={source.id}>
                      <a
                        href={source.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm underline underline-offset-4 hover:text-[#0A6E60] dark:hover:text-[#7FD4C6]"
                      >
                        {source.label}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>

              <div>
                <h2 className="mb-1 text-sm font-semibold uppercase tracking-[0.18em] text-zinc-500 dark:text-zinc-400">
                  Fotografía
                </h2>
                <p className="mb-4 text-sm text-zinc-600 dark:text-zinc-300">
                  Las nueve imágenes de este Journey provienen de Wikimedia Commons, con licencia
                  libre verificada y crédito individual bajo cada una. La ficha completa está en el
                  repositorio.
                </p>
                <p className="text-xs leading-relaxed text-zinc-500 dark:text-zinc-400">
                  Datos operativos verificados el {journey.verified_on}. Las piezas marcadas como
                  recurso pendiente no tienen imagen verificada: el sistema muestra el tratamiento
                  de reserva y no se publica nada sobre ellas.
                </p>
              </div>
            </div>
          </Reveal>

          <Reveal
            delay={0.06}
            className="mt-14 border-t border-zinc-200/70 pt-8 dark:border-white/10"
          >
            <Link
              href="/journeys"
              className="inline-flex items-center gap-2 text-sm font-semibold"
              style={{ color: TALAVERA }}
            >
              <svg
                viewBox="0 0 24 24"
                className="h-4 w-4"
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
                aria-hidden
              >
                <path d="M19 12H5M11 6l-6 6 6 6" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              Volver a los Journeys
            </Link>
          </Reveal>
        </section>

        {/* El support banner va completo: sin dropdown y sin preview. */}
      </div>
      <DetailToggle
        accent={TALAVERA}
        price={journey.price}
        isEs={isEs}
        journeySlug={journey.slug}
      />
    </JourneyDetailProvider>
  )
}
