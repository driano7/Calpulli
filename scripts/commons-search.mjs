// MIT License - Copyright (c) 2024-2026 Donovan Riaño / Calpulli CDMX - See LICENSE
/**
 * Busca archivos en Wikimedia Commons por nombre/texto y muestra licencia.
 *
 *   node scripts/commons-search.mjs "<consulta>" [limite]
 *
 * Pensado para cuando una foto concreta esta nombrada de forma distinta en
 * Commons que en el guion editorial: hay que leer la descripcion de cada
 * candidata para confirmar que de verdad es el lugar indicado y no otro
 * homonimo.
 */
const UA = 'CalpulliCDMXJourneyBuilder/1.0 (educational cultural site; local dev)'
const API = 'https://commons.wikimedia.org/w/api.php'

const term = process.argv[2]
const limit = Number(process.argv[3] || 8)
if (!term) {
  console.error('uso: node scripts/commons-search.mjs "<consulta>" [limite]')
  process.exit(1)
}

const params = new URLSearchParams({
  action: 'query',
  list: 'search',
  srsearch: term,
  srnamespace: '6',
  srlimit: String(limit),
  format: 'json',
})

const res = await fetch(`${API}?${params.toString()}`, { headers: { 'User-Agent': UA } })
const data = await res.json()
const titles = (data?.query?.search || []).map((r) => r.title)

if (!titles.length) {
  console.log(`sin resultados para: ${term}`)
  process.exit(0)
}

const info = new URLSearchParams({
  action: 'query',
  titles: titles.join('|'),
  prop: 'imageinfo',
  iiprop: 'url|extmetadata|size',
  iiurlwidth: '1600',
  format: 'json',
})
const res2 = await fetch(`${API}?${info.toString()}`, { headers: { 'User-Agent': UA } })
const data2 = await res2.json()

const strip = (v) =>
  String(v || '')
    .replace(/<[^>]*>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()

for (const page of Object.values(data2?.query?.pages || {})) {
  const i = page.imageinfo?.[0] || {}
  const m = i.extmetadata || {}
  console.log('---')
  console.log('titulo :', page.title)
  console.log('lic    :', strip(m.LicenseShortName?.value) || 'SIN LICENCIA')
  console.log('autor  :', (strip(m.Artist?.value) || '').slice(0, 70))
  console.log('desc   :', (strip(m.ImageDescription?.value) || '').slice(0, 170))
  console.log('tam    :', `${i.width}x${i.height}`)
}
