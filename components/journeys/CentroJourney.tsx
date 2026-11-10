'use client'

// MIT License - Copyright (c) 2024-2026 Donovan Riaño / Calpulli CDMX - See LICENSE
import { useEffect, useMemo, useState, type CSSProperties } from 'react'
import { motion } from 'framer-motion'
import { usePrefersReducedMotion } from '@/lib/hooks/usePrefersReducedMotion'
import Image from '@/components/Image'
import Link from '@/components/Link'
import { CENTRO_JOURNEY } from '@/data/journeys/centro'
import { CENTRO_DISCOVERY_KINDS } from '@/data/journeys/centro'
import { journeyVars } from '@/lib/journeyTheme'
import { ChapterNav } from './ChapterNav'
import { JourneyDetailProvider } from './JourneyDetailContext'
import { DetailToggle } from './DetailToggle'
import { JourneyRating } from './JourneyRating'
import { useLanguage } from '@/lib/hooks/useLanguage'
import { EditorialMoment } from './EditorialMoment'
import { DiscoveryCards } from './DiscoveryCards'
import { CollapsibleSection } from './CollapsibleSection'
import { JourneyRouteGallery } from './JourneyRouteGallery'
import { JourneyRoute } from './JourneyRoute'
import { onAllJourneyDetails } from './journeyDetailBus'
import { MOMENT_TREATMENTS } from './motionConfig'
import { areAllMomentsShown, showAllMoments } from './momentsVisibility'
import { Reveal } from './Reveal'
import { InterpretationNote } from './InterpretationNote'

const TALAVERA = '#0E8C7A'
const CEMPASUCHIL = '#F2A03D'
const TERRACOTA = '#C1440E'

/**
 * Experiencia editorial del Journey "Centro Histórico — El futuro se pintó aquí".
 *
 * La presentacion vive aqui; el contenido, en data/journeys/centro.js.
 *
 * Jerarquia: fotografia protagonista, tipografia editorial, y el color con una
 * funcion definida. Talavera orienta (progreso, enlaces, activo) y Terracota
 * acentua (numeros de momento, datos). El rosa mexicano no aparece.
 */
