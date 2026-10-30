'use client'

import Link from '@/components/Link'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { HeroMouseBackground } from '@/components/HeroMouseBackground'
import { useLanguage } from '@/lib/hooks/useLanguage'

const EDITORIAL_EASE = [0.22, 1, 0.36, 1]
const TEXT_BLUR = 3.5
// Both locales are rendered invisibly as layout sizers so the headline,
// subtitle and buttons keep the exact same footprint when copy changes.
const SITE_LANGUAGES = ['es', 'en']

/**
 * Editorial Crossfade with Soft Blur.
 *
 * The outgoing copy loses opacity and focus while the incoming copy resolves
 * from a soft blur in the exact same position. No vertical/horizontal travel,
 * no per-word animation and no layout jump between locales.
 */
function EditorialCrossfade({
  lang,
  children,
  sizers,
  delay = 0,
  duration = 0.5,
  blur = TEXT_BLUR,
  reduced = false,
  fullWidth = false,
}) {
  const useBlur = !reduced && blur > 0
  const hiddenFilter = useBlur ? { filter: `blur(${blur}px)` } : {}
  const clearFilter = useBlur ? { filter: 'blur(0px)' } : {}

  return (
    <div className={`relative grid items-start justify-items-center ${fullWidth ? 'w-full' : ''}`}>
      {/* Invisible bilingual sizers: reserve the max height/width of both locales */}
      <div
        aria-hidden="true"
        className={`invisible col-start-1 row-start-1 grid select-none ${
          fullWidth ? 'w-full' : ''
        }`}
      >
        {sizers.map((sizer, index) => (
          <div key={index} className={`col-start-1 row-start-1 ${fullWidth ? 'w-full' : ''}`}>
            {sizer}
          </div>
        ))}
      </div>

      <AnimatePresence initial={false}>
        <motion.div
          key={lang}
          initial={{ opacity: 0, ...hiddenFilter }}
          animate={{
            opacity: 1,
            ...clearFilter,
            transition: {
              duration: reduced ? 0.12 : duration,
              delay: reduced ? 0 : delay,
              ease: EDITORIAL_EASE,
            },
          }}
          exit={{
            opacity: 0,
            ...hiddenFilter,
            transition: {
              // Exit quickly so the outgoing copy never ghosts behind the
              // incoming language while it resolves from blur.
              duration: reduced ? 0.12 : 0.16,
              ease: EDITORIAL_EASE,
            },
          }}
          className={`col-start-1 row-start-1 ${fullWidth ? 'w-full' : ''}`}
          style={{ willChange: useBlur ? 'opacity, filter' : 'opacity' }}
        >
          {children}
        </motion.div>
      </AnimatePresence>
    </div>
  )
}

export function HeroSection() {
  const { t, currentLanguage } = useLanguage()
  const reduced = useReducedMotion() ?? false
  const lang = currentLanguage || 'es'

  const cta = t('hero.cta')
  const scrollHint = t('hero.scrollHint')

  const renderHeadline = (locale, heading = false) => {
    const Tag = heading ? 'h1' : 'div'
    return (
      <Tag className="w-full text-center font-serif text-4xl font-normal leading-[1.08] tracking-tight text-zinc-900 dark:text-white sm:text-6xl md:text-7xl lg:text-[5.25rem]">
        <span className="block text-zinc-900/95 dark:text-white/95">
          {t('hero.titleStart', locale)}
        </span>
        <span className="mt-1 block italic text-zinc-800/90 dark:text-white/90 sm:mt-2">
          {t('hero.titleHighlight', locale)}
        </span>
      </Tag>
    )
  }

  const renderSubtitle = (locale, paragraph = false) => {
    const Tag = paragraph ? 'p' : 'div'
    return (
      <Tag className="w-full text-center text-base font-light leading-relaxed text-zinc-600 dark:text-zinc-300 sm:text-lg md:text-xl">
        {t('hero.subtitle', locale)}
      </Tag>
    )
  }

  const renderEyebrow = (locale) => (
    <span className="inline-block whitespace-nowrap">{t('hero.eyebrow', locale)}</span>
  )

  const renderCta = (locale) => (
    <span className="inline-block whitespace-nowrap">{t('hero.cta', locale)}</span>
  )

  const renderScrollHint = (locale) => (
    <span className="dark:text-white/45 inline-block whitespace-nowrap text-xs uppercase tracking-[0.22em] text-zinc-500">
      {t('hero.scrollHint', locale)}
    </span>
  )

  return (
    <section
      data-lang-transition-skip="true"
      className="relative left-1/2 -mt-20 flex min-h-[100dvh] w-screen max-w-[100vw] -translate-x-1/2 items-center justify-center overflow-hidden bg-[#FAF3EA] pt-20 text-zinc-900 transition-colors duration-700 dark:bg-black dark:text-white"
    >
      {/* Background with fluid WebGL waves (Atmospheric Shader Transition) */}
      <HeroMouseBackground />

      {/* Main hero typography & content */}
      <div className="container relative z-10 mx-auto flex min-h-[calc(100dvh-5rem)] flex-col items-center justify-center px-6 py-20 text-center">
        <div className="mx-auto w-full max-w-4xl">
          {/* Eyebrow — simple crossfade, no travel */}
          <div className="mb-6 flex min-h-[2rem] items-center justify-center">
            <div className="inline-flex items-center gap-2 rounded-full border border-orange-500/30 bg-orange-500/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.22em] text-[#E4007C] backdrop-blur-md">
              <span className="h-1.5 w-1.5 rounded-full bg-[#E4007C]" aria-hidden="true" />
              <EditorialCrossfade
                lang={lang}
                sizers={SITE_LANGUAGES.map((locale) => renderEyebrow(locale))}
                delay={0.04}
                duration={0.3}
                blur={0}
                reduced={reduced}
              >
                {renderEyebrow(lang)}
              </EditorialCrossfade>
            </div>
          </div>

          {/* Centered headline — crossfade with soft blur, footprint reserved for both locales */}
          <EditorialCrossfade
            lang={lang}
            fullWidth
            sizers={SITE_LANGUAGES.map((locale) => renderHeadline(locale))}
            delay={0.04}
            duration={0.5}
            reduced={reduced}
          >
            {renderHeadline(lang, true)}
          </EditorialCrossfade>

          {/* Promise / Subtitle — same crossfade, staggered ~100 ms after the headline */}
          <div className="mx-auto mt-6 w-full max-w-2xl">
            <EditorialCrossfade
              lang={lang}
              fullWidth
              sizers={SITE_LANGUAGES.map((locale) => renderSubtitle(locale))}
              delay={0.14}
              duration={0.5}
              reduced={reduced}
            >
              {renderSubtitle(lang, true)}
            </EditorialCrossfade>
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
                <EditorialCrossfade
                  lang={lang}
                  sizers={SITE_LANGUAGES.map((locale) => renderCta(locale))}
                  delay={0.06}
                  duration={0.34}
                  blur={0}
                  reduced={reduced}
                >
                  {renderCta(lang)}
                </EditorialCrossfade>
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
        <EditorialCrossfade
          lang={lang}
          sizers={SITE_LANGUAGES.map((locale) => renderScrollHint(locale))}
          delay={0.04}
          duration={0.3}
          blur={0}
          reduced={reduced}
        >
          <span className="dark:text-white/45 inline-block whitespace-nowrap text-xs uppercase tracking-[0.22em] text-zinc-500">
            {scrollHint}
          </span>
        </EditorialCrossfade>
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
