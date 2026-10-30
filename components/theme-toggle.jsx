'use client'

import { useTheme } from 'next-themes'
import { motion } from 'framer-motion'
import { SunIcon, MoonIcon } from '@heroicons/react/24/solid'
import { useEffect, useState } from 'react'

export function ThemeToggle() {
  const { theme, setTheme, systemTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return <div className="h-10 w-10" />
  }

  const currentTheme = theme === 'system' ? systemTheme : theme
  const isDark = currentTheme === 'dark'

  /**
   * Cambio de tema suave: se marca <html> durante el cambio para que todas
   * las superficies transicionen a la vez, y se quita despues para no
   * arrastrar la transicion en el resto de la interaccion.
   */
  const toggle = () => {
    const root = document.documentElement
    root.classList.add('theme-transition')
    setTheme(isDark ? 'light' : 'dark')
    window.setTimeout(() => root.classList.remove('theme-transition'), 820)
  }

  return (
    <motion.button
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.9 }}
      onClick={toggle}
      className="relative flex h-10 w-10 items-center justify-center rounded-lg border border-gray-300 bg-gray-100 text-gray-900 transition-all duration-300 hover:bg-orange-500 hover:text-white dark:border-white/20 dark:bg-white/10 dark:text-white"
      aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
    >
      <motion.div
        initial={{ opacity: isDark ? 0 : 1, rotate: isDark ? -90 : 0 }}
        animate={{ opacity: isDark ? 0 : 1, rotate: isDark ? 0 : -90 }}
        transition={{ duration: 0.45, ease: [0.4, 0, 0.2, 1] }}
      >
        <SunIcon className="h-5 w-5" />
      </motion.div>
      <motion.div
        initial={{ opacity: isDark ? 1 : 0, rotate: isDark ? 0 : 90 }}
        animate={{ opacity: isDark ? 1 : 0, rotate: isDark ? 90 : 0 }}
        transition={{ duration: 0.45, ease: [0.4, 0, 0.2, 1] }}
        className="absolute"
      >
        <MoonIcon className="h-5 w-5" />
      </motion.div>
    </motion.button>
  )
}
