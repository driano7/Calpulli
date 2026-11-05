// MIT License - Copyright (c) 2024-2026 Donovan Riaño / Calpulli CDMX - See LICENSE
// Pruebas de integración de Gemini en todos los generadores migrados.
// Correr: node scripts/test-gemini-integration.mjs
import fs from 'fs'
import path from 'path'
import { createRequire } from 'module'

const require = createRequire(import.meta.url)

// Cargar .env.local
const envPath = path.join(process.cwd(), '.env.local')
try {
  for (const line of fs.readFileSync(envPath, 'utf8').split('\n')) {
    const t = line.trim()
    if (!t || t.startsWith('#')) continue
    const i = t.indexOf('=')
    if (i === -1) continue
    const k = t.slice(0, i).trim()
    const v = t.slice(i + 1).trim().replace(/^["']|["']$/g, '')
    if (!(k in process.env)) process.env[k] = v
  }
} catch {}

let pass = 0
let fail = 0
function check(name, ok, detail = '') {
  if (ok) {
    pass++
    console.log(`  ✅ ${name}${detail ? ' — ' + detail : ''}`)
  } else {
    fail++
    console.log(`  ❌ ${name}${detail ? ' — ' + detail : ''}`)
  }
}

async function main() {
  console.log('\n=== 1. Módulo lib/gemini.js ===')
  const gemini = require('../lib/gemini.js')
  check('exporta callGemini', typeof gemini.callGemini === 'function')
  check('exporta GEMINI_MODEL_FLASH', typeof gemini.GEMINI_MODEL_FLASH === 'string', gemini.GEMINI_MODEL_FLASH)
  check('exporta GEMINI_MODEL_PRO', typeof gemini.GEMINI_MODEL_PRO === 'string', gemini.GEMINI_MODEL_PRO)

  console.log('\n=== 2. Generador recomendaciones-mes carga sin error ===')
  try {
    const rec = require('../lib/localPicks/generator-recomendaciones-mes.js')
    check('exporta generateRecommendationsMonth', typeof rec.generateRecommendationsMonth === 'function')
  } catch (e) {
    check('carga del módulo', false, e.message)
  }

  console.log('\n=== 3. Generador local picks carga sin error ===')
  try {
    const gen = require('../lib/localPicks/generator.js')
    check('exporta funciones', Object.keys(gen).length > 0, Object.keys(gen).join(', '))
  } catch (e) {
    check('carga del módulo', false, e.message)
  }

  console.log('\n=== 4. autoNewsGenerator carga sin error ===')
  try {
    const news = require('../lib/news-generators/autoNewsGenerator.js')
    check('exporta funciones', Object.keys(news).length > 0, Object.keys(news).join(', '))
  } catch (e) {
    check('carga del módulo', false, e.message)
  }

  console.log('\n=== 5. Llamada real a Gemini (flash-lite-latest) ===')
  try {
    const out = await gemini.callGemini('Responde solo: OK', { maxTokens: 20 })
    check('genera texto', out.trim().length > 0, `"${out.trim().slice(0, 40)}"`)
  } catch (e) {
    check('genera texto', false, e.message.slice(0, 120))
  }

  console.log('\n=== 6. No quedan referencias a OpenRouter activas ===')
  const files = [
    'lib/localPicks/generator.js',
    'lib/localPicks/generator-recomendaciones-mes.js',
    'lib/news-generators/autoNewsGenerator.js',
  ]
  for (const f of files) {
    const src = fs.readFileSync(path.join(process.cwd(), f), 'utf8')
    const hasFetch = /fetch\(\s*OPENROUTER_URL/.test(src)
    check(`${f} sin fetch a OpenRouter`, !hasFetch)
  }

  console.log(`\n=== RESULTADO: ${pass} pasaron, ${fail} fallaron ===\n`)
  process.exit(fail > 0 ? 1 : 0)
}

main()
