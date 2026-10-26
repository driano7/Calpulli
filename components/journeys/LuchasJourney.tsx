'use client'

// MIT License - Copyright (c) 2024-2026 Donovan Riaño / Calpulli CDMX - See LICENSE
import Image from 'next/image'
import { useMemo, useState, type CSSProperties } from 'react'
import Link from '@/components/Link'
import { useLanguage } from '@/lib/hooks/useLanguage'
import {
  LUCHAS_JOURNEY,
  LUCHAS_VARIANTS,
  LUCHAS_DISCOVERY_KINDS,
  LUCHAS_DEFAULT_VARIANT,
  luchasMoments,
  luchasRouteStops,
} from '@/data/journeys/luchas'
import { journeyVars } from '@/lib/journeyTheme'
import { ChapterNav } from './ChapterNav'
import JourneyDetailProvider from './JourneyDetailContext'
import { CollapsibleSection } from './CollapsibleSection'
import { JourneyRouteGallery } from './JourneyRouteGallery'
import { ChapterDivider } from './ChapterDivider'
import { DiscoveryCards } from './DiscoveryCards'
import { EditorialHero } from './EditorialHero'
import { EditorialMoment } from './EditorialMoment'
import { DetailToggle } from './DetailToggle'
import { Reveal } from './Reveal'
import { LuchaArenaSchedule } from './LuchaArenaSchedule'
import { MOMENT_TREATMENTS } from './motionConfig'
import SupportBanner from '@/components/SupportBanner'

const TERRACOTA = '#C1440E'
const CEMPASUCHIL = '#F2A03D'

/**
 * Experiencia editorial del Journey "Luchas".
 *
 * El journey tiene dos variantes y una sola secuencia. El visitante elige
 * arriba; debajo, todo el contenido se reordena: los capitulos, los
 * momentos y la ruta son los de la variante activa.
 *
 * El color es terracota con enfasis en cempasuchil. El terracota es el color
 * de la piel encendida bajo la luz del ring; el cempasuchil, el de la
 * marigold de las_SPIKE de altar. Se cumple la misma regla que en los otros
 * journeys: el enfasis nunca se usa como color de texto sobre fondo claro.
 */
