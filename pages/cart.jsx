'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Link from '@/components/Link'
import Image from '@/components/Image'
import { Trash2, Calendar, Clock, Users, ArrowRight, ShoppingBag } from 'lucide-react'
import { useCartStore } from '@/lib/store/useCartStore'
import { useLanguage } from '@/lib/hooks/useLanguage'
import { formatPriceMXN } from '@/lib/currency'

export default function CartPage() {
  const { items, removeItem, updateItem, clearCart, subtotal, itemCount, totalItemCount } =
    useCartStore()
  const { t, currentLanguage } = useLanguage()
  const locale = currentLanguage === 'es' ? 'es' : 'en'
  const [isCheckingOut, setIsCheckingOut] = useState(false)
  const [payInCash, setPayInCash] = useState(false)

  // El carrito guarda SIEMPRE pesos (ver useCartStore): aqui no se convierte nada.
  const formatPrice = (price) => formatPriceMXN(price, locale)

  // Reglas tipo Xococafé: mínimo 3 días de anticipación, hasta 2 meses.
  const minDate = new Date()
  minDate.setDate(minDate.getDate() + 3)
  const today = minDate.toISOString().split('T')[0]
  const maxDate = new Date()
  maxDate.setMonth(maxDate.getMonth() + 2)
  const maxDateStr = maxDate.toISOString().split('T')[0]

  const timeSlots = [
    '09:00',
    '09:30',
    '10:00',
    '10:30',
    '11:00',
    '11:30',
    '12:00',
    '12:30',
    '13:00',
    '13:30',
    '14:00',
    '14:30',
    '15:00',
    '15:30',
    '16:00',
    '16:30',
    '17:00',
    '17:30',
  ]

  const allItemsReady = items.every((item) => item.date && item.time)

  const handleQuantityChange = (lineId, delta) => {
    const item = items.find((i) => i.lineId === lineId)
    if (!item) return
    const next = Math.max(1, Math.min(item.maxGuests, (item.peopleCount || 1) + delta))
    updateItem(lineId, { peopleCount: next })
  }

  return (
    <div className="min-h-screen bg-white dark:bg-zinc-950">
      <div className="container mx-auto px-4 py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mx-auto max-w-4xl"
        >
          <div className="mb-8 flex items-center justify-between">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              {t('cart.title', 'Tu Carrito')}
            </h1>
            <Link
              href="/tours"
              className="text-sm font-medium text-orange-500 hover:text-orange-400"
            >
              ← {t('cart.backToTours', 'Seguir explorando')}
            </Link>
          </div>

          {items.length === 0 ? (
            <div className="rounded-2xl border border-zinc-200 bg-zinc-100/50 py-20 text-center dark:border-white/10 dark:bg-zinc-900/50">
              <ShoppingBag className="mx-auto h-16 w-16 text-zinc-400 dark:text-gray-600" />
              <h2 className="mt-4 text-xl font-semibold text-gray-900 dark:text-white">
                {t('cart.emptyTitle', 'Tu carrito está vacío')}
              </h2>
              <p className="mt-2 text-zinc-500 dark:text-gray-400">
                {t('cart.emptySubtitle', 'Agrega experiencias para reservar tu próxima aventura')}
              </p>
              <Link
                href="/tours"
                className="mt-6 inline-flex items-center rounded-xl bg-orange-500 px-6 py-3 font-semibold text-white transition-colors hover:bg-orange-600"
              >
                {t('cart.exploreTours', 'Explorar experiencias')}
              </Link>
            </div>
          ) : (
            <>
              <div className="mb-8 space-y-4">
                <AnimatePresence>
                  {items.map((item, index) => (
                    <motion.div
                      key={item.lineId}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, x: -100 }}
                      transition={{ duration: 0.3, delay: index * 0.05 }}
                      className="group relative flex flex-col gap-4 rounded-2xl border border-zinc-200 bg-white p-4 transition-all duration-300 hover:border-orange-500/30 dark:border-white/10 dark:bg-zinc-900/50 sm:flex-row"
                    >
                      <div className="relative h-40 flex-shrink-0 overflow-hidden rounded-xl sm:h-28 sm:w-40">
                        <Image
                          src={item.imageUrl || '/static/images/jaguarBaja.png'}
                          alt={item.title}
                          fill
                          sizes="(max-width: 640px) 100vw, 160px"
                          className="object-cover"
                        />
                      </div>

                      <div className="flex flex-1 flex-col gap-3">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <h3 className="line-clamp-1 text-lg font-bold text-gray-900 dark:text-white">
                              {item.title}
                            </h3>
                            <p className="text-sm text-zinc-500 dark:text-gray-400">
                              {item.location}
                            </p>
                          </div>
                          <button
                            onClick={() => removeItem(item.lineId)}
                            className="rounded-lg p-2 text-zinc-500 transition-colors hover:bg-red-500/10 hover:text-red-400 dark:text-gray-500"
                            aria-label={`${t('cart.remove', 'Eliminar')} ${item.title}`}
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="mb-1 block text-xs text-zinc-500 dark:text-gray-400">
                              {t('cart.date', 'Fecha')}
                            </label>
                            <div className="relative">
                              <Calendar className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-orange-500" />
                              <input
                                type="date"
                                value={item.date || ''}
                                min={today}
                                max={maxDateStr}
                                onChange={(e) => updateItem(item.lineId, { date: e.target.value })}
                                className="w-full rounded-lg border border-zinc-300 bg-white py-1.5 pl-8 pr-2 text-sm text-gray-900 focus:border-orange-500 focus:outline-none dark:border-white/10 dark:bg-zinc-900 dark:text-white"
                              />
                            </div>
                          </div>
                          <div>
                            <label className="mb-1 block text-xs text-zinc-500 dark:text-gray-400">
                              {t('cart.time', 'Hora')}
                            </label>
                            <div className="relative">
                              <Clock className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-orange-500" />
                              <select
                                value={item.time || ''}
                                onChange={(e) => updateItem(item.lineId, { time: e.target.value })}
                                disabled={!item.date}
                                className="w-full rounded-lg border border-zinc-300 bg-white py-1.5 pl-8 pr-2 text-sm text-gray-900 focus:border-orange-500 focus:outline-none disabled:opacity-50 dark:border-white/10 dark:bg-zinc-900 dark:text-white"
                              >
                                <option value="">{t('cart.select', 'Selecciona')}</option>
                                {timeSlots.map((slot) => (
                                  <option key={slot} value={slot}>
                                    {slot}
                                  </option>
                                ))}
                              </select>
                            </div>
                          </div>
                        </div>

                        <div className="mt-auto flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Users className="h-4 w-4 text-orange-500" />
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => handleQuantityChange(item.lineId, -1)}
                                disabled={(item.peopleCount || 1) <= 1}
                                className="flex h-6 w-6 items-center justify-center rounded-full bg-zinc-100 text-sm text-gray-900 transition-colors hover:bg-orange-500/20 disabled:opacity-40 dark:bg-white/10 dark:text-white"
                              >
                                -
                              </button>
                              <span className="w-6 text-center text-sm font-medium text-gray-900 dark:text-white">
                                {item.peopleCount || 1}
                              </span>
                              <button
                                onClick={() => handleQuantityChange(item.lineId, 1)}
                                disabled={(item.peopleCount || 1) >= item.maxGuests}
                                className="flex h-6 w-6 items-center justify-center rounded-full bg-zinc-100 text-sm text-gray-900 transition-colors hover:bg-orange-500/20 disabled:opacity-40 dark:bg-white/10 dark:text-white"
                              >
                                +
                              </button>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-lg font-bold text-gray-900 dark:text-white">
                              {formatPrice((item.price || 0) * (item.peopleCount || 1))}
                            </div>
                            <div className="text-xs text-zinc-500 dark:text-gray-500">
                              {formatPrice(item.price)} × {item.peopleCount || 1}
                            </div>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>

              <div className="rounded-2xl border border-orange-500/20 bg-orange-500/5 p-6">
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-zinc-600 dark:text-gray-300">
                    {t('cart.experiences', 'Experiencias')} ({itemCount})
                  </span>
                  <span className="font-medium text-gray-900 dark:text-white">{itemCount}</span>
                </div>
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-zinc-600 dark:text-gray-300">
                    {t('cart.totalPeople', 'Personas totales')}
                  </span>
                  <span className="font-medium text-gray-900 dark:text-white">
                    {totalItemCount}
                  </span>
                </div>
                <div className="flex items-center justify-between border-t border-white/10 pt-3 dark:border-white/10">
                  <span className="text-lg text-zinc-600 dark:text-gray-300">
                    {t('cart.total', 'Total')}
                  </span>
                  <span className="text-3xl font-bold text-gray-900 dark:text-white">
                    {formatPrice(subtotal)}
                  </span>
                </div>
                <p className="mt-1 text-right text-xs text-zinc-500 dark:text-gray-500">
                  {locale === 'es'
                    ? t('cart.currencyNote', 'Precios mostrados en MXN')
                    : t('cart.currencyNote', 'Prices shown in MXN')}
                </p>
                {!allItemsReady && (
                  <p className="mt-3 text-xs text-orange-500">
                    ⚠{' '}
                    {t(
                      'cart.completeDates',
                      'Selecciona fecha y hora para cada experiencia antes de continuar'
                    )}
                  </p>
                )}
                <label className="mt-4 flex cursor-pointer items-center gap-3 rounded-xl border border-zinc-200 bg-white p-3 dark:border-white/10 dark:bg-zinc-900">
                  <input
                    type="checkbox"
                    checked={payInCash}
                    onChange={(e) => {
                      const v = e.target.checked
                      setPayInCash(v)
                      try {
                        if (v) localStorage.setItem('amaxing_pay_cash', '1')
                        else localStorage.removeItem('amaxing_pay_cash')
                      } catch {
                        void 0
                      }
                    }}
                    className="h-5 w-5 rounded border-zinc-300 text-orange-500 focus:ring-orange-500"
                  />
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-gray-900 dark:text-white">
                      {locale === 'es' ? 'Pagar en efectivo' : 'Pay in cash'}
                    </p>
                    <p className="text-xs text-zinc-500 dark:text-gray-400">
                      {locale === 'es'
                        ? 'Reserva ahora, paga al recoger en el punto. Confirmamos por WhatsApp 2h antes.'
                        : 'Reserve now, pay on pickup. We confirm via WhatsApp 2h before.'}
                    </p>
                  </div>
                </label>

                <Link
                  href={payInCash ? '/checkout?cash=1' : '/checkout'}
                  onClick={(e) => {
                    if (!allItemsReady) {
                      e.preventDefault()
                      setIsCheckingOut(true)
                      setTimeout(() => setIsCheckingOut(false), 2500)
                    } else if (payInCash) {
                      try {
                        localStorage.setItem('amaxing_pay_cash', '1')
                      } catch {
                        void 0
                      }
                    }
                  }}
                  className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-orange-500 py-4 font-semibold text-white transition-colors hover:bg-orange-600"
                >
                  {payInCash
                    ? locale === 'es'
                      ? 'Reservar y pagar en efectivo'
                      : 'Reserve and pay in cash'
                    : t('cart.checkout', 'Proceder al Checkout')}
                  <ArrowRight className="h-4 w-4" />
                </Link>

                {/* Clear cart button */}
                {items.length > 0 && (
                  <button
                    onClick={() => clearCart()}
                    className="mt-3 w-full rounded-xl bg-red-500 py-3 font-semibold text-white transition-colors hover:bg-red-600"
                    aria-label={t('cart.clearCart')}
                  >
                    {t('cart.clearCart')}
                    <Trash2 className="inline-block h-4 w-4" />
                  </button>
                )}

                <Link
                  href={payInCash ? '/checkout?cash=1' : '/checkout'}
                  onClick={() => {
                    if (payInCash) {
                      try {
                        localStorage.setItem('amaxing_pay_cash', '1')
                      } catch {
                        void 0
                      }
                    }
                  }}
                  className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl border border-orange-500 bg-white py-3 text-sm font-semibold text-orange-600 transition-colors hover:bg-orange-50 dark:border-orange-500/30 dark:bg-zinc-900 dark:text-orange-400"
                >
                  {payInCash
                    ? locale === 'es'
                      ? 'Reservar como invitado (efectivo)'
                      : 'Reserve as guest (cash)'
                    : t('cart.checkoutGuest', 'Pagar como invitado — sin crear cuenta')}
                </Link>
                <p className="mt-2 text-center text-xs text-zinc-500 dark:text-gray-500">
                  {t('cart.guestNote', 'No guardamos tu email. Solo para tu ticket con QR.')}
                </p>
              </div>
            </>
          )}
        </motion.div>
      </div>
    </div>
  )
}
