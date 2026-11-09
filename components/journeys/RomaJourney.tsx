'use client'

// MIT License - Copyright (c) 2024-2026 Donovan Riaño / Calpulli CDMX - See LICENSE
import { useMemo, useState, type CSSProperties } from 'react'
import Link from '@/components/Link'
import { useLanguage } from '@/lib/hooks/useLanguage'
import { ROMA_JOURNEY, ROMA_COMIDA, ROMA_DISCOVERY_KINDS } from '@/data/journeys/roma'
import { journeyVars } from '@/lib/journeyTheme'
import { ChapterNav } from './ChapterNav'
import { CollapsibleSection } from './CollapsibleSection'
import { JourneyRouteGallery } from './JourneyRouteGallery'
import { ChapterDivider } from './ChapterDivider'
import { DiscoveryCards } from './DiscoveryCards'
import { EditorialHero } from './EditorialHero'
import { EditorialMoment } from './EditorialMoment'
import { DetailToggle } from './DetailToggle'
import { JourneyDetailProvider } from './JourneyDetailContext'
import { Reveal } from './Reveal'
import { MOMENT_TREATMENTS } from './motionConfig'

const TERRACOTA = '#C1440E'
const CEMPASUCHIL = '#F2A03D'

/**
 * Experiencia editorial del Journey "Roma-Condesa: la ciudad que se puso de moda".
 *
 * El contenido vive en data/journeys/roma.js; aqui solo esta la presentacion.
 *
 * El movimiento se coreografia por momento con el catalogo de
 * components/journeys/motionConfig.ts, indexado por id: nada se decide por el
 * titulo de la pieza. La comida va dentro del recorrido (M03), no en un
 * bloque aparte al final.
 */