export function LuchasJourney() {
  const { currentLanguage } = useLanguage()
  const isEs = currentLanguage === 'es'
  const journey = LUCHAS_JOURNEY

  // La variante activa. La primera es Arena Mexico: el recinto grande, el
  // que abre la historia; la segunda, Arena Coliseo, la del Centro.
  const [variantId, setVariantId] = useState(LUCHAS_DEFAULT_VARIANT)
  const variant = useMemo(
    () => LUCHAS_VARIANTS.find((v) => v.id === variantId) || LUCHAS_VARIANTS[0],
    [variantId]
  )

  const moments = useMemo(() => luchasMoments(variant.id), [variant.id])
  const stops = useMemo(() => luchasRouteStops(variant.id), [variant.id])

  const chapters = useMemo(
    () =>
      moments.map((moment) => ({
        id: moment.id,
        title: (isEs ? moment.title : moment.title_en) || moment.title,
        number: moment.number,
      })),
    [moments, isEs]
  )

  const variantLabel = (v, es, en) => (isEs ? es : en)

  // Los ids del detalle dependen de la variante: al cambiarla, el estado
  // global de "ver todo el detalle" se recalcula sobre los ids nuevos.
  const detailIds = useMemo(() => moments.map((moment) => moment.id), [moments])

  return (
    <JourneyDetailProvider ids={detailIds}>
      <div style={journeyVars(journey.accents) as CSSProperties}>
        <ChapterNav chapters={chapters} accent={TERRACOTA} title={journey.title_es} />

        <EditorialHero
          title={journey.title_es}
          titleLines={journey.heroTitleLines}
          subtitle={isEs ? journey.subtitle_es : journey.subtitle_en}
          eyebrow={isEs ? journey.eyebrow_es : journey.eyebrow_en}
          meta={[
            variantLabel(
              variant,
              `${variant.nombre_es} · ${variant.funciones_es}`,
              `${variant.nombre_en} · ${variant.funciones_en}`
            ),
          ]}
          image={journey.heroImage}
          imageAlt="Mural sobre la historia de la lucha libre en la Arena Mexico."
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
              {isEs ? journey.intro_es : journey.intro_en}
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
          SELECTOR DE VARIANTE
          ----------------------------------------------------------------
          Dos tarjetas editoriales, no un menu. Cada una dice donde se va,
          cuando y que tiene de distinto. La variante activa se marca con
          el borde de acento y con el atributo aria-pressed.
      ---------------------------------------------------------------- */}
        <section className="mx-auto max-w-5xl px-6 pb-8" data-variant-switcher>
          <Reveal>
            <h2 className="mb-1 text-center text-sm font-semibold uppercase tracking-[0.18em] text-zinc-500 dark:text-zinc-400">
              {isEs ? 'Elige la arena' : 'Choose the arena'}
            </h2>
            <p className="mx-auto mb-8 max-w-2xl text-center text-sm text-zinc-600 dark:text-zinc-300">
              {isEs
                ? 'Dos recorridos, el mismo oficio. Cambia el lugar, el ritmo y lo que se puede hacer antes de entrar.'
                : 'Two routes, the same trade. The place, the pace and what you can do before entering change.'}
            </p>
          </Reveal>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            {LUCHAS_VARIANTS.map((v, index) => {
              const active = v.id === variant.id
              const photo = journey.photos[v.foto]
              return (
                <Reveal key={v.id} delay={0.05 * index}>
                  <button
                    type="button"
                    onClick={() => setVariantId(v.id)}
                    aria-pressed={active}
                    className="group block h-full w-full overflow-hidden rounded-2xl border-2 bg-white text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 dark:bg-zinc-900"
                    style={{
                      borderColor: active ? TERRACOTA : 'transparent',
                      ['--tw-ring-color' as string]: TERRACOTA,
                    }}
                  >
                    {photo && (
                      <Image
                        src={photo.src}
                        alt={photo.alt}
                        width={800}
                        height={440}
                        className="h-44 w-full object-cover"
                      />
                    )}
                    <div className="p-6">
                      <p
                        className="text-xs font-semibold uppercase tracking-[0.18em]"
                        style={{ color: active ? TERRACOTA : undefined }}
                      >
                        {isEs ? `Variante ${v.order}` : `Variant ${v.order}`}
                      </p>
                      <h3 className="mt-1 font-serif text-2xl text-zinc-900 dark:text-zinc-50">
                        {variantLabel(v, v.nombre_es, v.nombre_en)}
                      </h3>
                      <p className="mt-1 text-sm italic text-zinc-500 dark:text-zinc-400">
                        {variantLabel(v, v.apodo_es, v.apodo_en)}
                      </p>
                      <dl className="mt-4 space-y-1 text-sm text-zinc-600 dark:text-zinc-300">
                        <div className="flex gap-2">
                          <dt className="shrink-0 font-semibold">
                            {isEs ? 'Dirección' : 'Address'}:
                          </dt>
                          <dd>{variantLabel(v, v.direccion_es, v.direccion_en)}</dd>
                        </div>
                        <div className="flex gap-2">
                          <dt className="shrink-0 font-semibold">
                            {isEs ? 'Funciones' : 'Shows'}:
                          </dt>
                          <dd>{variantLabel(v, v.funciones_es, v.funciones_en)}</dd>
                        </div>
                      </dl>
                      <p className="mt-4 text-sm leading-relaxed text-zinc-600 dark:text-zinc-300">
                        {variantLabel(v, v.resumen_es, v.resumen_en)}
                      </p>
                      {active && (
                        <p className="mt-4 text-sm font-semibold" style={{ color: TERRACOTA }}>
                          {isEs ? 'Recorrido seleccionado' : 'Selected route'}
                        </p>
                      )}
                    </div>
                  </button>

                  {/* Horarios de las próximas 7 funciones para esta arena */}
                  <LuchaArenaSchedule
                    arena={v.id === 'arena-mexico' ? 'mexico' : 'coliseo'}
                    arenaName={variantLabel(v, v.nombre_es, v.nombre_en)}
                    isEs={isEs}
                  />
                </Reveal>
              )
            })}
          </div>
        </section>

        {/* ---------------------------------------------------------------
          LOS MOMENTOS DE LA VARIANTE ACTIVA
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
          LA RUTA
      ---------------------------------------------------------------- */}
        <section className="mx-auto max-w-6xl px-6 py-16 sm:py-24">
          <CollapsibleSection
            title={isEs ? journey.route.title_es : journey.route.title_en}
            subtitle={variantLabel(
              variant,
              `Recorrido de ${variant.nombre_es}`,
              `${variant.nombre_en} route`
            )}
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
              labels={LUCHAS_DISCOVERY_KINDS}
              accent={TERRACOTA}
              isEs={isEs}
              title={
                isEs
                  ? 'Lo que se observa, lo que se documenta y lo que falta'
                  : 'What is observed, what is documented and what is missing'
              }
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
                  {isEs ? 'Fuentes' : 'Sources'}
                </h2>
                <p className="mb-4 text-sm text-zinc-600 dark:text-zinc-300">
                  {isEs
                    ? 'Direcciones, horarios y normas de acceso provienen de la informacion oficial de CMLL, de su canal de ticketing y de los sitios oficiales de las marcas y los mercados.'
                    : 'Addresses, show times and entry rules come from CMLL official information, its ticketing channel, and the official sites of the brands and the markets.'}
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
                        {variantLabel(source, source.label_es, source.label_en)}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>

              <div>
                <h2 className="mb-1 text-sm font-semibold uppercase tracking-[0.18em] text-zinc-500 dark:text-zinc-400">
                  {isEs ? 'Fotografía' : 'Photography'}
                </h2>
                <p className="mb-4 text-sm text-zinc-600 dark:text-zinc-300">
                  {isEs
                    ? 'Las trece imagenes de este Journey provienen de Wikimedia Commons, con licencia libre verificada y credito individual bajo cada una.'
                    : 'The thirteen images in this Journey come from Wikimedia Commons, with a verified free licence and individual credit under each one.'}
                </p>
                <p className="text-xs leading-relaxed text-zinc-500 dark:text-zinc-400">
                  {isEs
                    ? `Datos operativos verificados el ${journey.verified_on}. Los puntos marcados como pendientes no se han verificado: se publican como pendientes, no rellenados.`
                    : `Operational data verified on ${journey.verified_on}. The points marked as pending have not been verified: they are published as pending, not filled in.`}
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
              {isEs ? 'Volver a los Journeys' : 'Back to Journeys'}
            </Link>
          </Reveal>
        </section>

        <section className="mx-auto max-w-5xl px-6 pb-24">
          <SupportBanner />
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
