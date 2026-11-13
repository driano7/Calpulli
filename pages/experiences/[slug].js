import Link from '@/components/Link'
import Image from '@/components/Image'
import { motion } from 'framer-motion'
import { Calendar, Clock, Users, MapPin, Star, Check, ArrowLeft, ChevronRight } from 'lucide-react'
import { useLanguage } from '@/lib/hooks/useLanguage'
import { PageSEO } from '@/components/SEO'
import { tours } from '@/data/toursData'
import ProseReveal from '@/components/ProseReveal'
import { formatPriceByLocale } from '@/lib/currency'

export default function ExperienceDetail({ experience, locale }) {
  const { t, currentLanguage } = useLanguage()

  const isEs = currentLanguage === 'es'
  const title = isEs ? experience.titleEs || experience.title : experience.title
  const tagline = isEs ? experience.taglineEs || experience.tagline : experience.tagline
  const description = isEs
    ? experience.descriptionEs || experience.description
    : experience.description
  const location = isEs ? experience.locationEs || experience.location : experience.location
  const highlights = isEs ? experience.highlightsEs || experience.highlights : experience.highlights

  const formatPrice = (price) => formatPriceByLocale(price, isEs ? 'es' : 'en')

  const formatDuration = (hours) => {
    if (hours === 1) {
      return isEs ? '1 hora' : '1 hour'
    }
    if (hours < 12) {
      return isEs
        ? `${hours} ${hours === 2 ? 'hora' : 'horas'}`
        : `${hours} ${hours === 2 ? 'hour' : 'hours'}`
    }
    const days = Math.floor(hours / 24)
    const remainingHours = hours % 24
    if (remainingHours === 0) {
      return isEs
        ? `${days} ${days === 1 ? 'día' : 'días'}`
        : `${days} ${days === 1 ? 'day' : 'days'}`
    }
    return isEs ? `${days}d ${remainingHours}h` : `${days}d ${remainingHours}h`
  }

  const getTranslatedHighlights = () => {
    if (isEs && Array.isArray(experience.highlightsEs)) {
      return experience.highlightsEs
    }
    return experience.highlights
  }

  return (
    <>
      <PageSEO title={title} description={description} />
      <div className="min-h-screen bg-white dark:bg-zinc-950">
        {/* Hero Image */}
        <section className="relative h-[60vh] min-h-[400px]">
          <Image
            src={experience.imageUrl}
            alt={title}
            fill
            priority
            sizes="100vw"
            className="object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-zinc-950/90 via-zinc-950/20 to-transparent" />
          <div className="absolute inset-0 flex items-end">
            <div className="container mx-auto px-6 pb-12">
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, ease: [0.4, 0, 0.2, 1] }}
                className="max-w-3xl"
              >
                {experience.category && (
                  <span className="mb-4 inline-flex items-center gap-2 rounded-full bg-orange-500/20 px-4 py-1.5 text-sm font-medium text-orange-500">
                    {experience.category.name}
                  </span>
                )}
                <h1 className="mb-6 text-4xl font-bold leading-tight tracking-tight text-white md:text-5xl lg:text-6xl">
                  {title}
                </h1>
                {tagline && (
                  <p className="mb-6 max-w-2xl text-lg leading-relaxed text-gray-200">{tagline}</p>
                )}
                <div className="flex flex-wrap items-center gap-6 text-gray-200">
                  <div className="flex items-center gap-2">
                    <Clock className="h-5 w-5 text-orange-500" />
                    <span>{formatDuration(experience.duration)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Users className="h-5 w-5 text-orange-500" />
                    <span>
                      {isEs ? 'Hasta' : 'Up to'} {experience.maxGuests}{' '}
                      {isEs ? 'personas' : 'guests'}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin className="h-5 w-5 text-orange-500" />
                    <span>{location.split(',')[0]}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Star className="h-5 w-5 fill-current text-orange-500" />
                    <span className="font-semibold">{experience.rating}</span>
                    <span className="text-gray-500">
                      ({experience.reviewCount} {isEs ? 'reseñas' : 'reviews'})
                    </span>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </section>

        {/* Content */}
        <section className="py-16 px-6 lg:py-24">
          <div className="container mx-auto max-w-5xl">
            <div className="grid gap-12 lg:grid-cols-3">
              {/* Main Content */}
              <div className="space-y-12 lg:col-span-2">
                {/* Description */}
                <div>
                  <h2 className="mb-4 text-2xl font-bold text-gray-900 dark:text-white">
                    {isEs ? 'Descripción' : 'Description'}
                  </h2>
                  <ProseReveal className="prose prose-zinc max-w-none leading-relaxed text-gray-600 dark:text-gray-300 dark:prose-dark">
                    {description}
                  </ProseReveal>
                </div>

                {/* Highlights */}
                <div>
                  <h2 className="mb-6 text-2xl font-bold text-gray-900 dark:text-white">
                    {isEs ? 'Lo que incluye' : "What's Included"}
                  </h2>
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    {getTranslatedHighlights().map((highlight, index) => (
                      <motion.div
                        key={index}
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: index * 0.1 }}
                        className="flex items-start gap-3 rounded-xl border border-zinc-200 bg-zinc-100 p-4 transition-colors hover:border-orange-500/30 dark:border-white/10 dark:bg-zinc-900/50"
                      >
                        <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-orange-500/20">
                          <Check className="h-5 w-5 text-orange-500" />
                        </div>
                        <span className="font-medium text-gray-800 dark:text-gray-200">
                          {highlight}
                        </span>
                      </motion.div>
                    ))}
                  </div>
                </div>

                {/* Location */}
                <div>
                  <h2 className="mb-4 text-2xl font-bold text-gray-900 dark:text-white">
                    {isEs ? 'Ubicación' : 'Location'}
                  </h2>
                  <div className="rounded-xl border border-zinc-200 bg-zinc-100 p-6 dark:border-white/10 dark:bg-zinc-900/50">
                    <div className="flex items-center gap-3 text-gray-700 dark:text-gray-300">
                      <MapPin className="h-6 w-6 flex-shrink-0 text-orange-500" />
                      <span>{location}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Sidebar - Booking */}
              <div className="lg:col-span-1">
                <motion.div
                  initial={{ opacity: 0, x: 30 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 }}
                  className="sticky top-24 space-y-6"
                >
                  {/* Price Card */}
                  <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-zinc-900/50 dark:shadow-none">
                    <div className="mb-6">
                      <div className="mb-1 text-xs uppercase tracking-wider text-zinc-500 dark:text-gray-400">
                        {isEs ? 'Desde' : 'From'}
                      </div>
                      <div className="text-4xl font-bold text-gray-900 dark:text-white">
                        {formatPrice(experience.price)}
                      </div>
                      <div className="text-sm text-zinc-500 dark:text-gray-400">
                        {isEs ? '/ persona' : '/ person'}
                      </div>
                    </div>

                    <div className="mb-4 flex items-center gap-2 rounded-lg bg-orange-500/10 p-3">
                      <Star className="h-5 w-5 fill-current text-orange-500" />
                      <span className="font-semibold text-gray-900 dark:text-white">
                        {experience.rating}
                      </span>
                      <span className="text-zinc-500 dark:text-gray-400">
                        ({experience.reviewCount} {isEs ? 'reseñas' : 'reviews'})
                      </span>
                    </div>

                    <div className="mb-6 space-y-3">
                      <div className="flex items-center justify-between text-sm text-zinc-600 dark:text-gray-300">
                        <span>{isEs ? 'Duración' : 'Duration'}</span>
                        <span className="font-medium text-gray-900 dark:text-white">
                          {formatDuration(experience.duration)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-sm text-zinc-600 dark:text-gray-300">
                        <span>{isEs ? 'Grupo máx.' : 'Max group'}</span>
                        <span className="font-medium text-gray-900 dark:text-white">
                          {experience.maxGuests}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-sm text-zinc-600 dark:text-gray-300">
                        <span>{isEs ? 'Ubicación' : 'Location'}</span>
                        <span className="font-medium text-gray-900 dark:text-white">
                          {location.split(',')[0]}
                        </span>
                      </div>
                    </div>

                    <button className="flex w-full items-center justify-center gap-2 rounded-xl bg-orange-500 py-4 font-semibold text-white transition-colors hover:bg-orange-600">
                      {isEs ? 'Reservar Ahora' : 'Book Now'}
                      <ChevronRight className="h-5 w-5" />
                    </button>
                  </div>

                  {/* Featured Badge */}
                  {experience.isFeatured && (
                    <div className="rounded-xl border border-orange-500/30 bg-gradient-to-r from-orange-500/20 to-orange-500/20 p-4">
                      <div className="flex items-center gap-3">
                        <Star className="h-6 w-6 fill-current text-orange-500" />
                        <div>
                          <div className="text-sm font-semibold text-gray-900 dark:text-white">
                            {isEs ? 'Experiencia Destacada' : 'Featured Experience'}
                          </div>
                          <div className="text-xs text-zinc-600 dark:text-gray-400">
                            {isEs
                              ? 'Una de nuestras experiencias más solicitadas'
                              : 'One of our most requested experiences'}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Back Link */}
                  <Link
                    href="/experiences"
                    style={{
                      background:
                        'linear-gradient(135deg, #6A0568 0%, #7B2BD9 25%, #9F0E7F 50%, #BE1588 75%, #E4007C 100%)',
                    }}
                    className="inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold text-white shadow-lg transition-all duration-300 hover:shadow-xl"
                  >
                    <ArrowLeft className="h-4 w-4" />
                    {isEs ? 'Volver a Experiencias' : 'Back to Experiences'}
                  </Link>
                </motion.div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </>
  )
}

function getLocaleFromRequest(req, query) {
  if (query.lang === 'es' || query.lang === 'en') return query.lang
  return req?.cookies?.NEXT_LOCALE === 'es' ? 'es' : 'en'
}

export async function getServerSideProps({ params, req, query }) {
  const slug = params?.slug
  const experience = tours.find((t) => t.id === slug)

  if (!experience) {
    return { notFound: true }
  }

  return {
    props: {
      experience,
      locale: getLocaleFromRequest(req, query),
    },
  }
}
