// MIT License - Copyright (c) 2024-2026 Donovan Riaño / Amaxing - See LICENSE
import { useEffect, useRef, useState } from 'react'
import Link from '@/components/Link'
import { useRouter } from 'next/router'
import { useLanguage } from '@/lib/hooks/useLanguage'
import { CDMX_PAGE_HEADER, CDMX_MAPS_DATA } from '@/data/cdmxMapsData'

function viewerUrl(embedUrl) {
  if (!embedUrl) return '#'
  const m = embedUrl.match(/[?&]mid=([^&]+)/)
  return m ? `https://www.google.com/maps/d/viewer?mid=${m[1]}` : embedUrl
}

// SVG Icons minimalistas para el Dock Móvil y Badges
function DockIcon({ name, className = 'w-5 h-5' }) {
  switch (name) {
    case 'food':
      return (
        <svg
          className={className}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
          />
        </svg>
      )
    case 'safety':
      return (
        <svg
          className={className}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
          />
        </svg>
      )
    case 'nightlife':
      return (
        <svg
          className={className}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"
          />
        </svg>
      )
    case 'gem':
      return (
        <svg
          className={className}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z"
          />
        </svg>
      )
    case 'attraction':
    default:
      return (
        <svg
          className={className}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
          />
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      )
  }
}

