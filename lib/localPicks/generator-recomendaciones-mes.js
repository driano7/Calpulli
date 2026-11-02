// MIT License - Copyright (c) 2024-2026 Donovan Riaño / Calpulli CDMX - See LICENSE
// Generador de "Recomendaciones del Mes" (Local Picks mensuales fijos)
// 1. Usa NewsAPI para obtener noticias de turismo/CDMX del mes
// 2. Usa OpenRouter para escribir un artículo bilingüe (es/en) con recomendaciones
// 3. Guarda un archivo .mdx por locale en data/local-picks/recomendaciones-mes-*.mdx
// 4. Máximo 1 generación por mes y OpenRouter 15 req/día
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

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY || ''
const OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions'
const OPENROUTER_MODEL = process.env.OPENROUTER_MODEL || 'nvidia/nemotron-3-super-120b-a12b:free'
const NEWS_API_KEY = process.env.NEWS_API_KEY || ''
const NEWS_BASE_URL = 'https://newsapi.org/v2/everything'
const MAX_OPENROUTER_REQUESTS_PER_DAY = 15

const RECS_DIR = path.join(process.cwd(), 'data', 'local-picks')
const SYNC_STATE_FILE = path.join(process.cwd(), 'data', 'local-picks-sync-state.json')
const LOCAL_IMAGES_DIR = path.join(process.cwd(), 'public', 'static', 'images', 'local-picks')
const UNSPLASH_POOL = [
  'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=800&q=80',
  'https://images.unsplash.com/photo-1487958449943-2429e8be8625?w=800&q=80',
  'https://images.unsplash.com/photo-1572116469696-31de0f17cc34?w=800&q=80',
  'https://images.unsplash.com/photo-1526772661822-98a872d3e7a6?w=800&q=80',
  'https://images.unsplash.com/photo-1513106580091-1d82408b8cd6?w=800&q=80',
]

const MONTHS_ES = [
  'enero',
  'febrero',
  'marzo',
  'abril',
  'mayo',
  'junio',
  'julio',
  'agosto',
  'septiembre',
  'octubre',
  'noviembre',
  'diciembre',
]
const MONTHS_EN = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
]

async function fetchNews() {
  if (!NEWS_API_KEY) return []
  const now = new Date()
  const from = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0]
  const to = now.toISOString().split('T')[0]
  const url = `${NEWS_BASE_URL}?q=Mexico%20City%20tourism%20OR%20CDMX%20things%20to%20do&from=${from}&to=${to}&language=en&sortBy=publishedAt&pageSize=10&apiKey=${NEWS_API_KEY}`
  try {
    const res = await fetch(url)
    if (!res.ok) return []
    const data = await res.json()
    return data.articles || []
  } catch (e) {
    console.error('[recomendaciones-mes] NewsAPI error:', e.message)
    return []
  }
}

