'use client'

// MIT License - Copyright (c) 2024-2026 Donovan Riaño / Calpulli CDMX - See LICENSE
import { useCallback, useEffect, useRef, useState } from 'react'
import React from 'react'
import { ChevronDown, Check, Search, X } from 'lucide-react'
import { sortCountries, countryFlag, COUNTRY_PHONE_CODES } from '@/lib/demographics'

interface CountrySearchSelectProps {
  value: string
  onChange: (code: string) => void
  locale: string
  disabled?: boolean
  className?: string
}

/**
 * Selector de países con búsqueda por teclado.
 *
 * Reemplaza el <select> nativo del WhatsApp en el checkout para que el
 * usuario pueda escribir el nombre del país y filtrar la lista, en lugar
 * de tener que recorrer todo el desplegado.
 *
 * No guarda nada por su cuenta: el valor vive en el padre.
 */
export function CountrySearchSelect({
  value,
  onChange,
  locale,
  disabled = false,
  className,
}: CountrySearchSelectProps) {
  const isEs = locale === 'es'
  const allCountries = sortCountries()
  const inputRef = useRef<HTMLInputElement>(null)
  const listRef = useRef<HTMLUListElement>(null)
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [highlighted, setHighlighted] = useState(-1)

  const filtered = useCallback(() => {
    const q = query.trim().toLowerCase()
    if (!q) return allCountries
    return allCountries.filter(
      (c) => c.es.toLowerCase().includes(q) || c.en.toLowerCase().includes(q)
    )
  }, [query, allCountries])

  const selectCountry = useCallback(
    (code: string) => {
      onChange(code)
      setQuery('')
      setOpen(false)
      setHighlighted(-1)
      inputRef.current?.blur()
    },
    [onChange]
  )

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      const list = filtered()
      if (!open) {
        if (e.key === 'Enter' || e.key === ' ' || e.key === 'ArrowDown') {
          e.preventDefault()
          setOpen(true)
          setHighlighted(0)
        }
        return
      }
      if (e.key === 'Escape') {
        setOpen(false)
        setHighlighted(-1)
        return
      }
      if (e.key === 'ArrowDown') {
        e.preventDefault()
        setHighlighted((prev) => Math.min(prev + 1, list.length - 1))
        return
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault()
        setHighlighted((prev) => Math.max(prev - 1, 0))
        return
      }
      if (e.key === 'Enter') {
        e.preventDefault()
        if (highlighted >= 0 && list[highlighted]) {
          selectCountry(list[highlighted].code)
        } else if (list[0]) {
          selectCountry(list[0].code)
        }
        return
      }
    },
    [open, filtered, highlighted, selectCountry]
  )

  // Clic fuera cierra el desplegado.
  useEffect(() => {
    const onClick = (event: MouseEvent) => {
      const el = document.getElementById('country-search-select')
      if (el && !el.contains(event.target as Node)) {
        setOpen(false)
        setHighlighted(-1)
      }
    }
    document.addEventListener('mousedown', onClick)
    return () => document.removeEventListener('mousedown', onClick)
  }, [])

  const current = allCountries.find((c) => c.code === value)
  const label = current
    ? locale === 'es'
      ? current.es
      : current.en
    : isEs
    ? 'Seleccionar país'
    : 'Select country'

  return (
    <div id="country-search-select" className={`relative ${className ?? 'w-full'}`}>
      <button
        type="button"
        onClick={() => {
          if (disabled) return
          setOpen(!open)
          if (open) {
            setHighlighted(-1)
          } else {
            inputRef.current?.focus()
            setHighlighted(0)
          }
        }}
        disabled={disabled}
        className={`flex w-full items-center justify-between gap-1 rounded-lg border px-2 py-2 text-left text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-orange-500 sm:gap-2 sm:px-3 ${
          disabled
            ? 'cursor-not-allowed border-zinc-200 bg-zinc-50 text-zinc-400 dark:border-white/10 dark:bg-zinc-900 dark:text-zinc-500'
            : 'border-zinc-300 bg-white text-gray-900 hover:border-orange-400 dark:border-white/15 dark:bg-zinc-900 dark:text-gray-100 dark:hover:border-orange-400'
        } ${open ? 'border-orange-500' : ''}`}
      >
        <span className="min-w-0 flex-1 truncate">
          {open ? (
            <input
              ref={inputRef}
              autoComplete="off"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={isEs ? 'Buscar país' : 'Search country'}
              className="w-full border-none bg-transparent text-sm text-gray-900 placeholder:text-zinc-400 focus:outline-none dark:text-white"
            />
          ) : (
            <>
              <span className="hidden sm:inline">{label}</span>
              <span className="sm:hidden">
                {current
                  ? `${countryFlag(value)} +${COUNTRY_PHONE_CODES[value] || ''}`
                  : isEs
                  ? 'País'
                  : 'Country'}
              </span>
            </>
          )}
        </span>
        {current && !open ? (
          <span className="hidden shrink-0 text-xs sm:inline">
            {countryFlag(value)} {value} (+{COUNTRY_PHONE_CODES[value] || ''})
          </span>
        ) : !open ? (
          <ChevronDown className={`h-4 w-4 transition-transform ${open ? 'rotate-180' : ''}`} />
        ) : null}
      </button>

      {open && !disabled && (
        <ul
          ref={listRef}
          role="listbox"
          className="absolute left-0 z-20 mt-1 max-h-64 w-[min(20rem,calc(100vw-2rem))] overflow-y-auto rounded-lg border border-zinc-200 bg-white text-sm text-gray-900 shadow-xl focus:outline-none dark:border-white/15 dark:bg-zinc-900 dark:text-gray-100 sm:w-full"
        >
          <li
            role="option"
            aria-selected={String(value === '')}
            className="relative cursor-pointer select-none px-3 py-2 hover:bg-orange-50 dark:hover:bg-orange-500/10"
            onMouseEnter={() => setHighlighted(-1)}
            onClick={() => selectCountry(value || 'MX')}
          >
            {isEs ? 'Mantener actual' : 'Keep current'}
          </li>
          {filtered().map((country, index) => {
            const isHighlighted = highlighted === index
            const isSelected = country.code === value
            return (
              <li
                key={country.code}
                role="option"
                aria-selected={isSelected}
                className={`relative cursor-pointer select-none px-3 py-2 ${
                  isHighlighted
                    ? 'bg-orange-50 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300'
                    : isSelected
                    ? 'bg-emerald-50 font-medium text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300'
                    : 'hover:bg-orange-50 dark:hover:bg-orange-500/10'
                }`}
                onMouseEnter={() => setHighlighted(index)}
                onClick={() => selectCountry(country.code)}
              >
                <span className="mr-2">{countryFlag(country.code)}</span>
                {locale === 'es' ? country.es : country.en}
                <span className="ml-auto text-xs text-zinc-500 dark:text-zinc-400">
                  (+{COUNTRY_PHONE_CODES[country.code] || ''})
                </span>
                {isSelected && (
                  <Check className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-emerald-600 dark:text-emerald-400" />
                )}
              </li>
            )
          })}
          {filtered().length === 0 && (
            <li role="none" className="px-3 py-2 text-xs text-zinc-500 dark:text-zinc-400">
              {isEs ? 'No se encontraron países' : 'No countries found'}
            </li>
          )}
        </ul>
      )}
    </div>
  )
}
