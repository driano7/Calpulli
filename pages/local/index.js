// MIT License - Copyright (c) 2024-2026 Donovan Riaño / Calpulli CDMX - See LICENSE
'use client'

import Link from '@/components/Link'
import Image from '@/components/Image'
import { PageSEO } from '@/components/SEO'
import siteMetadata from '@/data/siteMetadata'
import { getAllLocalPicks } from '@/lib/localPicks'
import { getFeaturedLocalPicks, getCurrentMonthKey } from '@/lib/localPicksSelection'
import { useLanguage } from '@/lib/hooks/useLanguage'
import { AnimatedSection } from '@/components/AnimatedSection'
import { Pin, Star } from 'lucide-react'

const pageTranslations = {
  en: {
    title: 'Local Picks',
    subtitle: 'Monthly local guide for visitors staying 2-7 days — curated by chilangos',
    empty: 'No picks yet. Check back soon!',
    currentMonth: 'This Month',
    archive: 'Archive',
    readMore: 'Read More',
    neighborhood: 'Neighborhood',
    budget: 'Budget',
    pinnedBadge: 'Festival',
    pinnedTitle: 'Pinned: this festival stays all year',
    pinnedHeading: 'Always here',
    galleryHeading: 'CDMX photo wall',
    galleryNote: 'Allusive photos of the month. Credits: Unsplash (free to use).',
    pinnedNote:
      'Three Mexican festivals that never leave the calendar. They are pinned, and they are in pink.',
  },
  es: {
    title: 'Selección Local',
    subtitle: 'Guía local mensual para visitantes de 2-7 días — curada por chilangos',
    empty: 'Aún no hay selecciones. ¡Vuelve pronto!',
    currentMonth: 'Este Mes',
    archive: 'Archivo',
    readMore: 'Leer Más',
    neighborhood: 'Colonia',
    budget: 'Presupuesto',
    pinnedBadge: 'Festival',
    pinnedTitle: 'Fijado: esta fiesta se queda todo el año',
    pinnedHeading: 'Siempre aquí',
    galleryHeading: 'Muro de fotos CDMX',
    galleryNote: 'Fotos alusivas del mes. Créditos: Unsplash (uso libre).',
    pinnedNote:
      'Tres festividades mexicanas que no se van del calendario. Van fijadas, y van en rosa.',
  },
}

// Fotos alusivas libres de derechos (Unsplash). Sin Getty: tiene
// copyright y no se usa. Cada foto va con su tema para que se entienda.
const MONTH_PHOTOS = [
  {
    src: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=800&q=80',
    alt: { es: 'Tacos y comida callejera de la CDMX', en: 'CDMX street food and tacos' },
  },
  {
    src: 'https://images.unsplash.com/photo-1487958449943-2429e8be8625?w=800&q=80',
    alt: { es: 'Arquitectura del Centro Histórico', en: 'Historic Centre architecture' },
  },
  {
    src: 'https://images.unsplash.com/photo-1572116469696-31de0f17cc34?w=800&q=80',
    alt: {
      es: 'Cafés y vida de barrio en Roma–Condesa',
      en: 'Coffee and neighborhood life in Roma–Condesa',
    },
  },
  {
    src: 'https://images.unsplash.com/photo-1526772661822-98a872d3e7a6?w=800&q=80',
    alt: { es: 'Paseo en Chapultepec', en: 'Stroll in Chapultepec' },
  },
  {
    src: 'https://images.unsplash.com/photo-1533105079780-92b9be482077?w=800&q=80',
    alt: { es: 'Mercados y artesanía local', en: 'Markets and local crafts' },
  },
  {
    src: 'https://images.unsplash.com/photo-1476514525535-07fb6b4ae8dd?w=800&q=80',
    alt: { es: 'Trajineras en Xochimilco', en: 'Trajineras in Xochimilco' },
  },
]

export async function getStaticProps() {
  // Los fijados (3 festividades) + los que rotan (6). El orden lo decide
  // getFeaturedLocalPicks, no el orden del archivo.
  const allEs = getAllLocalPicks('es')
  const allEn = getAllLocalPicks('en')
  const picksEs = getFeaturedLocalPicks(allEs)
  const picksEn = getFeaturedLocalPicks(allEn)
  // Pre-generated at build, revalidate cada hora para nuevos picks sin rebuild
  return { props: { picksEs, picksEn }, revalidate: 3600 }
}

