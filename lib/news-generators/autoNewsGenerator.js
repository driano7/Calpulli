// Automatic news note generator (criptec-style):
// 1. Fetches Mexico tourism news from NewsAPI
// 2. Uses OpenRouter to write a bilingual (en/es) blog note per article
// 3. Saves one .mdx per locale in data/notes
// 4. Enforces max 3 notes/day and OpenRouter 15 req/day
// 5. Validates images and source links (fallbacks when broken)

const fs = require('fs')
const path = require('path')

function loadEnvFile() {
  const envPath = path.join(process.cwd(), '.env.local')
  try {
    const content = fs.readFileSync(envPath, 'utf8')
    content.split('\n').forEach((line) => {
      const trimmed = line.trim()
      if (!trimmed || trimmed.startsWith('#')) return
      const idx = trimmed.indexOf('=')
      if (idx === -1) return
      const key = trimmed.slice(0, idx).trim()
      const value = trimmed
        .slice(idx + 1)
        .trim()
        .replace(/^["']|["']$/g, '')
      if (!(key in process.env)) process.env[key] = value
    })
  } catch {
    // .env.local not available, rely on ambient env
  }
}

loadEnvFile()

// La API key se lee de env (.env.local vía loadEnvFile() o vars de Vercel).
const GEMINI_API_KEY =
  process.env.GEMINI_API_KEY || process.env.GEMINI_KEY || process.env.GOOGLE_API_KEY || ''
const NEWS_API_KEY = process.env.NEWS_API_KEY || ''
const NEWS_BASE_URL = 'https://newsapi.org/v2/everything'
const GEMINI_MODEL =
  process.env.GEMINI_MODEL ||
  process.env.GEMINI_MODEL_PRO ||
  process.env.GOOGLE_MODEL ||
  'gemini-flash-lite-latest'
const GEMINI_PROJECT =
  process.env.GEMINI_PROJECT || process.env.PROJECT || process.env.NUMBER_PROJECT || ''

const MAX_NOTES_PER_MONTH = 3
const MAX_GEMINI_REQUESTS_PER_DAY = 1000
const MAX_GEMINI_REQUESTS_PER_MINUTE = 50
const MAX_OPENROUTER_REQUESTS_PER_DAY = 1000
const LINK_TIMEOUT_MS = 6000

const NOTES_DIR = path.join(process.cwd(), 'data', 'notes')
const SYNC_STATE_FILE = path.join(process.cwd(), 'data', 'news-sync-state.json')

const TOURISM_QUERIES = {
  en: [
    'Mexico tourism travel',
    'Cancun Riviera Maya',
    'Oaxaca cultural tourism',
    'Mexico City food tour',
    'Guanajuato colonial',
    'Baja California wine',
    'Puerto Vallarta',
    'Los Cabos luxury',
  ],
  es: [
    'turismo México viajes',
    'Cancún Riviera Maya',
    'Oaxaca turismo cultural',
    'CDMX tour gastronómico',
    'Guanajuato colonial',
    'Baja California vinos',
    'Puerto Vallarta',
    'Los Cabos lujo',
  ],
}

// Working Unsplash direct image URLs (images.unsplash.com only - source.unsplash.com is dead)
// Imágenes por tema para que la foto siempre coincida con la noticia.
const TOPIC_IMAGES = {
  beach: [
    'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1200&q=80',
    'https://images.unsplash.com/photo-1519452635265-7b1fbfd1e4e0?w=1200&q=80',
    'https://images.unsplash.com/photo-1511499767150-a48a237f0083?w=1200&q=80',
  ],
  ruins: [
    'https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=1200&q=80',
    'https://images.unsplash.com/photo-1561501878-aabd62634533?w=1200&q=80',
    'https://images.unsplash.com/photo-1522083165195-3424ed129620?w=1200&q=80',
  ],
  city: [
    'https://images.unsplash.com/photo-1528127269322-539801943592?w=1200&q=80',
    'https://images.unsplash.com/photo-1533105079780-92b9be482077?w=1200&q=80',
    'https://images.unsplash.com/photo-1505142468610-359e7d316be0?w=1200&q=80',
  ],
  food: [
    'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=1200&q=80',
    'https://images.unsplash.com/photo-1519608487953-e999c86e7455?w=1200&q=80',
  ],
  culture: [
    'https://images.unsplash.com/photo-1544636331-e26879cd4d9b?w=1200&q=80',
    'https://images.unsplash.com/photo-1494526585095-c41746248156?w=1200&q=80',
    'https://images.unsplash.com/photo-1470337458703-46ad1756a187?w=1200&q=80',
    'https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=1200&q=80',
  ],
  wine: [
    'https://images.unsplash.com/photo-1516594797747-2fbb58b5a633?w=1200&q=80',
    'https://images.unsplash.com/photo-1528823872057-9c018a7a7553?w=1200&q=80',
  ],
}

// Palabras clave (en/es) que deciden el tema de la imagen según el título de la nota
const TOPIC_RULES = [
  {
    theme: 'beach',
    keywords: [
      'cancun',
      'cancún',
      'riviera maya',
      'tulum',
      'playa',
      'beach',
      'caribbean',
      'caribe',
      'miles for a cancun',
      'los cabos',
      'puerto vallarta',
      'mazatlan',
    ],
  },
  {
    theme: 'ruins',
    keywords: [
      'chichen',
      'chichén',
      'teotihuacan',
      'ruins',
      'ruinas',
      'pyramid',
      'pirámide',
      'maya',
      'archeolog',
      'arqueolog',
      'palenque',
      'tulum ruins',
    ],
  },
  {
    theme: 'wine',
    keywords: ['baja', 'wine', 'vino', 'enotour', 'valle de guadalupe'],
  },
  {
    theme: 'food',
    keywords: [
      'food',
      'comida',
      'gastronom',
      'taco',
      'tacos',
      'cocina',
      'restaurant',
      'street food',
    ],
  },
  {
    theme: 'culture',
    keywords: [
      'museo',
      'museu',
      'museums',
      'arte',
      'art',
      'culture',
      'cultura',
      'oaxaca',
      'day of the dead',
      'día de los muertos',
      'frida',
      'lucha libre',
      'mariachi',
    ],
  },
  {
    theme: 'city',
    keywords: ['mexico city', 'cdmx', 'ciudad de méxico', 'guanajuato', 'guadalajara', 'puebla'],
  },
]

function pickTopicImage(title = '', summary = '') {
  const text = `${title} ${summary}`.toLowerCase()
  for (const rule of TOPIC_RULES) {
    if (rule.keywords.some((kw) => text.includes(kw))) {
      const images = TOPIC_IMAGES[rule.theme]
      return images[Math.floor(Math.random() * images.length)]
    }
  }
  // Default: mezcla de playa/ruinas/cultura (turismo México)
  const defaults = [...TOPIC_IMAGES.beach, ...TOPIC_IMAGES.ruins, ...TOPIC_IMAGES.culture]
  return defaults[Math.floor(Math.random() * defaults.length)]
}

const IMAGE_HOST_REGEX =
  /(images\.unsplash\.com|cdn\.|upload\.|media\.|static\.|wp-content|s3\.|cloudfront)/i
const IMAGE_EXT_REGEX = /\.(avif|gif|jpe?g|png|svg|webp)(\?|#|$)/i

function slugify(input) {
  return input
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)+/g, '')
}

function getDateStamp(offset = 0) {
  const date = new Date()
  date.setDate(date.getDate() - offset)
  const months = [
    'january',
    'february',
    'march',
    'april',
    'may',
    'june',
    'july',
    'august',
    'september',
    'october',
    'november',
    'december',
  ]
  return `${String(date.getDate()).padStart(2, '0')}-${months[date.getMonth()].substring(
    0,
    3
  )}-${date.getFullYear()}`
}

function loadSyncState() {
  try {
    return JSON.parse(fs.readFileSync(SYNC_STATE_FILE, 'utf8')) || {}
  } catch {
    return {}
  }
}

function saveSyncState(state) {
  fs.mkdirSync(path.dirname(SYNC_STATE_FILE), { recursive: true })
  fs.writeFileSync(SYNC_STATE_FILE, JSON.stringify(state, null, 2))
}

function todayKey() {
  return new Date().toISOString().split('T')[0]
}

function monthKey() {
  return new Date().toISOString().slice(0, 7)
}

function getGeminiRemaining(state) {
  if (state.geminiUsageDate !== todayKey()) {
    return MAX_GEMINI_REQUESTS_PER_DAY
  }
  return Math.max(0, MAX_GEMINI_REQUESTS_PER_DAY - (state.geminiUsageCount || 0))
}
// alias para compatibilidad
function getOpenRouterRemaining(state) {
  return getGeminiRemaining(state)
}

async function getNotesCreatedThisMonth() {
  // 1) Autoridad: Turso (cuenta notas publicadas en el mes actual, solo locale en)
  try {
    const { getNotes } = require('./tursoNewsStore')
    const notes = await getNotes('en')
    if (notes && Array.isArray(notes)) {
      const month = monthKey()
      const uniqueSlugs = new Set()
      for (const note of notes) {
        if (!note.date) continue
        const d = new Date(note.date)
        if (Number.isNaN(d.getTime())) continue
        const noteMonth = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
        if (noteMonth === month) uniqueSlugs.add(note.slug)
      }
      return uniqueSlugs.size
    }
  } catch {
    // fallback a fs
  }

  // 2) Fallback: filesystem
  if (!fs.existsSync(NOTES_DIR)) return 0
  const month = monthKey()
  return fs
    .readdirSync(NOTES_DIR)
    .filter((f) => f.endsWith('.en.mdx'))
    .filter((f) => {
      try {
        const raw = fs.readFileSync(path.join(NOTES_DIR, f), 'utf8')
        const dateMatch = raw.match(/^date:\s*['"]?([^'"\n]+)/m)
        if (!dateMatch) return false
        const d = new Date(dateMatch[1])
        if (Number.isNaN(d.getTime())) return false
        const noteMonth = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
        return noteMonth === month
      } catch {
        return false
      }
    }).length
}

function normalizeImageUrl(input) {
  const value = String(input || '')
    .replace(/\\\//g, '/')
    .trim()
    .replace(/\s+/g, '')
  if (!value) return ''

  let normalized = value
  if (normalized.startsWith('//')) normalized = `https:${normalized}`
  if (!/^https?:\/\//i.test(normalized)) return ''

  if (IMAGE_EXT_REGEX.test(normalized) || IMAGE_HOST_REGEX.test(normalized)) {
    return normalized
  }
  return ''
}

function normalizeSourceUrl(input) {
  const value = String(input || '').trim()
  if (!value) return ''

  let url = value
  if (/^www\./i.test(url)) url = `https://${url}`
  if (!/^https?:\/\//i.test(url)) return ''
  url = url.replace(/[\s<>"']+$/g, '')

  try {
    const parsed = new URL(url)
    return parsed.href
  } catch {
    return ''
  }
}

async function verifyUrl(url) {
  if (!url) return false
  try {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), LINK_TIMEOUT_MS)
    const res = await fetch(url, { method: 'HEAD', redirect: 'follow', signal: controller.signal })
    clearTimeout(timeout)
    return res.ok || res.status >= 300
  } catch {
    return false
  }
}

function buildSourceFallback(title) {
  return `https://www.google.com/search?q=${encodeURIComponent(`Mexico tourism ${title}`)}`
}

async function pickArticleImage(article, note) {
  const fromArticle = normalizeImageUrl(article.urlToImage || article.image || '')
  if (fromArticle) return fromArticle

  const topicImage = pickTopicImage(note?.en?.title || article.title, note?.en?.summary)
  return topicImage
}

async function fetchNewsArticles(locale, count = 5) {
  if (!NEWS_API_KEY) return []

  const queries = TOURISM_QUERIES[locale] || TOURISM_QUERIES.en
  const fromDate = new Date()
  fromDate.setDate(fromDate.getDate() - 14)
  const from = fromDate.toISOString().split('T')[0]

  const seen = new Set()
  const collected = []

  // Probamos varias queries (mezcladas) hasta juntar suficientes artículos de México
  const shuffled = [...queries].sort(() => Math.random() - 0.5)
  for (const query of shuffled.slice(0, 5)) {
    if (collected.length >= count) break
    const url = `${NEWS_BASE_URL}?q=${encodeURIComponent(
      query
    )}&from=${from}&sortBy=publishedAt&pageSize=20&language=${locale}&apiKey=${NEWS_API_KEY}`

    try {
      const controller = new AbortController()
      const timeout = setTimeout(() => controller.abort(), 15000)
      const response = await fetch(url, { signal: controller.signal })
      clearTimeout(timeout)
      if (!response.ok) continue
      const data = await response.json()
      for (const article of data.articles || []) {
        if (!article.title || article.title === '[Removed]') continue
        if (!isMexicoRelated(article)) continue
        const key = article.title.toLowerCase().trim()
        if (seen.has(key)) continue
        seen.add(key)
        collected.push(article)
        if (collected.length >= count) break
      }
    } catch (error) {
      console.error('NewsAPI fetch failed:', error.message)
    }
  }

  return collected.slice(0, count)
}

// Filtra artículos realmente relacionados con México (NewsAPI con queries sueltas
// devuelve noticias de todo el mundo, p.ej. restaurantes de California).
const MEXICO_KEYWORDS = [
  'mexic',
  'mexico',
  'méxico',
  'mexican',
  'mexicana',
  'mexicano',
  'cdmx',
  'ciudad de méxico',
  'mexico city',
  'canc',
  'riviera maya',
  'oaxaca',
  'yucat',
  'jalisco',
  'guadalajara',
  'baja california',
  'los cabos',
  'puerto vallarta',
  'guanajuato',
  'puebla',
  'chiapas',
  'querétaro',
  'queretaro',
  'san miguel de allende',
  'michoac',
  'veracruz',
  'taxco',
  'teotihuac',
  'chichén',
  'chichen',
  'tulum',
  'huichol',
  'day of the dead',
  'día de los muertos',
  'dia de los muertos',
]

function isMexicoRelated(article) {
  const text = `${article.title || ''} ${article.description || ''}`.toLowerCase()
  return MEXICO_KEYWORDS.some((kw) => text.includes(kw))
}

async function callGemini(prompt, maxTokens = 900) {
  if (!GEMINI_API_KEY) throw new Error('GEMINI_API_KEY not set')

  const state = loadSyncState()
  const remaining = getGeminiRemaining(state)
  if (remaining <= 0) throw new Error('Daily Gemini limit reached (1000/day)')

  // burst check 50/min
  const now = Date.now()
  const minuteKey = 'geminiMinuteTimestamps'
  if (!global._geminiMinute) global._geminiMinute = []
  global._geminiMinute = global._geminiMinute.filter((t) => now - t < 60 * 1000)
  if (global._geminiMinute.length >= MAX_GEMINI_REQUESTS_PER_MINUTE) {
    throw new Error('Gemini per-minute limit reached (50/min) — wait 60s')
  }
  global._geminiMinute.push(now)

  const usageCount = state.geminiUsageDate === todayKey() ? state.geminiUsageCount || 0 : 0
  state.geminiUsageDate = todayKey()
  state.geminiUsageCount = usageCount + 1
  // compat: también actualizar openRouter fields
  state.openRouterUsageDate = state.geminiUsageDate
  state.openRouterUsageCount = state.geminiUsageCount
  saveSyncState(state)

  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        generationConfig: { maxOutputTokens: maxTokens, temperature: 0.7 },
      }),
    }
  )

  if (!res.ok) {
    const body = await res.text().catch(() => 'unknown')
    throw new Error(`Gemini error: ${res.status} ${body}`)
  }

  const data = await res.json()
  const parts = data.candidates?.[0]?.content?.parts || []
  return (
    parts.find((p) => !p.thought)?.text || parts[parts.length - 1]?.text || parts[0]?.text || ''
  )
}
async function callOpenRouter(prompt, maxTokens = 900) {
  // Migrado a Gemini (antes OpenRouter). Delegamos a la función Gemini con cuota.
  return callGemini(prompt, maxTokens)
}

const NOTE_PROMPT = `Eres un escritor de viajes experto en turismo de México. Recibirás un lote de noticias y datos macro, y debes seleccionar las 3 noticias MÁS relevantes e interesantes para un viajero, y escribir para cada una una nota de blog en INGLÉS y en ESPAÑOL.

CONTEXTO MACRO (FRED, opcional):
{{macro}}

NOTICIAS DISPONIBLES:
{{articles}}

FORMATO DE RESPUESTA OBLIGATORIO — usa estos delimitadores exactos, sin markdown, sin texto fuera de ellos:
---NOTE:1:EN---
title: [título en inglés, máx 80 chars]
summary: [extracto en inglés, máx 240 chars]
tags: [3-5 etiquetas separadas por coma]
body:
[3-4 párrafos completos en inglés, en markdown, usando UN encabezado ## al inicio y luego texto rico en detalles. Mínimo 250 palabras. Incluye datos concretos de la noticia, contexto útil para el viajero y un cierre práctico. NO uses listas vacías ni frases genéricas.]
source: [URL original de la noticia si existe]
---NOTE:1:ES---
title: [título en español, máx 80 chars]
summary: [extracto en español, máx 240 chars]
tags: [3-5 etiquetas separadas por coma]
body:
[3-4 párrafos completos en español, en markdown, usando UN encabezado ## al inicio y luego texto rico en detalles. Mínimo 250 palabras. Misma calidad que la versión en inglés: traduce el contenido con naturalidad, nunca traducciones literales.]
source: [URL original de la noticia si existe]
(repítelo para NOTE:2 y NOTE:3 si hay suficientes noticias; si hay menos de 3 noticias relevantes, escribe solo las que procedan)

REGLAS:
- Elige las 3 noticias más destacadas, una sola nota por noticia, no repitas temas.
- Escribe solo hechos basados en las noticias proporcionadas, NO inventes datos.
- Enfócate en consejos prácticos de viaje, contexto cultural y qué hace único a México.
- Usa el contexto macro (tipo de cambio, inflación) solo si es útil para el viajero.
- IMPORTANTE: el body debe ir COMPLETO después de la línea "body:", con saltos de línea reales. No lo colapses en una sola línea.`

function buildNotePrompt({ articles, macros }) {
  const macroText = macros.length
    ? macros
        .map(
          (m) =>
            `- ${m.label}: ${m.value}${m.unit}${
              m.change !== null
                ? ` (cambio ${m.change >= 0 ? '+' : ''}${m.change.toFixed(2)}%)`
                : ''
            }`
        )
        .join('\n')
    : 'No disponibles'

  const articleText = articles
    .map((a, i) => {
      const source = a.source?.name || 'Unknown'
      const url = a.url || ''
      return `${i + 1}. [${source}] ${a.title}${a.description ? ` — ${a.description}` : ''}${
        url ? `\n   URL: ${url}` : ''
      }`
    })
    .join('\n\n')

  return NOTE_PROMPT.replace('{{macro}}', macroText).replace('{{articles}}', articleText)
}

function parseBatchNotes(content) {
  const notes = []
  const sectionRegex = /---NOTE:(\d+):(EN|ES)---\n([\s\S]*?)(?=---NOTE:|$)/g
  let match
  const buffer = {}

  while ((match = sectionRegex.exec(content)) !== null) {
    const index = parseInt(match[1], 10)
    const locale = match[2].toLowerCase()
    const section = String(match[3] || '').trim()
    const lines = section.split('\n')

    const parseField = (name) => {
      const line = lines.find((l) => l.startsWith(`${name}:`))
      if (!line) return ''
      return line.slice(name.length + 1).trim()
    }

    // El body es multilínea: tomamos todas las líneas desde "body:" hasta el siguiente campo conocido
    const parseBody = () => {
      const bodyIndex = lines.findIndex((l) => l.startsWith('body:'))
      if (bodyIndex === -1) return ''
      const rest = lines.slice(bodyIndex + 1)
      const nextField = rest.findIndex((l) => /^(source|title|summary|tags):/.test(l))
      const bodyLines = nextField === -1 ? rest : rest.slice(0, nextField)
      return bodyLines.join('\n').trim()
    }

    const title = parseField('title')
    const summary = parseField('summary')
    const tagsLine = parseField('tags')
    const body = parseBody()
    const source = parseField('source')

    if (!title) continue

    if (!buffer[index]) buffer[index] = {}
    buffer[index][locale] = {
      title,
      summary,
      tags: tagsLine
        ? tagsLine
            .split(',')
            .map((t) => t.trim())
            .filter(Boolean)
            .slice(0, 6)
        : locale === 'es'
        ? ['mexico', 'turismo']
        : ['mexico', 'tourism'],
      body,
      source,
    }
  }

  for (const index of Object.keys(buffer).sort((a, b) => a - b)) {
    const note = buffer[index]
    if (note.en && note.es) notes.push(note)
  }
  return notes
}

function buildNoteMdx({ locale, title, date, summary, tags, image, sourceUrl, category, body }) {
  const lang = locale === 'es' ? 'es' : 'en'
  const lines = [
    '---',
    `title: ${JSON.stringify(title)}`,
    `date: ${JSON.stringify(date)}`,
    'published: true',
    `summary: ${JSON.stringify(summary)}`,
    `tags: [${tags.map((tag) => JSON.stringify(tag)).join(', ')}]`,
    `image: ${JSON.stringify(image)}`,
    `images: [${JSON.stringify(image)}]`,
    `category: ${JSON.stringify(category)}`,
    `lang: ${lang}`,
    `sourceUrl: ${JSON.stringify(sourceUrl || '')}`,
    '---',
    '',
    body.trim(),
    '',
  ]
  return lines.join('\n')
}

const SEED_NOTES = [
  {
    slug: 'hidden-gems-of-mexico',
    date: new Date().toISOString(),
    image: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=1200&q=80',
    sourceUrl: 'https://www.visitmexico.com/',
    category: 'Travel',
    en: {
      title: 'Hidden Gems of Mexico Beyond the Tourist Trail',
      summary:
        'Explore lesser-known destinations in Mexico where authentic culture and natural beauty await the adventurous traveler.',
      tags: ['mexico', 'hidden-gems', 'travel'],
      body: '## Beyond the Classics\n\nBeyond Cancun and Tulum, Mexico hides small towns and wild landscapes that reward the traveler who ventures off the beaten path.\n\n## What To Expect\n\nFrom colonial plazas to pristine beaches, every region offers its own rhythm, flavor, and stories worth discovering.\n\n## Plan Your Visit\n\nGive yourself time to wander. The best experiences come from the places not listed in the guides.',
    },
    es: {
      title: 'Tesoros Ocultos de México Más Allá de la Ruta Turística',
      summary:
        'Explora destinos menos conocidos en México donde la cultura auténtica y la belleza natural te esperan.',
      tags: ['mexico', 'tesoros-ocultos', 'viajes'],
      body: '## Más Allá de los Clásicos\n\nMás allá de Cancún y Tulum, México esconde pequeños pueblos y paisajes salvajes que recompensan al viajero que se atreve a salir de lo común.\n\n## Qué Esperar\n\nDe plazas coloniales a playas vírgenes, cada región tiene su propio ritmo, sabor e historias por descubrir.\n\n## Planea tu Visita\n\nDate tiempo para recorrer. Las mejores experiencias llegan de los lugares que no están en las guías.',
    },
  },
  {
    slug: 'sustainable-riviera-maya',
    date: new Date(Date.now() - 86400000).toISOString(),
    image: 'https://images.unsplash.com/photo-1519046904884-dadc6682cbd7?w=1200&q=80',
    sourceUrl: 'https://www.visitmexico.com/',
    category: 'Eco-tourism',
    en: {
      title: 'Sustainable Tourism Initiatives in Riviera Maya',
      summary:
        "New eco-resorts and conservation programs are transforming how we experience Mexico's Caribbean coast.",
      tags: ['riviera-maya', 'sustainability', 'eco'],
      body: '## A Greener Coastline\n\nEco-resorts and conservation programs along the Riviera Maya are redefining sustainable travel on Mexico\u2019s Caribbean coast.\n\n## Local Impact\n\nThese initiatives support local communities and protect mangroves, reefs, and wildlife for future generations.\n\n## Travel Responsibly\n\nChoose operators that give back. Small decisions can have a lasting positive impact.',
    },
    es: {
      title: 'Iniciativas de Turismo Sostenible en Riviera Maya',
      summary:
        'Nuevos eco-resorts y programas de conservación están transformando la experiencia en la costa caribeña de México.',
      tags: ['riviera-maya', 'sostenibilidad', 'eco'],
      body: '## Una Costa Más Verde\n\nLos eco-resorts y programas de conservación en la Riviera Maya están redefiniendo el turismo sostenible en la costa caribeña de México.\n\n## Impacto Local\n\nEstas iniciativas apoyan a las comunidades locales y protegen manglares, arrecifes y vida silvestre para el futuro.\n\n## Viaja con Responsabilidad\n\nElige operadores que den algo a cambio. Las pequeñas decisiones pueden dejar un impacto positivo duradero.',
    },
  },
]

function seedFallbackNotes() {
  if (!fs.existsSync(NOTES_DIR)) fs.mkdirSync(NOTES_DIR, { recursive: true })

  const existing = fs.readdirSync(NOTES_DIR).filter((f) => f.endsWith('.mdx'))
  if (existing.length > 0) {
    return { created: 0, reason: 'notes already exist' }
  }

  let created = 0
  SEED_NOTES.forEach((note, index) => {
    const offset = index + 1
    const base = `${getDateStamp(offset)}-${note.slug}`
    const common = {
      date: new Date(Date.now() - offset * 86400000).toISOString(),
      image: note.image,
      sourceUrl: note.sourceUrl,
      category: note.category,
    }
    const enContent = buildNoteMdx({
      locale: 'en',
      title: note.en.title,
      summary: note.en.summary,
      tags: note.en.tags,
      body: note.en.body,
      ...common,
    })
    const esContent = buildNoteMdx({
      locale: 'es',
      title: note.es.title,
      summary: note.es.summary,
      tags: note.es.tags,
      body: note.es.body,
      ...common,
    })

    fs.writeFileSync(path.join(NOTES_DIR, `${base}.en.mdx`), enContent)
    fs.writeFileSync(path.join(NOTES_DIR, `${base}.es.mdx`), esContent)
    created += 1
    console.log(`Seeded note: ${base}`)
  })

  return { created, reason: 'seed fallback' }
}

async function generateNotes(locale = 'en', count = 3) {
  fs.mkdirSync(NOTES_DIR, { recursive: true })

  const createdThisMonth = await getNotesCreatedThisMonth()
  if (createdThisMonth >= MAX_NOTES_PER_MONTH) {
    console.log(
      `Already created ${createdThisMonth} notes this month. Max is ${MAX_NOTES_PER_MONTH}.`
    )
    return { created: 0, createdThisMonth, error: 'Monthly note limit reached' }
  }

  const remainingSlots = MAX_NOTES_PER_MONTH - createdThisMonth
  const target = Math.min(count, remainingSlots)

  const state = loadSyncState()
  const openRouterRemaining = getOpenRouterRemaining(state)
  if (openRouterRemaining <= 0) {
    console.log('OpenRouter daily limit reached - no notes generated.')
    return { created: 0, createdThisMonth, error: 'OpenRouter daily limit reached' }
  }

  // 1) Fuentes de datos: noticias NewsAPI (ambos idiomas) + contexto macro FRED
  const [articles, macros] = await Promise.all([
    fetchNewsArticles('en', target + 4).catch(() => []),
    (async () => {
      try {
        const { getMacroSnapshot } = require('./fredStore')
        return await getMacroSnapshot()
      } catch {
        return []
      }
    })(),
  ])
  if (!articles.length) {
    const seeded = seedFallbackNotes()
    return {
      created: seeded.created,
      createdThisMonth,
      fallback: 'No articles from NewsAPI, seeded fallback notes',
    }
  }

  // 2) UN solo request de OpenRouter con todo el contexto (patrón EarningsAI):
  //    el modelo escribe las 3 notas bilingües con delimitadores ---NOTE:N:LANG---
  let batchNotes = []
  try {
    const response = await callOpenRouter(buildNotePrompt({ articles, macros }), 5000)
    batchNotes = parseBatchNotes(response)
    console.log(`OpenRouter returned ${batchNotes.length} bilingual notes from a single request`)
  } catch (error) {
    console.error('OpenRouter batch generation failed:', error.message)
  }

  if (!batchNotes.length) {
    const seeded = seedFallbackNotes()
    return {
      created: 0,
      createdThisMonth,
      seeded: seeded.created,
      fallback: 'No parseable notes from OpenRouter, seeded fallback notes',
    }
  }

  let created = 0
  const results = []
  const articlesByTitle = new Map(articles.map((a) => [slugify(a.title), a]))

  for (const note of batchNotes) {
    if (created >= target) break

    // Emparejar con el artículo original para imagen y URL de fuente
    const matchedArticle = articlesByTitle.get(slugify(note.en.title))
    const article = matchedArticle || articles[created] || articles[0]

    const image = await pickArticleImage(article, note)
    const requestedSource = note.en.source || note.es.source || article.url || ''
    let sourceUrl = normalizeSourceUrl(requestedSource)
    if (sourceUrl) {
      const valid = await verifyUrl(sourceUrl)
      if (!valid) {
        console.log(`Broken source link (${sourceUrl}) -> using search fallback`)
        sourceUrl = buildSourceFallback(note.en.title)
      }
    } else {
      sourceUrl = buildSourceFallback(note.en.title)
    }

    const baseSlug = `${getDateStamp(created)}-${slugify(note.en.title)}`
    const common = {
      date: new Date().toISOString(),
      image,
      sourceUrl,
      category: 'Tourism',
    }

    // Escribir en filesystem (best-effort: funciona local, no en serverless)
    try {
      fs.mkdirSync(NOTES_DIR, { recursive: true })
      fs.writeFileSync(
        path.join(NOTES_DIR, `${baseSlug}.en.mdx`),
        buildNoteMdx({
          locale: 'en',
          title: note.en.title,
          summary: note.en.summary,
          tags: note.en.tags,
          body: note.en.body,
          ...common,
        })
      )
      fs.writeFileSync(
        path.join(NOTES_DIR, `${baseSlug}.es.mdx`),
        buildNoteMdx({
          locale: 'es',
          title: note.es.title,
          summary: note.es.summary,
          tags: note.es.tags,
          body: note.es.body,
          ...common,
        })
      )
    } catch (e) {
      console.warn('fs note write skipped (read-only filesystem?):', e.message)
    }

    // Persistir en Turso (autoritativo para el cron de Vercel)
    try {
      const { upsertNote } = require('./tursoNewsStore')
      await upsertNote({
        slug: baseSlug,
        locale: 'en',
        title: note.en.title,
        date: common.date,
        summary: note.en.summary,
        tags: note.en.tags,
        image,
        category: common.category,
        sourceUrl,
        body: note.en.body,
      })
      await upsertNote({
        slug: baseSlug,
        locale: 'es',
        title: note.es.title,
        date: common.date,
        summary: note.es.summary,
        tags: note.es.tags,
        image,
        category: common.category,
        sourceUrl,
        body: note.es.body,
      })
    } catch (e) {
      console.error('Turso note persistence failed:', e.message)
    }

    created += 1
    results.push(baseSlug)
    console.log(`Created note: ${baseSlug} (en + es)`)
  }

  const syncedState = loadSyncState()
  syncedState.lastSyncAt = new Date().toISOString()
  saveSyncState(syncedState)

  if (created === 0) {
    const seeded = seedFallbackNotes()
    if (seeded.created > 0) return { created: 0, seeded: seeded.created, results }
  }

  return { created, results }
}

module.exports = { generateNotes, seedFallbackNotes, buildNotePrompt, parseBatchNotes }

if (require.main === module) {
  const count = parseInt(process.argv[2] || '3', 10)
  console.log(`Generating up to ${count} bilingual tourism notes (single OpenRouter request)...`)
  generateNotes('en', count)
    .then((result) => console.log('Done:', JSON.stringify(result)))
    .catch((err) => {
      console.error('Error:', err)
      process.exit(1)
    })
}
