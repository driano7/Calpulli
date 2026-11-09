'use client'

// MIT License - Copyright (c) 2024-2026 Donovan Riaño / Calpulli CDMX - See LICENSE
import { useMemo, type CSSProperties } from 'react'
import Link from '@/components/Link'
import { useLanguage } from '@/lib/hooks/useLanguage'
import { JAMAICA_JOURNEY, JAMAICA_DISCOVERY_KINDS, jamaicaMoments } from '@/data/journeys/jamaica'
import { journeyVars } from '@/lib/journeyTheme'
import { ChapterNav } from './ChapterNav'
import { ChapterDivider } from './ChapterDivider'
import { DiscoveryCards } from './DiscoveryCards'
import { EditorialHero } from './EditorialHero'
import { EditorialMoment } from './EditorialMoment'
import { JamaicaBouquet } from './JamaicaBouquet'
import { JourneyDetailProvider } from './JourneyDetailContext'
import { DetailToggle } from './DetailToggle'
import { Reveal } from './Reveal'
import { MOMENT_TREATMENTS } from './motionConfig'

const TALAVERA = '#0E8C7A'
const TERRACOTA = '#C1440E'

/**
 * Experiencia editorial del Journey "Jamaica: mirar más allá de las flores".
 *
 * El contenido vive en data/journeys/jamaica.js; aquí está la presentación.
 *
 * Hay cinco momentos editoriales y un sexto participativo. El sexto no es un
 * EditorialMoment: es el bloque JamaicaBouquet, porque no es un texto que se
 * lee sino una interacción local, opcional y no persistida.
 *
 * El movimiento se coreografía por momento con el catálogo de
 * components/journeys/motionConfig.ts, indexado por id.
 */
