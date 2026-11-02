// MIT License - Copyright (c) 2024-2026 Donovan Riaño / Calpulli CDMX - See LICENSE
// Selector de fecha y hora por journey en el checkout.
// UI "liquid glass" con colores terracota / cempasuchil y reglas de Xoco Café:
//   - mínimo 3 días de anticipación
//   - máximo 2 meses de anticipación (excepto luchas: 1 semana)
//   - horarios de 09:00 a 19:00, de una hora en una hora.
//
// Para luchas: se puede pasar `dateTimeMap` (Record<fecha, hora>) para que el
// calendario solo habilite las fechas del scraper, la hora se fija a 2 horas
// antes de la función, y el alcance se limita a 1 semana.
import { useState, useMemo } from 'react'
import { motion } from 'framer-motion'
import { Calendar, Clock, ChevronDown, Check } from 'lucide-react'
import { DayPicker } from 'react-day-picker'
import { es, enUS } from 'date-fns/locale'
import { cn, formatDateShort } from '@/lib/utils'
import { useLanguage } from '@/lib/hooks/useLanguage'

const TERRACOTA = '#C1440E'
const CEMPASUCHIL = '#F2A03D'

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
  /** Luchas: mapa de fecha (YYYY-MM-DD) -> hora (HH:MM) permitida. Si se pasa,
   * el calendario solo habilita esas fechas y la hora se fija automáticamente. */
  dateTimeMap?: Record<string, string>
}

const TIME_SLOTS = ['09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00']

