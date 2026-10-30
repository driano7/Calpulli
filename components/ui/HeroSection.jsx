'use client'

import Link from '@/components/Link'
import { motion } from 'framer-motion'
import { HeroMouseBackground } from '@/components/HeroMouseBackground'
import { useLanguage } from '@/lib/hooks/useLanguage'

export function HeroSection() {
  const { t } = useLanguage()

  const eyebrow = t('hero.eyebrow') || 'JOURNEYS · CIUDAD DE MÉXICO'
  const titleStart = t('hero.titleStart') || 'La Ciudad de México,'
  const titleHighlight = t('hero.titleHighlight') || 'más allá de lo evidente.'
  const subtitle =
    t('hero.subtitle') ||
    'Journeys editoriales por los barrios, rituales e historias que revelan la esencia de la ciudad. Diseñados para descubrirla a tu propio ritmo.'
  const cta = t('hero.cta') || 'Explorar Journeys'
  const scrollHint = t('hero.scrollHint') || 'Desplázate para explorar'

  return (
    <section className="relative flex min-h-[100dvh] w-full items-center justify-center overflow-hidden bg-black text-white">
      {/* Background with fluid WebGL waves */}
      <HeroMouseBackground />

      {/* Main hero typography & content */}
      <div className="container relative z-10 mx-auto flex min-h-[100dvh] flex-col items-center justify-center px-6 py-24 text-center">
        <div className="mx-auto max-w-4xl">
          {/* Eyebrow */}
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
            className="mb-6 flex justify-center"
          >
            <span className="inline-flex items-center gap-2 rounded-full border border-orange-500/30 bg-orange-500/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.22em] text-[#E4007C] backdrop-blur-md">
              <span className="h-1.5 w-1.5 rounded-full bg-[#E4007C]" aria-hidden="true" />
              {eyebrow}
            </span>
          </motion.div>

          {/* Centered Headline in two segments */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.9, delay: 0.25, ease: [0.22, 1, 0.36, 1] }}
          >
            <h1 className="font-serif text-4xl font-normal leading-[1.08] tracking-tight text-white sm:text-6xl md:text-7xl lg:text-[5.25rem]">
              <span className="block text-white/95">{titleStart}</span>
              <span className="mt-1 block italic text-white/90 sm:mt-2">{titleHighlight}</span>
            </h1>
          </motion.div>

          {/* Promise / Subtitle with controlled reading width */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.9, delay: 0.45, ease: [0.22, 1, 0.36, 1] }}
            className="mx-auto mt-6 max-w-2xl"
          >
            <p className="text-base font-light leading-relaxed text-zinc-300 sm:text-lg md:text-xl">
              {subtitle}
            </p>
          </motion.div>

          {/* Functional CTA Button */}
          {cta && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.65, ease: [0.22, 1, 0.36, 1] }}
              className="mt-8 flex justify-center"
            >
              <Link
                href="/journeys"
                className="group inline-flex items-center gap-2 rounded-full bg-[#E4007C] px-8 py-3.5 text-sm font-semibold text-white shadow-lg shadow-[#E4007C]/25 transition-all duration-300 hover:scale-[1.02] hover:bg-[#C5006A] hover:shadow-[#E4007C]/40 active:scale-[0.98]"
              >
                <span>{cta}</span>
                <span
                  className="transition-transform duration-300 group-hover:translate-x-1"
                  aria-hidden="true"
                >
                  →
                </span>
              </Link>
            </motion.div>
          )}
        </div>
      </div>

      {/* Elegant scroll hint */}
      <div className="pointer-events-none absolute bottom-8 left-1/2 z-20 flex -translate-x-1/2 transform flex-col items-center gap-2">
        <motion.span
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.1, duration: 0.8 }}
          className="text-white/45 text-xs uppercase tracking-[0.22em]"
        >
          {scrollHint}
        </motion.span>
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 28 }}
          transition={{ delay: 1.3, duration: 0.8 }}
          className="w-[1.5px] bg-gradient-to-b from-white/40 via-[#E4007C]/40 to-transparent"
        />
      </div>
    </section>
  )
}
