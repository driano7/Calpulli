'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Link from '@/components/Link'
import Image from '@/components/Image'
import {
  ArrowLeft,
  CreditCard,
  CheckCircle2,
  Loader2,
  Ticket as TicketIcon,
  Lock,
  User,
  Users,
  Mail,
  Trash2,
  Plus,
  X,
} from 'lucide-react'
import { useCartStore } from '@/lib/store/useCartStore'
import { useAuth } from '@/lib/hooks/useAuth'
import { useLanguage } from '@/lib/hooks/useLanguage'
import { COUNTRY_PHONE_CODES } from '@/lib/demographics'
import { FlipCard } from '@/components/ui/FlipCard'
import { VirtualTicket } from '@/components/tickets/VirtualTicket'
import { MasterTicket } from '@/components/tickets/MasterTicket'
import { CryptoPayment } from '@/components/CryptoPayment'
import { formatPriceMXN } from '@/lib/currency'
import { captureAcquisitionChannel, getAcquisitionChannel } from '@/lib/booking/utm'
import { GuestPeopleField, MAX_GUESTS } from '@/components/checkout/GuestPeopleField'
import { CountrySearchSelect } from '@/components/checkout/CountrySearchSelect'
import { JOURNEYS, pickLocalized } from '@/data/journeysData'

