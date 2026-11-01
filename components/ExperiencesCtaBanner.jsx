// MIT License - Copyright (c) 2024-2026 Donovan Riaño / Calpulli CDMX - See LICENSE
'use client'

import Link from '@/components/Link'
import { useLanguage } from '@/lib/hooks/useLanguage'
import { Compass, Sparkles, ArrowRight, MessageCircle } from 'lucide-react'

export default function ExperiencesCtaBanner() {
  const { currentLanguage } = useLanguage()
  const isEn = currentLanguage === 'en'
  const lang = isEn ? 'en' : 'es'

  const content = {
    es: {
      badge: 'Tours & Experiencias',
      title: '¿Listo para vivir la ciudad en persona?',
      titleAlt: '¿No encuentras la experiencia que buscabas?',
      description:
        'Explora nuestras experiencias inmersivas, rutas gastronómicas de barrio y tours privados guiados en la CDMX.',
      cta: 'Explorar Experiencias →',
      ctaHref: '/experiences',
      secondary: 'Tour a la medida',
      secondaryHref:
        'https://wa.me/525512291607?text=Hola%20Amaxing%2C%20quiero%20un%20tour%20a%20la%20medida',
    },
    en: {
      badge: 'Tours & Experiences',
      title: 'Ready to experience the city in person?',
      titleAlt: "Can't find the experience you're looking for?",
      description:
        'Explore our immersive experiences, neighborhood food routes and private guided tours in CDMX.',
      cta: 'Explore Experiences →',
      ctaHref: '/experiences',
      secondary: 'Custom tour',
      secondaryHref:
        'https://wa.me/525512291607?text=Hello%20Amaxing%2C%20I%20want%20a%20custom%20tour',
    },
  }[lang]

  return (
    <section className="mx-auto w-full max-w-6xl px-4">
      <div
        className="relative overflow-hidden rounded-3xl border border-slate-200/50 p-8 shadow-2xl backdrop-blur-md dark:border-slate-800/50 md:p-10"
        style={{
          background: 'linear-gradient(135deg, #064e3b 0%, #1e1b4b 35%, #064e3b 60%, #1e1b4b 100%)',
          backgroundSize: '200% 200%',
          animation: 'gradientMove 8s ease infinite',
        }}
      >
        {/* Animated shader-like glow orbs */}
        <div className="pointer-events-none absolute -right-14 -top-14 h-72 w-72 animate-pulse rounded-full bg-emerald-500/25 blur-[120px]" />
        <div className="pointer-events-none absolute -left-14 -bottom-14 h-72 w-72 animate-[orbit_10s_ease-in-out_infinite] rounded-full bg-violet-500/25 blur-[120px]" />
        <div className="pointer-events-none absolute top-1/3 left-1/4 h-48 w-48 animate-[float_6s_ease-in-out_infinite] rounded-full bg-emerald-400/15 blur-[80px]" />
        <div className="animate-[float_8s_ease-in-out_infinite reverse] pointer-events-none absolute bottom-1/4 right-1/3 h-48 w-48 rounded-full bg-violet-400/15 blur-[80px]" />

        <style jsx>{`
          @keyframes gradientMove {
            0% {
              background-position: 0% 50%;
            }
            50% {
              background-position: 100% 50%;
            }
            100% {
              background-position: 0% 50%;
            }
          }
          @keyframes orbit {
            0% {
              transform: translate(0, 0) scale(1);
            }
            33% {
              transform: translate(20px, -30px) scale(1.1);
            }
            66% {
              transform: translate(-20px, 30px) scale(0.9);
            }
            100% {
              transform: translate(0, 0) scale(1);
            }
          }
          @keyframes float {
            0% {
              transform: translateY(0);
            }
            50% {
              transform: translateY(-15px);
            }
            100% {
              transform: translateY(0);
            }
          }
        `}</style>

        <div className="relative flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="max-w-2xl">
            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-bold uppercase tracking-widest text-white/70 backdrop-blur">
              <Compass className="h-3.5 w-3.5 text-orange-400/80" />
              {content.badge}
              <Sparkles className="h-3 w-3 text-orange-400/80" />
            </div>
            <h2 className="text-2xl font-black leading-tight tracking-tight text-white/90 md:text-3xl">
              {content.title}
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-white/60 md:text-base">
              {content.description}
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row lg:flex-col xl:flex-row">
            <Link
              href={content.ctaHref}
              className="inline-flex items-center justify-center gap-2 rounded-full bg-white px-6 py-3 text-sm font-bold text-slate-900 shadow-lg transition-all hover:scale-105 hover:shadow-xl active:scale-95"
            >
              {content.cta}
              <ArrowRight className="h-4 w-4" />
            </Link>
            <a
              href={content.secondaryHref}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 rounded-full border border-white/20 bg-white/10 px-6 py-3 text-sm font-bold text-white backdrop-blur transition-all hover:scale-105 hover:bg-white/20 active:scale-95"
            >
              <MessageCircle className="h-4 w-4" />
              {content.secondary}
            </a>
          </div>
        </div>
      </div>
    </section>
  )
}
