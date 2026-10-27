import Link from '@/components/Link'
import Image from '@/components/Image'
import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useRouter } from 'next/router'
import {
  Calendar,
  Clock,
  Users,
  MapPin,
  Star,
  Check,
  ArrowLeft,
  ChevronRight,
  ChevronDown,
  MapPinned,
  ShoppingBag,
  Heart,
  HelpCircle,
} from 'lucide-react'
import { useLanguage } from '@/lib/hooks/useLanguage'
import { OjosOscuridad } from '@/components/moodboard/Icons'
import { useAuth } from '@/lib/hooks/useAuth'
import { useCartStore } from '@/lib/store/useCartStore'
import { isFavorite, toggleFavorite } from '@/lib/userData'
import { PageSEO } from '@/components/SEO'
import JsonLd from '@/components/JsonLd'
import { buildTourEntity, buildBreadcrumbList, buildFAQPageEntity } from '@/lib/seo'
import { tours } from '@/data/toursData'
import ProseReveal from '@/components/ProseReveal'
import { TourReviews } from '@/components/experiences/TourReviews'
import { AddToCartButton } from '@/components/tours/AddToCartButton'
import { getCategoryTheme, themeVars } from '@/lib/tourTheme'
import { formatPriceByLocale } from '@/lib/currency'

const categoryLabels = {
  en: {
    gastronomy: 'Culinary Underworld',
    history: 'Uncensored History',
    neighborhoods: 'Neighborhood Deep Dives',
    museums: 'Art & Museums',
  },
  es: {
    gastronomy: 'Submundo Culinario',
    history: 'Historia Sin Censura',
    neighborhoods: 'Inmersiones en Barrios',
    museums: 'Arte y Museos',
  },
}

