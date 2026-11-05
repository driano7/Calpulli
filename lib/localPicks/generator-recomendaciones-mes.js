// MIT License - Copyright (c) 2024-2026 Donovan Riaño / Calpulli CDMX - See LICENSE
// Generador de "Recomendaciones del Mes" (Local Picks mensuales fijos)
// 1. Usa NewsAPI para obtener noticias de turismo/CDMX del mes
// 2. Usa OpenRouter para escribir un artículo bilingüe (es/en) con recomendaciones
// 3. SOBRESCRIBE data/local-picks/recomendaciones-mes-{es,en}.mdx (misma URL siempre)
// 4. Máximo 1 generación por mes y OpenRouter 15 req/día
const fs = require('fs')
const path = require('path')
const { callGemini, GEMINI_MODEL_PRO } = require('../gemini')

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
  // Migrado a Gemini Pro (antes OpenRouter). Mantiene el nombre por compatibilidad.
  let state = {}
  try {
    state = JSON.parse(fs.readFileSync(SYNC_STATE_FILE, 'utf8'))
  } catch {
    state = {}
  }
  const today = new Date().toISOString().slice(0, 10)
  if (state.openRouterUsageDate !== today) {
    state.openRouterUsageDate = today
    state.openRouterUsageCount = 0
  }
  if (state.openRouterUsageCount >= MAX_OPENROUTER_REQUESTS_PER_DAY) {
    throw new Error('Daily request limit reached')
  }
  state.openRouterUsageCount++
  fs.writeFileSync(SYNC_STATE_FILE, JSON.stringify(state, null, 2))

  return callGemini(prompt, { model: GEMINI_MODEL_PRO, maxTokens, temperature: 0.7 })
}