export default function CDMXInteractiveExperience() {
  const router = useRouter()
  const { currentLanguage } = useLanguage()
  const isEn = (currentLanguage || router.locale) === 'en'
  const lang = isEn ? 'en' : 'es'
  const [activeMapId, setActiveMapId] = useState(CDMX_MAPS_DATA[0].id)
  const cardRefs = useRef({})

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const id = entry.target.getAttribute('data-id')
            if (id) setActiveMapId(id)
          }
        })
      },
      {
        root: null,
        rootMargin: '-35% 0px -35% 0px',
        threshold: 0.15,
      }
    )

    // Observe with small delay to ensure refs are mounted (fixes mobile animation not triggering)
    const timeout = setTimeout(() => {
      Object.values(cardRefs.current).forEach((el) => {
        if (el) observer.observe(el)
      })
    }, 100)

    return () => {
      clearTimeout(timeout)
      observer.disconnect()
    }
  }, [])

  return (
    <div className="relative min-h-screen w-full bg-transparent pb-12 text-slate-900 dark:text-slate-100">
      {/* 1. Header Principal: Título + Descripción General */}
      <header className="mx-auto max-w-5xl px-4 pt-16 pb-12 text-center sm:px-6 lg:pt-24 lg:pb-16">
        <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1.5 text-xs font-semibold uppercase tracking-wide text-emerald-600 dark:text-emerald-400">
          <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-500" />
          {CDMX_PAGE_HEADER[lang].badge}
        </div>
        <h1 className="text-3xl font-black leading-[1.15] tracking-tight text-slate-900 dark:text-white sm:text-5xl lg:text-6xl">
          {CDMX_PAGE_HEADER[lang].title}
        </h1>
        <p className="mx-auto mt-6 max-w-3xl text-base leading-relaxed text-slate-600 dark:text-slate-300 sm:text-xl">
          {CDMX_PAGE_HEADER[lang].description}
        </p>
      </header>

      {/* 2. Layout Dividido: Columna de Cards + Columna Sticky con Preview de Mapa */}
      <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 items-start gap-8 lg:grid-cols-12 lg:gap-12">
          {/* Columna Izquierda: Cards informativas con scroll vertical */}
          <div className="space-y-16 lg:col-span-5 lg:space-y-36 lg:py-6">
            {CDMX_MAPS_DATA.map((map, index) => {
              const isActive = map.id === activeMapId
              const eyebrow =
                lang === 'en' ? map.eyebrow_en || map.eyebrow : map.eyebrow_es || map.eyebrow
              const title = lang === 'en' ? map.title_en || map.title : map.title_es || map.title
              const cardDescription =
                lang === 'en'
                  ? map.cardDescription_en || map.cardDescription
                  : map.cardDescription_es || map.cardDescription
              const highlights =
                lang === 'en'
                  ? map.highlights_en || map.highlights
                  : map.highlights_es || map.highlights
              return (
                <article
                  key={map.id}
                  data-id={map.id}
                  ref={(el) => (cardRefs.current[map.id] = el)}
                  className={`relative rounded-3xl border bg-white p-6 transition-all duration-500 dark:bg-slate-900 sm:p-8 ${
                    isActive
                      ? 'scale-[1.02] border-slate-300 opacity-100 shadow-2xl shadow-slate-200 dark:border-slate-700 dark:shadow-black/60'
                      : 'scale-[0.98] border-slate-200/70 opacity-60 dark:border-slate-800/80 lg:opacity-40'
                  }`}
                >
                  <div className="mb-4 flex items-center justify-between gap-4">
                    <span
                      className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wider text-white shadow-sm"
                      style={{ backgroundColor: map.accentColor }}
                    >
                      <DockIcon name={map.dockIcon} className="h-3.5 w-3.5" />
                      {eyebrow}
                    </span>
                    <span className="font-mono text-xs font-bold text-slate-400 dark:text-slate-500">
                      {`0${index + 1} / 0${CDMX_MAPS_DATA.length}`}
                    </span>
                  </div>

                  <h2 className="text-2xl font-bold leading-snug tracking-tight text-slate-900 dark:text-white sm:text-3xl">
                    {title}
                  </h2>

                  <p className="mt-4 text-sm leading-relaxed text-slate-600 dark:text-slate-300 sm:text-base">
                    {cardDescription}
                  </p>

                  <Link
                    href={`/maps/${map.id}`}
                    className="mt-4 inline-flex items-center gap-1.5 rounded-full px-4 py-1.5 text-xs font-bold text-white shadow-sm transition-opacity hover:opacity-90"
                    style={{ backgroundColor: map.accentColor }}
                  >
                    {isEn ? 'See more' : 'Ver más'}
                    <span aria-hidden>→</span>
                  </Link>

                  {/* Highlights / Puntos clave */}
                  <div className="mt-6 border-t border-slate-100 pt-6 dark:border-slate-800">
                    <h3 className="mb-3 text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                      {isEn ? 'Map highlights' : 'Destacados del mapa'}
                    </h3>
                    <ul className="space-y-2.5">
                      {highlights.map((item, idx) => (
                        <li
                          key={idx}
                          className="flex items-start text-xs text-slate-700 dark:text-slate-200 sm:text-sm"
                        >
                          <span className="mr-2.5 font-bold" style={{ color: map.accentColor }}>
                            ✓
                          </span>
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Vista embebida en móvil (se muestra debajo de cada card en pantallas pequeñas) */}
                  <div className="mt-6 block overflow-hidden rounded-2xl border border-slate-200 shadow-inner dark:border-slate-800 lg:hidden">
                    <div className="h-80 w-full">
                      <iframe
                        src={map.embedUrl}
                        title={title}
                        className="h-full w-full border-0"
                        loading="lazy"
                        allowFullScreen
                        referrerPolicy="strict-origin-when-cross-origin"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      />
                    </div>
                    <a
                      href={viewerUrl(map.embedUrl)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-center gap-1.5 bg-slate-50 px-3 py-2 text-xs font-bold text-slate-600 underline-offset-2 hover:underline dark:bg-slate-800 dark:text-slate-300"
                    >
                      {isEn ? 'Open in Google Maps ↗' : 'Abrir en Google Maps ↗'}
                    </a>
                  </div>
                </article>
              )
            })}
          </div>

          {/* Columna Derecha: Contenedor Sticky con iframe de Google My Maps (Desktop) — solo activo para carga rápida */}
          {(() => {
            const activeMap = CDMX_MAPS_DATA.find((m) => m.id === activeMapId) || CDMX_MAPS_DATA[0]
            const activeTitle =
              lang === 'en'
                ? activeMap.title_en || activeMap.title
                : activeMap.title_es || activeMap.title
            return (
              <div className="sticky top-24 hidden lg:col-span-7 lg:block">
                <div className="overflow-hidden rounded-3xl border border-slate-200 bg-slate-100 shadow-2xl dark:border-slate-800 dark:bg-slate-900">
                  <div className="relative h-[calc(100vh-180px)] max-h-[820px] min-h-[560px] w-full">
                    <iframe
                      key={activeMap.id}
                      src={activeMap.embedUrl}
                      title={activeTitle}
                      className="absolute inset-0 h-full w-full border-0"
                      loading="lazy"
                      allowFullScreen
                      referrerPolicy="strict-origin-when-cross-origin"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    />
                  </div>
                  <a
                    href={viewerUrl(activeMap.embedUrl)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-1.5 bg-white px-3 py-2.5 text-xs font-bold text-slate-600 underline-offset-2 hover:underline dark:bg-slate-900 dark:text-slate-300"
                  >
                    {isEn ? 'Open in Google Maps ↗' : 'Abrir en Google Maps ↗'}
                  </a>
                </div>
              </div>
            )
          })()}
        </div>
      </main>
    </div>
  )
}
