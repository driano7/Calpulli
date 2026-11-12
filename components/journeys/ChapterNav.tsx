'use client'

// MIT License - Copyright (c) 2024-2026 Donovan Riaño / Calpulli CDMX - See LICENSE
import { useEffect, useState, type ReactNode } from 'react'
import { motion, useReducedMotion } from 'framer-motion'

export interface ChapterRef {
  id: string
  title: string
  number: number
}

interface ChapterNavProps {
  chapters: ChapterRef[]
  /** Color de la barra de progreso. Por defecto, talavera. */
  accent?: string
  title: string
  /**
   * Control que se dibuja ARRIBA de la lista de capitulos. Aqui va el
   * "ver todo el detalle", para que el usuario lo encuentre justo donde
   * esta la lista de los capitulos.
   */
  header?: ReactNode
}

/**
 * Navegación por capítulos del journey.
 *
 * - Barra de progreso de lectura en talavera: representa el avance por el
 *   contenido, NO una distancia física ni un porcentaje de recorrido.
 * - Índice de capítulos: permite volver a cualquiera sin perder el contexto.
 *
 * Es accesible: la lista es un <nav> con enlaces internos reales, el estado
 * activo se marca con aria-current, y el progreso se anuncia como texto para
 * lectores de pantalla. En móvil la lista se colapsa en un botón que abre el
 * índice, para no tapar el contenido.
 */
export function ChapterNav({ chapters, accent = '#0E8C7A', title, header }: ChapterNavProps) {
  const [activeId, setActiveId] = useState<string>('')
  const [progress, setProgress] = useState(0)
  const [open, setOpen] = useState(false)
  const reduced = useReducedMotion()

  useEffect(() => {
    const onScroll = () => {
      const doc = document.documentElement
      const total = doc.scrollHeight - doc.clientHeight
      setProgress(total > 0 ? Math.min(1, doc.scrollTop / total) : 0)
    }
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll)
    return () => {
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
    }
  }, [])

  // Capítulo activo: el último cuyo encabezado ya pasó por el inicio del viewport.
  useEffect(() => {
    const headings = chapters
      .map((c) => document.getElementById(c.id))
      .filter((el): el is HTMLElement => Boolean(el))

    if (!headings.length) return undefined

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)
        if (visible[0]) setActiveId(visible[0].target.id)
      },
      { rootMargin: '-45% 0px -50% 0px', threshold: 0 }
    )

    headings.forEach((h) => observer.observe(h))
    return () => observer.disconnect()
  }, [chapters])

  const activeChapter = chapters.find((c) => c.id === activeId)

  return (
    <>
      {/* Barra de progreso de lectura */}
      <div
        className="fixed inset-x-0 top-0 z-40 h-1 bg-transparent"
        role="progressbar"
        aria-label={`Progreso de lectura de ${title}`}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(progress * 100)}
      >
        <div
          className="h-full origin-left"
          style={{
            backgroundColor: accent,
            transform: `scaleX(${progress})`,
            transition: reduced ? 'none' : 'transform 120ms linear',
          }}
        />
      </div>

      {/* Índice de capítulos (escritorio) */}
      <nav
        aria-label={`Capítulos de ${title}`}
        className="fixed right-6 top-1/2 z-30 hidden -translate-y-1/2 lg:block"
      >
        {header && <div className="mb-4 w-56">{header}</div>}
        <ol className="flex flex-col items-end gap-3">
          {chapters.map((chapter) => {
            const isActive = chapter.id === activeId
            return (
              <li key={chapter.id}>
                <a
                  href={`#${chapter.id}`}
                  aria-current={isActive ? 'true' : undefined}
                  className="group flex items-center gap-2 text-right"
                >
                  <span
                    className={`text-xs font-semibold tracking-wide transition-opacity ${
                      isActive
                        ? 'opacity-100'
                        : 'opacity-0 group-hover:opacity-70 group-focus-visible:opacity-100'
                    }`}
                    style={{ color: isActive ? accent : undefined }}
                  >
                    {chapter.title}
                  </span>
                  <span
                    aria-hidden
                    className="block h-1.5 rounded-full transition-all duration-300"
                    style={{
                      width: isActive ? 22 : 8,
                      backgroundColor: isActive ? accent : 'rgba(120,113,108,0.4)',
                    }}
                  />
                </a>
              </li>
            )
          })}
        </ol>
      </nav>

      {/* Índice de capítulos (móvil) */}
      <div className="lg:hidden">
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          aria-controls="journey-chapter-list"
          className="fixed bottom-[8.75rem] right-4 z-50 flex items-center gap-2 rounded-full px-4 py-3 text-xs font-semibold text-white shadow-lg sm:bottom-5"
          style={{ backgroundColor: accent }}
        >
          <span className="tabular-nums">
            {activeChapter ? `${activeChapter.number}/${chapters.length}` : `${chapters.length}`}
          </span>
          <span>Capítulos</span>
        </button>

        {open && (
          <div
            id="journey-chapter-list"
            className="fixed inset-x-0 bottom-[8.75rem] z-50 max-h-[70vh] overflow-y-auto rounded-t-2xl bg-zinc-900/95 p-5 backdrop-blur sm:bottom-0"
          >
            <div className="mb-3 flex items-center justify-between">
              <p className="text-sm font-semibold text-white">{title}</p>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-full border border-white/25 px-3 py-1 text-xs text-white"
              >
                Cerrar
              </button>
            </div>
            <ol className="space-y-1">
              {chapters.map((chapter) => (
                <li key={chapter.id}>
                  <a
                    href={`#${chapter.id}`}
                    onClick={() => setOpen(false)}
                    aria-current={chapter.id === activeId ? 'true' : undefined}
                    className="flex items-baseline gap-3 rounded-lg px-3 py-3 text-zinc-100"
                    style={chapter.id === activeId ? { backgroundColor: `${accent}33` } : undefined}
                  >
                    <span
                      className="text-xs tabular-nums"
                      style={{ color: chapter.id === activeId ? accent : undefined }}
                    >
                      {String(chapter.number).padStart(2, '0')}
                    </span>
                    <span className="text-sm">{chapter.title}</span>
                  </a>
                </li>
              ))}
            </ol>
          </div>
        )}
      </div>
    </>
  )
}
