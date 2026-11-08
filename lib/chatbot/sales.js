// MIT License - Copyright (c) 2024-2026 Donovan Riaño / Calpulli CDMX - See LICENSE
/**
 * Calpulli AI — lib/chatbot/sales.js
 *
 * Capa de ventas determinista del chatbot: cotiza con los precios reales
 * del registro de journeys (data/journeysData), sin LLM y sin inventar
 * cifras. El LLM sigue prohibido de dar precios por su cuenta; los totales
 * salen SOLO de aquí.
 *
 * Flujo: el handler de /api/chatbot llama handleSalesMessage() antes de
 * Gemini. Si hay intención de precio/reserva, respondemos con datos; si
 * no, devolvemos null y la conversación sigue su curso normal.
 *
 * La reserva en sí NO se crea aquí: la tarjeta de cotización del cliente
 * confirma contra el endpoint existente /api/bookings/cash (efectivo),
 * que valida, limita y persiste con createBookingInTurso. Nada de Stripe.
 */
import { JOURNEYS, pickLocalized } from '@/data/journeysData'
import { BRAND } from '@/lib/brand'
import { socialProofLine } from '@/lib/chatbot/reviews'

/** Cupo máximo por salida, como lo declara el sitio (llms.txt). */
export const MAX_GROUP_GUESTS = 10

/** Número oficial de WhatsApp (dígitos), desde la marca. */
export const WHATSAPP_DIGITS = String(BRAND.whatsappUrl || '').replace(/\D/g, '')

// ── Detección de journey en texto libre ─────────────────────────────
// Orden: de lo más específico a lo más general (Coyoacán/Frida antes
// que Centro, etc.) para que "la Casa Azul" no caiga en otro journey.
const JOURNEY_MATCHERS = [
  { slug: 'coyoacan', re: /coyoac|frida|casa azul|blue house/i },
  { slug: 'antropologia', re: /antropolog|anthropology/i },
  { slug: 'chapultepec', re: /chapultepec|castillo de|castle/i },
  { slug: 'luchas', re: /lucha|wrestling|arena m|arena coliseo|cmll/i },
  { slug: 'jamaica', re: /jamaica/i },
  { slug: 'roma', re: /\broma\b|condesa|romita/i },
  { slug: 'centro', re: /centro hist|historic cent|z[oó]calo|downtown|\bcentro\b/i },
]

export function findJourney(text) {
  const t = String(text || '')
  for (const { slug, re } of JOURNEY_MATCHERS) {
    if (re.test(t)) return JOURNEYS.find((j) => j.slug === slug) || null
  }
  return null
}

// ── Personas ────────────────────────────────────────────────────────
const GUEST_WORDS = {
  un: 1,
  una: 1,
  uno: 1,
  dos: 2,
  tres: 3,
  cuatro: 4,
  cinco: 5,
  seis: 6,
  siete: 7,
  ocho: 8,
  nueve: 9,
  diez: 10,
  one: 1,
  two: 2,
  three: 3,
  four: 4,
  five: 5,
  six: 6,
  seven: 7,
  eight: 8,
  nine: 9,
  ten: 10,
}

export function parseGuests(text) {
  const t = String(text || '')
  let m = t.match(
    /(?:somos|we are|party of|group of|grupo de|para|for)\s+(\d{1,2})(?!\d)/i
  )
  if (!m) {
    m = t.match(
      /(\d{1,2})\s*(?:personas?|people|person|invitados|guests|adultos|adults|viajeros|travelers|pax)\b/i
    )
  }
  if (m) {
    const n = parseInt(m[1], 10)
    return n >= 1 && n <= 30 ? n : null
  }
  const words = Object.keys(GUEST_WORDS).join('|')
  const wm = t.match(
    new RegExp(`\\b(${words})\\s+(?:personas?|people|person|invitados|guests|adultos|adults)\\b`, 'i')
  )
  if (wm) return GUEST_WORDS[wm[1].toLowerCase()] || null
  return null
}

