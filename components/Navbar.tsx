'use client'

import Link from '@/components/Link'
import Image from 'next/image'
import AuthNav from './AuthNav'
import { CartIcon } from './cart/CartIcon'
import { ReservationIcon } from './reservation/ReservationIcon'
import { ThemeToggle } from './theme-toggle'
import { useAuth } from '@/lib/hooks/useAuth'
import { motion, AnimatePresence, useTransform, useScroll } from 'framer-motion'
import { useEffect, useState, useCallback } from 'react'
import classNames from 'classnames'
import { useTheme } from 'next-themes'
import { useLanguage } from '@/lib/hooks/useLanguage'
import {
  Utensils,
  Skull,
  MapPin,
  Palette,
  LayoutGrid,
  ChevronDown,
  Compass,
  Footprints,
  BookOpen,
  Newspaper,
  Mail,
  Tag,
  Star,
  MapPinned,
  Users,
  Home,
} from 'lucide-react'
import { navItemsConfig, headerDropdownConfig } from '@/data/hubMenuLinks'
import enDict from '@/dictionaries/en.json'
import esDict from '@/dictionaries/es.json'

// Map icon names from config to actual icon components
const iconComponents = {
  Utensils,
  Skull,
  MapPin,
  Palette,
  LayoutGrid,
  ChevronDown,
  Compass,
  Footprints,
  BookOpen,
  Newspaper,
  Mail,
  Tag,
  Star,
  MapPinned,
  Users,
  Home,
}

const dictionaries = { en: enDict, es: esDict }

const localT = (key, locale = 'en') => {
  const keys = key.split('.')
  let result = dictionaries[locale]
  for (const k of keys) {
    if (result && typeof result === 'object' && k in result) {
      result = result[k]
    } else {
      return key
    }
  }
  return typeof result === 'string' ? result : key
}