export default function CheckoutPage() {
  const { items, subtotal, itemCount, clearCart, updateItem, removeItem, addItem } = useCartStore()
  const { user, token, isLoading } = useAuth()
  const { t, currentLanguage } = useLanguage()
  const locale = currentLanguage === 'es' ? 'es' : 'en'
  const isGuest = !isLoading && !user

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(false)
  const [createdBookings, setCreatedBookings] = useState([])
  const [selectedTicket, setSelectedTicket] = useState(null)
  const [showMasterTicket, setShowMasterTicket] = useState(false)

  // WhatsApp: obligatorio para efectivo. País (orden del onboarding: México primero)
  // + campo de número; se concatena detrás como `+{código} {número}`.
  const [phoneCountry, setPhoneCountry] = useState('MX')
  const [phoneNumber, setPhoneNumber] = useState('')
  const customerPhone = phoneNumber.trim()
    ? `+${COUNTRY_PHONE_CODES[phoneCountry] || '52'} ${phoneNumber.trim()}`
    : ''
  // ── Modo de pago: tarjeta (Stripe) deshabilitado temporalmente ──
  // El cobro con tarjeta por Stripe está bloqueado mientras se finaliza la
  // integración. Quedan disponibles: efectivo y cripto.
  const payMethod = 'cash'
  const [showCryptoModal, setShowCryptoModal] = useState(false)

  // ── Agregar más journeys desde el summary del checkout ────────────────
  const [showAddMoreModal, setShowAddMoreModal] = useState(false)
  // experienceId -> peopleCount para los journeys marcados en el modal
  const [selectedJourneys, setSelectedJourneys] = useState({})

  const cartIds = new Set(items.map((it) => it.experienceId))

  const toggleJourney = (experienceId, people) => {
    setSelectedJourneys((prev) => {
      const next = { ...prev }
      if (next[experienceId]) {
        delete next[experienceId]
      } else {
        next[experienceId] = people
      }
      return next
    })
  }

  const addSelectedJourneys = () => {
    const isEs = currentLanguage === 'es'
    let added = 0
    for (const journey of JOURNEYS) {
      const people = selectedJourneys[journey.id]
      if (!people || people < 1) continue
      // No duplicar un journey que ya está en el carrito
      if (cartIds.has(journey.id)) continue
      addItem({
        experienceId: journey.id,
        title: pickLocalized(journey.title_es, journey.title_en, isEs),
        imageUrl: journey.heroImage,
        price: journey.price,
        currency: 'MXN',
        location: 'Ciudad de México',
        date: null,
        time: null,
        peopleCount: people,
        maxGuests: 10,
      })
      added++
    }
    setSelectedJourneys({})
    setShowAddMoreModal(false)
    if (added > 0) {
      setError(null)
    }
  }

  // Capturar canal de adquisición (first-touch UTM) para CAC por canal
  useEffect(() => {
    captureAcquisitionChannel()
  }, [])

  // Detectar si viene del carrito con ?cash=1 o localStorage flag
  useEffect(() => {
    try {
      const cashParam = new URLSearchParams(window.location.search).get('cash')
      const cashFlag = localStorage.getItem('amaxing_pay_cash')
      if (cashParam === '1' || cashFlag === '1') {
        // Efectivo es el único método disponible: nada que cambiar.
      }
    } catch (e) {
      void 0
    }
  }, [])

  // Consultar el límite de reservas por journey para este usuario/identidad.
  // Form de la tarjeta (vista previa visual en la flip card)
  const [form, setForm] = useState({
    cardNumber: '',
    cardHolder: '',
    expiration: '',
    cvv: '',
  })
  const [focusField, setFocusField] = useState(null)

  // ── Guest + Nombres de participantes ──────────────────────────────
  const [guestEmail, setGuestEmail] = useState('')
  const [guestEmailTouched, setGuestEmailTouched] = useState(false)
  // Limpiar email de invitado cuando el modo cambia a invitado
  // Para evitar que se muestre el email anterior de un usuario logueado
  useEffect(() => {
    if (isGuest) {
      setGuestEmail('')
      setEmailRegistered(false)
    }
  }, [isGuest])
  // Nombre de la persona que se esta agregando.
  const [guestName, setGuestName] = useState('')
  // Las personas de la reserva, cada una con su email y su nombre.
  const [guestPeople, setGuestPeople] = useState([])
  // Quien responde por la reserva (una de las fichas). Por defecto, la primera.
  const [responsibleId, setResponsibleId] = useState(null)
  // El correo ya esta registrado: se ofrece entrar, sin bloquear.
  const [emailRegistered, setEmailRegistered] = useState(false)
  const [showLoginPrompt, setShowLoginPrompt] = useState(false)
  // lineId -> string[] (longitud = peopleCount)
  const [participantNames, setParticipantNames] = useState({})
  // Nombre por default para invitado: titulo del item del carrito
  const defaultGuestName = items.length > 0 ? items[0].title : ''

  const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(guestEmail.trim())
  const authDisplayName = user
    ? `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email
    : ''

  // Inicializa / sincroniza participantNames cuando cambian items o user
  useEffect(() => {
    if (items.length === 0) {
      setParticipantNames({})
      return
    }
    setParticipantNames((prev) => {
      const next = { ...prev }
      let changed = false
      for (const item of items) {
        const count = Math.max(1, Number(item.peopleCount) || 1)
        const existing = Array.isArray(next[item.lineId]) ? next[item.lineId] : []
        if (existing.length !== count) {
          const resized = Array.from({ length: count }, (_, i) => existing[i] || '')
          // Autocompletar primer nombre si estoy autenticado y está vacío
          if (user && resized[0] === '' && authDisplayName) {
            resized[0] = authDisplayName
          }
          next[item.lineId] = resized
          changed = true
        } else if (user && existing[0] === '' && authDisplayName) {
          // Si ya existe pero el primero está vacío y ahora hay usuario, autocompletar
          next[item.lineId] = [authDisplayName, ...existing.slice(1)]
          changed = true
        }
      }
      // Limpiar lineIds que ya no existen
      for (const key of Object.keys(next)) {
        if (!items.some((it) => it.lineId === key)) {
          delete next[key]
          changed = true
        }
      }
      return changed ? next : prev
    })
  }, [items, user, authDisplayName])

  /**
   * Los chips son la fuente de verdad de las personas: al agregar o quitar
   * una ficha se reescriben los nombres de cada ticket y el numero de
   * personas, para que el cobro y los QR cuadren con lo que se ve.
   */
  useEffect(() => {
    if (!isGuest || guestPeople.length === 0) return
    const names = guestPeople.map((person) => person.name)
    setParticipantNames((prev) => {
      const next = { ...prev }
      let changed = false
      for (const item of items) {
        const existing = Array.isArray(next[item.lineId]) ? next[item.lineId] : []
        if (existing.length !== names.length || existing.some((n, i) => n !== names[i])) {
          next[item.lineId] = names
          changed = true
        }
      }
      return changed ? next : prev
    })
    for (const item of items) {
      if (Number(item.peopleCount) !== guestPeople.length) {
        updateItem(item.lineId, { peopleCount: guestPeople.length })
      }
    }
  }, [guestPeople, isGuest, items, updateItem])

  /**
   * Si el correo del comprador ya esta registrado, se le ofrece entrar.
   * La consulta no revela nada a un tercero: solo la usa esta pagina.
   */
  useEffect(() => {
    const email = guestEmail.trim().toLowerCase()
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setEmailRegistered(false)
      return undefined
    }
    let cancelled = false
    const timer = setTimeout(async () => {
      try {
        const response = await fetch('/api/auth/check-email', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email }),
        })
        if (!response.ok || cancelled) return
        const data = await response.json()
        if (cancelled) return
        setEmailRegistered(Boolean(data?.exists))
      } catch (e) {
        void 0
      }
    }, 600)
    return () => {
      cancelled = true
      clearTimeout(timer)
    }
  }, [guestEmail])

  // Si el usuario edita su nombre en perfil y vuelve, no pisar nombres ya escritos manualmente
  const updateParticipantName = (lineId, idx, value) => {
    setParticipantNames((prev) => {
      const arr = Array.isArray(prev[lineId]) ? [...prev[lineId]] : []
      arr[idx] = value
      return { ...prev, [lineId]: arr }
    })
    // Si la persona venia de una ficha, la ficha se renombra tambien.
    setGuestPeople((prev) => {
      if (idx < 0 || idx >= prev.length) return prev
      if (prev[idx].name === value) return prev
      return prev.map((person, i) => (i === idx ? { ...person, name: value } : person))
    })
  }

  /** Agrega una persona a la reserva y la muestra como chip. */
  const addGuestPerson = () => {
    const email = guestEmail.trim()
    const name = guestName.trim()
    if (!email || name.length < 2) return
    if (guestPeople.length >= MAX_GUESTS) return
    setGuestPeople((prev) => {
      const existing = prev.findIndex(
        (person) => person.email.toLowerCase() === email.toLowerCase()
      )
      if (existing >= 0) {
        const next = [...prev]
        next[existing] = { ...next[existing], name }
        return next
      }
      const created = {
        id: `gp_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
        email,
        name,
      }
      setResponsibleId((current) => current || created.id)
      return [...prev, created]
    })
    setGuestName('')
    setGuestEmail('')
    setGuestEmailTouched(false)
  }

  /** Quita una persona de la reserva. */
  const removeGuestPerson = (id) => {
    setGuestPeople((prev) => {
      const next = prev.filter((person) => person.id !== id)
      setResponsibleId((current) => {
        if (current !== id) return current
        return next[0]?.id || null
      })
      return next
    })
  }

  /** Renombra una persona desde la lista de participantes. */
  const renameGuestPerson = (id, value) => {
    setGuestPeople((prev) =>
      prev.map((person) => (person.id === id ? { ...person, name: value } : person))
    )
  }

  /** Posicion (1 based) de quien responde por la reserva. */
  const responsiblePosition = (() => {
    if (guestPeople.length === 0) return 1
    const index = guestPeople.findIndex((person) => person.id === responsibleId)
    return index >= 0 ? index + 1 : 1
  })()

  const allNamesValid = items.every((item) => {
    const arr = participantNames[item.lineId] || []
    if (arr.length !== Math.max(1, Number(item.peopleCount) || 1)) return false
    return arr.every((n) => typeof n === 'string' && n.trim().length >= 2)
  })

  const canPayCard = (() => {
    if (items.some((it) => !it.date || !it.time)) return false
    if (!allNamesValid) return false
    if (isGuest && !emailOk) return false
    return true
  })()

  const handleCardInput = (field) => (e) => {
    let value = e.target.value
    if (field === 'cardNumber') {
      const digits = value.replace(/\D/g, '').slice(0, 19)
      value = digits.replace(/(.{4})/g, '$1 ').trim()
    }
    if (field === 'expiration') {
      const digits = value.replace(/\D/g, '').slice(0, 4)
      value = digits.length > 2 ? `${digits.slice(0, 2)}/${digits.slice(2)}` : digits
    }
    if (field === 'cvv') {
      value = value.replace(/\D/g, '').slice(0, 4)
    }
    if (field === 'cardHolder') {
      value = value.toUpperCase()
    }
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  // El carrito guarda SIEMPRE pesos (ver useCartStore): aqui no se convierte nada.
  const formatPrice = (price) => formatPriceMXN(price, locale)

  // Al volver de Stripe con status=success + session_id, confirmar y crear bookings
  // Funciona tanto para guest como para auth (sin token requerido)
  useEffect(() => {
    const status = new URLSearchParams(window.location.search).get('status')
    const sessionId = new URLSearchParams(window.location.search).get('session_id')

    if (status === 'success' && sessionId) {
      window.history.replaceState({}, document.title, '/checkout')
      void confirmPayment(sessionId)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token])

  const buildItemsPayload = () =>
    items.map((item) => ({
      experienceId: item.experienceId,
      date: item.date,
      time: item.time,
      peopleCount: Math.max(1, Number(item.peopleCount) || 1),
      participantNames: participantNames[item.lineId] || [],
      unitPrice: item.price || 0,
    }))

  const createCheckoutSession = async () => {
    const invalidItems = items.filter((item) => !item.date || !item.time)
    if (invalidItems.length > 0) {
      setError(
        locale === 'es'
          ? 'Selecciona fecha y hora para todas las experiencias antes de continuar.'
          : 'Select a date and time for every experience before continuing.'
      )
      return
    }
    if (isGuest && !emailOk) {
      setGuestEmailTouched(true)
      setError(
        locale === 'es'
          ? 'Ingresa un email válido para enviar tus tickets.'
          : 'Enter a valid email to receive your tickets.'
      )
      return
    }
    if (!allNamesValid) {
      setError(
        locale === 'es'
          ? 'Escribe el nombre de cada persona que irá al tour (para el ticket).'
          : 'Enter the name of every guest for the ticket.'
      )
      return
    }

    setIsSubmitting(true)
    setError(null)
    try {
      const headers = { 'Content-Type': 'application/json' }
      if (token) headers.Authorization = `Bearer ${token}`

      const guestNameForStripe = isGuest
        ? (participantNames[items[0]?.lineId]?.[0] || '').trim() || 'Invitado'
        : undefined

      const response = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          items: buildItemsPayload(),
          customerEmail: isGuest ? guestEmail.trim() : user?.email,
          // Quien responde por la reserva: sus datos van en los tickets.
          responsiblePosition: isGuest ? responsiblePosition : 1,
          // Los emails de las demas personas viajan en la sesion de Stripe
          // (para poder mandarles su ticket) pero no se guardan en nuestra
          // base: el invitado no queda registrado.
          guestEmails:
            isGuest && guestPeople.length > 1
              ? guestPeople.slice(1).map((person) => person.email)
              : undefined,
          customerName: isGuest
            ? guestNameForStripe
            : user?.firstName
            ? `${user.firstName} ${user.lastName || ''}`.trim()
            : undefined,
          locale,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'No pudimos iniciar el pago')
      }

      // Guardar snapshot de participantNames/guestEmail para que confirm los recupere si el usuario recarga
      try {
        sessionStorage.setItem(
          'amaxing_checkout_snapshot',
          JSON.stringify({
            participantNames,
            guestEmail: guestEmail.trim(),
            currency: locale === 'es' ? 'MXN' : 'USD',
          })
        )
      } catch (e) {
        void 0
      }

      window.location.href = data.url
    } catch (err) {
      console.error('Checkout error:', err)
      setError(err.message || 'Error al procesar tu compra. Intenta de nuevo.')
      setIsSubmitting(false)
    }
  }

  const confirmPayment = useCallback(
    async (sessionId) => {
      setIsSubmitting(true)
      setError(null)
      try {
        const headers = { 'Content-Type': 'application/json' }
        if (token) headers.Authorization = `Bearer ${token}`

        // Recuperar snapshot si el estado en memoria se perdió al volver de Stripe mock
        let pNames = participantNames
        let gEmail = guestEmail
        let currency = locale === 'es' ? 'MXN' : 'USD'
        try {
          const snapRaw = sessionStorage.getItem('amaxing_checkout_snapshot')
          if (snapRaw) {
            const snap = JSON.parse(snapRaw)
            if (snap.participantNames) pNames = snap.participantNames
            if (snap.guestEmail) gEmail = snap.guestEmail
            if (snap.currency) currency = snap.currency
          }
        } catch (e) {
          void 0
        }

        const bodyItems = items.length
          ? buildItemsPayload()
          : (() => {
              // Fallback: si items vacío en memoria (recarga), crear con snapshot no es posible — pedir al servidor que lea metadata
              return undefined
            })()

        // Si usamos snapshot para pNames, reconstruir items con esos nombres
        const itemsWithNames =
          bodyItems && Object.keys(pNames).length
            ? bodyItems.map((it) => ({
                ...it,
                participantNames:
                  pNames[items.find((x) => x.experienceId === it.experienceId)?.lineId] ||
                  it.participantNames,
              }))
            : bodyItems

        // Efectivo sin WhatsApp no se guarda: sin teléfono no hay contacto.
        if (payMethod === 'cash' && !customerPhone.trim()) {
          setError(
            locale === 'es'
              ? 'Para reservar en efectivo necesitamos tu WhatsApp.'
              : 'Cash booking requires your WhatsApp number.'
          )
          return
        }

        const response = await fetch('/api/stripe/confirm', {
          method: 'POST',
          headers,
          body: JSON.stringify({
            sessionId,
            items: itemsWithNames,
            guestEmail: isGuest || !token ? gEmail?.trim() : undefined,
            responsiblePosition: isGuest ? responsiblePosition : 1,
            guestName: isGuest || !token ? (pNames[items[0]?.lineId]?.[0] || '').trim() : undefined,
            currency,
            participantNamesMap: Object.fromEntries(
              items.map((it) => [it.experienceId, pNames[it.lineId] || []])
            ),
            acquisitionChannel: getAcquisitionChannel(),
            paymentMethod: payMethod,
            customerPhone: customerPhone.trim() || undefined,
          }),
        })

        const data = await response.json()

        if (!response.ok) {
          throw new Error(data.error || 'No pudimos confirmar tu pago')
        }

        const bookings = data.bookings || []
        setCreatedBookings(bookings)
        setSuccess(true)

        // Persistir en localStorage para que profile/tickets los muestren con QR
        // Para guest: se guarda con userId guest_* y sin email (ver storage.ts isGuest)
        // Esto permite métricas admin/empleado sin guardar PII. El guest puede descargar
        // los tickets en esta misma vista; no es necesario guardarlos a largo plazo.
        try {
          const existing = localStorage.getItem('amaxing_bookings')
          const parsed = existing ? JSON.parse(existing) : []
          localStorage.setItem(
            'amaxing_bookings',
            JSON.stringify([...(Array.isArray(parsed) ? parsed : []), ...bookings])
          )
        } catch (e) {
          /* storage lleno o no disponible */
        }

        // Analítica pasiva: conversión purchase (funciona sin cuenta — userId null para guest)
        try {
          const sid = sessionStorage.getItem('analytics_session_id')
          await fetch('/api/analytics/track', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              eventType: 'purchase',
              conversionEvent: 'purchase',
              conversionValue: subtotal,
              sessionId: sid,
              userId: user?.id || null,
              pagePath: '/checkout',
              pageCategory: 'checkout',
              timeOnPage: 0,
              scrollDepth: 0,
              bounce: false,
              exitPage: false,
              userAgent: navigator.userAgent,
              referrerUrl: document.referrer || '',
              eventData: { isGuest: !!data.isGuest, itemCount, currency },
            }),
          })
        } catch (e) {
          void 0
        }

        try {
          sessionStorage.removeItem('amaxing_checkout_snapshot')
        } catch (e) {
          void 0
        }
        clearCart()
      } catch (err) {
        console.error('Confirm error:', err)
        setError(err.message || 'Ocurrió un error al confirmar el pago.')
      } finally {
        setIsSubmitting(false)
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [token, clearCart, items, participantNames, guestEmail, locale, subtotal, itemCount, user]
  )

  /**
   * Confirmación de cripto: el navegador solo manda la referencia; el servidor
   * vuelve a verificar el pago, guarda la reserva pagada en Turso y devuelve
   * los tickets reales. Así el ticket no nace de un hash inventado.
   */
  const confirmCryptoPayment = useCallback(
    async (reference, network) => {
      setIsSubmitting(true)
      setError(null)
      try {
        const headers = { 'Content-Type': 'application/json' }
        if (token) headers.Authorization = `Bearer ${token}`

        const cryptoItems = items.map((item) => ({
          experienceId: item.experienceId || item.id,
          date: item.date,
          time: item.time,
          peopleCount: Math.max(1, Number(item.peopleCount) || 1),
          participantNames: participantNames[item.lineId] || [],
          unitPrice: item.price || 0,
        }))

        if (!cryptoItems.length) {
          throw new Error(locale === 'es' ? 'Tu carrito está vacío.' : 'Your cart is empty.')
        }

        const response = await fetch('/api/bookings/crypto', {
          method: 'POST',
          headers,
          body: JSON.stringify({
            reference,
            network,
            items: cryptoItems,
            guestEmail: isGuest || !token ? guestEmail.trim() : undefined,
            customerName: isGuest
              ? (participantNames[items[0]?.lineId]?.[0] || '').trim()
              : user?.firstName
              ? `${user.firstName} ${user.lastName || ''}`.trim()
              : undefined,
            customerPhone: customerPhone.trim() || undefined,
            currency: locale === 'es' ? 'MXN' : 'USD',
            responsiblePosition: isGuest ? responsiblePosition : 1,
            locale,
          }),
        })

        const data = await response.json()
        if (!response.ok) {
          throw new Error(data.error || 'No pudimos confirmar tu pago')
        }

        const bookings = data.bookings || []
        setCreatedBookings(bookings)

        try {
          const existing = localStorage.getItem('amaxing_bookings')
          const parsed = existing ? JSON.parse(existing) : []
          localStorage.setItem(
            'amaxing_bookings',
            JSON.stringify([...(Array.isArray(parsed) ? parsed : []), ...bookings])
          )
        } catch (e) {
          /* storage lleno o no disponible */
        }

        try {
          const sid = sessionStorage.getItem('analytics_session_id')
          await fetch('/api/analytics/track', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              eventType: 'purchase',
              conversionEvent: 'purchase',
              conversionValue: subtotal,
              sessionId: sid,
              userId: user?.id || null,
              pagePath: '/checkout',
              pageCategory: 'checkout',
              timeOnPage: 0,
              scrollDepth: 0,
              bounce: false,
              exitPage: false,
              userAgent: navigator.userAgent,
              referrerUrl: document.referrer || '',
              eventData: {
                isGuest: isGuest || !token,
                paymentMethod: 'crypto',
                itemCount,
                currency: locale === 'es' ? 'MXN' : 'USD',
              },
            }),
          })
        } catch (e) {
          void 0
        }

        setSuccess(true)
        setShowCryptoModal(false)
        clearCart()
        try {
          sessionStorage.removeItem('amaxing_checkout_snapshot')
        } catch (e) {
          void 0
        }
      } catch (err) {
        console.error('Crypto confirm error:', err)
        setError(err.message || 'Ocurrió un error al confirmar el pago.')
        throw err
      } finally {
        setIsSubmitting(false)
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [
      token,
      items,
      participantNames,
      guestEmail,
      locale,
      isGuest,
      user,
      customerPhone,
      responsiblePosition,
      clearCart,
      subtotal,
      itemCount,
    ]
  )

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white dark:bg-zinc-950">
        <Loader2 className="h-8 w-8 animate-spin text-orange-500" />
      </div>
    )
  }

  if (success) {
    const isGuestSuccess = createdBookings.some(
      (b) => b.isGuest || String(b.userId).startsWith('guest_')
    )

    // Enriquecer bookings con datos del checkout para el Ticket Padre
    const masterBookings = createdBookings.map((b, idx) => {
      const item = items[idx] || items[0]
      const participantNames = Array.isArray(b.tickets)
        ? b.tickets.map((t) => t.participantName)
        : []
      return {
        ...b,
        peopleCount: b.guests || 1,
        customerName: participantNames[0] || b.customerName || '',
        customerPhone: b.customerPhone || customerPhone || '',
        customerEmail: b.customerEmail || (isGuest ? guestEmail : user?.email) || '',
        experienceImage: b.imageUrl || item?.imageUrl || null,
        isResponsible: idx === 0,
        participantNames,
      }
    })

    return (
      <div className="min-h-screen bg-white dark:bg-zinc-950">
        <div className="container mx-auto px-4 py-12">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="mx-auto max-w-2xl text-center"
          >
            <CheckCircle2 className="mx-auto h-20 w-20 text-emerald-500" />
            <h1 className="mt-6 text-3xl font-bold text-gray-900 dark:text-white md:text-4xl">
              {t('checkoutSuccess.title', '¡Reservas confirmadas!')}
            </h1>
            <p className="mt-3 text-zinc-600 dark:text-gray-300">
              {isGuestSuccess
                ? locale === 'es'
                  ? 'Tus tickets con QR están listos. No guardamos tu email ni tus datos — descarga tus tickets ahora.'
                  : 'Your QR tickets are ready. We did not store your email or data — download your tickets now.'
                : t(
                    'checkoutSuccess.detailsSent',
                    'Se generaron los tickets con su QR. Puedes verlos en tu perfil o descargarlos aquí.'
                  )}
            </p>

            {/* Ticket Padre — resumen de todas las reservas de esta compra */}
            <div className="mt-8">
              <button
                onClick={() => setShowMasterTicket(true)}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-orange-500 px-4 py-3 font-semibold text-white transition-colors hover:bg-orange-600"
              >
                <Users className="h-5 w-5" />
                {locale === 'es'
                  ? 'Ver y descargar Ticket Padre (todos)'
                  : 'View and download Parent Ticket (all)'}
              </button>
              {showMasterTicket && (
                <MasterTicket
                  bookings={masterBookings}
                  onClose={() => setShowMasterTicket(false)}
                />
              )}
            </div>

            <div className="mt-10 flex flex-col justify-center gap-4 sm:flex-row">
              {isGuestSuccess ? (
                <>
                  <Link
                    href="/journeys"
                    className="inline-flex items-center justify-center rounded-xl bg-orange-500 px-8 py-3 font-semibold text-white transition-colors hover:bg-orange-600"
                  >
                    {t('cart.exploreTours', 'Explorar más tours')}
                  </Link>
                  <Link
                    href="/login"
                    className="inline-flex items-center justify-center rounded-xl border border-zinc-300 bg-white px-8 py-3 font-semibold text-gray-900 transition-colors hover:border-orange-500/30 dark:border-white/10 dark:bg-zinc-900 dark:text-white"
                  >
                    {locale === 'es' ? 'Crear cuenta' : 'Create account'}
                  </Link>
                </>
              ) : (
                <>
                  <Link
                    href="/profile"
                    className="inline-flex items-center justify-center rounded-xl bg-orange-500 px-8 py-3 font-semibold text-white transition-colors hover:bg-orange-600"
                  >
                    {t('checkoutSuccess.viewBookings', 'Ir a mi perfil')}
                  </Link>
                  <Link
                    href="/journeys"
                    className="inline-flex items-center justify-center rounded-xl border border-zinc-300 bg-white px-8 py-3 font-semibold text-gray-900 transition-colors hover:border-orange-500/30 dark:border-white/10 dark:bg-zinc-900 dark:text-white"
                  >
                    {t('cart.exploreTours', 'Explorar más tours')}
                  </Link>
                </>
              )}
            </div>
            {isGuestSuccess && (
              <p className="mt-6 text-xs text-zinc-500 dark:text-gray-500">
                {locale === 'es'
                  ? 'Métricas de demanda, ingresos y mejores horarios se generan de forma agregada para el equipo — sin guardar tu email.'
                  : 'Demand, revenue and best-slot metrics are aggregated for the team — without storing your email.'}
              </p>
            )}
          </motion.div>
        </div>

        {selectedTicket && (
          <VirtualTicket ticket={selectedTicket} onClose={() => setSelectedTicket(null)} />
        )}

        {/* Modal: agregar más journeys desde el summary */}
        <AnimatePresence>
          {showAddMoreModal && (
            <div
              className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 sm:p-6"
              role="dialog"
              aria-modal="true"
              aria-label={locale === 'es' ? 'Agregar más journeys' : 'Add more journeys'}
              onClick={(e) => {
                if (e.target === e.currentTarget) setShowAddMoreModal(false)
              }}
            >
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                transition={{ duration: 0.2 }}
                className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl dark:bg-zinc-900"
              >
                <div className="mb-4 flex items-center justify-between">
                  <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                    {locale === 'es' ? 'Seleccionar journeys' : 'Select journeys'}
                  </h2>
                  <button
                    type="button"
                    onClick={() => setShowAddMoreModal(false)}
                    className="rounded-lg p-2 text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-100"
                    aria-label={t('checkout.close', 'Cerrar')}
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>

                <p className="mb-4 text-sm text-zinc-600 dark:text-gray-400">
                  {locale === 'es'
                    ? 'Elige los journeys que quieres agregar y cuántas personas irán a cada uno.'
                    : 'Choose the journeys you want to add and how many people will go to each one.'}
                </p>

                <div className="space-y-3">
                  {JOURNEYS.map((journey) => {
                    const already = cartIds.has(journey.id)
                    const people = selectedJourneys[journey.id] || 1
                    const title = pickLocalized(
                      journey.title_es,
                      journey.title_en,
                      currentLanguage === 'es'
                    )
                    return (
                      <div
                        key={journey.id}
                        className="group relative flex items-center justify-between gap-3 rounded-xl border p-3 transition-colors hover:bg-orange-50/50 dark:hover:bg-orange-900/10"
                      >
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-semibold text-gray-900 dark:text-white">
                            {title}
                          </p>
                          <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
                            {formatPriceMXN(journey.price, locale)}
                          </p>
                          {already && (
                            <p className="mt-1 text-[11px] font-semibold text-orange-600 dark:text-orange-400">
                              {t('checkout.alreadyInCart', 'Ya está en tu carrito')}
                            </p>
                          )}
                        </div>

                        {already ? (
                          <span className="text-[11px] text-zinc-500 dark:text-zinc-500/50">
                            {t('checkout.alreadyInCart', 'Ya está en tu carrito')}
                          </span>
                        ) : (
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => toggleJourney(journey.id, Math.max(1, people - 1))}
                              disabled={people <= 1}
                              className="flex h-7 w-7 items-center justify-center rounded-lg border border-zinc-300 bg-white text-sm font-bold text-gray-900 transition-colors hover:bg-zinc-100 disabled:opacity-40 dark:border-white/10 dark:bg-zinc-950 dark:text-white dark:hover:bg-zinc-900"
                              aria-label={locale === 'es' ? 'Menos personas' : 'Fewer people'}
                            >
                              −
                            </button>
                            <span className="w-8 text-center text-sm font-medium text-gray-900 dark:text-white">
                              {people}
                            </span>
                            <button
                              type="button"
                              onClick={() => toggleJourney(journey.id, people + 1)}
                              className="flex h-7 w-7 items-center justify-center rounded-lg border border-zinc-300 bg-white text-sm font-bold text-gray-900 transition-colors hover:bg-zinc-100 dark:border-white/10 dark:bg-zinc-950 dark:text-white dark:hover:bg-zinc-900"
                              aria-label={locale === 'es' ? 'Más personas' : 'More people'}
                            >
                              <Plus className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>

                <div className="mt-6 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setShowAddMoreModal(false)}
                    className="rounded-lg border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-600 transition-colors hover:bg-zinc-50 dark:border-white/10 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800"
                  >
                    {t('checkout.close', 'Close')}
                  </button>
                  <button
                    type="button"
                    onClick={addSelectedJourneys}
                    disabled={Object.keys(selectedJourneys).length === 0}
                    className="rounded-lg bg-orange-500 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-orange-600 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    {t('checkout.addToCart', 'Add to cart')}
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        <CryptoPayment
          open={showCryptoModal}
          amount={subtotal}
          currency={locale === 'es' ? 'MXN' : 'USD'}
          onClose={() => setShowCryptoModal(false)}
          onConfirmed={confirmCryptoPayment}
        />
      </div>
    )
  }

  if (items.length === 0) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white px-4 dark:bg-zinc-950">
        <div className="max-w-md text-center">
          <h1 className="mb-4 text-3xl font-bold text-gray-900 dark:text-white">
            {t('cart.emptyTitle', 'Tu carrito está vacío')}
          </h1>
          <p className="mb-6 text-zinc-500 dark:text-gray-400">
            {t('cart.emptySubtitle', 'Agrega experiencias antes de hacer checkout.')}
          </p>
          <Link
            href="/journeys"
            className="inline-flex items-center justify-center rounded-xl bg-orange-500 px-8 py-4 font-semibold text-white transition-colors hover:bg-orange-600"
          >
            {t('cart.exploreTours', 'Explorar experiencias')}
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen overflow-x-hidden bg-transparent dark:bg-transparent">
      <div className="container mx-auto max-w-full overflow-hidden px-4 py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mx-auto w-full max-w-4xl overflow-hidden"
        >
          <Link
            href="/cart"
            className="mb-8 inline-flex items-center gap-2 text-sm font-medium text-orange-500 hover:text-orange-400"
          >
            <ArrowLeft className="h-4 w-4" /> {t('checkout.backToCart', 'Volver al carrito')}
          </Link>

          <div className="mb-8 flex items-center justify-between">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              {t('checkout.title', 'Checkout')}
            </h1>
          </div>

          {error && (
            <div className="mb-6 rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-red-600 dark:bg-red-500/20 dark:text-red-300">
              {error}
            </div>
          )}

          {/* El correo del comprador ya existe: se ofrece entrar */}
          {showLoginPrompt && (
            <div
              className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
              role="dialog"
              aria-modal="true"
              aria-labelledby="jamaica-login-prompt-title"
              onClick={(event) => {
                if (event.target === event.currentTarget) setShowLoginPrompt(false)
              }}
            >
              <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl dark:bg-zinc-900">
                <h2
                  id="jamaica-login-prompt-title"
                  className="font-serif text-xl text-gray-900 dark:text-white"
                >
                  {locale === 'es'
                    ? 'Este correo ya tiene una cuenta en Amaxing'
                    : 'This email already has an Amaxing account'}
                </h2>
                <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-300">
                  {locale === 'es'
                    ? 'Si entras, tu reserva queda guardada y podras consultarla cuando quieras. Si prefieres continuar como invitado, tambien puedes: solo no se guardara en tu cuenta.'
                    : 'If you log in, your booking is saved and you can check it whenever you want. You can also continue as a guest: it just will not be saved to your account.'}
                </p>
                <div className="mt-6 flex flex-col gap-2 sm:flex-row-reverse">
                  <Link
                    href={`/login?redirect=/checkout&email=${encodeURIComponent(
                      guestEmail.trim()
                    )}`}
                    className="flex-1 rounded-xl bg-orange-500 px-4 py-3 text-center text-sm font-semibold text-white transition-colors hover:bg-orange-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 focus-visible:ring-offset-2"
                  >
                    {locale === 'es' ? 'Sí, quiero entrar' : 'Yes, I want to log in'}
                  </Link>
                  <button
                    type="button"
                    onClick={() => setShowLoginPrompt(false)}
                    className="flex-1 rounded-xl border border-zinc-300 px-4 py-3 text-sm font-semibold text-zinc-700 transition-colors hover:bg-zinc-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 focus-visible:ring-offset-2 dark:border-white/10 dark:text-zinc-200 dark:hover:bg-zinc-800"
                  >
                    {locale === 'es' ? 'Continuar como invitado' : 'Continue as guest'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Identidad: guest vs auth */}
          <div className="mb-6 rounded-2xl bg-white/40 p-4 backdrop-blur-sm dark:bg-white/10">
            {isGuest ? (
              <div>
                <div className="flex items-center gap-2 text-sm font-bold text-gray-900 dark:text-white">
                  <User className="h-4 w-4 text-orange-500" />
                  {locale === 'es'
                    ? 'Paga como invitado — sin crear cuenta'
                    : 'Pay as guest — no account needed'}
                  <span className="rounded-full bg-orange-500/15 px-2 py-0.5 text-xs font-semibold text-orange-600 dark:text-orange-300">
                    {locale === 'es' ? 'Invitado' : 'Guest'}
                  </span>
                </div>
                <p className="mt-1 text-xs text-zinc-500 dark:text-gray-400">
                  {locale === 'es'
                    ? 'No guardamos tu email ni tus datos. Solo lo usamos para enviarte el ticket con QR y generar métricas agregadas para el equipo.'
                    : 'We do not store your email or data. We only use it to send your QR ticket and generate aggregated metrics for the team.'}
                </p>
                <div className="mt-3">
                  <GuestPeopleField
                    locale={locale}
                    people={guestPeople}
                    email={guestEmail}
                    name={guestName}
                    onEmailChange={(value) => {
                      setGuestEmail(value)
                      setGuestEmailTouched(true)
                    }}
                    onNameChange={setGuestName}
                    onAdd={addGuestPerson}
                    onRemove={removeGuestPerson}
                    onRename={renameGuestPerson}
                    onSetResponsible={setResponsibleId}
                    responsibleId={responsibleId}
                    emailRegistered={emailRegistered}
                  />
                  {guestEmailTouched && !emailOk && (
                    <p className="mt-1 text-xs text-red-500">
                      {locale === 'es' ? 'Ingresa un email válido' : 'Enter a valid email'}
                    </p>
                  )}
                  <p className="mt-3 text-xs text-zinc-500 dark:text-gray-500">
                    {locale === 'es'
                      ? '¿Prefieres guardar tus reservas?'
                      : 'Want to save your bookings?'}{' '}
                    <Link
                      href="/login?redirect=/checkout"
                      className="font-medium text-orange-500 hover:text-orange-400"
                    >
                      {locale === 'es' ? 'Crea tu cuenta' : 'Create account'}
                    </Link>
                  </p>
                  {emailRegistered && (
                    <button
                      type="button"
                      onClick={() => setShowLoginPrompt(true)}
                      className="mt-2 w-full rounded-xl border border-amber-400/50 bg-amber-400/10 px-4 py-2.5 text-left text-xs font-semibold text-amber-700 transition-colors hover:bg-amber-400/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 dark:text-amber-200"
                    >
                      {locale === 'es'
                        ? 'Este correo ya tiene cuenta en Amaxing. ¿Quieres entrar?'
                        : 'This email already has an Amaxing account. Do you want to log in?'}
                    </button>
                  )}
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="flex items-center gap-2 text-sm font-bold text-gray-900 dark:text-white">
                    <User className="h-4 w-4 text-emerald-500" />
                    {locale === 'es' ? 'Reservando como' : 'Booking as'} {user.email}
                  </p>
                  <p className="mt-1 text-xs text-zinc-500 dark:text-gray-400">
                    {locale === 'es'
                      ? 'Autocompletamos tu nombre para el primer ticket — puedes editarlo.'
                      : 'We prefilled your name for the first ticket — you can edit it.'}
                  </p>
                </div>
                <Link
                  href="/profile"
                  className="text-xs font-medium text-orange-500 hover:text-orange-400"
                >
                  {locale === 'es' ? 'Ver perfil' : 'View profile'}
                </Link>
              </div>
            )}
          </div>

          {/* Nombres de participantes por tour */}
          <div className="mb-6 rounded-2xl border border-orange-500/20 bg-orange-500/5 p-4 dark:border-orange-500/10 sm:p-5">
            <h2 className="flex items-center gap-2 text-base font-bold text-gray-900 dark:text-white">
              <TicketIcon className="h-5 w-5 text-orange-500" />
              {locale === 'es' ? '¿Quién va al tour?' : 'Who is going?'}
            </h2>
            <p className="mt-1 text-xs text-zinc-600 dark:text-gray-400">
              {locale === 'es'
                ? 'Necesitamos el nombre de cada persona para generar su ticket con QR. El primer nombre es el comprador.'
                : 'We need each guest name to generate their QR ticket. The first name is the buyer.'}
            </p>
            <div className="mt-4 space-y-4">
              {items.map((item) => (
                <div
                  key={item.lineId}
                  className="rounded-xl bg-white/30 p-3 backdrop-blur-sm dark:bg-white/5"
                >
                  <p className="text-sm font-semibold text-gray-900 dark:text-white">
                    {item.title} — {item.date} • {item.time} • {item.peopleCount}{' '}
                    {item.peopleCount === 1
                      ? t('checkout.person', 'persona')
                      : t('checkout.persons', 'personas')}
                  </p>
                  <div className="mt-3 grid gap-2">
                    {Array.from({ length: Math.max(1, Number(item.peopleCount) || 1) }).map(
                      (_, idx) => (
                        <div key={idx}>
                          <label className="mb-1 block text-xs font-medium text-zinc-600 dark:text-gray-300">
                            {locale === 'es' ? `Persona ${idx + 1}` : `Guest ${idx + 1}`}{' '}
                            {idx === 0 && (
                              <span className="text-orange-500">
                                * {locale === 'es' ? '(comprador)' : '(buyer)'}
                              </span>
                            )}
                          </label>
                          <input
                            type="text"
                            value={participantNames[item.lineId]?.[idx] || ''}
                            onChange={(e) =>
                              updateParticipantName(item.lineId, idx, e.target.value)
                            }
                            placeholder={
                              idx === 0 && user
                                ? authDisplayName
                                : locale === 'es'
                                ? 'Nombre completo'
                                : 'Full name'
                            }
                            className="w-full rounded-xl border border-zinc-300 bg-white px-4 py-2.5 text-sm text-gray-900 placeholder:text-zinc-400 focus:border-orange-500 focus:outline-none dark:border-white/10 dark:bg-zinc-950 dark:text-white"
                          />
                        </div>
                      )
                    )}
                  </div>
                </div>
              ))}
            </div>
            {!allNamesValid && (
              <p className="mt-3 text-xs text-amber-600 dark:text-amber-400">
                {locale === 'es'
                  ? 'Completa todos los nombres (mínimo 2 caracteres cada uno).'
                  : 'Fill every name (at least 2 characters each).'}
              </p>
            )}
          </div>

          <div className="grid gap-6 overflow-hidden lg:grid-cols-2 lg:gap-8">
            {/* Summary */}
            <div className="w-full min-w-0 overflow-hidden rounded-2xl bg-white/40 p-4 backdrop-blur-sm dark:bg-white/10 sm:p-6">
              <h2 className="mb-4 text-xl font-bold text-gray-900 dark:text-white">
                {t('checkout.orderSummary', 'Resumen de tu compra')}
              </h2>
              <div className="space-y-3">
                {items.map((item) => (
                  <div
                    key={item.lineId}
                    className="flex min-w-0 items-center justify-between gap-2 overflow-hidden rounded-xl bg-white/20 p-3 backdrop-blur-sm dark:bg-white/5 sm:gap-3"
                  >
                    <div className="flex min-w-0 flex-1 items-center gap-2 overflow-hidden sm:gap-3">
                      <div className="relative h-12 w-12 flex-shrink-0 overflow-hidden rounded-lg">
                        <Image
                          src={item.imageUrl || '/static/images/jaguarBaja.png'}
                          alt={item.title}
                          fill
                          sizes="48px"
                          className="object-cover"
                        />
                      </div>
                      <div className="min-w-0 flex-1 overflow-hidden">
                        <p className="truncate text-sm font-semibold text-gray-900 dark:text-white sm:text-base">
                          {item.title}
                        </p>
                        <p className="text-xs text-zinc-500 dark:text-gray-400">
                          {item.date} • {item.time || '--'} • {item.peopleCount}{' '}
                          {item.peopleCount === 1
                            ? t('checkout.person', 'persona')
                            : t('checkout.persons', 'personas')}
                        </p>
                      </div>
                    </div>
                    <div className="flex flex-shrink-0 items-center gap-2">
                      <span className="font-medium text-gray-900 dark:text-white">
                        {formatPrice((item.price || 0) * (item.peopleCount || 1))}
                      </span>
                      <button
                        type="button"
                        onClick={() => removeItem(item.lineId)}
                        aria-label={`${t('cart.remove', 'Eliminar')} ${item.title}`}
                        title={t('cart.remove', 'Eliminar')}
                        className="rounded-lg border border-zinc-200 bg-white p-2 text-zinc-500 transition-colors hover:border-red-300 hover:bg-red-50 hover:text-red-600 dark:border-white/10 dark:bg-zinc-900 dark:text-zinc-400 dark:hover:border-red-500/30 dark:hover:bg-red-500/10 dark:hover:text-red-400"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-6 border-t border-zinc-200 pt-4 dark:border-white/10">
                <div className="flex items-center justify-between">
                  <span className="text-zinc-600 dark:text-gray-300">
                    {t('cart.total', 'Total')} ({itemCount}{' '}
                    {itemCount === 1
                      ? t('checkout.person', 'experiencia')
                      : t('cart.experiences', 'experiencias')}
                    )
                  </span>
                  <span className="text-2xl font-bold text-gray-900 dark:text-white">
                    {formatPrice(subtotal)}
                  </span>
                </div>
                <p className="mt-2 text-xs text-zinc-500 dark:text-gray-500">
                  {locale === 'es'
                    ? 'Moneda: MXN (Precios mostrados en MXN)'
                    : 'Currency: MXN — prices shown in MXN'}
                </p>
                <button
                  type="button"
                  onClick={() => clearCart()}
                  className="mt-3 inline-flex items-center gap-1.5 rounded-lg border border-zinc-200 bg-white px-3 py-2 text-xs font-semibold text-zinc-600 transition-colors hover:bg-zinc-50 dark:border-white/10 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800"
                >
                  <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                    />
                  </svg>
                  {locale === 'es' ? 'Vaciar carrito' : 'Clear cart'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedJourneys({})
                    setShowAddMoreModal(true)
                  }}
                  className="mt-3 inline-flex items-center gap-1.5 rounded-lg border border-orange-500/20 bg-orange-500/5 px-3 py-2 text-xs font-semibold text-orange-600 transition-colors hover:bg-orange-500/10 dark:border-orange-500/20 dark:bg-orange-900/10 dark:text-orange-400 dark:hover:bg-orange-900/30"
                >
                  <Plus className="h-3 w-3" />
                  {locale === 'es' ? 'Agregar más journeys' : 'Add more journeys'}
                </button>
              </div>
            </div>

            {/* Payment */}
            <div className="w-full min-w-0 overflow-hidden rounded-2xl border border-orange-500/20 bg-orange-500/5 p-4 dark:border-orange-500/20 sm:p-6">
              <h2 className="mb-4 flex items-center gap-2 text-xl font-bold text-gray-900 dark:text-white">
                <CreditCard className="h-5 w-5 text-orange-500" />
                {t('checkout.payment', 'Detalles de la tarjeta')}
              </h2>

              {/* Selector de método (Stripe/tarjeta bloqueado temporalmente) */}
              <div className="mb-5 grid grid-cols-3 gap-2 sm:gap-3">
                <button
                  type="button"
                  aria-pressed="true"
                  className="flex items-center justify-center gap-1 rounded-xl border border-emerald-500 bg-emerald-500/10 px-2 py-3 text-xs font-bold text-emerald-600 dark:text-emerald-400 sm:gap-2 sm:px-4 sm:text-sm"
                >
                  💵 {locale === 'es' ? 'Efectivo' : 'Cash'}
                </button>
                <button
                  type="button"
                  disabled
                  aria-label={locale === 'es' ? 'Tarjeta próximamente' : 'Card coming soon'}
                  title={
                    locale === 'es'
                      ? 'Pago con tarjeta bloqueado temporalmente'
                      : 'Card payment temporarily blocked'
                  }
                  className="flex items-center justify-center gap-1 rounded-xl border border-zinc-300 px-2 py-3 text-xs font-bold text-zinc-400 transition-colors disabled:opacity-50 dark:border-white/15 dark:text-zinc-500 sm:gap-2 sm:px-4 sm:text-sm"
                >
                  <CreditCard className="h-4 w-4" />
                  {locale === 'es' ? 'Tarjeta' : 'Card'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowCryptoModal(true)}
                  className={`flex items-center justify-center gap-1 rounded-xl border px-2 py-3 text-xs font-bold transition-all sm:gap-2 sm:px-4 sm:text-sm ${'border-zinc-300 text-zinc-500 hover:border-zinc-400 dark:border-white/15 dark:text-gray-400'}`}
                >
                  <span aria-hidden="true">₿</span>
                  {locale === 'es' ? 'Cripto' : 'Crypto'}
                </button>
              </div>

              {payMethod === 'cash' ? (
                <>
                  <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-5 text-center dark:border-emerald-500/20 dark:bg-emerald-500/10">
                    <p className="text-3xl">💵</p>
                    <h3 className="mt-2 font-bold text-gray-900 dark:text-white">
                      {locale === 'es' ? 'Reserva en efectivo' : 'Cash reservation'}
                    </h3>
                    <p className="mt-1 text-sm text-zinc-600 dark:text-gray-400">
                      {locale === 'es'
                        ? 'Reserva ahora sin pagar. Recogerás tu ticket en el punto de encuentro. Te confirmamos por WhatsApp 2 horas antes y pagas en efectivo allí.'
                        : 'Reserve now without paying. Pick up your ticket at the meeting point. We confirm via WhatsApp 2 hours before and you pay in cash there.'}
                    </p>
                    <div className="mt-4 text-left">
                      <label
                        htmlFor="whatsapp-country"
                        className="text-xs font-semibold text-zinc-700 dark:text-zinc-300"
                      >
                        {locale === 'es'
                          ? 'WhatsApp (obligatorio) — con este número te confirmamos'
                          : 'WhatsApp (required) — we confirm on this number'}
                      </label>
                      <div className="mt-1 flex gap-2">
                        <CountrySearchSelect
                          value={phoneCountry}
                          onChange={setPhoneCountry}
                          locale={locale}
                          className="w-[92px] shrink-0 sm:w-[170px]"
                        />
                        <input
                          id="whatsapp-number"
                          type="tel"
                          inputMode="tel"
                          autoComplete="tel"
                          placeholder="55 1234 5678"
                          value={phoneNumber}
                          onChange={(e) => setPhoneNumber(e.target.value)}
                          className="flex-1 rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-orange-500 focus:outline-none dark:border-white/10 dark:bg-zinc-900 dark:text-white"
                        />
                      </div>
                      <p className="mt-1 text-[11px] text-zinc-500 dark:text-zinc-400">
                        {locale === 'es'
                          ? 'Sin este número no se guarda la reserva: sin teléfono no hay forma de avisarte ni de localizarte el día del tour.'
                          : 'Without this number the booking is not saved: there is no way to reach you or find you on tour day.'}
                      </p>
                    </div>
                    <div className="mt-3 rounded-lg bg-white/80 p-3 text-left dark:bg-zinc-900">
                      <p className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                        {locale === 'es' ? '¿Cómo funciona?' : 'How it works?'}
                      </p>
                      <ul className="mt-1 list-inside list-disc text-xs text-zinc-600 dark:text-gray-400">
                        <li>
                          {locale === 'es'
                            ? 'Ticket con QR se genera al reservar (estado: pendiente de pago)'
                            : 'QR ticket is generated on booking (status: pending payment)'}
                        </li>
                        <li>
                          {locale === 'es'
                            ? 'Confirmación por WhatsApp 2h antes con punto exacto'
                            : 'Confirmation via WhatsApp 2h before with exact meeting point'}
                        </li>
                        <li>
                          {locale === 'es'
                            ? 'Pago en efectivo al llegar al punto'
                            : 'Cash payment on arrival at the meeting point'}
                        </li>
                      </ul>
                    </div>
                    {!allNamesValid && (
                      <p className="mt-3 text-xs font-medium text-amber-600 dark:text-amber-400">
                        {locale === 'es'
                          ? 'Primero completa los nombres arriba.'
                          : 'First complete the names above.'}
                      </p>
                    )}
                    {isGuest && !emailOk && (
                      <p className="mt-2 text-xs font-medium text-amber-600 dark:text-amber-400">
                        {locale === 'es'
                          ? 'Ingresa tu email para el ticket.'
                          : 'Enter your email for the ticket.'}
                      </p>
                    )}
                  </div>
                  <button
                    onClick={async () => {
                      if (
                        !allNamesValid ||
                        (isGuest && !emailOk) ||
                        items.some((it) => !it.date || !it.time)
                      ) {
                        if (isGuest && !emailOk) setGuestEmailTouched(true)
                        setError(
                          !allNamesValid
                            ? locale === 'es'
                              ? 'Completa los nombres de todos los participantes'
                              : 'Complete all participant names'
                            : isGuest && !emailOk
                            ? locale === 'es'
                              ? 'Ingresa tu email'
                              : 'Enter your email'
                            : locale === 'es'
                            ? 'Selecciona fecha y hora para cada tour'
                            : 'Select date and time for every tour'
                        )
                        return
                      }
                      setIsSubmitting(true)
                      setError(null)
                      try {
                        // La reserva en efectivo se guarda de verdad: el
                        // equipo la ve y cada persona recibe su ticket.
                        const response = await fetch('/api/bookings/cash', {
                          method: 'POST',
                          headers: {
                            'Content-Type': 'application/json',
                            ...(token ? { Authorization: `Bearer ${token}` } : {}),
                          },
                          body: JSON.stringify({
                            items: buildItemsPayload(),
                            customerName: (participantNames[items[0]?.lineId]?.[0] || '').trim(),
                            customerEmail: isGuest ? guestEmail.trim() : user?.email,
                            customerPhone: customerPhone.trim(),
                            responsiblePosition,
                            locale,
                          }),
                        })
                        const data = await response.json().catch(() => ({}))
                        if (!response.ok) {
                          throw new Error(
                            data?.error ||
                              (locale === 'es'
                                ? 'No pudimos guardar la reserva'
                                : 'We could not save the booking')
                          )
                        }
                        const cashBookings = data.bookings || []

                        // Métrica
                        try {
                          const sid = sessionStorage.getItem('analytics_session_id')
                          await fetch('/api/analytics/track', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                              eventType: 'purchase',
                              conversionEvent: 'purchase',
                              conversionValue: subtotal,
                              sessionId: sid,
                              userId: user?.id || null,
                              pagePath: '/checkout',
                              pageCategory: 'checkout',
                              eventData: {
                                isGuest: !user,
                                itemCount,
                                currency: 'MXN',
                              },
                            }),
                          })
                        } catch (e) {
                          void 0
                        }
                        setCreatedBookings(cashBookings)
                        setSuccess(true)
                        try {
                          localStorage.removeItem('amaxing_pay_cash')
                        } catch (e) {
                          void 0
                        }
                        clearCart()
                      } catch (e) {
                        setError(e.message || 'Error al crear reserva en efectivo')
                      } finally {
                        setIsSubmitting(false)
                      }
                    }}
                    disabled={isSubmitting || !allNamesValid || (isGuest && !emailOk)}
                    className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 py-4 font-semibold text-white transition-colors hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="h-5 w-5 animate-spin" />
                        {locale === 'es' ? 'Reservando...' : 'Booking...'}
                      </>
                    ) : (
                      <>
                        💵{' '}
                        {locale === 'es'
                          ? 'Confirmar reserva en efectivo'
                          : 'Confirm cash reservation'}{' '}
                        {formatPrice(subtotal)}
                      </>
                    )}
                  </button>
                  <p className="mt-2 text-center text-xs text-zinc-500 dark:text-gray-500">
                    {locale === 'es'
                      ? 'Se generará tu ticket con QR para recoger y pagar en el punto.'
                      : 'Your QR ticket will be generated for pickup and cash payment at the meeting point.'}
                  </p>
                  {isGuest && (
                    <Link
                      href="/register?redirect=/checkout"
                      className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl border border-emerald-500/30 bg-white py-3 text-sm font-semibold text-emerald-600 transition-colors hover:bg-emerald-50 dark:border-emerald-500/20 dark:bg-zinc-900 dark:text-emerald-400"
                    >
                      <User className="h-4 w-4" />
                      {locale === 'es' ? 'O crea tu cuenta' : 'Or create account'}
                    </Link>
                  )}
                </>
              ) : payMethod === 'card' ? (
                <>
                  <div className="mx-auto w-full max-w-full overflow-hidden">
                    <FlipCard
                      cardNumber={form.cardNumber}
                      cardHolder={form.cardHolder}
                      expiration={form.expiration}
                      cvv={form.cvv}
                      isFlipped={focusField === 'cvv'}
                    />
                  </div>

                  <div className="mt-5 grid gap-3 sm:grid-cols-2">
                    <input
                      type="text"
                      inputMode="numeric"
                      autoComplete="cc-number"
                      placeholder={t('checkout.cardNumber', 'Número de tarjeta')}
                      value={form.cardNumber}
                      onChange={handleCardInput('cardNumber')}
                      onFocus={() => setFocusField('cardNumber')}
                      onBlur={() => setFocusField(null)}
                      className="w-full rounded-xl border border-zinc-300 bg-white px-4 py-3 text-sm text-gray-900 focus:border-orange-500 focus:outline-none dark:border-white/10 dark:bg-zinc-900 dark:text-white sm:col-span-2"
                    />
                    <input
                      type="text"
                      autoComplete="cc-name"
                      placeholder={t('checkout.cardHolder', 'Nombre en la tarjeta')}
                      value={form.cardHolder}
                      onChange={handleCardInput('cardHolder')}
                      onFocus={() => setFocusField('cardHolder')}
                      onBlur={() => setFocusField(null)}
                      className="w-full rounded-xl border border-zinc-300 bg-white px-4 py-3 text-sm text-gray-900 focus:border-orange-500 focus:outline-none dark:border-white/10 dark:bg-zinc-900 dark:text-white sm:col-span-2"
                    />
                    <input
                      type="text"
                      inputMode="numeric"
                      autoComplete="cc-exp"
                      placeholder={t('checkout.expiration', 'MM/AA')}
                      value={form.expiration}
                      onChange={handleCardInput('expiration')}
                      onFocus={() => setFocusField('expiration')}
                      onBlur={() => setFocusField(null)}
                      className="w-full rounded-xl border border-zinc-300 bg-white px-4 py-3 text-sm text-gray-900 focus:border-orange-500 focus:outline-none dark:border-white/10 dark:bg-zinc-900 dark:text-white"
                    />
                    <input
                      type="password"
                      inputMode="numeric"
                      autoComplete="cc-csc"
                      placeholder={t('checkout.cvv', 'CVV')}
                      value={form.cvv}
                      onChange={handleCardInput('cvv')}
                      onFocus={() => setFocusField('cvv')}
                      onBlur={() => setFocusField(null)}
                      className="w-full rounded-xl border border-zinc-300 bg-white px-4 py-3 text-sm text-gray-900 focus:border-orange-500 focus:outline-none dark:border-white/10 dark:bg-zinc-900 dark:text-white"
                    />
                  </div>

                  <p className="mt-3 text-xs text-zinc-500 dark:text-gray-500">
                    {t(
                      'checkout.cardPreviewNote',
                      'Esta es una vista previa visual. El cobro real ocurre en el checkout seguro de Stripe.'
                    )}
                  </p>

                  <div className="mt-4 rounded-xl border border-orange-500/20 bg-orange-500/10 p-4 text-xs text-orange-600 dark:text-orange-300">
                    {isGuest
                      ? locale === 'es'
                        ? 'Pagando como invitado: tu email no se guarda. Recibirás el ticket con QR para mostrar en el tour.'
                        : 'Paying as guest: your email is not stored. You will receive the QR ticket to show on tour.'
                      : t(
                          'checkout.qrNote',
                          'Después del pago recibirás un ticket con código QR por cada experiencia.'
                        )}
                  </div>

                  <button
                    onClick={() => void createCheckoutSession()}
                    disabled={isSubmitting || !canPayCard}
                    className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-orange-500 py-4 font-semibold text-white transition-colors hover:bg-orange-600 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="h-5 w-5 animate-spin" />
                        {t('checkout.redirectingStripe', 'Redirigiendo a Stripe...')}
                      </>
                    ) : isGuest ? (
                      <>
                        <Lock className="h-5 w-5" />
                        {locale === 'es' ? 'Pagar como invitado' : 'Pay as guest'}{' '}
                        {formatPrice(subtotal)}
                      </>
                    ) : (
                      <>
                        <Lock className="h-5 w-5" />
                        {t('checkout.payNow', 'Pagar ahora')} {formatPrice(subtotal)}
                      </>
                    )}
                  </button>
                  {isGuest && (
                    <Link
                      href="/register?redirect=/checkout"
                      className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl border border-orange-500/30 bg-white py-3 text-sm font-semibold text-orange-600 transition-colors hover:bg-orange-50 dark:border-orange-500/20 dark:bg-zinc-900 dark:text-orange-300 dark:hover:bg-zinc-800"
                    >
                      <User className="h-4 w-4" />
                      {locale === 'es'
                        ? 'O crea tu cuenta y guarda tus tickets'
                        : 'Or create account to save tickets'}
                    </Link>
                  )}
                  {!canPayCard && !isSubmitting && (
                    <p className="mt-2 text-center text-xs text-amber-600 dark:text-amber-400">
                      {isGuest && !emailOk
                        ? locale === 'es'
                          ? 'Ingresa tu email'
                          : 'Enter your email'
                        : !allNamesValid
                        ? locale === 'es'
                          ? 'Completa los nombres de todos los participantes'
                          : 'Complete all participant names'
                        : locale === 'es'
                        ? 'Selecciona fecha y hora para cada tour'
                        : 'Select date and time for every tour'}
                    </p>
                  )}

                  <p className="mt-3 text-center text-xs text-zinc-500 dark:text-gray-500">
                    {locale === 'es'
                      ? 'Pago con tarjeta en modo DEMO de Stripe: usa la tarjeta de prueba 4242 4242 4242 4242. No se cobra nada real.'
                      : 'Card payment in Stripe DEMO mode: use test card 4242 4242 4242 4242. Nothing real is charged.'}
                  </p>
                </>
              ) : (
                <>
                  <div className="rounded-xl border border-orange-500/20 bg-orange-500/10 p-5 text-center">
                    <p className="text-3xl">₿</p>
                    <h3 className="mt-2 font-bold text-gray-900 dark:text-white">
                      {locale === 'es' ? 'Paga con cripto' : 'Pay with crypto'}
                    </h3>
                    <p className="mt-1 text-sm text-zinc-600 dark:text-gray-400">
                      {locale === 'es'
                        ? 'Ethereum, Base y Lightning Network. Escanea el QR, envía el pago y pega tu hash para verificarlo en cadena.'
                        : 'Ethereum, Base and Lightning Network. Scan the QR, send the payment and paste your hash to verify on-chain.'}
                    </p>
                    {!allNamesValid && (
                      <p className="mt-3 text-xs font-medium text-amber-600 dark:text-amber-400">
                        {locale === 'es'
                          ? 'Primero completa los nombres arriba.'
                          : 'First complete the names above.'}
                      </p>
                    )}
                  </div>

                  <button
                    onClick={() => setShowCryptoModal(true)}
                    disabled={!allNamesValid || (isGuest && !emailOk)}
                    className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-orange-500 py-4 font-semibold text-white transition-colors hover:bg-orange-600 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <Lock className="h-5 w-5" />
                    {isGuest
                      ? locale === 'es'
                        ? 'Pagar con cripto como invitado'
                        : 'Pay with crypto as guest'
                      : locale === 'es'
                      ? 'Pagar con cripto'
                      : 'Pay with crypto'}{' '}
                    {formatPrice(subtotal)}
                  </button>
                  {isGuest && (
                    <Link
                      href="/register?redirect=/checkout"
                      className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl border border-orange-500/30 bg-white py-3 text-sm font-semibold text-orange-600 transition-colors hover:bg-orange-50 dark:border-orange-500/20 dark:bg-zinc-900 dark:text-orange-300 dark:hover:bg-zinc-800"
                    >
                      <User className="h-4 w-4" />
                      {locale === 'es' ? 'O crea tu cuenta' : 'Or create account'}
                    </Link>
                  )}

                  <p className="mt-3 text-center text-xs text-zinc-500 dark:text-gray-500">
                    {locale === 'es'
                      ? 'La reserva se confirma cuando la transacción es verificada on-chain.'
                      : 'The booking is confirmed once the transaction is verified on-chain.'}
                  </p>
                </>
              )}
            </div>
          </div>
        </motion.div>
      </div>
      <CryptoPayment
        open={showCryptoModal}
        amount={subtotal}
        currency={locale === 'es' ? 'MXN' : 'USD'}
        onClose={() => setShowCryptoModal(false)}
        onConfirmed={confirmCryptoPayment}
      />
    </div>
  )
}