export function CentroJourney() {
  const reduced = usePrefersReducedMotion()
  const { currentLanguage } = useLanguage()
  const isEs = currentLanguage === 'es'
  const journey = CENTRO_JOURNEY

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
          HERO. Entrada cinematografica: el titulo sube, el subtitulo
          aparece despues y la fotografia hace un zoom lento.
      ---------------------------------------------------------------- */}
        <header className="relative isolate flex min-h-[92vh] items-end overflow-hidden">
          <motion.div
            className="absolute inset-0 -z-10"
            initial={reduced ? false : { scale: 1.06 }}
            animate={reduced ? undefined : { scale: 1 }}
            transition={reduced ? { duration: 0 } : { duration: 22, ease: [0.25, 0.1, 0.25, 1] }}
          >
            <Image
              src={journey.heroImage}
              alt="Corredor peatonal de Francisco I. Madero en el Centro Histórico de la Ciudad de México."
              fill
              priority
              sizes="100vw"
              className="object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#2E2E33] via-[rgba(46,46,51,0.72)] to-[rgba(46,46,51,0.2)]" />
          </motion.div>

          <div className="mx-auto w-full max-w-5xl px-6 pb-20 pt-32">
            <motion.p
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: reduced ? 0 : 0.7, ease: [0.22, 1, 0.36, 1] }}
              className="mb-5 text-xs font-semibold uppercase tracking-[0.24em] text-white drop-shadow-[0_1px_8px_rgba(0,0,0,0.6)]"
            >
              {journey.eyebrow_es}
            </motion.p>

            <motion.h1
              initial={{ opacity: 0, y: 26 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: reduced ? 0 : 0.9, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
              className="max-w-3xl font-serif text-4xl font-black leading-[1.05] tracking-tight text-white drop-shadow-[0_2px_14px_rgba(0,0,0,0.5)] sm:text-5xl lg:text-6xl"
            >
              {journey.title_es}
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: reduced ? 0 : 0.8, delay: 0.24, ease: [0.22, 1, 0.36, 1] }}
              className="mt-6 max-w-2xl text-lg leading-relaxed text-white drop-shadow-[0_1px_10px_rgba(0,0,0,0.6)]"
            >
              {journey.subtitle_es}
            </motion.p>

            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: reduced ? 0 : 0.8, delay: 0.36 }}
              className="mt-4 max-w-2xl text-sm leading-relaxed text-white/85 drop-shadow-[0_1px_8px_rgba(0,0,0,0.6)]"
            >
              {journey.duration_note_es}
            </motion.p>
          </div>
        </header>

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
                    style={{ backgroundColor: TERRACOTA }}
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
              <EditorialMoment
                key={moment.id}
                moment={moment}
                photos={journey.photos}
                accent={TALAVERA}
                timelineTitle="El Castillo a través del tiempo"
                movement={MOMENT_TREATMENTS[moment.id]}
                collapsible
                emphasisAccent={CEMPASUCHIL}
                isEs={isEs}
              />
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
              labels={CENTRO_DISCOVERY_KINDS}
              accent={TALAVERA}
              title="Descubrimientos"
            />
          </Reveal>
        </section>

        {/* ---------------------------------------------------------------
          MÓDULO OPCIONAL: DONCELES
      ---------------------------------------------------------------- */}
        <section className="mx-auto max-w-5xl px-6 pb-16 sm:pb-20">
          <Reveal>
            <div className="overflow-hidden rounded-2xl border border-dashed border-zinc-300 dark:border-white/15">
              <div className="grid grid-cols-1 lg:grid-cols-12">
                <div className="lg:col-span-5">
                  {journey.photos[journey.donceles.image] && (
                    <Image
                      src={journey.photos[journey.donceles.image].src}
                      alt={journey.photos[journey.donceles.image].alt}
                      width={1200}
                      height={1500}
                      sizes="(max-width: 1024px) 100vw, 40vw"
                      className="h-full w-full object-cover"
                    />
                  )}
                </div>

                <div className="p-6 sm:p-8 lg:col-span-7">
                  <p
                    className="mb-2 text-xs font-semibold uppercase tracking-[0.2em]"
                    style={{ color: TERRACOTA }}
                  >
                    Módulo opcional
                  </p>
                  <h2 className="mb-3 font-serif text-2xl font-bold leading-tight text-zinc-900 dark:text-zinc-50 sm:text-3xl">
                    {journey.donceles.title}
                  </h2>
                  <p className="mb-4 text-sm font-medium text-zinc-600 dark:text-zinc-300">
                    {journey.donceles.subtitle}
                  </p>
                  <p className="mb-4 leading-relaxed text-zinc-700 dark:text-zinc-200">
                    {journey.donceles.lead}
                  </p>
                  <p className="mb-5 leading-relaxed text-zinc-600 dark:text-zinc-300">
                    {journey.donceles.body}
                  </p>

                  <ul className="mb-5 space-y-2">
                    {journey.donceles.what_to_see.map((item) => (
                      <li
                        key={item}
                        className="flex gap-2 text-sm leading-relaxed text-zinc-600 dark:text-zinc-300"
                      >
                        <span
                          className="mt-2 h-1.5 w-1.5 flex-shrink-0 rounded-full"
                          style={{ backgroundColor: TALAVERA }}
                          aria-hidden
                        />
                        {item}
                      </li>
                    ))}
                  </ul>

                  <p
                    className="rounded-xl border-l-2 bg-zinc-50 px-4 py-3 text-sm leading-relaxed text-zinc-600 dark:bg-zinc-900/40 dark:text-zinc-300"
                    style={{ borderColor: TERRACOTA }}
                  >
                    {journey.donceles.practical}
                  </p>
                </div>
              </div>
            </div>
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
          FUENTES Y VERIFICACIÓN
      ---------------------------------------------------------------- */}
        <section className="mx-auto max-w-5xl px-6 pb-24">
          <Reveal>
            <div className="grid grid-cols-1 gap-10 sm:grid-cols-2">
              <div>
                <h2 className="mb-1 text-sm font-semibold uppercase tracking-[0.18em] text-zinc-500 dark:text-zinc-400">
                  Fuentes
                </h2>
                <p className="mb-4 text-sm text-zinc-600 dark:text-zinc-300">
                  Lo que está documentado, contrastado en estas fuentes. Las leyendas y las lecturas
                  de Calpulli CDMX van señaladas como tales en el texto.
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
                  Fotografía y datos
                </h2>
                <p className="mb-4 text-sm text-zinc-600 dark:text-zinc-300">
                  Todas las imágenes provienen de Wikimedia Commons, con licencia libre verificada y
                  crédito individual bajo cada una. La ficha completa está en el repositorio.
                </p>
                <p className="text-xs leading-relaxed text-zinc-500 dark:text-zinc-400">
                  Licencias: CC0, dominio público, CC BY 4.0 y CC BY-SA 4.0. Los datos operativos
                  (horarios, direcciones) se verificaron el {journey.verified_on}: confírmalos el
                  día de la visita.
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
