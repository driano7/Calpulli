// MIT License - Copyright (c) 2024-2026 Donovan Riaño / Calpulli CDMX - See LICENSE
// Automatic Local Picks generator (local-editor style)
// 1. Uses OpenRouter (Gemini/Groq fallback) to write a bilingual monthly guide
// 2. Saves one .mdx per locale in data/local-picks
// 3. Enforces 1 guide/month (2 files: en+es) and OpenRouter 15 req/day
const fs = require('fs')
const { saveLocalPicks, deleteLocalPicksOfMonth } = require('../localPicksTurso')
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
  } catch (e) {
    void e
  }
}
loadEnvFile()

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY || ''
const OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions'
const OPENROUTER_MODEL = process.env.OPENROUTER_MODEL || 'google/gemma-3-12b-it'
const MAX_OPENROUTER_REQUESTS_PER_DAY = 15

const LOCAL_PICKS_DIR = path.join(process.cwd(), 'data', 'local-picks')
const SYNC_STATE_FILE = path.join(process.cwd(), 'data', 'local-picks-sync-state.json')
const LOCAL_IMAGES_DIR = path.join(process.cwd(), 'public', 'static', 'images', 'local-picks')
const UNSPLASH_POOL = [
  'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=800&q=80',
  'https://images.unsplash.com/photo-1487958449943-2429e8be8625?w=800&q=80',
  'https://images.unsplash.com/photo-1572116469696-31de0f17cc34?w=800&q=80',
  'https://images.unsplash.com/photo-1526772661822-98a872d3e7a6?w=800&q=80',
  'https://images.unsplash.com/photo-1513106580091-1d82408b8cd6?w=800&q=80',
  'https://images.unsplash.com/photo-1533105079780-92b9be482077?w=800&q=80',
  'https://images.unsplash.com/photo-1501785888041-af3ef285b470?w=800&q=80',
  'https://images.unsplash.com/photo-1476514525535-07fb6b4ae8dd?w=800&q=80',
]

async function downloadImage(url, destPath) {
  try {
    if (fs.existsSync(destPath)) return true
    fs.mkdirSync(path.dirname(destPath), { recursive: true })
    const res = await fetch(url, { headers: { 'User-Agent': 'Calpulli CDMX/1.0' } })
    if (!res.ok) throw new Error(`fetch ${res.status}`)
    const buf = Buffer.from(await res.arrayBuffer())
    // Basic check: ensure it's an image (not HTML error page)
    if (buf.length < 5000 || buf.slice(0, 100).toString().includes('<html')) return false
    fs.writeFileSync(destPath, buf)
    return true
  } catch (e) {
    return false
  }
}

async function fetchIconicImage(query, destPath) {
  if (!query) return false
  // 1. Try Unsplash Source (no API key, hotlink allowed per guidelines)
  const unsplashUrl = `https://source.unsplash.com/800x600/?${encodeURIComponent(query)}`
  if (await downloadImage(unsplashUrl, destPath)) return true
  // 2. Secondary: Wikimedia Commons (copyright-free)
  try {
    const wikiApi = `https://commons.wikimedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(
      query
    )}&srnamespace=6&srlimit=1&format=json&origin=*`
    const res = await fetch(wikiApi)
    if (res.ok) {
      const data = await res.json()
      const title = data.query?.search?.[0]?.title
      if (title) {
        const fileName = title.replace(/^File:/, '')
        const wikiUrl = `https://commons.wikimedia.org/wiki/Special:FilePath/${encodeURIComponent(
          fileName
        )}?width=800`
        if (await downloadImage(wikiUrl, destPath)) return true
      }
    }
  } catch (e) {
    void e
  }
  return false
}

function todayKey() {
  return new Date().toISOString().slice(0, 10)
}
function monthKey(date = new Date()) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
}
function monthYearLabel(date = new Date(), locale = 'en') {
  const d = typeof date === 'string' ? new Date(`${date}-01T00:00:00`) : date
  return d.toLocaleDateString(locale === 'es' ? 'es-MX' : 'en-US', {
    month: 'long',
    year: 'numeric',
  })
}
function getMonthStamp(date = new Date()) {
  if (typeof date === 'string' && /^\d{4}-\d{2}$/.test(date)) return date
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
}

