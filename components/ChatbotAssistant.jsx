'use client'

// MIT License - Copyright (c) 2024-2026 Donovan Riaño / Calpulli CDMX - See LICENSE
/**
 * Calpulli AI — components/ChatbotAssistant.jsx
 *
 * Chat flotante con icono de robot.
 *  - Desktop: segundo icono flotante, debajo del botón de WhatsApp.
 *  - Móvil: no muestra botón propio; el MobileDock abre el panel con el
 *    evento "open-calpulli-chatbot".
 *
 * Animación de escritura (typewriter): la respuesta del asistente se muestra
 * carácter por carácter usando streaming SSE del backend. Un cursor parpadeante
 * acompaña la animación.
 *
 * Soporte de idioma: inglés (en) y español (es) determinado por el hook
 * useLanguage. Si el backend detecta un idioma no soportado vía
 * Accept-Language, responde con aviso bilingüe.
 *
 * El endpoint /api/chatbot aplica los filtros de tema, el rate limit y el
 * system prompt. Aquí solo se cuida la experiencia de conversación.
 */
import { useCallback, useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { Bot, Send, X, Sparkles, ChevronUp, ChevronDown, MessageCircleQuestion } from 'lucide-react'
import { useRouter } from 'next/router'
import Link from 'next/link'
import { useLanguage } from '@/lib/hooks/useLanguage'
import { useAuth } from '@/lib/hooks/useAuth'

const WELCOME_ES = '¡Quiubo! Soy Calpulli AI 🤖 — dime qué buscas y te guío.'
const WELCOME_EN = "Hey! I'm Calpulli AI 🤖 — tell me what you need and I'll guide you."

// Respuestas predefinidas anteriores: ocultas por petición. Se mantienen
// comentadas en espíritu pero ya no se usan en el panel.
const QUICK_ACTIONS = {
  es: [
    '¿Qué hacer en CDMX?',
    'Recomiéndame un Journey',
    'Comida imperdible',
    '¿Es seguro moverse?',
  ],
  en: [
    'What should I do in CDMX?',
    'Recommend a Journey',
    'Must-try food',
    'Is it safe to get around?',
  ],
}

// Preguntas predefinidas contextuales por sección, estilo WhatsApp:
// una duda concreta, en ambos idiomas, según la página donde estás.
const PRESET_BY_SECTION = {
  journeyLuchas: {
    es: [
      '¿Cuándo es la próxima función de Luchas?',
      '¿Qué incluye y dónde es el punto de encuentro?',
      '¿Cómo reservo y con cuánto tiempo?',
    ],
    en: [
      'When is the next Luchas show?',
      'What is included and where is the meeting point?',
      'How do I book and how far in advance?',
    ],
  },
  journey: {
    es: ['¿Qué incluye este Journey?', '¿Horarios y punto de encuentro?', '¿Cómo reservo?'],
    en: ['What does this Journey include?', 'Schedules and meeting point?', 'How do I book?'],
  },
  journeys: {
    es: ['¿Qué Journey me recomiendas para 2 días?', '¿Cuál es el más familiar?', '¿Cómo reservo?'],
    en: [
      'Which Journey do you recommend for 2 days?',
      'Which one is most family-friendly?',
      'How do I book?',
    ],
  },
  local: {
    es: [
      '¿Qué hago este fin de semana en CDMX?',
      '¿Qué recomiendas del mes?',
      '¿Dónde comer cerca?',
    ],
    en: [
      'What should I do this weekend in CDMX?',
      'What do you recommend this month?',
      'Where to eat nearby?',
    ],
  },
  maps: {
    es: [
      '¿Qué mapa me conviene para mi visita?',
      '¿Cómo me muevo con el Metro?',
      '¿Ruta recomendada de 1 día?',
    ],
    en: ['Which map fits my trip?', 'How do I get around by Metro?', 'Recommended 1-day route?'],
  },
  guides: {
    es: [
      '¿Qué guía autoguiada me recomiendas?',
      '¿Cuánto dura y qué necesito?',
      '¿Necesito reservar?',
    ],
    en: [
      'Which self-guided walk do you recommend?',
      'How long does it take and what do I need?',
      'Do I need to book?',
    ],
  },
  bookings: {
    es: [
      'Necesito ayuda con mi reservación',
      '¿Cómo cambio o cancelo?',
      '¿Dónde es el punto de encuentro?',
    ],
    en: [
      'I need help with my booking',
      'How do I change or cancel?',
      'Where is the meeting point?',
    ],
  },
  pricing: {
    es: [
      '¿Cuánto cuesta un Journey?',
      '¿Hay descuentos para grupos?',
      '¿Qué métodos de pago aceptan?',
    ],
    en: [
      'How much is a Journey?',
      'Are there group discounts?',
      'What payment methods do you accept?',
    ],
  },
  about: {
    es: ['¿Qué es Calpulli CDMX?', '¿Quiénes son y qué ofrecen?', '¿Cómo los contacto?'],
    en: ['What is Calpulli CDMX?', 'Who are you and what do you offer?', 'How do I contact you?'],
  },
  home: {
    es: ['¿Qué Journey me recomiendas?', '¿Qué hacer en CDMX este mes?', '¿Cómo reservo?'],
    en: ['Which Journey do you recommend?', 'What to do in CDMX this month?', 'How do I book?'],
  },
}

// 4 respuestas sugeridas permanentes (siempre visibles, en ambos idiomas).
// 1) Museos/restaurantes/bares/atracciones: el asistente hace las preguntas
//    que necesite (sin máximo de 4) para dar el Journey o Guía que más se
//    adapte; si no hay, WhatsApp. Las preguntas/respuestas se alojan en
//    Turso (chat_questions) para medir qué busca la gente.
// 2) "¿Qué buscas?" -> detectar y mandar al blog más cercano o fuentes confiables.
// 3) "Tengo una duda sobre lo que veo" -> explicar blog, qué hacer y qué agendar.
// 4) Journey a la medida -> WhatsApp con mensaje precargado.
const WHATSAPP_CUSTOM_URL =
  'https://wa.me/525512291607?text=' +
  encodeURIComponent('Hola Calpulli CDMX, quiero un Journey a la medida. Me gustaría: ')

const SUGGESTED_FOUR = {
  es: [
    {
      kind: 'send',
      suggestionKey: 'museos-comida-bares',
      label: 'Museos, restaurantes, bares, atracciones',
      message:
        'Quiero recomendaciones de museos, restaurantes, bares o atracciones en CDMX. Pregúntame lo que necesites para recomendarme bien (colonia, presupuesto, día/horario, ambiente, qué me late) y llévame al Journey o guía que más se adapte; si no hay, ofréceme WhatsApp para armarlo.',
    },
    {
      kind: 'send',
      suggestionKey: 'buscar',
      label: '¿Qué buscas? Te ayudo a encontrarlo',
      message:
        '¿Qué buscas en el sitio? Te ayudo a encontrarlo: dime qué necesitas y llévame al blog o resultado más cercano; si no lo tienen, dime fuentes confiables.',
    },
    {
      kind: 'send',
      suggestionKey: 'duda-pagina',
      label: 'Tengo una duda sobre lo que veo',
      message:
        'Tengo una duda sobre lo que veo en esta página: explícame en qué blog o sección está, qué puedo hacer ahí y qué me recomiendas ver o agendar.',
    },
    { kind: 'whatsapp', label: 'Quiero un journey a la medida', url: WHATSAPP_CUSTOM_URL },
  ],
  en: [
    {
      kind: 'send',
      suggestionKey: 'museos-comida-bares',
      label: 'Museums, restaurants, bars, attractions',
      message:
        'I want recommendations for museums, restaurants, bars or attractions in CDMX. Ask me whatever you need to recommend me well (neighborhood, budget, day/time, vibe, what I am into) and point me to the Journey or Guide that fits best; if there is none, offer WhatsApp to build it.',
    },
    {
      kind: 'send',
      suggestionKey: 'buscar',
      label: 'What are you looking for? I can find it',
      message:
        'What are you looking for on the site? Help me find it: take me to the closest blog or result; if you do not have it, suggest reliable sources.',
    },
    {
      kind: 'send',
      suggestionKey: 'duda-pagina',
      label: 'I have a question about what I see',
      message:
        'I have a question about what I see on this page: explain which blog or section it is in, what I can do there, and what you recommend seeing or booking.',
    },
    {
      kind: 'whatsapp',
      label: 'I want a custom journey',
      url:
        'https://wa.me/525512291607?text=' +
        encodeURIComponent('Hi Calpulli CDMX, I want a custom Journey. I would like: '),
    },
  ],
}

function sectionForPath(pathname) {
  const path = pathname || '/'
  if (path.startsWith('/journeys/luchas')) return 'journeyLuchas'
  if (path.startsWith('/journeys/')) return 'journey'
  if (path.startsWith('/journeys')) return 'journeys'
  if (path.startsWith('/local')) return 'local'
  if (path.startsWith('/maps')) return 'maps'
  if (path.startsWith('/guides')) return 'guides'
  if (path.startsWith('/bookings') || path.startsWith('/checkout') || path.startsWith('/cart'))
    return 'bookings'
  if (path.startsWith('/pricing')) return 'pricing'
  if (path.startsWith('/about') || path.startsWith('/quienes-somos')) return 'about'
  if (path === '/' || path === '') return 'home'
  return 'home'
}

const STORAGE_KEY = 'calpulli_ai_chat_v1'
const CONVERSATION_KEY = 'calpulli_ai_conversation_id_v1'

function randomConversationId() {
  try {
    if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
      return crypto.randomUUID().slice(0, 80)
    }
  } catch {
    // fallback below
  }
  return `conv-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`.slice(0, 80)
}