// ── Fechas ──────────────────────────────────────────────────────────
// Todo el cálculo se hace en el mediodía UTC para no pelear con zonas
// horarias; el "hoy" se resuelve en America/Mexico_City.
const MONTHS = {
  enero: 1, febrero: 2, marzo: 3, abril: 4, mayo: 5, junio: 6, julio: 7,
  agosto: 8, septiembre: 9, setiembre: 9, octubre: 10, noviembre: 11, diciembre: 12,
  january: 1, february: 2, march: 3, april: 4, may: 5, june: 6, july: 7,
  august: 8, september: 9, october: 10, november: 11, december: 12,
}
const WEEKDAYS = {
  domingo: 0, lunes: 1, martes: 2, miercoles: 3, 'miércoles': 3, jueves: 4, viernes: 5,
  sabado: 6, 'sábado': 6,
  sunday: 0, monday: 1, tuesday: 2, wednesday: 3, thursday: 4, friday: 5, saturday: 6,
}

function pad(n) {
  return String(n).padStart(2, '0')
}
function toISO(y, m, d) {
  return `${y}-${pad(m)}-${pad(d)}`
}
function isoToMs(iso) {
  return Date.parse(`${iso}T12:00:00Z`)
}
function msToISO(ms) {
  const d = new Date(ms)
  return toISO(d.getUTCFullYear(), d.getUTCMonth() + 1, d.getUTCDate())
}
export function addDaysISO(iso, n) {
  return msToISO(isoToMs(iso) + n * 86400000)
}
export function daysUntilISO(iso, fromISO) {
  return Math.round((isoToMs(iso) - isoToMs(fromISO)) / 86400000)
}
export function weekdayOfISO(iso) {
  return new Date(isoToMs(iso)).getUTCDay()
}
function todayISO() {
  try {
    const parts = new Intl.DateTimeFormat('en-CA', {
      timeZone: 'America/Mexico_City',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).formatToParts(new Date())
    const get = (type) => parts.find((p) => p.type === type)?.value
    return toISO(Number(get('year')), Number(get('month')), Number(get('day')))
  } catch {
    const d = new Date()
    return toISO(d.getFullYear(), d.getMonth() + 1, d.getDate())
  }
}

export function parseDate(text, today = todayISO()) {
  const t = String(text || '')
  const [ty, tm, td] = today.split('-').map(Number)

  let m = t.match(/(\d{4})-(\d{2})-(\d{2})/)
  if (m) return toISO(Number(m[1]), Number(m[2]), Number(m[3]))

  const monthAlt = Object.keys(MONTHS).join('|')
  m = t.match(new RegExp(`(\\d{1,2})\\s+de\\s+(${monthAlt})(?:\\s+de\\s+(\\d{4}))?`, 'i'))
  if (m) {
    const day = Number(m[1])
    const month = MONTHS[m[2].toLowerCase()]
    let year = m[3] ? Number(m[3]) : ty
    if (!m[3] && (month < tm || (month === tm && day < td))) year += 1
    return toISO(year, month, day)
  }
  m = t.match(new RegExp(`(${monthAlt})\\s+(\\d{1,2})(?:st|nd|rd|th)?(?:,?\\s+(\\d{4}))?`, 'i'))
  if (m) {
    const month = MONTHS[m[1].toLowerCase()]
    const day = Number(m[2])
    let year = m[3] ? Number(m[3]) : ty
    if (!m[3] && (month < tm || (month === tm && day < td))) year += 1
    return toISO(year, month, day)
  }

  if (/pasado\s+ma[ñn]ana/i.test(t)) return addDaysISO(today, 2)
  if (/ma[ñn]ana|tomorrow/i.test(t)) return addDaysISO(today, 1)
  if (/\bhoy\b|\btoday\b/i.test(t)) return today

  const wdAlt = Object.keys(WEEKDAYS).join('|')
  m = t.toLowerCase().match(new RegExp(`\\b(${wdAlt})\\b`))
  if (m) {
    const target = WEEKDAYS[m[1]]
    const current = weekdayOfISO(today)
    const delta = (target - current + 7) % 7
    return addDaysISO(today, delta)
  }
  return null
}

export function formatDateLabel(iso, isEs) {
  if (!iso) return null
  try {
    return new Intl.DateTimeFormat(isEs ? 'es-MX' : 'en-US', {
      timeZone: 'UTC',
      weekday: 'long',
      day: 'numeric',
      month: 'long',
    }).format(new Date(isoToMs(iso)))
  } catch {
    return iso
  }
}

// ── Contexto de venta (sin estado: se reconstruye del historial) ────
export function extractSalesContext(message, history) {
  const ctx = { journey: null, guests: null, date: null }
  const texts = []
  if (Array.isArray(history)) {
    for (const h of history) {
      if (h && typeof h.content === 'string') texts.push(h.content)
    }
  }
  texts.push(String(message || ''))
  for (const text of texts) {
    const j = findJourney(text)
    if (j) ctx.journey = j
    const g = parseGuests(text)
    if (g) ctx.guests = g
    const d = parseDate(text)
    if (d) ctx.date = d
  }
  return ctx
}

// ── Cotización ──────────────────────────────────────────────────────
export function quoteFor(journey, guests) {
  const unit = Number(journey?.price ?? 0) || 0
  const n = Math.max(1, Number(guests) || 1)
  return { unit, guests: n, total: unit * n }
}

export function formatMoney(n) {
  return `$${Number(n || 0).toLocaleString('en-US')} MXN`
}

const PRICE_RE =
  /cu[aá]nto (cuesta|vale|sale)|cu[aá]l es el precio|precio|cuesta|vale|how much|what'?s the price|price|cost|tarifa/i
const BOOK_RE =
  /reserv|apart[aá]|agend|quiero ir|quiero ese|quiero el de|book|sign me up|i want to go|lo quiero/i
const OBJECTION_RE =
  /hacerlo (solo|por mi cuenta)|puedo (hacerlo|ir) (solo|por mi cuenta)|por mi cuenta|muy caro|est[aá] caro|es caro|vale la pena|no vale|do it (myself|on my own)|on my own|by myself|too expensive|overpriced|is it worth|worth it/i

/**
 * Valor real por journey, tomado de los datos del sitio (módulos de
 * data/journeys y copy público). Nada de promesas genéricas: cada punto
 * es verificable contra el contenido del journey.
 */
const VALUE_FACTS = {
  coyoacan: {
    es: 'nosotros aseguramos tu boleto de la **Casa Azul**: se vende solo en línea, con horario fijo, en temporada alta se agota con una o dos semanas de anticipación y el museo cierra los lunes; el journey solo se confirma con el boleto en mano',
    en: 'we secure your **Casa Azul** ticket: it is sold online only, with timed entry, in high season it sells out one to two weeks ahead and the museum closes on Mondays; the journey is only confirmed with the ticket in hand',
  },
  luchas: {
    es: 'la entrada al recinto va incluida y el boleto de la función se compra por el canal oficial de CMLL y se te entrega en el punto de encuentro: sin filas, sin reventa y con el contexto de quien conoce la arena',
    en: 'arena entry is included and the show ticket is bought through CMLL\u2019s official channel and handed to you at the meeting point: no lines, no resale markups, and the context of someone who knows the arena',
  },
  antropologia: {
    es: 'el museo se lee pieza por pieza y capa por capa, con lo que las fuentes cuentan de cada sala: es la diferencia entre ver piedras y entenderlas',
    en: 'the museum is read piece by piece, layer by layer, with what the sources say about each room: the difference between seeing stones and understanding them',
  },
  _generic: {
    es: 'la ruta, los tiempos y la logística van resueltos; el grupo es de máximo 10 personas y guían los locales que crearon el journey',
    en: 'the route, timing and logistics are handled; groups are capped at 10 people and the guides are the locals who created the journey',
  },
}

const HANDOFF_RE =
  /whatsapp|una persona|hablar con (alguien|una persona|un humano)|real person|talk to (someone|a person)|human/i

function handoffResult(ctx, isEs) {
  const journey = ctx.journey
  const title = journeyTitle(journey, isEs)
  const q = ctx.guests ? quoteFor(journey, ctx.guests) : null
  const url = buildWhatsAppHandoff({
    journey,
    date: ctx.date,
    guests: ctx.guests,
    total: q ? q.total : null,
    isEs,
  })
  const bits = [
    `**${title}**`,
    ctx.date ? formatDateLabel(ctx.date, isEs) : null,
    ctx.guests ? (isEs ? `${ctx.guests} personas` : `${ctx.guests} people`) : null,
    q ? formatMoney(q.total) : null,
  ]
    .filter(Boolean)
    .join(' · ')
  return {
    filtered: 'sales-handoff',
    reply: isEs
      ? `Claro: te paso con el equipo por WhatsApp con tu cotización ya resumida (${bits}), para que no repitas nada: [abrir WhatsApp](${url})`
      : `Of course: I will hand you to the team on WhatsApp with your quote already summarized (${bits}), so you do not have to repeat anything: [open WhatsApp](${url})`,
  }
}

// ── Urgencia veraz, solo desde datos ────────────────────────────────
// Cada nota sale de un hecho documentado en los módulos de journeys:
//  - Casa Azul: cierra los lunes y sus boletos (solo en línea, con
//    horario) se agotan con 1–2 semanas en temporada alta
//    (data/journeys/coyoacan.js).
//  - Museo Nacional de Antropología: cierra los lunes
//    (data/journeys/antropologia.js).
//  - Cupo por salida: máximo 10 (copy público del sitio, llms.txt).
// Nada de disponibilidad inventada: no afirmamos lugares restantes.
export function urgencyNotes(journey, ctx, isEs) {
  if (!journey) return []
  const notes = []
  const monday = ctx.date ? weekdayOfISO(ctx.date) === 1 : false

  if (journey.slug === 'coyoacan' && ctx.date) {
    if (monday) {
      notes.push(
        isEs
          ? '⚠️ Ojo con la fecha: la **Casa Azul cierra los lunes**, así que ese día el journey no puede salir. Elige otra fecha y te lo confirmamos con el boleto asegurado.'
          : '⚠️ Heads up on the date: the **Casa Azul closes on Mondays**, so the journey cannot run that day. Pick another date and we will confirm it with the ticket secured.'
      )
    } else if (daysUntilISO(ctx.date, todayISO()) <= 14) {
      notes.push(
        isEs
          ? 'Los boletos de la Casa Azul se venden solo en línea y en temporada alta se agotan con **una o dos semanas de anticipación**: apartar pronto es lo que asegura tu horario.'
          : 'Casa Azul tickets are sold online only and in high season they sell out **one to two weeks ahead**: booking early is what secures your time slot.'
      )
    }
  }

  if (journey.slug === 'antropologia' && ctx.date && monday) {
    notes.push(
      isEs
        ? '⚠️ Ojo con la fecha: el **Museo Nacional de Antropología cierra los lunes**, así que ese día el journey no puede salir. Otra fecha y sin problema.'
        : '⚠️ Heads up on the date: the **National Museum of Anthropology closes on Mondays**, so the journey cannot run that day. Any other date works fine.'
    )
  }

  if (ctx.guests === MAX_GROUP_GUESTS) {
    notes.push(
      isEs
        ? `Tu grupo es justo el cupo máximo por salida (${MAX_GROUP_GUESTS} personas): si crece, lo partimos en dos salidas o lo armamos por WhatsApp.`
        : `Your group is exactly the per-departure cap (${MAX_GROUP_GUESTS} people): if it grows, we split it into two departures or arrange it on WhatsApp.`
    )
  }

  return notes
}

function withNotes(reply, journey, ctx, isEs) {
  const notes = urgencyNotes(journey, ctx, isEs)
  let out = notes.length ? `${reply}\n\n${notes.join('\n')}` : reply
  // Prueba social: solo si hay reseñas reales cargadas en
  // lib/chatbot/reviews.js; con la lista vacía no se agrega nada.
  const proof = journey ? socialProofLine(journey.slug, isEs) : null
  if (proof) out = `${out}\n\n${proof}`
  return out
}

function valueFactsFor(journey, isEs) {
  const facts = []
  const specific = journey ? VALUE_FACTS[journey.slug] : null
  if (specific) facts.push(isEs ? specific.es : specific.en)
  facts.push(isEs ? VALUE_FACTS._generic.es : VALUE_FACTS._generic.en)
  return facts
}

function objectionResult(ctx, isEs, text) {
  const journey = ctx.journey
  const facts = valueFactsFor(journey, isEs)
  const factsLine = facts.map((f) => `• ${f}`).join('\n')

  if (!journey) {
    return {
      filtered: 'sales-objection',
      reply: isEs
        ? `Claro que puedes conocer la ciudad por tu cuenta — y nuestras guías autoguiadas son gratis para eso. Lo que un Journey guiado suma es otra cosa:\n${factsLine}\n\nDime qué journey te late y te cotizo sin compromiso.`
        : `Of course you can explore the city on your own — our self-guided walks are free for exactly that. What a guided Journey adds is different:\n${factsLine}\n\nTell me which journey sounds good and I will quote it with no strings attached.`,
    }
  }

  const title = journeyTitle(journey, isEs)
  let quoteLine = ''
  let action = null
  if (ctx.guests && ctx.guests <= MAX_GROUP_GUESTS) {
    const q = quoteFor(journey, ctx.guests)
    quoteLine = isEs
      ? `\n\nPara ${ctx.guests} ${ctx.guests === 1 ? 'persona' : 'personas'} el total es **${formatMoney(q.total)}** — y lo puedes apartar aquí mismo, pagando en efectivo al llegar.`
      : `\n\nFor ${ctx.guests} ${ctx.guests === 1 ? 'person' : 'people'} the total is **${formatMoney(q.total)}** — and you can hold it right here, paying in cash when you arrive.`
    action = quoteAction(journey, ctx, isEs)
  } else {
    quoteLine = isEs
      ? `\n\nCuesta **${formatMoney(journey.price)} por persona**. Dime cuántos son y qué día, y te doy el total exacto.`
      : `\n\nIt is **${formatMoney(journey.price)} per person**. Tell me how many you are and what day, and I will give you the exact total.`
  }

  return {
    filtered: 'sales-objection',
    action,
    reply: isEs
      ? `Puedes hacer **${title}** por tu cuenta, sin duda. Lo que resuelves tú y aquí ya viene resuelto es esto:\n${factsLine}${quoteLine}`
      : `You can definitely do **${title}** on your own. What you would sort out yourself — and here is already handled — is this:\n${factsLine}${quoteLine}`,
  }
}

function journeyTitle(journey, isEs) {
  return pickLocalized(journey.title_es, journey.title_en, isEs)
}

// ── Handoff a WhatsApp con contexto ─────────────────────────────────
// El enlace precarga el resumen de ESTA conversación (journey, fecha,
// personas, total cotizado) para que la persona del equipo retome sin
// que el visitante repita nada.
export function buildWhatsAppHandoff({ journey, date, guests, total, isEs, bookingRef }) {
  if (!journey) return null
  const title = journeyTitle(journey, isEs)
  const lines = isEs
    ? [
        'Hola Calpulli CDMX, vengo del chat de la página.',
        `Me interesa: ${title}.`,
        date ? `Fecha: ${formatDateLabel(date, isEs)}.` : null,
        guests ? `Personas: ${guests}.` : null,
        total ? `Cotización del chat: ${formatMoney(total)}.` : null,
        bookingRef ? `Folio de mi reserva: ${bookingRef}.` : null,
      ]
    : [
        'Hi Calpulli CDMX, I am coming from the website chat.',
        `I am interested in: ${title}.`,
        date ? `Date: ${formatDateLabel(date, isEs)}.` : null,
        guests ? `People: ${guests}.` : null,
        total ? `Quoted in the chat: ${formatMoney(total)}.` : null,
        bookingRef ? `My booking reference: ${bookingRef}.` : null,
      ]
  const text = lines.filter(Boolean).join(' ')
  return `https://wa.me/${WHATSAPP_DIGITS}?text=${encodeURIComponent(text)}`
}

function quoteAction(journey, ctx, isEs) {
  const q = quoteFor(journey, ctx.guests)
  return {
    type: 'quote',
    experienceId: journey.experience || journey.slug,
    journeySlug: journey.slug,
    title: journeyTitle(journey, isEs),
    date: ctx.date || null,
    dateLabel: ctx.date ? formatDateLabel(ctx.date, isEs) : null,
    guests: q.guests,
    unitPrice: q.unit,
    total: q.total,
    currency: 'MXN',
    whatsappUrl: buildWhatsAppHandoff({
      journey,
      date: ctx.date,
      guests: q.guests,
      total: q.total,
      isEs,
    }),
  }
}

/**
 * Punto de entrada. Devuelve null si el mensaje no trae intención de
 * venta, o { reply, action?, filtered } con la respuesta determinista.
 */
export function handleSalesMessage({ message, history, isEs }) {
  const text = String(message || '')
  const ctx = extractSalesContext(text, history)
  const priceIntent = PRICE_RE.test(text)
  const bookIntent = BOOK_RE.test(text)
  const objection = OBJECTION_RE.test(text)
  const handoff = HANDOFF_RE.test(text)
  // Continuación del flujo: ya había journey en la conversación y este
  // mensaje aporta personas o fecha (la respuesta a "¿cuántos van?").
  const continuation =
    Boolean(ctx.journey) &&
    (parseGuests(text) !== null || parseDate(text) !== null) &&
    !priceIntent &&
    !bookIntent

  if (!priceIntent && !bookIntent && !continuation && !objection && !handoff) return null

  // Pide WhatsApp/persona con contexto de venta: handoff con resumen.
  if (handoff && ctx.journey) return handoffResult(ctx, isEs)

  // Objeción ("lo hago solo", "está caro"): respuesta de valor real.
  if (objection) {
    const r = objectionResult(ctx, isEs, text)
    if (r && ctx.journey) r.reply = withNotes(r.reply, ctx.journey, ctx, isEs)
    return r
  }

  // Sin journey identificado: lista real de precios y pregunta cuál.
  if (!ctx.journey) {
    const lines = JOURNEYS.map(
      (j) => `• **${journeyTitle(j, isEs)}** — ${formatMoney(j.price)} ${isEs ? 'por persona' : 'per person'}`
    ).join('\n')
    return {
      filtered: 'sales-list',
      reply: isEs
        ? `Estos son los precios reales por persona:\n${lines}\n\n¿Cuál te late? Dime el journey, cuántas personas son y qué día, y te cotizo el total aquí mismo.`
        : `These are the real per-person prices:\n${lines}\n\nWhich one sounds good? Tell me the journey, how many people and what day, and I will quote the total right here.`,
    }
  }

  const journey = ctx.journey
  const title = journeyTitle(journey, isEs)

  // Grupo mayor al cupo declarado: no se cotiza como una sola salida.
  if (ctx.guests && ctx.guests > MAX_GROUP_GUESTS) {
    return {
      filtered: 'sales-group',
      reply: isEs
        ? `Los grupos de **${title}** son de máximo ${MAX_GROUP_GUESTS} personas por salida, para que siga siendo una experiencia cercana. Para un grupo de ${ctx.guests} lo armamos por WhatsApp: +52 55 1229 1607.`
        : `**${title}** groups are capped at ${MAX_GROUP_GUESTS} people per departure, to keep it personal. For a group of ${ctx.guests} we arrange it on WhatsApp: +52 55 1229 1607.`,
    }
  }

  // Journey sin personas todavía: precio por persona y siguiente paso.
  if (!ctx.guests) {
    const base = isEs
      ? `**${title}** cuesta **${formatMoney(journey.price)} por persona**. ¿Cuántas personas son y qué día les late? Con eso te doy el total exacto y, si quieres, lo dejamos reservado aquí mismo.`
      : `**${title}** is **${formatMoney(journey.price)} per person**. How many people are you, and what day works for you? With that I will give you the exact total and, if you want, book it right here.`
    return { filtered: 'sales-quote', reply: withNotes(base, journey, ctx, isEs) }
  }

  // Cotización completa.
  const q = quoteFor(journey, ctx.guests)
  const dateLine = ctx.date
    ? isEs
      ? ` para el **${formatDateLabel(ctx.date, isEs)}**`
      : ` for **${formatDateLabel(ctx.date, isEs)}**`
    : ''
  const action = quoteAction(journey, ctx, isEs)
  const base = isEs
    ? `**${title}**${dateLine}: ${formatMoney(q.unit)} × ${q.guests} ${q.guests === 1 ? 'persona' : 'personas'} = **${formatMoney(q.total)}**. Pagas en efectivo en el punto de encuentro; nosotros te confirmamos por WhatsApp. ¿Te lo aparto? Puedes reservarlo en la tarjeta de aquí abajo o [seguir por WhatsApp](${action.whatsappUrl}) con esta cotización ya escrita.`
    : `**${title}**${dateLine}: ${formatMoney(q.unit)} × ${q.guests} ${q.guests === 1 ? 'person' : 'people'} = **${formatMoney(q.total)}**. You pay in cash at the meeting point; we confirm on WhatsApp. Shall I hold it for you? You can book it in the card below or [continue on WhatsApp](${action.whatsappUrl}) with this quote already written in.`
  return {
    filtered: 'sales-quote',
    action,
    reply: withNotes(base, journey, ctx, isEs),
  }
}
