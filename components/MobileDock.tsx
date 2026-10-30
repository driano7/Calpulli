'use client'

import { useCallback, useEffect, useRef, useState, type ComponentType } from 'react'
import { useRouter } from 'next/router'
import classNames from 'classnames'
import { motion, useReducedMotion } from 'framer-motion'
import { Footprints, BookOpen, Star, Users, MapPinned } from 'lucide-react'
import Link from '@/components/Link'
import { useLanguage } from '@/lib/hooks/useLanguage'

const DOCK_ITEMS = [
  {
    href: '/journeys',
    icon: Footprints,
    labelKey: 'header.nav.journeys',
    fallback: 'Journeys',
  },
  { href: '/maps', icon: MapPinned, labelKey: 'header.nav.maps', fallback: 'Maps' },
  { href: '/guides', icon: BookOpen, labelKey: 'header.nav.guides', fallback: 'Guides' },
  { href: '/local', icon: Star, labelKey: 'header.nav.localPicks', fallback: 'Selección Local' },
  { href: '/about', icon: Users, labelKey: 'header.nav.about', fallback: 'About Us' },
]

const DOCK_BUTTON_BASE = 'flex items-center justify-center rounded-xl transition'
const DOCK_BUTTON_ACTIVE = 'bg-orange-500 text-white shadow-lg'
const DOCK_BUTTON_INACTIVE =
  'text-zinc-600 hover:bg-orange-500/10 hover:text-orange-500 dark:text-zinc-300 dark:hover:bg-orange-500/10 dark:hover:text-orange-400'

const isActiveRoute = (pathname: string, href: string) => {
  if (href === '/') return pathname === '/'
  return pathname === href || pathname.startsWith(`${href}/`)
}

export function MobileDock() {
  const router = useRouter()
  const { t, currentLanguage } = useLanguage()
  const isEs = currentLanguage !== 'en'
  const reducedMotion = useReducedMotion()
  const currentPath = (router.asPath || router.pathname || '/').split('?')[0]
  const [compact, setCompact] = useState(false)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const getLabel = (item: { labelKey: string; fallback: string }) => {
    const val = t(item.labelKey)
    return val === item.labelKey ? item.fallback : val
  }

  // El dock nunca se oculta: tras inactividad o scroll hacia abajo solo se
  // compacta (estilo EarningsAI). Cualquier interacción lo vuelve a expandir.
  const resetTimer = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current)
    setCompact(false)
    timerRef.current = setTimeout(() => setCompact(true), 10000)
  }, [])

  useEffect(() => {
    resetTimer()
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [router.pathname, resetTimer])

  useEffect(() => {
    const events = ['pointerdown', 'focusin']
    events.forEach((event) => document.addEventListener(event, resetTimer, { passive: true }))
    return () => events.forEach((event) => document.removeEventListener(event, resetTimer))
  }, [resetTimer])

  useEffect(() => {
    let lastY = window.scrollY
    const onScroll = () => {
      const y = window.scrollY
      if (y > lastY) {
        setCompact(true)
        if (timerRef.current) clearTimeout(timerRef.current)
        timerRef.current = setTimeout(() => setCompact(true), 10000)
      } else {
        resetTimer()
      }
      lastY = y
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [resetTimer])

  return (
    <div className="fixed inset-x-0 bottom-0 z-40 flex justify-center px-4 pb-[calc(0.75rem+env(safe-area-inset-bottom))] sm:hidden">
      <nav
        aria-label="Navegación móvil"
        className={classNames(
          'flex items-center justify-center gap-1 rounded-full border border-zinc-200/60 bg-white/90 py-1 shadow-2xl backdrop-blur-md transition-all duration-300 dark:border-zinc-800 dark:bg-zinc-950/90 dark:text-white',
          compact ? 'px-1.5' : 'px-2'
        )}
      >
        <div
          className={classNames(
            'mx-0.5 w-px shrink-0 bg-zinc-300 transition-all duration-300 dark:bg-zinc-700',
            compact ? 'h-5' : 'h-7'
          )}
          aria-hidden="true"
        ></div>

        {/* Navegación principal */}
        {DOCK_ITEMS.map((item, index) => {
          const Icon: ComponentType<{ className?: string }> = item.icon
          const active = isActiveRoute(router.pathname, item.href)
          const label = getLabel(item)
          return (
            <motion.div
              key={item.href}
              initial={reducedMotion ? false : { opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.16 + index * 0.08 }}
            >
              <Link
                href={item.href}
                aria-label={label}
                title={label}
                onClick={resetTimer}
                className={classNames(
                  DOCK_BUTTON_BASE,
                  compact ? 'h-10 w-10' : 'h-11 w-11',
                  active ? DOCK_BUTTON_ACTIVE : DOCK_BUTTON_INACTIVE
                )}
              >
                <Icon className={compact ? 'h-4 w-4' : 'h-5 w-5'} />
              </Link>
            </motion.div>
          )
        })}
      </nav>
    </div>
  )
}

export default MobileDock