async function downloadImage(url, destPath) {
  try {
    fs.mkdirSync(path.dirname(destPath), { recursive: true })
    const res = await fetch(url, { headers: { 'User-Agent': 'Calpulli CDMX/1.0' } })
    if (!res.ok) return false
    const buf = Buffer.from(await res.arrayBuffer())
    if (buf.length < 5000 || buf.slice(0, 100).toString().includes('<html')) return false
    fs.writeFileSync(destPath, buf)
    return true
  } catch (e) {
    return false
  }
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

  // Nombres fijos (mismo slug cada mes): recomendaciones-mes-es.mdx y recomendaciones-mes-en.mdx
  const fileEs = path.join(RECS_DIR, 'recomendaciones-mes-es.mdx')
  const fileEn = path.join(RECS_DIR, 'recomendaciones-mes-en.mdx')

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
- Máximo 8 actividades concretas para hacer este mes en CDMX.
- Para cada actividad: nombre, qué es, dónde está (colonia), cuándo, horario, precio aproximado en pesos (gratis, $, $$, $$$), qué hacer, qué comer cerca, y por qué ir.
- VERACIDAD: no inventes festivales, ediciones, fechas ni recintos. Si no puedes confirmar un evento concreto, propone una actividad atemporal (museo, mercado, caminata, barrio, parque) SIN fecha exacta. Es mejor una recomendación segura que un evento falso.
- Incluye al menos: 1 actividad gratuita, 1 actividad para familia con niños, 1 actividad de fin de semana.
- No inventes direcciones exactas si no las conoces; usa zonas/colonias.
- Empieza DIRECTO con la actividad 1. No repitas el título, no escribas encabezado H1 ni una intro larga: la página ya tiene título e introducción.
- Formato: cada actividad con nombre, cuándo, lugar, descripción breve, precio y tip.
- Máximo 600 palabras.
- No digas "actualizado el día 1" ni menciones que es generado automáticamente.
- Escribe como si fuera una recomendación de un amigo chilango.`

  const promptEn = `You are a local editor of Mexico City. Write a short and practical guide "Activities of the Month in CDMX" for ${monthLabelEn}.

Reference info (recent news):
${newsContext}

Requirements:
- Write in ENGLISH, local Mexico City editor tone, colloquial but useful. Do not mix Spanish sentences; Spanish proper nouns are fine.
- Maximum 8 concrete activities to do this month in CDMX.
- For each activity: name, what it is, where it is (neighborhood), when, schedule, approximate price in pesos (free, $, $$, $$$), what to do, what to eat nearby, and why go.
- TRUTH: do not invent festivals, editions, dates or venues. If you cannot confirm a specific event, propose an evergreen activity (museum, market, walk, neighborhood, park) WITHOUT an exact date. A safe recommendation beats a fake event.
- Include at least: 1 free activity, 1 family-friendly activity with kids, 1 weekend activity.
- Don't invent exact addresses if you don't know them; use neighborhoods/zones.
- Start DIRECTLY with activity 1. Do not repeat the title, do not write an H1 or a long intro: the page already has a title and introduction.
- Format: each activity with name, when, location, short description, price and tip.
- Maximum 600 words.
- Don't say "updated on the 1st" or mention it's auto-generated.
- Write as if it's a recommendation from a local friend.`

  const contentEs = await callOpenRouter(promptEs)
  const contentEn = await callOpenRouter(promptEn)

  // Descargar imagen (misma ruta cada mes)
  const imagePath = path.join(LOCAL_IMAGES_DIR, 'recomendaciones-mes.jpg')
  const downloaded = await downloadImage(UNSPLASH_POOL[0], imagePath)
  const imagePathFinal = downloaded
    ? '/static/images/local-picks/recomendaciones-mes.jpg'
    : '/static/images/local-picks/cover.jpg'

  const now = new Date().toISOString()

  const mdxEs = `---
lang: es
slug: recomendaciones-mes
title: Actividades del Mes en CDMX — ${monthLabelEs}
festivity: recomendaciones-mes
pinned: true
pinnedOrder: 3
date: ${now}
tags: ['actividades del mes', 'mensual', 'cdmx', 'que hacer', '${MONTHS_ES[date.getMonth()]}']
draft: false
summary: Qué hacer en la Ciudad de México este ${
    MONTHS_ES[date.getMonth()]
  }, 8 actividades con fecha, lugar y precio, curadas por chilangos.
images: ['${imagePathFinal}']
neighborhood: CDMX
budget: '$$'
category: local-picks
isMonthlyGuide: false
month: '${monthStamp}'
---

# Actividades del Mes en CDMX — ${monthLabelEs}

Noviembre en la Ciudad de México trae el Día de Muertos, el aniversario de la Revolución y un clima perfecto para caminar. Aquí tienes 8 actividades con fecha, lugar y precio, recomendadas por quien vive aquí.

${contentEs}

> **Tip general:** Verifica horarios y precios antes de salir, ya que pueden cambiar sin previo aviso. Muchos museos ofrecen entrada gratuita los domingos para nacionales.
`

  const mdxEn = `---
lang: en
slug: recomendaciones-mes
title: Activities of the Month in CDMX — ${monthLabelEn}
festivity: recomendaciones-mes
pinned: true
pinnedOrder: 3
date: ${now}
tags: ['activities of the month', 'monthly', 'cdmx', 'what to do', '${MONTHS_EN[
    date.getMonth()
  ].toLowerCase()}']
draft: false
summary: What to do in Mexico City this ${
    MONTHS_EN[date.getMonth()]
  }, 8 activities with date, location and price, curated by locals.
images: ['${imagePathFinal}']
neighborhood: CDMX
budget: '$$'
category: local-picks
isMonthlyGuide: false
month: '${monthStamp}'
---

# Activities of the Month in CDMX — ${monthLabelEn}

November in Mexico City brings Day of the Dead, the Revolution anniversary and perfect weather for walking. Here are 8 activities with date, location and price, recommended by locals.

${contentEn}

> **General tip:** Check schedules and prices before heading out, as they can change without notice. Many museums offer free admission on Sundays for nationals.
`

  // Sobrescribir siempre (misma URL)
  fs.writeFileSync(fileEs, mdxEs)
  fs.writeFileSync(fileEn, mdxEn)

  // Actualizar sync state
  const state = JSON.parse(fs.readFileSync(SYNC_STATE_FILE, 'utf8'))
  state.localPicksLastGenerated = now
  state.localPicksMonth = monthStamp
  fs.writeFileSync(SYNC_STATE_FILE, JSON.stringify(state, null, 2))

  return {
    created: 2,
    files: [fileEs, fileEn],
    picks: [{ title: monthLabelEs }, { title: monthLabelEn }],
  }
}

module.exports = { generateRecommendationsMonth }
