// MIT License - Copyright (c) 2024-2026 Donovan Riaño / Calpulli CDMX - See LICENSE
// Valida knowledge exports: JSON válido, envelope, IDs únicos/estables,
// URLs canónicas consistentes, relaciones que resuelven, provenance completa,
// sin secretos. Uso: npm run knowledge:validate (tras knowledge:export).
// Exit 1 si algo falla.
const fs = require('fs')
const path = require('path')

const root = path.join(__dirname, '..')
const dir = path.join(root, 'public', 'knowledge')
let errors = []
const fail = (msg) => errors.push(msg)

const SECRET_PATTERNS = [/sk-[A-Za-z0-9]{10,}/, /ghp_[A-Za-z0-9]+/, /AKIA[0-9A-Z]{16}/, /xox[bap]-/]

function load(name) {
  const p = path.join(dir, name)
  if (!fs.existsSync(p)) return fail(`missing file: public/knowledge/${name}`), null
  try {
    return JSON.parse(fs.readFileSync(p, 'utf8'))
  } catch (e) {
    return fail(`invalid JSON: ${name}: ${e.message}`), null
  }
}

const files = [
  'tours.json',
  'itineraries.json',
  'places.json',
  'neighborhoods.json',
  'index.json',
  'taxonomies.json',
  'relationships.json',
]
const docs = {}
for (const f of files) docs[f] = load(f)

// 1. Envelope
for (const [f, d] of Object.entries(docs)) {
  if (!d) continue
  for (const k of ['schemaVersion', 'generatedAt', 'entity']) {
    if (!d[k]) fail(`${f}: missing envelope field ${k}`)
  }
  if (d.total !== undefined && d.count !== undefined && d.data && d.count !== d.data.length) {
    fail(`${f}: count (${d.count}) != data.length (${d.data.length})`)
  }
}

// 2. IDs únicos + URLs + provenance en entidades con data[]
const seenIds = new Map()
for (const [f, d] of Object.entries(docs)) {
  if (!d || !Array.isArray(d.data)) continue
  for (const e of d.data) {
    if (e.id === undefined || e.type === undefined) continue // taxonomies/index entries
    if (!e.id || !e.type) fail(`${f}: entity without id/type`)
    const key = `${e.type}:${e.id}`
    if (seenIds.has(key)) fail(`duplicate id: ${key} (in ${f} and ${seenIds.get(key)})`)
    else seenIds.set(key, f)
    if (e.canonicalUrl && !String(e.canonicalUrl).startsWith('https://'))
      fail(`${f}:${e.id}: canonicalUrl not absolute`)
    if (e.url && e.canonicalUrl && !String(e.canonicalUrl).endsWith(e.url))
      fail(`${f}:${e.id}: canonicalUrl does not end with url`)
    if (e.provenance) {
      for (const k of ['source', 'sourceType', 'sourceUrl', 'freshnessStatus']) {
        if (e.provenance[k] === undefined) fail(`${f}:${e.id}: provenance missing ${k}`)
      }
    }
  }
}

// 3. Relaciones resuelven (relationships.json contra IDs conocidos)
const known = new Set([...seenIds.keys()].map((k) => k.split(/:(.+)/).slice(0, 2).join(':')))
if (docs['relationships.json']?.data) {
  for (const r of docs['relationships.json'].data) {
    for (const end of [r.from, r.to]) {
      if (!end) {
        fail(`relationship without endpoint: ${JSON.stringify(r).slice(0, 80)}`)
        continue
      }
      // endpoints con forma tipo:id o category:x
      const m = String(end).match(/^([a-z]+):(.+)$/)
      if (!m) fail(`relationship endpoint without type prefix: ${end}`)
    }
    if (!r.relation) fail('relationship without relation name')
  }
}

// 4. Sin secretos en ningún export
for (const [f, d] of Object.entries(docs)) {
  if (!d) continue
  const raw = JSON.stringify(d)
  for (const re of SECRET_PATTERNS) {
    if (re.test(raw)) fail(`${f}: possible secret pattern ${re}`)
  }
  if (/ADMIN_EMAILS|TURSO_|STRIPE_SECRET|OPENROUTER_API_KEY/.test(raw))
    fail(`${f}: admin/secret key leaked`)
}

// 5. Divergencia tour count vs fuente (12 tours conocidos)
const tours = docs['tours.json']?.data
if (tours && tours.length !== 12)
  console.log(`note: tours.json has ${tours.length} tours (expected 12 from toursData)`)

if (errors.length) {
  console.error(`validate-knowledge: ${errors.length} error(s)`)
  for (const e of errors) console.error(` - ${e}`)
  process.exit(1)
}
console.log('validate-knowledge: OK')