export function JamaicaJourney() {
  const { currentLanguage } = useLanguage()
  const isEs = currentLanguage === 'es'
  const journey = JAMAICA_JOURNEY
  const L = (es: string, en: string) => (isEs ? es : en)

  const momentos = useMemo(() => jamaicaMoments(), [])
  const editoriales = momentos.filter((m) => m.number < 6)

  const chapters = useMemo(
    () =>
      momentos.map((moment) => ({
        id: moment.id,
        title: (isEs ? moment.title : moment.title_en) || moment.title,
        number: moment.number,
      })),
    [momentos, isEs]
  )

  const detailIds = useMemo(() => editoriales.map((moment) => moment.id), [editoriales])

  return (
    <JourneyDetailProvider ids={detailIds}>
      <div style={journeyVars(journey.accents) as CSSProperties}>
        <ChapterNav chapters={chapters} accent={TALAVERA} title={journey.title_es} />

        <EditorialHero
          title={journey.title_es}
          titleLines={journey.heroTitleLines}
          subtitle={L(journey.subtitle_es, journey.subtitle_en)}
          eyebrow={L(journey.eyebrow_es, journey.eyebrow_en)}
          meta={[L('5 momentos y un taller', '5 moments and one workshop')]}
          image={journey.heroImage}
          imageAlt="Muro de ramos de flores cortadas en un puesto del Mercado de Jamaica."
          chapters={chapters.length}
          accent={TALAVERA}
          emphasisAccent={TERRACOTA}
        />

        {/* ---------------------------------------------------------------
            INTRODUCCION
        ---------------------------------------------------------------- */}
        <section className="mx-auto max-w-5xl px-6 py-16 sm:py-20">
          <Reveal>
            <p className="mx-auto max-w-3xl text-center font-serif text-xl leading-relaxed text-zinc-800 dark:text-zinc-100 sm:text-2xl">
              {L(journey.intro_es, journey.intro_en)}
            </p>
          </Reveal>

          <Reveal delay={0.08} className="mt-12">
            <ul className="mx-auto grid max-w-3xl gap-3">
              {journey.notes.map((note, index) => (
                <li
                  key={index}
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
            LOS CINCO MOMENTOS EDITORIALES
        ---------------------------------------------------------------- */}
        <div className="mx-auto max-w-6xl px-6">
          {editoriales.map((moment) => (
            <div key={moment.id}>
              <ChapterDivider
                chapter={moment.number}
                accent={TALAVERA}
                emphasisAccent={TERRACOTA}
              />
              <EditorialMoment
                moment={moment}
                photos={journey.photos}
                accent={TALAVERA}
                timelineTitle=""
                movement={MOMENT_TREATMENTS[moment.id]}
                collapsible
                emphasisAccent={TERRACOTA}
                isEs={isEs}
              />
            </div>
          ))}
        </div>

        {/* ---------------------------------------------------------------
            MOMENTO 06: EL RAMO
            ----------------------------------------------------------------
            Cabecera editorial a mano (el momento no lleva foto: no hay
            imagen verificada de una sesion del taller) y el bloque
            participativo.
        ---------------------------------------------------------------- */}
        <div className="mx-auto max-w-6xl px-6">
          <ChapterDivider chapter={6} accent={TALAVERA} emphasisAccent={TERRACOTA} />
          <div className="mx-auto max-w-4xl">
            <Reveal>
              <p
                className="mb-3 text-xs font-semibold uppercase tracking-[0.2em]"
                style={{ color: TALAVERA }}
              >
                {L('Un ramo para recordar', 'A bouquet to remember with')}
              </p>
              <h2
                id="jamaica-6-ramo-title"
                className="mb-4 font-serif text-3xl font-bold leading-tight tracking-tight text-zinc-900 dark:text-zinc-50 sm:text-4xl"
              >
                {L('Un ramo para recordar', 'A bouquet to remember with')}
              </h2>
              <p className="font-serif text-xl italic leading-relaxed text-zinc-700 dark:text-zinc-200">
                {L(
                  'La última parte del recorrido no es una foto: es una mano.',
                  'The last part of the route is not a photograph: it is a hand.'
                )}
              </p>
            </Reveal>

            <div className="mt-10">
              <JamaicaBouquet />
            </div>
          </div>
        </div>

        {/* ---------------------------------------------------------------
            HALLAZGOS
        ---------------------------------------------------------------- */}
        <section className="mx-auto max-w-5xl px-6 py-16 sm:py-24">
          <Reveal>
            <DiscoveryCards
              entries={journey.discoveries}
              labels={JAMAICA_DISCOVERY_KINDS}
              accent={TALAVERA}
              isEs={isEs}
              title={L(
                'Lo que se observa, lo que se documenta y lo que falta',
                'What is observed, what is documented and what is missing'
              )}
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
                  {L('Fuentes', 'Sources')}
                </h2>
                <p className="mb-4 text-sm text-zinc-600 dark:text-zinc-300">
                  {L(
                    'La fecha de inauguración del 23 de septiembre de 1957 está confirmada por cuatro fuentes independientes. Los datos de las naves, los puestos y las variedades de flores proceden de la información oficial de la ciudad y de la ficha de la UNAM.',
                    'The opening date of September 23, 1957 is confirmed by four independent sources. The data on the naves, the stalls and the flower varieties comes from official city information and the UNAM fact sheet.'
                  )}
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
                        {L(source.label_es, source.label_en)}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>

              <div>
                <h2 className="mb-1 text-sm font-semibold uppercase tracking-[0.18em] text-zinc-500 dark:text-zinc-400">
                  {L('Fotografía', 'Photography')}
                </h2>
                <p className="mb-4 text-sm text-zinc-600 dark:text-zinc-300">
                  {L(
                    'Las diez imágenes de este Journey provienen de Wikimedia Commons, con licencia libre verificada. Tres son fotografías de archivo: el mercado en construcción en 1957 y una ceremonia de abanderamiento en 1962. Son imágenes del mercado, no imágenes de una visita de Amaxing.',
                    'The ten images in this Journey come from Wikimedia Commons, with a verified free licence. Three are archive photographs: the market under construction in 1957 and a flag-raising ceremony in 1962. They are images of the market, not images of an Amaxing visit.'
                  )}
                </p>
                <p className="text-xs leading-relaxed text-zinc-500 dark:text-zinc-400">
                  {L(
                    `Datos verificados el ${journey.verified_on}. Los puntos marcados como pendientes no se han verificado: se publican como pendientes, no rellenados.`,
                    `Data verified on ${journey.verified_on}. The points marked as pending have not been verified: they are published as pending, not filled in.`
                  )}
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
              {L('Volver a los Journeys', 'Back to Journeys')}
            </Link>
          </Reveal>
        </section>


        <DetailToggle
          accent={TALAVERA}
          price={journey.price}
          isEs={isEs}
          journeySlug={journey.slug}
        />
      </div>
    </JourneyDetailProvider>
  )
}