export function RomaJourney() {
  const { currentLanguage } = useLanguage()
  const isEs = currentLanguage === 'es'
  const journey = ROMA_JOURNEY

  const moments = useMemo(() => journey.moments.map(toMoment), [journey.moments])
  const stops = useMemo(() => journey.route.legs.map((leg) => ({ ...leg })), [journey.route.legs])
  const detailIds = useMemo(() => moments.map((moment) => moment.id), [moments])

  const chapters = useMemo(
    () =>
      moments.map((moment) => ({
        id: moment.id,
        title: (isEs ? moment.title : moment.title_en) || moment.title,
        number: moment.number,
      })),
    [moments, isEs]
  )

  const L = (es: string, en: string) => (isEs ? es : en)

  return (
    <JourneyDetailProvider ids={detailIds}>
      <div style={journeyVars(journey.accents) as CSSProperties}>
        <ChapterNav chapters={chapters} accent={TERRACOTA} title={journey.title_es} />

        <EditorialHero
          title={journey.title_es}
          titleLines={journey.heroTitleLines}
          subtitle={L(journey.subtitle_es, journey.subtitle_en)}
          eyebrow={L(journey.eyebrow_es, journey.eyebrow_en)}
          meta={[L('5 momentos', '5 moments'), L('1.7 km a pie', '1.7 km on foot')]}
          image={journey.heroImage}
          imageAlt="Plaza Rio de Janeiro, en la colonia Roma, con las casas porfirianas que la rodean."
          chapters={chapters.length}
          accent={TERRACOTA}
          emphasisAccent={CEMPASUCHIL}
        />

        {/* ---------------------------------------------------------------
            INTRODUCCION
        ---------------------------------------------------------------- */}
        <section className="mx-auto max-w-5xl px-6 py-16 sm:py-24">
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
            LOS CINCO MOMENTOS
        ---------------------------------------------------------------- */}
        <div className="mx-auto max-w-6xl px-6">
          {moments.map((moment) => (
            <div key={moment.id}>
              <ChapterDivider
                chapter={moment.number}
                accent={TERRACOTA}
                emphasisAccent={CEMPASUCHIL}
              />
              <EditorialMoment
                moment={moment}
                photos={journey.photos}
                accent={TERRACOTA}
                timelineTitle=""
                movement={MOMENT_TREATMENTS[moment.id]}
                collapsible
                emphasisAccent={CEMPASUCHIL}
                isEs={isEs}
              />
            </div>
          ))}
        </div>

        {/* ---------------------------------------------------------------
            LA COMIDA, EN SU CUADRA
            ----------------------------------------------------------------
            No es un bloque de recomendaciones: es el argumento del tercer
            momento, a un lado de la calle que se esta contando. Por eso va aqui,
            entre los momentos y la ruta.
        ---------------------------------------------------------------- */}
        <section className="mx-auto max-w-5xl px-6 py-16 sm:py-24">
          <Reveal>
            <h2 className="text-center font-serif text-3xl text-zinc-900 dark:text-zinc-50">
              {L('Tres taquerías, una cuadra', 'Three taquerías, one block')}
            </h2>
            <p className="mx-auto mt-3 max-w-2xl text-center text-sm leading-relaxed text-zinc-600 dark:text-zinc-300">
              {L(
                'En la misma cuadra de Álvaro Obregón, a diez metros una de otra. Tres precios, tres públicos y tres maneras de entender la misma calle. La fila depende del día y de la hora: la espera no se publica, se vive.',
                'On the same block of Álvaro Obregón, ten meters from each other. Three prices, three publics and three ways of reading the same street. The queue depends on the day and the hour: the wait is not published, it is lived.'
              )}
            </p>
          </Reveal>

          <div className="mt-10 grid grid-cols-1 gap-6 md:grid-cols-3">
            {[
              { key: 'principal', etiqueta: L('La que abrio primero', 'The first one') },
              {
                key: 'alternativa1',
                etiqueta: L('La que invento el estilo', 'The one that invented the style'),
              },
              {
                key: 'alternativa2',
                etiqueta: L('La que llego de afuera', 'The one that came from elsewhere'),
              },
            ].map((item, index) => {
              const lugar = ROMA_COMIDA[item.key as keyof typeof ROMA_COMIDA]
              if (!lugar) return null
              return (
                <Reveal key={item.key} delay={0.06 * index}>
                  <article className="h-full rounded-2xl border border-zinc-200/70 bg-white/70 p-6 dark:border-white/10 dark:bg-zinc-900/30">
                    <p
                      className="text-xs font-semibold uppercase tracking-[0.18em]"
                      style={{ color: TERRACOTA }}
                    >
                      {item.etiqueta}
                    </p>
                    <h3 className="mt-1 font-serif text-xl text-zinc-900 dark:text-zinc-50">
                      {lugar.nombre_es}
                    </h3>
                    <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
                      {lugar.desde_es}
                    </p>
                    <dl className="mt-4 space-y-2 text-sm text-zinc-600 dark:text-zinc-300">
                      <div>
                        <dt className="font-semibold">{L('Dirección', 'Address')}</dt>
                        <dd>{lugar.direccion_es}</dd>
                      </div>
                      <div>
                        <dt className="font-semibold">{L('Horario', 'Hours')}</dt>
                        <dd>{lugar.horario_es}</dd>
                      </div>
                    </dl>
                    <p className="mt-4 text-sm leading-relaxed text-zinc-600 dark:text-zinc-300">
                      {lugar.detalhe_es}
                    </p>
                  </article>
                </Reveal>
              )
            })}
          </div>

          <Reveal delay={0.1} className="mt-8">
            <p className="mx-auto max-w-2xl text-center text-xs leading-relaxed text-zinc-500 dark:text-zinc-400">
              {L(
                'Horarios y carta verificados en sus sitios oficiales. Los precios cambian: la carta vigente de la taquería principal da 24 a 33 pesos el taco de suadero, de longaniza o de pastor, y 155 pesos la orden surtida de trompos de la Atarantados. Si vas a comer, conviene llegar antes de las nueve de la noche.',
                'Hours and menus verified on the official sites. Prices change: the current menu of the first taquería lists 24 to 33 pesos for a suadero, longaniza or pastor taco, and 155 pesos for the mixed trompo order at the Atarantados. If you are going to eat, it is better to arrive before nine at night.'
              )}
            </p>
          </Reveal>
        </section>

        {/* ---------------------------------------------------------------
            LA RUTA
        ---------------------------------------------------------------- */}
        <section className="mx-auto max-w-6xl px-6 pb-16 sm:pb-24">
          <CollapsibleSection
            title={L(journey.route.title_es, journey.route.title_en)}
            subtitle={L(journey.route.intro_es, journey.route.intro_en)}
            accent={TERRACOTA}
          >
            <JourneyRouteGallery
              stops={stops}
              accent={TERRACOTA}
              emphasisAccent={CEMPASUCHIL}
              isEs={isEs}
            />
          </CollapsibleSection>
        </section>

        {/* ---------------------------------------------------------------
            HALLAZGOS
        ---------------------------------------------------------------- */}
        <section className="mx-auto max-w-5xl px-6 py-16 sm:py-24">
          <Reveal>
            <DiscoveryCards
              entries={journey.discoveries}
              labels={ROMA_DISCOVERY_KINDS}
              accent={TERRACOTA}
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
                    'Fechas, arquitectura y precios proceden de la información oficial de la ciudad, de tesis de la UNAM, de la documentacion del INAH y de análisis con datos del INEGI y de la Sociedad Hipotecaria Federal. Los precios de renta son precios anunciados, no operaciones cerradas: se publican con su fuente y su fecha.',
                    'Dates, architecture and prices come from official city information, UNAM theses, INAH documentation and analyses using INEGI and Sociedad Hipotecaria Federal data. Rents are asking prices, not closed deals: they are published with their source and date.'
                  )}
                </p>
                <ul className="space-y-2">
                  {journey.sources.map((source) => (
                    <li key={source.id}>
                      <a
                        href={source.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm underline underline-offset-4 hover:text-[#C1440E] dark:hover:text-[#F0834F]"
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
                    'Las 24 imagenes de este Journey provienen de Wikimedia Commons, con licencia libre verificada y credito individual bajo cada una. Ninguna fotografia de otro barrio se presenta como si fuera de Roma-Condesa.',
                    'The 24 images in this Journey come from Wikimedia Commons, with a verified free licence and individual credit under each one. No photograph from another neighborhood is presented as if it were Roma-Condesa.'
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
              style={{ color: TERRACOTA }}
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
          accent={TERRACOTA}
          price={journey.price}
          isEs={isEs}
          journeySlug={journey.slug}
        />
      </div>
    </JourneyDetailProvider>
  )
}

/**
 * Convierte un momento al formato que consume EditorialMoment. El contenido
 * guarda el par `_es` / `_en` explicito; el componente usa el par implicito y
 * decide el idioma con `isEs`.
 */
function toMoment(moment: {
  id: string
  number: number
  title_es: string
  title_en: string
  location_es: string
  location_en: string
  kicker_es?: string
  kicker_en?: string
  lead_es: string
  lead_en: string
  question_es?: string
  question_en?: string
  image: string
  duration_min?: number
  steps: {
    title_es: string
    title_en: string
    body_es: string
    body_en: string
    observe_es: string[]
    observe_en: string[]
  }[]
  operational_es?: string
  operational_en?: string
}) {
  return {
    id: moment.id,
    number: moment.number,
    title: moment.title_es,
    title_en: moment.title_en,
    location: moment.location_es,
    location_en: moment.location_en,
    kicker: moment.kicker_es || '',
    kicker_en: moment.kicker_en || '',
    lead: moment.lead_es,
    lead_en: moment.lead_en,
    question: moment.question_es,
    question_en: moment.question_en,
    image: moment.image,
    duration_min: moment.duration_min,
    steps: moment.steps.map((step) => ({
      title: step.title_es,
      title_en: step.title_en,
      body: step.body_es,
      body_en: step.body_en,
      observe: step.observe_es,
      observe_en: step.observe_en,
    })),
    operational_note: moment.operational_es,
    operational_note_en: moment.operational_en,
  }
}
