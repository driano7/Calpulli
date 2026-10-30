'use client'

import { createContext, useContext, useEffect, useState, useCallback } from 'react'
import enDictionaries from '@/dictionaries/en.json'
import esDictionaries from '@/dictionaries/es.json'

const dictionaries = {
  en: enDictionaries,
  es: esDictionaries,
}

const normalizeLanguage = (value) => {
  if (!value) return null
  const normalized = value.toLowerCase()
  if (normalized === 'es' || normalized.startsWith('es-')) return 'es'
  if (normalized === 'en' || normalized.startsWith('en-')) return 'en'
  return null
}

// Create a fallback t function that works without context
const createFallbackT =
  (locale = 'en') =>
  (path) => {
    const keys = path.split('.')
    let result = dictionaries[locale]
    for (const key of keys) {
      if (result && typeof result === 'object' && key in result) {
        result = result[key]
      } else {
        return path
      }
    }
    return typeof result === 'string' ? result : path
  }

// Fallback context for SSR/SSG when provider isn't available
const fallbackContext = {
  currentLanguage: 'en',
  t: createFallbackT('en'),
  setLanguage: () => {},
  isChanging: false,
}

const LanguageContext = createContext(fallbackContext)

export function LanguageProvider({ children, fallbackLanguage = 'en' }) {
  const [currentLanguage, setCurrentLanguage] = useState(fallbackLanguage)
  const [isChanging, setIsChanging] = useState(false)

  const detectLanguage = useCallback(() => {
    if (typeof window === 'undefined') return fallbackLanguage

    const storedPreference = normalizeLanguage(localStorage.getItem('preferred_language'))
    if (storedPreference) {
      return storedPreference
    }

    const htmlLang = normalizeLanguage(document.documentElement?.lang)
    if (htmlLang) {
      return htmlLang
    }

    const browserLanguages = navigator.languages?.length
      ? navigator.languages
      : [navigator.language]
    for (const lang of browserLanguages) {
      const normalized = normalizeLanguage(lang)
      if (normalized) {
        return normalized
      }
    }

    return fallbackLanguage
  }, [fallbackLanguage])

  useEffect(() => {
    const detected = detectLanguage()
    setCurrentLanguage(detected)
    document.documentElement.lang = detected
  }, [detectLanguage])

  const setLanguage = (lang) => {
    if (lang === currentLanguage) return

    setIsChanging(true)
    setTimeout(() => {
      setCurrentLanguage(lang)
      localStorage.setItem('preferred_language', lang)
      document.documentElement.lang = lang

      // Sincroniza la cookie NEXT_LOCALE que leen las rutas getServerSideProps
      // (news, notes) para que el contenido sirva en el idioma elegido.
      try {
        document.cookie = `NEXT_LOCALE=${lang}; path=/; max-age=31536000; samesite=lax`
      } catch {
        // cookies deshabilitadas, seguir con localStorage
      }

      setTimeout(() => setIsChanging(false), 300)
    }, 150)
  }

  const translate = (path, locale) => {
    const keys = path.split('.')

    const read = (dictionary) => {
      let result = dictionary
      for (const key of keys) {
        if (result && typeof result === 'object' && key in result) {
          result = result[key]
        } else {
          return null
        }
      }
      return typeof result === 'string' ? result : null
    }

    return read(dictionaries[locale]) ?? read(dictionaries['es']) ?? path
  }

  // `locale` is optional: components can resolve copy for another language
  // (used by the hero to reserve layout space for both locales).
  const t = (path, locale = currentLanguage) => translate(path, locale)

  return (
    <LanguageContext.Provider value={{ currentLanguage, t, setLanguage, isChanging }}>
      {children}
    </LanguageContext.Provider>
  )
}

export function useLanguage() {
  const context = useContext(LanguageContext)
  // Return fallback context instead of throwing during SSR
  return context || fallbackContext
}
