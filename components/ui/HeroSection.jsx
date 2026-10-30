'use client'

import Link from '@/components/Link'
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion'
import { HeroMouseBackground } from '@/components/HeroMouseBackground'
import { useLanguage } from '@/lib/hooks/useLanguage'

const EDITORIAL_EASE = [0.22, 1, 0.36, 1]

export function HeroSection() {
  const { t, currentLanguage } = useLanguage()
  const reduced = useReducedMotion()
  const lang = currentLanguage || 'es'

  const eyebrow = t('hero.eyebrow') || 'JOURNEYS · CIUDAD DE MÉXICO'
  const titleStart = t('hero.titleStart') || 'La Ciudad de México,'
  const titleHighlight = t('hero.titleHighlight') || 'más allá de lo evidente.'
  const subtitle =
    t('hero.subtitle') ||
    'Journeys editoriales por los barrios, rituales e historias que revelan la esencia de la ciudad. Diseñados para descubrirla a tu propio ritmo.'
  const cta = t('hero.cta') || 'Explorar Journeys'
  const scrollHint = t('hero.scrollHint') || 'Desplázate para explorar'

  // Transition variants for Editorial Text Swap
  const eyebrowVariants = {
    initial: { opacity: 0, y: reduced ? 0 : 8 },
    animate: {
      opacity: 1,
      y: 0,
      transition: { duration: reduced ? 0.05 : 0.38, ease: EDITORIAL_EASE },
    },
    exit: {
      opacity: 0,
      y: reduced ? 0 : -8,
      transition: { duration: reduced ? 0.05 : 0.35, ease: EDITORIAL_EASE },
    },
  }

  const headlineVariants = {
    initial: { opacity: 0, y: reduced ? 0 : 12 },
    animate: {
      opacity: 1,
      y: 0,
      transition: { duration: reduced ? 0.05 : 0.4, ease: EDITORIAL_EASE },
    },
    exit: {
      opacity: 0,
      y: reduced ? 0 : -12,
      transition: { duration: reduced ? 0.05 : 0.35, ease: EDITORIAL_EASE },
    },
  }

  const subtitleVariants = {
    initial: { opacity: 0, y: reduced ? 0 : 10 },
    animate: {
      opacity: 1,
      y: 0,
      transition: {
        duration: reduced ? 0.05 : 0.4,
        delay: reduced ? 0 : 0.08,
        ease: EDITORIAL_EASE,
      },
    },
    exit: {
      opacity: 0,
      y: reduced ? 0 : -10,
      transition: { duration: reduced ? 0.05 : 0.35, ease: EDITORIAL_EASE },
    },
  }

  const ctaVariants = {
    initial: { opacity: 0, y: reduced ? 0 : 6 },
    animate: {
      opacity: 1,
      y: 0,
      transition: {
        duration: reduced ? 0.05 : 0.35,
        delay: reduced ? 0 : 0.1,
        ease: EDITORIAL_EASE,
      },
    },
    exit: {
      opacity: 0,
      y: reduced ? 0 : -6,
      transition: { duration: reduced ? 0.05 : 0.3, ease: EDITORIAL_EASE },
    },
  }

  return (
    <section className="relative left-1/2 -mt-20 flex min-h-[100dvh] w-screen max-w-[100vw] -translate-x-1/2 items-center justify-center overflow-hidden bg-[#FAF3EA] pt-20 text-zinc-900 transition-colors duration-700 dark:bg-black dark:text-white">
      {/* Background with fluid WebGL waves (Atmospheric Shader Transition) */}
      <HeroMouseBackground />

      {/* Main hero typography & content */}
      <div className="container relative z-10 mx-auto flex min-h-[calc(100dvh-5rem)] flex-col items-center justify-center px-6 py-20 text-center">
        <div className="mx-auto w-full max-w-4xl">
          {/* Eyebrow — Editorial Text Swap */}
          <div className="mb-6 flex min-h-[2rem] items-center justify-center">
            <span className="inline-flex items-center gap-2 rounded-full border border-orange-500/30 bg-orange-500/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.22em] text-[#E4007C] backdrop-blur-md">
              <span className="h-1.5 w-1.5 rounded-full bg-[#E4007C]" aria-hidden="true" />
              <AnimatePresence mode="wait" initial={false}>
                <motion.span
                  key={lang}
                  variants={eyebrowVariants}
                  initial="initial"
                  animate="animate"
                  exit="exit"
                  className="inline-block"
                >
                  {eyebrow}
                </motion.span>
              </AnimatePresence>
            </span>
          </div>

          {/* Centered Headline — Stabilized height block to prevent layout shifts */}
          <div className="flex min-h-[6.5rem] flex-col items-center justify-center sm:min-h-[8.5rem] md:min-h-[10.5rem] lg:min-h-[12rem]">
            <AnimatePresence mode="wait" initial={false}>
              <motion.div
                key={lang}
                variants={headlineVariants}
                initial="initial"
                animate="animate"
                exit="exit"
                className="w-full text-center"
              >
                <h1 className="font-serif text-4xl font-normal leading-[1.08] tracking-tight text-zinc-900 dark:text-white sm:text-6xl md:text-7xl lg:text-[5.25rem]">
                  <span className="block text-zinc-900/95 dark:text-white/95">{titleStart}</span>
                  <span className="mt-1 block italic text-zinc-800/90 dark:text-white/90 sm:mt-2">
                    {titleHighlight}
                  </span>
                </h1>
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Promise / Subtitle — Staggered ~80ms editorial swap */}
          <div className="mx-auto mt-6 flex min-h-[4.75rem] max-w-2xl items-center justify-center sm:min-h-[4.25rem]">
            <AnimatePresence mode="wait" initial={false}>
              <motion.div
                key={lang}
                variants={subtitleVariants}
                initial="initial"
                animate="animate"
                exit="exit"
                className="w-full text-center"
              >
                <p className="text-base font-light leading-relaxed text-zinc-600 dark:text-zinc-300 sm:text-lg md:text-xl">
                  {subtitle}
                </p>
              </motion.div>
            </AnimatePresence>
          </div>

          {/* CTA Button — Custom Pink-to-Purple Gradient from "¿Quieres tu propio Journey?" */}
          {cta && (
            <div className="mt-8 flex justify-center">
              <Link
                href="/journeys"
                style={{
                  background:
                    'linear-gradient(135deg, #DE1D8D 0%, #BE1588 25%, #9F0E7F 50%, #7B2BD9 75%, #6A0568 100%)',
                }}
                className="hover:shadow-[#7B2BD9]/45 group inline-flex items-center gap-2 rounded-full px-8 py-3.5 text-sm font-semibold text-white shadow-lg shadow-[#DE1D8D]/30 transition-all duration-300 hover:scale-[1.03] active:scale-[0.98]"
              >
                <AnimatePresence mode="wait" initial={false}>
                  <motion.span
                    key={lang}
                    variants={ctaVariants}
                    initial="initial"
                    animate="animate"
                    exit="exit"
                    className="inline-block"
                  >
                    {cta}
                  </motion.span>
                </AnimatePresence>
                <span
                  className="transition-transform duration-300 group-hover:translate-x-1"
                  aria-hidden="true"
                >
                  →
                </span>
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* Elegant scroll hint */}
      <div className="pointer-events-none absolute bottom-8 left-1/2 z-20 flex -translate-x-1/2 transform flex-col items-center gap-2">
        <AnimatePresence mode="wait" initial={false}>
          <motion.span
            key={lang}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="dark:text-white/45 text-xs uppercase tracking-[0.22em] text-zinc-500"
          >
            {scrollHint}
          </motion.span>
        </AnimatePresence>
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 28 }}
          transition={{ delay: 0.8, duration: 0.8 }}
          className="w-[1.5px] bg-gradient-to-b from-zinc-400/40 via-[#E4007C]/40 to-transparent dark:from-white/40"
        />
      </div>
    </section>
  )
}
