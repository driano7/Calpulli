import Link from '@/components/Link'
import { PageSEO } from '@/components/SEO'
import { HeroSection } from '@/components/ui/HeroSection'
import { AnimatedSection } from '@/components/AnimatedSection'
import siteMetadata from '@/data/siteMetadata'
import Image from '@/components/Image'
import projectsData from '@/data/projectsData'
import { GdprBanner } from '@/components/GdprBanner'
import { HeroPhoneWalletScroll } from '@/components/PhoneWalletShowcase'
import { useLanguage } from '@/lib/hooks/useLanguage'

import ExperiencesCtaBanner from '@/components/ExperiencesCtaBanner'

export default function Home() {
  const { currentLanguage } = useLanguage()
  const isEn = currentLanguage === 'en'
  return (
    <>
      <PageSEO title={siteMetadata.title} description={siteMetadata.description} />
      <HeroSection />
      <div className="bg-transparent text-gray-900 dark:text-gray-100">
        <div className="container mx-auto px-4 py-16">
          {/* Guides Preview — similar UI */}
          <div className="mb-8 rounded-xl border border-teal-500/20 bg-teal-500/10 p-8 dark:border-teal-500/20 dark:bg-teal-500/5">
            <div className="mb-2 flex items-center gap-2 text-teal-600 dark:text-teal-400">
              <span className="text-2xl">🧭</span>
              <span className="text-xs font-bold uppercase tracking-widest">
                {isEn ? 'Guides' : 'Guías'}
              </span>
            </div>
            <h2 className="mb-4 text-3xl font-bold text-gray-900 dark:text-white">
              {isEn ? 'Guides — 5 Easy Culture Journeys' : 'Guías — 5 Journeys de Cultura Fácil'}
            </h2>
            <p className="mb-6 text-gray-600 dark:text-gray-300">
              {isEn
                ? 'Do it yourself: self-guided walks 60–90 min through Condesa, Centro, Chapultepec II, Chimalistac and UNAM. Explore at your own pace, just with your phone.'
                : 'Hazlo tú mismo: recorridos autoguiados de 60–90 min por Condesa, Centro, Chapultepec II, Chimalistac y UNAM. Explora a tu propio ritmo, solo con tu celular.'}
            </p>
            <div className="flex flex-wrap gap-4">
              <Link
                href="/guides"
                className="inline-flex items-center gap-2 rounded-full border border-teal-500/30 bg-teal-500/20 px-6 py-2 font-medium text-teal-600 backdrop-blur-sm transition-all duration-300 hover:bg-teal-500 hover:text-white dark:text-teal-400"
              >
                {isEn ? 'View Guides' : 'Ver Guías'}
              </Link>
            </div>
          </div>

          {/* Local Picks chip — actividades del mes */}
          <div className="mb-8 rounded-xl border border-amber-500/20 bg-amber-500/10 p-8 dark:border-amber-500/20 dark:bg-amber-500/5">
            <div className="mb-2 flex items-center gap-2 text-amber-600 dark:text-amber-400">
              <span className="text-2xl">📅</span>
              <span className="text-xs font-bold uppercase tracking-widest">
                {isEn ? 'Activities of the Month' : 'Actividades del Mes'}
              </span>
            </div>
            <h2 className="mb-4 text-3xl font-bold text-gray-900 dark:text-white">
              {isEn ? 'Activities of the Month in CDMX' : 'Actividades del Mes en CDMX'}
            </h2>
            <p className="mb-6 text-gray-600 dark:text-gray-300">
              {isEn
                ? 'What’s happening this month in Mexico City: seasonal events, new openings and things to do right now.'
                : 'Lo que pasa este mes en la CDMX: eventos de temporada, nuevas aperturas y cosas que hacer ahora mismo.'}
            </p>
            <div className="flex flex-wrap gap-4">
              <Link
                href="/local"
                className="inline-flex items-center gap-2 rounded-full border border-amber-500/30 bg-amber-500/20 px-6 py-2 font-medium text-amber-600 backdrop-blur-sm transition-all duration-300 hover:bg-amber-500 hover:text-white dark:text-amber-400"
              >
                {isEn ? 'See This Month’s Activities' : 'Ver Actividades del Mes'}
              </Link>
            </div>
          </div>

          {/* Maps Preview — similar UI */}
          <div className="mb-8 rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-8 dark:border-emerald-500/20 dark:bg-emerald-500/5">
            <div className="mb-2 flex items-center gap-2 text-emerald-600 dark:text-emerald-400">
              <span className="text-2xl">🗺️</span>
              <span className="text-xs font-bold uppercase tracking-widest">
                {isEn ? 'Maps' : 'Mapas'}
              </span>
            </div>
            <h2 className="mb-4 text-3xl font-bold text-gray-900 dark:text-white">
              {isEn ? 'Maps — CDMX Interactive Guide 2026' : 'Mapas — Guía Interactiva CDMX 2026'}
            </h2>
            <p className="mb-6 text-gray-600 dark:text-gray-300">
              {isEn
                ? 'Five curated maps: fondas, caution zones, relax bars, hidden gems and top attractions. Every point verified for 2- to 7-day visitors.'
                : 'Cinco mapas curados: fondas, zonas de precaución, bares relax, joyas escondidas y top atracciones. Cada punto verificado para visitantes de 2 a 7 días.'}
            </p>
            <div className="flex flex-wrap gap-4">
              <Link
                href="/maps"
                className="inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/20 px-6 py-2 font-medium text-emerald-600 backdrop-blur-sm transition-all duration-300 hover:bg-emerald-500 hover:text-white dark:text-emerald-400"
              >
                {isEn ? 'View Maps' : 'Ver Mapas'}
              </Link>
            </div>
          </div>

          {/* CTA Banner Experiences — entre mapas y selección local */}
          <div className="mb-8">
            <ExperiencesCtaBanner />
          </div>

          {/* Local Picks chip — recomendaciones de locales */}
          <div className="mb-8 rounded-xl border border-amber-500/20 bg-amber-500/10 p-8 dark:border-amber-500/20 dark:bg-amber-500/5">
            <div className="mb-2 flex items-center gap-2 text-amber-600 dark:text-amber-400">
              <span className="text-2xl">★</span>
              <span className="text-xs font-bold uppercase tracking-widest">
                {isEn ? 'Local Picks' : 'Selección Local'}
              </span>
            </div>
            <h2 className="mb-4 text-3xl font-bold text-gray-900 dark:text-white">
              {isEn
                ? 'Local Picks — Recommendations from Locals'
                : 'Selección Local — Recomendaciones de Chilangos'}
            </h2>
            <p className="mb-6 text-gray-600 dark:text-gray-300">
              {isEn
                ? 'Real recommendations from people who live here. Ideal for visitors staying 2-7 days.'
                : 'Recomendaciones reales de quienes viven aquí. Ideal para visitantes de 2 a 7 días.'}
            </p>
            <div className="flex flex-wrap gap-4">
              <Link
                href="/local"
                className="inline-flex items-center gap-2 rounded-full border border-amber-500/30 bg-amber-500/20 px-6 py-2 font-medium text-amber-600 backdrop-blur-sm transition-all duration-300 hover:bg-amber-500 hover:text-white dark:text-amber-400"
              >
                {isEn ? 'View Local Picks' : 'Ver Selección Local'}
              </Link>
            </div>
          </div>
        </div>

        {/* Desvanecido azul morado antes de Safety & Help */}
        <div className="h-24 bg-gradient-to-b from-violet-500/15 via-indigo-500/10 to-transparent dark:from-violet-900/20 dark:via-indigo-900/15 dark:to-transparent" />

        {/* Safety & Help Section */}
        <div className="mb-16">
          <div className="mb-8 text-center">
            <h2 className="mb-2 text-3xl font-bold text-gray-900 dark:text-white">Safety & Help</h2>
            <p className="text-gray-500 dark:text-gray-400">
              Essential information every traveler should have at hand for their stay in 🇲🇽
            </p>
          </div>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {projectsData
              .filter((p) =>
                ['Police can help you', 'Emergency Phones', 'What to do in an earthquake'].includes(
                  p.title
                )
              )
              .map((project, index) => (
                <AnimatedSection
                  key={project.title}
                  delay={index * 0.08}
                  direction="up"
                  className="w-full"
                >
                  <Link
                    href={project.href}
                    className="group flex flex-col overflow-hidden rounded-2xl border border-zinc-200/50 bg-white/70 backdrop-blur-md transition-all duration-300 hover:border-orange-500/30 hover:shadow-[0_20px_40px_rgba(0,0,0,0.1)] dark:border-white/10 dark:bg-black/40 dark:hover:bg-black/50 dark:hover:shadow-[0_20px_40px_rgba(0,0,0,0.3)]"
                  >
                    <div className="relative h-40 overflow-hidden">
                      <Image
                        src={project.imgSrc}
                        alt={project.title}
                        fill
                        sizes="(max-width: 768px) 100vw, (max-width: 1280px) 50vw, 33vw"
                        className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                    </div>
                    <div className="p-4">
                      <h3 className="mb-1 text-lg font-bold text-gray-900 group-hover:text-orange-500 dark:text-white dark:group-hover:text-orange-400">
                        {project.title}
                      </h3>
                      <p className="line-clamp-2 text-sm text-gray-600 dark:text-gray-400">
                        {project.description}
                      </p>
                    </div>
                  </Link>
                </AnimatedSection>
              ))}
          </div>
          <div className="mt-6 text-center">
            <Link
              href="/projects"
              className="inline-flex items-center gap-2 rounded-full border border-orange-500/30 bg-orange-500/20 px-6 py-2 font-medium text-orange-500 backdrop-blur-sm transition-all duration-300 hover:bg-orange-500 hover:text-white"
            >
              View All Info →
            </Link>
          </div>
        </div>

        {/* iPhone showcase (adaptado de Criptec) */}
        <HeroPhoneWalletScroll />

        <GdprBanner className="mt-2" />
      </div>
    </>
  )
}
