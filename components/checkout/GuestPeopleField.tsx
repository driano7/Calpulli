'use client'

// MIT License - Copyright (c) 2024-2026 Donovan Riaño / Calpulli CDMX - See LICENSE
import { useEffect, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { ChevronLeft, ChevronRight, Mail, Plus, Star, User, X } from 'lucide-react'

export interface GuestPerson {
  id: string
  email: string
  name: string
}

/** Tope de personas que se pueden agregar en una sola reserva. */
export const MAX_GUESTS = 20

/**
 * Campos de invitado con chips.
 *
 * Antes solo se podia capturar un email y un nombre: el de la persona que
 * paga. Con esta pieza se pueden sumar varias personas, cada una con su
 * email y su nombre, y verlas como fichas ("chips").
 *
 * Reglas:
 *   - el maximo es MAX_GUESTS (20). Al llegar al tope se deja de permitir
 *     agregar y se dice por que;
 *   - se muestran de a tres, con flechas para recorrer el resto;
 *   - la primera persona es la que compra: su email recibe los tickets.
 *
 * No guarda nada por su cuenta: la lista vive en el padre.
 */
export function GuestPeopleField({
  locale,
  people,
  email,
  name,
  onEmailChange,
  onNameChange,
  onAdd,
  onRemove,
  onRename,
  onSetResponsible,
  responsibleId,
  emailRegistered = false,
  maxGuests = MAX_GUESTS,
}: {
  locale: string
  people: GuestPerson[]
  email: string
  name: string
  onEmailChange: (value: string) => void
  onNameChange: (value: string) => void
  onAdd: () => void
  onRemove: (id: string) => void
  onRename: (id: string, value: string) => void
  /** Marca quien responde por la reserva (una sola persona). */
  onSetResponsible?: (id: string) => void
  /** Id de la persona responsable. */
  responsibleId?: string
  /** El correo ya esta registrado: se avisa, no se bloquea. */
  emailRegistered?: boolean
  maxGuests?: number
}) {
  const isEs = locale === 'es'
  const trackRef = useRef<HTMLDivElement | null>(null)
  const [canScrollLeft, setCanScrollLeft] = useState(false)
  const [canScrollRight, setCanScrollRight] = useState(false)

  const syncArrows = () => {
    const el = trackRef.current
    if (!el) return
    setCanScrollLeft(el.scrollLeft > 4)
    setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 4)
  }

  useEffect(() => {
    syncArrows()
    const el = trackRef.current
    if (!el) return
    el.addEventListener('scroll', syncArrows, { passive: true })
    window.addEventListener('resize', syncArrows)
    return () => {
      el.removeEventListener('scroll', syncArrows)
      window.removeEventListener('resize', syncArrows)
    }
  }, [people.length])

  const nudge = (direction: 1 | -1) => {
    const el = trackRef.current
    if (!el) return
    const chip = el.querySelector<HTMLElement>('[data-chip]')
    const step = chip ? chip.offsetWidth + 12 : 220
    el.scrollBy({ left: direction * step, behavior: 'smooth' })
  }

  const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())
  const nameOk = name.trim().length >= 2
  const full = people.length >= maxGuests

  return (
    <div className="mt-4">
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs font-semibold text-gray-900 dark:text-white">
          {isEs ? 'Personas de esta reserva' : 'People on this booking'}
        </p>
        <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
          {people.length}/{maxGuests}
        </p>
      </div>

      <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-[1fr_1fr_auto]">
        <div>
          <label
            htmlFor="guest-email"
            className="mb-1 flex items-center gap-1 text-xs font-medium text-zinc-600 dark:text-zinc-300"
          >
            <Mail className="h-3.5 w-3.5" /> {isEs ? 'Email' : 'Email'} *
          </label>
          <input
            id="guest-email"
            type="email"
            value={email}
            onChange={(event) => onEmailChange(event.target.value)}
            placeholder={isEs ? 'tu@email.com' : 'you@email.com'}
            autoComplete="off"
            className={`w-full rounded-xl border bg-white px-4 py-3 text-sm text-gray-900 focus:outline-none dark:bg-zinc-900 dark:text-white ${
              emailRegistered
                ? 'border-amber-400 focus:border-amber-500'
                : 'border-zinc-300 focus:border-orange-500 dark:border-white/10'
            }`}
          />
        </div>

        <div>
          <label
            htmlFor="guest-name"
            className="mb-1 flex items-center gap-1 text-xs font-medium text-zinc-600 dark:text-zinc-300"
          >
            <User className="h-3.5 w-3.5" /> {isEs ? 'Nombre' : 'Name'} *
          </label>
          <input
            id="guest-name"
            type="text"
            value={name}
            onChange={(event) => onNameChange(event.target.value)}
            placeholder={isEs ? 'Nombre y apellido' : 'Full name'}
            className="w-full rounded-xl border border-zinc-300 bg-white px-4 py-3 text-sm text-gray-900 focus:border-orange-500 focus:outline-none dark:border-white/10 dark:bg-zinc-900 dark:text-white"
          />
        </div>

        <div className="flex items-end">
          <button
            type="button"
            onClick={onAdd}
            disabled={!emailOk || !nameOk || full}
            className="flex w-full items-center justify-center gap-1.5 rounded-xl border border-orange-500/40 bg-orange-500/10 px-4 py-3 text-sm font-semibold text-orange-600 transition-colors hover:bg-orange-500/20 disabled:cursor-not-allowed disabled:opacity-40 dark:text-orange-300 sm:w-auto"
          >
            <Plus className="h-4 w-4" />
            {isEs ? 'Agregar' : 'Add'}
          </button>
        </div>
      </div>

      {emailRegistered && (
        <p className="mt-2 text-xs text-amber-600 dark:text-amber-300">
          {isEs
            ? 'Este correo ya tiene una cuenta en Amaxing. Puedes entrar o seguir como invitado.'
            : 'This email already has an Amaxing account. You can log in or continue as a guest.'}
        </p>
      )}

      {full && (
        <p className="mt-2 text-xs text-zinc-500 dark:text-zinc-400">
          {isEs
            ? `Ya agregaste el máximo de ${maxGuests} personas en esta reserva.`
            : `You already added the maximum of ${maxGuests} people on this booking.`}
        </p>
      )}

      {/* Chips: se ven de a tres, con flechas para recorrer el resto */}
      {people.length > 0 && (
        <div className="mt-4">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => nudge(-1)}
              disabled={!canScrollLeft}
              aria-label={isEs ? 'Anterior' : 'Previous'}
              className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full border border-zinc-300 text-zinc-600 transition-colors hover:border-orange-400 hover:text-orange-600 disabled:cursor-not-allowed disabled:opacity-30 dark:border-white/10 dark:text-zinc-300"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>

            <div
              ref={trackRef}
              className="flex snap-x snap-mandatory gap-3 overflow-x-auto scroll-smooth pb-1"
              style={{ scrollbarWidth: 'none' }}
            >
              {people.map((person, index) => (
                <motion.div
                  key={person.id}
                  data-chip
                  className="flex w-52 flex-shrink-0 snap-start items-start gap-2 rounded-xl border border-zinc-200 bg-white px-3 py-2.5 dark:border-white/10 dark:bg-zinc-900"
                  initial={{ opacity: 0, x: -20, scale: 0.9 }}
                  animate={{ opacity: 1, x: 0, scale: 1 }}
                  transition={{ type: 'spring', stiffness: 300, damping: 30, delay: index * 0.05 }}
                  layout
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-gray-900 dark:text-white">
                      {person.name}
                    </p>
                    <p className="truncate text-[11px] text-zinc-500 dark:text-zinc-400">
                      {person.email}
                    </p>
                    {person.id === responsibleId && (
                      <p className="mt-1 text-[10px] font-semibold uppercase tracking-wide text-orange-600 dark:text-orange-300">
                        {isEs ? 'Responsable' : 'Responsible'}
                      </p>
                    )}
                  </div>
                  <div className="flex flex-col items-center gap-1">
                    <button
                      type="button"
                      onClick={() => onSetResponsible?.(person.id)}
                      aria-pressed={person.id === responsibleId}
                      title={
                        isEs
                          ? 'Marca a esta persona como responsable de la reserva'
                          : 'Mark this person as responsible for the booking'
                      }
                      className={`rounded-full p-1 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 ${
                        person.id === responsibleId
                          ? 'bg-orange-100 text-orange-600 shadow-sm dark:bg-orange-900/30 dark:text-orange-300'
                          : 'bg-white/50 text-zinc-400 hover:bg-orange-50 hover:text-orange-600 dark:bg-zinc-800/30 dark:text-zinc-500 dark:hover:bg-orange-500/10 dark:hover:text-orange-400'
                      }`}
                    >
                      <Star className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => onRemove(person.id)}
                      aria-label={isEs ? `Quitar a ${person.name}` : `Remove ${person.name}`}
                      className="rounded-full p-0.5 text-zinc-400 transition-colors hover:text-red-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </motion.div>
              ))}
            </div>

            <button
              type="button"
              onClick={() => nudge(1)}
              disabled={!canScrollRight}
              aria-label={isEs ? 'Siguiente' : 'Next'}
              className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full border border-zinc-300 text-zinc-600 transition-colors hover:border-orange-400 hover:text-orange-600 disabled:cursor-not-allowed disabled:opacity-30 dark:border-white/10 dark:text-zinc-300"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>

          <p className="mt-2 text-[11px] text-zinc-500 dark:text-zinc-400">
            {isEs
              ? 'Marca con la estrella quien responde por la reserva: es la persona a nombre de la cual se emiten los tickets y a quien llegan los correos. Por defecto es la primera.'
              : 'Mark with the star who is responsible for the booking: the tickets are issued in their name and the emails go to them. By default it is the first one.'}
          </p>
        </div>
      )}
    </div>
  )
}
