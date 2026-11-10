// MIT License - Copyright (c) 2024-2026 Donovan Riaño / Calpulli CDMX - See LICENSE
/**
 * Descarga de las fotografias verificadas de los Journeys y genera el archivo
 * de creditos de cada uno.
 *
 *   node scripts/commons-fetch.mjs [journey]
 *
 * El manifiesto (scripts/commons-manifest.json) es la lista de archivos de
 * Wikimedia Commons cuya ficha se reviso (que representa realmente el lugar
 * indicado, licencia compatible y atribucion disponible). La licencia y el
 * autor se leen de la propia API en el momento de la descarga, no se escriben
 * a mano: el CREDITS.md que se genera sale de los metadatos reales.
 *
 * Las imagenes se guardan en public/static/images/journeys/<journey>/ para
 * poder servirse con next/image (optimizadas y responsive) sin depender de un
 * host externo.
 */
import fs from 'node:fs'
import path from 'node:path'

const UA = 'CalpulliCDMXJourneyBuilder/1.0 (educational cultural site; local dev)'
const API = 'https://commons.wikimedia.org/w/api.php'
const MANIFEST_PATH = path.resolve('scripts/commons-manifest.json')

const strip = (v) =>
  String(v || '')
    .replace(/<[^>]*>/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#0?39;/g, "'")
    .replace(/\s+/g, ' ')
    .trim()

async function fetchInfo(titles) {
  const params = new URLSearchParams({
    action: 'query',
    titles: titles.join('|'),
    prop: 'imageinfo',
    iiprop: 'url|extmetadata|size',
    iiurlwidth: '1800',
    format: 'json',
  })
  const res = await fetch(`${API}?${params.toString()}`, { headers: { 'User-Agent': UA } })
  if (!res.ok) throw new Error(`API HTTP ${res.status}`)
  const data = await res.json()
  return Object.values(data?.query?.pages || {})
}

function creditsFor(title, entry) {
  const meta = entry.extmetadata || {}
  return {
    license: strip(meta.LicenseShortName?.value) || 'SIN LICENCIA',
    licenseUrl: strip(meta.LicenseUrl?.value) || '',
    author: strip(meta.Artist?.value) || 'Autor no indicado en Commons',
    description: strip(meta.ImageDescription?.value) || '',
    date: strip(meta.DateTimeOriginal?.value) || '',
    source: `https://commons.wikimedia.org/wiki/${encodeURIComponent(title.replace(/ /g, '_'))}`,
  }
}

const manifest = JSON.parse(fs.readFileSync(MANIFEST_PATH, 'utf8'))
const only = process.argv[2]
const journeys = only ? { [only]: manifest[only] } : manifest

if (!Object.keys(journeys).length) {
  console.error(`Journey desconocido: ${only}`)
  process.exit(1)
}

for (const [journey, { dest, items }] of Object.entries(journeys)) {
  const DEST = path.resolve(dest)
  fs.mkdirSync(DEST, { recursive: true })

  const credits = []
  const problems = []

  for (const item of items) {
    // Commons limita por caudal: se reintenta con espera creciente.
    let page = null
    for (let attempt = 1; attempt <= 4 && !page; attempt += 1) {
      try {
        await new Promise((r) => setTimeout(r, 1500 * attempt))
        const [found] = await fetchInfo([item.file])
        if (found && found.imageinfo) page = found
        else if (found) {
          problems.push(`${item.file}: sin imageinfo`)
          break
        }
      } catch (error) {
        console.error(`  consulta fallida ${item.file} (intento ${attempt}): ${error.message}`)
      }
    }
    if (!page) {
      problems.push(`${item.file}: no encontrada`)
      continue
    }

    const info = page.imageinfo[0]
    const meta = creditsFor(page.title, info)
    if (meta.license === 'SIN LICENCIA') {
      problems.push(`${item.file}: sin licencia declarada, no se descarga`)
      continue
    }

    const url = info.thumburl || info.url
    let res = await fetch(url, { headers: { 'User-Agent': UA } })
    if (!res.ok) {
      await new Promise((r) => setTimeout(r, 4000))
      res = await fetch(url, { headers: { 'User-Agent': UA } })
    }
    if (!res.ok) {
      problems.push(`${item.file}: descarga HTTP ${res.status}`)
      continue
    }

    const buffer = Buffer.from(await res.arrayBuffer())
    fs.writeFileSync(path.join(DEST, item.local), buffer)

    credits.push({
      file: item.local,
      place: item.place,
      commons: meta.source,
      license: meta.license,
      licenseUrl: meta.licenseUrl,
      author: meta.author,
      date: meta.date,
      description: meta.description,
    })
    console.log(`ok  ${journey}/${item.local}  ${meta.license}  ${(buffer.length / 1024).toFixed(0)} kB`)
  }

  const lines = [
    `# Créditos fotográficos — Journey ${journey}`,
    '',
    'Todas las imágenes de este Journey provienen de Wikimedia Commons y se',
    'redistribuyen localmente para poder servirse optimizadas con `next/image`.',
    'La licencia y el autor se leyeron de la ficha de Commons en el momento de la',
    'descarga (ver `scripts/commons-fetch.mjs` y `scripts/commons-manifest.json`).',
    '',
    '| Archivo local | Lugar | Licencia | Autor | Origen |',
    '| --- | --- | --- | --- | --- |',
    ...credits.map(
      (c) =>
        `| \`${c.file}\` | ${c.place} | ${c.license}${
          c.licenseUrl ? ` ([texto](${c.licenseUrl}))` : ''
        } | ${c.author} | [Commons](${c.commons}) |`
    ),
    '',
    '## Detalle por imagen',
    '',
    ...credits.flatMap((c) => [
      `### \`${c.file}\``,
      '',
      `- Lugar: ${c.place}`,
      `- Licencia: ${c.license}${c.licenseUrl ? ` — ${c.licenseUrl}` : ''}`,
      `- Autor: ${c.author}`,
      c.date ? `- Fecha: ${c.date}` : null,
      `- Ficha en Commons: ${c.commons}`,
      c.description ? `- Descripcion en Commons: ${c.description}` : null,
      '',
    ]),
  ].filter((l) => l !== null)

  fs.writeFileSync(path.join(DEST, 'CREDITS.md'), lines.join('\n'))
  console.log(`\n${credits.length} imagenes -> ${dest}`)
  if (problems.length) {
    console.log('Pendientes:')
    problems.forEach((p) => console.log(`  - ${p}`))
  }
  console.log('')
}