export default function TourDetail({ tour, locale }) {
  const { t, currentLanguage } = useLanguage()
  const router = useRouter()
  const { user } = useAuth()
  const { addItem, clearCart } = useCartStore()

  const isEs = currentLanguage === 'es'
  const [fav, setFav] = useState(false)

  useEffect(() => {
    setFav(isFavorite(tour.id))
  }, [tour.id])
  const title = isEs ? tour.titleEs || tour.title : tour.title
  const tagline = isEs ? tour.taglineEs || tour.tagline : tour.tagline
  const description = isEs ? tour.descriptionEs || tour.description : tour.description
  const location = isEs ? tour.locationEs || tour.location : tour.location
  const meetingPoint = isEs ? tour.meetingPointEs || tour.meetingPoint : tour.meetingPoint
  const highlights = isEs ? tour.highlightsEs || tour.highlights : tour.highlights
  const includes = isEs ? tour.includesEs || tour.includes : tour.includes
  const itinerary = isEs ? tour.itineraryEs || tour.itinerary : tour.itinerary
  const gallery = tour.gallery?.length ? tour.gallery : [tour.imageUrl]
  const faq = isEs ? tour.faqEs || tour.faq : tour.faq
  const [faqOpen, setFaqOpen] = useState(null)

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

  const categoryLabel = categoryLabels[isEs ? 'es' : 'en'][tour.category] || tour.category
  const theme = getCategoryTheme(tour.category)

  const handleAddToCart = () => {
    if (!user) {
      router.push(`/login?redirect=/tours/${tour.id}`)
      return
    }
    // Al seleccionar (agregar) una experiencia nueva, se reemplaza el carrito:
    // no queremos acumular tours/journeys que el usuario ya no quiere.
    clearCart()
    addItem({
      experienceId: tour.id,
      title,
      imageUrl: tour.imageUrl,
      price: tour.price,
      currency: 'USD',
      location,
      maxGuests: tour.maxGuests,
      highlights,
    })
    router.push('/cart')
  }

  const tourLocale = isEs ? 'es' : 'en'
  const tourJsonLd = buildTourEntity(tour, tourLocale)
  const breadcrumbJsonLd = buildBreadcrumbList([
    { name: isEs ? 'Inicio' : 'Home', path: '/' },
    { name: isEs ? 'Tours' : 'Tours', path: '/tours' },
    { name: categoryLabel, path: `/tours?category=${tour.category}` },
    { name: title },
  ])

  return (
    <>
      <PageSEO title={title} description={tagline || description} />
      <JsonLd
        data={
          faq && faq.length > 0
            ? [tourJsonLd, breadcrumbJsonLd, buildFAQPageEntity(faq)]
            : [tourJsonLd, breadcrumbJsonLd]
        }
      />
      <div className="min-h-screen bg-white dark:bg-zinc-950" style={themeVars(theme)}>
        {/* Hero Image */}
        <section className="relative h-[60vh] min-h-[400px]">
          <Image
            src={tour.imageUrl}
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
                {tour.category && (
                  <span className="mb-4 inline-flex items-center gap-2 rounded-full bg-[var(--a20)] px-4 py-1.5 text-sm font-medium text-[var(--accent)]">
                    {categoryLabel}
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
                    <Clock className="h-5 w-5 text-[var(--accent)]" />
                    <span>{formatDuration(tour.duration)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Users className="h-5 w-5 text-[var(--accent)]" />
                    <span>
                      {isEs ? 'Hasta' : 'Up to'} {tour.maxGuests} {isEs ? 'personas' : 'guests'}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin className="h-5 w-5 text-[var(--accent)]" />
                    <span>{location.split(',')[0]}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        const el = document.getElementById('tour-reviews')
                        el?.scrollIntoView({ behavior: 'smooth', block: 'start' })
                      }}
                      className="flex items-center gap-2 text-left"
                      aria-label={isEs ? 'Ver comentarios' : 'View reviews'}
                    >
                      <Star className="h-5 w-5 fill-current text-[var(--accent)]" />
                      <span className="font-semibold">{tour.rating}</span>
                      <span className="text-gray-400">
                        ({tour.reviewCount} {isEs ? 'reseñas' : 'reviews'})
                      </span>
                      <ChevronDown className="h-4 w-4 text-[var(--accent)]" />
                    </button>
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
                  <div className="mb-3 flex items-center gap-3">
                    <OjosOscuridad size={40} />
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                      {isEs ? '¿Qué es este tour?' : 'What is this tour?'}
                    </h2>
                  </div>
                  <ProseReveal className="prose prose-zinc max-w-none leading-relaxed text-gray-600 dark:text-gray-300 dark:prose-dark">
                    {description}
                  </ProseReveal>
                </div>

                {/* What you'll do / Itinerary */}
                {itinerary && itinerary.length > 0 && (
                  <div>
                    <h2 className="mb-6 text-2xl font-bold text-gray-900 dark:text-white">
                      {isEs ? 'Qué harás' : "What you'll do"}
                    </h2>
                    <ol className="relative space-y-6 border-l-2 border-[var(--a30)] pl-6">
                      {itinerary.map((step, index) => (
                        <motion.li
                          key={index}
                          initial={{ opacity: 0, y: 20 }}
                          whileInView={{ opacity: 1, y: 0 }}
                          viewport={{ once: true }}
                          transition={{ delay: index * 0.1 }}
                          className="relative"
                        >
                          <span className="absolute -left-[31px] flex h-6 w-6 items-center justify-center rounded-full bg-[var(--accent)] text-xs font-bold text-white">
                            {index + 1}
                          </span>
                          <p className="font-medium text-gray-800 dark:text-gray-200">{step}</p>
                        </motion.li>
                      ))}
                    </ol>
                  </div>
                )}

                {/* Includes */}
                <div>
                  <h2 className="mb-6 text-2xl font-bold text-gray-900 dark:text-white">
                    {isEs ? 'Lo que incluye' : "What's Included"}
                  </h2>
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    {highlights.map((highlight, index) => (
                      <motion.div
                        key={index}
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: index * 0.1 }}
                        className="flex items-start gap-3 rounded-xl border border-zinc-200 bg-zinc-100 p-4 transition-colors hover:border-[var(--a30)] dark:border-white/10 dark:bg-zinc-900/50"
                      >
                        <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-[var(--a20)]">
                          <Check className="h-5 w-5 text-[var(--accent)]" />
                        </div>
                        <span className="font-medium text-gray-800 dark:text-gray-200">
                          {highlight}
                        </span>
                      </motion.div>
                    ))}
                  </div>
                </div>

                {/* Extra includes */}
                {includes && includes.length > 0 && (
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    {includes.map((item, index) => (
                      <div
                        key={index}
                        className="flex items-center gap-2 text-sm text-zinc-600 dark:text-gray-300"
                      >
                        <Check className="h-4 w-4 flex-shrink-0 text-[var(--accent)]" />
                        {item}
                      </div>
                    ))}
                  </div>
                )}

                {/* Meeting point */}
                {meetingPoint && (
                  <div>
                    <h2 className="mb-4 text-2xl font-bold text-gray-900 dark:text-white">
                      {isEs ? 'Punto de encuentro' : 'Meeting point'}
                    </h2>
                    <div className="rounded-xl border border-zinc-200 bg-zinc-100 p-6 dark:border-white/10 dark:bg-zinc-900/50">
                      <div className="flex items-center gap-3 text-gray-700 dark:text-gray-300">
                        <MapPinned className="h-6 w-6 flex-shrink-0 text-[var(--accent)]" />
                        <div>
                          <div className="font-medium">{meetingPoint}</div>
                          <div className="text-sm text-zinc-500 dark:text-gray-400">{location}</div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Photo gallery */}
                {gallery.length > 1 && (
                  <div>
                    <h2 className="mb-6 text-2xl font-bold text-gray-900 dark:text-white">
                      {isEs ? 'Galería' : 'Gallery'}
                    </h2>
                    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
                      {gallery.map((src, index) => (
                        <motion.div
                          key={index}
                          initial={{ opacity: 0, scale: 0.96 }}
                          whileInView={{ opacity: 1, scale: 1 }}
                          viewport={{ once: true }}
                          transition={{ delay: index * 0.08 }}
                          className="relative aspect-[4/3] overflow-hidden rounded-xl"
                        >
                          <Image
                            src={src}
                            alt={`${title} — ${index + 1}`}
                            fill
                            sizes="(min-width: 768px) 33vw, 50vw"
                            className="object-cover"
                          />
                        </motion.div>
                      ))}
                    </div>
                  </div>
                )}

                {/* FAQ — MOFU: objeciones antes de reservar */}
                {faq && faq.length > 0 && (
                  <div>
                    <h2 className="mb-6 text-2xl font-bold text-gray-900 dark:text-white">
                      {isEs ? 'Preguntas frecuentes' : 'Frequently asked questions'}
                    </h2>
                    <div className="space-y-3">
                      {faq.map((item, index) => {
                        const open = faqOpen === index
                        return (
                          <div
                            key={index}
                            className="overflow-hidden rounded-xl border border-zinc-200 dark:border-white/10"
                          >
                            <button
                              type="button"
                              onClick={() => setFaqOpen(open ? null : index)}
                              aria-expanded={open}
                              className="flex w-full items-center gap-3 bg-zinc-100 px-5 py-4 text-left transition-colors hover:bg-zinc-200/70 dark:bg-zinc-900/50 dark:hover:bg-zinc-900"
                            >
                              <HelpCircle className="h-5 w-5 flex-shrink-0 text-[var(--accent)]" />
                              <span className="flex-1 font-medium text-gray-900 dark:text-white">
                                {item.q}
                              </span>
                              <ChevronDown
                                className={`h-5 w-5 flex-shrink-0 text-[var(--accent)] transition-transform duration-300 ${
                                  open ? 'rotate-180' : ''
                                }`}
                              />
                            </button>
                            {open && (
                              <div className="border-t border-zinc-200 bg-white px-5 py-4 text-sm leading-relaxed text-zinc-600 dark:border-white/10 dark:bg-zinc-950 dark:text-gray-300">
                                {item.a}
                              </div>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}

                {/* CTA — Reserve / Request info */}
                <div className="rounded-2xl border border-[var(--a20)] bg-[var(--a05)] p-8 text-center">
                  <h2 className="mb-2 text-2xl font-bold text-gray-900 dark:text-white">
                    {isEs ? '¿Listo para esta experiencia?' : 'Ready for this experience?'}
                  </h2>
                  <p className="mb-2 inline-flex items-center gap-2 rounded-full bg-[var(--a10)] px-4 py-1.5 text-sm font-semibold text-[var(--accent)]">
                    <Users className="h-4 w-4" />
                    {isEs
                      ? `Grupos reducidos — máximo ${tour.maxGuests} personas`
                      : `Small groups — max ${tour.maxGuests} guests`}
                  </p>
                  <p className="mb-6 text-zinc-600 dark:text-gray-300">
                    {isEs
                      ? `Reserva tu lugar en ${tour.titleEs || title} o pide más información.`
                      : `Book your spot on ${title} or request more information.`}
                  </p>
                  <div className="flex flex-col justify-center gap-3 sm:flex-row">
                    <button
                      type="button"
                      onClick={handleAddToCart}
                      className="inline-flex items-center justify-center gap-2 rounded-xl bg-[var(--accent)] px-8 py-4 font-semibold text-white transition-all hover:brightness-110"
                    >
                      <ShoppingBag className="h-5 w-5" />
                      {isEs ? 'Agregar al carrito' : 'Add to Cart'}
                    </button>
                    <a
                      href={`https://wa.me/525512291607?text=${encodeURIComponent(
                        isEs
                          ? `Hola, me interesa el tour: ${
                              tour.titleEs || title
                            }. ¿Me pueden dar más información?`
                          : `Hi, I'm interested in the tour: ${title}. Could you give me more info?`
                      )}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center justify-center gap-2 rounded-xl border border-emerald-500/40 bg-emerald-500/10 px-8 py-4 font-semibold text-emerald-600 transition-colors hover:bg-emerald-500/20 dark:text-emerald-400"
                    >
                      <Users className="h-5 w-5" />
                      {isEs ? 'Pedir Información' : 'Request Info'}
                    </a>
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
                        {formatPrice(tour.price)}
                      </div>
                      <div className="text-sm text-zinc-500 dark:text-gray-400">
                        {isEs ? '/ persona' : '/ person'}
                      </div>
                    </div>

                    <div className="mb-4 flex items-center gap-2 rounded-lg bg-[var(--a10)] p-3">
                      <Star className="h-5 w-5 fill-current text-[var(--accent)]" />
                      <span className="font-semibold text-gray-900 dark:text-white">
                        {tour.rating}
                      </span>
                      <span className="text-zinc-500 dark:text-gray-400">
                        ({tour.reviewCount} {isEs ? 'reseñas' : 'reviews'})
                      </span>
                    </div>

                    <div className="mb-6 space-y-3">
                      <div className="flex items-center justify-between text-sm text-zinc-600 dark:text-gray-300">
                        <span>{isEs ? 'Duración' : 'Duration'}</span>
                        <span className="font-medium text-gray-900 dark:text-white">
                          {formatDuration(tour.duration)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-sm text-zinc-600 dark:text-gray-300">
                        <span>{isEs ? 'Grupo máx.' : 'Max group'}</span>
                        <span className="font-medium text-gray-900 dark:text-white">
                          {tour.maxGuests}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-sm text-zinc-600 dark:text-gray-300">
                        <span>{isEs ? 'Ubicación' : 'Location'}</span>
                        <span className="font-medium text-gray-900 dark:text-white">
                          {location.split(',')[0]}
                        </span>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <AddToCartButton tour={tour} locale={isEs ? 'es' : 'en'} />
                      <button
                        type="button"
                        onClick={() => setFav(toggleFavorite(tour.id))}
                        className={`flex w-full items-center justify-center gap-2 rounded-xl py-3 font-semibold transition-colors ${
                          fav
                            ? 'bg-[var(--a10)] text-[var(--accent)] hover:bg-[var(--a20)]'
                            : 'border border-zinc-200 text-zinc-600 hover:border-[var(--a30)] hover:text-[var(--accent)] dark:border-white/10 dark:text-gray-300'
                        }`}
                      >
                        <Heart className={`h-5 w-5 ${fav ? 'fill-current' : ''}`} />
                        {fav
                          ? isEs
                            ? 'En favoritos'
                            : 'In favorites'
                          : isEs
                          ? 'Guardar en favoritos'
                          : 'Save to favorites'}
                      </button>
                    </div>
                  </div>

                  {/* Featured Badge */}
                  {tour.isFeatured && (
                    <div className="rounded-xl border border-[var(--a30)] bg-[var(--a20)] p-4">
                      <div className="flex items-center gap-3">
                        <Star className="h-6 w-6 fill-current text-[var(--accent)]" />
                        <div>
                          <div className="text-sm font-semibold text-gray-900 dark:text-white">
                            {isEs ? 'Tour Destacado' : 'Featured Tour'}
                          </div>
                          <div className="text-xs text-zinc-600 dark:text-gray-400">
                            {isEs
                              ? 'Uno de nuestros tours más solicitados'
                              : 'One of our most requested tours'}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Back Link */}
                  <Link
                    href="/tours"
                    style={{
                      background:
                        'linear-gradient(135deg, #6A0568 0%, #7B2BD9 25%, #9F0E7F 50%, #BE1588 75%, #DE1D8D 100%)',
                    }}
                    className="inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold text-white shadow-lg transition-all duration-300 hover:shadow-xl"
                  >
                    <ArrowLeft className="h-4 w-4" />
                    {isEs ? 'Volver a Tours' : 'Back to Tours'}
                  </Link>
                </motion.div>
              </div>
            </div>
          </div>
        </section>

        {/* Comentarios del tour */}
        <TourReviews tour={tour} isEs={isEs} locale={isEs ? 'es' : 'en'} />
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
  const tour = tours.find((t) => t.id === slug)

  if (!tour) {
    return { notFound: true }
  }

  return {
    props: {
      tour,
      locale: getLocaleFromRequest(req, query),
    },
  }
}
