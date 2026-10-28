'use client'

// MIT License - Copyright (c) 2024-2026 Donovan Riaño / Calpulli CDMX - See LICENSE
import { useRouter } from 'next/router'
import { motion, useReducedMotion } from 'framer-motion'
import { useJourneyDetail } from './JourneyDetailContext'
import { setAllJourneyDetails } from './journeyDetailBus'
import { useCartStore } from '@/lib/store/useCartStore'
import { getJourneyBySlug, pickLocalized } from '@/data/journeysData'

/**
 * Control global del detalle desplegable.
 *
 * Abre o cierra a la vez el relato completo de todos los momentos del
 * journey. Es la pieza que permite plegar el detalle en cualquier momento
 * sin perder el contexto: el resumen de cada momento sigue a la vista.
 *
 * El icono gira cuando el detalle esta desplegado, para que se entienda que
 * se puede volver a plegar. Con movimiento reducido no hay giro, pero el texto
 * del boton sigue diciendo que hace.
 */
export function DetailToggle({
  accent = '#0E8C7A',
  variant = 'floating',
  price,
  isEs = true,
  journeySlug,
}: {
  accent?: string
  variant?: 'floating' | 'inline'
  /** Precio de referencia. Si viene, se muestra siempre junto al control. */
  price?: number | null
  isEs?: boolean
  /** Slug del journey, para llevar al checkout. */
  journeySlug?: string
}) {
  const detail = useJourneyDetail()
  const reduced = useReducedMotion()
  const router = useRouter()
  const { addItem, clearCart } = useCartStore()
  if (!detail) return null

  /**
   * Reservar desde la ficha del journey: se REEMPLAZA el carrito para que
   * solo quede este journey. Si el usuario venia de otro y se arrepintio,
   * no queda nada acumulado.
   */
  const handleBook = (event: { preventDefault: () => void }) => {
    event.preventDefault()
    const journey = getJourneyBySlug(journeySlug)
    if (!journey) {
      router.push('/journeys')
      return
    }
    clearCart()
    addItem({
      experienceId: journey.id,
      title: pickLocalized(journey.title_es, journey.title_en, isEs),
      imageUrl: journey.heroImage,
      price: journey.price,
      currency: 'MXN',
      location: 'Ciudad de México',
      maxGuests: 10,
    })
    router.push('/checkout')
  }

  const expanded = detail.allOpen

  const button = (
    <button
      type="button"
      onClick={() => {
        detail?.toggleAll()
        setAllJourneyDetails(!detail?.allOpen)
      }}
      aria-pressed={expanded}
      className={
        variant === 'inline'
          ? 'flex w-full items-center gap-3 rounded-xl border border-[var(--j1-soft)] bg-white/70 px-3 py-2.5 text-left text-xs font-semibold text-[var(--j1)] transition-colors hover:bg-[var(--j1-softer)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 dark:bg-white/5'
          : 'pointer-events-auto flex items-center gap-2 rounded-full px-4 py-2.5 text-xs font-semibold text-white shadow-lg transition-transform duration-200 hover:scale-[1.03] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2'
      }
      style={
        variant === 'inline'
          ? { ['--tw-ring-color' as string]: accent }
          : { backgroundColor: accent, ['--tw-ring-color' as string]: accent }
      }
    >
      <span
        aria-hidden
        className={
          variant === 'inline'
            ? 'flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[var(--j1-softer)]'
            : 'flex h-5 w-5 items-center justify-center rounded-full bg-white/20 text-xs'
        }
      >
        <motion.span
          aria-hidden
          className="block text-sm leading-none"
          animate={{ rotate: expanded ? 45 : 0 }}
          transition={reduced ? { duration: 0 } : { type: 'spring', stiffness: 320, damping: 22 }}
        >
          +
        </motion.span>
      </span>
      <span className="flex-1">
        {expanded
          ? isEs
            ? 'Ocultar todo el detalle'
            : 'Hide all the detail'
          : isEs
          ? 'Ver todo el detalle'
          : 'See the full detail'}
      </span>
      {variant === 'inline' && (
        <span className="text-[10px] font-normal opacity-70">
          {expanded ? 'plegar' : 'desplegar'}
        </span>
      )}
    </button>
  )

  if (variant === 'inline') return button

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-0 z-40 flex items-center gap-2 px-4 pb-[5.75rem] sm:bottom-auto sm:top-24 sm:px-6 sm:pb-0">
      {button}
      {price ? (
        <a
          href={`/checkout?journey=${journeySlug || ''}`}
          onClick={handleBook}
          className="pointer-events-auto flex items-center gap-1.5 rounded-full bg-[#E4007C] px-3.5 py-2.5 text-xs font-bold tabular-nums text-white shadow-lg transition-transform duration-200 hover:scale-[1.03] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
          style={{ ['--tw-ring-color' as string]: '#E4007C' }}
          title={
            isEs
              ? 'Reservar este journey. Precio en pesos mexicanos.'
              : 'Book this journey. Price in Mexican pesos.'
          }
        >
          {isEs ? `Reserva por $${price} MXN` : `Book for $${price} MXN`}
        </a>
      ) : null}
    </div>
  )
}
