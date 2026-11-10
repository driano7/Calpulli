// MIT License - Copyright (c) 2024-2026 Donovan Riaño / Calpulli CDMX - See LICENSE
/**
 * Consulta Wikimedia Commons y guarda los metadatos de licencia y atribucion
 * de las imagenes candidatas de los Journeys.
 *
 *   node scripts/commons-images.mjs "<consulta>" [<consulta> ...]
 *
 * Salida: scripts/commons-candidates.json
 *
 * No descarga las imagenes ni decide nada: solo deja constancia de la ficha
 * (licencia, autor, descripcion y pagina de origen) para poder citarla.
 */
import fs from 'node:fs'
import path from 'node:path'

const UA = 'CalpulliCDMXJourneyBuilder/1.0 (educational cultural site; local dev)'
const API = 'https://commons.wikimedia.org/w/api.php'
const OUT = path.resolve('scripts/commons-candidates.json')

function stripHtml(value) {
  return String(value || '')
    .replace(/<[^>]*>/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .replace(/\s+/g, ' ')
    .trim()
}

async function search(term, limit = 6) {
  const params = new URLSearchParams({
    action: 'query',
    generator: 'search',
    gsrsearch: `filetype:bitmap ${term}`,
    gsrnamespace: '6',
    gsrlimit: String(limit),
    prop: 'imageinfo',
    iiprop: 'url|extmetadata|size',
    iiurlwidth: '1600',
    format: 'json',
  })

  const res = await fetch(`${API}?${params.toString()}`, { headers: { 'User-Agent': UA } })
  if (!res.ok) throw new Error(`${term}: HTTP ${res.status}`)
  const data = await res.json()
  const pages = data?.query?.pages || {}

  return Object.values(pages)
    .map((page) => {
      const info = page.imageinfo?.[0] || {}
      const meta = info.extmetadata || {}
      return {
        title: page.title,
        pageUrl: `https://commons.wikimedia.org/wiki/${encodeURIComponent(
          page.title.replace(/ /g, '_')
        )}`,
        license: stripHtml(meta.LicenseShortName?.value) || null,
        licenseUrl: stripHtml(meta.LicenseUrl?.value) || null,
        author: stripHtml(meta.Artist?.value) || null,
        credit: stripHtml(meta.Credit?.value) || null,
        description: stripHtml(meta.ImageDescription?.value) || null,
        date: stripHtml(meta.DateTimeOriginal?.value) || null,
        width: info.width || null,
        height: info.height || null,
        thumbUrl: info.thumburl || info.url || null,
      }
    })
    .sort((a, b) => (b.width || 0) - (a.width || 0))
}

const terms = process.argv.slice(2)
if (!terms.length) {
  console.error('uso: node scripts/commons-images.mjs "<consulta>" [...]')
  process.exit(1)
}

const result = {}
for (const term of terms) {
  try {
    const items = await search(term)
    result[term] = items
    console.log(`\n### ${term}  (${items.length})`)
    items.forEach((item) => {
      console.log(
        `  ${item.license || 'SIN LICENCIA'} | ${item.width}x${item.height} | ${item.title}`
      )
      console.log(`     ${item.description || '(sin descripcion)'}`)
    })
  } catch (error) {
    result[term] = { error: error.message }
    console.error(`\n### ${term}  ERROR: ${error.message}`)
  }
}

const previous = fs.existsSync(OUT) ? JSON.parse(fs.readFileSync(OUT, 'utf8')) : {}
fs.writeFileSync(OUT, JSON.stringify({ ...previous, ...result }, null, 2))
console.log(`\n-> ${path.relative(process.cwd(), OUT)}`)
