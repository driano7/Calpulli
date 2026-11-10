'use client'

import Link from '@/components/Link'
import { PageSEO } from '@/components/SEO'
import siteMetadata from '@/data/siteMetadata'
import Image from '@/components/Image'
import { ExperienceCard } from '@/components/experiences/ExperienceCard'
import { tours } from '@/data/toursData'
import { AnimatedSection } from '@/components/AnimatedSection'
import { useLanguage } from '@/lib/hooks/useLanguage'
import { Utensils, Skull, MapPin, Palette, Sparkles, HeartHandshake } from 'lucide-react'

export default function Experiences() {
  const { t, currentLanguage } = useLanguage()

  return (
    <>
      <PageSEO
        title={t('experiences.title') || 'Journeys'}
        description={t('experiences.subtitle') || 'Handpicked journeys that transcend the ordinary'}
      />
      <div className="bg-transparent py-20">
        <div className="container mx-auto px-4">
          <div className="mb-12 text-center">
            <h1 className="text-4xl font-bold text-gray-900 dark:text-white md:text-5xl lg:text-6xl">
              {t('experiences.title') || 'Journeys'}
            </h1>
            <p className="mx-auto mt-4 max-w-2xl text-lg text-gray-600 dark:text-gray-300">
              {t('experiences.subtitle') ||
                'Handpicked journeys that transcend the ordinary and reveal the authentic heart of Mexico.'}
            </p>

            {/* Banner tours a la medida — antes de categorías, base SupportBanner */}
            <div className="mx-auto mt-8 flex max-w-4xl flex-col gap-4 text-center">
              <div
                className="relative overflow-hidden rounded-3xl px-6 py-7 text-white shadow-xl sm:px-8 sm:py-8"
                style={{
                  background:
                    'linear-gradient(135deg, #DE1D8D 0%, #BE1588 25%, #9F0E7F 50%, #7B2BD9 75%, #6A0568 100%)',
                }}
              >
                <div className="relative mx-auto flex w-full max-w-3xl flex-col items-center gap-3 text-center">
                  <span className="bg-white/15 flex h-12 w-12 items-center justify-center rounded-full backdrop-blur-sm">
                    <Sparkles className="h-6 w-6 text-white" aria-hidden />
                  </span>
                  <h2 className="text-2xl font-black tracking-tight text-white sm:text-3xl">
                    {t('experiences.customBanner.title') || '¿No encuentras lo que buscas?'}
                  </h2>
                  <p className="max-w-2xl text-sm font-medium leading-relaxed text-white/90 sm:text-base">
                    {t('experiences.customBanner.subtitle') ||
                      'Creamos tours a la medida: cuéntanos tus intereses, tiempos y grupo y diseñamos tu experiencia perfecta en CDMX.'}
                  </p>
                  <a
                    href="https://wa.me/525512291607?text=Hola%20Calpulli CDMX%2C%20quiero%20un%20tour%20a%20la%20medida"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-1 inline-flex items-center gap-2 rounded-full bg-white px-6 py-3 text-sm font-bold text-[#9F0E7F] shadow-lg transition hover:bg-white/90"
                  >
                    <HeartHandshake className="h-4 w-4" aria-hidden />
                    {t('experiences.customBanner.cta') || 'Solicitar tour a la medida'}
                  </a>
                  <p className="text-xs text-white/70">
                    {t('experiences.customBanner.note') ||
                      'Te respondemos en 24h con propuesta y precio.'}
                  </p>
                </div>
              </div>
            </div>

            <div className="mx-auto mt-6 flex max-w-3xl flex-wrap justify-center gap-3">
              {[
                {
                  href: '/tours?category=gastronomy',
                  icon: Utensils,
                  label: t('tourCategories.culinary') || 'Culinary Underworld',
                  color: '#0E8C7A',
                },
                {
                  href: '/tours?category=history',
                  icon: Skull,
                  label: t('tourCategories.history') || 'Uncensored History',
                  color: '#F2A03D',
                },
                {
                  href: '/tours?category=neighborhoods',
                  icon: MapPin,
                  label: t('tourCategories.neighborhoods') || 'Neighborhood Deep Dives',
                  color: '#C1440E',
                },
                {
                  href: '/tours?category=museums',
                  icon: Palette,
                  label: t('tourCategories.museums') || 'Art & Museums',
                  color: '#C1440E',
                },
              ].map((chip) => {
                const Icon = chip.icon
                return (
                  <Link
                    key={chip.href}
                    href={chip.href}
                    className="inline-flex items-center gap-2 rounded-full border bg-white px-4 py-2 text-sm font-medium transition-colors dark:bg-zinc-900"
                    style={{
                      borderColor: `${chip.color}30`,
                      color: chip.color,
                      backgroundColor: `${chip.color}0D`,
                    }}
                  >
                    <span
                      className="flex h-6 w-6 items-center justify-center rounded-full"
                      style={{ backgroundColor: chip.color, color: '#fff' }}
                    >
                      <Icon className="h-3.5 w-3.5" />
                    </span>
                    {chip.label}
                  </Link>
                )
              })}
            </div>
          </div>

          <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
            {tours.map((experience, index) => (
              <AnimatedSection
                key={experience.id}
                delay={index * 0.08}
                direction="up"
                className="w-full"
              >
                <ExperienceCard
                  experience={experience}
                  onSelect={(exp) => {
                    window.location.href = `/tours/${exp.id}`
                  }}
                  locale={currentLanguage}
                />
              </AnimatedSection>
            ))}
          </div>
        </div>
      </div>
    </>
  )
}