const formatDate = (dateStr, locale) => {
  if (!dateStr) return ''
  const date = new Date(dateStr)
  return date.toLocaleDateString(locale === 'es' ? 'es-MX' : 'en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

/**
 * La tarjeta de un pick. Se usa igual para los fijados (en rosa, con la
 * chincheta) y para los que rotan (en ambar).
 */
const pickCard = (pick, index, t) => (
  <Link
    href={`/local/${pick.slug}`}
    className={`group relative flex h-full flex-col overflow-hidden rounded-xl border bg-white/70 backdrop-blur-md transition-all duration-300 hover:scale-[1.02] hover:shadow-[0_20px_40px_rgba(0,0,0,0.08)] dark:bg-black/40 dark:hover:bg-zinc-900/70 ${
      pick.pinned
        ? 'hover:ring-[#E4007C]/45 border-[#E4007C]/40 ring-1 ring-[#E4007C]/25 hover:border-[#E4007C]/70'
        : 'border-zinc-200/50 hover:border-amber-500/40 dark:border-white/10'
    }`}
  >
    <div className="relative h-48 w-full overflow-hidden">
      <Image
        src={pick.images?.[0] || '/static/images/local-picks/cover.jpg'}
        alt={pick.title}
        fill
        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 33vw"
        priority={index < 2}
        className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
      />
      <div className="absolute left-3 top-3 flex gap-2">
        <span
          className={`rounded-full px-3 py-1 text-xs font-bold text-white ${
            pick.pinned ? 'bg-[#E4007C]' : 'bg-amber-500'
          }`}
        >
          {pick.pinned ? t.pinnedBadge : pick.neighborhood}
        </span>
        {!pick.pinned && (
          <span className="rounded-full bg-black/60 px-3 py-1 text-xs font-bold text-white backdrop-blur">
            {pick.budget}
          </span>
        )}
      </div>

      {/* Chincheta de los fijados, en la esquina superior derecha */}
      {pick.pinned && (
        <span
          className="absolute right-3 top-3 z-10 flex h-9 w-9 items-center justify-center rounded-full bg-[#E4007C] text-white shadow-lg ring-2 ring-white/70"
          title={t.pinnedTitle}
        >
          <Pin className="h-4 w-4" fill="currentColor" aria-hidden />
          <span className="sr-only">{t.pinnedTitle}</span>
        </span>
      )}
    </div>
    <div className="flex flex-1 flex-col p-6">
      <div className="mb-2 flex items-center gap-2 text-sm text-zinc-500 dark:text-gray-500">
        <Star className="h-3.5 w-3.5 text-amber-500" />
        <span>{pick.neighborhood}</span>
        <span>•</span>
        <span>{pick.budget}</span>
      </div>
      <h3
        className={`line-clamp-2 mb-3 text-xl font-bold text-gray-900 dark:text-white ${
          pick.pinned ? 'group-hover:text-[#E4007C]' : 'group-hover:text-amber-500'
        }`}
      >
        {pick.title}
      </h3>
      {pick.summary && (
        <p className="line-clamp-3 text-sm text-zinc-600 dark:text-gray-300">{pick.summary}</p>
      )}
      <div
        className={`mt-4 flex items-center gap-2 text-sm font-medium ${
          pick.pinned ? 'text-[#E4007C]' : 'text-amber-500'
        }`}
      >
        {t.readMore} <span aria-hidden>→</span>
      </div>
    </div>
    {pick.tags && pick.tags.length > 0 && (
      <div className="flex flex-wrap gap-2 border-t border-zinc-200 p-4 dark:border-white/10">
        {pick.tags.slice(0, 3).map((tag) => (
          <span
            key={tag}
            className="rounded-full bg-zinc-100 px-2.5 py-0.5 text-xs text-zinc-600 dark:bg-white/5 dark:text-gray-400"
          >
            #{tag}
          </span>
        ))}
      </div>
    )}
  </Link>
)

export default function LocalPicksPage({ picksEs, picksEn }) {
  const { currentLanguage } = useLanguage()
  const lang = currentLanguage === 'en' ? 'en' : 'es'
  const picks = lang === 'es' ? picksEs : picksEn
  const t = pageTranslations[lang] || pageTranslations.en

  // Los fijados van primero, en rosa; despues los que rotan.
  const pinnedPicks = picks.filter((p) => p.pinned === true)
  const monthPicks = picks.filter((p) => p.pinned !== true && !p.isMonthlyGuide)
  const monthKey = getCurrentMonthKey()
  // Los guides de meses futuros no se anuncian todavía.
  const guides = picks.filter((p) => p.isMonthlyGuide && (!p.month || p.month <= monthKey))

  return (
    <>
      <PageSEO title={`${t.title} - ${monthPicks[0]?.month || ''}`} description={t.subtitle} />
      <div className="min-h-screen bg-transparent">
        <div className="container mx-auto px-4 py-16">
          <div className="mb-12 text-center">
            <div className="mb-3 flex items-center justify-center gap-3">
              <Star className="h-10 w-10 text-amber-500" fill="currentColor" />
              <h1 className="text-4xl font-bold text-gray-900 dark:text-white md:text-5xl lg:text-6xl">
                {t.title}
              </h1>
              <Star className="h-10 w-10 text-amber-500" fill="currentColor" />
            </div>
            <p className="mx-auto max-w-2xl text-lg text-gray-600 dark:text-gray-300">
              {t.subtitle}
            </p>
            <p className="mx-auto mt-2 max-w-2xl text-sm text-gray-500 dark:text-gray-400">
              Roma · Condesa · Juárez · Centro Histórico · Coyoacán · Polanco
            </p>
          </div>

          {pinnedPicks.length > 0 && (
            <section className="mb-16">
              <div className="mb-8 flex flex-wrap items-end justify-between gap-3">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                    {t.pinnedHeading}
                  </h2>
                  <p className="mt-1 max-w-2xl text-sm text-zinc-500 dark:text-zinc-400">
                    {t.pinnedNote}
                  </p>
                </div>
                <span className="flex items-center gap-2 rounded-full bg-[#E4007C]/10 px-3 py-1.5 text-xs font-semibold text-[#E4007C]">
                  <Pin className="h-3.5 w-3.5" fill="currentColor" aria-hidden />
                  {pinnedPicks.length}
                </span>
              </div>
              <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
                {pinnedPicks.map((pick, index) => (
                  <AnimatedSection
                    key={pick.slug}
                    delay={index * 0.08}
                    direction="up"
                    className="w-full"
                  >
                    {pickCard(pick, index, t)}
                  </AnimatedSection>
                ))}
              </div>
            </section>
          )}

          {monthPicks.length > 0 && (
            <section className="mb-16">
              <h2 className="mb-8 text-2xl font-bold text-gray-900 dark:text-white">
                {t.currentMonth} — {monthPicks.length} picks
              </h2>
              <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
                {monthPicks.map((pick, index) => (
                  <AnimatedSection
                    key={pick.slug}
                    delay={index * 0.08}
                    direction="up"
                    className="w-full"
                  >
                    {pickCard(pick, index, t)}
                  </AnimatedSection>
                ))}
              </div>
            </section>
          )}

          <section className="mb-16">
            <h2 className="mb-2 text-2xl font-bold text-gray-900 dark:text-white">
              {t.galleryHeading}
            </h2>
            <p className="mb-6 text-sm text-zinc-500 dark:text-zinc-400">{t.galleryNote}</p>
            <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
              {MONTH_PHOTOS.map((photo, index) => (
                <AnimatedSection
                  key={photo.src}
                  delay={index * 0.06}
                  direction="up"
                  className="w-full"
                >
                  <figure className="group relative h-48 overflow-hidden rounded-2xl border border-zinc-200/50 dark:border-white/10">
                    <Image
                      src={photo.src}
                      alt={photo.alt[lang] || photo.alt.es}
                      fill
                      sizes="(max-width: 768px) 50vw, 33vw"
                      className="object-cover transition-transform duration-500 group-hover:scale-[1.05]"
                    />
                    <figcaption className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-3 text-xs font-medium text-white">
                      {photo.alt[lang] || photo.alt.es}
                    </figcaption>
                  </figure>
                </AnimatedSection>
              ))}
            </div>
          </section>

          {guides.length > 0 && (
            <section className="mb-16">
              <h2 className="mb-4 text-xl font-bold text-gray-900 dark:text-white">
                Monthly Guides
              </h2>
              <div className="grid gap-4 md:grid-cols-2">
                {guides.map((g) => (
                  <Link
                    key={g.slug}
                    href={`/local/${g.slug}`}
                    className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-6 hover:bg-amber-500/20 dark:border-amber-500/20"
                  >
                    <h3 className="font-bold text-zinc-900 dark:text-white">{g.title}</h3>
                    <p className="text-sm text-zinc-600 dark:text-gray-300">{g.summary}</p>
                    <span className="mt-2 inline-block text-sm font-medium text-amber-600 dark:text-amber-400">
                      {t.readMore} →
                    </span>
                  </Link>
                ))}
              </div>
            </section>
          )}

          {picks.length === 0 && (
            <div className="py-20 text-center">
              <Star className="mx-auto h-12 w-12 text-amber-500/50" />
              <p className="mt-4 text-zinc-500 dark:text-gray-400">{t.empty}</p>
              <p className="mt-2 text-sm text-zinc-400">
                Local Picks se genera el día 1 de cada mes via OpenRouter.
              </p>
            </div>
          )}
        </div>
      </div>
    </>
  )
}