export function JourneyDateTimePicker({
  item,
  onChange,
  locale,
  dateTimeMap,
}: JourneyDateTimePickerProps) {
  const { currentLanguage } = useLanguage()
  const isEs = locale === 'es' || currentLanguage === 'es'
  const dateLocale = isEs ? es : enUS

  const [open, setOpen] = useState(false)
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(
    item.date ? new Date(`${item.date}T12:00:00`) : undefined
  )
  const defaultTime = dateTimeMap && item.date ? dateTimeMap[item.date] : item.time || '09:00'
  const [selectedTime, setSelectedTime] = useState<string>(defaultTime)

  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const minDate = new Date(today)
  minDate.setDate(today.getDate() + 3)
  const maxDate = dateTimeMap
    ? new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000)
    : new Date(today.setMonth(today.getMonth() + 2))

  const allowedDatesSet = useMemo(() => {
    if (!dateTimeMap) return null
    return new Set(Object.keys(dateTimeMap))
  }, [dateTimeMap])

  const isDateAllowed = (d: Date): boolean => {
    if (!allowedDatesSet) return true
    const iso = d.toISOString().slice(0, 10)
    return allowedDatesSet.has(iso)
  }

  const hasSelection = Boolean(selectedDate && selectedTime)

  const label = useMemo(() => {
    if (!hasSelection) {
      return isEs ? 'Cuando deseas agendar con nosotros' : 'When would you like to book with us'
    }
    return `${formatDateShort(selectedDate!, locale as 'es' | 'en')} · ${selectedTime}`
  }, [selectedDate, selectedTime, isEs, locale, hasSelection])

  const handleDateSelect = (date: Date | undefined) => {
    if (!date) return
    const iso = date.toISOString().slice(0, 10)
    setSelectedDate(date)
    const time = dateTimeMap?.[iso] || selectedTime
    setSelectedTime(time)
    onChange(item.lineId, iso, time)
    setOpen(false)
  }

  const handleTimeSelect = (time: string) => {
    if (dateTimeMap) return
    setSelectedTime(time)
    if (selectedDate) {
      const iso = selectedDate.toISOString().slice(0, 10)
      onChange(item.lineId, iso, time)
    }
    setOpen(false)
  }

  const clearSelection = () => {
    setSelectedDate(undefined)
    setSelectedTime(defaultTime)
    onChange(item.lineId, null, null)
    setOpen(false)
  }

  const isLuchaMode = Boolean(dateTimeMap)

  return (
    <div className="relative w-full">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className={cn(
          'flex w-full items-center justify-between gap-3 rounded-2xl border bg-white/40 px-4 py-3.5 text-sm text-gray-900 backdrop-blur-sm transition-all duration-300 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-orange-500',
          'hover:bg-white/50 dark:border-white/10 dark:bg-zinc-900/40 dark:text-white dark:hover:bg-zinc-900/60',
          item.date || item.time ? 'border-orange-500/30' : 'border-zinc-300'
        )}
      >
        <div className="flex min-w-0 items-center gap-2.5">
          <Calendar className="h-4 w-4 shrink-0 text-orange-500 dark:text-orange-400" />
          <span className="truncate font-medium">{label}</span>
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

      {open && (
        <motion.div
          initial={{ opacity: 0, y: -10, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -10, scale: 0.97 }}
          transition={{ duration: 0.25, ease: 'easeOut' }}
          className="dark:border-orange-500/35 absolute z-50 mt-2 w-full max-w-4xl rounded-2xl border border-orange-500/25 bg-white/95 p-4 shadow-2xl ring-1 ring-black/5 backdrop-blur-xl dark:bg-zinc-900/95 dark:ring-white/10"
        >
          <div className="flex flex-col gap-6 lg:flex-row">
            {/* Izquierda: Calendario */}
            <div className="min-w-0 flex-1">
              <div className="px-2 pb-1">
                <p className="text-xs font-semibold uppercase tracking-wider text-zinc-600 dark:text-zinc-400">
                  {isEs ? 'Fecha' : 'Date'}
                </p>
                {isLuchaMode && (
                  <p className="mt-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-orange-500 dark:text-orange-400">
                    {isEs ? 'Solo fechas de función' : 'Show dates only'}
                  </p>
                )}
                {hasSelection && (
                  <button
                    type="button"
                    onClick={clearSelection}
                    className="text-xs text-orange-600 transition-colors hover:underline dark:text-orange-400"
                  >
                    {isEs ? 'Limpiar' : 'Clear'}
                  </button>
                )}
              </div>
              <DayPicker
                mode="single"
                selected={selectedDate}
                onSelect={handleDateSelect}
                disabled={{
                  before: minDate,
                  after: maxDate,
                  filter: (day) => !isDateAllowed(day),
                }}
                fromDate={minDate}
                toDate={maxDate}
                month={selectedDate || minDate}
                locale={dateLocale}
                weekStartsOn={1}
                classNames={{
                  root: 'space-y-2',
                  month: 'space-y-2',
                  caption: 'flex items-center justify-between px-2 py-1.5',
                  caption_label:
                    'text-sm font-semibold text-zinc-900 dark:text-zinc-100 tracking-tight',
                  nav_button:
                    'p-1.5 rounded-xl hover:bg-orange-50 dark:hover:bg-orange-900/30 transition-colors duration-200',
                  nav_button_previous: 'ml-auto',
                  nav_button_next: 'mr-auto',
                  weekdays:
                    'flex justify-center text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-1',
                  day: 'h-10 w-10 flex items-center justify-center text-sm rounded-xl transition-colors duration-200',
                  day_button:
                    'h-10 w-10 flex items-center justify-center text-sm rounded-xl transition-colors duration-200',
                  selected: 'bg-orange-500 text-white shadow-sm shadow-orange-500/40',
                  today: 'ring-2 ring-orange-500 dark:ring-orange-400',
                  disabled: 'opacity-35 cursor-not-allowed',
                  outside: 'opacity-25 text-zinc-400',
                }}
              />
            </div>

            {/* Derecha: Horarios */}
            <div className="min-w-0 flex-1">
              <div className="px-2 pb-1">
                <p className="text-xs font-semibold uppercase tracking-wider text-zinc-600 dark:text-zinc-400">
                  {isEs ? 'Hora' : 'Time'}
                </p>
                {isLuchaMode && (
                  <p className="mt-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-orange-500 dark:text-orange-400">
                    {isEs ? '2 h antes de la función' : '2 h before show'}
                  </p>
                )}
              </div>

              {isLuchaMode ? (
                <div className="rounded-xl border border-orange-500/30 bg-orange-500/10 px-4 py-4 text-center">
                  <Clock className="mx-auto mb-2 h-5 w-5 text-orange-500 dark:text-orange-400" />
                  <span className="text-sm font-semibold text-orange-900 dark:text-orange-100">
                    {selectedTime}
                  </span>
                  <p className="mt-1 text-[10px] text-zinc-500 dark:text-zinc-400">
                    {isEs
                      ? 'Horario fijo: 2 horas antes de la función'
                      : 'Fixed time: 2 hours before the show'}
                  </p>
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-3 gap-2">
                    {TIME_SLOTS.map((slot) => {
                      const isSelected = selectedTime === slot
                      return (
                        <button
                          key={slot}
                          type="button"
                          onClick={() => handleTimeSelect(slot)}
                          disabled={
                            selectedDate &&
                            isSameDay(selectedDate, minDate) &&
                            isTimeBeforeNow(slot)
                          }
                          className={cn(
                            'flex h-12 flex-col items-center justify-center rounded-xl border text-sm transition-all duration-200',
                            isSelected
                              ? cn(
                                  'border-orange-500 bg-orange-500 text-white shadow-lg shadow-orange-500/40',
                                  'hover:scale-[1.02]'
                                )
                              : cn(
                                  'border-zinc-200 text-zinc-700 hover:bg-orange-50 dark:border-white/10 dark:text-zinc-300 dark:hover:bg-orange-900/20 dark:hover:text-orange-400',
                                  item.time === slot
                                    ? 'ring-2 ring-orange-500 dark:ring-orange-400'
                                    : ''
                                )
                          )}
                        >
                          <Clock className="mb-1 h-4 w-4" />
                          <span
                            className={cn(
                              'font-medium leading-tight',
                              isSelected
                                ? 'text-orange-900 dark:text-white'
                                : 'text-zinc-900 dark:text-zinc-100'
                            )}
                          >
                            {slot}
                          </span>
                        </button>
                      )
                    })}
                  </div>
                  {!selectedDate && (
                    <div className="mt-4 rounded-xl border border-zinc-100 bg-zinc-50/50 px-3 py-2 text-xs text-zinc-500 dark:border-white/10 dark:bg-zinc-900/30 dark:text-zinc-500">
                      {isEs ? 'Selecciona una fecha primero' : 'Select a date first'}
                    </div>
                  )}
                </>
              )}

              {isLuchaMode && selectedDate && (
                <div className="mt-3 rounded-xl border border-orange-500/20 bg-orange-500/5 p-3 dark:border-orange-500/10 dark:bg-orange-900/5">
                  <p className="mb-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-orange-600 dark:text-orange-400">
                    {isEs ? 'Función confirmada' : 'Show confirmed'}
                  </p>
                  <p className="text-xs leading-relaxed text-zinc-700 dark:text-zinc-300">
                    {isEs
                      ? `Entrada disponible a las ${selectedTime}, dos horas antes del inicio de la función.`
                      : `Doors open at ${selectedTime}, two hours before the show starts.`}
                  </p>
                </div>
              )}
            </div>
          </div>

          {hasSelection && (
            <div className="mt-4 border-t border-orange-500/15 pt-3 dark:border-white/10">
              <button
                type="button"
                onClick={() => {
                  const iso = selectedDate!.toISOString().slice(0, 10)
                  onChange(item.lineId, iso, selectedTime)
                  setOpen(false)
                }}
                className="shadow-orange-500/35 w-full rounded-xl border border-orange-500 bg-gradient-to-b from-orange-500 to-orange-600 px-4 py-3 text-sm font-semibold text-white shadow-lg transition-all hover:-translate-y-0.5 hover:shadow-orange-500/50 active:scale-[0.98]"
              >
                <Check className="mr-1.5 h-4 w-4" />
                {isEs ? 'Confirmar selección' : 'Confirm selection'}
              </button>
            </div>
          )}
        </motion.div>
      )}
    </div>
  )
}

function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  )
}

function isTimeBeforeNow(time: string): boolean {
  const now = new Date()
  const [h, m] = time.split(':').map(Number)
  return now.getHours() > h || (now.getHours() === h && now.getMinutes() >= m)
}