/**
 * Inicio de cero en cada recarga: siempre conversación nueva.
 * No se reutiliza el conversation_id guardado en sessionStorage; el historial
 * de logueados vive en Turso y se consulta en /profile?tab=chat.
 */
function freshConversationId() {
  const fresh = randomConversationId()
  try {
    window.sessionStorage.setItem(CONVERSATION_KEY, fresh)
  } catch {
    /* noop */
  }
  return fresh
}

function storageKeyFor(conversationId) {
  return `${STORAGE_KEY}:${conversationId}`
}

// Enlaces permitidos: rutas internas y fuentes oficiales. Nada de competidores
// ni acortadores.
const SAFE_EXTERNAL =
  /^https?:\/\/([a-z0-9-]+\.)*(gob\.mx|inah\.gob\.mx|bellasartes\.gob\.mx|cmll\.com|ticketmaster\.com\.mx|calpulli-cdmx\.com|wa\.me)(\/|$)/i

function isSafeUrl(url) {
  if (!url) return false
  if (url.startsWith('/') && !url.startsWith('//')) return true
  return SAFE_EXTERNAL.test(url)
}

function stripTrailingPunctuation(url) {
  return url.replace(/[.,;:!?]+$/, '')
}

/**
 * Renderiza la respuesta del modelo como texto plano enriquecido: negritas,
 * enlaces markdown y rutas internas. React escapa el resto, así que no hay
 * HTML peligroso.
 */