async function callOpenRouter(prompt, maxTokens = 3000) {
  if (!OPENROUTER_API_KEY) throw new Error('OPENROUTER_API_KEY not set')
  const state = JSON.parse(fs.readFileSync(SYNC_STATE_FILE, 'utf8'))
  const today = new Date().toISOString().slice(0, 10)
  if (state.openRouterUsageDate !== today) {
    state.openRouterUsageDate = today
    state.openRouterUsageCount = 0
  }
  if (state.openRouterUsageCount >= MAX_OPENROUTER_REQUESTS_PER_DAY) {
    throw new Error('Daily OpenRouter limit reached')
  }
  state.openRouterUsageCount++
  fs.writeFileSync(SYNC_STATE_FILE, JSON.stringify(state, null, 2))

  const res = await fetch(OPENROUTER_URL, {
    method: 'POST',
    headers: { Authorization: `Bearer ${OPENROUTER_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: OPENROUTER_MODEL,
      messages: [{ role: 'user', content: prompt }],
      max_tokens: maxTokens,
      temperature: 0.7,
    }),
  })
  if (!res.ok) throw new Error(`OpenRouter error: ${res.status}`)
  const data = await res.json()
  return data.choices?.[0]?.message?.content || ''
}

async function downloadImage(url, destPath) {
  try {
    if (fs.existsSync(destPath)) return true
    fs.mkdirSync(path.dirname(destPath), { recursive: true })
    const res = await fetch(url, { headers: { 'User-Agent': 'Calpulli CDMX/1.0' } })
    if (!res.ok) throw new Error(`fetch ${res.status}`)
    const buf = Buffer.from(await res.arrayBuffer())
    if (buf.length < 5000 || buf.slice(0, 100).toString().includes('<html')) return false
    fs.writeFileSync(destPath, buf)
    return true
  } catch (e) {
    return false
  }
}

function slugify(text) {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim()
}

function monthKey() {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
}

function monthLabel(locale) {
  const now = new Date()
  const m = now.getMonth()
  const y = now.getFullYear()
  return locale === 'es' ? `${MONTHS_ES[m]} de ${y}` : `${MONTHS_EN[m]} ${y}`
}

async function generateRecommendationsMonth(date = new Date()) {
  const monthStamp = date.toISOString().slice(0, 7)
  const monthLabelEs = MONTHS_ES[date.getMonth()] + ' de ' + date.getFullYear()
  const monthLabelEn = MONTHS_EN[date.getMonth()] + ' ' + date.getFullYear()

  // Verificar si ya existe para este mes
  const slugEn = `recomendaciones-mes-${monthStamp}`
  const slugEs = `recomendaciones-mes-${monthStamp}`
  const fileEn = path.join(RECS_DIR, `${slugEn}-en.mdx`)
  const fileEs = path.join(RECS_DIR, `${slugEs}-es.mdx`)
  if (fs.existsSync(fileEn) && fs.existsSync(fileEs)) {
    console.log('[recomendaciones-mes] Ya existe para este mes')
    return { created: 0, reason: 'Ya existe para este mes' }
  }

  // Obtener noticias de NewsAPI
  const news = await fetchNews()
  const newsContext = news
    .map((a) => `- ${a.title}: ${a.description || ''} (${a.source.name})`)
    .join('\n')
  const newsPrompt = newsContext || 'No hay noticias recientes disponibles.'

  const promptEs = `Eres un editor local de Ciudad de México. Escribe una guía corta y práctica de "Actividades del Mes en CDMX" para el mes ${monthLabelEs}.

Información de referencia (noticias recientes):
${newsContext}

Requisitos:
- Escribe en ESPAÑOL, tono de chilango local, coloquial pero útil.
- Máximo 6-8 actividades concretas para hacer este mes en CDMX.
- Para cada actividad: nombre, qué es, dónde está (colonia), qué hacer, qué comer cerca, y por qué ir.
- No inventes direcciones exactas si no las conoces; usa zonas/colonias.
- Incluye precio aproximado (gratis, $, $$, $$$).
- Formato: título, intro corta, lista de actividades con los 4 campos, y una línea final tipo "Verifica horarios antes de ir."
- No uses formato markdown complejo, solo texto plano con encabezados simples.
- Máximo 400 palabras.
- No digas "actualizado el día 1" ni menciones que es generado automáticamente.
- Escribe como si fuera una recomendación de un amigo chilango.`

  const promptEn = promptEs
    .replace('ESPAÑOL', 'ENGLISH')
    .replace('chilango local', 'local Mexico City editor')
    .replace('Qué hacer este mes', 'What to do this month')

  const contentEs = await callOpenRouter(promptEs)
  const contentEn = await callOpenRouter(promptEn)

  // Descargar imagen
  const imagePath = path.join(LOCAL_IMAGES_DIR, `recomendaciones-mes-${monthStamp}.jpg`)
  const downloaded = await downloadImage(UNSPLASH_POOL[0], imagePath)
  const imagePathFinal = downloaded
    ? `/static/images/local-picks/recomendaciones-mes-${monthStamp}.jpg`
    : '/static/images/local-picks/cover.jpg'

  const now = new Date().toISOString()
  const frontMatter = {
    lang: 'es',
    slug: `recomendaciones-mes-${monthStamp}`,
    title: `Actividades del Mes en CDMX - ${monthLabelEs}`,
    festivity: 'recomendaciones-mes',
    pinned: true,
    pinnedOrder: 3,
    date: now,
    tags: ['actividades del mes', 'mensual', 'cdmx', 'que hacer'],
    draft: false,
    summary: 'Actividades del mes en Ciudad de México, curadas por chilangos.',
    images: [imagePathFinal],
    neighborhood: 'CDMX',
    budget: '$$',
    category: 'local-picks',
    isMonthlyGuide: false,
    month: monthStamp,
  }

  const mdxEn = `---
lang: en
slug: recomendaciones-mes-${monthStamp}
title: Activities of the Month in CDMX - ${monthLabelEn}
festivity: recomendaciones-mes
pinned: true
pinnedOrder: 3
date: ${now}
tags: ['activities of the month', 'monthly', 'cdmx', 'what to do']
draft: false
summary: Activities of the month in Mexico City, curated by locals.
images: ['${imagePathFinal}']
neighborhood: CDMX
budget: '$$'
category: local-picks
isMonthlyGuide: false
month: ${monthStamp}
---

# ${contentEn.split('\n')[0] || 'Activities of the Month in CDMX'}

${contentEn}
`

  const mdxEs = `---
lang: es
slug: recomendaciones-mes-${monthStamp}
title: Actividades del Mes en CDMX - ${monthLabelEs}
festivity: recomendaciones-mes
pinned: true
pinnedOrder: 3
date: ${now}
tags: ['actividades del mes', 'mensual', 'cdmx', 'que hacer']
draft: false
summary: Actividades del mes en Ciudad de México, curadas por chilangos.
images: ['${imagePathFinal}']
neighborhood: CDMX
budget: '$$'
category: local-picks
isMonthlyGuide: false
month: ${monthStamp}
---

# ${contentEs.split('\n')[0] || 'Actividades del Mes en CDMX'}

${contentEs}
`

  fs.writeFileSync(fileEn, mdxEn)
  fs.writeFileSync(fileEs, mdxEs)

  // Actualizar sync state
  const state = JSON.parse(fs.readFileSync(SYNC_STATE_FILE, 'utf8'))
  state.localPicksLastGenerated = now
  state.localPicksMonth = monthStamp
  fs.writeFileSync(SYNC_STATE_FILE, JSON.stringify(state, null, 2))

  return {
    created: 2,
    files: [fileEn, fileEs],
    picks: [{ title: monthLabelEs }, { title: monthLabelEn }],
  }
}

module.exports = { generateRecommendationsMonth }
