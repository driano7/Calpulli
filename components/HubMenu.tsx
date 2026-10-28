'use client'

import Link from '@/components/Link'
import { motion, AnimatePresence, useMotionValue, useSpring, useReducedMotion } from 'framer-motion'
import { useEffect, useRef, useState, useCallback, type RefObject } from 'react'
import classNames from 'classnames'
import {
  FileText,
  Utensils,
  Skull,
  MapPin,
  Palette,
  Compass,
  BookOpen,
  Star,
  Home,
  MapPinned,
  Mail,
  Tag,
  LayoutGrid,
} from 'lucide-react'
import { useLanguage } from '@/lib/hooks/useLanguage'
import { drawerItemsConfig } from '@/data/hubMenuLinks'

// Use a type that works both server and client
type DivRef = RefObject<HTMLDivElement | null>

const iconComponents = {
  Utensils,
  Skull,
  MapPin,
  Palette,
  Compass,
  BookOpen,
  Star,
  Home,
  MapPinned,
  Mail,
  Tag,
  LayoutGrid,
}

const getLabel = (item, t) => {
  if (item.labelKey) {
    const val = t(item.labelKey)
    return val === item.labelKey ? item.fallback : val
  }
  if (item.label) return item.label
  return item.fallback || item.href
}

export function HubMenu({ showTrigger = true }) {
  const [isOpen, setIsOpen] = useState(false)
  const reducedMotion = useReducedMotion()
  const { t } = useLanguage()

  // Framer Motion drag for the bottom sheet
  const dragY = useMotionValue(0)
  const dragYSpring = useSpring(dragY, { stiffness: 500, damping: 30 })
  const sheetRef: DivRef = useRef(null)
  const sheetHeight = useRef(0)
  const isDragging = useRef(false)

  const openMenu = useCallback(() => {
    setIsOpen(true)
    dragY.set(0)
  }, [dragY])

  // Permitir que el MobileDock abra el hubmenu (evento global, estado único)
  useEffect(() => {
    const handleOpen = () => openMenu()
    window.addEventListener('open-calpulli-hubmenu', handleOpen)
    return () => window.removeEventListener('open-calpulli-hubmenu', handleOpen)
  }, [openMenu])

  const closeMenu = useCallback(() => {
    setIsOpen(false)
    dragY.set(0)
  }, [dragY])

  const toggleMenu = useCallback(() => {
    if (isOpen) {
      closeMenu()
    } else {
      openMenu()
    }
  }, [isOpen, openMenu, closeMenu])

  const handleDragEnd = (_event, info) => {
    isDragging.current = false
    const velocity = info.velocity
    const offset = dragY.get()

    // Close if dragged down more than 30% of height or fast downward swipe
    if (offset > sheetHeight.current * 0.3 || velocity > 500) {
      closeMenu()
    } else {
      dragY.set(0)
    }
  }

  const handleDrag = (_event, info) => {
    const offset = info.offset.y
    // Only allow dragging down to close
    if (offset > 0) {
      dragY.set(offset)
    }
  }

  // Measure sheet height
  useEffect(() => {
    if (sheetRef.current) {
      sheetHeight.current = sheetRef.current.offsetHeight
    }
  }, [isOpen])

  // Close on Escape
  useEffect(() => {
    if (!isOpen) return undefined
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        closeMenu()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, closeMenu])

  // Close when a link is selected (any navigation)
  useEffect(() => {
    if (!isOpen) return undefined
    const handleRouteChange = () => closeMenu()
    window.addEventListener('popstate', handleRouteChange)
    return () => window.removeEventListener('popstate', handleRouteChange)
  }, [isOpen, closeMenu])

  // Prevent body scroll while open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [isOpen])

  return (
    <>
      {/* Trigger — doc icon, visible on mobile and desktop (ocultable desde el header) */}
      {showTrigger && (
        <button
          type="button"
          onClick={toggleMenu}
          aria-label={isOpen ? 'Close menu' : 'Open menu'}
          aria-expanded={isOpen}
          aria-haspopup="dialog"
          className={classNames(
            'relative flex h-10 w-10 items-center justify-center rounded-full text-white shadow-lg transition-transform hover:scale-110 active:scale-95',
            isOpen ? 'bg-zinc-700 dark:bg-zinc-300 dark:text-zinc-900' : 'bg-orange-500'
          )}
        >
          <FileText className="h-5 w-5" />
        </button>
      )}

      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop — click/tap outside to close */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: reducedMotion ? 0 : 0.2 }}
              className="fixed inset-0 z-50 bg-black/40 dark:bg-black/60"
              onClick={closeMenu}
              aria-hidden="true"
            />

            {/* Bottom sheet with drag gesture */}
            <motion.div
              ref={sheetRef}
              drag={reducedMotion ? false : 'y'}
              dragConstraints={{ top: 0, bottom: 0 }}
              dragMomentum={false}
              dragElastic={0.2}
              onDragStart={() => {
                isDragging.current = true
              }}
              onDrag={handleDrag}
              onDragEnd={handleDragEnd}
              style={reducedMotion ? undefined : { y: dragYSpring }}
              className="fixed inset-x-0 bottom-0 z-50 flex justify-center px-3 pb-3"
            >
              <motion.div
                initial={{ opacity: 0, y: '100%' }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: '100%' }}
                transition={{
                  type: reducedMotion ? 'tween' : 'spring',
                  stiffness: 500,
                  damping: 40,
                  duration: reducedMotion ? 0 : undefined,
                }}
                className="relative flex max-h-[80vh] w-full max-w-md flex-col overflow-hidden rounded-3xl border border-zinc-200/50 bg-white text-zinc-900 shadow-[0_-20px_60px_rgba(15,23,42,0.14)] dark:border-zinc-800/50 dark:bg-zinc-950 dark:text-white dark:shadow-[0_-24px_80px_rgba(0,0,0,0.5)]"
              >
                {/* Drag Handle */}
                <div className="flex h-14 items-center justify-center border-b border-zinc-200/50 px-4 dark:border-zinc-800/50">
                  <div
                    className="mx-auto h-1.5 w-10 rounded-full bg-zinc-300 dark:bg-zinc-700"
                    aria-hidden="true"
                  />
                </div>

                {/* Nav Items */}
                <motion.nav
                  className="flex-1 space-y-1 overflow-y-auto px-6 py-4"
                  variants={{ open: { transition: { staggerChildren: 0.03, delayChildren: 0.1 } } }}
                  initial="closed"
                  animate="open"
                >
                  {drawerItemsConfig.map((item) => {
                    const ItemIcon = iconComponents[item.icon]
                    return (
                      <motion.link
                        key={item.href}
                        href={item.href}
                        onClick={closeMenu}
                        className={classNames(
                          'group relative flex items-center gap-3 rounded-2xl px-4 py-3.5 text-base font-semibold transition-all duration-200',
                          'text-zinc-900 dark:text-white',
                          'hover:bg-zinc-100/50 dark:hover:bg-zinc-800/50'
                        )}
                        variants={{
                          closed: { opacity: 0, x: -20 },
                          open: {
                            opacity: 1,
                            x: 0,
                            transition: { type: 'spring', stiffness: 300, damping: 30 },
                          },
                        }}
                      >
                        {ItemIcon && (
                          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-orange-500/15 text-orange-500 transition-transform duration-200 group-hover:scale-110">
                            <ItemIcon className="h-4 w-4" />
                          </span>
                        )}
                        <span className="transition-transform duration-200 group-hover:-translate-x-0.5">
                          {getLabel(item, t)}
                        </span>
                        <span className="absolute bottom-0 left-4 right-4 h-px origin-left scale-x-0 bg-orange-500 transition-transform duration-300 group-hover:scale-x-100" />
                      </motion.link>
                    )
                  })}
                </motion.nav>

                {/* Book Now CTA */}
                <motion.div
                  className="border-t border-zinc-200/50 p-4 pb-[calc(1rem+env(safe-area-inset-bottom))] dark:border-zinc-800/50"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.5 }}
                >
                  <Link
                    href="https://wa.me/525512291607"
                    onClick={closeMenu}
                    className="block w-full rounded-full border border-orange-500/30 bg-orange-500/20 py-3 text-center text-sm font-medium text-orange-500 backdrop-blur-sm transition-all duration-300 hover:bg-orange-500 hover:text-white"
                  >
                    {t('header.bookNow')}
                  </Link>
                </motion.div>
              </motion.div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  )
}

export default HubMenu
