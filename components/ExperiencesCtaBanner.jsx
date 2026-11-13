// MIT License - Copyright (c) 2024-2026 Donovan Riaño / Calpulli CDMX - See LICENSE
'use client'

import Link from '@/components/Link'
import { useLanguage } from '@/lib/hooks/useLanguage'
import { ArrowRight, Compass, Phone, Sparkles } from 'lucide-react'

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
      cta: 'Explorar Journeys →',
      ctaHref: '/journeys',
      whatsapp: 'Preguntas, acércate a nosotros',
      whatsappHref:
        'https://wa.me/525512291607?text=Hola%20Calpulli%20CDMX%2C%20tengo%20preguntas%20sobre%20sus%20tours',
    },
    en: {
      badge: 'Tours & Experiences',
      title: 'Ready to experience the city in person?',
      description:
        'Explore our immersive experiences, neighborhood food routes and private guided tours in CDMX.',
      cta: 'Explore Journeys →',
      ctaHref: '/journeys',
      whatsapp: 'Questions, get in touch with us',
      whatsappHref:
        'https://wa.me/525512291607?text=Hello%20Calpulli%20CDMX%2C%20I%20have%20questions%20about%20your%20tours',
    },
  }[lang]

  return (
    <section className="mx-auto w-full max-w-6xl px-4">
      <div
        className="relative overflow-hidden rounded-3xl border border-white/20 p-8 shadow-2xl backdrop-blur-md dark:border-white/10 md:p-10"
        style={{
          background:
            'linear-gradient(135deg, #2A1A1A 0%, #7B2BD9 25%, #C1440E 50%, #E4007C 75%, #1A0A0A 100%)',
          backgroundSize: '200% 200%',
          animation: 'gradientMove 8s ease infinite',
        }}
      >
        {/* White decorative lines moving like hero - MORE VISIBLE */}
        <div className="pointer-events-none absolute top-0 left-0 h-[2px] w-full animate-[lineMove_4s_ease-in-out_infinite] bg-white/60" />
        <div className="pointer-events-none absolute bottom-0 left-0 h-[2px] w-full animate-[lineMove_6s_ease-in-out_infinite_reverse] bg-white/50" />
        <div className="bg-white/45 pointer-events-none absolute left-0 top-0 h-full w-[2px] animate-[lineMove_5s_ease-in-out_infinite]" />
        <div className="pointer-events-none absolute right-0 top-0 h-full w-[2px] animate-[lineMove_7s_ease-in-out_infinite_reverse] bg-white/40" />

        {/* Black decorative lines on lighter gradient zones */}
        <div className="pointer-events-none absolute top-1/4 left-1/4 h-full w-[2px] animate-[lineMove_5s_ease-in-out_infinite_reverse] bg-black/40" />
        <div className="bg-black/35 pointer-events-none absolute bottom-1/4 right-1/4 h-full w-[2px] animate-[lineMove_7s_ease-in-out_infinite]" />

        {/* Ambient glows: terracotta / rosa / marrón */}
        <div className="pointer-events-none absolute -right-24 -top-24 h-[700px] w-[700px] animate-pulse rounded-full bg-[#E4007C]/25 blur-[200px]" />
        <div className="pointer-events-none absolute -left-24 -bottom-24 h-[700px] w-[700px] animate-[orbit_14s_ease-in-out_infinite] rounded-full bg-[#C1440E]/20 blur-[200px]" />
        <div className="top-1/5 left-1/6 pointer-events-none absolute h-[500px] w-[500px] animate-[float_8s_ease-in-out_infinite] rounded-full bg-[#7B2BD9]/25 blur-[160px]" />
        <div className="bottom-1/6 right-1/5 animate-[float_10s_ease-in-out_infinite reverse] pointer-events-none absolute h-[500px] w-[500px] rounded-full bg-[#E4007C]/20 blur-[160px]" />
        <div className="animate-[orbit_11s_ease-in-out_infinite reverse] pointer-events-none absolute top-1/3 right-1/3 h-[400px] w-[400px] rounded-full bg-[#C1440E]/15 blur-[120px]" />
        <div className="pointer-events-none absolute bottom-1/3 left-1/3 h-[400px] w-[400px] animate-[float_6s_ease-in-out_infinite] rounded-full bg-[#7B2BD9]/15 blur-[120px]" />

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
          @keyframes lineMove {
            0% {
              transform: translateX(-100%);
              opacity: 0.4;
            }
            50% {
              transform: translateX(200%);
              opacity: 0.9;
            }
            100% {
              transform: translateX(-100%);
              opacity: 0.4;
            }
          }
          @keyframes lineMove_reverse {
            0% {
              transform: translateX(200%);
              opacity: 0.4;
            }
            50% {
              transform: translateX(-100%);
              opacity: 0.9;
            }
            100% {
              transform: translateX(200%);
              opacity: 0.4;
            }
          }
          @keyframes orbit {
            0% {
              transform: translate(0, 0) scale(1);
            }
            33% {
              transform: translate(30px, -40px) scale(1.2);
            }
            66% {
              transform: translate(-30px, 40px) scale(0.8);
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
              transform: translateY(-22px);
            }
            100% {
              transform: translateY(0);
            }
          }
        `}</style>

        <div className="relative flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="max-w-2xl">
            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/5 px-3 py-1 text-xs font-bold uppercase tracking-widest text-white/80 backdrop-blur">
              <Compass className="h-3.5 w-3.5 text-[#E4007C]" />
              {content.badge}
              <Sparkles className="h-3 w-3 text-[#E4007C]" />
            </div>
            <h2 className="mb-2 text-2xl font-black leading-tight tracking-tight text-white md:text-3xl">
              {content.title}
            </h2>
            <p className="text-sm leading-relaxed text-white/70 md:text-base">
              {content.description}
            </p>
          </div>

          <div className="flex flex-col items-end gap-3 sm:flex-row lg:flex-col xl:flex-row">
            {/* Journeys button: black chip, single arrow */}
            <Link
              href={content.ctaHref}
              className="mt-4 inline-flex items-center justify-center gap-2 rounded-full bg-black px-8 py-4 text-sm font-bold text-white shadow-lg transition-all hover:bg-white hover:text-black active:scale-95"
            >
              {content.cta}
              <ArrowRight className="h-4 w-4 font-bold text-black" />
            </Link>
            <a
              href={content.whatsappHref}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-4 inline-flex items-center justify-center gap-2 rounded-full bg-[#25D366] px-7 py-3.5 text-sm font-bold text-white shadow-lg transition-all hover:bg-[#1eb253] hover:shadow-xl active:scale-95 sm:mt-0"
            >
              <Phone className="h-4 w-4 text-[#1eb253]" />
              {content.whatsapp}
            </a>
          </div>
        </div>
      </div>
    </section>
  )
}
