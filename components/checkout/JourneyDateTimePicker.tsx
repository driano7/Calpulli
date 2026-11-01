'use client'

// MIT License - Copyright (c) 2024-2026 Donovan Riaño / Calpulli CDMX - See LICENSE
// Selector de fecha y hora por journey en el checkout.
// Estilo "liquid glass" con los colores de la marca (terracota / cempasuchil),
// animaciones de apertura y las reglas de reserva de Xoco Café:
//   - mínimo 3 días de anticipación
//   - máximo 2 meses de anticipación
//   - horarios de 09:00 a 18:00 cada 30 minutos.
import { useState, useMemo } from 'react'
import { Calendar, Clock, ChevronDown, ArrowRight } from 'lucide-react'
import { DayPicker } from 'react-day-picker'
import { es, enUS } from 'date-fns/locale'
import { cn, formatDateShort } from '@/lib/utils'
import { useLanguage } from '@/lib/hooks/useLanguage'
import { motion } from 'framer-motion'

const TERRACOTA = '#C1440E'

interface JourneyDateTimePickerProps {
  item: {
    lineId: string
    title: string
    date?: string | null
    time?: string | null
    peopleCount?: number
  }
  onChange: (lineId: string, date: string | null, time: string | null) => void
  locale: string
}

export function JourneyDateTimePicker({ item, onChange, locale }: JourneyDateTimePickerProps) {
  const { currentLanguage } = useLanguage()
  const isEs = locale === 'es' || currentLanguage === 'es'
  const dateLocale = isEs ? es : enUS

  const [open, setOpen] = useState(false)
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(
    item.date ? new Date(`${item.date}T12:00:00`) : undefined
  )
  const [selectedTime, setSelectedTime] = useState<string>(item.time || '10:00')

  // Reglas Xoco Café: mínimo 3 días de anticipación, hasta 2 meses.
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const minDate = new Date(today)
  minDate.setDate(today.getDate() + 3)
  const maxDate = new Date(today)
  maxDate.setMonth(today.getMonth() + 2)

  const timeSlots = useMemo(() => {
    const slots: string[] = []
    for (let hour = 9; hour < 18; hour++) {
      slots.push(`${String(hour).padStart(2, '0')}:00`)
      slots.push(`${String(hour).padStart(2, '0')}:30`)
    }
    return slots
  }, [])

  const hasSelection = Boolean(selectedDate && selectedTime)

  const label = useMemo(() => {
    if (!hasSelection) {
      return isEs ? 'Seleccionar fecha y hora' : 'Select date and time'
    }
    return `${formatDateShort(selectedDate!, locale as 'es' | 'en')} · ${selectedTime}`
  }, [selectedDate, selectedTime, isEs, locale, hasSelection])

  const handleDateSelect = (date: Date | undefined) => {
    if (!date) return
    setSelectedDate(date)
    if (selectedTime) {
      const iso = date.toISOString().slice(0, 10)
      onChange(item.lineId, iso, selectedTime)
    }
    setOpen(false)
  }

  const handleTimeSelect = (time: string) => {
    setSelectedTime(time)
    if (selectedDate) {
      const iso = selectedDate.toISOString().slice(0, 10)
      onChange(item.lineId, iso, time)
    }
    setOpen(false)
  }

  const clearSelection = () => {
    setSelectedDate(undefined)
    setSelectedTime('10:00')
    onChange(item.lineId, null, null)
    setOpen(false)
  }

  return (
    <div className="relative w-full">
      {/* Botón disparador: resumen de la selección actual */}
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex w-full items-center justify-between gap-2 rounded-xl border bg-white/40 px-4 py-3 text-sm text-gray-900 backdrop-blur-sm transition-all hover:bg-white/50 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-orange-500 dark:border-white/10 dark:bg-zinc-900/40 dark:text-white dark:hover:bg-zinc-900/60"
      >
        <div className="flex min-w-0 items-center gap-2">
          <Calendar className="h-4 w-4 shrink-0 text-orange-500 dark:text-orange-400" />
          <span className="truncate">{label}</span>
          {item.time && (
            <span className="ml-auto text-[11px] font-medium text-zinc-500 dark:text-gray-400">
              {item.peopleCount === 1
                ? isEs
                  ? 'persona'
                  : 'person'
                : isEs
                ? 'personas'
                : 'people'}
            </span>
          )}
        </div>
        <ChevronDown
          className={`h-4 w-4 shrink-0 text-zinc-500 transition-transform duration-300 dark:text-zinc-400 ${
            open ? 'rotate-180' : ''
          }`}
        />
      </button>

      {/* Panel desplegable: calendario + horarios (liquid glass) */}
      {open && (
        <motion.div
          initial={{ opacity: 0, y: -8, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -8, scale: 0.98 }}
          transition={{ duration: 0.2 }}
          className="absolute z-50 mt-1 w-full max-w-sm rounded-xl border border-orange-500/30 bg-white/90 p-3 shadow-2xl ring-1 ring-black/5 backdrop-blur-md dark:border-orange-500/40 dark:bg-zinc-900/90 dark:ring-white/10"
        >
          <div className="space-y-3">
            <div className="flex items-center justify-between px-2 pb-1">
              <p className="text-xs font-semibold text-zinc-600 dark:text-zinc-300">
                {isEs ? 'Fecha' : 'Date'}
              </p>
              <button
                type="button"
                onClick={clearSelection}
                className="text-xs text-orange-600 hover:underline dark:text-orange-400"
                disabled={!hasSelection}
              >
                {isEs ? 'Limpiar' : 'Clear'}
              </button>
            </div>

            <DayPicker
              mode="single"
              selected={selectedDate}
              onSelect={handleDateSelect}
              disabled={{ before: minDate, after: maxDate }}
              fromDate={minDate}
              toDate={maxDate}
              month={selectedDate || minDate}
              locale={dateLocale}
              weekStartsOn={1}
              classNames={{
                root: 'space-y-2',
                month: 'space-y-2',
                caption: 'flex items-center justify-between px-2 py-1',
                caption_label: 'text-sm font-semibold text-zinc-900 dark:text-zinc-100',
                nav_button:
                  'p-1.5 rounded-lg hover:bg-orange-50 dark:hover:bg-orange-900/30 transition-colors',
                nav_button_previous: 'ml-auto',
                nav_button_next: 'mr-auto',
                weekdays: 'text-xs text-zinc-500 dark:text-zinc-400',
                day: 'h-9 w-10 flex items-center justify-center text-sm rounded-lg transition-colors',
                day_button:
                  'h-9 w-10 flex items-center justify-center text-sm rounded-lg transition-colors',
                selected: 'bg-orange-500 text-white',
                today: 'ring-2 ring-orange-500 dark:ring-orange-400',
                disabled: 'opacity-40 cursor-not-allowed',
                outside: 'opacity-30 text-zinc-400',
              }}
            />

            {/* Horarios */}
            <div className="flex items-center justify-between px-2 pb-1">
              <p className="text-xs font-semibold text-zinc-600 dark:text-zinc-300">
                {isEs ? 'Hora' : 'Time'}
              </p>
            </div>
            <div className="grid grid-cols-4 gap-1">
              {timeSlots.map((slot) => (
                <button
                  key={slot}
                  type="button"
                  onClick={() => handleTimeSelect(slot)}
                  className={cn(
                    'flex h-9 items-center justify-center rounded-lg text-sm transition-colors',
                    selectedTime === slot
                      ? 'bg-orange-500 text-white shadow-sm shadow-orange-500/30'
                      : cn(
                          'text-zinc-700 hover:bg-orange-50 dark:text-zinc-300 dark:hover:bg-orange-900/20 dark:hover:text-orange-300',
                          item.time === slot ? 'ring-2 ring-orange-500 dark:ring-orange-400' : ''
                        )
                  )}
                >
                  {slot}
                </button>
              ))}
            </div>

            {hasSelection && (
              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => {
                    const iso = selectedDate!.toISOString().slice(0, 10)
                    onChange(item.lineId, iso, selectedTime)
                    setOpen(false)
                  }}
                  className="w-full rounded-xl border border-orange-500 bg-orange-500/10 px-3 py-2 text-sm font-semibold text-orange-600 transition-colors hover:bg-orange-500/20 dark:text-orange-400 dark:hover:bg-orange-900/20"
                >
                  <ArrowRight className="mr-1.5 h-4 w-4" />
                  {isEs ? 'Confirmar selección' : 'Confirm selection'}
                </button>
              </div>
            )}
          </div>
        </motion.div>
      )}
    </div>
  )
}
