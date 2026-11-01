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
      description:
        'Explora nuestras experiencias inmersivas, rutas gastronómicas de barrio y tours privados guiados en la CDMX.',
      cta: 'Explorar Journeys →→',
      ctaHref: '/journeys',
      whatsapp: 'Preguntas, acércate a nosotros',
      whatsappHref:
        'https://wa.me/525512291607?text=Hola%20Amaxing%2C%20tengo%20preguntas%20sobre%20sus%20tours',
    },
    en: {
      badge: 'Tours & Experiences',
      title: 'Ready to experience the city in person?',
      description:
        'Explore our immersive experiences, neighborhood food routes and private guided tours in CDMX.',
      cta: 'Explore Journeys →→',
      ctaHref: '/journeys',
      whatsapp: 'Questions, get in touch with us',
      whatsappHref:
        'https://wa.me/525512291607?text=Hello%20Amaxing%2C%20I%20have%20questions%20about%20your%20tours',
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
        {/* Wave-like background orbs, similar to hero shader */}
        <div className="pointer-events-none absolute -right-20 -top-20 h-96 w-96 animate-pulse rounded-full bg-emerald-500/20 blur-[140px]" />
        <div className="pointer-events-none absolute -left-20 -bottom-20 h-96 w-96 animate-[orbit_12s_ease-in-out_infinite] rounded-full bg-violet-500/20 blur-[140px]" />
        <div className="left-1/5 pointer-events-none absolute top-1/4 h-64 w-64 animate-[float_7s_ease-in-out_infinite] rounded-full bg-emerald-400/15 blur-[100px]" />
        <div className="bottom-1/5 animate-[float_9s_ease-in-out_infinite reverse] pointer-events-none absolute right-1/4 h-64 w-64 rounded-full bg-violet-400/15 blur-[100px]" />

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
              transform: translate(25px, -35px) scale(1.15);
            }
            66% {
              transform: translate(-25px, 35px) scale(0.85);
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
              transform: translateY(-18px);
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

          <div className="flex flex-col items-end gap-3 sm:flex-row lg:flex-col xl:flex-row">
            <Link
              href={content.ctaHref}
              className="inline-flex items-center justify-center gap-2 rounded-full bg-white px-7 py-3.5 text-sm font-bold text-slate-900 shadow-lg transition-all hover:scale-105 hover:shadow-xl active:scale-95"
            >
              {content.cta}
              <span className="relative inline-block">
                <ArrowRight className="h-4 w-4 font-bold" />
                <ArrowRight className="-ml-1 h-4 w-4 font-bold" />
              </span>
            </Link>
            <a
              href={content.whatsappHref}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 rounded-full bg-[#25D366] px-7 py-3.5 text-sm font-bold text-white shadow-lg transition-all hover:bg-[#1eb253] hover:shadow-xl active:scale-95"
            >
              <MessageCircle className="h-4 w-4 text-[#1eb253]" />
              {content.whatsapp}
            </a>
          </div>
        </div>
      </div>
    </section>
  )
}
