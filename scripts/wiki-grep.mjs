// MIT License - Copyright (c) 2024-2026 Donovan Riaño / Calpulli CDMX - See LICENSE
/**
 * Consulta dirigida a Wikipedia en español y devuelve solo las frases que
 * contienen los terminos buscados. Sirve para documentar el Journey del
 * Centro con citas comprobables sin volcar articulos enteros.
 *
 *   node scripts/wiki-grep.mjs "Titulo" "termino 1" "termino 2" ...
 */
const UA = 'CalpulliCDMXResearch/1.0 (educational cultural site; local dev)'

const title = process.argv[2]
const terms = process.argv.slice(3)

const params = new URLSearchParams({
  action: 'query',
  prop: 'extracts',
  explaintext: '1',
  titles: title,
  format: 'json',
  redirects: '1',
})

const res = await fetch(`https://es.wikipedia.org/w/api.php?${params.toString()}`, {
  headers: { 'User-Agent': UA },
})
const data = await res.json()
const page = Object.values(data.query.pages)[0]
const text = page.extract || ''

console.log(`[${title}] ${text.length} caracteres`)
if (!text.length) process.exit(0)

// Frases (segmentadas por punto) con longitud util.
const sentences = text
  .replace(/\n+/g, ' ')
  .split(/(?<=\.)\s+/)
  .map((s) => s.trim())
  .filter((s) => s.length > 45)

terms.forEach((term) => {
  const re = new RegExp(term, 'i')
  const hits = sentences.filter((s) => re.test(s)).slice(0, 2)
  if (hits.length) {
    console.log(`\n### ${term}`)
    hits.forEach((h) => console.log(`  - ${h.slice(0, 340)}`))
  }
})
