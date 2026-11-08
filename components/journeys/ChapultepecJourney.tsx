'use client'

// MIT License - Copyright (c) 2024-2026 Donovan Riaño / Calpulli CDMX - See LICENSE
import { useEffect, useMemo, useState, type CSSProperties } from 'react'
import { motion } from 'framer-motion'
import { usePrefersReducedMotion } from '@/lib/hooks/usePrefersReducedMotion'
import Image from '@/components/Image'
import Link from '@/components/Link'
import { CHAPULTEPEC_JOURNEY } from '@/data/journeys/chapultepec'
import { JOURNEY_NEUTRALS, journeyVars } from '@/lib/journeyTheme'
import { ChapterNav } from './ChapterNav'
import { JourneyDetailProvider } from './JourneyDetailContext'
import { DetailToggle } from './DetailToggle'
import { JourneyRating } from './JourneyRating'
import { useLanguage } from '@/lib/hooks/useLanguage'
import { EditorialHero } from './EditorialHero'
import { ChapterDivider } from './ChapterDivider'
import { CollapsibleSection } from './CollapsibleSection'
import { JourneyRouteGallery } from './JourneyRouteGallery'
import { JourneyRoute } from './JourneyRoute'
import { onAllJourneyDetails } from './journeyDetailBus'
import { areAllMomentsShown, showAllMoments } from './momentsVisibility'
import { EditorialMoment } from './EditorialMoment'
import { MOMENT_TREATMENTS } from './motionConfig'
import { DiscoveryCards } from './DiscoveryCards'
import { DISCOVERY_KINDS } from '@/data/journeys/chapultepec'
import { Reveal } from './Reveal'

const TALAVERA = '#0E8C7A'
const CEMPASUCHIL = '#F2A03D'

/**
 * Experiencia editorial del Journey "Chapultepec — De los Dioses a Emperadores".
 *
 * La presentacion vive aqui; el contenido, en data/journeys/chapultepec.js.
 *
 * Jerarquia: fotografia protagonista, tipografia editorial, y el color con
 * una funcion definida — talavera orienta (progreso, navegacion, enlaces) y
 * cempasuchil Lowry acentua (fechas, datos). El rosa mexicano no aparece.
 */
export function ChapultepecJourney() {
  const reduced = usePrefersReducedMotion()
  const { currentLanguage } = useLanguage()
  const isEs = currentLanguage === 'es'
  const journey = CHAPULTEPEC_JOURNEY

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

        {/* ---------------------------------------------------------------
          HERO. Componente compartido: la foto se destapa con una mascara,
          el titular entra linea a linea y el subtitulo y los metadatos
          siguen escalonados. Abajo, el indicador de avance editorial.
      ---------------------------------------------------------------- */}
        <EditorialHero
          title={journey.title_es}
          titleLines={['Chapultepec', 'De los Dioses a Emperadores']}
          subtitle={journey.subtitle_es}
          eyebrow={journey.eyebrow_es}
          meta={[
            isEs ? '6 momentos' : '6 moments',
            isEs ? 'Talavera y Cempasuchil' : 'Talavera and Cempasuchil',
            isEs ? 'Precio de referencia: $100 MXN' : 'Reference price: $100 MXN',
          ]}
          image={journey.heroImage}
          imageAlt="Vista aerea del Castillo de Chapultepec dentro del cerco de arboles del bosque."
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
          LOS SEIS MOMENTOS
      ---------------------------------------------------------------- */}
        <div className="mx-auto max-w-6xl px-6">
          {journey.moments
            .filter((moment) => showAll || moment.featured === true || journey.moments.length <= 3)
            .map((moment) => (
              <div key={moment.id}>
                {moment.id === 'castillo' && (
                  <ChapterDivider
                    chapter={moment.number}
                    label="El capítulo mayor"
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
          HALLAZGOS: HISTORIA DOCUMENTADA / DATO CURIOSO / TRADICION
      ---------------------------------------------------------------- */}
        <section className="mx-auto max-w-5xl px-6 py-16 sm:py-24">
          <Reveal>
            <DiscoveryCards
              entries={journey.discoveries}
              labels={DISCOVERY_KINDS}
              accent={TALAVERA}
              title="Descubrimientos"
            />
          </Reveal>
        </section>

        {/* ---------------------------------------------------------------
          RUTA
      ---------------------------------------------------------------- */}
        <section className="mx-auto max-w-5xl px-6 pb-16 sm:pb-24">
          <CollapsibleSection
            title={isEs ? 'La ruta' : 'The route'}
            subtitle={
              isEs
                ? 'El hilo de barrios, con los minutos a pie entre parada y parada.'
                : 'The thread of neighbourhoods, with the walking minutes between stops.'
            }
            accent={TALAVERA}
            preview={
              isEs
                ? `${journey.route.length} paradas · ~${journey.route.reduce(
                    (a, r) => a + (r.walk || 0),
                    0
                  )} min a pie`
                : `${journey.route.length} stops · ~${journey.route.reduce(
                    (a, r) => a + (r.walk || 0),
                    0
                  )} min walking`
            }
          >
            {everythingOpen ? (
              <JourneyRoute
                legs={journey.route}
                accent={TALAVERA}
                title=""
                totalLabel={isEs ? 'Recorrido de referencia' : 'Reference route'}
                totalNote={`${isEs ? 'minimo' : 'minimum'} ${journey.durations?.minimo || ''} · ${
                  isEs ? 'realista' : 'realistic'
                } ${journey.durations?.realista || ''}`}
              />
            ) : (
              <JourneyRouteGallery
                stops={journey.route}
                accent={TALAVERA}
                emphasisAccent={CEMPASUCHIL}
                isEs={isEs}
              />
            )}
          </CollapsibleSection>
        </section>

        {/* ---------------------------------------------------------------
          FUENTES Y CREDITOS
      ---------------------------------------------------------------- */}
        <section className="mx-auto max-w-5xl px-6 pb-24">
          <Reveal>
            <div className="grid grid-cols-1 gap-10 sm:grid-cols-2">
              <div>
                <h2 className="mb-1 text-sm font-semibold uppercase tracking-[0.18em] text-zinc-500 dark:text-zinc-400">
                  Fuentes
                </h2>
                <p className="mb-4 text-sm text-zinc-600 dark:text-zinc-300">
                  Lo que está documentado, contrastado en estas fuentes. Las leyendas van señaladas
                  como tales en el texto.
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
                  Todas las imágenes provienen de Wikimedia Commons, con licencia libre verificada y
                  crédito individual bajo cada una. La ficha completa está en el repositorio.
                </p>
                <p className="text-xs leading-relaxed text-zinc-500 dark:text-zinc-400">
                  Licencias: CC0, CC BY 4.0 y CC BY-SA 4.0. El uso de imágenes CC BY-SA exige
                  mantener la misma licencia en las obras derivadas: las fichas de autor y licencia
                  están en{' '}
                  <code className="break-all text-[11px]">
                    public/static/images/journeys/chapultepec/CREDITS.md
                  </code>
                  .
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