export function Navbar() {
  const { user, isLoading: authLoading } = useAuth()
  const [isVisible, setIsVisible] = useState(false)
  const [forceVisible, setForceVisible] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  const [mobileDelayElapsed, setMobileDelayElapsed] = useState(true)
  const [showLabels, setShowLabels] = useState(true)
  const { scrollY } = useScroll()
  const { currentLanguage, setLanguage, isChanging, t } = useLanguage()
  const { resolvedTheme } = useTheme()
  const isDarkTheme = resolvedTheme === 'dark'

  // Ensure currentLanguage is always a valid string
  const locale =
    typeof currentLanguage === 'string' && currentLanguage.length > 0 ? currentLanguage : 'en'

  // Helper to get translation with fallback - defensive for SSR/SSG
  const getLabel = (key, fallback) => {
    // Use context t if available, otherwise use local fallback
    const translateFn = typeof t === 'function' ? t : (k) => localT(k, locale)
    try {
      const translated = translateFn(key)
      return translated === key ? fallback : translated
    } catch {
      return fallback
    }
  }

  // All nav items - loaded from centralized config (data/hubMenuLinks.js)
  const navItems = navItemsConfig.map((item) => ({
    ...item,
    label: item.labelKey ? getLabel(item.labelKey, item.fallback) : item.label,
    icon: item.icon ? iconComponents[item.icon] : undefined,
  }))

  // Tour category dropdown - loaded from centralized config (data/hubMenuLinks.js)
  const tourCategories = headerDropdownConfig.map((item) => ({
    ...item,
    label: item.labelKey ? getLabel(item.labelKey, item.fallback) : item.label,
    icon: iconComponents[item.icon],
  }))
  const [categoriesOpen, setCategoriesOpen] = useState(false)

  useEffect(() => {
    const updateForceVisible = () => {
      const scrollableSpace = document.documentElement.scrollHeight - window.innerHeight
      setForceVisible(scrollableSpace < 120)
    }
    updateForceVisible()
    window.addEventListener('resize', updateForceVisible)
    return () => window.removeEventListener('resize', updateForceVisible)
  }, [])

  useEffect(() => {
    const checkMobile = () => {
      const isMobileView = window.matchMedia('(max-width: 640px)').matches
      setIsMobile(isMobileView)
      setShowLabels(!isMobileView)
    }
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  // Hide labels on scroll down, show on scroll up
  useEffect(() => {
    let lastScrollY = window.scrollY
    const handleScroll = () => {
      const currentScrollY = window.scrollY
      if (currentScrollY > lastScrollY && currentScrollY > 100) {
        setShowLabels(false)
      } else if (currentScrollY < lastScrollY) {
        setShowLabels(true)
      }
      lastScrollY = currentScrollY
    }
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  useEffect(() => {
    if (!isMobile) {
      setMobileDelayElapsed(true)
      return
    }
    setMobileDelayElapsed(false)
    setIsVisible(true)
    const timer = window.setTimeout(() => {
      setMobileDelayElapsed(true)
      setIsVisible(forceVisible || window.scrollY > 16)
    }, 5000)
    return () => window.clearTimeout(timer)
  }, [isMobile, forceVisible])

  useEffect(() => {
    const handleScroll = () => {
      if (isMobile && !mobileDelayElapsed) {
        setIsVisible(true)
        return
      }
      setIsVisible(forceVisible || window.scrollY > 16)
    }
    handleScroll()
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [forceVisible, isMobile, mobileDelayElapsed])

  const backgroundColor = useTransform(
    scrollY,
    [0, 50],
    isDarkTheme
      ? ['rgba(0, 0, 0, 0)', 'rgba(0, 0, 0, 0.6)']
      : ['rgba(255, 255, 255, 0)', 'rgba(255, 255, 255, 0.8)']
  )

  const backdropBlur = useTransform(scrollY, [0, 50], ['blur(0px)', 'blur(12px)'])

  return (
    <>
      {/* Desktop Header */}
      <motion.div
        style={{
          backgroundColor,
          backdropFilter: backdropBlur,
        }}
        className={classNames(
          'pointer-events-none fixed inset-x-0 top-4 z-50 flex justify-center px-4 sm:px-6 lg:px-8',
          'transition-all duration-500',
          isVisible
            ? 'pointer-events-auto translate-y-0 opacity-100'
            : 'pointer-events-none -translate-y-8 opacity-0'
        )}
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
      >
        <header
          className={classNames(
            'pointer-events-auto flex w-[min(1100px,100%)] items-center gap-4 rounded-3xl border px-5 py-3 text-sm font-semibold shadow-2xl backdrop-blur-md transition-all duration-500',
            // Xoco style: more transparent, less gray, blur in both themes
            'border-black/5 bg-white/80 text-zinc-900 dark:border-white/10 dark:bg-black/60 dark:text-white',
            isVisible
              ? 'shadow-2xl backdrop-blur-md'
              : 'border-transparent bg-transparent shadow-none backdrop-blur-none'
          )}
        >
          <div className="flex shrink-0 items-center gap-2.5">
            <Link href="/" className="group flex items-center" aria-label="Calpulli CDMX">
              <div
                className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-full transition-transform group-hover:rotate-6"
                style={{
                  background:
                    'linear-gradient(135deg, #DE1D8D 0%, #BE1588 25%, #9F0E7F 50%, #7B2BD9 75%, #6A0568 100%)',
                }}
              >
                <Image
                  src="/static/images/jaguarBaja.png"
                  alt="Calpulli CDMX"
                  width={36}
                  height={36}
                  className="h-full w-full object-cover"
                />
              </div>
            </Link>
            <Link
              href="/"
              className="hidden font-serif text-lg font-bold tracking-wide text-zinc-900 transition-colors hover:text-orange-500 dark:text-white sm:block"
            >
              Calpulli CDMX
            </Link>
          </div>

          <div className="flex flex-1 items-center justify-end gap-4">
            <nav className="hidden items-center gap-1 sm:flex lg:gap-2">
              {navItems.map((item, index) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={classNames(
                    'group relative flex flex-col items-center gap-1 text-sm font-semibold tracking-wide transition duration-300',
                    'text-zinc-900 hover:text-orange-500 dark:text-white'
                  )}
                  style={{ animationDelay: `${index * 0.05}s` }}
                >
                  <span
                    className={classNames(
                      'transition-all duration-300',
                      showLabels ? 'max-h-6 opacity-100' : 'hidden max-h-0 opacity-0'
                    )}
                  >
                    {item.label}
                  </span>
                  <span className="absolute -bottom-1 left-0 h-px w-full origin-left scale-x-0 bg-orange-500 transition-transform duration-300 group-hover:scale-x-100" />
                </Link>
              ))}

              {/* Categories dropdown - hidden when headerDropdownConfig is empty */}
              <div
                className={tourCategories.length > 0 ? 'relative' : 'hidden'}
                onMouseEnter={() => setCategoriesOpen(true)}
                onMouseLeave={() => setCategoriesOpen(false)}
              >
                <button
                  type="button"
                  className={classNames(
                    'group flex items-center gap-1.5 rounded-full px-4 py-1.5 text-sm font-semibold tracking-wide transition duration-300',
                    'text-zinc-900 hover:text-orange-500 dark:text-white',
                    'bg-zinc-100/50 dark:bg-zinc-800/50'
                  )}
                  aria-haspopup="true"
                  aria-expanded={categoriesOpen}
                >
                  <LayoutGrid className="h-4 w-4 text-orange-500" aria-hidden="true" />
                  <span>{getLabel('header.more', 'More')}</span>
                  <ChevronDown
                    className={classNames(
                      'h-3.5 w-3.5 text-orange-500 transition-transform duration-200',
                      categoriesOpen && 'rotate-180'
                    )}
                    aria-hidden="true"
                  />
                </button>

                <AnimatePresence>
                  {categoriesOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: 8, scale: 0.98 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 8, scale: 0.98 }}
                      transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
                      className="absolute left-1/2 top-full z-50 mt-2 w-64 -translate-x-1/2"
                    >
                      <motion.div
                        className="overflow-hidden rounded-2xl border border-zinc-200/60 bg-white/95 p-2 shadow-2xl backdrop-blur-xl dark:border-orange-500/20 dark:bg-zinc-950/95"
                        variants={{
                          open: { transition: { staggerChildren: 0.04, delayChildren: 0.05 } },
                        }}
                        initial="closed"
                        animate="open"
                      >
                        {tourCategories.map((category) => {
                          const CategoryIcon = category.icon
                          return (
                            <motion.link
                              key={category.href}
                              href={category.href}
                              variants={{
                                closed: { opacity: 0, x: -10 },
                                open: {
                                  opacity: 1,
                                  x: 0,
                                  transition: { type: 'spring', stiffness: 300, damping: 30 },
                                },
                              }}
                              className="group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold text-zinc-900 transition-colors hover:bg-orange-500/10 dark:text-white"
                            >
                              {CategoryIcon && (
                                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-orange-500/15 text-orange-500 transition-transform duration-200 group-hover:scale-110">
                                  <CategoryIcon className="h-4 w-4" />
                                </span>
                              )}
                              <span className="group-hover:text-orange-400">{category.label}</span>
                            </motion.link>
                          )
                        })}
                      </motion.div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </nav>

            <div className="flex items-center gap-2 sm:gap-3">
              {/* Language Toggle */}
              <button
                type="button"
                onClick={() => setLanguage(currentLanguage === 'es' ? 'en' : 'es')}
                disabled={isChanging}
                aria-label={
                  currentLanguage === 'es'
                    ? 'Change language to English'
                    : 'Cambiar idioma a Español'
                }
                className={classNames(
                  'flex items-center gap-1.5 rounded-full px-2 py-1.5 text-xs font-black uppercase tracking-[0.35em] sm:gap-2 sm:px-4 sm:py-2',
                  'bg-gray-100/60 text-gray-800 transition-all hover:bg-gray-200 dark:bg-gray-800/60 dark:text-gray-100 dark:hover:bg-gray-700',
                  isChanging ? 'pointer-events-none opacity-60' : ''
                )}
              >
                <div className="flex flex-col items-center gap-0.5">
                  <span className="text-lg">{currentLanguage === 'es' ? '🇲🇽' : '🇺🇸'}</span>
                  <span className="text-[0.85rem] font-black uppercase tracking-[0.35em]">
                    {currentLanguage === 'es' ? 'ES' : 'EN'}
                  </span>
                </div>
              </button>

              <AuthNav />

              {/* Reservation icon — always visible, independent of login status */}
              <Link href="/bookings" className="transition-colors hover:text-[var(--j1)]">
                <ReservationIcon className="h-5 w-5 text-zinc-500 transition-colors hover:text-[var(--j1)] dark:text-zinc-400" />
              </Link>

              {user && !authLoading && <CartIcon />}

              {/* Theme Toggle — rightmost icon */}
              <ThemeToggle />
            </div>
          </div>
        </header>
      </motion.div>
    </>
  )
}
