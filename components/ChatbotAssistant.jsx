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
 * El endpoint /api/chatbot aplica los filtros de tema, el rate limit y el
 * system prompt. Aquí solo se cuida la experiencia de conversación.
 */
import { useCallback, useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { Bot, Send, X, Sparkles } from 'lucide-react'
import { useLanguage } from '@/lib/hooks/useLanguage'

const WELCOME_ES =
  '¡Quiubo! Soy Calpulli AI 🤖 tu asistente para vivir la CDMX. Te puedo recomendar rutas, comida, museos y barrios, o ayudarte a elegir un Journey. ¿Qué se te antoja?'
const WELCOME_EN =
  "Hey! I'm Calpulli AI 🤖 your Mexico City guide. I can recommend routes, food, museums and neighborhoods, or help you pick a Journey. What are you in the mood for?"

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

const STORAGE_KEY = 'calpulli_ai_chat_v1'

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

export default function ChatbotAssistant() {
  const { currentLanguage } = useLanguage()
  const isEs = currentLanguage !== 'en'
  const reduced = useReducedMotion()

  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const scrollRef = useRef(null)
  const inputRef = useRef(null)
  const abortRef = useRef(null)
  const loadedRef = useRef(false)

  const welcome = isEs ? WELCOME_ES : WELCOME_EN
  const actions = QUICK_ACTIONS[isEs ? 'es' : 'en']

  // Cargar conversación de la sesión (solo navegador).
  useEffect(() => {
    if (loadedRef.current) return
    loadedRef.current = true
    try {
      const raw = window.sessionStorage.getItem(STORAGE_KEY)
      if (raw) {
        const parsed = JSON.parse(raw)
        if (Array.isArray(parsed) && parsed.length) setMessages(parsed)
      }
    } catch {
      /* noop */
    }
  }, [])

  // Persistir la conversación.
  useEffect(() => {
    if (!loadedRef.current) return
    try {
      window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(messages.slice(-24)))
    } catch {
      /* noop */
    }
  }, [messages])

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
  }, [messages, loading, open])

  // Foco al abrir (solo desktop, para no abrir el teclado en móvil).
  useEffect(() => {
    if (open && typeof window !== 'undefined' && window.innerWidth >= 768) {
      const timer = setTimeout(() => inputRef.current?.focus(), 250)
      return () => clearTimeout(timer)
    }
  }, [open])

  const sendMessage = useCallback(
    async (text) => {
      const clean = String(text || '').trim()
      if (!clean || loading) return

      setError('')
      setInput('')

      const userMsg = {
        id: `u-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        role: 'user',
        content: clean,
      }

      const history = messages
        .slice(-6)
        .filter((m) => m && m.content)
        .map((m) => ({ role: m.role, content: m.content }))

      setMessages((prev) => [...prev, userMsg])
      setLoading(true)

      try {
        abortRef.current = new AbortController()
        const res = await fetch('/api/chatbot', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            message: clean,
            history,
            locale: isEs ? 'es' : 'en',
          }),
          signal: abortRef.current.signal,
        })

        const data = await res.json().catch(() => ({}))
        const reply =
          typeof data.reply === 'string' && data.reply.trim()
            ? data.reply.trim()
            : isEs
            ? 'No recibí respuesta. Intenta de nuevo o escríbenos por WhatsApp.'
            : 'I did not get a reply. Try again or message us on WhatsApp.'

        setMessages((prev) => [
          ...prev,
          {
            id: `a-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
            role: 'assistant',
            content: reply,
          },
        ])
      } catch (err) {
        if (!(err instanceof Error && err.name === 'AbortError')) {
          setError(
            isEs
              ? 'No pude conectarme. Revisa tu internet e intenta otra vez.'
              : 'I could not connect. Check your internet and try again.'
          )
        }
      } finally {
        setLoading(false)
      }
    },
    [isEs, loading, messages]
  )

  const handleSubmit = (event) => {
    event.preventDefault()
    sendMessage(input)
  }

  const clearChat = () => {
    abortRef.current?.abort()
    setMessages([])
    setInput('')
    setError('')
    setLoading(false)
    try {
      window.sessionStorage.removeItem(STORAGE_KEY)
    } catch {
      /* noop */
    }
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
            initial={reduced ? false : { opacity: 0, y: 24, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={reduced ? false : { opacity: 0, y: 24, scale: 0.97 }}
            transition={{ duration: reduced ? 0 : 0.22, ease: 'easeOut' }}
            className="fixed inset-x-3 bottom-[calc(5.5rem+env(safe-area-inset-bottom))] z-[110] mx-auto flex max-h-[min(78vh,620px)] w-[calc(100%-1.5rem)] max-w-md flex-col overflow-hidden rounded-3xl border border-zinc-200/70 bg-white shadow-2xl dark:border-zinc-800 dark:bg-zinc-950 sm:inset-auto sm:bottom-24 sm:right-6 sm:mx-0 sm:w-[380px]"
          >
            {/* Header */}
            <div className="flex shrink-0 items-center justify-between gap-3 border-b border-zinc-200/70 bg-gradient-to-r from-orange-500/10 via-pink-500/10 to-orange-500/5 px-4 py-3 dark:border-zinc-800">
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
                    {isEs ? 'Tu guía local · en línea' : 'Your local guide · online'}
                  </p>
                </div>
              </div>
              <div className="flex shrink-0 items-center gap-1">
                {hasConversation && (
                  <button
                    type="button"
                    onClick={clearChat}
                    className="rounded-full px-2 py-1 text-[11px] font-medium text-zinc-500 transition-colors hover:bg-zinc-200/70 hover:text-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-200"
                  >
                    {isEs ? 'Limpiar' : 'Clear'}
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
            </div>

            {/* Mensajes */}
            <div ref={scrollRef} className="min-h-0 flex-1 space-y-3 overflow-y-auto px-4 py-4">
              {/* Bienvenida local (no gasta tokens) */}
              <div className="flex justify-start">
                <div className="max-w-[86%] rounded-2xl rounded-bl-none bg-zinc-100 px-4 py-2.5 text-sm leading-relaxed text-zinc-900 dark:bg-zinc-800 dark:text-zinc-100">
                  <RichText text={welcome} />
                </div>
              </div>

              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={msg.role === 'assistant' ? 'flex justify-start' : 'flex justify-end'}
                >
                  <div
                    className={
                      msg.role === 'assistant'
                        ? 'max-w-[86%] rounded-2xl rounded-bl-none bg-zinc-100 px-4 py-2.5 text-sm leading-relaxed text-zinc-900 dark:bg-zinc-800 dark:text-zinc-100'
                        : 'max-w-[86%] rounded-2xl rounded-br-none bg-gradient-to-br from-orange-500 to-pink-600 px-4 py-2.5 text-sm leading-relaxed text-white'
                    }
                  >
                    {msg.role === 'assistant' ? (
                      <RichText text={msg.content} />
                    ) : (
                      <p className="whitespace-pre-wrap">{msg.content}</p>
                    )}
                  </div>
                </div>
              ))}

              {loading && (
                <div className="flex justify-start">
                  <TypingDots />
                </div>
              )}

              {error && (
                <p className="rounded-xl bg-red-50 px-3 py-2 text-xs text-red-600 dark:bg-red-950/40 dark:text-red-300">
                  {error}
                </p>
              )}
            </div>

            {/* Acciones rápidas */}
            <div className="flex shrink-0 flex-wrap gap-1.5 border-t border-zinc-200/60 px-3 py-2 dark:border-zinc-800">
              {actions.map((action) => (
                <button
                  key={action}
                  type="button"
                  disabled={loading}
                  onClick={() => sendMessage(action)}
                  className="inline-flex items-center gap-1 rounded-full border border-zinc-200 bg-zinc-50 px-2.5 py-1 text-[11px] font-medium text-zinc-700 transition-colors hover:border-orange-300 hover:bg-orange-50 hover:text-orange-700 disabled:opacity-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:border-orange-500/40 dark:hover:bg-orange-500/10 dark:hover:text-orange-300"
                >
                  <Sparkles className="h-3 w-3 text-orange-500" aria-hidden />
                  {action}
                </button>
              ))}
            </div>

            {/* Input */}
            <form
              onSubmit={handleSubmit}
              className="flex shrink-0 items-center gap-2 border-t border-zinc-200/60 px-3 py-2.5 dark:border-zinc-800"
            >
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                maxLength={700}
                autoComplete="off"
                enterKeyHint="send"
                placeholder={isEs ? 'Pregúntame de CDMX...' : 'Ask me about CDMX...'}
                disabled={loading}
                className="min-w-0 flex-1 rounded-full border border-zinc-200 bg-zinc-50 px-3.5 py-2 text-sm text-zinc-900 placeholder-zinc-400 outline-none transition-colors focus:border-orange-400 focus:bg-white dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:focus:border-orange-500 dark:focus:bg-zinc-900"
              />
              <button
                type="submit"
                disabled={!input.trim() || loading}
                aria-label={isEs ? 'Enviar mensaje' : 'Send message'}
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-orange-500 to-pink-600 text-white shadow-md transition-opacity hover:opacity-90 disabled:opacity-40"
              >
                <Send className="h-4 w-4" />
              </button>
            </form>

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