function RichText({ text }) {
  const tokenRegex =
    /(\[[^\]]+\]\([^)]+\)|\*\*[^*]+\*\*|https?:\/\/[^\s)]+|\/[a-zA-Z0-9][a-zA-Z0-9\-_/]*)/g

  const nodes = []
  let lastIndex = 0
  let match
  let key = 0

  while ((match = tokenRegex.exec(text)) !== null) {
    const token = match[0]
    const start = match.index
    if (start > lastIndex) {
      nodes.push(text.slice(lastIndex, start))
    }

    if (token.startsWith('[')) {
      const link = token.match(/^\[([^\]]+)\]\(([^)]+)\)$/)
      if (link) {
        const [, label, rawUrl] = link
        const url = stripTrailingPunctuation(rawUrl)
        if (isSafeUrl(url)) {
          const external = /^https?:\/\//i.test(url)
          nodes.push(
            <a
              key={`a-${key++}`}
              href={url}
              target={external ? '_blank' : undefined}
              rel={external ? 'noopener noreferrer' : undefined}
              className="font-semibold text-orange-600 underline decoration-orange-300 underline-offset-2 hover:text-orange-700 dark:text-orange-400"
            >
              {label}
            </a>
          )
        } else {
          nodes.push(label)
        }
      } else {
        nodes.push(token)
      }
    } else if (token.startsWith('**')) {
      nodes.push(
        <strong key={`s-${key++}`} className="font-semibold">
          {token.slice(2, -2)}
        </strong>
      )
    } else {
      const url = stripTrailingPunctuation(token)
      if (isSafeUrl(url)) {
        const external = /^https?:\/\//i.test(url)
        nodes.push(
          <a
            key={`l-${key++}`}
            href={url}
            target={external ? '_blank' : undefined}
            rel={external ? 'noopener noreferrer' : undefined}
            className="font-semibold text-orange-600 underline decoration-orange-300 underline-offset-2 hover:text-orange-700 dark:text-orange-400"
          >
            {url}
          </a>
        )
        if (token !== url) nodes.push(token.slice(url.length))
      } else {
        nodes.push(token)
      }
    }

    lastIndex = start + token.length
  }

  if (lastIndex < text.length) nodes.push(text.slice(lastIndex))

  return <>{nodes}</>
}

/** Puntos animados mientras esperamos la primera respuesta del servidor. */
function TypingDots() {
  return (
    <div className="flex items-center gap-1.5 rounded-2xl rounded-bl-none bg-zinc-100 px-3.5 py-2.5 dark:bg-zinc-800">
      {[0, 1, 2].map((i) => (
        <motion.span
          key={i}
          className="h-1.5 w-1.5 rounded-full bg-orange-500"
          animate={{ y: [0, -4, 0], opacity: [0.45, 1, 0.45] }}
          transition={{ duration: 0.65, repeat: Infinity, delay: i * 0.14 }}
        />
      ))}
    </div>
  )
}

/** Cursor parpadeante que acompaña la animación de escritura. */
function BlinkingCursor() {
  return (
    <motion.span
      className="ml-0.5 inline-block h-[1.1em] w-[2px] translate-y-[1px] rounded-full bg-orange-500"
      animate={{ opacity: [1, 0] }}
      transition={{ duration: 0.6, repeat: Infinity, ease: 'steps(2)' }}
      aria-hidden
    />
  )
}

function moneyFmt(n) {
  return `$${Number(n || 0).toLocaleString('en-US')} MXN`
}

/**
 * Tarjeta de cotización (flujo de ventas del chat). Los datos llegan del
 * servidor (lib/chatbot/sales): precios reales del registro de journeys,
 * nunca calculados por el modelo. La reserva se confirma contra
 * /api/bookings/cash (efectivo) — sin Stripe en este flujo.
 */
