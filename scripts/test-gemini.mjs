// MIT License - Copyright (c) 2024-2026 Donovan Riaño / Calpulli CDMX - See LICENSE
// Prueba rápida de Gemini: lista modelos, genera con Flash y con Pro.
// Correr: node scripts/test-gemini.mjs
import fs from 'fs'
import path from 'path'

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

// La key se lee de env (.env.local, GEMINI_API_KEY / GEMINI_KEY).
const KEY = process.env.GEMINI_API_KEY || process.env.GEMINI_KEY || ''
const PROJECT = (process.env.GEMINI_PROJECT || process.env.PROJECT || '').replace(/^projects\//, '')
const FLASH = process.env.GEMINI_MODEL_FLASH || 'gemini-flash-lite-latest'
const PRO = process.env.GEMINI_MODEL_PRO || 'gemini-flash-lite-latest'

if (!KEY) {
  console.error('❌ Falta GEMINI_API_KEY/GEMINI_KEY en .env.local')
  process.exit(1)
}

async function gen(model) {
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${KEY}`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(PROJECT ? { 'x-goog-user-project': PROJECT } : {}),
      },
      body: JSON.stringify({
        contents: [{ parts: [{ text: 'Escribe una frase corta sobre la Ciudad de México.' }] }],
        generationConfig: { maxOutputTokens: 200, temperature: 0.7 },
      }),
    }
  )
  if (!res.ok) {
    const body = await res.text().catch(() => '')
    throw new Error(`${res.status} ${body.slice(0, 200)}`)
  }
  const json = await res.json()
  const parts = json.candidates?.[0]?.content?.parts || []
  const text = parts.find((p) => !p.thought)?.text || parts[0]?.text || ''
  return text.trim()
}

async function main() {
  console.log(`Proyecto: ${PROJECT || '(no definido)'}`)
  console.log(`Flash: ${FLASH}`)
  console.log(`Pro:   ${PRO}\n`)

  for (const model of [FLASH, PRO]) {
    process.stdout.write(`▶ ${model}... `)
    try {
      const out = await gen(model)
      console.log('✅ OK')
      console.log(`   "${out.slice(0, 120)}"\n`)
    } catch (e) {
      console.log('❌ FALLÓ')
      console.log(`   ${e.message}\n`)
    }
  }
}

main()
