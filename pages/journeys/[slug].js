// MIT License - Copyright (c) 2024-2026 Donovan Riaño / Calpulli CDMX - See LICENSE
import Link from '@/components/Link'
import { PageSEO } from '@/components/SEO'
import {
  JOURNEY_SLUGS,
  getJourneyBySlug,
  pickLocalized,
  pickLocalizedList,
} from '@/data/journeysData'
import { journeyVars } from '@/lib/journeyTheme'
import { useLanguage } from '@/lib/hooks/useLanguage'
import { JourneyHero } from '@/components/journeys/JourneyHero'
import { JourneyMoment } from '@/components/journeys/JourneyMoment'
import { ChapultepecJourney } from '@/components/journeys/ChapultepecJourney'
import { CentroJourney } from '@/components/journeys/CentroJourney'
import { AntropologiaJourney } from '@/components/journeys/AntropologiaJourney'
import { LuchasJourney } from '@/components/journeys/LuchasJourney'
import { RomaJourney } from '@/components/journeys/RomaJourney'
import { JamaicaJourney } from '@/components/journeys/JamaicaJourney'
import { Reveal } from '@/components/journeys/Reveal'
import PartnerBanner from '@/components/partners/PartnerBanner'
import PartnerPrice from '@/components/partners/PartnerPrice'

export default function JourneyDetail({ journey }) {
  const { currentLanguage } = useLanguage()
  const isEs = currentLanguage === 'es'
  const price = journey.price || 0

  const PartnerHeader = () => (
    <div className="mx-auto max-w-5xl px-6 pb-6 pt-24 sm:pt-32">
      <PartnerBanner />
      {price > 0 ? <PartnerPrice originalAmount={price} className="mt-2" /> : null}
    </div>
  )

  // Los journeys con experiencia propia se renderizan con su componente
  // dedicado; el resto usa la presentacion editorial generica de abajo.
  if (journey.experience === 'antropologia') {
    return (
      <>
        <PageSEO title={journey.title_es} description={journey.subtitle_es} />
        <PartnerHeader />
        <AntropologiaJourney />
      </>
    )
  }

  if (journey.experience === 'jamaica') {
    return (
      <>
        <PageSEO title={journey.title_es} description={journey.subtitle_es} />
        <PartnerHeader />
        <JamaicaJourney />
      </>
    )
  }

  if (journey.experience === 'roma') {
    return (
      <>
        <PageSEO title={journey.title_es} description={journey.subtitle_es} />
        <PartnerHeader />
        <RomaJourney />
      </>
    )
  }

  if (journey.experience === 'luchas') {
    return (
      <>
        <PageSEO title={journey.title_es} description={journey.subtitle_es} />
        <PartnerHeader />
        <LuchasJourney />
      </>
    )
  }

  if (journey.experience === 'centro') {
    return (
      <>
        <PageSEO title={journey.title_es} description={journey.subtitle_es} />
        <PartnerHeader />
        <CentroJourney />
      </>
    )
  }

  if (journey.experience === 'chapultepec') {
    return (
      <>
        <PageSEO title={journey.title_es} description={journey.subtitle_es} />
        <PartnerHeader />
        <ChapultepecJourney />
      </>
    )
  }

  const title = pickLocalized(journey.title_es, journey.title_en, isEs)
  const subtitle = pickLocalized(journey.subtitle_es, journey.subtitle_en, isEs)
  const intro = pickLocalized(journey.intro_es, journey.intro_en, isEs)
  const moments = journey.moments || []

  return (
    <>
      <PageSEO title={title} description={subtitle || intro} />

      <div style={journeyVars(journey.accents)}>
        <JourneyHero title={title} subtitle={subtitle} image={journey.heroImage} />

        <article className="mx-auto max-w-6xl px-6 py-16 sm:py-24">
          <PartnerBanner />
          {price > 0 ? (
            <div className="mb-8">
              <PartnerPrice originalAmount={price} />
            </div>
          ) : null}
          {intro && (
            <Reveal>
              <p className="mx-auto max-w-2xl text-center text-xl leading-relaxed text-zinc-600 dark:text-zinc-300">
                {intro}
              </p>
            </Reveal>
          )}

          {moments.length > 0 ? (
            <div className="mt-20 space-y-24">
              {moments.map((moment, index) => (
                <JourneyMoment
                  key={index}
                  index={index}
                  title={pickLocalized(moment.title_es, moment.title_en, isEs)}
                  intro={pickLocalized(moment.intro_es, moment.intro_en, isEs)}
                  image={moment.image}
                  imageAlt={pickLocalized(moment.title_es, moment.title_en, isEs)}
                  steps={(moment.steps || []).map((step) => ({
                    title: pickLocalized(step.title_es, step.title_en, isEs),
                    body: pickLocalized(step.body_es, step.body_en, isEs),
                    observe: pickLocalizedList(step.observe_es, step.observe_en, isEs),
                    image: step.image,
                    imageAlt: pickLocalized(step.title_es, step.title_en, isEs),
                  }))}
                />
              ))}
            </div>
          ) : (
            <Reveal className="mt-20">
              <p className="mx-auto max-w-xl text-center text-sm italic text-zinc-500 dark:text-zinc-400">
                {isEs
                  ? 'Este Journey todavía no tiene momentos publicados. El contenido editorial se incorpora progresivamente.'
                  : 'This Journey has no published moments yet. Editorial content is added progressively.'}
              </p>
            </Reveal>
          )}

          <Reveal
            delay={0.1}
            className="mt-24 border-t border-zinc-200/70 pt-10 dark:border-white/10"
          >
            <Link
              href="/journeys"
              className="inline-flex items-center gap-2 text-sm font-semibold text-[var(--j1)] hover:underline"
            >
              <svg
                viewBox="0 0 24 24"
                className="h-4 w-4"
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path d="M19 12H5M11 6l-6 6 6 6" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              {isEs ? 'Volver a los Journeys' : 'Back to Journeys'}
            </Link>
          </Reveal>
        </article>
      </div>
    </>
  )
}

export function getStaticPaths() {
  return {
    paths: JOURNEY_SLUGS.map((slug) => ({ params: { slug } })),
    fallback: 'blocking',
  }
}

export function getStaticProps({ params }) {
  const journey = getJourneyBySlug(params?.slug)

  if (!journey) {
    return { notFound: true }
  }

  return { props: { journey } }
}