function QuoteCard({ action, isEs, onBooked }) {
  const [stage, setStage] = useState('idle') // idle | form | sending | done
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [date, setDate] = useState(action?.date || '')
  const [errorMsg, setErrorMsg] = useState('')
  const [bookingRef, setBookingRef] = useState('')

  if (!action || action.type !== 'quote') return null

  const phoneDigits = phone.replace(/\D/g, '')
  const canConfirm =
    stage === 'form' && name.trim().length >= 2 && phoneDigits.length >= 10 && /^\d{4}-\d{2}-\d{2}$/.test(date)

  const confirmBooking = async () => {
    if (!canConfirm) return
    setStage('sending')
    setErrorMsg('')
    try {
      const res = await fetch('/api/bookings/cash', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: [
            {
              experienceId: action.experienceId,
              date,
              peopleCount: action.guests,
              participantNames: [name.trim()],
            },
          ],
          customerName: name.trim(),
          customerPhone: phone.trim(),
          locale: isEs ? 'es' : 'en',
        }),
      })
      const data = await res.json().catch(() => ({}))
      const booking = Array.isArray(data.bookings) ? data.bookings[0] : null
      if (!res.ok || !booking?.bookingReference) {
        setErrorMsg(
          data.error ||
            (isEs ? 'No pudimos guardar la reserva. Intenta de nuevo.' : 'We could not save the booking. Please try again.')
        )
        setStage('form')
        return
      }
      setBookingRef(booking.bookingReference)
      setStage('done')
      if (typeof onBooked === 'function') onBooked(action, booking)
    } catch {
      setErrorMsg(isEs ? 'Sin conexión. Revisa tu internet e intenta otra vez.' : 'No connection. Check your internet and try again.')
      setStage('form')
    }
  }

  const inputCls =
    'w-full rounded-xl border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 outline-none focus:border-orange-400 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100'

  return (
    <div className="w-full max-w-[86%] rounded-2xl border border-orange-200 bg-orange-50/70 px-4 py-3 text-sm text-zinc-900 dark:border-orange-500/30 dark:bg-orange-500/10 dark:text-zinc-100">
      <p className="font-bold">{action.title}</p>
      <dl className="mt-1.5 space-y-0.5 text-[13px] leading-snug">
        {action.dateLabel && (
          <div className="flex justify-between gap-3">
            <dt className="text-zinc-500 dark:text-zinc-400">{isEs ? 'Fecha' : 'Date'}</dt>
            <dd className="text-right font-medium capitalize">{action.dateLabel}</dd>
          </div>
        )}
        <div className="flex justify-between gap-3">
          <dt className="text-zinc-500 dark:text-zinc-400">{isEs ? 'Personas' : 'People'}</dt>
          <dd className="font-medium">{action.guests}</dd>
        </div>
        <div className="flex justify-between gap-3">
          <dt className="text-zinc-500 dark:text-zinc-400">
            {isEs ? 'Precio por persona' : 'Per person'}
          </dt>
          <dd className="font-medium">{moneyFmt(action.unitPrice)}</dd>
        </div>
        <div className="flex justify-between gap-3 border-t border-orange-200/70 pt-1 dark:border-orange-500/20">
          <dt className="font-semibold">{isEs ? 'Total' : 'Total'}</dt>
          <dd className="font-bold">{moneyFmt(action.total)}</dd>
        </div>
      </dl>
      <p className="mt-1.5 text-[11px] leading-snug text-zinc-500 dark:text-zinc-400">
        {isEs
          ? 'Precio real del sitio. Pagas en efectivo en el punto de encuentro.'
          : 'Real site price. You pay in cash at the meeting point.'}
      </p>

      {stage === 'done' ? (
        <p className="mt-2 rounded-xl bg-emerald-100 px-3 py-2 text-[13px] font-semibold text-emerald-900 dark:bg-emerald-500/15 dark:text-emerald-200">
          {isEs
            ? `✅ Reserva confirmada · Folio ${bookingRef}. Te confirmamos por WhatsApp.`
            : `✅ Booking confirmed · Reference ${bookingRef}. We will confirm on WhatsApp.`}
        </p>
      ) : stage === 'idle' ? (
        <button
          type="button"
          onClick={() => setStage('form')}
          className="mt-2.5 w-full rounded-full bg-gradient-to-br from-orange-500 to-pink-600 px-4 py-2 text-[13px] font-bold text-white shadow transition-opacity hover:opacity-90"
        >
          {isEs ? 'Reservar aquí mismo' : 'Book right here'}
        </button>
      ) : (
        <div className="mt-2.5 space-y-2">
          <label className="block">
            <span className="mb-1 block text-[11px] font-semibold text-zinc-500 dark:text-zinc-400">
              {isEs ? 'Fecha del journey' : 'Journey date'}
            </span>
            <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className={inputCls} />
          </label>
          <label className="block">
            <span className="mb-1 block text-[11px] font-semibold text-zinc-500 dark:text-zinc-400">
              {isEs ? 'Nombre de quien reserva' : 'Name of the person booking'}
            </span>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={isEs ? 'Tu nombre' : 'Your name'}
              autoComplete="name"
              className={inputCls}
            />
          </label>
          <label className="block">
            <span className="mb-1 block text-[11px] font-semibold text-zinc-500 dark:text-zinc-400">
              {isEs ? 'Tu WhatsApp (para confirmarte)' : 'Your WhatsApp (to confirm with you)'}
            </span>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+52 55 0000 0000"
              autoComplete="tel"
              className={inputCls}
            />
          </label>
          {errorMsg && (
            <p className="rounded-xl bg-red-50 px-3 py-2 text-xs text-red-600 dark:bg-red-950/40 dark:text-red-300">
              {errorMsg}
            </p>
          )}
          <button
            type="button"
            onClick={confirmBooking}
            disabled={!canConfirm || stage === 'sending'}
            className="w-full rounded-full bg-gradient-to-br from-orange-500 to-pink-600 px-4 py-2 text-[13px] font-bold text-white shadow transition-opacity hover:opacity-90 disabled:opacity-40"
          >
            {stage === 'sending'
              ? isEs
                ? 'Reservando…'
                : 'Booking…'
              : isEs
              ? `Confirmar reserva · ${moneyFmt(action.total)} en efectivo`
              : `Confirm booking · ${moneyFmt(action.total)} in cash`}
          </button>
          <p className="text-[11px] leading-snug text-zinc-500 dark:text-zinc-400">
            {isEs
              ? 'Sin pago en línea: apartas aquí y pagas en efectivo al llegar. La confirmación final llega por WhatsApp.'
              : 'No online payment: you hold your spot here and pay in cash when you arrive. Final confirmation comes on WhatsApp.'}
          </p>
        </div>
      )}
    </div>
  )
}

/**
 * Burbuja del asistente con animación typewriter.
 * Mientras `isStreaming` es true, el texto se muestra con un cursor parpadeante.
 * Al terminar, se renderiza como RichText completo.
 */
function AssistantBubble({ content, isStreaming, action, isEs, onBooked }) {
  return (
    <div className="flex flex-col items-start gap-2">
      <motion.div
        initial={{ opacity: 0, y: 6, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.2, ease: 'easeOut' }}
        className="max-w-[86%] rounded-2xl rounded-bl-none bg-zinc-100 px-4 py-2.5 text-sm leading-relaxed text-zinc-900 dark:bg-zinc-800 dark:text-zinc-100"
      >
        {isStreaming ? (
          <span className="whitespace-pre-wrap">
            {content}
            <BlinkingCursor />
          </span>
        ) : (
          <RichText text={content} />
        )}
      </motion.div>
      {!isStreaming && action ? <QuoteCard action={action} isEs={isEs} onBooked={onBooked} /> : null}
    </div>
  )
}