function loadSyncState() {
  try {
    if (fs.existsSync(SYNC_STATE_FILE)) return JSON.parse(fs.readFileSync(SYNC_STATE_FILE, 'utf8'))
  } catch (e) {
    void e
  }
  return {}
}
function saveSyncState(state) {
  try {
    fs.mkdirSync(path.dirname(SYNC_STATE_FILE), { recursive: true })
    fs.writeFileSync(SYNC_STATE_FILE, JSON.stringify(state, null, 2))
  } catch (e) {
    void e
  }
}
function getOpenRouterRemaining(state) {
  if (state.openRouterUsageDate !== todayKey()) return MAX_OPENROUTER_REQUESTS_PER_DAY
  return Math.max(0, MAX_OPENROUTER_REQUESTS_PER_DAY - (state.openRouterUsageCount || 0))
}

async function callOpenRouter(prompt, maxTokens = 4000) {
  if (!OPENROUTER_API_KEY) throw new Error('OPENROUTER_API_KEY not set')
  const state = loadSyncState()
  const remaining = getOpenRouterRemaining(state)
  if (remaining <= 0) throw new Error('Daily OpenRouter limit reached')
  const usageCount = state.openRouterUsageDate === todayKey() ? state.openRouterUsageCount || 0 : 0
  state.openRouterUsageDate = todayKey()
  state.openRouterUsageCount = usageCount + 1
  saveSyncState(state)

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

const LOCAL_PICKS_PROMPT = `Act as a Mexico City local editor, the kind who has watched the city for thirty years and still gets surprised by it.

This is the MONTHLY ROTATING part of "Local Picks". Write exactly 8 picks for THIS MONTH, in English and in Spanish.

Each pick is a small editorial piece, not a tip. Structure each body with these
four headings, in this order:

## Qué hacer
Two or three concrete things to actually do, with the practical detail that
makes them useful: which street, which hour, what to look for. No generic
attractions: if it is on every postcard, skip it.

## Qué comer
What to eat there, and why. Name the dish. Say what it tastes like and what to
order. If the place is not about food, say what to eat around it. Two or three
sentences.

## Entender a los mexicanos
One short paragraph about the local custom behind the place, in a way that
explains something a visitor would not have noticed on their own. It has to be
true and specific, and it must never reduce people to a stereotype. If there is
no real cultural layer here, say what the place means practically to the
neighbourhood instead.

## Para qué nos sirve en Amaxing
One or two sentences on why this belongs in a guide made by people who live
here, and what it tells a visitor about the city. Not a sales pitch.

Requirements:
- 8 picks exactly, covering the most important activities and events of the month in CDMX.
- Think like cdmxsecreta.com and alanxelmundo.com: real plans, seasonal events, markets, exhibitions, food festivals, cultural happenings.
- 90-130 words per body, per language. Concise.
- Write each section FIRST in English and THEN in Spanish. The Spanish version
  must read as if written in Spanish, not translated word for word.
- The tone is smart, close, evocative and precise. It is not a tourist
  brochure: no superlatives, no "must-see", no "unforgettable", no
  exclamation marks.
- Use only these neighborhoods: Roma, Condesa, Juarez, Centro Historico,
  Coyoacan, Polanco.
- Budget per pick: $ | $$ | $$$ .
- Be specific. Name real-sounding places and dates.
- If a place, a date or an opening hour cannot be verified, write it as a
  custom rather than as a fact, and add a short "verify before you go" line
  at the end of the body.

Prioritise: seasonal events, food markets, art exhibitions, concerts,
neighbourhood festivities, and things happening this specific month in CDMX.

OUTPUT FORMAT — use these exact delimiters, no extra markdown outside:

---PICK:1:EN---
title: [title in English, max 60 chars]
neighborhood: [Roma|Condesa|Juarez|Centro Historico|Coyoacan|Polanco]
budget: [$|$$|$$$]
tags: [3-4 tags comma separated]
imageQuery: [iconic photo search query, e.g., "Mercado de San Juan, Centro Historico, CDMX" — must be the most iconic view of that exact place]
body:
[## Qué hacer ... ## Qué comer ... ## Entender a los mexicanos ... ## Para qué nos sirve en Amaxing — 90-130 words, with the four headings in this order]

---PICK:1:ES---
title: [título en español, max 60 chars]
neighborhood: [mismo barrio]
budget: [$|$$|$$$]
tags: [3-4 etiquetas]
imageQuery: [misma query que EN, la más icónica de ese lugar]
body:
[las mismas cuatro secciones, en español natural, no traducción literal]

(Repeat for PICK:2 to PICK:8)

RULES:
- 8 picks exactly, no more, no less. One per numbered section above.
- Each body must have the four headings, in that order.
- Use only neighborhoods from the focus list.
- Include budget for each pick.
- Output clean Markdown ready to publish (the body is rendered as markdown).

Current month for the guide: {{MONTH_YEAR}}
`

function buildLocalPicksPrompt(date = new Date()) {
  const stamp = getMonthStamp(date)
  const monthYearEn = monthYearLabel(stamp, 'en')
  const monthYearEs = monthYearLabel(stamp, 'es')
  // Use English month year as canonical, Spanish will be derived but we show both
  return LOCAL_PICKS_PROMPT.replace('{{MONTH_YEAR}}', `${monthYearEn} / ${monthYearEs}`)
}

/**
 * Resumen de una linea para la tarjeta del listado.
 *
 * Se quitan los encabezados markdown (##), las marcas de emphasis y el
 * asterisco de la guia de idioma, para que en la tarjeta se lea como una
 * frase y no como un fragmento de documento.
 */
function cleanSummary(body) {
  const text = String(body || '')
    .replace(/^#{1,6}\s.*$/gm, '')
    .replace(/[*_`]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
  const cut = text.slice(0, 160)
  const lastSpace = cut.lastIndexOf(' ')
  return (lastSpace > 80 ? cut.slice(0, lastSpace) : cut).replace(/"/g, "'")
}

/**
 * Lee el frontmatter de un .mdx recien generado para enviarlo a Turso.
 * No hace falta la libreria de matter aqui: el bloque es simple.
 */
function frontMatterOf(mdx) {
  const match = String(mdx).match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/)
  if (!match) return { body: String(mdx) }
  const data = {}
  for (const line of match[1].split('\n')) {
    const kv = line.match(/^([a-zA-Z_]+):\s*(.*)$/)
    if (!kv) continue
    const key = kv[1]
    let value = kv[2]
      .trim()
      .replace(/^'(.*)'$/, '$1')
      .replace(/^"(.*)"$/, '$1')
    if (value.startsWith('[') && value.endsWith(']')) {
      value = value
        .slice(1, -1)
        .split(',')
        .map((v) =>
          v
            .trim()
            .replace(/^'(.*)'$/, '$1')
            .replace(/^"(.*)"$/, '$1')
        )
        .filter(Boolean)
    } else if (/^\d+$/.test(value)) {
      value = Number(value)
    } else if (value === 'true') value = true
    else if (value === 'false') value = false
    data[key] = value
  }
  return { ...data, body: match[2] }
}

function parsePicks(content) {
  const picks = []
  const regex = /---PICK:(\d+):(EN|ES)---\n([\s\S]*?)(?=---PICK:|$)/g
  let match
  const buffer = {}
  while ((match = regex.exec(content)) !== null) {
    const index = parseInt(match[1], 10)
    const locale = match[2].toLowerCase()
    const section = String(match[3] || '').trim()
    const lines = section.split('\n')
    let title = '',
      neighborhood = '',
      budget = '',
      tags = '',
      imageQuery = '',
      bodyLines = []
    let inBody = false
    for (const line of lines) {
      if (!inBody) {
        if (line.startsWith('title:')) title = line.replace('title:', '').trim()
        else if (line.startsWith('neighborhood:'))
          neighborhood = line.replace('neighborhood:', '').trim()
        else if (line.startsWith('budget:')) budget = line.replace('budget:', '').trim()
        else if (line.startsWith('tags:')) tags = line.replace('tags:', '').trim()
        else if (line.startsWith('imageQuery:')) imageQuery = line.replace('imageQuery:', '').trim()
        else if (line.startsWith('body:')) inBody = true
      } else {
        bodyLines.push(line)
      }
    }
    const body = bodyLines.join('\n').trim()
    if (!buffer[index]) buffer[index] = {}
    buffer[index][locale] = {
      title,
      neighborhood,
      budget,
      tags: tags
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean),
      imageQuery,
      body,
    }
  }
  for (let i = 1; i <= 8; i++) {
    if (buffer[i]?.en && buffer[i]?.es) picks.push({ index: i, en: buffer[i].en, es: buffer[i].es })
  }
  return picks
}

function buildLocalPicksMdx({ locale, monthStamp, pick, index, total }) {
  const isEs = locale === 'es'
  const data = isEs ? pick.es : pick.en
  const otherLocale = isEs ? 'en' : 'es'
  const other = isEs ? pick.en : pick.es
  const localImage = `/static/images/local-picks/${monthStamp}-${String(index).padStart(
    2,
    '0'
  )}.jpg`
  // Keep frontmatter minimal, body is the pick's body
  return `---
lang: ${locale}
title: "${(data.title || '').replace(/"/g, '\\"')}"
date: '${new Date().toISOString().slice(0, 10)}'
tags: [${data.tags.map((t) => `'${t.replace(/'/g, "\\'")}'`).join(', ')}]
draft: false
summary: "${cleanSummary(data.body || '')}"
images: ['${localImage}']
neighborhood: '${data.neighborhood}'
budget: '${data.budget}'
category: 'local-picks'
month: '${monthStamp}'
pickIndex: ${index}
totalPicks: ${total}
---

${
  !isEs
    ? `Si deseas ver este contenido en *español* 🇲🇽, clickea [aquí](/local/${monthStamp}-${String(
        index
      ).padStart(2, '0')}-es).`
    : `If you want to see this content in *English* 🇺🇸, click [here](/local/${monthStamp}-${String(
        index
      ).padStart(2, '0')}-en).`
}

${data.body}

---

*Local Picks ${monthStamp} — ${
    isEs ? 'También disponible en' : 'Also available in'
  } ${otherLocale.toUpperCase()}: **${other.title}** · ${data.neighborhood} · ${escapeMdx(
    data.budget
  )}*
`
}

/**
 * Escapa los caracteres que MDX interpreta como marcado.
 *
 * El presupuesto de un pick se escribe con signos de peso ("$", "$$").
 * Sin escapar, MDX los toma como apertura de formula matematica y la pagina
 * se renderiza con el precio roto o con un error de compilacion.
 */
function escapeMdx(text) {
  return String(text == null ? '' : text).replace(/([$])/g, '\\$1')
}

function buildMonthlyGuideMdx({ locale, monthStamp, picks }) {
  const isEs = locale === 'es'
  const monthLabel = monthYearLabel(new Date(monthStamp + '-01'), locale)
  const title = isEs ? `Local Picks - ${monthLabel}` : `Local Picks - ${monthLabel}`
  const summary = isEs
    ? `Selección local de ${monthLabel}: restaurantes, cafés, bares, joyas ocultas y eventos que recomiendan los chilangos este mes.`
    : `Local selection for ${monthLabel}: restaurants, coffee shops, bars, hidden gems and events locals recommend this month.`
  let body = `# ${title}\n\n${
    isEs
      ? 'Guía mensual para visitantes que se quedan 2-7 días. Selección curada por editores locales, evitando lo genérico.'
      : 'Monthly guide for visitors staying 2-7 days. Curated by local editors, avoiding the generic.'
  }\n\n`
  picks.forEach((pick, idx) => {
    const data = isEs ? pick.es : pick.en
    body += `## ${idx + 1}. ${data.title}\n\n**${data.neighborhood} · ${
      data.budget
    }** · *${data.tags.join(', ')}*\n\n${data.body}\n\n`
  })
  body += `\n---\n\n*${
    isEs
      ? 'Guía bilingüe: cada sección está escrita primero en inglés y luego en español en los archivos individuales.'
      : 'Bilingual guide: each section is written first in English and then in Spanish in individual files.'
  }*`
  const guideImage = `/static/images/local-picks/${monthStamp}-guide.jpg`
  return `---
lang: ${locale}
title: "${title}"
date: '${monthStamp}-01'
tags: ['local-picks', 'CDMX', '${monthStamp}']
draft: false
summary: "${summary}"
images: ['${guideImage}']
category: 'local-picks'
month: '${monthStamp}'
isMonthlyGuide: true
---

${body}
`
}

/**
 * Poda los picks rotados que ya quedaron fuera de la ventana.
 *
 * El listado muestra 6 rotados (3 del mes actual + 3 del anterior). Los
 * archivos viejos se pueden borrar, pero NO se tocan los fijados: las
 * festividades se quedan siempre.
 */
function pruneOldPicks(keepMonths = 3) {
  if (!fs.existsSync(LOCAL_PICKS_DIR)) return []
  const files = fs.readdirSync(LOCAL_PICKS_DIR)
  const months = new Set()
  for (const file of files) {
    const m = file.match(/^(\d{4}-\d{2})-\d{2}-(en|es)\.mdx$/)
    if (m) months.add(m[1])
  }
  const ordered = [...months].sort().reverse()
  const stale = new Set(ordered.slice(keepMonths))
  const removed = []
  for (const file of files) {
    const m = file.match(/^(\d{4}-\d{2})-\d{2}-(en|es)\.mdx$/)
    if (m && stale.has(m[1])) {
      fs.unlinkSync(path.join(LOCAL_PICKS_DIR, file))
      removed.push(file)
    }
  }
  return removed
}

async function generateLocalPicks(date = new Date()) {
  const monthStamp = getMonthStamp(date)
  // Check if already generated this month
  if (fs.existsSync(LOCAL_PICKS_DIR)) {
    const existing = fs.readdirSync(LOCAL_PICKS_DIR).filter((f) => f.startsWith(monthStamp))
    if (existing.length >= 2) {
      const pruned = pruneOldPicks()
      return {
        created: 0,
        reason: `Local Picks for ${monthStamp} already exists`,
        files: existing,
        pruned,
      }
    }
  }

  const prompt = buildLocalPicksPrompt(date)
  const content = await callOpenRouter(prompt, 5000)
  const picks = parsePicks(content)

  if (picks.length < 8) {
    throw new Error(`Expected 8 picks, got ${picks.length}. Raw: ${content.slice(0, 500)}`)
  }

  if (!fs.existsSync(LOCAL_PICKS_DIR)) fs.mkdirSync(LOCAL_PICKS_DIR, { recursive: true })

  const created = []
  // Save individual pick files (for detail pages) + download local image per pick
  for (const pick of picks) {
    const idx = String(pick.index).padStart(2, '0')
    const slugEn = `${monthStamp}-${idx}-en`
    const slugEs = `${monthStamp}-${idx}-es`
    const enMdx = buildLocalPicksMdx({
      locale: 'en',
      monthStamp,
      pick,
      index: pick.index,
      total: picks.length,
    })
    const esMdx = buildLocalPicksMdx({
      locale: 'es',
      monthStamp,
      pick,
      index: pick.index,
      total: picks.length,
    })
    // En produccion (Vercel) el disco de la funcion es de solo lectura:
    // el .mdx es la semilla y el almacen de verdad es Turso.
    try {
      fs.writeFileSync(path.join(LOCAL_PICKS_DIR, `${slugEn}.mdx`), enMdx)
      fs.writeFileSync(path.join(LOCAL_PICKS_DIR, `${slugEs}.mdx`), esMdx)
    } catch (error) {
      console.warn('[local-picks] no se pudo escribir el .mdx en disco:', error.message)
    }
    await saveLocalPicks([
      { ...frontMatterOf(enMdx), slug: slugEn.replace(/-en$/, ''), lang: 'en' },
      { ...frontMatterOf(esMdx), slug: slugEs.replace(/-es$/, ''), lang: 'es' },
    ])
    created.push(`${slugEn}.mdx`, `${slugEs}.mdx`)

    // Download most iconic photo for this pick (shared en/es) — tries Unsplash with imageQuery, then Wikimedia, then pool fallback
    const localImagePath = path.join(LOCAL_IMAGES_DIR, `${monthStamp}-${idx}.jpg`)
    const query = (
      pick.en?.imageQuery ||
      pick.es?.imageQuery ||
      pick.en?.title ||
      pick.es?.title ||
      ''
    ).trim()
    let downloaded = false
    if (query) downloaded = await fetchIconicImage(query, localImagePath)
    if (!downloaded) {
      const fallbackUrl = UNSPLASH_POOL[(pick.index - 1) % UNSPLASH_POOL.length]
      downloaded = await downloadImage(fallbackUrl, localImagePath)
    }
    // If still not downloaded, leave placeholder (will use cover.jpg fallback in frontmatter if needed)
  }

  // Also save monthly guide compilation (reuse first pick image for guide)
  const guideEn = buildMonthlyGuideMdx({ locale: 'en', monthStamp, picks })
  const guideEs = buildMonthlyGuideMdx({ locale: 'es', monthStamp, picks })
  fs.writeFileSync(path.join(LOCAL_PICKS_DIR, `${monthStamp}-guide-en.mdx`), guideEn)
  fs.writeFileSync(path.join(LOCAL_PICKS_DIR, `${monthStamp}-guide-es.mdx`), guideEs)
  created.push(`${monthStamp}-guide-en.mdx`, `${monthStamp}-guide-es.mdx`)
  // Guide cover uses same first pick image
  const guideImageUrl = UNSPLASH_POOL[0]
  const guideImagePath = path.join(LOCAL_IMAGES_DIR, `${monthStamp}-guide.jpg`)
  await downloadImage(guideImageUrl, guideImagePath)

  // Update sync state
  const state = loadSyncState()
  state.localPicksLastGenerated = new Date().toISOString()
  state.localPicksMonth = monthStamp
  saveSyncState(state)

  return { created: created.length, files: created, picks }
}

module.exports = { generateLocalPicks, buildLocalPicksPrompt, parsePicks, monthKey: getMonthStamp }
