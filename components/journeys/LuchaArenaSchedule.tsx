'use client'

// MIT License - Copyright (c) 2024-2026 Donovan Riaño / Calpulli CDMX - See LICENSE
/**
 * Muestra los próximos 7 días de funciones de Lucha Libre para una arena.
 * Lee de /api/lucha/events (Turso). Si la API está vacía o falla, usa los
 * horarios recurrentes conocidos del scraper (fallback estático) para que el
 * visitante siempre vea algo real y no tenga que reservar "a ciegas".
 */

import { useEffect, useState } from 'react'
import { useLanguage } from '@/lib/hooks/useLanguage'
import { GlassDark } from '@/components/ui/GlassDark'

interface LuchaEvent {
  id: string
  arena: 'mexico' | 'coliseo'
  title: string
  date: string // YYYY-MM-DD
  time: string // HH:MM
  luchadores: string[]
  cartelera: string
  price_min: number
  price_max: number
  ticket_url: string
  status: string
  created_at: string
  updated_at: string
}

interface LuchaArenaScheduleProps {
  arena: 'mexico' | 'coliseo'
  arenaName: string
  isEs: boolean
}

const KNOWN_SCHEDULE: Record<
  'mexico' | 'coliseo',
  Array<{ weekday: number; time: string; label: string }>
> = {
  mexico: [
    { weekday: 2, time: '19:30', label: 'Martes' },
    { weekday: 5, time: '20:30', label: 'Viernes' },
    { weekday: 0, time: '17:00', label: 'Domingo' },
  ],
  coliseo: [
    { weekday: 4, time: '19:00', label: 'Jueves' },
    { weekday: 6, time: '19:30', label: 'Sábado' },
  ],
}

function generateFallbackEvents(arena: 'mexico' | 'coliseo', isEs: boolean): LuchaEvent[] {
  const today = new Date()
  const events: LuchaEvent[] = []
  const schedule = KNOWN_SCHEDULE[arena]

  for (let i = 0; i < 7; i++) {
    const d = new Date(today)
    d.setDate(today.getDate() + i)
    const weekday = d.getDay()

    const match = schedule.find((s) => s.weekday === weekday)
    if (!match) continue

    events.push({
      id: `fallback-${arena}-${d.toISOString().split('T')[0]}`,
      arena,
      title: isEs ? 'Función de Lucha Libre' : 'Lucha Libre Show',
      date: d.toISOString().split('T')[0],
      time: match.time,
      luchadores: ['Pendiente de cartelera oficial'],
      cartelera: isEs
        ? 'Cartelera por confirmar en sitio oficial CMLL'
        : 'Card to be confirmed on official CMLL site',
      price_min: arena === 'mexico' ? 200 : 150,
      price_max: arena === 'mexico' ? 1500 : 800,
      ticket_url: 'https://www.cmll.com/tickets/',
      status: 'scheduled',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
  }
  return events
}

export function LuchaArenaSchedule({ arena, arenaName, isEs }: LuchaArenaScheduleProps) {
  const [events, setEvents] = useState<LuchaEvent[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const today = new Date()
    const from = today.toISOString().split('T')[0]
    const to = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]

    fetch(`/api/lucha/events?arena=${arena}&from=${from}&to=${to}`)
      .then((res) => {
        if (!res.ok) throw new Error('API response not ok')
        return res.json()
      })
      .then((data) => {
        const evs = (data.events || []) as LuchaEvent[]
        if (evs.length > 0) {
          setEvents(evs)
        } else {
          setEvents(generateFallbackEvents(arena, isEs))
        }
        setLoading(false)
      })
      .catch((err) => {
        console.error('Lucha schedule fetch failed:', err)
        setEvents(generateFallbackEvents(arena, isEs))
        setLoading(false)
      })
  }, [arena, isEs])

  if (loading) {
    return (
      <div className="mt-4 flex h-24 items-center justify-center">
        <span className="text-sm italic text-zinc-500 dark:text-zinc-400">
          {isEs ? 'Cargando horarios...' : 'Loading schedules...'}
        </span>
      </div>
    )
  }

  if (events.length === 0) {
    return (
      <div className="mt-4 rounded-xl border border-zinc-200/70 bg-zinc-50/50 p-4 dark:border-white/10 dark:bg-zinc-900/30">
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          {isEs
            ? 'Sin funciones programadas para los próximos 7 días.'
            : 'No shows scheduled for the next 7 days.'}
        </p>
      </div>
    )
  }

  return (
    <GlassDark variant="subtle" className="mt-6 p-4 sm:p-6">
      <h3 className="mb-3 text-sm font-semibold uppercase tracking-[0.18em] text-zinc-500 dark:text-zinc-400">
        {isEs ? `Próximas funciones — ${arenaName}` : `Upcoming shows — ${arenaName}`}
      </h3>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {events.map((ev) => (
          <div
            key={ev.id}
            className="dark:bg-white/3 rounded-lg border border-white/10 bg-white/5 p-3 dark:border-white/5"
          >
            <p className="mb-1 text-xs font-semibold text-zinc-900 dark:text-zinc-100">{ev.date}</p>
            <p className="mb-1 font-mono text-sm text-zinc-600 dark:text-zinc-300">{ev.time}</p>
            {ev.ticket_url && (
              <a
                href={ev.ticket_url}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-2 inline-block text-xs font-medium text-[#C1440E] hover:underline"
              >
                {isEs ? 'Ver boletos' : 'See tickets'}
              </a>
            )}
          </div>
        ))}
      </div>
    </GlassDark>
  )
}
