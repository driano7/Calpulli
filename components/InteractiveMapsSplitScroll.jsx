import { useEffect, useRef, useState } from 'react'

function viewerUrl(embedUrl) {
  if (!embedUrl) return '#'
  const m = embedUrl.match(/[?&]mid=([^&]+)/)
  return m ? `https://www.google.com/maps/d/viewer?mid=${m[1]}` : embedUrl
}

export default function InteractiveMapsSplitScroll({ maps = [] }) {
  const [activeMapId, setActiveMapId] = useState(maps[0]?.id || '')
  const blockRefs = useRef({})

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
        rootMargin: '-40% 0px -40% 0px', // Activa cuando el elemento está en la franja central
        threshold: 0.1,
      }
    )

    Object.values(blockRefs.current).forEach((el) => {
      if (el) observer.observe(el)
    })

    return () => observer.disconnect()
  }, [maps])

  const activeMap = maps.find((m) => m.id === activeMapId) || maps[0]

  return (
    <section className="relative mx-auto w-full max-w-7xl px-4 py-12 sm:px-6 lg:px-8 lg:py-20">
      {/* Header Principal */}
      <div className="mx-auto mb-12 max-w-3xl text-center lg:mb-16">
        <span className="mb-4 inline-flex items-center gap-2 rounded-full border border-orange-500/20 bg-orange-500/10 px-4 py-1.5 text-xs font-bold uppercase tracking-widest text-orange-600 dark:text-orange-400">
          <span className="h-2 w-2 rounded-full bg-orange-500" aria-hidden />
          Guía Interactiva CDMX 2026
        </span>
        <h1 className="text-3xl font-extrabold tracking-tight text-gray-900 dark:text-white sm:text-4xl lg:text-5xl">
          Explora la Ciudad de México: Datos, Gastronomía y Zonas Clave
        </h1>
        <p className="mx-auto mt-4 max-w-2xl text-base leading-relaxed text-gray-600 dark:text-gray-300 sm:text-lg">
          Cinco mapas curados para descubrir la CDMX sin clichés: desde fondas tradicionales sin
          tacos hasta datos oficiales de seguridad, coctelería de autor y joyas que solo los locales
          conocen. Cada punto está verificado y pensado para visitantes de 2 a 7 días.
        </p>
      </div>

      <div className="grid grid-cols-1 items-start gap-8 lg:grid-cols-12 lg:gap-12">
        {/* Columna Izquierda: Bloques descriptivos con scroll natural */}
        <div className="space-y-24 lg:col-span-5 lg:space-y-40 lg:pb-32">
          {maps.map((map, index) => {
            const isActive = map.id === activeMapId
            return (
              <article
                key={map.id}
                data-id={map.id}
                ref={(el) => (blockRefs.current[map.id] = el)}
                className={`transition-all duration-300 ${
                  isActive ? 'opacity-100' : 'hover:opacity-80 lg:opacity-40'
                }`}
              >
                <div className="mb-3 flex items-center gap-2">
                  <span
                    className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wider text-white"
                    style={{ backgroundColor: map.accentColor || '#3B82F6' }}
                  >
                    {map.icon && <span aria-hidden>{map.icon}</span>}
                    {map.eyebrow}
                  </span>
                  <span className="font-mono text-xs font-bold text-gray-400 dark:text-gray-500">
                    {String(index + 1).padStart(2, '0')} / {String(maps.length).padStart(2, '0')}
                  </span>
                </div>

                <h2 className="text-2xl font-extrabold tracking-tight text-gray-900 dark:text-white sm:text-3xl">
                  {map.title}
                </h2>

                <p className="mt-4 text-base leading-relaxed text-gray-600 dark:text-gray-300 sm:text-lg">
                  {map.summary}
                </p>

                {map.highlights?.length > 0 && (
                  <ul className="mt-6 space-y-2.5">
                    {map.highlights.map((item, idx) => (
                      <li
                        key={idx}
                        className="flex items-start text-sm text-gray-700 dark:text-gray-200"
                      >
                        <span className="mr-2 text-base" style={{ color: map.accentColor }}>
                          •
                        </span>
                        {item}
                      </li>
                    ))}
                  </ul>
                )}

                {/* Mapa móvil (visible solo en pantallas pequeñas) */}
                <div className="mt-6 block overflow-hidden rounded-2xl border border-gray-200 shadow-lg dark:border-gray-800 lg:hidden">
                  <div className="h-80 w-full">
                    <iframe
                      src={map.embedUrl}
                      title={map.title}
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
                    className="flex items-center justify-center gap-1.5 bg-gray-50 px-3 py-2 text-xs font-bold text-gray-600 underline-offset-2 hover:underline dark:bg-gray-800 dark:text-gray-300"
                  >
                    Abrir en Google Maps ↗
                  </a>
                </div>
              </article>
            )
          })}
        </div>

        {/* Columna Derecha: Mapa Sticky sincronizado (Desktop) */}
        <div className="sticky top-24 hidden lg:col-span-7 lg:block">
          <div className="overflow-hidden rounded-3xl border border-gray-200/80 bg-gray-100 shadow-2xl dark:border-gray-800 dark:bg-gray-900">
            <div className="relative h-[calc(100vh-180px)] max-h-[780px] min-h-[520px] w-full">
              {maps.map((map) => {
                const isCurrent = map.id === activeMapId
                return (
                  <iframe
                    key={map.id}
                    src={map.embedUrl}
                    title={map.title}
                    className={`absolute inset-0 h-full w-full border-0 transition-opacity duration-500 ease-in-out ${
                      isCurrent
                        ? 'pointer-events-auto z-10 opacity-100'
                        : 'pointer-events-none z-0 opacity-0'
                    }`}
                    loading="lazy"
                    allowFullScreen
                    referrerPolicy="strict-origin-when-cross-origin"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  />
                )
              })}
            </div>
            {activeMap && (
              <a
                href={viewerUrl(activeMap.embedUrl)}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-1.5 bg-white px-3 py-2.5 text-xs font-bold text-gray-600 underline-offset-2 hover:underline dark:bg-gray-900 dark:text-gray-300"
              >
                Abrir en Google Maps ↗
              </a>
            )}
          </div>
        </div>
      </div>
    </section>
  )
}