// Variantes de entrada/salida del panel: al abrir los bloques bajan de arriba
// hacia abajo; al cerrar se van de abajo hacia arriba (stagger invertido).
const stackVariants = {
  hidden: { opacity: 0, y: 24, scale: 0.97 },
  show: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.22, ease: 'easeOut', staggerChildren: 0.07, delayChildren: 0.05 },
  },
  exit: {
    opacity: 0,
    y: 24,
    scale: 0.97,
    transition: { duration: 0.2, ease: 'easeIn', staggerChildren: 0.05, staggerDirection: -1 },
  },
}
const stackItem = {
  hidden: { opacity: 0, y: -14 },
  show: { opacity: 1, y: 0, transition: { duration: 0.28, ease: 'easeOut' } },
  exit: { opacity: 0, y: 14, transition: { duration: 0.18, ease: 'easeIn' } },
}

export default function ChatbotAssistant() {
  const { currentLanguage } = useLanguage()
  const router = useRouter()
  const { user, token } = useAuth()
  const isEs = currentLanguage !== 'en'
  const reduced = useReducedMotion()

  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [inputExpanded, setInputExpanded] = useState(false)
  const [loading, setLoading] = useState(false)
  const [streaming, setStreaming] = useState(false)
  const [streamingMsgId, setStreamingMsgId] = useState(null)
  const [error, setError] = useState('')
  const [conversationId, setConversationId] = useState(null)

  const scrollRef = useRef(null)
  const inputRef = useRef(null)
  const abortRef = useRef(null)
  const loadedRef = useRef(false)

  const welcome = isEs ? WELCOME_ES : WELCOME_EN
  // 4 sugeridas permanentes en todo momento (ES/EN según el header).
  // El contexto por sección se mantiene para el saludo/prompt, pero ya no
  // oculta las sugerencias.
  const actions = SUGGESTED_FOUR[isEs ? 'es' : 'en']

  // Inicio de cero en cada recarga de página: conversación nueva con 0 mensajes.
  // Abrir/cerrar el panel dentro de la misma carga conserva la charla;
  // "Nueva charla" también crea una nueva. El logueado la consulta luego
  // en /profile?tab=chat (se guardó en Turso con su user_id).
  useEffect(() => {
    if (loadedRef.current) return
    loadedRef.current = true
    try {
      const convId = freshConversationId()
      setConversationId(convId)
      setMessages([])
    } catch {
      setConversationId(randomConversationId())
      setMessages([])
    }
  }, [])

  // Persistir la conversación activa.
  useEffect(() => {
    if (!loadedRef.current || !conversationId) return
    try {
      window.sessionStorage.setItem(
        storageKeyFor(conversationId),
        JSON.stringify(messages.slice(-24))
      )
    } catch {
      /* noop */
    }
  }, [messages, conversationId])

  // El MobileDock abre el panel con este evento.
  useEffect(() => {
    const openPanel = () => setOpen(true)
    window.addEventListener('open-calpulli-chatbot', openPanel)
    window.addEventListener('open-amaxing-chatbot', openPanel)
    return () => {
      window.removeEventListener('open-calpulli-chatbot', openPanel)
      window.removeEventListener('open-amaxing-chatbot', openPanel)
    }
  }, [])

  // Autoscroll dentro del panel, sin mover la página.
  useEffect(() => {
    const el = scrollRef.current
    if (el) el.scrollTop = el.scrollHeight
  }, [messages, loading, streaming, open])

  // Foco al abrir (solo desktop, para no abrir el teclado en móvil).
  useEffect(() => {
    if (open && typeof window !== 'undefined' && window.innerWidth >= 768) {
      const timer = setTimeout(() => inputRef.current?.focus(), 250)
      return () => clearTimeout(timer)
    }
  }, [open])

  // El campo crece al escribir: cuando pasa de una línea se expande solo.
  useEffect(() => {
    if (!input) {
      setInputExpanded(false)
      return
    }
    if (input.length > 90 || input.includes('\n')) setInputExpanded(true)
  }, [input])

  // Altura automática del textarea dentro del límite del panel.
  useEffect(() => {
    const el = inputRef.current
    if (!el) return
    el.style.height = 'auto'
    const next = Math.min(el.scrollHeight, inputExpanded ? 180 : 44)
    el.style.height = `${next}px`
  }, [input, inputExpanded, open])

  const sendMessage = useCallback(
    async (text, suggestionKey = null) => {
      const clean = String(text || '').trim()
      if (!clean || loading || streaming) return

      setError('')
      setInput('')
      setInputExpanded(false)
      // suggestions clickeadas se alojan en Turso para la métrica de
      // "qué busca la gente" (ver /api/chatbot + REPORTES).

      const userMsg = {
        id: `u-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        role: 'user',
        content: clean,
      }

      const history = messages
        .slice(-3)
        .filter((m) => m && m.content)
        .map((m) => ({ role: m.role, content: m.content }))

      setMessages((prev) => [...prev, userMsg])
      setLoading(true)

      const assistantMsgId = `a-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`

      try {
        abortRef.current = new AbortController()

        const res = await fetch('/api/chatbot', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify({
            message: clean,
            history,
            locale: isEs ? 'es' : 'en',
            stream: true,
            path: router?.asPath || '/',
            conversationId: conversationId || null,
            suggestionKey,
          }),
          signal: abortRef.current.signal,
        })

        const contentType = res.headers.get('content-type') || ''

        // ── Respuesta SSE (streaming) ──────────────────────────────
        if (contentType.includes('text/event-stream')) {
          setLoading(false)
          setStreaming(true)
          setStreamingMsgId(assistantMsgId)

          // Agregar burbuja vacía del asistente
          setMessages((prev) => [...prev, { id: assistantMsgId, role: 'assistant', content: '' }])

          const reader = res.body.getReader()
          const decoder = new TextDecoder()
          let buffer = ''
          let fullText = ''
          let pendingAction = null

          // eslint-disable-next-line no-constant-condition
          // eslint-disable-next-line no-constant-condition
          while (true) {
            const { done, value } = await reader.read()
            if (done) break

            buffer += decoder.decode(value, { stream: true })
            const lines = buffer.split('\n')
            buffer = lines.pop() || ''

            for (const line of lines) {
              if (line.startsWith('data: ')) {
                const jsonStr = line.slice(6).trim()
                if (jsonStr === '[DONE]') continue

                try {
                  const parsed = JSON.parse(jsonStr)
                  // Evento de acción (cotización de ventas): se adjunta a
                  // la burbuja al cerrar el stream para pintar la tarjeta.
                  if (parsed.action) pendingAction = parsed.action
                  const chunk = parsed.text || ''
                  if (chunk) {
                    fullText += chunk
                    const captured = fullText
                    setMessages((prev) =>
                      prev.map((m) => (m.id === assistantMsgId ? { ...m, content: captured } : m))
                    )
                  }
                } catch {
                  // Ignorar líneas no-JSON
                }
              }
            }
          }

          setStreaming(false)
          setStreamingMsgId(null)

          // Si no llegó texto, poner fallback
          if (!fullText.trim()) {
            const fallback = isEs
              ? 'No recibí respuesta. Intenta de nuevo o escríbenos por WhatsApp.'
              : 'I did not get a reply. Try again or message us on WhatsApp.'
            setMessages((prev) =>
              prev.map((m) => (m.id === assistantMsgId ? { ...m, content: fallback } : m))
            )
          }

          if (pendingAction) {
            const capturedAction = pendingAction
            setMessages((prev) =>
              prev.map((m) => (m.id === assistantMsgId ? { ...m, action: capturedAction } : m))
            )
          }
          return
        }

        // ── Respuesta JSON clásica (fallback / filtros) ─────────────
        const data = await res.json().catch(() => ({}))
        const reply =
          typeof data.reply === 'string' && data.reply.trim()
            ? data.reply.trim()
            : isEs
            ? 'No recibí respuesta. Intenta de nuevo o escríbenos por WhatsApp.'
            : 'I did not get a reply. Try again or message us on WhatsApp.'

        // Simular typewriter para respuestas no-streaming
        setLoading(false)
        setStreaming(true)
        setStreamingMsgId(assistantMsgId)
        setMessages((prev) => [...prev, { id: assistantMsgId, role: 'assistant', content: '' }])

        await typewriterAnimate(assistantMsgId, reply)

        if (data.action) {
          const capturedAction = data.action
          setMessages((prev) =>
            prev.map((m) => (m.id === assistantMsgId ? { ...m, action: capturedAction } : m))
          )
        }

        setStreaming(false)
        setStreamingMsgId(null)
      } catch (err) {
        if (!(err instanceof Error && err.name === 'AbortError')) {
          setError(
            isEs
              ? 'No pude conectarme. Revisa tu internet e intenta otra vez.'
              : 'I could not connect. Check your internet and try again.'
          )
        }
        setStreaming(false)
        setStreamingMsgId(null)
      } finally {
        setLoading(false)
      }
    },
    [isEs, loading, streaming, messages, token, conversationId]
  )

  /**
   * Animación typewriter para respuestas que llegan completas (filtros, JSON).
   * Muestra el texto carácter por carácter con velocidad variable.
   */
  const typewriterAnimate = useCallback(async (msgId, fullText) => {
    const chars = [...fullText]
    let shown = ''
    const baseDelay = 12 // ms por tick
    const punctuationDelay = 80 // pausa en puntos, comas, etc.

    // Velocidad adaptativa: las respuestas de filtros/fast-paths llegan
    // completas al instante, pero con 1-2 caracteres por tick una respuesta
    // de 300 caracteres tardaba ~3 s en terminar de "escribirse". Ahora el
    // tamaño del bloque crece con la longitud para que la animación total
    // no pase de ~90 ticks (~1.1 s); las cortas conservan el efecto
    // carácter por carácter y se hace un solo setState por tick.
    const chunkSize = Math.max(2, Math.ceil(chars.length / 90))

    for (let i = 0; i < chars.length; i += chunkSize) {
      shown += chars.slice(i, i + chunkSize).join('')
      const captured = shown

      setMessages((prev) => prev.map((m) => (m.id === msgId ? { ...m, content: captured } : m)))

      // Velocidad variable: pausa más si el bloque cierra en puntuación
      const lastChar = chars[Math.min(i + chunkSize, chars.length) - 1]
      const isPunctuation = '.!?:;,\n'.includes(lastChar)

      await new Promise((r) => setTimeout(r, isPunctuation ? punctuationDelay : baseDelay))
    }
  }, [])

  // Mensaje de confirmación cuando la tarjeta crea la reserva (efectivo).
  const handleBooked = useCallback(
    (action, booking) => {
      const ref = booking?.bookingReference || ''
      const content = isEs
        ? `✅ ¡Listo! Tu reserva de **${action.title}** quedó apartada con el folio **${ref}**. Pagas ${moneyFmt(
            action.total
          )} en efectivo en el punto de encuentro y te confirmamos los detalles por WhatsApp. ¿Te ayudo con algo más?`
        : `✅ Done! Your **${action.title}** booking is held under reference **${ref}**. You pay ${moneyFmt(
            action.total
          )} in cash at the meeting point and we will confirm the details on WhatsApp. Anything else I can help with?`
      setMessages((prev) => [
        ...prev,
        {
          id: `a-booked-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
          role: 'assistant',
          content,
        },
      ])
    },
    [isEs]
  )

  const handleSubmit = (event) => {
    event.preventDefault()
    sendMessage(input)
  }

  const clearChat = () => {
    abortRef.current?.abort()
    // Nueva charla: conversación nueva y limpia (inicio fresco).
    try {
      if (conversationId) window.sessionStorage.removeItem(storageKeyFor(conversationId))
      const fresh = randomConversationId()
      window.sessionStorage.setItem(CONVERSATION_KEY, fresh)
      setConversationId(fresh)
    } catch {
      /* noop */
    }
    setMessages([])
    setInput('')
    setInputExpanded(false)
    setError('')
    setLoading(false)
    setStreaming(false)
    setStreamingMsgId(null)
  }

  const hasConversation = messages.length > 0

  return (
    <>
      {/* Trigger de escritorio: debajo del botón de WhatsApp.
          En móvil lo abre el MobileDock. */}
      <AnimatePresence>
        {!open && (
          <motion.button
            key="calpulli-ai-trigger"
            type="button"
            onClick={() => setOpen(true)}
            initial={reduced ? false : { scale: 0.6, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={reduced ? false : { scale: 0.6, opacity: 0 }}
            whileHover={reduced ? undefined : { scale: 1.08 }}
            whileTap={reduced ? undefined : { scale: 0.94 }}
            transition={{ type: 'spring', stiffness: 260, damping: 18 }}
            aria-label={isEs ? 'Abrir Calpulli AI' : 'Open Calpulli AI'}
            title={isEs ? 'Calpulli AI — pregúntame de CDMX' : 'Calpulli AI — ask me about CDMX'}
            className="fixed bottom-[calc(1rem+env(safe-area-inset-bottom))] right-4 z-[100] hidden h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-orange-500 to-pink-600 text-white shadow-[0_8px_32px_rgba(222,29,141,0.45)] transition-shadow hover:shadow-[0_10px_40px_rgba(222,29,141,0.65)] sm:right-6 sm:flex"
          >
            {!reduced && (
              <motion.span
                aria-hidden
                className="pointer-events-none absolute inset-0 rounded-full border-2 border-orange-400"
                animate={{ scale: [1, 1.28], opacity: [0.5, 0] }}
                transition={{ duration: 2.4, repeat: Infinity, ease: 'easeOut' }}
              />
            )}
            <Bot className="relative h-7 w-7" aria-hidden />
          </motion.button>
        )}
      </AnimatePresence>

      {/* Panel */}
      <AnimatePresence>
        {open && (
          <motion.div
            key="calpulli-ai-panel"
            role="dialog"
            aria-modal="false"
            aria-label={isEs ? 'Calpulli AI' : 'Calpulli AI'}
            variants={reduced ? undefined : stackVariants}
            initial={reduced ? false : 'hidden'}
            animate="show"
            exit="exit"
            transition={{ duration: reduced ? 0 : 0.22, ease: 'easeOut' }}
            className="fixed inset-x-3 bottom-[calc(5.5rem+env(safe-area-inset-bottom))] z-[110] mx-auto flex max-h-[min(78vh,620px)] w-[calc(100%-1.5rem)] max-w-md flex-col overflow-hidden rounded-3xl border border-zinc-200/70 bg-white shadow-2xl dark:border-zinc-800 dark:bg-zinc-950 sm:inset-auto sm:bottom-24 sm:right-6 sm:mx-0 sm:w-[380px]"
          >
            {/* Header */}
            <motion.div
              variants={reduced ? undefined : stackItem}
              className="m-2 flex shrink-0 items-center justify-between gap-3 rounded-3xl border border-black/5 bg-white/80 px-4 py-3 text-zinc-900 shadow-2xl backdrop-blur-md dark:border-white/10 dark:bg-black/60 dark:text-white"
            >
              <div className="flex min-w-0 items-center gap-2.5">
                <span className="relative flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-orange-500 to-pink-600 text-white shadow-md">
                  <Bot className="h-5 w-5" aria-hidden />
                  <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-white bg-emerald-500 dark:border-zinc-950" />
                </span>
                <div className="min-w-0">
                  <p className="truncate text-sm font-bold text-zinc-900 dark:text-white">
                    Calpulli AI
                  </p>
                  <p className="truncate text-[11px] text-zinc-500 dark:text-zinc-400">
                    {user ? (
                      <>
                        {isEs
                          ? 'Tu guía local · guardado en tu cuenta · '
                          : 'Your local guide · saved to your account · '}
                        <Link
                          href="/profile?tab=chat"
                          className="underline decoration-zinc-300 underline-offset-2 hover:text-orange-600 hover:decoration-orange-300 dark:decoration-zinc-700 dark:hover:text-orange-400"
                        >
                          {isEs ? 'Historial en /profile' : 'History in /profile'}
                        </Link>
                      </>
                    ) : isEs ? (
                      'Tu guía local · en línea'
                    ) : (
                      'Your local guide · online'
                    )}
                  </p>
                </div>
              </div>
              <div className="flex shrink-0 items-center gap-1">
                {hasConversation && (
                  <button
                    type="button"
                    onClick={clearChat}
                    className="inline-flex items-center justify-center gap-1.5 rounded-full bg-black px-3.5 py-1.5 text-[11px] font-bold text-white shadow-md transition-all hover:bg-white hover:text-black hover:ring-1 hover:ring-black/20 active:scale-95 dark:bg-white dark:text-black dark:hover:bg-zinc-900 dark:hover:text-white dark:hover:ring-white/30"
                  >
                    {isEs ? 'Nueva charla' : 'New chat'}
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="rounded-full p-1.5 text-zinc-500 transition-colors hover:bg-zinc-200/70 hover:text-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-200"
                  aria-label={isEs ? 'Cerrar chat' : 'Close chat'}
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </motion.div>

            {/* Mensajes */}
            <motion.div
              variants={reduced ? undefined : stackItem}
              ref={scrollRef}
              className="min-h-0 flex-1 space-y-3 overflow-y-auto px-4 py-4"
            >
              {/* Bienvenida local (no gasta tokens) */}
              <AssistantBubble content={welcome} isStreaming={false} />

              {messages.map((msg) =>
                msg.role === 'assistant' ? (
                  <AssistantBubble
                    key={msg.id}
                    content={msg.content}
                    isStreaming={streaming && msg.id === streamingMsgId}
                    action={msg.action || null}
                    isEs={isEs}
                    onBooked={handleBooked}
                  />
                ) : (
                  <div key={msg.id} className="flex justify-end">
                    <motion.div
                      initial={{ opacity: 0, y: 6, scale: 0.97 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      transition={{ duration: 0.2, ease: 'easeOut' }}
                      className="max-w-[86%] rounded-2xl rounded-br-none bg-gradient-to-br from-orange-500 to-pink-600 px-4 py-2.5 text-sm leading-relaxed text-white"
                    >
                      <p className="whitespace-pre-wrap">{msg.content}</p>
                    </motion.div>
                  </div>
                )
              )}

              {loading && (
                <div className="flex justify-start">
                  <TypingDots />
                </div>
              )}

              {error && (
                <motion.p
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="rounded-xl bg-red-50 px-3 py-2 text-xs text-red-600 dark:bg-red-950/40 dark:text-red-300"
                >
                  {error}
                </motion.p>
              )}
            </motion.div>

            {/* 4 sugeridas permanentes (siempre visibles) */}
            {actions.length > 0 && (
              <motion.div
                variants={reduced ? undefined : stackItem}
                className="flex shrink-0 flex-wrap gap-1.5 border-t border-zinc-200/60 px-3 py-2 dark:border-zinc-800"
              >
                <span className="flex w-full items-center gap-1 text-[10px] font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
                  <MessageCircleQuestion className="h-3 w-3 text-orange-500" aria-hidden />
                  {isEs ? 'Sugeridas' : 'Suggested'}
                </span>
                {actions.map((action, i) =>
                  action.kind === 'whatsapp' ? (
                    <a
                      key={action.label}
                      href={action.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 rounded-full bg-[#25D366]/15 px-2.5 py-1 text-[11px] font-semibold text-[#128C4B] transition-colors hover:bg-[#25D366]/25 dark:text-[#3dd68c] dark:hover:bg-[#25D366]/20"
                    >
                      <MessageCircleQuestion className="h-3 w-3" aria-hidden />
                      {`${i + 1}. ${action.label}`}
                    </a>
                  ) : (
                    <button
                      key={action.label}
                      type="button"
                      disabled={loading || streaming}
                      onClick={() => sendMessage(action.message, action.suggestionKey || null)}
                      className="inline-flex items-center gap-1 rounded-full border border-zinc-200 bg-zinc-50 px-2.5 py-1 text-[11px] font-medium text-zinc-700 transition-colors hover:border-orange-300 hover:bg-orange-50 hover:text-orange-700 disabled:opacity-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:border-orange-500/40 dark:hover:bg-orange-500/10 dark:hover:text-orange-300"
                    >
                      <Sparkles className="h-3 w-3 text-orange-500" aria-hidden />
                      {`${i + 1}. ${action.label}`}
                    </button>
                  )
                )}
              </motion.div>
            )}

            {/* Input */}
            <motion.form
              variants={reduced ? undefined : stackItem}
              onSubmit={handleSubmit}
              className="flex shrink-0 items-end gap-2 border-t border-zinc-200/60 px-3 py-2.5 dark:border-zinc-800"
            >
              <textarea
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault()
                    if (input.trim() && !loading && !streaming) sendMessage(input)
                  }
                }}
                maxLength={700}
                autoComplete="off"
                rows={1}
                enterKeyHint="send"
                placeholder={isEs ? 'Pregúntame de CDMX...' : 'Ask me about CDMX...'}
                disabled={loading || streaming}
                aria-label={isEs ? 'Escribe tu mensaje' : 'Type your message'}
                className={`max-h-[180px] min-h-[44px] min-w-0 flex-1 resize-none rounded-3xl border border-zinc-200 bg-zinc-50 px-3.5 py-2.5 text-sm text-zinc-900 placeholder-zinc-400 outline-none transition-colors focus:border-orange-400 focus:bg-white dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:focus:border-orange-500 dark:focus:bg-zinc-900 ${
                  inputExpanded ? 'rounded-3xl' : 'rounded-full'
                }`}
              />
              <button
                type="button"
                onClick={() => setInputExpanded((v) => !v)}
                aria-label={
                  inputExpanded
                    ? isEs
                      ? 'Hacer campo pequeño'
                      : 'Make field smaller'
                    : isEs
                    ? 'Hacer campo más grande'
                    : 'Make field bigger'
                }
                title={
                  inputExpanded
                    ? isEs
                      ? 'Más pequeño'
                      : 'Smaller'
                    : isEs
                    ? 'Más grande'
                    : 'Bigger'
                }
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-zinc-200 bg-zinc-50 text-zinc-600 transition-colors hover:border-orange-300 hover:text-orange-600 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:border-orange-500/40 dark:hover:text-orange-300"
              >
                {inputExpanded ? (
                  <ChevronDown className="h-4 w-4" />
                ) : (
                  <ChevronUp className="h-4 w-4" />
                )}
              </button>
              <button
                type="submit"
                disabled={!input.trim() || loading || streaming}
                aria-label={isEs ? 'Enviar mensaje' : 'Send message'}
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-orange-500 to-pink-600 text-white shadow-md transition-opacity hover:opacity-90 disabled:opacity-40"
              >
                <Send className="h-4 w-4" />
              </button>
            </motion.form>

            <p className="shrink-0 px-3 pb-2 text-center text-[10px] leading-none text-zinc-400 dark:text-zinc-500">
              {isEs
                ? 'Respuestas breves · no compartas datos personales'
                : 'Short answers · do not share personal data'}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
